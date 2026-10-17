import { Capacitor } from '@capacitor/core'
import { Geolocation } from '@capacitor/geolocation'
import { LocalNotifications } from '@capacitor/local-notifications'

// Espera máxima para que el plugin nativo confirme que liberó el watch.
const CLEAR_WATCH_TIMEOUT_MS = 2000
// Como mucho una notificación de error de GPS por minuto.
const ERROR_NOTIFICATION_INTERVAL_MS = 60 * 1000

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

  async startTracking(callback, options = {}) {
    if (this.isTracking) {
      console.warn('Tracking already started')
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
      if (session === this.session) this.isTracking = false
      throw error
    }

    // Se finalizó (o se salió de la vista) mientras se resolvían los permisos.
    if (session !== this.session) return

    const defaultOptions = {
      enableHighAccuracy: true,
      // En un watch, el timeout es la espera máxima entre posiciones. Con 10 s,
      // bajo techo o con poca señal el plugin de iOS da por muerto el watch y
      // la grabación deja de recibir puntos para siempre.
      timeout: 5 * 60 * 1000,
      maximumAge: 0,
    }

    const trackingOptions = { ...defaultOptions, ...options }

    if (this.isNative) {
      await this.startNativeTracking(callback, trackingOptions)
    } else {
      this.startWebTracking(callback, trackingOptions)
    }

    // Lo detuvieron mientras se registraba el watch nativo.
    if (session !== this.session) {
      const orphan = this.watchId
      this.watchId = null
      this.clearWatch(orphan)
    }
  }

  async startNativeTracking(callback, options) {
    try {
      // Sin @capacitor/background-task el seguimiento se detiene al pasar
      // la app a segundo plano.
      this.watchId = await Geolocation.watchPosition(options, (position, err) => {
        if (err) {
          console.error('Geolocation error:', err)
          this.handleTrackingError(err)
          return
        }

        if (position) {
          callback({
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

  startWebTracking(callback, options) {
    try {
      this.watchId = navigator.geolocation.watchPosition(
        (position) => {
          callback({
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
   * Detiene el seguimiento sin bloquear a quien lo llama: el estado se limpia
   * de inmediato y la liberación del watch nativo tiene un tope de espera.
   */
  async stopTracking() {
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

    const positionOptions = { ...defaultOptions, ...options }

    try {
      if (this.isNative) {
        const position = await Geolocation.getCurrentPosition(positionOptions)
        return {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          altitude: position.coords.altitude ?? null,
          speed: position.coords.speed ?? null,
          heading: position.coords.heading ?? null,
          timestamp: position.timestamp,
        }
      } else {
        return new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              resolve({
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                accuracy: position.coords.accuracy,
                altitude: position.coords.altitude ?? null,
                speed: position.coords.speed ?? null,
                heading: position.coords.heading ?? null,
                timestamp: position.timestamp,
              })
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
