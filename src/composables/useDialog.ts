// src/composables/useDialog.ts
import { ref } from 'vue'

export interface DialogOptions {
  onClose?: () => void
}

export const useDialog = (options: DialogOptions = {}) => {
  const isOpen = ref(false)

  const open = () => {
    isOpen.value = true
  }

  const close = () => {
    isOpen.value = false
    options.onClose?.()
  }

  const toggle = () => {
    isOpen.value = !isOpen.value
    if (!isOpen.value) {
      options.onClose?.()
    }
  }

  return {
    isOpen,
    open,
    close,
    toggle,
  }
}
