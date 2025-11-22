// src/composables/useNotifications.ts

import { ref, computed, onUnmounted } from 'vue'
import { supabase } from '../../utils/supabase'
import { useAuthStore } from '@/stores/auth'
import type { RealtimeChannel } from '@supabase/supabase-js'

export interface Notification {
  id: number
  user_id: string
  type: string
  title: string
  message: string
  data?: any
  route?: string
  is_read: boolean
  created_at: string
  updated_at: string
}

export const useNotifications = () => {
  const authStore = useAuthStore()

  // State
  const notifications = ref<Notification[]>([])
  const unreadCount = ref(0)
  const loading = ref(false)
  const error = ref<string | null>(null)

  let notificationsChannel: RealtimeChannel | null = null

  // Computed
  const unreadNotifications = computed(() => notifications.value.filter((n) => !n.is_read))

  const readNotifications = computed(() => notifications.value.filter((n) => n.is_read))

  /**
   * Fetch all notifications for the current user
   */
  const fetchNotifications = async () => {
    if (!authStore.userId) return

    loading.value = true
    error.value = null

    try {
      const { data, error: fetchError } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', authStore.userId)
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError

      notifications.value = data || []
      updateUnreadCount()
    } catch (err: any) {
      error.value = err.message
      console.error('Error fetching notifications:', err)
    } finally {
      loading.value = false
    }
  }

  /**
   * Mark a notification as read
   */
  const markAsRead = async (notificationId: number) => {
    try {
      const { error: updateError } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId)

      if (updateError) throw updateError

      // Update local state
      const notification = notifications.value.find((n) => n.id === notificationId)
      if (notification) {
        notification.is_read = true
        updateUnreadCount()
      }
    } catch (err: any) {
      console.error('Error marking notification as read:', err)
    }
  }

  /**
   * Mark all notifications as read
   */
  const markAllAsRead = async () => {
    if (!authStore.userId) return

    try {
      const { error: updateError } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', authStore.userId)
        .eq('is_read', false)

      if (updateError) throw updateError

      // Update local state
      notifications.value.forEach((n) => {
        n.is_read = true
      })
      updateUnreadCount()
    } catch (err: any) {
      console.error('Error marking all notifications as read:', err)
    }
  }

  /**
   * Delete a notification
   */
  const deleteNotification = async (notificationId: number) => {
    try {
      const { error: deleteError } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)

      if (deleteError) throw deleteError

      // Update local state
      notifications.value = notifications.value.filter((n) => n.id !== notificationId)
      updateUnreadCount()
    } catch (err: any) {
      console.error('Error deleting notification:', err)
    }
  }

  /**
   * Delete all read notifications
   */
  const clearReadNotifications = async () => {
    if (!authStore.userId) return

    try {
      const { error: deleteError } = await supabase
        .from('notifications')
        .delete()
        .eq('user_id', authStore.userId)
        .eq('is_read', true)

      if (deleteError) throw deleteError

      // Update local state
      notifications.value = notifications.value.filter((n) => !n.is_read)
      updateUnreadCount()
    } catch (err: any) {
      console.error('Error clearing read notifications:', err)
    }
  }

  /**
   * Update unread count
   */
  const updateUnreadCount = () => {
    unreadCount.value = notifications.value.filter((n) => !n.is_read).length
  }

  /**
   * Setup realtime subscription for notifications
   */
  const setupRealtimeSubscription = () => {
    if (!authStore.userId) return

    // Clean up existing subscription
    if (notificationsChannel) {
      supabase.removeChannel(notificationsChannel)
    }

    // Subscribe to notifications for current user
    notificationsChannel = supabase
      .channel('notifications_channel')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${authStore.userId}`,
        },
        async (payload) => {
          console.log('New notification received:', payload)

          // Add new notification to the list
          notifications.value.unshift(payload.new as Notification)
          updateUnreadCount()
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${authStore.userId}`,
        },
        async (payload) => {
          console.log('Notification updated:', payload)

          // Update notification in the list
          const index = notifications.value.findIndex((n) => n.id === payload.new.id)
          if (index !== -1) {
            notifications.value[index] = payload.new as Notification
            updateUnreadCount()
          }
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${authStore.userId}`,
        },
        async (payload) => {
          console.log('Notification deleted:', payload)

          // Remove notification from the list
          notifications.value = notifications.value.filter((n) => n.id !== payload.old.id)
          updateUnreadCount()
        },
      )
      .subscribe()
  }

  /**
   * Cleanup realtime subscription
   */
  const cleanupRealtimeSubscription = () => {
    if (notificationsChannel) {
      supabase.removeChannel(notificationsChannel)
      notificationsChannel = null
    }
  }

  /**
   * Get notification icon based on type
   */
  const getNotificationIcon = (type: string): string => {
    const iconMap: Record<string, string> = {
      new_feedback: 'mdi-comment-text',
      new_registration: 'mdi-school',
      registration_status_update: 'mdi-school',
      new_order: 'mdi-package-variant',
      order_status_update: 'mdi-package-variant',
      new_booking: 'mdi-calendar-check',
      booking_status_update: 'mdi-calendar-check',
      new_appointment: 'mdi-calendar-clock',
      appointment_status_update: 'mdi-calendar-clock',
    }
    return iconMap[type] || 'mdi-bell'
  }

  /**
   * Get notification color based on type
   */
  const getNotificationColor = (type: string): string => {
    if (type.includes('new_')) return 'primary'
    if (type.includes('confirmed')) return 'success'
    if (type.includes('cancelled')) return 'error'
    return 'info'
  }

  /**
   * Format time ago
   */
  const timeAgo = (dateString: string): string => {
    const date = new Date(dateString)
    const now = new Date()
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    const intervals = {
      year: 31536000,
      month: 2592000,
      week: 604800,
      day: 86400,
      hour: 3600,
      minute: 60,
    }

    if (seconds < 60) return 'Just now'

    for (const [unit, secondsInUnit] of Object.entries(intervals)) {
      const interval = Math.floor(seconds / secondsInUnit)
      if (interval >= 1) {
        return `${interval} ${unit}${interval === 1 ? '' : 's'} ago`
      }
    }

    return 'Just now'
  }

  return {
    // State
    notifications,
    unreadCount,
    loading,
    error,
    unreadNotifications,
    readNotifications,

    // Methods
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearReadNotifications,
    setupRealtimeSubscription,
    cleanupRealtimeSubscription,
    getNotificationIcon,
    getNotificationColor,
    timeAgo,
  }
}
