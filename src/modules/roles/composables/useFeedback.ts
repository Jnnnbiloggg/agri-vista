// src/modules/roles/composables/useFeedback.ts

import { ref, computed } from 'vue'

import { useAuthStore } from '@/stores/auth'
import type { RealtimeChannel } from '@supabase/supabase-js'
import { supabase } from '../../../../utils/supabase'

export interface Feedback {
  id: number
  user_id: string
  user_name: string
  user_email: string
  profession: string
  feedback_type: 'general' | 'product'
  product: string | null
  message: string
  rating: number
  is_public: boolean
  created_at: string
  updated_at: string
}

export interface PaginationOptions {
  page: number
  itemsPerPage: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export const useFeedback = () => {
  const authStore = useAuthStore()

  // State
  const feedbacks = ref<Feedback[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Pagination state
  const feedbacksTotal = ref(0)
  const feedbacksPage = ref(1)
  const itemsPerPage = ref(10)
  const feedbacksSearchQuery = ref('')

  let feedbacksChannel: RealtimeChannel | null = null

  // Computed pagination info
  const feedbacksTotalPages = computed(() => Math.ceil(feedbacksTotal.value / itemsPerPage.value))

  // ============================================
  // FEEDBACKS
  // ============================================

  const fetchFeedbacks = async (options?: Partial<PaginationOptions> & { append?: boolean }) => {
    loading.value = true
    error.value = null

    try {
      const page = options?.page ?? feedbacksPage.value
      const limit = options?.itemsPerPage ?? itemsPerPage.value
      const offset = (page - 1) * limit

      let query = supabase
        .from('feedbacks')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      // Apply search if there's a query
      if (feedbacksSearchQuery.value) {
        query = query.or(
          `message.ilike.%${feedbacksSearchQuery.value}%,user_name.ilike.%${feedbacksSearchQuery.value}%,product.ilike.%${feedbacksSearchQuery.value}%`,
        )
      }

      // If user is not admin, only show public feedbacks + their own
      if (!authStore.isAdmin) {
        query = query.or(`is_public.eq.true,user_id.eq.${authStore.userId}`)
      }

      const { data, error: fetchError, count } = await query

      if (fetchError) throw fetchError

      // Append or replace data based on options
      if (options?.append) {
        feedbacks.value = [...feedbacks.value, ...(data || [])]
      } else {
        feedbacks.value = data || []
      }
      feedbacksTotal.value = count || 0
      feedbacksPage.value = page
    } catch (err: any) {
      error.value = err.message
      console.error('Error fetching feedbacks:', err)
    } finally {
      loading.value = false
    }
  }

  const loadMoreFeedbacks = async () => {
    if (feedbacksPage.value < feedbacksTotalPages.value) {
      feedbacksPage.value += 1
      await fetchFeedbacks({ append: true })
    }
  }

  const searchFeedbacks = async (query: string) => {
    feedbacksSearchQuery.value = query
    feedbacksPage.value = 1
    await fetchFeedbacks()
  }

  const clearFeedbacksSearch = async () => {
    feedbacksSearchQuery.value = ''
    await fetchFeedbacks()
  }

  const createFeedback = async (
    feedback: Omit<
      Feedback,
      'id' | 'created_at' | 'updated_at' | 'user_id' | 'user_name' | 'user_email'
    >,
  ) => {
    loading.value = true
    error.value = null

    try {
      const newFeedback = {
        ...feedback,
        user_id: authStore.userId,
        user_name: authStore.fullName,
        user_email: authStore.userEmail,
      }

      const { data, error: createError } = await supabase
        .from('feedbacks')
        .insert([newFeedback])
        .select()
        .single()

      if (createError) throw createError

      // Refresh feedbacks list
      await fetchFeedbacks()

      return data
    } catch (err: any) {
      error.value = err.message
      console.error('Error creating feedback:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  const updateFeedback = async (
    id: number,
    updates: Partial<Omit<Feedback, 'id' | 'created_at' | 'updated_at' | 'user_id'>>,
  ) => {
    loading.value = true
    error.value = null

    try {
      const { data, error: updateError } = await supabase
        .from('feedbacks')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (updateError) throw updateError

      // Refresh feedbacks list
      await fetchFeedbacks()

      return data
    } catch (err: any) {
      error.value = err.message
      console.error('Error updating feedback:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  const deleteFeedback = async (id: number) => {
    loading.value = true
    error.value = null

    try {
      const { error: deleteError } = await supabase.from('feedbacks').delete().eq('id', id)

      if (deleteError) throw deleteError

      // Refresh feedbacks list
      await fetchFeedbacks()
    } catch (err: any) {
      error.value = err.message
      console.error('Error deleting feedback:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // ============================================
  // ANALYTICS
  // ============================================

  const calculateRatings = (type: 'general' | 'product', productName?: string) => {
    const filtered = feedbacks.value.filter((f) => {
      if (type === 'general') return f.feedback_type === 'general'
      return (
        f.feedback_type === 'product' && f.product?.toLowerCase() === productName?.toLowerCase()
      )
    })

    const positive = filtered.filter((f) => f.rating >= 4).length
    const negative = filtered.filter((f) => f.rating < 4).length

    return { positive, negative, total: filtered.length }
  }

  // ============================================
  // REALTIME SUBSCRIPTION
  // ============================================

  const setupRealtimeSubscription = () => {
    // Clean up existing subscription
    if (feedbacksChannel) {
      supabase.removeChannel(feedbacksChannel)
    }

    // Subscribe to feedbacks changes
    feedbacksChannel = supabase
      .channel('feedbacks_channel')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'feedbacks',
        },
        async (payload) => {
          console.log('Feedbacks change received:', payload)

          // Refresh data when changes occur
          await fetchFeedbacks()
        },
      )
      .subscribe()
  }

  const cleanupRealtimeSubscription = () => {
    if (feedbacksChannel) {
      supabase.removeChannel(feedbacksChannel)
      feedbacksChannel = null
    }
  }

  /**
   * Change page for feedbacks
   */
  const goToFeedbacksPage = async (page: number) => {
    if (page >= 1 && page <= feedbacksTotalPages.value) {
      feedbacksPage.value = page
      await fetchFeedbacks()
    }
  }

  return {
    // State
    feedbacks,
    loading,
    error,
    feedbacksTotal,
    feedbacksPage,
    itemsPerPage,
    feedbacksSearchQuery,
    feedbacksTotalPages,

    // Methods
    fetchFeedbacks,
    loadMoreFeedbacks,
    searchFeedbacks,
    clearFeedbacksSearch,
    createFeedback,
    updateFeedback,
    deleteFeedback,
    calculateRatings,
    goToFeedbacksPage,
    setupRealtimeSubscription,
    cleanupRealtimeSubscription,
  }
}
