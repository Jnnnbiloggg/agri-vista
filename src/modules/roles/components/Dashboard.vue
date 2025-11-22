<script setup lang="ts">
import { ref, computed, onMounted, inject, type Ref } from 'vue'
import { useDashboard } from '../composables/useDashboard'
import StatusBadge from './shared/StatusBadge.vue'
import PageHeader from './shared/PageHeader.vue'
import AppSnackbar from '@/components/shared/AppSnackbar.vue'
import DeleteConfirmDialog from '@/components/shared/DeleteConfirmDialog.vue'
import { useSnackbar } from '@/composables/useSnackbar'
import { useImageHandler } from '@/composables/useImageHandler'
import { useDeleteConfirmation } from '@/composables/useDeleteConfirmation'
import { useFormDialog } from '@/composables/useFormDialog'
import { usePageActions } from '@/composables/usePageActions'
import { formatDate } from '@/utils/formatters'

interface Props {
  userType: 'admin' | 'user'
}

const props = defineProps<Props>()

const drawer = inject<Ref<boolean>>('drawer')

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

const { snackbar, snackbarMessage, snackbarColor, showSnackbar } = useSnackbar()

const deleteConfirmation = useDeleteConfirmation({
  onDelete: async (id: number) => {
    return await deleteCarouselSlide(id)
  },
  showSnackbar,
  successMessage: 'Carousel slide deleted successfully',
  errorMessage: 'Failed to delete slide',
})

const { handleSettingsClick } = usePageActions({
  userType: props.userType,
})

const {
  imageFile,
  imagePreview,
  handleImageSelect,
  removeImage,
  error: imageError,
} = useImageHandler({
  maxSizeInMB: 5,
  allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
})

const slideDialog = useFormDialog<{
  title: string
  description: string
  order_index: number
  is_active: boolean
  id?: number
  image_url?: string
}>({
  initialData: () => ({
    title: '',
    description: '',
    order_index: carouselSlides.value.length,
    is_active: true,
  }),
  validate: (data) => {
    if (!data.title || !data.description) {
      return { valid: false, message: 'Please fill in all required fields' }
    }
    if (!slideDialog.isEditing.value && !imageFile.value) {
      return { valid: false, message: 'Please select an image' }
    }
    return { valid: true }
  },
  onSubmit: async (data, isEditing): Promise<{ success: boolean; error?: string }> => {
    if (isEditing && data.id) {
      return await updateCarouselSlide(data.id, data, imageFile.value)
    } else {
      if (!imageFile.value) {
        return { success: false, error: 'Please select an image' }
      }
      return await createCarouselSlide(
        {
          ...data,
          image_url: '',
        },
        imageFile.value,
      )
    }
  },
  onOpen: () => {
    imageFile.value = null
    imagePreview.value = slideDialog.editingItem.value?.image_url || null

    if (!slideDialog.isEditing.value) {
      slideDialog.formData.value.order_index = carouselSlides.value.length
    }
  },
  showSnackbar,
  successMessage: {
    create: 'Slide created successfully!',
    update: 'Slide updated successfully!',
  },
  errorMessage: {
    create: 'Failed to save slide',
    update: 'Failed to save slide',
  },
})

const isHovering = ref(false)

const mapIframe = ref<HTMLIFrameElement | null>(null)

const farmLocation = ref({
  lat: 8.95,
  lng: 125.535,
  name: "Robrosa's Farm",
  address: 'Purok 4-Sitio Tagkiling, Brgy. Anticala 8600 Butuan City, Philippines',
})

onMounted(async () => {
  await fetchCarouselSlides()
  await fetchDashboardActivities()
  setupRealtimeSubscription()
})

const handleAddSlide = () => {
  if (props.userType !== 'admin') return
  slideDialog.openForCreate()
}

const handleEditSlide = (slide: any) => {
  if (props.userType !== 'admin') return
  slideDialog.openForEdit(slide)
}

const confirmDelete = (id: number) => {
  if (props.userType !== 'admin') return
  deleteConfirmation.openDialog(id)
}

const pageTitle = computed(() => (props.userType === 'admin' ? 'Admin Dashboard' : 'Welcome Back!'))

const pageSubtitle = computed(() =>
  props.userType === 'admin'
    ? "Manage Robrosa's Farm operations and analytics"
    : "Here's what's happening at Robrosa's Farm",
)

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

const isFormValid = computed(() => {
  return !!(
    slideDialog.formData.value.title &&
    slideDialog.formData.value.description &&
    (slideDialog.isEditing.value || imageFile.value || imagePreview.value)
  )
})

const carouselCycle = computed(() => !isHovering.value)

const resetMapView = () => {
  if (mapIframe.value) {
    mapIframe.value.src = `https://www.openstreetmap.org/export/embed.html?bbox=125.5250,8.9400,125.5450,8.9600&layer=mapnik&marker=8.9500,125.5350`
  }
}
</script>

<template>
  <div class="dashboard-container">
    <!-- Page Header -->
    <PageHeader
      :title="pageTitle"
      :subtitle="pageSubtitle"
      :user-type="userType"
      :show-search="false"
      @settings-click="handleSettingsClick"
    />

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
      <!-- Left Column: Carousel and Map -->
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
                    :cycle="carouselCycle"
                    :show-arrows="carouselSlides.length > 1"
                    hide-delimiter-background
                    @mouseenter="isHovering = true"
                    @mouseleave="isHovering = false"
                  >
                    <v-carousel-item v-for="slide in carouselSlides" :key="slide.id">
                      <v-img :src="slide.image_url" height="400" cover>
                        <div class="carousel-overlay">
                          <div class="carousel-content">
                            <h2 class="text-h4 font-weight-bold mb-2">{{ slide.title }}</h2>
                            <p class="text-body-1 mb-3">{{ slide.description }}</p>

                            <!-- Admin Actions on Slide -->
                            <div v-if="userType === 'admin'" class="mt-4">
                              <v-btn
                                color="white"
                                variant="elevated"
                                size="default"
                                class="mr-2"
                                prepend-icon="mdi-pencil"
                                @click="handleEditSlide(slide)"
                              >
                                Edit
                              </v-btn>
                              <v-btn
                                color="error"
                                variant="elevated"
                                size="default"
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
                <div class="map-container position-relative">
                  <iframe
                    ref="mapIframe"
                    width="100%"
                    height="300"
                    frameborder="0"
                    scrolling="no"
                    marginheight="0"
                    marginwidth="0"
                    :src="`https://www.openstreetmap.org/export/embed.html?bbox=125.5250,8.9400,125.5450,8.9600&layer=mapnik&marker=8.9500,125.5350`"
                    style="border-radius: 12px"
                  ></iframe>

                  <!-- Reset Map Button -->
                  <v-btn
                    icon="mdi-crosshairs-gps"
                    size="small"
                    color="white"
                    elevation="2"
                    class="map-reset-btn"
                    @click="resetMapView"
                  ></v-btn>
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

      <!-- Right Column: Activities -->
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
    <v-dialog v-if="userType === 'admin'" v-model="slideDialog.isOpen.value" max-width="700px">
      <v-card class="modern-dialog">
        <v-card-title class="pa-6 text-h5 font-weight-bold">
          {{ slideDialog.isEditing.value ? 'Edit Carousel Slide' : 'New Carousel Slide' }}
        </v-card-title>

        <v-divider></v-divider>

        <v-card-text class="pa-6">
          <v-form @submit.prevent="slideDialog.submit">
            <v-text-field
              v-model="slideDialog.formData.value.title"
              label="Title *"
              placeholder="Enter slide title"
              variant="outlined"
              density="comfortable"
              :rules="[(v: any) => !!v || 'Title is required']"
              class="mb-4"
            ></v-text-field>

            <v-textarea
              v-model="slideDialog.formData.value.description"
              label="Description *"
              placeholder="Enter slide description"
              variant="outlined"
              density="comfortable"
              rows="4"
              :rules="[(v: any) => !!v || 'Description is required']"
              class="mb-4"
            ></v-textarea>

            <v-text-field
              v-model.number="slideDialog.formData.value.order_index"
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
              v-model="slideDialog.formData.value.is_active"
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
                      @click="removeImage"
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
          <v-btn variant="text" @click="slideDialog.close"> Cancel </v-btn>
          <v-btn
            color="primary"
            variant="elevated"
            :loading="slideDialog.isSubmitting.value"
            :disabled="!isFormValid"
            @click="slideDialog.submit"
          >
            {{ slideDialog.isEditing.value ? 'Update' : 'Create' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <DeleteConfirmDialog
      v-model="deleteConfirmation.isOpen.value"
      :is-deleting="deleteConfirmation.isDeleting.value"
      title="Confirm Delete"
      message="Are you sure you want to delete this carousel slide"
      @confirm="deleteConfirmation.confirmDelete"
    />

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
  position: relative;
}

.map-reset-btn {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 10;
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
