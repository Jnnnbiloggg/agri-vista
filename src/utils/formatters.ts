// src/utils/formatters.ts

/**
 * Format a date string to a human-readable format
 * @param dateString - ISO date string
 * @returns Formatted date string (e.g., "January 1, 2024")
 */
export const formatDate = (dateString: string): string => {
  if (!dateString) return 'N/A'

  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

/**
 * Format a time string to a human-readable format
 * @param timeString - ISO time string or time portion
 * @returns Formatted time string (e.g., "2:30 PM")
 */
export const formatTime = (timeString: string): string => {
  if (!timeString) return 'N/A'

  const date = new Date(`2000-01-01T${timeString}`)
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

/**
 * Format a datetime string to a human-readable format
 * @param dateTime - ISO datetime string
 * @returns Formatted datetime string (e.g., "January 1, 2024, 2:30 PM")
 */
export const formatDateTime = (dateTime: string): string => {
  if (!dateTime) return 'N/A'

  const date = new Date(dateTime)
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

/**
 * Format a date string to short format
 * @param dateString - ISO date string
 * @returns Short formatted date string (e.g., "01/01/2024")
 */
export const formatDateShort = (dateString: string): string => {
  if (!dateString) return 'N/A'

  const date = new Date(dateString)
  return date.toLocaleDateString('en-US')
}
