import { Capacitor } from '@capacitor/core'
import { Geolocation } from '@capacitor/geolocation'
import { LocalNotifications } from '@capacitor/local-notifications'

// Espera máxima para que el plugin nativo confirme que liberó el watch.
const CLEAR_WATCH_TIMEOUT_MS = 2000
// Como mucho una notificación de error de GPS por minuto.
const ERROR_NOTIFICATION_INTERVAL_MS = 60 * 1000

// Una lectura del watch compartido con menos de esto vale como actual.
const SHARED_FIX_MAX_AGE_MS = 15 * 1000
// En un watch, el timeout es la espera máxima entre posiciones. Con 10 s, bajo
// techo o con poca señal el plugin de iOS da por muerto el watch y la grabación
// deja de recibir puntos para siempre.
const WATCH_TIMEOUT_MS = 5 * 60 * 1000
// Errores tras los que el plugin de iOS deja de mandar posiciones sin avisar:
// al vencer el timeout descarta los watches (0010) y tras "ubicación no
// disponible" (0002, frecuente bajo techo o al arrancar el GPS) su flujo interno
// se completa y no se reconecta. Solo se recuperan cerrando y reabriendo el watch.
const RECOVERABLE_ERROR_CODES = new Set(['OS-PLUG-GLOC-0002', 'OS-PLUG-GLOC-0010'])
// Espera antes de reabrir; se duplica si el error se repite, hasta el tope.
const WATCH_RESTART_DELAY_MS = 2000
const WATCH_RESTART_MAX_DELAY_MS = 30 * 1000

class LocationService {
  constructor() {
    this.isNative = Capacitor.isNativePlatform()
    this.watchId = null
    this.backgroundTaskId = null
    this.isTracking = false
    // Se incrementa en cada stop: un start que seguía esperando permisos sabe
    // que ya lo cancelaron y no deja un watch huérfano.
    this.session = 0
    this.lastErrorNotifiedAt = 0
    // Última posición obtenida por cualquier pantalla (mapa de spots, detalle,
    // grabar...). Sirve para mostrar algo al instante en lugar de esperar al GPS.
    this.lastPosition = null
    // Un solo watch del GPS repartido entre las pantallas que lo piden: el mapa
    // de Spots queda vivo (KeepAlive) con el suyo abierto mientras se graba o se
    // sigue una ruta, y con un único suscriptor esas pantallas no recibían nada.
    this.subscribers = new Set()
    this.restartingWatch = false
    this.restartDelayMs = WATCH_RESTART_DELAY_MS
  }

  emit(position) {
    const p = this.remember(position)
    this.restartDelayMs = WATCH_RESTART_DELAY_MS
    this.subscribers.forEach((callback) => callback(p))
  }

  remember(position) {
    this.lastPosition = position
    return position
  }

  /** Última posición conocida si no es más vieja que `maxAgeMs`; si no, null. */
  getLastKnownPosition(maxAgeMs) {
    const last = this.lastPosition
    if (!last) return null
    return Date.now() - (last.timestamp ?? 0) <= maxAgeMs ? last : null
  }

  async requestPermissions() {
    if (this.isNative) {
      try {
        const locationPermission = await Geolocation.requestPermissions()

        // Las notificaciones son opcionales: negarlas no debe impedir grabar.
        try {
          await LocalNotifications.requestPermissions()
        } catch (error) {
          console.warn('No se pudo pedir permiso de notificaciones', error)
        }

        return locationPermission.location === 'granted'

      } catch (error) {
        console.error('Error requesting permissions:', error)
        return false
      }
    } else {
      try {
        const result = await navigator.permissions.query({ name: 'geolocation' })
        return result.state === 'granted' || result.state === 'prompt'
      } catch {
        return true
      }
    }
  }

  async checkPermissions() {
    if (this.isNative) {
      try {
        const result = await Geolocation.checkPermissions()
        return result.location === 'granted'
      } catch (error) {
        console.error('Error checking permissions:', error)
        return false
      }
    } else {
      try {
        const result = await navigator.permissions.query({ name: 'geolocation' })
        return result.state === 'granted'
      } catch {
        return false
      }
    }
  }

  /**
   * Suscribe `callback` a las posiciones del GPS. Si el watch ya está abierto,
   * se comparte (y recibe enseguida la última lectura si es reciente). Las
   * opciones solo aplican a quien abre el watch.
   */
  async startTracking(callback, options = {}) {
    this.subscribers.add(callback)
    if (this.isTracking) {
      const recent = this.getLastKnownPosition(SHARED_FIX_MAX_AGE_MS)
      if (recent) callback(recent)
      return
    }

    this.isTracking = true
    const session = this.session

    try {
      const hasPermissions = await this.checkPermissions()
      if (!hasPermissions) {
        const granted = await this.requestPermissions()
        if (!granted) {
          throw new Error('Location permissions not granted')
        }
      }
    } catch (error) {
      this.subscribers.delete(callback)
      if (session === this.session) this.isTracking = false
      throw error
    }

    // Se finalizó (o se salió de la vista) mientras se resolvían los permisos.
    if (session !== this.session) return

    const defaultOptions = {
      enableHighAccuracy: true,
      timeout: WATCH_TIMEOUT_MS,
      maximumAge: 0,
    }

    const trackingOptions = { ...defaultOptions, ...options }

    if (this.isNative) {
      await this.startNativeTracking(trackingOptions)
    } else {
      this.startWebTracking(trackingOptions)
    }

    // Lo detuvieron mientras se registraba el watch nativo.
    if (session !== this.session) {
      const orphan = this.watchId
      this.watchId = null
      this.clearWatch(orphan)
    }
  }

  async startNativeTracking(options) {
    try {
      // Sin @capacitor/background-task el seguimiento se detiene al pasar
      // la app a segundo plano.
      this.watchId = await Geolocation.watchPosition(options, (position, err) => {
        if (err) {
          console.error('Geolocation error:', err)
          if (RECOVERABLE_ERROR_CODES.has(err.code) && this.isTracking && this.subscribers.size > 0) {
            this.restartNativeWatch(options)
            return
          }
          this.handleTrackingError(err)
          return
        }

        if (position) {
          this.emit({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            altitude: position.coords.altitude ?? null,
            altitudeAccuracy: position.coords.altitudeAccuracy ?? null,
            speed: position.coords.speed ?? null,
            heading: position.coords.heading ?? null,
            timestamp: position.timestamp,
          })
        }
      })

    } catch (error) {
      console.error('Error starting native tracking:', error)
      this.isTracking = false
      throw error
    }
  }

  // Cierra y reabre el watch nativo para que el plugin vuelva a mandar posiciones.
  async restartNativeWatch(options) {
    if (this.restartingWatch) return
    this.restartingWatch = true
    const session = this.session
    const staleWatch = this.watchId
    this.watchId = null
    const delay = this.restartDelayMs
    this.restartDelayMs = Math.min(delay * 2, WATCH_RESTART_MAX_DELAY_MS)
    try {
      await this.clearWatch(staleWatch)
      await new Promise((resolve) => setTimeout(resolve, delay))
      if (session === this.session && this.subscribers.size > 0) {
        await this.startNativeTracking(options)
      }
    } catch (error) {
      this.handleTrackingError(error)
    } finally {
      this.restartingWatch = false
    }
  }

  startWebTracking(options) {
    try {
      this.watchId = navigator.geolocation.watchPosition(
        (position) => {
          this.emit({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            altitude: position.coords.altitude ?? null,
            altitudeAccuracy: position.coords.altitudeAccuracy ?? null,
            speed: position.coords.speed ?? null,
            heading: position.coords.heading ?? null,
            timestamp: position.timestamp,
          })
        },
        (error) => {
          console.error('Web geolocation error:', error)
          this.handleTrackingError(error)
        },
        options
      )

    } catch (error) {
      console.error('Error starting web tracking:', error)
      this.isTracking = false
      throw error
    }
  }

  /**
   * Da de baja a `callback`; el watch se cierra cuando ya nadie lo usa (sin
   * argumento se cierra para todos). No bloquea a quien lo llama: el estado se
   * limpia de inmediato y la liberación del watch nativo tiene un tope de espera.
   */
  async stopTracking(callback) {
    if (callback) this.subscribers.delete(callback)
    else this.subscribers.clear()
    if (this.subscribers.size > 0) return

    this.session += 1
    const watchId = this.watchId
    this.watchId = null
    this.backgroundTaskId = null
    this.isTracking = false

    await this.clearWatch(watchId)
  }

  async clearWatch(watchId) {
    if (watchId == null) return

    try {
      if (this.isNative) {
        await Promise.race([
          Geolocation.clearWatch({ id: watchId }),
          new Promise((resolve) => setTimeout(resolve, CLEAR_WATCH_TIMEOUT_MS)),
        ])
      } else {
        navigator.geolocation.clearWatch(watchId)
      }
    } catch (error) {
      console.error('Error stopping tracking:', error)
    }
  }

  async getCurrentPosition(options = {}) {
    const defaultOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    }

    let positionOptions = { ...defaultOptions, ...options }
    // Lo que espera quien llama, aunque al plugin se le pida otro timeout.
    const callerTimeout = positionOptions.timeout

    // Con un watch abierto, el plugin de iOS comparte con él un solo GPS: cada
    // lectura suelta le cambia la precisión y le reinicia el temporizador con su
    // propio timeout (10 s), y si en ese lapso no llega una posición, apaga el
    // watch. Se responde con la última lectura del watch si es reciente; si no,
    // se pide con la precisión y el timeout del watch.
    if (this.isNative && this.isTracking) {
      const recent = this.getLastKnownPosition(Math.max(positionOptions.maximumAge, SHARED_FIX_MAX_AGE_MS))
      if (recent) return recent
      positionOptions = { ...positionOptions, enableHighAccuracy: true, timeout: WATCH_TIMEOUT_MS }
    }

    try {
      if (this.isNative) {
        let timer = null
        const position = await Promise.race([
          Geolocation.getCurrentPosition(positionOptions),
          new Promise((_, reject) => {
            timer = setTimeout(() => reject(new Error('Location request timed out')), callerTimeout)
          }),
        ]).finally(() => clearTimeout(timer))
        return this.remember({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          altitude: position.coords.altitude ?? null,
          speed: position.coords.speed ?? null,
          heading: position.coords.heading ?? null,
          timestamp: position.timestamp,
        })
      } else {
        return new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              resolve(this.remember({
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                accuracy: position.coords.accuracy,
                altitude: position.coords.altitude ?? null,
                speed: position.coords.speed ?? null,
                heading: position.coords.heading ?? null,
                timestamp: position.timestamp,
              }))
            },
            reject,
            positionOptions
          )
        })
      }
    } catch (error) {
      console.error('Error getting current position:', error)
      throw error
    }
  }

  async showTrackingNotification(title, body) {
    if (!this.isNative) return

    try {
      await LocalNotifications.schedule({
        notifications: [
          {
            title,
            body,
            id: 1,
            schedule: { at: new Date(Date.now() + 1000) },
            sound: undefined,
            attachments: undefined,
            actionTypeId: '',
            extra: null,
          },
        ],
      })
    } catch (error) {
      console.error('Error showing notification:', error)
    }
  }

  handleTrackingError(error) {
    console.error('Tracking error:', error)

    const now = Date.now()
    if (this.isNative && now - this.lastErrorNotifiedAt > ERROR_NOTIFICATION_INTERVAL_MS) {
      this.lastErrorNotifiedAt = now
      this.showTrackingNotification('Error de GPS', 'Hubo un problema obteniendo tu ubicación')
    }
  }
}

export const locationService = new LocationService()
