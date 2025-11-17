// src/modules/roles/composables/useProducts.ts

import { ref, computed, onUnmounted } from 'vue'

import type { RealtimeChannel } from '@supabase/supabase-js'
import { useAuthStore } from '@/stores/auth'
import { supabase } from '../../../../utils/supabase'

export interface Product {
  id: number
  name: string
  category: string
  description: string | null
  price: number
  stock: number
  images: string[]
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface Order {
  id: number
  product_id: number
  product_name: string
  quantity: number
  total_price: number
  user_id: string
  buyer_name: string
  buyer_email: string
  order_status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
  created_at: string
  updated_at: string
}

export interface PaginationOptions {
  page: number
  itemsPerPage: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export const useProducts = () => {
  const authStore = useAuthStore()

  // State
  const products = ref<Product[]>([])
  const orders = ref<Order[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Pagination state
  const productsTotal = ref(0)
  const ordersTotal = ref(0)

  const productsPage = ref(1)
  const ordersPage = ref(1)

  const itemsPerPage = ref(10)
  const productsSearchQuery = ref('')
  const ordersSearchQuery = ref('')

  let productsChannel: RealtimeChannel | null = null
  let ordersChannel: RealtimeChannel | null = null

  // Computed pagination info
  const productsTotalPages = computed(() => Math.ceil(productsTotal.value / itemsPerPage.value))
  const ordersTotalPages = computed(() => Math.ceil(ordersTotal.value / itemsPerPage.value))

  // ============================================
  // PRODUCTS
  // ============================================

  const fetchProducts = async (options?: Partial<PaginationOptions> & { append?: boolean }) => {
    loading.value = true
    error.value = null

    if (options?.page) productsPage.value = options.page
    if (options?.itemsPerPage) itemsPerPage.value = options.itemsPerPage

    try {
      const from = (productsPage.value - 1) * itemsPerPage.value
      const to = from + itemsPerPage.value - 1

      let query = supabase
        .from('products')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to)

      // Search functionality
      if (productsSearchQuery.value) {
        query = query.or(
          `name.ilike.%${productsSearchQuery.value}%,category.ilike.%${productsSearchQuery.value}%,description.ilike.%${productsSearchQuery.value}%`,
        )
      }

      const { data, error: fetchError, count } = await query

      if (fetchError) throw fetchError

      // Append or replace data based on options
      if (options?.append) {
        products.value = [...products.value, ...(data || [])]
      } else {
        products.value = data || []
      }
      productsTotal.value = count || 0
    } catch (err: any) {
      error.value = err.message
      console.error('Error fetching products:', err)
    } finally {
      loading.value = false
    }
  }

  const loadMoreProducts = async () => {
    if (productsPage.value < productsTotalPages.value) {
      productsPage.value += 1
      await fetchProducts({ append: true })
    }
  }

  const searchProducts = async (query: string) => {
    productsSearchQuery.value = query
    productsPage.value = 1
    await fetchProducts()
  }

  const clearProductsSearch = async () => {
    productsSearchQuery.value = ''
    productsPage.value = 1
    await fetchProducts()
  }

  const createProduct = async (
    product: Omit<Product, 'id' | 'created_at' | 'updated_at' | 'created_by'>,
    imageFiles: File[] = [],
  ) => {
    loading.value = true
    error.value = null

    try {
      let imageUrls: string[] = []

      // Upload images if provided
      if (imageFiles.length > 0) {
        const uploadPromises = imageFiles.map((file) => uploadImage(file))
        const results = await Promise.all(uploadPromises)
        imageUrls = results.filter((url): url is string => url !== null)
      }

      const { data, error: createError } = await supabase
        .from('products')
        .insert([
          {
            ...product,
            images: imageUrls,
            created_by: authStore.userId,
          },
        ])
        .select()
        .single()

      if (createError) throw createError

      await fetchProducts()
      return { success: true, data }
    } catch (err: any) {
      error.value = err.message
      console.error('Error creating product:', err)
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  const updateProduct = async (
    id: number,
    updates: Partial<Omit<Product, 'id' | 'created_at' | 'updated_at' | 'created_by'>>,
    imageFiles: File[] = [],
    deleteOldImages: boolean = false,
  ) => {
    loading.value = true
    error.value = null

    try {
      // Get the existing product to access old images
      const { data: existingProduct } = await supabase
        .from('products')
        .select('images')
        .eq('id', id)
        .single()

      let imageUrls = updates.images || []

      // If new images are being uploaded, delete old images and replace them
      if (imageFiles.length > 0) {
        // Delete old images from storage
        if (existingProduct?.images && existingProduct.images.length > 0) {
          await Promise.all(existingProduct.images.map((url: string) => deleteImage(url)))
        }

        // Upload new images
        const uploadPromises = imageFiles.map((file) => uploadImage(file))
        const results = await Promise.all(uploadPromises)
        imageUrls = results.filter((url): url is string => url !== null)
      } else if (deleteOldImages && imageUrls.length > 0) {
        // Delete old images if explicitly requested
        await Promise.all(imageUrls.map((url) => deleteImage(url)))
        imageUrls = []
      }

      const { data, error: updateError } = await supabase
        .from('products')
        .update({
          ...updates,
          images: imageUrls,
        })
        .eq('id', id)
        .select()
        .single()

      if (updateError) throw updateError

      await fetchProducts()
      return { success: true, data }
    } catch (err: any) {
      error.value = err.message
      console.error('Error updating product:', err)
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  const deleteProduct = async (id: number) => {
    loading.value = true
    error.value = null

    try {
      // Get product to delete images
      const { data: product } = await supabase
        .from('products')
        .select('images')
        .eq('id', id)
        .single()

      // Delete images if exist
      if (product?.images && product.images.length > 0) {
        await Promise.all(product.images.map((url: string) => deleteImage(url)))
      }

      const { error: deleteError } = await supabase.from('products').delete().eq('id', id)

      if (deleteError) throw deleteError

      await fetchProducts()
      return { success: true }
    } catch (err: any) {
      error.value = err.message
      console.error('Error deleting product:', err)
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  // ============================================
  // ORDERS
  // ============================================

  const fetchOrders = async (options?: Partial<PaginationOptions>) => {
    loading.value = true
    error.value = null

    if (options?.page) ordersPage.value = options.page
    if (options?.itemsPerPage) itemsPerPage.value = options.itemsPerPage

    try {
      const from = (ordersPage.value - 1) * itemsPerPage.value
      const to = from + itemsPerPage.value - 1

      let query = supabase
        .from('orders')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to)

      // If user is not admin, only show their orders
      if (!authStore.isAdmin) {
        query = query.eq('user_id', authStore.userId)
      }

      // Search functionality
      if (ordersSearchQuery.value) {
        query = query.or(
          `product_name.ilike.%${ordersSearchQuery.value}%,buyer_name.ilike.%${ordersSearchQuery.value}%,buyer_email.ilike.%${ordersSearchQuery.value}%`,
        )
      }

      const { data, error: fetchError, count } = await query

      if (fetchError) throw fetchError

      orders.value = data || []
      ordersTotal.value = count || 0
    } catch (err: any) {
      error.value = err.message
      console.error('Error fetching orders:', err)
    } finally {
      loading.value = false
    }
  }

  const searchOrders = async (query: string) => {
    ordersSearchQuery.value = query
    ordersPage.value = 1
    await fetchOrders()
  }

  const clearOrdersSearch = async () => {
    ordersSearchQuery.value = ''
    ordersPage.value = 1
    await fetchOrders()
  }

  const createOrder = async (
    order: Omit<
      Order,
      'id' | 'created_at' | 'updated_at' | 'user_id' | 'buyer_name' | 'buyer_email'
    >,
  ) => {
    loading.value = true
    error.value = null

    try {
      const { data, error: createError } = await supabase
        .from('orders')
        .insert([
          {
            ...order,
            user_id: authStore.userId,
            buyer_name: authStore.fullName,
            buyer_email: authStore.userEmail,
          },
        ])
        .select()
        .single()

      if (createError) throw createError

      // Update product stock
      const { error: updateError } = await supabase.rpc('decrement_product_stock', {
        product_id: order.product_id,
        quantity: order.quantity,
      })

      if (updateError) {
        console.warn('Could not update product stock:', updateError)
      }

      await fetchOrders()
      await fetchProducts() // Refresh products to show updated stock
      return { success: true, data }
    } catch (err: any) {
      error.value = err.message
      console.error('Error creating order:', err)
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  const updateOrder = async (id: number, updates: Partial<Order>) => {
    loading.value = true
    error.value = null

    try {
      const { data, error: updateError } = await supabase
        .from('orders')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (updateError) throw updateError

      await fetchOrders()
      return { success: true, data }
    } catch (err: any) {
      error.value = err.message
      console.error('Error updating order:', err)
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  const deleteOrder = async (id: number) => {
    loading.value = true
    error.value = null

    try {
      const { error: deleteError } = await supabase.from('orders').delete().eq('id', id)

      if (deleteError) throw deleteError

      await fetchOrders()
      return { success: true }
    } catch (err: any) {
      error.value = err.message
      console.error('Error deleting order:', err)
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
        .from('products')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        })

      if (uploadError) throw uploadError

      const {
        data: { publicUrl },
      } = supabase.storage.from('products').getPublicUrl(filePath)

      return publicUrl
    } catch (err: any) {
      console.error('Error uploading image:', err)
      return null
    }
  }

  const deleteImage = async (imageUrl: string): Promise<boolean> => {
    try {
      const path = imageUrl.split('/products/').pop()
      if (!path) return false

      const { error: deleteError } = await supabase.storage.from('products').remove([path])

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
    // Products subscription
    productsChannel = supabase
      .channel('products-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'products',
        },
        async (payload) => {
          console.log('Products change received:', payload)
          await fetchProducts()
        },
      )
      .subscribe()

    // Orders subscription
    ordersChannel = supabase
      .channel('orders-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
        },
        async (payload) => {
          console.log('Orders change received:', payload)
          await fetchOrders()
        },
      )
      .subscribe()
  }

  const unsubscribeRealtime = () => {
    if (productsChannel) {
      supabase.removeChannel(productsChannel)
      productsChannel = null
    }
    if (ordersChannel) {
      supabase.removeChannel(ordersChannel)
      ordersChannel = null
    }
  }

  /**
   * Change page for products
   */
  const goToProductsPage = async (page: number) => {
    if (page >= 1 && page <= productsTotalPages.value) {
      productsPage.value = page
      await fetchProducts()
    }
  }

  /**
   * Change page for orders
   */
  const goToOrdersPage = async (page: number) => {
    if (page >= 1 && page <= ordersTotalPages.value) {
      ordersPage.value = page
      await fetchOrders()
    }
  }

  return {
    // State
    products,
    orders,
    loading,
    error,

    // Pagination
    productsTotal,
    ordersTotal,
    productsPage,
    ordersPage,
    itemsPerPage,
    productsSearchQuery,
    ordersSearchQuery,
    productsTotalPages,
    ordersTotalPages,

    // Products methods
    fetchProducts,
    loadMoreProducts,
    searchProducts,
    clearProductsSearch,
    createProduct,
    updateProduct,
    deleteProduct,
    goToProductsPage,

    // Orders methods
    fetchOrders,
    searchOrders,
    clearOrdersSearch,
    createOrder,
    updateOrder,
    deleteOrder,
    goToOrdersPage,

    // Realtime
    setupRealtimeSubscriptions,
    unsubscribeRealtime,
  }
}
