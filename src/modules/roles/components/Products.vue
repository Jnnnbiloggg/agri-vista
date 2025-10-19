<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useProducts } from '../composables/useProducts'
import HeaderActions from './shared/HeaderActions.vue'

interface Props {
  userType: 'admin' | 'user'
}

const props = defineProps<Props>()

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
  searchProducts,
  clearProductsSearch,
  createProduct,
  updateProduct,
  deleteProduct,
  fetchOrders,
  searchOrders,
  clearOrdersSearch,
  createOrder,
  updateOrder,
  deleteOrder,
  setupRealtimeSubscriptions,
} = useProducts()

// Dialog states
const showProductDialog = ref(false)
const showReserveDialog = ref(false)
const showDeleteDialog = ref(false)
const selectedProduct = ref<any | null>(null)
const editingProduct = ref<any | null>(null)
const deleteTarget = ref<{ type: 'product' | 'order'; id: number } | null>(null)

// Snackbar
const snackbar = ref(false)
const snackbarMessage = ref('')
const snackbarColor = ref('success')

const showSnackbar = (message: string, color: 'success' | 'error' | 'info' = 'success') => {
  snackbarMessage.value = message
  snackbarColor.value = color
  snackbar.value = true
}

// Admin tab
const adminTab = ref('products')

const newProduct = ref({
  name: '',
  category: '',
  description: '',
  price: 0,
  stock: 0,
})

const reserveForm = ref({
  quantity: 1,
})

const imageFiles = ref<File[]>([])
const imagePreviews = ref<string[]>([])

const categories = ['Fruits', 'Vegetables', 'Herbs', 'Seeds', 'Other']

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

// Image handling
const handleImageSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  const files = Array.from(target.files || [])

  imageFiles.value = files
  imagePreviews.value = []

  files.forEach((file) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      imagePreviews.value.push(e.target?.result as string)
    }
    reader.readAsDataURL(file)
  })
}

const removeImage = (index: number) => {
  imagePreviews.value.splice(index, 1)
  imageFiles.value.splice(index, 1)
}

// Admin functions
const handleAddProduct = () => {
  if (props.userType !== 'admin') return
  editingProduct.value = null
  newProduct.value = {
    name: '',
    category: '',
    description: '',
    price: 0,
    stock: 0,
  }
  imageFiles.value = []
  imagePreviews.value = []
  showProductDialog.value = true
}

const handleEditProduct = (product: any) => {
  if (props.userType !== 'admin') return
  editingProduct.value = product
  newProduct.value = {
    name: product.name,
    category: product.category,
    description: product.description || '',
    price: product.price,
    stock: product.stock,
  }
  imagePreviews.value = product.images ? [...product.images] : []
  imageFiles.value = []
  showProductDialog.value = true
}

const handleSaveProduct = async () => {
  if (props.userType !== 'admin') return

  if (!newProduct.value.name || !newProduct.value.category || !newProduct.value.price) {
    showSnackbar('Please fill in all required fields', 'error')
    return
  }

  try {
    let result
    if (editingProduct.value) {
      result = await updateProduct(
        editingProduct.value.id,
        {
          ...newProduct.value,
          images: imagePreviews.value.filter((url) => url.startsWith('http')), // Keep existing URLs
        },
        imageFiles.value,
      )
    } else {
      result = await createProduct(
        {
          ...newProduct.value,
          images: [], // Will be updated by composable with uploaded images
        },
        imageFiles.value,
      )
    }

    if (result.success) {
      showProductDialog.value = false
      showSnackbar(
        editingProduct.value ? 'Product updated successfully!' : 'Product created successfully!',
        'success',
      )
    } else {
      showSnackbar(result.error || 'Failed to save product', 'error')
    }
  } catch (err: any) {
    showSnackbar(err.message || 'An error occurred', 'error')
  }
}

const confirmDelete = (type: 'product' | 'order', id: number) => {
  deleteTarget.value = { type, id }
  showDeleteDialog.value = true
}

const handleDelete = async () => {
  if (!deleteTarget.value) return

  try {
    let result
    if (deleteTarget.value.type === 'product') {
      result = await deleteProduct(deleteTarget.value.id)
    } else {
      result = await deleteOrder(deleteTarget.value.id)
    }

    if (result.success) {
      showDeleteDialog.value = false
      showSnackbar(
        `${deleteTarget.value.type.charAt(0).toUpperCase() + deleteTarget.value.type.slice(1)} deleted successfully!`,
        'success',
      )
    } else {
      showSnackbar(result.error || 'Failed to delete', 'error')
    }
  } catch (err: any) {
    showSnackbar(err.message || 'An error occurred', 'error')
  }
}

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
  reserveForm.value.quantity = 1
  showReserveDialog.value = true
}

const submitReservation = async () => {
  if (!selectedProduct.value) return

  if (reserveForm.value.quantity > selectedProduct.value.stock) {
    showSnackbar('Quantity exceeds available stock', 'error')
    return
  }

  try {
    const totalPrice = selectedProduct.value.price * reserveForm.value.quantity
    const result = await createOrder({
      product_id: selectedProduct.value.id,
      product_name: selectedProduct.value.name,
      quantity: reserveForm.value.quantity,
      total_price: totalPrice,
      order_status: 'pending',
    })

    if (result.success) {
      showReserveDialog.value = false
      showSnackbar('Order placed successfully!', 'success')
    } else {
      showSnackbar(result.error || 'Failed to place order', 'error')
    }
  } catch (err: any) {
    showSnackbar(err.message || 'An error occurred', 'error')
  }
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

const pageSubtitle = computed(() =>
  props.userType === 'admin'
    ? 'Manage products and orders'
    : 'Browse and reserve fresh farm products',
)

const handleSearch = (query: string) => {
  console.log('Search query:', query)
  // Implement your search logic here
}

const handleSettingsClick = () => {
  console.log('Settings clicked')
  // Navigate to settings or open settings dialog
}
</script>

<template>
  <div>
    <!-- Page Header -->
    <v-row class="mb-6">
      <v-col cols="12" class="d-flex align-center justify-space-between">
        <div>
          <h1 class="text-h4 font-weight-bold text-primary mb-2">
            {{ userType === 'admin' ? 'Product Management' : 'Farm Products' }}
          </h1>
          <p class="text-h6 text-grey-darken-1">
            {{ pageSubtitle }}
          </p>
        </div>

        <HeaderActions
          search-placeholder="Search products..."
          @search="handleSearch"
          @settings-click="handleSettingsClick"
        />
      </v-col>
    </v-row>

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
            <v-col cols="12" class="d-flex justify-end mb-4">
              <v-btn
                color="primary"
                variant="elevated"
                prepend-icon="mdi-plus"
                @click="handleAddProduct"
              >
                Add Product
              </v-btn>
            </v-col>
            <v-col cols="12">
              <v-card>
                <v-card-title>Product Inventory</v-card-title>
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
                  <v-data-table v-else :headers="productHeaders" :items="products" item-value="id">
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
            <v-col cols="12" class="d-flex justify-end mb-4">
              <v-btn
                color="success"
                variant="elevated"
                prepend-icon="mdi-download"
                @click="downloadSalesHistory"
              >
                View Full Sales History
              </v-btn>
            </v-col>
            <v-col cols="12">
              <v-card>
                <v-card-title>Order History</v-card-title>
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
                  <v-data-table v-else :headers="orderHeaders" :items="orders" item-value="id">
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
            <v-carousel
              v-if="product.images.length > 0"
              height="200"
              hide-delimiters
              show-arrows="hover"
            >
              <v-carousel-item v-for="(image, i) in product.images" :key="i">
                <v-img :src="image" height="200" cover></v-img>
              </v-carousel-item>
            </v-carousel>
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
    </template>

    <!-- Admin Product Dialog -->
    <v-dialog v-if="userType === 'admin'" v-model="showProductDialog" max-width="700px">
      <v-card>
        <v-card-title>
          {{ editingProduct ? 'Edit Product' : 'New Product' }}
        </v-card-title>
        <v-card-text>
          <v-form @submit.prevent="handleSaveProduct">
            <v-row>
              <!-- Image Upload -->
              <v-col cols="12">
                <div class="text-subtitle-2 mb-2">Product Images</div>

                <div v-if="imagePreviews.length > 0" class="mb-4">
                  <v-row>
                    <v-col v-for="(preview, index) in imagePreviews" :key="index" cols="4">
                      <div class="position-relative">
                        <v-img :src="preview" height="120" cover class="rounded"></v-img>
                        <v-btn
                          icon="mdi-close"
                          size="x-small"
                          color="error"
                          class="position-absolute"
                          style="top: 4px; right: 4px"
                          @click="removeImage(index)"
                        ></v-btn>
                      </div>
                    </v-col>
                  </v-row>
                </div>

                <v-file-input
                  accept="image/*"
                  label="Upload Images"
                  prepend-icon="mdi-camera"
                  variant="outlined"
                  multiple
                  @change="handleImageSelect"
                ></v-file-input>
              </v-col>

              <v-col cols="12">
                <v-text-field
                  v-model="newProduct.name"
                  label="Product Name *"
                  variant="outlined"
                  required
                ></v-text-field>
              </v-col>

              <v-col cols="12" md="6">
                <v-select
                  v-model="newProduct.category"
                  label="Category *"
                  :items="categories"
                  variant="outlined"
                  required
                ></v-select>
              </v-col>

              <v-col cols="12" md="6">
                <v-text-field
                  v-model.number="newProduct.price"
                  label="Price (₱) *"
                  type="number"
                  variant="outlined"
                  required
                ></v-text-field>
              </v-col>

              <v-col cols="12">
                <v-text-field
                  v-model.number="newProduct.stock"
                  label="Stock Availability *"
                  type="number"
                  variant="outlined"
                  required
                  hint="Set to 0 if out of stock"
                ></v-text-field>
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>

        <v-card-actions class="px-6 pb-6">
          <v-spacer></v-spacer>
          <v-btn variant="outlined" @click="showProductDialog = false">Cancel</v-btn>
          <v-btn color="primary" variant="elevated" @click="handleSaveProduct">
            {{ editingProduct ? 'Update' : 'Create' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- User Reserve Dialog -->
    <v-dialog v-if="userType === 'user'" v-model="showReserveDialog" max-width="500px">
      <v-card>
        <v-card-title>Reserve Product</v-card-title>
        <v-card-text>
          <div v-if="selectedProduct">
            <div class="text-h6 mb-2">{{ selectedProduct.name }}</div>
            <div class="text-h5 font-weight-bold text-primary mb-4">
              ₱{{ selectedProduct.price }}
            </div>

            <v-text-field
              v-model.number="reserveForm.quantity"
              label="Quantity"
              type="number"
              variant="outlined"
              :min="1"
              :max="selectedProduct.stock"
              required
            ></v-text-field>

            <v-alert type="info" variant="tonal" class="mt-4">
              Total: ₱{{ (selectedProduct.price * reserveForm.quantity).toFixed(2) }}
            </v-alert>

            <v-alert type="warning" variant="tonal" class="mt-2">
              Payment will be processed outside the app. Our team will contact you for details.
            </v-alert>
          </div>
        </v-card-text>

        <v-card-actions class="px-6 pb-6">
          <v-spacer></v-spacer>
          <v-btn variant="outlined" @click="showReserveDialog = false">Cancel</v-btn>
          <v-btn color="primary" variant="elevated" @click="submitReservation">
            Confirm Reservation
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="showDeleteDialog" max-width="400px">
      <v-card>
        <v-card-title>Confirm Delete</v-card-title>
        <v-card-text>
          Are you sure you want to delete this {{ deleteTarget?.type }}? This action cannot be
          undone.
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="outlined" @click="showDeleteDialog = false">Cancel</v-btn>
          <v-btn color="error" variant="elevated" @click="handleDelete">Delete</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Snackbar for notifications -->
    <v-snackbar v-model="snackbar" :color="snackbarColor" :timeout="3000">
      {{ snackbarMessage }}
      <template v-slot:actions>
        <v-btn variant="text" @click="snackbar = false">Close</v-btn>
      </template>
    </v-snackbar>
  </div>
</template>

<style scoped>
/* Component specific styles */
</style>
