import { ref, shallowRef, markRaw } from 'vue'

const isOpen = ref(false)
const component = shallowRef(null)
const props = ref({})
const config = ref({
  title: '',
  closable: true,
  closeOnBackdrop: true,
})

export function useBottomSheet() {
  const open = (componentInstance, componentProps = {}, bottomSheetConfig = {}) => {
    component.value = markRaw(componentInstance)
    props.value = componentProps
    config.value = { ...config.value, ...bottomSheetConfig }
    isOpen.value = true
  }

  const close = () => {
    isOpen.value = false
    // Retrasar la limpieza del estado hasta terminar la transición de salida (300ms)
    setTimeout(() => {
      // doble chequeo por si lo abren inmediatamente en esos 300ms
      if (!isOpen.value) {
        component.value = null
        props.value = {}
        config.value = { title: '', closable: true, closeOnBackdrop: true }
      }
    }, 300)
  }

  return {
    isOpen,
    component,
    props,
    config,
    open,
    close
  }
}
