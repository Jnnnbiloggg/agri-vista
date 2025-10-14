<script setup lang="ts">
import { ref, computed } from 'vue'
import HeaderActions from './shared/HeaderActions.vue'

interface Props {
  userType: 'admin' | 'user'
}

const props = defineProps<Props>()

interface Product {
  id: number
  name: string
  category: string
  price: number
  stock: number
  images: string[]
}

interface Order {
  id: number
  productName: string
  quantity: number
  buyer: string
  dateOrdered: string
  orderStatus: 'pending' | 'confirmed' | 'completed' | 'cancelled'
}

// Sample products data
const products = ref<Product[]>([
  {
    id: 1,
    name: 'Fresh Strawberries',
    category: 'Fruits',
    price: 180,
    stock: 50,
    images: ['https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=400'],
  },
  {
    id: 2,
    name: 'Mixed Herbs Bundle',
    category: 'Herbs',
    price: 120,
    stock: 30,
    images: ['https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?w=400'],
  },
  {
    id: 3,
    name: 'Organic Tomatoes',
    category: 'Vegetables',
    price: 80,
    stock: 0,
    images: ['https://images.unsplash.com/photo-1546470427-e26264548ee3?w=400'],
  },
])

// Sample orders data
const orders = ref<Order[]>([
  {
    id: 1,
    productName: 'Fresh Strawberries',
    quantity: 5,
    buyer: 'Maria Santos',
    dateOrdered: '2025-01-15',
    orderStatus: 'confirmed',
  },
  {
    id: 2,
    productName: 'Mixed Herbs Bundle',
    quantity: 2,
    buyer: 'John Rivera',
    dateOrdered: '2025-01-14',
    orderStatus: 'pending',
  },
])

const adminTab = ref('products')
const showProductDialog = ref(false)
const showReserveDialog = ref(false)
const editingProduct = ref<Product | null>(null)
const selectedProduct = ref<Product | null>(null)

const newProduct = ref({
  name: '',
  category: '',
  price: 0,
  stock: 0,
})

const reserveForm = ref({
  quantity: 1,
})

const imageFiles = ref<File[]>([])
const imagePreviews = ref<string[]>([])

const categories = ['Fruits', 'Vegetables', 'Herbs', 'Seeds', 'Other']

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
    price: 0,
    stock: 0,
  }
  imageFiles.value = []
  imagePreviews.value = []
  showProductDialog.value = true
}

const handleEditProduct = (product: Product) => {
  if (props.userType !== 'admin') return
  editingProduct.value = product
  newProduct.value = {
    name: product.name,
    category: product.category,
    price: product.price,
    stock: product.stock,
  }
  imagePreviews.value = [...product.images]
  imageFiles.value = []
  showProductDialog.value = true
}

const handleSaveProduct = () => {
  if (props.userType !== 'admin') return

  // TODO: Upload images to Supabase Storage
  const images = imagePreviews.value.length > 0 ? imagePreviews.value : []

  if (editingProduct.value) {
    const index = products.value.findIndex((p) => p.id === editingProduct.value!.id)
    if (index !== -1) {
      products.value[index] = {
        ...products.value[index],
        ...newProduct.value,
        images: images.length > 0 ? images : products.value[index].images,
      }
    }
  } else {
    const newId = Math.max(...products.value.map((p) => p.id), 0) + 1
    products.value.unshift({
      id: newId,
      ...newProduct.value,
      images,
    })
  }
  showProductDialog.value = false
}

const handleDeleteProduct = (id: number) => {
  if (props.userType !== 'admin') return
  const index = products.value.findIndex((p) => p.id === id)
  if (index !== -1) {
    products.value.splice(index, 1)
  }
}

const updateOrderStatus = (orderId: number, status: Order['orderStatus']) => {
  const order = orders.value.find((o) => o.id === orderId)
  if (order) {
    order.orderStatus = status
  }
}

const downloadSalesHistory = () => {
  // TODO: Generate and download CSV/Excel file
  const csvContent = [
    ['Product Name', 'Quantity', 'Buyer', 'Date Ordered', 'Status'],
    ...orders.value.map((o) => [o.productName, o.quantity, o.buyer, o.dateOrdered, o.orderStatus]),
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
const handleReserve = (product: Product) => {
  if (product.stock === 0) return
  selectedProduct.value = product
  reserveForm.value.quantity = 1
  showReserveDialog.value = true
}

const submitReservation = () => {
  if (!selectedProduct.value) return

  // TODO: Submit to Supabase
  const newOrder: Order = {
    id: Math.max(...orders.value.map((o) => o.id), 0) + 1,
    productName: selectedProduct.value.name,
    quantity: reserveForm.value.quantity,
    buyer: 'Current User', // Replace with actual user name
    dateOrdered: new Date().toISOString().split('T')[0],
    orderStatus: 'pending',
  }

  orders.value.unshift(newOrder)

  // Update stock
  const product = products.value.find((p) => p.id === selectedProduct.value!.id)
  if (product) {
    product.stock -= reserveForm.value.quantity
  }

  showReserveDialog.value = false
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
  { title: 'Product Name', key: 'productName' },
  { title: 'Quantity', key: 'quantity' },
  { title: 'Buyer', key: 'buyer' },
  { title: 'Date Ordered', key: 'dateOrdered' },
  { title: 'Status', key: 'orderStatus' },
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
                  <v-data-table :headers="productHeaders" :items="products" item-value="id">
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
                        @click="handleDeleteProduct(item.id)"
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
                  <v-data-table :headers="orderHeaders" :items="orders" item-value="id">
                    <template v-slot:item.orderStatus="{ item }">
                      <v-chip
                        :color="getStatusColor(item.orderStatus)"
                        size="small"
                        variant="tonal"
                      >
                        {{ item.orderStatus }}
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
      <v-row>
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
  </div>
</template>

<style scoped>
/* Component specific styles */
</style>
