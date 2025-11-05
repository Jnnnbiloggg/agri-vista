<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useDashboard } from '../composables/useDashboard'
import StatusBadge from './shared/StatusBadge.vue'

interface Props {
  userType: 'admin' | 'user'
}

const props = defineProps<Props>()

// Use dashboard composable
const {
  carouselSlides,
  activities,
  loading,
  error,
  fetchCarouselSlides,
  fetchDashboardActivities,
  createCarouselSlide,
  updateCarouselSlide,
  deleteCarouselSlide,
  setupRealtimeSubscription,
} = useDashboard()

// Dialog states
const showSlideDialog = ref(false)
const showDeleteDialog = ref(false)
const editingSlide = ref<any>(null)
const slideToDelete = ref<number | null>(null)

// Snackbar
const snackbar = ref(false)
const snackbarMessage = ref('')
const snackbarColor = ref('success')

// Form data
const newSlide = ref({
  title: '',
  description: '',
  order_index: 0,
  is_active: true,
})

const imageFile = ref<File | null>(null)
const imagePreview = ref<string | null>(null)

// Farm location coordinates
const farmLocation = ref({
  lat: 8.95,
  lng: 125.535,
  name: "Robrosa's Farm",
  address: 'Purok 4-Sitio Tagkiling, Brgy. Anticala 8600 Butuan City, Philippines',
})
// Load data on mount
onMounted(async () => {
  await fetchCarouselSlides()
  await fetchDashboardActivities()
  setupRealtimeSubscription()
})

// Image handling
const handleImageSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]

  if (file) {
    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      showSnackbar('Image size should be less than 5MB', 'error')
      return
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      showSnackbar('Please select a valid image file', 'error')
      return
    }

    imageFile.value = file
    const reader = new FileReader()
    reader.onload = (e) => {
      imagePreview.value = e.target?.result as string
    }
    reader.readAsDataURL(file)
  }
}

const handleRemoveImage = () => {
  imageFile.value = null
  imagePreview.value = null
}

// Admin carousel management
const handleAddSlide = () => {
  if (props.userType !== 'admin') return
  editingSlide.value = null
  newSlide.value = {
    title: '',
    description: '',
    order_index: carouselSlides.value.length,
    is_active: true,
  }
  imageFile.value = null
  imagePreview.value = null
  showSlideDialog.value = true
}

const handleEditSlide = (slide: any) => {
  if (props.userType !== 'admin') return
  editingSlide.value = slide
  newSlide.value = {
    title: slide.title,
    description: slide.description,
    order_index: slide.order_index,
    is_active: slide.is_active,
  }
  imageFile.value = null
  imagePreview.value = slide.image_url
  showSlideDialog.value = true
}

const handleSaveSlide = async () => {
  if (props.userType !== 'admin') return

  if (!newSlide.value.title || !newSlide.value.description) {
    showSnackbar('Please fill in all required fields', 'error')
    return
  }

  if (!editingSlide.value && !imageFile.value) {
    showSnackbar('Please select an image', 'error')
    return
  }

  try {
    let result
    if (editingSlide.value) {
      result = await updateCarouselSlide(editingSlide.value.id, newSlide.value, imageFile.value)
    } else {
      if (!imageFile.value) {
        showSnackbar('Please select an image', 'error')
        return
      }
      result = await createCarouselSlide(
        {
          ...newSlide.value,
          image_url: '', // Will be set by composable after upload
        },
        imageFile.value,
      )
    }

    if (result.success) {
      showSnackbar(
        editingSlide.value ? 'Slide updated successfully!' : 'Slide created successfully!',
        'success',
      )
      showSlideDialog.value = false
    } else {
      showSnackbar(result.error || 'Failed to save slide', 'error')
    }
  } catch (err: any) {
    showSnackbar(err.message || 'An error occurred', 'error')
  }
}

const confirmDelete = (id: number) => {
  if (props.userType !== 'admin') return
  slideToDelete.value = id
  showDeleteDialog.value = true
}

const handleDeleteSlide = async () => {
  if (props.userType !== 'admin' || !slideToDelete.value) return

  try {
    const result = await deleteCarouselSlide(slideToDelete.value)

    if (result.success) {
      showSnackbar('Slide deleted successfully!', 'success')
    } else {
      showSnackbar(result.error || 'Failed to delete slide', 'error')
    }
  } catch (err: any) {
    showSnackbar(err.message || 'An error occurred', 'error')
  } finally {
    showDeleteDialog.value = false
    slideToDelete.value = null
  }
}

const showSnackbar = (message: string, color: 'success' | 'error' | 'info' = 'success') => {
  snackbarMessage.value = message
  snackbarColor.value = color
  snackbar.value = true
}

const pageTitle = computed(() => (props.userType === 'admin' ? 'Admin Dashboard' : 'Welcome Back!'))

const pageSubtitle = computed(() =>
  props.userType === 'admin'
    ? "Manage Robrosa's Farm operations and analytics"
    : "Here's what's happening at Robrosa's Farm",
)

// Get status color
const getStatusColor = (status: string) => {
  switch (status) {
    case 'upcoming':
      return 'info'
    case 'ongoing':
      return 'warning'
    case 'completed':
      return 'success'
    default:
      return 'grey'
  }
}

// Format date
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

// Form validation
const isFormValid = computed(() => {
  return (
    newSlide.value.title.trim() !== '' &&
    newSlide.value.description.trim() !== '' &&
    (imagePreview.value !== null || imageFile.value !== null)
  )
})
</script>

<template>
  <div class="dashboard-container">
    <!-- Page Header -->
    <div class="page-header mb-2xl">
      <h1 class="page-title">{{ pageTitle }}</h1>
      <p class="page-subtitle">{{ pageSubtitle }}</p>
    </div>

    <!-- Loading State -->
    <div v-if="loading && carouselSlides.length === 0" class="text-center py-12">
      <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
      <p class="text-h6 mt-4">Loading dashboard...</p>
    </div>

    <!-- Error State -->
    <v-alert v-if="error" type="error" class="mb-6" closable>
      {{ error }}
    </v-alert>

    <!-- Main Dashboard Content -->
    <v-row v-if="!loading || carouselSlides.length > 0">
      <!-- Left Column: Carousel -->
      <v-col cols="12" md="6">
        <v-row>
          <v-col cols="12">
            <v-card class="modern-card fill-height">
              <v-card-title class="d-flex justify-space-between align-center pa-6">
                <span class="text-h6">Farm Highlights</span>
                <v-btn
                  v-if="userType === 'admin'"
                  color="primary"
                  size="small"
                  prepend-icon="mdi-plus"
                  @click="handleAddSlide"
                >
                  Add Slide
                </v-btn>
              </v-card-title>

              <v-divider></v-divider>

              <v-card-text class="pa-0">
                <!-- Carousel -->
                <div v-if="carouselSlides.length > 0">
                  <v-carousel
                    height="400"
                    cycle
                    :show-arrows="carouselSlides.length > 1"
                    hide-delimiter-background
                  >
                    <v-carousel-item v-for="slide in carouselSlides" :key="slide.id">
                      <v-img :src="slide.image_url" height="400" cover>
                        <div class="carousel-overlay">
                          <div class="carousel-content">
                            <h2 class="text-h4 font-weight-bold mb-2">{{ slide.title }}</h2>
                            <p class="text-body-1">{{ slide.description }}</p>

                            <!-- Admin Actions on Slide -->
                            <div v-if="userType === 'admin'" class="mt-4">
                              <v-btn
                                color="white"
                                variant="elevated"
                                size="small"
                                class="mr-2"
                                prepend-icon="mdi-pencil"
                                @click="handleEditSlide(slide)"
                              >
                                Edit
                              </v-btn>
                              <v-btn
                                color="error"
                                variant="elevated"
                                size="small"
                                prepend-icon="mdi-delete"
                                @click="confirmDelete(slide.id)"
                              >
                                Delete
                              </v-btn>
                            </div>
                          </div>
                        </div>
                      </v-img>
                    </v-carousel-item>
                  </v-carousel>
                </div>

                <!-- Empty State -->
                <div v-else class="text-center py-12">
                  <v-icon icon="mdi-image-off" size="80" color="grey-lighten-1"></v-icon>
                  <p class="text-h6 mt-4">No carousel slides yet</p>
                  <p class="text-body-2 text-grey">
                    {{
                      userType === 'admin' ? 'Add slides to showcase your farm' : 'Check back later'
                    }}
                  </p>
                  <v-btn
                    v-if="userType === 'admin'"
                    color="primary"
                    variant="elevated"
                    class="mt-4"
                    prepend-icon="mdi-plus"
                    @click="handleAddSlide"
                  >
                    Add First Slide
                  </v-btn>
                </div>
              </v-card-text>
            </v-card>
          </v-col>

          <!-- Farm Location Map -->
          <v-col cols="12">
            <v-card class="modern-card">
              <v-card-title class="pa-6">
                <v-icon icon="mdi-map-marker" class="mr-2" color="primary"></v-icon>
                <span class="text-h6">Farm Location</span>
              </v-card-title>

              <v-divider></v-divider>

              <v-card-text class="pa-4">
                <!-- OpenStreetMap iframe -->
                <div class="map-container">
                  <iframe
                    width="100%"
                    height="300"
                    frameborder="0"
                    scrolling="no"
                    marginheight="0"
                    marginwidth="0"
                    src="https://www.openstreetmap.org/export/embed.html?bbox=125.5250,8.9400,125.5450,8.9600&layer=mapnik&marker=8.9500,125.5350"
                    style="border-radius: 12px"
                  ></iframe>
                </div>

                <div class="mt-4">
                  <div class="d-flex align-center mb-2">
                    <v-icon
                      icon="mdi-map-marker"
                      size="small"
                      color="primary"
                      class="mr-2"
                    ></v-icon>
                    <span class="text-subtitle-2 font-weight-bold">{{ farmLocation.name }}</span>
                  </div>
                  <div class="d-flex align-center text-grey-darken-1">
                    <v-icon icon="mdi-map-marker-radius" size="small" class="mr-2"></v-icon>
                    <span class="text-body-2">{{ farmLocation.address }}</span>
                  </div>
                  <v-btn
                    :href="`https://www.openstreetmap.org/?mlat=${farmLocation.lat}&mlon=${farmLocation.lng}#map=15/${farmLocation.lat}/${farmLocation.lng}`"
                    target="_blank"
                    color="primary"
                    variant="outlined"
                    size="small"
                    class="mt-3"
                    prepend-icon="mdi-directions"
                  >
                    Get Directions
                  </v-btn>
                </div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-col>

      <!-- Right Column: Map and Activities -->
      <v-col cols="12" md="6">
        <v-row>
          <!-- Farm Activities -->
          <v-col cols="12">
            <v-card class="modern-card">
              <v-card-title class="pa-6">
                <v-icon icon="mdi-leaf" class="mr-2" color="success"></v-icon>
                <span class="text-h6">Upcoming Activities</span>
              </v-card-title>

              <v-divider></v-divider>

              <v-card-text class="pa-4">
                <!-- Activities List -->
                <div v-if="activities.length > 0">
                  <v-list lines="two" class="py-0">
                    <v-list-item
                      v-for="(activity, index) in activities.slice(0, 5)"
                      :key="activity.id"
                      class="modern-list-item px-4 mb-3"
                    >
                      <template v-slot:prepend>
                        <v-avatar size="60" rounded="lg">
                          <v-img v-if="activity.image_url" :src="activity.image_url" cover></v-img>
                          <v-icon v-else icon="mdi-leaf"></v-icon>
                        </v-avatar>
                      </template>

                      <v-list-item-title class="font-weight-medium mb-1">
                        {{ activity.name }}
                      </v-list-item-title>

                      <v-list-item-subtitle class="text-caption">
                        <div class="d-flex align-center flex-wrap gap-2 mt-1">
                          <v-chip size="x-small" :color="getStatusColor(activity.status)">
                            {{ activity.status }}
                          </v-chip>
                          <span class="text-grey-darken-1">
                            <v-icon icon="mdi-map-marker" size="x-small"></v-icon>
                            {{ activity.location }}
                          </span>
                          <span class="text-grey-darken-1">
                            <v-icon icon="mdi-account-group" size="x-small"></v-icon>
                            {{ activity.enrolled_count }}/{{ activity.capacity }}
                          </span>
                        </div>
                      </v-list-item-subtitle>
                    </v-list-item>
                  </v-list>

                  <v-btn
                    :to="userType === 'admin' ? '/admin/activities' : '/user/activities'"
                    color="primary"
                    variant="text"
                    block
                    class="mt-2"
                  >
                    View All Activities
                  </v-btn>
                </div>

                <!-- Empty State -->
                <div v-else class="text-center py-8">
                  <v-icon icon="mdi-sprout-outline" size="60" color="grey-lighten-1"></v-icon>
                  <p class="text-body-2 text-grey mt-2">No activities scheduled yet</p>
                </div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-col>
    </v-row>

    <!-- Admin: Add/Edit Slide Dialog -->
    <v-dialog v-if="userType === 'admin'" v-model="showSlideDialog" max-width="700px">
      <v-card class="modern-dialog">
        <v-card-title class="pa-6 text-h5 font-weight-bold">
          {{ editingSlide ? 'Edit Carousel Slide' : 'New Carousel Slide' }}
        </v-card-title>

        <v-divider></v-divider>

        <v-card-text class="pa-6">
          <v-form @submit.prevent="handleSaveSlide">
            <v-text-field
              v-model="newSlide.title"
              label="Title *"
              placeholder="Enter slide title"
              variant="outlined"
              density="comfortable"
              :rules="[(v: any) => !!v || 'Title is required']"
              class="mb-4"
            ></v-text-field>

            <v-textarea
              v-model="newSlide.description"
              label="Description *"
              placeholder="Enter slide description"
              variant="outlined"
              density="comfortable"
              rows="4"
              :rules="[(v: any) => !!v || 'Description is required']"
              class="mb-4"
            ></v-textarea>

            <v-text-field
              v-model.number="newSlide.order_index"
              label="Display Order"
              placeholder="0"
              variant="outlined"
              density="comfortable"
              type="number"
              min="0"
              hint="Lower numbers appear first"
              persistent-hint
              class="mb-4"
            ></v-text-field>

            <v-switch
              v-model="newSlide.is_active"
              label="Active"
              color="primary"
              class="mb-4"
            ></v-switch>

            <!-- Image Upload Section -->
            <div class="mb-4">
              <v-label class="text-subtitle-2 mb-2">Image *</v-label>

              <!-- Image Preview -->
              <div v-if="imagePreview" class="mb-3">
                <v-card variant="outlined" class="pa-2">
                  <div class="d-flex align-center justify-space-between">
                    <v-img
                      :src="imagePreview"
                      max-height="200"
                      max-width="300"
                      contain
                      class="rounded"
                    ></v-img>
                    <v-btn
                      icon="mdi-close"
                      size="small"
                      variant="text"
                      color="error"
                      @click="handleRemoveImage"
                    ></v-btn>
                  </div>
                </v-card>
              </div>

              <!-- File Input -->
              <v-file-input
                v-else
                label="Upload Image"
                placeholder="Choose an image"
                variant="outlined"
                density="comfortable"
                prepend-icon=""
                prepend-inner-icon="mdi-image"
                accept="image/*"
                :rules="[
                  (v: any) =>
                    !v || !v.length || v[0].size < 5000000 || 'Image size should be less than 5MB',
                ]"
                @change="handleImageSelect"
              ></v-file-input>
            </div>
          </v-form>
        </v-card-text>

        <v-divider></v-divider>

        <v-card-actions class="px-6 py-4">
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="showSlideDialog = false"> Cancel </v-btn>
          <v-btn
            color="primary"
            variant="elevated"
            :loading="loading"
            :disabled="!isFormValid"
            @click="handleSaveSlide"
          >
            {{ editingSlide ? 'Update' : 'Create' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="showDeleteDialog" max-width="400px">
      <v-card>
        <v-card-title class="pa-6">
          <v-icon color="warning" size="large" class="mr-2">mdi-alert-circle</v-icon>
          Confirm Delete
        </v-card-title>

        <v-divider></v-divider>

        <v-card-text class="pa-6">
          Are you sure you want to delete this carousel slide? This action cannot be undone.
        </v-card-text>

        <v-divider></v-divider>

        <v-card-actions class="px-6 py-4">
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="showDeleteDialog = false"> Cancel </v-btn>
          <v-btn color="error" variant="elevated" :loading="loading" @click="handleDeleteSlide">
            Delete
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Snackbar for notifications -->
    <v-snackbar v-model="snackbar" :color="snackbarColor" :timeout="3000" location="top">
      {{ snackbarMessage }}
      <template #actions>
        <v-btn variant="text" @click="snackbar = false"> Close </v-btn>
      </template>
    </v-snackbar>
  </div>
</template>

<style scoped>
.dashboard-container {
  width: 100%;
}

/* Carousel Overlay Styling */
.carousel-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(
    to top,
    rgba(0, 0, 0, 0.8) 0%,
    rgba(0, 0, 0, 0.4) 50%,
    transparent 100%
  );
  padding: 2rem;
  color: white;
}

.carousel-content {
  max-width: 600px;
}

.carousel-content h2,
.carousel-content p {
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
}

/* Map Container */
.map-container {
  border-radius: var(--radius-md);
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* Modern List Item */
.modern-list-item {
  border-radius: var(--radius-md) !important;
  border: 1px solid rgba(0, 0, 0, 0.06);
  transition: all var(--transition-fast);
  background-color: white;
}

.modern-list-item:hover {
  border-color: rgba(76, 175, 80, 0.3);
  background-color: rgba(76, 175, 80, 0.02);
  transform: translateX(4px);
  box-shadow: 0 2px 8px rgba(76, 175, 80, 0.1);
}

/* Responsive adjustments */
@media (max-width: 960px) {
  .carousel-overlay {
    padding: 1rem;
  }

  .carousel-content h2 {
    font-size: 1.5rem;
  }

  .carousel-content p {
    font-size: 0.9rem;
  }
}

@media (max-width: 600px) {
  .carousel-content h2 {
    font-size: 1.25rem;
  }

  .carousel-content p {
    font-size: 0.85rem;
  }
}
</style>
