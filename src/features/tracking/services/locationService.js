import { Capacitor } from '@capacitor/core'
import { Geolocation } from '@capacitor/geolocation'
import { LocalNotifications } from '@capacitor/local-notifications'

class LocationService {
  constructor() {
    this.isNative = Capacitor.isNativePlatform()
    this.watchId = null
    this.backgroundTaskId = null
    this.isTracking = false
  }

  async requestPermissions() {
    if (this.isNative) {
      try {
        const locationPermission = await Geolocation.requestPermissions()

        const notificationPermission = await LocalNotifications.requestPermissions()

        return (
          locationPermission.location === 'granted' && notificationPermission.display === 'granted'
        )
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

    const hasPermissions = await this.checkPermissions()
    if (!hasPermissions) {
      const granted = await this.requestPermissions()
      if (!granted) {
        throw new Error('Location permissions not granted')
      }
    }

    const defaultOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    }

    const trackingOptions = { ...defaultOptions, ...options }

    this.isTracking = true

    if (this.isNative) {
      await this.startNativeTracking(callback, trackingOptions)
    } else {
      this.startWebTracking(callback, trackingOptions)
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
            altitude: position.coords.altitude || null,
            altitudeAccuracy: position.coords.altitudeAccuracy || null,
            speed: position.coords.speed || null,
            heading: position.coords.heading || null,
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
            altitude: position.coords.altitude || null,
            altitudeAccuracy: position.coords.altitudeAccuracy || null,
            speed: position.coords.speed || null,
            heading: position.coords.heading || null,
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

  async stopTracking() {
    if (!this.isTracking) return

    try {
      if (this.isNative) {
        if (this.watchId) {
          await Geolocation.clearWatch({ id: this.watchId })
        }
      } else {
        if (this.watchId) {
          navigator.geolocation.clearWatch(this.watchId)
        }
      }

      this.watchId = null
      this.backgroundTaskId = null
      this.isTracking = false

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
          altitude: position.coords.altitude || null,
          speed: position.coords.speed || null,
          heading: position.coords.heading || null,
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
                altitude: position.coords.altitude || null,
                speed: position.coords.speed || null,
                heading: position.coords.heading || null,
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

    if (this.isNative) {
      this.showTrackingNotification('Error de GPS', 'Hubo un problema obteniendo tu ubicación')
    }
  }
}

export const locationService = new LocationService()
