import { Capacitor } from '@capacitor/core'
import { CapgoCompass, CompassAccuracy } from '@capgo/capacitor-compass'

// Brújula del dispositivo. En iOS da el norte verdadero; en Android, el
// magnético (unos 6° de diferencia en Colima), que basta para orientar la
// cámara cuando vas lento o parado. En web no hay brújula: el seguimiento usa
// el rumbo del GPS y el de la ruta.
class HeadingService {
  constructor() {
    this.isNative = Capacitor.isNativePlatform()
    this.handles = []
  }

  get isAvailable() {
    return this.isNative
  }

  /**
   * Empieza a emitir el rumbo en grados (0-360).
   * @param {(heading: number) => void} onHeading
   * @param {(unreliable: boolean) => void} [onAccuracy]  true cuando conviene calibrar.
   */
  async start(onHeading, onAccuracy) {
    if (!this.isNative) return false
    try {
      this.handles.push(
        await CapgoCompass.addListener('headingChange', ({ value }) => {
          if (Number.isFinite(value)) onHeading(value)
        }),
      )
      if (onAccuracy) {
        this.handles.push(
          await CapgoCompass.addListener('accuracyChange', ({ accuracy }) => {
            onAccuracy(accuracy !== CompassAccuracy.UNKNOWN && accuracy <= CompassAccuracy.LOW)
          }),
        )
        await CapgoCompass.watchAccuracy()
      }
      await CapgoCompass.startListening({ minInterval: 100, minHeadingChange: 1 })
      return true
    } catch (error) {
      console.warn('No se pudo iniciar la brújula', error)
      await this.stop()
      return false
    }
  }

  async stop() {
    const handles = this.handles
    this.handles = []
    await Promise.allSettled([
      ...handles.map((handle) => handle.remove()),
      this.isNative ? CapgoCompass.stopListening() : null,
      this.isNative ? CapgoCompass.unwatchAccuracy() : null,
    ])
  }
}

export const headingService = new HeadingService()
