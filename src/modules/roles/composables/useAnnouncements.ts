// src/modules/roles/composables/useAnnouncements.ts

import { ref, computed, onUnmounted } from 'vue'
import { supabase } from '../../../../utils/supabase'
import type { RealtimeChannel } from '@supabase/supabase-js'

export interface Announcement {
  id: number
  title: string
  description: string
  duration: string
  image_url: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface PaginationOptions {
  page: number
  itemsPerPage: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export const useAnnouncements = () => {
  const announcements = ref<Announcement[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const totalCount = ref(0)
  const searchQuery = ref('')

  let realtimeChannel: RealtimeChannel | null = null

  // Pagination state
  const currentPage = ref(1)
  const itemsPerPage = ref(10)
  const sortBy = ref('created_at')
  const sortOrder = ref<'asc' | 'desc'>('desc')

  // Computed pagination info
  const totalPages = computed(() => Math.ceil(totalCount.value / itemsPerPage.value))
  const hasNextPage = computed(() => currentPage.value < totalPages.value)
  const hasPreviousPage = computed(() => currentPage.value > 1)

  /**
   * Fetch announcements with pagination and search
   */
  const fetchAnnouncements = async (
    options?: Partial<PaginationOptions> & { append?: boolean },
  ) => {
    loading.value = true
    error.value = null

    // Update pagination options if provided
    if (options) {
      if (options.page) currentPage.value = options.page
      if (options.itemsPerPage) itemsPerPage.value = options.itemsPerPage
      if (options.sortBy) sortBy.value = options.sortBy
      if (options.sortOrder) sortOrder.value = options.sortOrder
    }

    try {
      // Build query
      let query = supabase.from('announcements').select('*', { count: 'exact' })

      // Apply search filter if exists
      if (searchQuery.value) {
        query = query.or(
          `title.ilike.%${searchQuery.value}%,description.ilike.%${searchQuery.value}%`,
        )
      }

      // Apply sorting
      query = query.order(sortBy.value, { ascending: sortOrder.value === 'asc' })

      // Apply pagination
      const from = (currentPage.value - 1) * itemsPerPage.value
      const to = from + itemsPerPage.value - 1
      query = query.range(from, to)

      const { data, error: fetchError, count } = await query

      if (fetchError) throw fetchError

      // Append or replace data based on options
      if (options?.append) {
        announcements.value = [...announcements.value, ...(data || [])]
      } else {
        announcements.value = data || []
      }
      totalCount.value = count || 0
    } catch (err: any) {
      error.value = err.message
      console.error('Error fetching announcements:', err)
    } finally {
      loading.value = false
    }
  }

  /**
   * Load more announcements for infinite scroll
   */
  const loadMoreAnnouncements = async () => {
    if (currentPage.value < totalPages.value) {
      currentPage.value += 1
      await fetchAnnouncements({ append: true })
    }
  }

  /**
   * Search announcements
   */
  const searchAnnouncements = async (query: string) => {
    searchQuery.value = query
    currentPage.value = 1 // Reset to first page on new search
    await fetchAnnouncements()
  }

  /**
   * Clear search
   */
  const clearSearch = async () => {
    searchQuery.value = ''
    currentPage.value = 1
    await fetchAnnouncements()
  }

  /**
   * Change page
   */
  const goToPage = async (page: number) => {
    if (page >= 1 && page <= totalPages.value) {
      currentPage.value = page
      await fetchAnnouncements()
    }
  }

  /**
   * Next page
   */
  const nextPage = async () => {
    if (hasNextPage.value) {
      await goToPage(currentPage.value + 1)
    }
  }

  /**
   * Previous page
   */
  const previousPage = async () => {
    if (hasPreviousPage.value) {
      await goToPage(currentPage.value - 1)
    }
  }

  /**
   * Create new announcement (Admin only)
   */
  const createAnnouncement = async (
    announcement: Omit<Announcement, 'id' | 'created_at' | 'updated_at' | 'created_by'>,
    imageFile: File | null = null,
  ) => {
    loading.value = true
    error.value = null

    try {
      let image_url = announcement.image_url

      // Upload image if provided
      if (imageFile) {
        image_url = await uploadImage(imageFile)
        if (!image_url) {
          throw new Error('Failed to upload image')
        }
      }

      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser()

      const { data, error: createError } = await supabase
        .from('announcements')
        .insert([
          {
            ...announcement,
            image_url,
            created_by: user?.id || null,
          },
        ])
        .select()
        .single()

      if (createError) throw createError

      // Refresh the list to include the new announcement
      await fetchAnnouncements()

      return { success: true, data }
    } catch (err: any) {
      error.value = err.message
      console.error('Error creating announcement:', err)
      return { success: false, error: err.message }
    } finally {
      loading.value = false
    }
  }

  /**
   * Update announcement (Admin only)
   */
  const updateAnnouncement = async (
    id: number,
    updates: Partial<Omit<Announcement, 'id' | 'created_at' | 'updated_at' | 'created_by'>>,
    imageFile: File | null = null,
  ) => {
    loading.value = true
    error.value = null

    try {
      let image_url = updates.image_url

      // Upload new image if provided
      if (imageFile) {
        // Delete old image if exists
        const oldAnnouncement = announcements.value.find((a) => a.id === id)
        if (oldAnnouncement?.image_url) {
          await deleteImage(oldAnnouncement.image_url)
        }

        image_url = await uploadImage(imageFile)
        if (!image_url) {
          throw new Error('Failed to upload image')
        }
      }

      const { data, error: updateError } = await supabase
        .from('announcements')
        .update({
          ...updates,
          image_url,
        })
        .eq('id', id)
        .select()
        .single()

      if (updateError) throw updateError

      // Update local state
      const index = announcements.value.findIndex((a) => a.id === id)
      if (index !== -1) {
        announcements.value[index] = data
      }

      return { success: true, data }
    } catch (err: any) {
      error.value = err.message
      console.error('Error updating announcement:', err)
      return { success: false, error: err.message }
    } finally {
      loading.value = false
    }
  }

  /**
   * Delete announcement (Admin only)
   */
  const deleteAnnouncement = async (id: number) => {
    loading.value = true
    error.value = null

    try {
      // Get announcement to delete image
      const announcement = announcements.value.find((a) => a.id === id)
      if (announcement?.image_url) {
        await deleteImage(announcement.image_url)
      }

      const { error: deleteError } = await supabase.from('announcements').delete().eq('id', id)

      if (deleteError) throw deleteError

      // Remove from local state
      announcements.value = announcements.value.filter((a) => a.id !== id)
      totalCount.value -= 1

      // If current page is empty and not the first page, go to previous page
      if (announcements.value.length === 0 && currentPage.value > 1) {
        await previousPage()
      }

      return { success: true }
    } catch (err: any) {
      error.value = err.message
      console.error('Error deleting announcement:', err)
      return { success: false, error: err.message }
    } finally {
      loading.value = false
    }
  }

  /**
   * Upload image to Supabase Storage
   */
  const uploadImage = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = fileName

      const { error: uploadError } = await supabase.storage
        .from('announcements')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        })

      if (uploadError) throw uploadError

      // Get public URL
      const { data } = supabase.storage.from('announcements').getPublicUrl(filePath)

      return data.publicUrl
    } catch (err: any) {
      console.error('Error uploading image:', err)
      error.value = 'Failed to upload image'
      return null
    }
  }

  /**
   * Delete image from Supabase Storage
   */
  const deleteImage = async (imageUrl: string): Promise<boolean> => {
    try {
      // Extract file path from URL
      const urlParts = imageUrl.split('/announcements/')
      if (urlParts.length < 2) return false

      const filePath = urlParts[1]

      const { error: deleteError } = await supabase.storage.from('announcements').remove([filePath])

      if (deleteError) throw deleteError

      return true
    } catch (err: any) {
      console.error('Error deleting image:', err)
      return false
    }
  }

  /**
   * Setup real-time subscription
   */
  const setupRealtimeSubscription = () => {
    realtimeChannel = supabase
      .channel('announcements-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'announcements',
        },
        async (payload) => {
          console.log('Real-time change received:', payload)

          if (payload.eventType === 'INSERT') {
            // Refresh to get the new announcement in the right page
            await fetchAnnouncements()
          } else if (payload.eventType === 'UPDATE') {
            // Update the specific announcement
            const index = announcements.value.findIndex((a) => a.id === payload.new.id)
            if (index !== -1) {
              announcements.value[index] = payload.new as Announcement
            }
          } else if (payload.eventType === 'DELETE') {
            // Remove the deleted announcement
            announcements.value = announcements.value.filter((a) => a.id !== payload.old.id)
            totalCount.value -= 1
          }
        },
      )
      .subscribe()
  }

  /**
   * Unsubscribe from real-time updates
   */
  const unsubscribeRealtime = () => {
    if (realtimeChannel) {
      supabase.removeChannel(realtimeChannel)
      realtimeChannel = null
    }
  }

  // Cleanup on component unmount
  onUnmounted(() => {
    unsubscribeRealtime()
  })

  return {
    // State
    announcements,
    loading,
    error,
    totalCount,
    searchQuery,
    currentPage,
    itemsPerPage,
    sortBy,
    sortOrder,

    // Computed
    totalPages,
    hasNextPage,
    hasPreviousPage,

    // Methods
    fetchAnnouncements,
    loadMoreAnnouncements,
    searchAnnouncements,
    clearSearch,
    goToPage,
    nextPage,
    previousPage,
    createAnnouncement,
    updateAnnouncement,
    deleteAnnouncement,
    setupRealtimeSubscription,
    unsubscribeRealtime,
  }
}
