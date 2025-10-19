// Design System Utilities for AgriVista
// Use these utility functions and constants across all components for consistency

/**
 * Status types used across the application
 */
export type Status = 'pending' | 'confirmed' | 'approved' | 'cancelled' | 'rejected' | 'completed'

/**
 * Get the appropriate color class for a status
 */
export const getStatusColor = (status: Status): string => {
  const colorMap: Record<Status, string> = {
    pending: 'warning',
    confirmed: 'success',
    approved: 'success',
    cancelled: 'error',
    rejected: 'error',
    completed: 'info',
  }
  return colorMap[status] || 'default'
}

/**
 * Format date string to readable format
 */
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

/**
 * Format date and time string to readable format
 */
export const formatDateTime = (dateTimeString: string): string => {
  const date = new Date(dateTimeString)
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Format time string to readable format
 */
export const formatTime = (timeString: string): string => {
  const [hours, minutes] = timeString.split(':')
  const hour = parseInt(hours, 10)
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const displayHour = hour % 12 || 12
  return `${displayHour}:${minutes} ${ampm}`
}

/**
 * Format currency (Philippine Peso)
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
  }).format(amount)
}

/**
 * Truncate text with ellipsis
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

/**
 * Generate random avatar URL (for placeholders)
 */
export const getAvatarUrl = (seed?: string | number): string => {
  const randomSeed = seed || Math.floor(Math.random() * 70)
  return `https://i.pravatar.cc/150?img=${randomSeed}`
}

/**
 * Common spacing values aligned with design system
 */
export const SPACING = {
  xs: 'var(--spacing-xs)',
  sm: 'var(--spacing-sm)',
  md: 'var(--spacing-md)',
  lg: 'var(--spacing-lg)',
  xl: 'var(--spacing-xl)',
  '2xl': 'var(--spacing-2xl)',
  '3xl': 'var(--spacing-3xl)',
} as const

/**
 * Common border radius values aligned with design system
 */
export const RADIUS = {
  sm: 'var(--radius-sm)',
  md: 'var(--radius-md)',
  lg: 'var(--radius-lg)',
  xl: 'var(--radius-xl)',
  '2xl': 'var(--radius-2xl)',
  full: 'var(--radius-full)',
} as const

/**
 * Debounce function for search inputs
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number,
): ((...args: Parameters<T>) => void) => {
  let timeout: ReturnType<typeof setTimeout> | null = null

  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

/**
 * Download data as CSV
 */
export const downloadCSV = (data: any[], filename: string, headers: string[]) => {
  const csvContent = [
    headers.join(','),
    ...data.map((row) =>
      headers
        .map((header) => {
          const value = row[header] || ''
          // Escape commas and quotes
          return typeof value === 'string' && (value.includes(',') || value.includes('"'))
            ? `"${value.replace(/"/g, '""')}"`
            : value
        })
        .join(','),
    ),
  ].join('\n')

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`
  link.click()
  window.URL.revokeObjectURL(url)
}

/**
 * Validate image file
 */
export const validateImageFile = (
  file: File,
  maxSizeMB: number = 5,
): { valid: boolean; error?: string } => {
  // Check file type
  if (!file.type.startsWith('image/')) {
    return { valid: false, error: 'Please select a valid image file' }
  }

  // Check file size
  const maxSizeBytes = maxSizeMB * 1024 * 1024
  if (file.size > maxSizeBytes) {
    return { valid: false, error: `Image size must be less than ${maxSizeMB}MB` }
  }

  return { valid: true }
}

/**
 * Create image preview from file
 */
export const createImagePreview = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      if (e.target?.result) {
        resolve(e.target.result as string)
      } else {
        reject(new Error('Failed to read file'))
      }
    }
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })
}

/**
 * Snackbar notification options
 */
export interface SnackbarOptions {
  message: string
  color?: 'success' | 'error' | 'warning' | 'info'
  timeout?: number
}

/**
 * Common form validation rules
 */
export const VALIDATION_RULES = {
  required: (v: any) => !!v || 'This field is required',
  email: (v: string) => /.+@.+\..+/.test(v) || 'Email must be valid',
  minLength: (min: number) => (v: string) =>
    (v && v.length >= min) || `Must be at least ${min} characters`,
  maxLength: (max: number) => (v: string) =>
    !v || v.length <= max || `Must be at most ${max} characters`,
  number: (v: any) => !isNaN(Number(v)) || 'Must be a number',
  positive: (v: any) => Number(v) > 0 || 'Must be greater than 0',
  phone: (v: string) => /^[0-9]{10,11}$/.test(v) || 'Phone number must be valid',
} as const
