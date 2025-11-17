// src/composables/useImageHandler.ts
import { ref } from 'vue'

interface ImageHandlerOptions {
  maxSizeInMB?: number
  allowedTypes?: string[]
  multiple?: boolean
}

export const useImageHandler = (options: ImageHandlerOptions = {}) => {
  const {
    maxSizeInMB = 5,
    allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    multiple = false,
  } = options

  const imageFile = ref<File | null>(null)
  const imageFiles = ref<File[]>([])
  const imagePreview = ref<string | null>(null)
  const imagePreviews = ref<string[]>([])
  const error = ref<string | null>(null)

  /**
   * Handle single or multiple image selection (unified handler)
   */
  const handleImageSelect = (event: Event) => {
    const target = event.target as HTMLInputElement
    const files = Array.from(target.files || [])

    if (files.length === 0) return

    error.value = null

    const maxSizeInBytes = maxSizeInMB * 1024 * 1024

    // Clear previous selections
    if (!multiple) {
      imageFiles.value = []
      imagePreviews.value = []
    }

    // Process only the first file if not multiple
    const filesToProcess = multiple ? files : [files[0]]

    filesToProcess.forEach((file) => {
      // Validate file type
      if (!allowedTypes.includes(file.type)) {
        error.value = `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`
        return
      }

      // Validate file size
      if (file.size > maxSizeInBytes) {
        error.value = `File size exceeds ${maxSizeInMB}MB limit`
        return
      }

      // Add to files array
      imageFiles.value.push(file)
      imageFile.value = file // Also set single file for backward compatibility

      // Create preview
      const reader = new FileReader()
      reader.onload = (e) => {
        const preview = e.target?.result as string
        imagePreviews.value.push(preview)
        imagePreview.value = preview // Also set single preview for backward compatibility
      }
      reader.readAsDataURL(file)
    })
  }

  /**
   * Remove single image
   */
  const removeImage = () => {
    imageFile.value = null
    imagePreview.value = null
    error.value = null
  }

  /**
   * Remove image from multiple images by index
   */
  const removeImageAtIndex = (index: number) => {
    imagePreviews.value.splice(index, 1)
    imageFiles.value.splice(index, 1)

    // Update single image refs
    imageFile.value = imageFiles.value[0] || null
    imagePreview.value = imagePreviews.value[0] || null

    error.value = null
  }

  /**
   * Clear all images
   */
  const clearAllImages = () => {
    imageFile.value = null
    imageFiles.value = []
    imagePreview.value = null
    imagePreviews.value = []
    error.value = null
  }

  return {
    // Single image
    imageFile,
    imagePreview,
    removeImage,

    // Multiple images
    imageFiles,
    imagePreviews,
    removeImageAtIndex,

    // Unified handler for both single and multiple
    handleImageSelect,

    // Common
    error,
    clearAllImages,
  }
}
