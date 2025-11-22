<script setup lang="ts">
import { ref, computed, onMounted, inject, type Ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useProducts } from '../composables/useProducts'
import { useInfiniteScroll } from '@/composables/useInfiniteScroll'
import { useSnackbar } from '@/composables/useSnackbar'
import { useFormDialog } from '@/composables/useFormDialog'
import { useImageHandler } from '@/composables/useImageHandler'
import { useDeleteConfirmation } from '@/composables/useDeleteConfirmation'
import { usePageActions } from '@/composables/usePageActions'
import { formatDate } from '@/utils/formatters'
import HeaderActions from './shared/HeaderActions.vue'
import AppSnackbar from '@/components/shared/AppSnackbar.vue'
import DeleteConfirmDialog from '@/components/shared/DeleteConfirmDialog.vue'
import DrawerToggle from '@/components/shared/DrawerToggle.vue'
import PageHeader from './shared/PageHeader.vue'

interface Props {
  userType: 'admin' | 'user'
}

const props = defineProps<Props>()

const drawer = inject<Ref<boolean>>('drawer')

// Get user info from auth store
const authStore = useAuthStore()
const userName = computed(() => authStore.fullName)
const userEmail = computed(() => authStore.userEmail)

// Use products composable
const {
  products,
  orders,
  loading,
  error,
  productsTotal,
  ordersTotal,
  productsPage,
  ordersPage,
  itemsPerPage,
  productsTotalPages,
  ordersTotalPages,
  fetchProducts,
  loadMoreProducts,
  searchProducts,
  clearProductsSearch,
  createProduct,
  updateProduct,
  deleteProduct,
  goToProductsPage,
  fetchOrders,
  searchOrders,
  clearOrdersSearch,
  createOrder,
  updateOrder,
  deleteOrder,
  goToOrdersPage,
  setupRealtimeSubscriptions,
} = useProducts()

// Infinite scroll for user products view
const { isLoading: isLoadingMore } = useInfiniteScroll({
  onLoadMore: async () => {
    if (props.userType === 'user' && !loading.value) {
      await loadMoreProducts()
    }
  },
  hasMore: () => props.userType === 'user' && productsPage.value < productsTotalPages.value,
})

// Use snackbar composable
const { snackbar, snackbarMessage, snackbarColor, showSnackbar } = useSnackbar()

// Selected product for reservation
const selectedProduct = ref<any | null>(null)

// Use delete confirmation for products and orders
const deleteConfirmation = useDeleteConfirmation<{ type: 'product' | 'order'; id: number }>({
  onDelete: async (target) => {
    if (target.type === 'product') {
      const result = await deleteProduct(target.id)
      return { success: result.success, error: result.error || undefined }
    } else {
      const result = await deleteOrder(target.id)
      return { success: result.success, error: result.error || undefined }
    }
  },
  showSnackbar,
  successMessage: (target) =>
    `${target.type === 'product' ? 'Product' : 'Order'} deleted successfully`,
  errorMessage: (target) => `Failed to delete ${target.type}`,
})

// Use page actions composable
const { handleSearch, handleClearSearch, handleSettingsClick } = usePageActions({
  userType: props.userType,
  onSearch: async (query: string) => {
    if (adminTab.value === 'products') {
      if (query) {
        await searchProducts(query)
      } else {
        await clearProductsSearch()
      }
    } else {
      if (query) {
        await searchOrders(query)
      } else {
        await clearOrdersSearch()
      }
    }
  },
})

// Admin tab
const adminTab = ref('products')

const categories = ['Fruits', 'Vegetables', 'Herbs', 'Seeds', 'Other']

// Use image handler (supports single image only)
const {
  imagePreviews,
  imageFiles,
  handleImageSelect,
  removeImageAtIndex,
  clearAllImages,
  error: imageError,
} = useImageHandler({
  multiple: false,
  maxSizeInMB: 5,
  allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
})

// Product dialog (admin)
interface ProductForm {
  id?: number
  name: string
  category: string
  description: string
  price: number
  stock: number
}

const productDialog = useFormDialog<ProductForm>({
  initialData: {
    name: '',
    category: '',
    description: '',
    price: 0,
    stock: 0,
  },
  onOpen: () => {
    clearAllImages()
    // Load existing image for edit mode from editingItem parameter
    const editingProduct = productDialog.editingItem.value as any
    if (editingProduct?.images && editingProduct.images.length > 0) {
      imagePreviews.value = [editingProduct.images[0]]
    }
  },
  onSubmit: async (formData) => {
    if (!formData.name || !formData.category || !formData.price) {
      return { success: false, error: 'Please fill in all required fields' }
    }

    try {
      let result
      if (formData.id) {
        result = await updateProduct(
          formData.id,
          {
            name: formData.name,
            category: formData.category,
            description: formData.description,
            price: formData.price,
            stock: formData.stock,
            images: imagePreviews.value.filter((url) => url.startsWith('http')).slice(0, 1),
          },
          imageFiles.value.slice(0, 1),
        )
      } else {
        result = await createProduct(
          {
            name: formData.name,
            category: formData.category,
            description: formData.description,
            price: formData.price,
            stock: formData.stock,
            images: [],
          },
          imageFiles.value.slice(0, 1),
        )
      }

      if (result.success) {
        return { success: true }
      } else {
        return { success: false, error: result.error || 'Failed to save product' }
      }
    } catch (err: any) {
      return { success: false, error: err.message || 'An error occurred' }
    }
  },
  showSnackbar,
})

// Reservation dialog (user)
interface ReservationForm {
  quantity: number
}

const reservationDialog = useFormDialog<ReservationForm>({
  initialData: {
    quantity: 1,
  },
  onSubmit: async (formData) => {
    if (!selectedProduct.value) {
      return { success: false, error: 'No product selected' }
    }

    if (formData.quantity > selectedProduct.value.stock) {
      return { success: false, error: 'Quantity exceeds available stock' }
    }

    try {
      const totalPrice = selectedProduct.value.price * formData.quantity
      const result = await createOrder({
        product_id: selectedProduct.value.id,
        product_name: selectedProduct.value.name,
        quantity: formData.quantity,
        total_price: totalPrice,
        order_status: 'pending',
      })

      if (result.success) {
        return { success: true }
      } else {
        return { success: false, error: result.error || 'Failed to place order' }
      }
    } catch (err: any) {
      return { success: false, error: err.message || 'An error occurred' }
    }
  },
  showSnackbar,
})

// Load data on component mount
onMounted(async () => {
  if (props.userType === 'admin') {
    await fetchProducts()
    await fetchOrders()
  } else {
    await fetchProducts()
  }
  setupRealtimeSubscriptions()
})

// Admin functions
const handleAddProduct = () => productDialog.openForCreate()

const handleEditProduct = (product: any) => {
  productDialog.openForEdit({
    id: product.id,
    name: product.name,
    category: product.category,
    description: product.description || '',
    price: product.price,
    stock: product.stock,
  })
}

const confirmDelete = (type: 'product' | 'order', id: number) => {
  deleteConfirmation.openDialog({ type, id })
}

const pageTitle = computed(() =>
  props.userType === 'admin' ? 'Product Management' : 'Farm Products',
)

const pageSubtitle = computed(() =>
  props.userType === 'admin'
    ? 'Manage products and orders'
    : 'Browse and reserve fresh farm products',
)

const updateOrderStatus = async (
  orderId: number,
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled',
) => {
  try {
    const result = await updateOrder(orderId, { order_status: status })
    if (result.success) {
      showSnackbar(`Order ${status} successfully!`, 'success')
    } else {
      showSnackbar(result.error || 'Failed to update order status', 'error')
    }
  } catch (err: any) {
    showSnackbar(err.message || 'An error occurred', 'error')
  }
}

const downloadSalesHistory = () => {
  const csvContent = [
    ['Product Name', 'Quantity', 'Total Price', 'Buyer', 'Date Ordered', 'Status'],
    ...orders.value.map((o) => [
      o.product_name,
      o.quantity,
      o.total_price,
      o.buyer_name,
      o.created_at.split('T')[0],
      o.order_status,
    ]),
  ]
    .map((row) => row.join(','))
    .join('\n')

  const blob = new Blob([csvContent], { type: 'text/csv' })
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `sales_history_${new Date().toISOString().split('T')[0]}.csv`
  a.click()
}

// User functions
const handleReserve = (product: any) => {
  if (product.stock === 0) return
  selectedProduct.value = product
  reservationDialog.openForCreate()
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'pending':
      return 'warning'
    case 'confirmed':
      return 'info'
    case 'completed':
      return 'success'
    case 'cancelled':
      return 'error'
    default:
      return 'grey'
  }
}

const orderHeaders = [
  { title: 'Product Name', key: 'product_name' },
  { title: 'Quantity', key: 'quantity' },
  { title: 'Total Price', key: 'total_price' },
  { title: 'Buyer', key: 'buyer_name' },
  { title: 'Date Ordered', key: 'created_at' },
  { title: 'Status', key: 'order_status' },
  { title: 'Actions', key: 'actions' },
]

const productHeaders = [
  { title: 'Product', key: 'name' },
  { title: 'Category', key: 'category' },
  { title: 'Price', key: 'price' },
  { title: 'Stock', key: 'stock' },
  { title: 'Actions', key: 'actions' },
]
</script>

<template>
  <div>
    <!-- Page Header -->
    <PageHeader
      :title="pageTitle"
      :subtitle="pageSubtitle"
      :user-type="userType"
      search-placeholder="Search activities..."
      @search="handleSearch"
      @settings-click="handleSettingsClick"
    />

    <!-- Admin View -->
    <template v-if="userType === 'admin'">
      <v-tabs v-model="adminTab" bg-color="primary" class="mb-6">
        <v-tab value="products">List of Products</v-tab>
        <v-tab value="orders">Purchased Products</v-tab>
      </v-tabs>

      <!-- Products Tab -->
      <v-window v-model="adminTab">
        <v-window-item value="products">
          <v-row>
            <v-col cols="12">
              <v-card>
                <v-card-title class="pa-4 pa-md-6">
                  <!-- Mobile Layout -->
                  <div class="d-md-none">
                    <div class="d-flex align-center justify-space-between mb-3">
                      <div class="d-flex align-center gap-2">
                        <span class="text-h6">Product Inventory</span>
                        <v-chip v-if="productsTotal > 0" color="primary" size="small">{{
                          productsTotal
                        }}</v-chip>
                      </div>
                    </div>
                    <div class="d-flex flex-column gap-2">
                      <v-btn
                        color="primary"
                        variant="elevated"
                        prepend-icon="mdi-plus"
                        block
                        @click="handleAddProduct"
                      >
                        Add Product
                      </v-btn>
                      <v-pagination
                        v-if="products.length > 0"
                        v-model="productsPage"
                        :length="productsTotalPages"
                        :total-visible="3"
                        size="small"
                        rounded="circle"
                        @update:model-value="goToProductsPage"
                      ></v-pagination>
                    </div>
                  </div>

                  <!-- Desktop Layout -->
                  <div class="d-none d-md-flex justify-space-between align-center">
                    <div class="d-flex align-center gap-2">
                      <span class="text-h6">Product Inventory</span>
                      <v-chip v-if="productsTotal > 0" color="primary" size="small"
                        >{{ productsTotal }} total</v-chip
                      >
                    </div>
                    <div class="d-flex align-center gap-2">
                      <v-pagination
                        v-if="products.length > 0"
                        v-model="productsPage"
                        :length="productsTotalPages"
                        :total-visible="5"
                        size="small"
                        rounded="circle"
                        @update:model-value="goToProductsPage"
                      ></v-pagination>
                      <v-btn
                        color="primary"
                        variant="elevated"
                        prepend-icon="mdi-plus"
                        @click="handleAddProduct"
                      >
                        Add Product
                      </v-btn>
                    </div>
                  </div>
                </v-card-title>
                <v-card-text>
                  <!-- Loading State -->
                  <div v-if="loading" class="text-center py-12">
                    <v-progress-circular
                      indeterminate
                      color="primary"
                      size="64"
                    ></v-progress-circular>
                    <div class="text-h6 text-grey-darken-1 mt-4">Loading products...</div>
                  </div>

                  <!-- Empty State -->
                  <div v-else-if="products.length === 0" class="text-center py-12">
                    <v-icon
                      icon="mdi-package-variant-closed-remove"
                      size="80"
                      color="grey-lighten-1"
                    ></v-icon>
                    <div class="text-h6 text-grey-darken-1 mt-4">No products yet</div>
                    <div class="text-body-2 text-grey mt-2">
                      Get started by adding your first product
                    </div>
                    <v-btn
                      color="primary"
                      variant="elevated"
                      prepend-icon="mdi-plus"
                      class="mt-4"
                      @click="handleAddProduct"
                    >
                      Add Product
                    </v-btn>
                  </div>

                  <!-- Products Table -->
                  <v-data-table
                    v-else
                    :headers="productHeaders"
                    :items="products"
                    item-value="id"
                    hide-default-footer
                  >
                    <template v-slot:item.name="{ item }">
                      <div class="d-flex align-center">
                        <v-avatar size="60" rounded="lg" class="mr-3">
                          <v-img v-if="item.images.length > 0" :src="item.images[0]" cover></v-img>
                          <v-icon v-else icon="mdi-image-off-outline"></v-icon>
                        </v-avatar>
                        <div class="font-weight-medium">{{ item.name }}</div>
                      </div>
                    </template>

                    <template v-slot:item.price="{ item }">
                      <div class="font-weight-medium">₱{{ item.price }}</div>
                    </template>

                    <template v-slot:item.stock="{ item }">
                      <v-chip
                        :color="
                          item.stock === 0 ? 'error' : item.stock < 10 ? 'warning' : 'success'
                        "
                        size="small"
                        variant="tonal"
                      >
                        {{ item.stock }}
                      </v-chip>
                    </template>

                    <template v-slot:item.actions="{ item }">
                      <v-btn
                        icon="mdi-pencil"
                        size="small"
                        variant="text"
                        color="primary"
                        @click="handleEditProduct(item)"
                      ></v-btn>
                      <v-btn
                        icon="mdi-delete"
                        size="small"
                        variant="text"
                        color="error"
                        @click="confirmDelete('product', item.id)"
                      ></v-btn>
                    </template>
                  </v-data-table>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>
        </v-window-item>

        <!-- Orders Tab -->
        <v-window-item value="orders">
          <v-row>
            <v-col cols="12">
              <v-card>
                <v-card-title class="pa-4 pa-md-6">
                  <!-- Mobile Layout -->
                  <div class="d-md-none">
                    <div class="d-flex align-center justify-space-between mb-3">
                      <div class="d-flex align-center gap-2">
                        <span class="text-h6">Order History</span>
                        <v-chip v-if="ordersTotal > 0" color="primary" size="small">{{
                          ordersTotal
                        }}</v-chip>
                      </div>
                    </div>
                    <div class="d-flex flex-column gap-2">
                      <v-btn
                        color="success"
                        variant="elevated"
                        prepend-icon="mdi-download"
                        block
                        @click="downloadSalesHistory"
                      >
                        View Full Sales History
                      </v-btn>
                      <v-pagination
                        v-if="orders.length > 0"
                        v-model="ordersPage"
                        :length="ordersTotalPages"
                        :total-visible="3"
                        size="small"
                        rounded="circle"
                        @update:model-value="goToOrdersPage"
                      ></v-pagination>
                    </div>
                  </div>

                  <!-- Desktop Layout -->
                  <div class="d-none d-md-flex justify-space-between align-center">
                    <div class="d-flex align-center gap-2">
                      <span class="text-h6">Order History</span>
                      <v-chip v-if="ordersTotal > 0" color="primary" size="small"
                        >{{ ordersTotal }} total</v-chip
                      >
                    </div>
                    <div class="d-flex align-center gap-2">
                      <v-pagination
                        v-if="orders.length > 0"
                        v-model="ordersPage"
                        :length="ordersTotalPages"
                        :total-visible="5"
                        size="small"
                        rounded="circle"
                        @update:model-value="goToOrdersPage"
                      ></v-pagination>
                      <v-btn
                        color="success"
                        variant="elevated"
                        prepend-icon="mdi-download"
                        @click="downloadSalesHistory"
                      >
                        View Full Sales History
                      </v-btn>
                    </div>
                  </div>
                </v-card-title>
                <v-card-text>
                  <!-- Loading State -->
                  <div v-if="loading" class="text-center py-12">
                    <v-progress-circular
                      indeterminate
                      color="primary"
                      size="64"
                    ></v-progress-circular>
                    <div class="text-h6 text-grey-darken-1 mt-4">Loading orders...</div>
                  </div>

                  <!-- Empty State -->
                  <div v-else-if="orders.length === 0" class="text-center py-12">
                    <v-icon icon="mdi-cart-off" size="80" color="grey-lighten-1"></v-icon>
                    <div class="text-h6 text-grey-darken-1 mt-4">No orders yet</div>
                    <div class="text-body-2 text-grey mt-2">
                      Orders will appear here when users make purchases
                    </div>
                  </div>

                  <!-- Orders Table -->
                  <v-data-table
                    v-else
                    :headers="orderHeaders"
                    :items="orders"
                    item-value="id"
                    hide-default-footer
                  >
                    <template v-slot:item.order_status="{ item }">
                      <v-chip :color="getStatusColor(item.order_status)" class="text-capitalize">
                        {{ item.order_status }}
                      </v-chip>
                    </template>

                    <template v-slot:item.actions="{ item }">
                      <v-menu>
                        <template v-slot:activator="{ props: menuProps }">
                          <v-btn
                            icon="mdi-dots-vertical"
                            size="small"
                            variant="text"
                            v-bind="menuProps"
                          ></v-btn>
                        </template>
                        <v-list>
                          <v-list-item
                            title="Confirm"
                            @click="updateOrderStatus(item.id, 'confirmed')"
                          ></v-list-item>
                          <v-list-item
                            title="Complete"
                            @click="updateOrderStatus(item.id, 'completed')"
                          ></v-list-item>
                          <v-list-item
                            title="Cancel"
                            @click="updateOrderStatus(item.id, 'cancelled')"
                          ></v-list-item>
                        </v-list>
                      </v-menu>
                    </template>
                  </v-data-table>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>
        </v-window-item>
      </v-window>
    </template>

    <!-- User View: Product Cards -->
    <template v-if="userType === 'user'">
      <!-- Loading State -->
      <div v-if="loading" class="text-center py-12">
        <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
        <div class="text-h6 text-grey-darken-1 mt-4">Loading products...</div>
      </div>

      <!-- Empty State -->
      <div v-else-if="products.length === 0" class="text-center py-12">
        <v-card class="pa-12">
          <v-icon
            icon="mdi-package-variant-closed-remove"
            size="120"
            color="grey-lighten-1"
          ></v-icon>
          <div class="text-h5 text-grey-darken-1 mt-6">No products available yet</div>
          <div class="text-body-1 text-grey mt-2">Check back later for fresh farm products</div>
        </v-card>
      </div>

      <!-- Products Grid -->
      <v-row v-else>
        <v-col v-for="product in products" :key="product.id" cols="12" sm="6" md="4" lg="3">
          <v-card class="fill-height">
            <v-img
              v-if="product.images.length > 0"
              :src="product.images[0]"
              height="200"
              cover
            ></v-img>
            <div
              v-else
              class="bg-grey-lighten-3 d-flex align-center justify-center"
              style="height: 200px"
            >
              <v-icon icon="mdi-image-off-outline" size="64" color="grey-lighten-1"></v-icon>
            </div>

            <v-card-title>{{ product.name }}</v-card-title>

            <v-card-text>
              <v-chip color="primary" size="small" variant="tonal" class="mb-3">
                {{ product.category }}
              </v-chip>

              <div class="d-flex align-center justify-space-between">
                <div>
                  <div class="text-h5 font-weight-bold text-primary">₱{{ product.price }}</div>
                </div>
                <div class="text-caption">
                  Stock:
                  <span :class="product.stock === 0 ? 'text-error' : 'text-success'">{{
                    product.stock
                  }}</span>
                </div>
              </div>
            </v-card-text>

            <v-card-actions>
              <v-btn
                :disabled="product.stock === 0"
                color="primary"
                variant="elevated"
                block
                @click="handleReserve(product)"
              >
                {{ product.stock === 0 ? 'Out of Stock' : 'Reserve' }}
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-col>
      </v-row>

      <!-- Loading More Indicator -->
      <v-row v-if="isLoadingMore && products.length > 0" class="mt-4">
        <v-col cols="12" class="text-center">
          <v-progress-circular indeterminate color="primary" size="48"></v-progress-circular>
          <p class="text-body-2 text-grey-darken-1 mt-2">Loading more products...</p>
        </v-col>
      </v-row>

      <!-- End of List Indicator -->
      <v-row
        v-if="
          !loading && !isLoadingMore && products.length > 0 && productsPage >= productsTotalPages
        "
        class="mt-4"
      >
        <v-col cols="12" class="text-center">
          <v-divider class="mb-4"></v-divider>
          <p class="text-body-2 text-grey">You've reached the end of the list</p>
        </v-col>
      </v-row>
    </template>

    <!-- Admin Product Dialog -->
    <v-dialog v-if="userType === 'admin'" v-model="productDialog.isOpen.value" max-width="700px">
      <v-card>
        <v-card-title>
          {{ productDialog.isEditing.value ? 'Edit Product' : 'New Product' }}
        </v-card-title>
        <v-card-text>
          <v-form @submit.prevent="productDialog.submit">
            <v-row>
              <!-- Image Upload -->
              <v-col cols="12">
                <div class="text-subtitle-2 mb-2">Product Image</div>

                <div v-if="imagePreviews.length > 0" class="mb-4">
                  <div class="position-relative d-inline-block">
                    <v-img
                      :src="imagePreviews[0]"
                      height="200"
                      width="200"
                      cover
                      class="rounded"
                    ></v-img>
                    <v-btn
                      icon="mdi-close"
                      size="x-small"
                      color="error"
                      class="position-absolute"
                      style="top: 4px; right: 4px"
                      @click="removeImageAtIndex(0)"
                    ></v-btn>
                  </div>
                </div>

                <v-file-input
                  accept="image/*"
                  label="Upload Image"
                  prepend-icon="mdi-camera"
                  variant="outlined"
                  @change="handleImageSelect"
                ></v-file-input>
              </v-col>

              <v-col cols="12">
                <v-text-field
                  v-model="productDialog.formData.value.name"
                  label="Product Name *"
                  variant="outlined"
                  required
                ></v-text-field>
              </v-col>

              <v-col cols="12" md="6">
                <v-select
                  v-model="productDialog.formData.value.category"
                  label="Category *"
                  :items="categories"
                  variant="outlined"
                  required
                ></v-select>
              </v-col>

              <v-col cols="12" md="6">
                <v-text-field
                  v-model.number="productDialog.formData.value.price"
                  label="Price (₱) *"
                  type="number"
                  variant="outlined"
                  required
                ></v-text-field>
              </v-col>

              <v-col cols="12">
                <v-text-field
                  v-model.number="productDialog.formData.value.stock"
                  label="Stock Availability *"
                  type="number"
                  variant="outlined"
                  required
                  hint="Set to 0 if out of stock"
                ></v-text-field>
              </v-col>

              <v-col cols="12">
                <v-textarea
                  v-model="productDialog.formData.value.description"
                  label="Description"
                  variant="outlined"
                  rows="4"
                ></v-textarea>
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>

        <v-card-actions class="px-6 pb-6">
          <v-spacer></v-spacer>
          <v-btn variant="outlined" @click="productDialog.close">Cancel</v-btn>
          <v-btn
            color="primary"
            variant="elevated"
            :loading="productDialog.isSubmitting.value"
            @click="productDialog.submit"
          >
            {{ productDialog.isEditing.value ? 'Update' : 'Create' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- User Reserve Dialog -->
    <v-dialog v-if="userType === 'user'" v-model="reservationDialog.isOpen.value" max-width="500px">
      <v-card>
        <v-card-title>Reserve Product</v-card-title>
        <v-card-text>
          <div v-if="selectedProduct">
            <div class="text-h6 mb-2">{{ selectedProduct.name }}</div>
            <div class="text-h5 font-weight-bold text-primary mb-4">
              ₱{{ selectedProduct.price }}
            </div>

            <v-text-field
              v-model.number="reservationDialog.formData.value.quantity"
              label="Quantity"
              type="number"
              variant="outlined"
              :min="1"
              :max="selectedProduct.stock"
              required
            ></v-text-field>

            <v-alert type="info" variant="tonal" class="mt-4">
              Total: ₱{{
                (selectedProduct.price * reservationDialog.formData.value.quantity).toFixed(2)
              }}
            </v-alert>

            <v-alert type="warning" variant="tonal" class="mt-2">
              Payment will be processed outside the app. Our team will contact you for details.
            </v-alert>
          </div>
        </v-card-text>

        <v-card-actions class="px-6 pb-6">
          <v-spacer></v-spacer>
          <v-btn variant="outlined" @click="reservationDialog.close">Cancel</v-btn>
          <v-btn
            color="primary"
            variant="elevated"
            :loading="reservationDialog.isSubmitting.value"
            @click="reservationDialog.submit"
          >
            Confirm Reservation
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete Confirmation Dialog -->
    <DeleteConfirmDialog
      v-model="deleteConfirmation.isOpen.value"
      :is-deleting="deleteConfirmation.isDeleting.value"
      title="Confirm Delete"
      :message="`Are you sure you want to delete this ${deleteConfirmation.itemToDelete.value?.type || 'item'}`"
      @confirm="deleteConfirmation.confirmDelete"
    />

    <!-- Snackbar for notifications -->
    <AppSnackbar
      v-model="snackbar"
      :message="snackbarMessage"
      :color="snackbarColor"
      :timeout="3000"
      location="top"
    />
  </div>
</template>

<style scoped>
/* Component specific styles */
</style>
