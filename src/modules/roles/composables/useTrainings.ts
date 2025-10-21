// src/modules/roles/composables/useTrainings.ts

import { ref, computed, onUnmounted } from 'vue'

import { useAuthStore } from '@/stores/auth'
import type { RealtimeChannel } from '@supabase/supabase-js'
import { supabase } from '../../../../utils/supabase'

export interface Training {
  id: number
  name: string
  description: string | null
  location: string
  start_date_time: string
  end_date_time: string
  topics: string[]
  capacity: number
  image_url: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface TrainingRegistration {
  id: number
  training_id: number
  training_name: string
  user_id: string
  user_name: string
  user_email: string
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

export const useTrainings = () => {
  const authStore = useAuthStore()

  // State
  const trainings = ref<Training[]>([])
  const registrations = ref<TrainingRegistration[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Pagination state
  const trainingsTotal = ref(0)
  const registrationsTotal = ref(0)

  const trainingsPage = ref(1)
  const registrationsPage = ref(1)

  const itemsPerPage = ref(10)
  const trainingsSearchQuery = ref('')
  const registrationsSearchQuery = ref('')

  let trainingsChannel: RealtimeChannel | null = null
  let registrationsChannel: RealtimeChannel | null = null

  // Computed pagination info
  const trainingsTotalPages = computed(() => Math.ceil(trainingsTotal.value / itemsPerPage.value))
  const registrationsTotalPages = computed(() =>
    Math.ceil(registrationsTotal.value / itemsPerPage.value),
  )

  // ============================================
  // TRAININGS
  // ============================================

  const fetchTrainings = async (options?: Partial<PaginationOptions> & { append?: boolean }) => {
    loading.value = true
    error.value = null

    try {
      const page = options?.page || trainingsPage.value
      const limit = options?.itemsPerPage || itemsPerPage.value
      const sortBy = options?.sortBy || 'start_date_time'
      const sortOrder = options?.sortOrder || 'desc'

      const from = (page - 1) * limit
      const to = from + limit - 1

      let query = supabase.from('trainings').select('*', { count: 'exact' })

      // Apply search filter if exists
      if (trainingsSearchQuery.value) {
        query = query.or(
          `name.ilike.%${trainingsSearchQuery.value}%,description.ilike.%${trainingsSearchQuery.value}%`,
        )
      }

      // Apply sorting and pagination
      query = query.order(sortBy, { ascending: sortOrder === 'asc' }).range(from, to)

      const { data, error: fetchError, count } = await query

      if (fetchError) throw fetchError

      // Append or replace data based on options
      if (options?.append) {
        trainings.value = [...trainings.value, ...(data || [])]
      } else {
        trainings.value = data || []
      }
      trainingsTotal.value = count || 0
      trainingsPage.value = page

      return { success: true, data: trainings.value }
    } catch (err: any) {
      error.value = err.message
      console.error('Error fetching trainings:', err)
      return { success: false, error: err.message }
    } finally {
      loading.value = false
    }
  }

  const loadMoreTrainings = async () => {
    if (trainingsPage.value < trainingsTotalPages.value) {
      trainingsPage.value += 1
      await fetchTrainings({ append: true })
    }
  }

  const searchTrainings = async (query: string) => {
    trainingsSearchQuery.value = query
    trainingsPage.value = 1
    await fetchTrainings()
  }

  const clearTrainingsSearch = async () => {
    trainingsSearchQuery.value = ''
    await fetchTrainings()
  }

  const createTraining = async (
    training: Omit<Training, 'id' | 'created_at' | 'updated_at' | 'created_by'>,
    imageFile: File | null = null,
  ) => {
    loading.value = true
    error.value = null

    try {
      let imageUrl = training.image_url

      // Upload image if provided
      if (imageFile) {
        imageUrl = await uploadImage(imageFile)
      }

      const { data, error: insertError } = await supabase
        .from('trainings')
        .insert([
          {
            ...training,
            image_url: imageUrl,
            created_by: authStore.userId,
          },
        ])
        .select()
        .single()

      if (insertError) throw insertError

      await fetchTrainings()
      return { success: true, data }
    } catch (err: any) {
      error.value = err.message
      console.error('Error creating training:', err)
      return { success: false, error: err.message }
    } finally {
      loading.value = false
    }
  }

  const updateTraining = async (
    id: number,
    updates: Partial<Omit<Training, 'id' | 'created_at' | 'updated_at' | 'created_by'>>,
    imageFile: File | null = null,
  ) => {
    loading.value = true
    error.value = null

    try {
      let imageUrl = updates.image_url

      // Upload new image if provided
      if (imageFile) {
        // Delete old image if exists
        const training = trainings.value.find((t) => t.id === id)
        if (training?.image_url) {
          await deleteImage(training.image_url)
        }

        imageUrl = await uploadImage(imageFile)
      }

      const { data, error: updateError } = await supabase
        .from('trainings')
        .update({
          ...updates,
          image_url: imageUrl,
        })
        .eq('id', id)
        .select()
        .single()

      if (updateError) throw updateError

      await fetchTrainings()
      return { success: true, data }
    } catch (err: any) {
      error.value = err.message
      console.error('Error updating training:', err)
      return { success: false, error: err.message }
    } finally {
      loading.value = false
    }
  }

  const deleteTraining = async (id: number) => {
    loading.value = true
    error.value = null

    try {
      // Get training to delete its image
      const training = trainings.value.find((t) => t.id === id)
      if (training?.image_url) {
        await deleteImage(training.image_url)
      }

      const { error: deleteError } = await supabase.from('trainings').delete().eq('id', id)

      if (deleteError) throw deleteError

      await fetchTrainings()
      return { success: true }
    } catch (err: any) {
      error.value = err.message
      console.error('Error deleting training:', err)
      return { success: false, error: err.message }
    } finally {
      loading.value = false
    }
  }

  // ============================================
  // TRAINING REGISTRATIONS
  // ============================================

  const fetchRegistrations = async (options?: Partial<PaginationOptions>) => {
    loading.value = true
    error.value = null

    try {
      const page = options?.page || registrationsPage.value
      const limit = options?.itemsPerPage || itemsPerPage.value
      const sortBy = options?.sortBy || 'created_at'
      const sortOrder = options?.sortOrder || 'desc'

      const from = (page - 1) * limit
      const to = from + limit - 1

      let query = supabase.from('training_registrations').select('*', { count: 'exact' })

      // If user is not admin, only show their registrations
      if (!authStore.isAdmin) {
        query = query.eq('user_id', authStore.userId)
      }

      // Apply search filter if exists
      if (registrationsSearchQuery.value) {
        query = query.or(
          `training_name.ilike.%${registrationsSearchQuery.value}%,user_name.ilike.%${registrationsSearchQuery.value}%`,
        )
      }

      // Apply sorting and pagination
      query = query.order(sortBy, { ascending: sortOrder === 'asc' }).range(from, to)

      const { data, error: fetchError, count } = await query

      if (fetchError) throw fetchError

      registrations.value = data || []
      registrationsTotal.value = count || 0
      registrationsPage.value = page

      return { success: true, data: registrations.value }
    } catch (err: any) {
      error.value = err.message
      console.error('Error fetching registrations:', err)
      return { success: false, error: err.message }
    } finally {
      loading.value = false
    }
  }

  const searchRegistrations = async (query: string) => {
    registrationsSearchQuery.value = query
    registrationsPage.value = 1
    await fetchRegistrations()
  }

  const clearRegistrationsSearch = async () => {
    registrationsSearchQuery.value = ''
    await fetchRegistrations()
  }

  const createRegistration = async (
    registration: Omit<
      TrainingRegistration,
      'id' | 'created_at' | 'updated_at' | 'user_id' | 'user_name' | 'user_email'
    >,
  ) => {
    loading.value = true
    error.value = null

    try {
      const { data, error: insertError } = await supabase
        .from('training_registrations')
        .insert([
          {
            ...registration,
            user_id: authStore.userId,
            user_name: authStore.fullName,
            user_email: authStore.userEmail,
          },
        ])
        .select()
        .single()

      if (insertError) throw insertError

      await fetchRegistrations()
      return { success: true, data }
    } catch (err: any) {
      error.value = err.message
      console.error('Error creating registration:', err)
      return { success: false, error: err.message }
    } finally {
      loading.value = false
    }
  }

  const updateRegistration = async (
    id: number,
    updates: Partial<Omit<TrainingRegistration, 'id' | 'created_at' | 'updated_at' | 'user_id'>>,
  ) => {
    loading.value = true
    error.value = null

    try {
      const { data, error: updateError } = await supabase
        .from('training_registrations')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (updateError) throw updateError

      await fetchRegistrations()
      return { success: true, data }
    } catch (err: any) {
      error.value = err.message
      console.error('Error updating registration:', err)
      return { success: false, error: err.message }
    } finally {
      loading.value = false
    }
  }

  const deleteRegistration = async (id: number) => {
    loading.value = true
    error.value = null

    try {
      const { error: deleteError } = await supabase
        .from('training_registrations')
        .delete()
        .eq('id', id)

      if (deleteError) throw deleteError

      await fetchRegistrations()
      return { success: true }
    } catch (err: any) {
      error.value = err.message
      console.error('Error deleting registration:', err)
      return { success: false, error: err.message }
    } finally {
      loading.value = false
    }
  }

  // ============================================
  // IMAGE MANAGEMENT
  // ============================================

  const uploadImage = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`
      const filePath = `${fileName}`

      const { error: uploadError } = await supabase.storage.from('trainings').upload(filePath, file)

      if (uploadError) throw uploadError

      const {
        data: { publicUrl },
      } = supabase.storage.from('trainings').getPublicUrl(filePath)

      return publicUrl
    } catch (err: any) {
      console.error('Error uploading image:', err)
      return null
    }
  }

  const deleteImage = async (imageUrl: string): Promise<boolean> => {
    try {
      const urlParts = imageUrl.split('/trainings/')
      if (urlParts.length < 2) return false

      const filePath = urlParts[1]

      const { error: deleteError } = await supabase.storage.from('trainings').remove([filePath])

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
    // Trainings subscription
    trainingsChannel = supabase
      .channel('trainings-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'trainings' },
        async (payload) => {
          console.log('Trainings change received!', payload)
          await fetchTrainings()
        },
      )
      .subscribe()

    // Registrations subscription
    registrationsChannel = supabase
      .channel('registrations-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'training_registrations' },
        async (payload) => {
          console.log('Registrations change received!', payload)
          await fetchRegistrations()
        },
      )
      .subscribe()
  }

  const unsubscribeRealtime = () => {
    if (trainingsChannel) {
      supabase.removeChannel(trainingsChannel)
      trainingsChannel = null
    }
    if (registrationsChannel) {
      supabase.removeChannel(registrationsChannel)
      registrationsChannel = null
    }
  }

  /**
   * Change page for trainings
   */
  const goToTrainingsPage = async (page: number) => {
    if (page >= 1 && page <= trainingsTotalPages.value) {
      trainingsPage.value = page
      await fetchTrainings()
    }
  }

  /**
   * Change page for registrations
   */
  const goToRegistrationsPage = async (page: number) => {
    if (page >= 1 && page <= registrationsTotalPages.value) {
      registrationsPage.value = page
      await fetchRegistrations()
    }
  }

  return {
    // State
    trainings,
    registrations,
    loading,
    error,
    trainingsTotal,
    registrationsTotal,
    trainingsPage,
    registrationsPage,
    itemsPerPage,
    trainingsTotalPages,
    registrationsTotalPages,
    // Trainings
    fetchTrainings,
    loadMoreTrainings,
    searchTrainings,
    clearTrainingsSearch,
    createTraining,
    updateTraining,
    deleteTraining,
    goToTrainingsPage,
    // Registrations
    fetchRegistrations,
    searchRegistrations,
    clearRegistrationsSearch,
    createRegistration,
    updateRegistration,
    deleteRegistration,
    goToRegistrationsPage,
    // Realtime
    setupRealtimeSubscriptions,
    unsubscribeRealtime,
  }
}
