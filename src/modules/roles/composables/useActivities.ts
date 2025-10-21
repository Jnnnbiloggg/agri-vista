// src/modules/roles/composables/useActivities.ts

import { ref, computed, onUnmounted } from 'vue'

import type { RealtimeChannel } from '@supabase/supabase-js'
import { useAuthStore } from '@/stores/auth'
import { supabase } from '../../../../utils/supabase'

export interface Activity {
  id: number
  name: string
  description: string
  image_url: string | null
  type: string
  capacity: number
  location: string
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface Booking {
  id: number
  activity_id: number
  activity_name: string
  user_id: string
  user_name: string
  user_email: string
  booking_date: string
  status: 'pending' | 'confirmed' | 'cancelled'
  created_at: string
  updated_at: string
}

export interface Appointment {
  id: number
  user_id: string
  full_name: string
  email: string
  contact_number: string
  appointment_type: string
  date: string
  time: string
  note: string | null
  status: 'pending' | 'confirmed' | 'cancelled'
  created_at: string
  updated_at: string
}

export interface PaginationOptions {
  page: number
  itemsPerPage: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export const useActivities = () => {
  const authStore = useAuthStore()

  // State
  const activities = ref<Activity[]>([])
  const bookings = ref<Booking[]>([])
  const appointments = ref<Appointment[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Pagination state
  const activitiesTotal = ref(0)
  const bookingsTotal = ref(0)
  const appointmentsTotal = ref(0)

  const activitiesPage = ref(1)
  const bookingsPage = ref(1)
  const appointmentsPage = ref(1)

  const itemsPerPage = ref(10)
  const activitiesSearchQuery = ref('')
  const bookingsSearchQuery = ref('')
  const appointmentsSearchQuery = ref('')

  let activitiesChannel: RealtimeChannel | null = null
  let bookingsChannel: RealtimeChannel | null = null
  let appointmentsChannel: RealtimeChannel | null = null

  // Computed pagination info
  const activitiesTotalPages = computed(() => Math.ceil(activitiesTotal.value / itemsPerPage.value))
  const bookingsTotalPages = computed(() => Math.ceil(bookingsTotal.value / itemsPerPage.value))
  const appointmentsTotalPages = computed(() =>
    Math.ceil(appointmentsTotal.value / itemsPerPage.value),
  )

  // ============================================
  // ACTIVITIES
  // ============================================

  const fetchActivities = async (options?: Partial<PaginationOptions> & { append?: boolean }) => {
    loading.value = true
    error.value = null

    if (options?.page) activitiesPage.value = options.page
    if (options?.itemsPerPage) itemsPerPage.value = options.itemsPerPage

    try {
      const from = (activitiesPage.value - 1) * itemsPerPage.value
      const to = from + itemsPerPage.value - 1

      let query = supabase
        .from('activities')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to)

      // Search functionality
      if (activitiesSearchQuery.value) {
        query = query.or(
          `name.ilike.%${activitiesSearchQuery.value}%,description.ilike.%${activitiesSearchQuery.value}%,type.ilike.%${activitiesSearchQuery.value}%`,
        )
      }

      const { data, error: fetchError, count } = await query

      if (fetchError) throw fetchError

      // Append or replace data based on options
      if (options?.append) {
        activities.value = [...activities.value, ...(data || [])]
      } else {
        activities.value = data || []
      }
      activitiesTotal.value = count || 0
    } catch (err: any) {
      error.value = err.message
      console.error('Error fetching activities:', err)
    } finally {
      loading.value = false
    }
  }

  const loadMoreActivities = async () => {
    if (activitiesPage.value < activitiesTotalPages.value) {
      activitiesPage.value += 1
      await fetchActivities({ append: true })
    }
  }

  const searchActivities = async (query: string) => {
    activitiesSearchQuery.value = query
    activitiesPage.value = 1
    await fetchActivities()
  }

  const clearActivitiesSearch = async () => {
    activitiesSearchQuery.value = ''
    activitiesPage.value = 1
    await fetchActivities()
  }

  const createActivity = async (
    activity: Omit<Activity, 'id' | 'created_at' | 'updated_at' | 'created_by'>,
    imageFile: File | null = null,
  ) => {
    loading.value = true
    error.value = null

    try {
      let imageUrl = activity.image_url

      if (imageFile) {
        imageUrl = await uploadImage(imageFile)
      }

      const { data, error: createError } = await supabase
        .from('activities')
        .insert([
          {
            ...activity,
            image_url: imageUrl,
            created_by: authStore.userId,
          },
        ])
        .select()
        .single()

      if (createError) throw createError

      await fetchActivities()
      return { success: true, data }
    } catch (err: any) {
      error.value = err.message
      console.error('Error creating activity:', err)
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  const updateActivity = async (
    id: number,
    updates: Partial<Omit<Activity, 'id' | 'created_at' | 'updated_at' | 'created_by'>>,
    imageFile: File | null = null,
  ) => {
    loading.value = true
    error.value = null

    try {
      let imageUrl = updates.image_url

      if (imageFile) {
        // Delete old image if exists
        if (updates.image_url) {
          await deleteImage(updates.image_url)
        }
        imageUrl = await uploadImage(imageFile)
      }

      const { data, error: updateError } = await supabase
        .from('activities')
        .update({
          ...updates,
          image_url: imageUrl,
        })
        .eq('id', id)
        .select()
        .single()

      if (updateError) throw updateError

      await fetchActivities()
      return { success: true, data }
    } catch (err: any) {
      error.value = err.message
      console.error('Error updating activity:', err)
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  const deleteActivity = async (id: number) => {
    loading.value = true
    error.value = null

    try {
      // Get activity to delete image
      const { data: activity } = await supabase
        .from('activities')
        .select('image_url')
        .eq('id', id)
        .single()

      // Delete image if exists
      if (activity?.image_url) {
        await deleteImage(activity.image_url)
      }

      const { error: deleteError } = await supabase.from('activities').delete().eq('id', id)

      if (deleteError) throw deleteError

      await fetchActivities()
      return { success: true }
    } catch (err: any) {
      error.value = err.message
      console.error('Error deleting activity:', err)
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  // ============================================
  // BOOKINGS
  // ============================================

  const fetchBookings = async (options?: Partial<PaginationOptions>) => {
    loading.value = true
    error.value = null

    if (options?.page) bookingsPage.value = options.page
    if (options?.itemsPerPage) itemsPerPage.value = options.itemsPerPage

    try {
      const from = (bookingsPage.value - 1) * itemsPerPage.value
      const to = from + itemsPerPage.value - 1

      let query = supabase
        .from('bookings')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to)

      // If user is not admin, only show their bookings
      if (!authStore.isAdmin) {
        query = query.eq('user_id', authStore.userId)
      }

      // Search functionality
      if (bookingsSearchQuery.value) {
        query = query.or(
          `activity_name.ilike.%${bookingsSearchQuery.value}%,user_name.ilike.%${bookingsSearchQuery.value}%,user_email.ilike.%${bookingsSearchQuery.value}%`,
        )
      }

      const { data, error: fetchError, count } = await query

      if (fetchError) throw fetchError

      bookings.value = data || []
      bookingsTotal.value = count || 0
    } catch (err: any) {
      error.value = err.message
      console.error('Error fetching bookings:', err)
    } finally {
      loading.value = false
    }
  }

  const searchBookings = async (query: string) => {
    bookingsSearchQuery.value = query
    bookingsPage.value = 1
    await fetchBookings()
  }

  const clearBookingsSearch = async () => {
    bookingsSearchQuery.value = ''
    bookingsPage.value = 1
    await fetchBookings()
  }

  const createBooking = async (
    booking: Omit<
      Booking,
      'id' | 'created_at' | 'updated_at' | 'user_id' | 'user_name' | 'user_email'
    >,
  ) => {
    loading.value = true
    error.value = null

    try {
      const { data, error: createError } = await supabase
        .from('bookings')
        .insert([
          {
            ...booking,
            user_id: authStore.userId,
            user_name: authStore.fullName,
            user_email: authStore.userEmail,
          },
        ])
        .select()
        .single()

      if (createError) throw createError

      await fetchBookings()
      return { success: true, data }
    } catch (err: any) {
      error.value = err.message
      console.error('Error creating booking:', err)
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  const updateBooking = async (id: number, updates: Partial<Booking>) => {
    loading.value = true
    error.value = null

    try {
      const { data, error: updateError } = await supabase
        .from('bookings')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (updateError) throw updateError

      await fetchBookings()
      return { success: true, data }
    } catch (err: any) {
      error.value = err.message
      console.error('Error updating booking:', err)
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  const deleteBooking = async (id: number) => {
    loading.value = true
    error.value = null

    try {
      const { error: deleteError } = await supabase.from('bookings').delete().eq('id', id)

      if (deleteError) throw deleteError

      await fetchBookings()
      return { success: true }
    } catch (err: any) {
      error.value = err.message
      console.error('Error deleting booking:', err)
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  // ============================================
  // APPOINTMENTS
  // ============================================

  const fetchAppointments = async (options?: Partial<PaginationOptions>) => {
    loading.value = true
    error.value = null

    if (options?.page) appointmentsPage.value = options.page
    if (options?.itemsPerPage) itemsPerPage.value = options.itemsPerPage

    try {
      const from = (appointmentsPage.value - 1) * itemsPerPage.value
      const to = from + itemsPerPage.value - 1

      let query = supabase
        .from('appointments')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to)

      // If user is not admin, only show their appointments
      if (!authStore.isAdmin) {
        query = query.eq('user_id', authStore.userId)
      }

      // Search functionality
      if (appointmentsSearchQuery.value) {
        query = query.or(
          `full_name.ilike.%${appointmentsSearchQuery.value}%,email.ilike.%${appointmentsSearchQuery.value}%,appointment_type.ilike.%${appointmentsSearchQuery.value}%`,
        )
      }

      const { data, error: fetchError, count } = await query

      if (fetchError) throw fetchError

      appointments.value = data || []
      appointmentsTotal.value = count || 0
    } catch (err: any) {
      error.value = err.message
      console.error('Error fetching appointments:', err)
    } finally {
      loading.value = false
    }
  }

  const searchAppointments = async (query: string) => {
    appointmentsSearchQuery.value = query
    appointmentsPage.value = 1
    await fetchAppointments()
  }

  const clearAppointmentsSearch = async () => {
    appointmentsSearchQuery.value = ''
    appointmentsPage.value = 1
    await fetchAppointments()
  }

  const createAppointment = async (
    appointment: Omit<Appointment, 'id' | 'created_at' | 'updated_at' | 'user_id'>,
  ) => {
    loading.value = true
    error.value = null

    try {
      const { data, error: createError } = await supabase
        .from('appointments')
        .insert([
          {
            ...appointment,
            user_id: authStore.userId,
          },
        ])
        .select()
        .single()

      if (createError) throw createError

      await fetchAppointments()
      return { success: true, data }
    } catch (err: any) {
      error.value = err.message
      console.error('Error creating appointment:', err)
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  const updateAppointment = async (id: number, updates: Partial<Appointment>) => {
    loading.value = true
    error.value = null

    try {
      const { data, error: updateError } = await supabase
        .from('appointments')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (updateError) throw updateError

      await fetchAppointments()
      return { success: true, data }
    } catch (err: any) {
      error.value = err.message
      console.error('Error updating appointment:', err)
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  const deleteAppointment = async (id: number) => {
    loading.value = true
    error.value = null

    try {
      const { error: deleteError } = await supabase.from('appointments').delete().eq('id', id)

      if (deleteError) throw deleteError

      await fetchAppointments()
      return { success: true }
    } catch (err: any) {
      error.value = err.message
      console.error('Error deleting appointment:', err)
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  // ============================================
  // IMAGE HANDLING
  // ============================================

  const uploadImage = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`
      const filePath = `${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('activities')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        })

      if (uploadError) throw uploadError

      const {
        data: { publicUrl },
      } = supabase.storage.from('activities').getPublicUrl(filePath)

      return publicUrl
    } catch (err: any) {
      console.error('Error uploading image:', err)
      return null
    }
  }

  const deleteImage = async (imageUrl: string): Promise<boolean> => {
    try {
      const path = imageUrl.split('/activities/').pop()
      if (!path) return false

      const { error: deleteError } = await supabase.storage.from('activities').remove([path])

      if (deleteError) throw deleteError
      return true
    } catch (err: any) {
      console.error('Error deleting image:', err)
      return false
    }
  }

  // ============================================
  // REALTIME SUBSCRIPTIONS
  // ============================================

  const setupRealtimeSubscriptions = () => {
    // Activities subscription
    activitiesChannel = supabase
      .channel('activities-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'activities',
        },
        async (payload) => {
          console.log('Activities change received:', payload)
          await fetchActivities()
        },
      )
      .subscribe()

    // Bookings subscription
    bookingsChannel = supabase
      .channel('bookings-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookings',
        },
        async (payload) => {
          console.log('Bookings change received:', payload)
          await fetchBookings()
        },
      )
      .subscribe()

    // Appointments subscription
    appointmentsChannel = supabase
      .channel('appointments-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'appointments',
        },
        async (payload) => {
          console.log('Appointments change received:', payload)
          await fetchAppointments()
        },
      )
      .subscribe()
  }

  const unsubscribeRealtime = () => {
    if (activitiesChannel) {
      supabase.removeChannel(activitiesChannel)
      activitiesChannel = null
    }
    if (bookingsChannel) {
      supabase.removeChannel(bookingsChannel)
      bookingsChannel = null
    }
    if (appointmentsChannel) {
      supabase.removeChannel(appointmentsChannel)
      appointmentsChannel = null
    }
  }

  /**
   * Change page for activities
   */
  const goToActivitiesPage = async (page: number) => {
    if (page >= 1 && page <= activitiesTotalPages.value) {
      activitiesPage.value = page
      await fetchActivities()
    }
  }

  /**
   * Change page for bookings
   */
  const goToBookingsPage = async (page: number) => {
    if (page >= 1 && page <= bookingsTotalPages.value) {
      bookingsPage.value = page
      await fetchBookings()
    }
  }

  /**
   * Change page for appointments
   */
  const goToAppointmentsPage = async (page: number) => {
    if (page >= 1 && page <= appointmentsTotalPages.value) {
      appointmentsPage.value = page
      await fetchAppointments()
    }
  }

  return {
    // State
    activities,
    bookings,
    appointments,
    loading,
    error,

    // Pagination
    activitiesTotal,
    bookingsTotal,
    appointmentsTotal,
    activitiesPage,
    bookingsPage,
    appointmentsPage,
    itemsPerPage,
    activitiesSearchQuery,
    bookingsSearchQuery,
    appointmentsSearchQuery,
    activitiesTotalPages,
    bookingsTotalPages,
    appointmentsTotalPages,

    // Activities methods
    fetchActivities,
    loadMoreActivities,
    searchActivities,
    clearActivitiesSearch,
    createActivity,
    updateActivity,
    deleteActivity,
    goToActivitiesPage,

    // Bookings methods
    fetchBookings,
    searchBookings,
    clearBookingsSearch,
    createBooking,
    updateBooking,
    deleteBooking,
    goToBookingsPage,

    // Appointments methods
    fetchAppointments,
    searchAppointments,
    clearAppointmentsSearch,
    createAppointment,
    updateAppointment,
    deleteAppointment,
    goToAppointmentsPage,

    // Realtime
    setupRealtimeSubscriptions,
    unsubscribeRealtime,
  }
}
