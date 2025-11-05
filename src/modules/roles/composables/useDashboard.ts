// src/modules/roles/composables/useDashboard.ts

import { ref, computed, onUnmounted } from 'vue'
import { supabase } from '../../../../utils/supabase'
import type { RealtimeChannel } from '@supabase/supabase-js'

export interface CarouselSlide {
  id: number
  title: string
  description: string
  image_url: string
  order_index: number
  is_active: boolean
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface DashboardActivity {
  id: number
  name: string
  description: string
  type: string
  date: string
  time: string
  location: string
  image_url: string | null
  capacity: number
  enrolled_count: number
  status: 'upcoming' | 'ongoing' | 'completed'
  created_at: string
}

export const useDashboard = () => {
  const carouselSlides = ref<CarouselSlide[]>([])
  const activities = ref<DashboardActivity[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  let realtimeChannel: RealtimeChannel | null = null

  /**
   * Fetch carousel slides
   */
  const fetchCarouselSlides = async () => {
    loading.value = true
    error.value = null

    try {
      const { data, error: fetchError } = await supabase
        .from('carousel_slides')
        .select('*')
        .eq('is_active', true)
        .order('order_index', { ascending: true })

      if (fetchError) throw fetchError

      carouselSlides.value = data || []
    } catch (err: any) {
      error.value = err.message
      console.error('Error fetching carousel slides:', err)
    } finally {
      loading.value = false
    }
  }

  /**
   * Fetch dashboard activities (upcoming activities with enrollment counts)
   */
  const fetchDashboardActivities = async () => {
    loading.value = true
    error.value = null

    try {
      // Fetch activities with booking counts
      const { data, error: fetchError } = await supabase
        .from('activities')
        .select(
          `
          *,
          bookings:bookings(count)
        `,
        )
        .order('created_at', { ascending: false })
        .limit(6)

      if (fetchError) throw fetchError

      // Transform the data
      activities.value =
        data?.map((activity: any) => ({
          id: activity.id,
          name: activity.name,
          description: activity.description,
          type: activity.type,
          date: new Date().toISOString().split('T')[0], // You can add date field to activities table
          time: '10:00 AM', // You can add time field to activities table
          location: activity.location,
          image_url: activity.image_url,
          capacity: activity.capacity,
          enrolled_count: activity.bookings?.[0]?.count || 0,
          status: 'upcoming' as const,
          created_at: activity.created_at,
        })) || []
    } catch (err: any) {
      error.value = err.message
      console.error('Error fetching dashboard activities:', err)
    } finally {
      loading.value = false
    }
  }

  /**
   * Create carousel slide (Admin only)
   */
  const createCarouselSlide = async (
    slide: Omit<CarouselSlide, 'id' | 'created_at' | 'updated_at' | 'created_by'>,
    imageFile: File,
  ) => {
    loading.value = true
    error.value = null

    try {
      // Upload image
      const image_url = await uploadCarouselImage(imageFile)
      if (!image_url) {
        throw new Error('Failed to upload image')
      }

      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser()

      const { data, error: createError } = await supabase
        .from('carousel_slides')
        .insert([
          {
            ...slide,
            image_url,
            created_by: user?.id || null,
          },
        ])
        .select()
        .single()

      if (createError) throw createError

      await fetchCarouselSlides()

      return { success: true, data }
    } catch (err: any) {
      error.value = err.message
      console.error('Error creating carousel slide:', err)
      return { success: false, error: err.message }
    } finally {
      loading.value = false
    }
  }

  /**
   * Update carousel slide (Admin only)
   */
  const updateCarouselSlide = async (
    id: number,
    updates: Partial<Omit<CarouselSlide, 'id' | 'created_at' | 'updated_at' | 'created_by'>>,
    imageFile: File | null = null,
  ) => {
    loading.value = true
    error.value = null

    try {
      let image_url = updates.image_url

      // Upload new image if provided
      if (imageFile) {
        // Delete old image
        const oldSlide = carouselSlides.value.find((s) => s.id === id)
        if (oldSlide?.image_url) {
          await deleteCarouselImage(oldSlide.image_url)
        }

        const uploadedUrl = await uploadCarouselImage(imageFile)
        if (!uploadedUrl) {
          throw new Error('Failed to upload image')
        }
        image_url = uploadedUrl
      }

      const { data, error: updateError } = await supabase
        .from('carousel_slides')
        .update({
          ...updates,
          image_url,
        })
        .eq('id', id)
        .select()
        .single()

      if (updateError) throw updateError

      await fetchCarouselSlides()

      return { success: true, data }
    } catch (err: any) {
      error.value = err.message
      console.error('Error updating carousel slide:', err)
      return { success: false, error: err.message }
    } finally {
      loading.value = false
    }
  }

  /**
   * Delete carousel slide (Admin only)
   */
  const deleteCarouselSlide = async (id: number) => {
    loading.value = true
    error.value = null

    try {
      // Get slide to delete image
      const slide = carouselSlides.value.find((s) => s.id === id)
      if (slide?.image_url) {
        await deleteCarouselImage(slide.image_url)
      }

      const { error: deleteError } = await supabase.from('carousel_slides').delete().eq('id', id)

      if (deleteError) throw deleteError

      await fetchCarouselSlides()

      return { success: true }
    } catch (err: any) {
      error.value = err.message
      console.error('Error deleting carousel slide:', err)
      return { success: false, error: err.message }
    } finally {
      loading.value = false
    }
  }

  /**
   * Upload carousel image to Supabase Storage
   */
  const uploadCarouselImage = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = fileName

      const { error: uploadError } = await supabase.storage
        .from('carousel')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        })

      if (uploadError) throw uploadError

      // Get public URL
      const { data } = supabase.storage.from('carousel').getPublicUrl(filePath)

      return data.publicUrl
    } catch (err: any) {
      console.error('Error uploading carousel image:', err)
      error.value = 'Failed to upload image'
      return null
    }
  }

  /**
   * Delete carousel image from Supabase Storage
   */
  const deleteCarouselImage = async (imageUrl: string): Promise<boolean> => {
    try {
      const urlParts = imageUrl.split('/carousel/')
      if (urlParts.length < 2) return false

      const filePath = urlParts[1]

      const { error: deleteError } = await supabase.storage.from('carousel').remove([filePath])

      if (deleteError) throw deleteError

      return true
    } catch (err: any) {
      console.error('Error deleting carousel image:', err)
      return false
    }
  }

  /**
   * Reorder carousel slides
   */
  const reorderSlides = async (slideIds: number[]) => {
    loading.value = true
    error.value = null

    try {
      // Update order_index for each slide
      const updates = slideIds.map((id, index) =>
        supabase.from('carousel_slides').update({ order_index: index }).eq('id', id),
      )

      await Promise.all(updates)

      await fetchCarouselSlides()

      return { success: true }
    } catch (err: any) {
      error.value = err.message
      console.error('Error reordering slides:', err)
      return { success: false, error: err.message }
    } finally {
      loading.value = false
    }
  }

  /**
   * Setup real-time subscription
   */
  const setupRealtimeSubscription = () => {
    realtimeChannel = supabase
      .channel('dashboard-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'carousel_slides',
        },
        async () => {
          await fetchCarouselSlides()
        },
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'activities',
        },
        async () => {
          await fetchDashboardActivities()
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
    carouselSlides,
    activities,
    loading,
    error,

    // Methods
    fetchCarouselSlides,
    fetchDashboardActivities,
    createCarouselSlide,
    updateCarouselSlide,
    deleteCarouselSlide,
    reorderSlides,
    setupRealtimeSubscription,
    unsubscribeRealtime,
  }
}
