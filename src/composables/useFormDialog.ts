// src/composables/useFormDialog.ts
import { ref, computed } from 'vue'
import type { SnackbarColor } from './useSnackbar'

export interface FormDialogOptions<T = any> {
  initialData: (() => T) | T
  onSubmit: (data: T, isEditing: boolean) => Promise<{ success: boolean; error?: string }>
  onSuccess?: (data: T, isEditing: boolean) => void
  onError?: (error: string, data: T, isEditing: boolean) => void
  showSnackbar?: (message: string, color: SnackbarColor) => void
  validate?: (data: T) => { valid: boolean; message?: string }
  successMessage?: {
    create: string
    update: string
  }
  errorMessage?: {
    create: string
    update: string
  }
  onOpen?: () => void
  onClose?: () => void
}

export const useFormDialog = <T = any>(options: FormDialogOptions<T>) => {
  const isOpen = ref(false)
  const isSubmitting = ref(false)

  const getInitialData = (): T => {
    return typeof options.initialData === 'function'
      ? (options.initialData as () => T)()
      : ({ ...(options.initialData as T) } as T)
  }

  const formData = ref<T>(getInitialData()) as any
  const editingItem = ref<T | null>(null)

  const isEditing = computed(() => editingItem.value !== null)

  const resetForm = () => {
    formData.value = getInitialData()
    editingItem.value = null
  }

  const openForCreate = () => {
    resetForm()
    isOpen.value = true
    options.onOpen?.()
  }

  const openForEdit = (item: T) => {
    editingItem.value = item
    formData.value = { ...item } as any
    isOpen.value = true
    options.onOpen?.()
  }

  const close = () => {
    isOpen.value = false
    options.onClose?.()
    // Delay reset to avoid visual glitch
    setTimeout(resetForm, 200)
  }

  const submit = async () => {
    // Validate if validator provided
    if (options.validate) {
      const validation = options.validate(formData.value)
      if (!validation.valid) {
        options.showSnackbar?.(validation.message || 'Please check all required fields', 'error')
        return
      }
    }

    isSubmitting.value = true
    try {
      const result = await options.onSubmit(formData.value, isEditing.value)

      if (result.success) {
        const successMsg = isEditing.value
          ? options.successMessage?.update || 'Updated successfully'
          : options.successMessage?.create || 'Created successfully'

        options.showSnackbar?.(successMsg, 'success')
        options.onSuccess?.(formData.value, isEditing.value)
        close()
      } else {
        const errorMsg = isEditing.value
          ? options.errorMessage?.update || result.error || 'Failed to update'
          : options.errorMessage?.create || result.error || 'Failed to create'

        options.showSnackbar?.(errorMsg, 'error')
        options.onError?.(result.error || 'Unknown error', formData.value, isEditing.value)
      }
    } catch (err: any) {
      const errorMsg = err.message || 'An error occurred'
      options.showSnackbar?.(errorMsg, 'error')
      options.onError?.(errorMsg, formData.value, isEditing.value)
    } finally {
      isSubmitting.value = false
    }
  }

  return {
    isOpen,
    isSubmitting,
    formData,
    editingItem,
    isEditing,
    openForCreate,
    openForEdit,
    close,
    submit,
    resetForm,
  }
}
