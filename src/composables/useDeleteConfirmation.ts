// src/composables/useDeleteConfirmation.ts
import { ref } from 'vue'
import type { SnackbarColor } from './useSnackbar'

export interface DeleteConfirmationOptions<T = any> {
  onDelete: (item: T) => Promise<{ success: boolean; error?: string }>
  onSuccess?: (item: T) => void
  onError?: (error: string, item: T) => void
  showSnackbar?: (message: string, color: SnackbarColor) => void
  successMessage?: string | ((item: T) => string)
  errorMessage?: string | ((item: T, error?: string) => string)
}

export const useDeleteConfirmation = <T = any>(options: DeleteConfirmationOptions<T>) => {
  const isOpen = ref(false)
  const itemToDelete = ref<T | null>(null)
  const isDeleting = ref(false)

  const openDialog = (item: T) => {
    itemToDelete.value = item
    isOpen.value = true
  }

  const closeDialog = () => {
    isOpen.value = false
    itemToDelete.value = null
  }

  const confirmDelete = async () => {
    if (!itemToDelete.value) return

    isDeleting.value = true
    try {
      const result = await options.onDelete(itemToDelete.value)

      if (result.success) {
        const successMsg =
          typeof options.successMessage === 'function'
            ? options.successMessage(itemToDelete.value)
            : options.successMessage || 'Item deleted successfully'

        options.showSnackbar?.(successMsg, 'success')
        options.onSuccess?.(itemToDelete.value)
        closeDialog()
      } else {
        const errorMsg =
          typeof options.errorMessage === 'function'
            ? options.errorMessage(itemToDelete.value, result.error)
            : options.errorMessage || result.error || 'Failed to delete item'

        options.showSnackbar?.(errorMsg, 'error')
        options.onError?.(result.error || 'Unknown error', itemToDelete.value)
      }
    } catch (err: any) {
      const errorMsg = err.message || 'An error occurred while deleting'
      options.showSnackbar?.(errorMsg, 'error')
      options.onError?.(errorMsg, itemToDelete.value!)
    } finally {
      isDeleting.value = false
    }
  }

  return {
    isOpen,
    itemToDelete,
    isDeleting,
    openDialog,
    closeDialog,
    confirmDelete,
  }
}
