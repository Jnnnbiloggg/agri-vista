<!-- src/modules/roles/components/Announcements.vue -->

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useAnnouncements } from '../composables/useAnnouncements'
import { useInfiniteScroll } from '@/composables/useInfiniteScroll'
import HeaderActions from './shared/HeaderActions.vue'

interface Props {
  userType: 'admin' | 'user'
}

const props = defineProps<Props>()

// Get user info from auth store
const authStore = useAuthStore()
const userName = computed(() => authStore.fullName)
const userEmail = computed(() => authStore.userEmail)

// Use announcements composable
const {
  announcements,
  loading,
  error,
  totalCount,
  searchQuery,
  currentPage,
  itemsPerPage,
  totalPages,
  hasNextPage,
  hasPreviousPage,
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
} = useAnnouncements()

// Infinite scroll for user announcements view
const { isLoading: isLoadingMore } = useInfiniteScroll({
  onLoadMore: async () => {
    if (props.userType === 'user' && !loading.value) {
      await loadMoreAnnouncements()
    }
  },
  hasMore: () => props.userType === 'user' && currentPage.value < totalPages.value,
})

const showAnnouncementDialog = ref(false)
const editingAnnouncement = ref<any>(null)
const imageFile = ref<File | null>(null)
const imagePreview = ref<string | null>(null)
const deleteConfirmDialog = ref(false)
const announcementToDelete = ref<number | null>(null)
const snackbar = ref(false)
const snackbarMessage = ref('')
const snackbarColor = ref('success')

const newAnnouncement = ref({
  title: '',
  description: '',
  duration: '',
  image_url: null as string | null,
})

// Separate duration fields for better UX
const durationNumber = ref<number | null>(null)
const durationUnit = ref<string>('')

// Duration units options
const durationUnits = [
  { title: 'Minutes', value: 'minutes' },
  { title: 'Hours', value: 'hours' },
  { title: 'Days', value: 'days' },
  { title: 'Weeks', value: 'weeks' },
  { title: 'Months', value: 'months' },
  { title: 'Years', value: 'years' },
]

// Load announcements on component mount
onMounted(async () => {
  await fetchAnnouncements()
  setupRealtimeSubscription()
})

// Handle image file selection
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
    // Create preview URL
    const reader = new FileReader()
    reader.onload = (e) => {
      imagePreview.value = e.target?.result as string
    }
    reader.readAsDataURL(file)
  }
}

// Remove image
const handleRemoveImage = () => {
  imageFile.value = null
  imagePreview.value = null
  newAnnouncement.value.image_url = null
}

// Admin-only functions
const handleAddAnnouncement = () => {
  if (props.userType !== 'admin') return
  editingAnnouncement.value = null
  newAnnouncement.value = {
    title: '',
    description: '',
    duration: '',
    image_url: null,
  }
  durationNumber.value = null
  durationUnit.value = ''
  imageFile.value = null
  imagePreview.value = null
  showAnnouncementDialog.value = true
}

const handleEditAnnouncement = (announcement: any) => {
  if (props.userType !== 'admin') return
  editingAnnouncement.value = announcement
  newAnnouncement.value = {
    title: announcement.title,
    description: announcement.description,
    duration: announcement.duration,
    image_url: announcement.image_url,
  }

  // Parse existing duration to extract number and unit
  const durationMatch = announcement.duration.match(/^(\d+)\s*(\w+)$/)
  if (durationMatch) {
    durationNumber.value = parseInt(durationMatch[1])
    durationUnit.value = durationMatch[2].toLowerCase()
  } else {
    durationNumber.value = null
    durationUnit.value = ''
  }

  imageFile.value = null
  imagePreview.value = announcement.image_url
  showAnnouncementDialog.value = true
}

const handleSaveAnnouncement = async () => {
  if (props.userType !== 'admin') return

  // Validation
  if (!newAnnouncement.value.title || !newAnnouncement.value.description) {
    showSnackbar('Please fill in all required fields', 'error')
    return
  }

  // Validate duration
  if (!durationNumber.value || !durationUnit.value) {
    showSnackbar('Please specify duration with number and unit', 'error')
    return
  }

  // Combine duration number and unit
  const duration = `${durationNumber.value} ${durationUnit.value}`
  newAnnouncement.value.duration = duration

  try {
    if (editingAnnouncement.value) {
      // Update existing announcement
      const result = await updateAnnouncement(
        editingAnnouncement.value.id,
        newAnnouncement.value,
        imageFile.value,
      )

      if (result.success) {
        showSnackbar('Announcement updated successfully', 'success')
        showAnnouncementDialog.value = false
      } else {
        showSnackbar(result.error || 'Failed to update announcement', 'error')
      }
    } else {
      // Create new announcement
      const result = await createAnnouncement(newAnnouncement.value, imageFile.value)

      if (result.success) {
        showSnackbar('Announcement created successfully', 'success')
        showAnnouncementDialog.value = false
      } else {
        showSnackbar(result.error || 'Failed to create announcement', 'error')
      }
    }
  } catch (err: any) {
    showSnackbar(err.message || 'An error occurred', 'error')
  }
}

const confirmDelete = (id: number) => {
  if (props.userType !== 'admin') return
  announcementToDelete.value = id
  deleteConfirmDialog.value = true
}

const handleDeleteAnnouncement = async () => {
  if (props.userType !== 'admin' || !announcementToDelete.value) return

  try {
    const result = await deleteAnnouncement(announcementToDelete.value)

    if (result.success) {
      showSnackbar('Announcement deleted successfully', 'success')
    } else {
      showSnackbar(result.error || 'Failed to delete announcement', 'error')
    }
  } catch (err: any) {
    showSnackbar(err.message || 'An error occurred', 'error')
  } finally {
    deleteConfirmDialog.value = false
    announcementToDelete.value = null
  }
}

// Headers configuration based on user type
const tableHeaders = computed(() => {
  const baseHeaders = [
    { title: 'Image', key: 'image_url', sortable: false },
    { title: 'Title', key: 'title', sortable: true },
    { title: 'Duration', key: 'duration', sortable: false },
    { title: 'Date', key: 'created_at', sortable: true },
  ]

  if (props.userType === 'admin') {
    baseHeaders.push({ title: 'Actions', key: 'actions', sortable: false })
  }

  return baseHeaders
})

const pageTitle = computed(() =>
  props.userType === 'admin' ? 'Announcements' : 'Farm Announcements',
)

const pageSubtitle = computed(() =>
  props.userType === 'admin'
    ? 'Manage farm announcements and news'
    : 'Stay updated with the latest farm news and events',
)

const handleSearch = async (query: string) => {
  if (query) {
    await searchAnnouncements(query)
  } else {
    await clearSearch()
  }
}

const handleClearSearch = async () => {
  await clearSearch()
}

const handleSettingsClick = () => {
  console.log('Settings clicked')
  // Navigate to settings or open settings dialog
}

const showSnackbar = (message: string, color: string = 'success') => {
  snackbarMessage.value = message
  snackbarColor.value = color
  snackbar.value = true
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

// Computed property to check if form is valid
const isFormValid = computed(() => {
  return (
    newAnnouncement.value.title.trim() !== '' &&
    newAnnouncement.value.description.trim() !== '' &&
    durationNumber.value !== null &&
    durationNumber.value > 0 &&
    durationUnit.value !== ''
  )
})
</script>

<template>
  <div>
    <!-- Page Header -->
    <v-row class="mb-6">
      <v-col cols="12" class="d-flex align-center justify-space-between">
        <div>
          <h1 class="text-h4 font-weight-bold text-primary mb-2">{{ pageTitle }}</h1>
          <p class="text-h6 text-grey-darken-1">{{ pageSubtitle }}</p>
        </div>

        <HeaderActions
          search-placeholder="Search announcements..."
          :user-type="userType"
          @search="handleSearch"
          @settings-click="handleSettingsClick"
        />
      </v-col>
    </v-row>

    <!-- Loading State -->
    <v-row v-if="loading && announcements.length === 0">
      <v-col cols="12" class="text-center py-12">
        <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
        <p class="text-h6 mt-4">Loading announcements...</p>
      </v-col>
    </v-row>

    <!-- Error State -->
    <v-alert v-if="error" type="error" class="mb-6" closable>
      {{ error }}
    </v-alert>

    <!-- User View: Card Layout -->
    <template v-if="userType === 'user'">
      <!-- Empty State for Users -->
      <v-row v-if="!loading && announcements.length === 0">
        <v-col cols="12" class="text-center py-12">
          <v-icon size="100" color="grey-lighten-1">mdi-bullhorn-outline</v-icon>
          <p class="text-h6 mt-4">No announcements found</p>
          <p class="text-body-1 text-grey">
            {{ searchQuery ? 'Try adjusting your search' : 'Check back later for updates' }}
          </p>
          <v-btn
            v-if="searchQuery"
            color="primary"
            variant="outlined"
            class="mt-4"
            @click="handleClearSearch"
          >
            Clear Search
          </v-btn>
        </v-col>
      </v-row>

      <!-- User Cards -->
      <v-row v-else>
        <v-col v-for="announcement in announcements" :key="announcement.id" cols="12" md="6" lg="4">
          <v-card class="fill-height">
            <v-img
              v-if="announcement.image_url"
              :src="announcement.image_url"
              height="200"
              cover
              class="announcement-image"
            >
              <template #placeholder>
                <v-row class="fill-height ma-0" align="center" justify="center">
                  <v-progress-circular indeterminate color="grey-lighten-5"></v-progress-circular>
                </v-row>
              </template>
            </v-img>
            <div v-else class="default-image">
              <v-icon size="80" color="grey-lighten-2">mdi-bullhorn</v-icon>
            </div>

            <v-card-title class="text-h6 font-weight-bold">
              {{ announcement.title }}
            </v-card-title>

            <v-card-text>
              <p class="text-body-2 mb-3">{{ announcement.description }}</p>
              <v-chip size="small" color="primary" variant="tonal" class="mr-2">
                <v-icon start size="small">mdi-clock-outline</v-icon>
                {{ announcement.duration }}
              </v-chip>
              <v-chip size="small" color="grey" variant="tonal">
                <v-icon start size="small">mdi-calendar</v-icon>
                {{ formatDate(announcement.created_at) }}
              </v-chip>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Loading More Indicator -->
      <v-row v-if="isLoadingMore && announcements.length > 0" class="mt-4">
        <v-col cols="12" class="text-center">
          <v-progress-circular indeterminate color="primary" size="48"></v-progress-circular>
          <p class="text-body-2 text-grey-darken-1 mt-2">Loading more announcements...</p>
        </v-col>
      </v-row>

      <!-- End of List Indicator -->
      <v-row
        v-if="!loading && !isLoadingMore && announcements.length > 0 && currentPage >= totalPages"
        class="mt-4"
      >
        <v-col cols="12" class="text-center">
          <v-divider class="mb-4"></v-divider>
          <p class="text-body-2 text-grey">You've reached the end of the list</p>
        </v-col>
      </v-row>
    </template>

    <!-- Admin View: Table Layout -->
    <template v-else-if="userType === 'admin'">
      <v-row>
        <v-col cols="12">
          <v-card>
            <v-card-title class="d-flex justify-space-between align-center pa-6">
              <div class="d-flex align-center gap-4">
                <span class="text-h6">All Announcements</span>
                <v-chip v-if="totalCount > 0" color="primary" size="small"
                  >{{ totalCount }} total</v-chip
                >
              </div>
              <div class="d-flex align-center gap-2">
                <v-pagination
                  v-if="announcements.length > 0"
                  v-model="currentPage"
                  :length="totalPages"
                  :total-visible="5"
                  size="small"
                  rounded="circle"
                  @update:model-value="goToPage"
                ></v-pagination>
                <v-btn color="primary" prepend-icon="mdi-plus" @click="handleAddAnnouncement">
                  Add Announcement
                </v-btn>
              </div>
            </v-card-title>

            <v-divider></v-divider>

            <!-- Empty State for Admin -->
            <div v-if="!loading && announcements.length === 0" class="text-center py-12">
              <v-icon size="80" color="grey-lighten-1">mdi-bullhorn-outline</v-icon>
              <p class="text-h6 mt-4">No announcements yet</p>
              <p class="text-body-1 text-grey mb-4">
                {{
                  searchQuery
                    ? 'No results found. Try adjusting your search.'
                    : 'Get started by creating your first announcement!'
                }}
              </p>
              <v-btn
                v-if="searchQuery"
                color="primary"
                variant="outlined"
                @click="handleClearSearch"
              >
                Clear Search
              </v-btn>
              <v-btn
                v-else
                color="primary"
                variant="elevated"
                prepend-icon="mdi-plus"
                @click="handleAddAnnouncement"
              >
                Create First Announcement
              </v-btn>
            </div>

            <!-- Data Table -->
            <v-data-table
              v-else
              :headers="tableHeaders"
              :items="announcements"
              :loading="loading"
              hide-default-footer
              class="elevation-0"
            >
              <template #item.image_url="{ item }">
                <v-avatar v-if="item.image_url" size="60" rounded="lg" class="my-2">
                  <v-img :src="item.image_url" cover></v-img>
                </v-avatar>
                <v-avatar v-else size="60" rounded="lg" color="grey-lighten-3" class="my-2">
                  <v-icon color="grey">mdi-bullhorn</v-icon>
                </v-avatar>
              </template>

              <template #item.title="{ item }">
                <div>
                  <div class="font-weight-medium">{{ item.title }}</div>
                  <div class="text-caption text-grey">
                    {{ item.description.substring(0, 60) }}...
                  </div>
                </div>
              </template>

              <template #item.duration="{ item }">
                <v-chip size="small" color="primary" variant="tonal">
                  <v-icon start size="small">mdi-clock-outline</v-icon>
                  {{ item.duration }}
                </v-chip>
              </template>

              <template #item.created_at="{ item }">
                {{ formatDate(item.created_at) }}
              </template>

              <template #item.actions="{ item }">
                <v-btn
                  icon="mdi-pencil"
                  size="small"
                  variant="text"
                  color="primary"
                  @click="handleEditAnnouncement(item)"
                ></v-btn>
                <v-btn
                  icon="mdi-delete"
                  size="small"
                  variant="text"
                  color="error"
                  @click="confirmDelete(item.id)"
                ></v-btn>
              </template>

              <template #bottom></template>
            </v-data-table>
          </v-card>
        </v-col>
      </v-row>
    </template>

    <!-- Admin Announcement Dialog -->
    <v-dialog v-if="userType === 'admin'" v-model="showAnnouncementDialog" max-width="700px">
      <v-card>
        <v-card-title class="pa-6 text-h5 font-weight-bold">
          {{ editingAnnouncement ? 'Edit Announcement' : 'New Announcement' }}
        </v-card-title>

        <v-divider></v-divider>

        <v-card-text class="pa-6">
          <v-form @submit.prevent="handleSaveAnnouncement">
            <v-text-field
              v-model="newAnnouncement.title"
              label="Title"
              placeholder="Enter announcement title"
              variant="outlined"
              density="comfortable"
              :rules="[(v: any) => !!v || 'Title is required']"
              class="mb-4"
            ></v-text-field>

            <v-textarea
              v-model="newAnnouncement.description"
              label="Description"
              placeholder="Enter announcement description"
              variant="outlined"
              density="comfortable"
              rows="4"
              :rules="[(v: any) => !!v || 'Description is required']"
              class="mb-4"
            ></v-textarea>

            <!-- Duration Section -->
            <v-row class="mb-4">
              <v-col cols="12" class="pb-0">
                <v-label class="text-subtitle-2 mb-2">Duration *</v-label>
              </v-col>
              <v-col cols="6">
                <v-text-field
                  v-model.number="durationNumber"
                  label="Number"
                  placeholder="e.g., 3"
                  variant="outlined"
                  density="comfortable"
                  type="number"
                  min="1"
                  :rules="[
                    (v: any) => !!v || 'Number is required',
                    (v: any) => v > 0 || 'Must be greater than 0',
                  ]"
                ></v-text-field>
              </v-col>
              <v-col cols="6">
                <v-select
                  v-model="durationUnit"
                  label="Unit"
                  placeholder="Select unit"
                  variant="outlined"
                  density="comfortable"
                  :items="durationUnits"
                  :rules="[(v: any) => !!v || 'Unit is required']"
                ></v-select>
              </v-col>
            </v-row>

            <!-- Image Upload Section -->
            <div class="mb-4">
              <v-label class="text-subtitle-2 mb-2">Image (Optional)</v-label>

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
          <v-btn variant="text" @click="showAnnouncementDialog = false"> Cancel </v-btn>
          <v-btn
            color="primary"
            variant="elevated"
            :loading="loading"
            :disabled="!isFormValid"
            @click="handleSaveAnnouncement"
          >
            {{ editingAnnouncement ? 'Update' : 'Create' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="deleteConfirmDialog" max-width="400px">
      <v-card>
        <v-card-title class="pa-6">
          <v-icon color="warning" size="large" class="mr-2">mdi-alert-circle</v-icon>
          Confirm Delete
        </v-card-title>

        <v-divider></v-divider>

        <v-card-text class="pa-6">
          Are you sure you want to delete this announcement? This action cannot be undone.
        </v-card-text>

        <v-divider></v-divider>

        <v-card-actions class="px-6 py-4">
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="deleteConfirmDialog = false"> Cancel </v-btn>
          <v-btn
            color="error"
            variant="elevated"
            :loading="loading"
            @click="handleDeleteAnnouncement"
          >
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
.announcement-image {
  transition: transform 0.3s ease;
}

.announcement-image:hover {
  transform: scale(1.02);
}

.default-image {
  height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f5f5f5 0%, #e0e0e0 100%);
}

.v-data-table :deep(tbody tr:hover) {
  background-color: rgba(var(--v-theme-primary), 0.05);
}
</style>
