<!-- src/modules/roles/components/Announcements.vue -->

<script setup lang="ts">
import { ref, computed, onMounted, inject, type Ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useAnnouncements } from '../composables/useAnnouncements'
import { useInfiniteScroll } from '@/composables/useInfiniteScroll'
import { useSnackbar } from '@/composables/useSnackbar'
import { useImageHandler } from '@/composables/useImageHandler'
import { useDeleteConfirmation } from '@/composables/useDeleteConfirmation'
import { useFormDialog } from '@/composables/useFormDialog'
import { usePageActions } from '@/composables/usePageActions'
import { formatDate } from '@/utils/formatters'
import PageHeader from './shared/PageHeader.vue'
import AppSnackbar from '@/components/shared/AppSnackbar.vue'
import DeleteConfirmDialog from '@/components/shared/DeleteConfirmDialog.vue'

interface Props {
  userType: 'admin' | 'user'
}

const props = defineProps<Props>()

const drawer = inject<Ref<boolean>>('drawer')

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

// Use snackbar composable
const { snackbar, snackbarMessage, snackbarColor, showSnackbar } = useSnackbar()

// Use delete confirmation composable
const deleteConfirmation = useDeleteConfirmation({
  onDelete: async (id: number) => {
    return await deleteAnnouncement(id)
  },
  showSnackbar,
  successMessage: 'Announcement deleted successfully',
  errorMessage: 'Failed to delete announcement',
})

// Use page actions composable
const { handleSearch, handleClearSearch, handleSettingsClick } = usePageActions({
  userType: props.userType,
  onSearch: async (query: string) => {
    if (query) {
      await searchAnnouncements(query)
    } else {
      await clearSearch()
    }
  },
})

// Use image handler composable
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

// Use form dialog composable for announcement dialog
const announcementDialog = useFormDialog<{
  title: string
  description: string
  duration: string
  image_url: string | null
  id?: number
}>({
  initialData: () => ({
    title: '',
    description: '',
    duration: '',
    image_url: null as string | null,
  }),
  validate: (data) => {
    if (!data.title || !data.description) {
      return { valid: false, message: 'Please fill in all required fields' }
    }
    if (!durationNumber.value || !durationUnit.value) {
      return { valid: false, message: 'Please specify duration with number and unit' }
    }
    return { valid: true }
  },
  onSubmit: async (data, isEditing): Promise<{ success: boolean; error?: string }> => {
    // Combine duration number and unit
    const duration = `${durationNumber.value} ${durationUnit.value}`
    const formData = { ...data, duration }

    if (isEditing && data.id) {
      return await updateAnnouncement(data.id, formData, imageFile.value)
    } else {
      return await createAnnouncement(formData, imageFile.value)
    }
  },
  onOpen: () => {
    // Reset image handler when opening dialog
    imageFile.value = null
    imagePreview.value = announcementDialog.editingItem.value?.image_url || null

    // Parse duration if editing
    if (announcementDialog.editingItem.value) {
      const durationMatch = announcementDialog.editingItem.value.duration.match(/^(\d+)\s*(\w+)$/)
      if (durationMatch) {
        durationNumber.value = parseInt(durationMatch[1])
        durationUnit.value = durationMatch[2].toLowerCase()
      } else {
        durationNumber.value = null
        durationUnit.value = ''
      }
    } else {
      durationNumber.value = null
      durationUnit.value = ''
    }
  },
  showSnackbar,
  successMessage: {
    create: 'Announcement created successfully',
    update: 'Announcement updated successfully',
  },
  errorMessage: {
    create: 'Failed to create announcement',
    update: 'Failed to update announcement',
  },
})

// Load announcements on component mount
onMounted(async () => {
  await fetchAnnouncements()
  setupRealtimeSubscription()
})

// Admin-only functions
const handleAddAnnouncement = () => {
  if (props.userType !== 'admin') return
  announcementDialog.openForCreate()
}

const handleEditAnnouncement = (announcement: any) => {
  if (props.userType !== 'admin') return
  announcementDialog.openForEdit(announcement)
}

const confirmDelete = (id: number) => {
  if (props.userType !== 'admin') return
  deleteConfirmation.openDialog(id)
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

// Computed property to check if form is valid
const isFormValid = computed(() => {
  return (
    announcementDialog.formData.value.title.trim() !== '' &&
    announcementDialog.formData.value.description.trim() !== '' &&
    durationNumber.value !== null &&
    durationNumber.value > 0 &&
    durationUnit.value !== ''
  )
})

// Dialog state for showing full announcement to users
const selectedAnnouncement = ref<any | null>(null)
const showAnnouncementDialog = ref(false)

const openAnnouncement = (announcement: any) => {
  selectedAnnouncement.value = announcement
  showAnnouncementDialog.value = true
}

const closeAnnouncementDialog = () => {
  selectedAnnouncement.value = null
  showAnnouncementDialog.value = false
}
</script>

<template>
  <div>
    <!-- Page Header -->
    <PageHeader
      :title="pageTitle"
      :subtitle="pageSubtitle"
      :user-type="userType"
      search-placeholder="Search announcements..."
      @search="handleSearch"
      @settings-click="handleSettingsClick"
    />

    <!-- Error State -->
    <v-alert v-if="error" type="error" class="mb-6" closable>
      {{ error }}
    </v-alert>

    <!-- User View: Card Layout -->
    <template v-if="userType === 'user'">
      <!-- Loading State -->
      <v-row v-if="loading && announcements.length === 0">
        <v-col cols="12" class="text-center py-12">
          <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
          <p class="text-h6 mt-4">Loading announcements...</p>
        </v-col>
      </v-row>
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
          <v-card
            class="fill-height announcement-card"
            @click="openAnnouncement(announcement)"
            @keydown.enter="openAnnouncement(announcement)"
            role="button"
            tabindex="0"
          >
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
              <p class="text-body-2 mb-3 announcement-description">
                {{ announcement.description }}
              </p>

              <div class="announcement-chips">
                <v-chip size="small" color="primary" variant="tonal">
                  <v-icon start size="small">mdi-clock-outline</v-icon>
                  {{ announcement.duration }}
                </v-chip>
                <v-chip size="small" color="grey" variant="tonal">
                  <v-icon start size="small">mdi-calendar</v-icon>
                  {{ formatDate(announcement.created_at) }}
                </v-chip>
              </div>
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
            <v-card-title class="pa-4 pa-md-6">
              <!-- Mobile Layout -->
              <div class="d-md-none">
                <div class="d-flex align-center justify-space-between mb-3">
                  <div class="d-flex align-center gap-2">
                    <span class="text-h6">All Announcements</span>
                    <v-chip v-if="totalCount > 0" color="primary" size="small">{{
                      totalCount
                    }}</v-chip>
                  </div>
                </div>
                <div class="d-flex flex-column gap-2">
                  <v-btn
                    color="primary"
                    prepend-icon="mdi-plus"
                    block
                    @click="handleAddAnnouncement"
                  >
                    Add Announcement
                  </v-btn>
                  <v-pagination
                    v-if="announcements.length > 0"
                    v-model="currentPage"
                    :length="totalPages"
                    :total-visible="3"
                    size="small"
                    rounded="circle"
                    @update:model-value="goToPage"
                  ></v-pagination>
                </div>
              </div>

              <!-- Desktop Layout -->
              <div class="d-none d-md-flex justify-space-between align-center">
                <div class="d-flex align-center gap-2">
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
              </div>
            </v-card-title>

            <v-divider></v-divider>

            <v-card-text>
              <!-- Loading State -->
              <div v-if="loading" class="text-center py-12">
                <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
                <p class="text-h6 text-grey-darken-1 mt-4">Loading announcements...</p>
              </div>

              <!-- Empty State for Admin -->
              <div v-else-if="announcements.length === 0" class="text-center py-12">
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
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </template>

    <!-- Admin Announcement Dialog -->
    <v-dialog
      v-if="userType === 'admin'"
      v-model="announcementDialog.isOpen.value"
      max-width="700px"
    >
      <v-card>
        <v-card-title class="pa-6 text-h5 font-weight-bold">
          {{ announcementDialog.isEditing.value ? 'Edit Announcement' : 'New Announcement' }}
        </v-card-title>

        <v-divider></v-divider>

        <v-card-text class="pa-6">
          <v-form @submit.prevent="announcementDialog.submit">
            <v-text-field
              v-model="announcementDialog.formData.value.title"
              label="Title"
              placeholder="Enter announcement title"
              variant="outlined"
              density="comfortable"
              :rules="[(v: any) => !!v || 'Title is required']"
              class="mb-4"
            ></v-text-field>

            <v-textarea
              v-model="announcementDialog.formData.value.description"
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
          <v-btn variant="text" @click="announcementDialog.close"> Cancel </v-btn>
          <v-btn
            color="primary"
            variant="elevated"
            :loading="announcementDialog.isSubmitting.value"
            :disabled="!isFormValid"
            @click="announcementDialog.submit"
          >
            {{ announcementDialog.isEditing.value ? 'Update' : 'Create' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete Confirmation Dialog -->
    <DeleteConfirmDialog
      v-model="deleteConfirmation.isOpen.value"
      :is-deleting="deleteConfirmation.isDeleting.value"
      title="Confirm Delete"
      message="Are you sure you want to delete this announcement"
      @confirm="deleteConfirmation.confirmDelete"
    />

    <!-- User: Full Announcement Dialog -->
    <v-dialog
      v-if="userType === 'user'"
      v-model="showAnnouncementDialog"
      width="800px"
      max-height="800px"
    >
      <v-card>
        <v-img
          v-if="selectedAnnouncement && selectedAnnouncement.image_url"
          :src="selectedAnnouncement.image_url"
          height="300"
          cover
        ></v-img>

        <v-card-title class="pa-4 text-h6 font-weight-bold">
          {{ selectedAnnouncement?.title }}
        </v-card-title>

        <v-divider></v-divider>

        <v-card-text class="pa-4">
          <p class="mb-4">{{ selectedAnnouncement?.description }}</p>
          <v-chip size="small" color="primary" variant="tonal" class="mr-2">
            <v-icon start size="small">mdi-clock-outline</v-icon>
            {{ selectedAnnouncement?.duration }}
          </v-chip>
          <v-chip size="small" color="grey" variant="tonal">
            <v-icon start size="small">mdi-calendar</v-icon>
            {{ formatDate(selectedAnnouncement?.created_at) }}
          </v-chip>
        </v-card-text>

        <v-card-actions class="px-4 py-3">
          <v-spacer></v-spacer>
          <v-btn variant="tonal" @click="closeAnnouncementDialog">Close</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

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

.announcement-description {
  display: -webkit-box;
  line-clamp: 3;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}

.announcement-card {
  cursor: pointer;
}

.announcement-card:focus-visible {
  outline: 2px solid rgba(76, 175, 80, 0.35);
  outline-offset: 3px;
}

/* Make card use column layout and push chips to the bottom so all cards align */
.announcement-card {
  display: flex;
  flex-direction: column;
}

.announcement-card .v-card-text {
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
}

.announcement-chips {
  margin-top: auto;
  display: flex;
  gap: 8px;
  align-items: center;
}
</style>
