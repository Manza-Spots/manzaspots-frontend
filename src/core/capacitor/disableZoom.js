// Prevenir double-tap zoom en iOS/Android
export function disableDoubleTapZoom() {
  let lastTouchEnd = 0

  document.addEventListener(
    'touchend',
    (event) => {
      const now = Date.now()

      // Si hay dos taps en menos de 300ms, prevenir
      if (now - lastTouchEnd <= 300) {
        event.preventDefault()
      }

      lastTouchEnd = now
    },
    { passive: false }
  )

  // Prevenir pinch zoom
  document.addEventListener(
    'gesturestart',
    (event) => {
      event.preventDefault()
    },
    { passive: false }
  )

  document.addEventListener(
    'gesturechange',
    (event) => {
      event.preventDefault()
    },
    { passive: false }
  )

  document.addEventListener(
    'gestureend',
    (event) => {
      event.preventDefault()
    },
    { passive: false }
  )
}
