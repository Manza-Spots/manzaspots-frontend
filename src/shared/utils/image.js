import { Camera, CameraResultType, CameraSource } from '@capacitor/camera'
import { isNative } from '@/core/capacitor'
import i18n from '@/core/i18n'
import { useToast } from '@/shared/composables/useToast'

/**
 * Reduce una foto antes de subirla: las cámaras de los teléfonos generan
 * archivos de varios MB que tardan en subir con datos móviles. Si el navegador
 * no puede decodificarla, devuelve el archivo original.
 * @param {File} file
 * @param {{ maxSize?: number, quality?: number }} [options]
 * @returns {Promise<File>}
 */
export async function compressImage(file, { maxSize = 1600, quality = 0.82 } = {}) {
  if (!file?.type?.startsWith('image/')) return file

  try {
    const bitmap = await createImageBitmap(file)
    const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height))
    const width = Math.round(bitmap.width * scale)
    const height = Math.round(bitmap.height * scale)

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    canvas.getContext('2d').drawImage(bitmap, 0, 0, width, height)
    bitmap.close?.()

    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality))
    if (!blob || blob.size >= file.size) return file

    const name = file.name.replace(/\.[^.]+$/, '') || 'photo'
    return new File([blob], `${name}.jpg`, { type: 'image/jpeg' })
  } catch (error) {
    console.warn('No se pudo comprimir la imagen, se sube la original', error)
    return file
  }
}

// Lado mayor (px) con el que la cámara nativa entrega la foto: evita decodificar
// fotos de 12 MP en el WebView antes de comprimirlas.
const NATIVE_TARGET_SIZE = 1600

const isCancel = (error) => /cancel/i.test(error?.message ?? '')

/** Convierte el `webPath` que devuelve la cámara nativa en un File subible. */
async function webPathToFile(webPath) {
  const blob = await (await fetch(webPath)).blob()
  const type = blob.type || 'image/jpeg'
  return new File([blob], `photo-${Date.now()}.${type.split('/')[1] || 'jpg'}`, { type })
}

/**
 * Cámara/galería nativa (iOS/Android). Un `<input type="file">` dentro del
 * WebView no es confiable ahí: en iOS sin los permisos declarados congela la
 * app, y en Android depende del file chooser del WebView.
 */
async function pickNativeImage(capture) {
  const { t } = i18n.global
  const size = { targetWidth: NATIVE_TARGET_SIZE, targetHeight: NATIVE_TARGET_SIZE }

  if (capture) {
    const result = await Camera.takePhoto({ quality: 85, correctOrientation: true, ...size })
    return result.webPath ? webPathToFile(result.webPath) : null
  }

  // Cámara o galería a elección del usuario, con la hoja de opciones nativa.
  const photo = await Camera.getPhoto({
    source: CameraSource.Prompt,
    resultType: CameraResultType.Uri,
    quality: 85,
    correctOrientation: true,
    width: NATIVE_TARGET_SIZE,
    height: NATIVE_TARGET_SIZE,
    promptLabelHeader: t('common.photo.header'),
    promptLabelPhoto: t('common.photo.fromGallery'),
    promptLabelPicture: t('common.photo.takePicture'),
    promptLabelCancel: t('common.buttons.cancel'),
  })
  return photo.webPath ? webPathToFile(photo.webPath) : null
}

/** `<input type="file">` para la versión web. */
function pickWebImage(capture) {
  return new Promise((resolve) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    if (capture) input.capture = 'environment'
    // Safari en iOS no siempre dispara `change` en un input fuera del DOM.
    input.style.display = 'none'
    document.body.appendChild(input)

    const done = (file) => {
      input.remove()
      resolve(file)
    }
    input.addEventListener('change', () => done(input.files?.[0] ?? null), { once: true })
    input.addEventListener('cancel', () => done(null), { once: true })
    input.click()
  })
}

/**
 * Pide una foto al usuario: cámara o galería (con `capture`, directo a la
 * cámara). Debe llamarse dentro de un gesto del usuario (click/tap).
 * Nunca lanza: si cancela devuelve null, y si falla avisa con un toast.
 * @param {{ capture?: boolean }} [options]
 * @returns {Promise<File|null>}
 */
export async function pickImage({ capture = false } = {}) {
  try {
    return isNative ? await pickNativeImage(capture) : await pickWebImage(capture)
  } catch (error) {
    if (isCancel(error)) return null
    console.warn('No se pudo obtener la foto', error)
    useToast().error(i18n.global.t('common.photo.failed'))
    return null
  }
}
