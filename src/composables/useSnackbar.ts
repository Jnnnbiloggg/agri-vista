// src/composables/useSnackbar.ts
import { ref } from 'vue'

export type SnackbarColor = 'success' | 'error' | 'info' | 'warning'

export const useSnackbar = () => {
  const snackbar = ref(false)
  const snackbarMessage = ref('')
  const snackbarColor = ref<SnackbarColor>('success')

  const showSnackbar = (message: string, color: SnackbarColor = 'success') => {
    snackbarMessage.value = message
    snackbarColor.value = color
    snackbar.value = true
  }

  return {
    snackbar,
    snackbarMessage,
    snackbarColor,
    showSnackbar,
  }
}
