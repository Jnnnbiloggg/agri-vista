// src/utils/statusHelpers.ts

export type StatusType =
  | 'pending'
  | 'confirmed'
  | 'approved'
  | 'cancelled'
  | 'rejected'
  | 'completed'

/**
 * Get the appropriate color for a status badge
 * @param status - The status string
 * @returns Vuetify color string
 */
export const getStatusColor = (status: string): string => {
  const normalizedStatus = status.toLowerCase()

  switch (normalizedStatus) {
    case 'pending':
      return 'warning'
    case 'confirmed':
    case 'approved':
      return 'success'
    case 'cancelled':
    case 'rejected':
      return 'error'
    case 'completed':
      return 'info'
    default:
      return 'grey'
  }
}

/**
 * Get a user-friendly status label
 * @param status - The status string
 * @returns Formatted status label
 */
export const getStatusLabel = (status: string): string => {
  return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()
}
