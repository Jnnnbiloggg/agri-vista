<script setup lang="ts">
import { ref, computed, onMounted, inject, type Ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useTrainings } from '../composables/useTrainings'
import { useInfiniteScroll } from '@/composables/useInfiniteScroll'
import HeaderActions from './shared/HeaderActions.vue'
import AppSnackbar from '@/components/shared/AppSnackbar.vue'
import DeleteConfirmDialog from '@/components/shared/DeleteConfirmDialog.vue'
import { useSnackbar } from '@/composables/useSnackbar'
import { useFormDialog } from '@/composables/useFormDialog'
import { useImageHandler } from '@/composables/useImageHandler'
import { useDeleteConfirmation } from '@/composables/useDeleteConfirmation'
import { usePageActions } from '@/composables/usePageActions'
import { formatDate } from '@/utils/formatters'
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

// Use trainings composable
const {
  trainings,
  registrations,
  loading,
  error,
  trainingsTotal,
  registrationsTotal,
  trainingsPage,
  registrationsPage,
  itemsPerPage,
  trainingsTotalPages,
  registrationsTotalPages,
  fetchTrainings,
  loadMoreTrainings,
  searchTrainings,
  clearTrainingsSearch,
  createTraining,
  updateTraining,
  deleteTraining,
  goToTrainingsPage,
  fetchRegistrations,
  searchRegistrations,
  clearRegistrationsSearch,
  createRegistration,
  updateRegistration,
  deleteRegistration,
  goToRegistrationsPage,
  setupRealtimeSubscriptions,
} = useTrainings()

// Infinite scroll for user trainings view
const { isLoading: isLoadingMore } = useInfiniteScroll({
  onLoadMore: async () => {
    if (props.userType === 'user' && !loading.value) {
      await loadMoreTrainings()
    }
  },
  hasMore: () => props.userType === 'user' && trainingsPage.value < trainingsTotalPages.value,
})

// Selected training for registration
const selectedTraining = ref<any | null>(null)

// Use snackbar composable
const { snackbar, snackbarMessage, snackbarColor, showSnackbar } = useSnackbar()

// Use delete confirmation composable
const deleteConfirmation = useDeleteConfirmation<{ type: 'training' | 'registration'; id: number }>(
  {
    onDelete: async (target) => {
      if (target.type === 'training') {
        const result = await deleteTraining(target.id)
        return { success: result.success, error: result.error || undefined }
      } else {
        const result = await deleteRegistration(target.id)
        return { success: result.success, error: result.error || undefined }
      }
    },
    showSnackbar,
    successMessage: (target) =>
      `${target.type.charAt(0).toUpperCase() + target.type.slice(1)} deleted successfully`,
    errorMessage: (target) => `Failed to delete ${target.type}`,
  },
)

// Use page actions composable
const { handleSearch, handleClearSearch, handleSettingsClick } = usePageActions({
  userType: props.userType,
  onSearch: async (query: string) => {
    if (props.userType === 'admin') {
      if (adminTab.value === 'trainings') {
        if (query) {
          await searchTrainings(query)
        } else {
          await clearTrainingsSearch()
        }
      } else {
        if (query) {
          await searchRegistrations(query)
        } else {
          await clearRegistrationsSearch()
        }
      }
    } else {
      if (query) {
        await searchTrainings(query)
      } else {
        await clearTrainingsSearch()
      }
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

// View filter and admin tab
const viewFilter = ref<'in_progress' | 'completed'>('in_progress')
const adminTab = ref('trainings')

// Topic input for training dialog
const topicInput = ref('')

// Training dialog (admin)
interface TrainingForm {
  id?: number
  name: string
  description: string
  location: string
  start_date_time: string
  end_date_time: string
  capacity: number
  topics: string[]
}

const trainingDialog = useFormDialog<TrainingForm>({
  initialData: {
    name: '',
    description: '',
    location: '',
    start_date_time: '',
    end_date_time: '',
    capacity: 0,
    topics: [],
  },
  onOpen: () => {
    topicInput.value = ''
    removeImage()
    // Load existing image for edit mode
    const editingTraining = trainingDialog.editingItem.value as any
    if (editingTraining?.image_url) {
      imagePreview.value = editingTraining.image_url
    }
  },
  onSubmit: async (formData) => {
    if (
      !formData.name ||
      !formData.location ||
      !formData.start_date_time ||
      !formData.end_date_time
    ) {
      return { success: false, error: 'Please fill in all required fields' }
    }

    try {
      let result
      if (formData.id) {
        result = await updateTraining(
          formData.id,
          {
            name: formData.name,
            description: formData.description,
            location: formData.location,
            start_date_time: formData.start_date_time,
            end_date_time: formData.end_date_time,
            capacity: formData.capacity,
            topics: formData.topics,
            image_url: imagePreview.value,
          },
          imageFile.value,
        )
      } else {
        result = await createTraining(
          {
            name: formData.name,
            description: formData.description,
            location: formData.location,
            start_date_time: formData.start_date_time,
            end_date_time: formData.end_date_time,
            capacity: formData.capacity,
            topics: formData.topics,
            image_url: null,
          },
          imageFile.value,
        )
      }

      if (result.success) {
        return { success: true }
      } else {
        return { success: false, error: result.error || 'Failed to save training' }
      }
    } catch (err: any) {
      return { success: false, error: err.message || 'An error occurred' }
    }
  },
  showSnackbar,
})

// Registration dialog (user) - kept simple as single confirmation
const showRegisterDialog = ref(false)

// Load data on component mount
onMounted(async () => {
  if (props.userType === 'admin') {
    await fetchTrainings()
    await fetchRegistrations()
  } else {
    await fetchTrainings()
    await fetchRegistrations() // Fetch user's own registrations
  }
  setupRealtimeSubscriptions()
})

// Computed filtered trainings
const filteredTrainings = computed(() => {
  const now = new Date()
  return trainings.value.filter((training) => {
    const startDate = new Date(training.start_date_time)
    const endDate = new Date(training.end_date_time)

    if (viewFilter.value === 'in_progress') return endDate >= now
    if (viewFilter.value === 'completed') return endDate < now
    return true
  })
})

// Format date and time
const formatDateTime = (dateTime: string) => {
  const date = new Date(dateTime)
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// Topic management
const addTopic = () => {
  if (topicInput.value.trim()) {
    trainingDialog.formData.value.topics.push(topicInput.value.trim())
    topicInput.value = ''
  }
}

const removeTopic = (index: number) => {
  trainingDialog.formData.value.topics.splice(index, 1)
}

// Admin functions
const handleAddTraining = () => trainingDialog.openForCreate()

const handleEditTraining = (training: any) => {
  // Convert ISO datetime to datetime-local format (YYYY-MM-DDTHH:mm)
  const formatDateTimeLocal = (isoString: string) => {
    const date = new Date(isoString)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    return `${year}-${month}-${day}T${hours}:${minutes}`
  }

  trainingDialog.openForEdit({
    id: training.id,
    name: training.name,
    description: training.description || '',
    location: training.location,
    start_date_time: formatDateTimeLocal(training.start_date_time),
    end_date_time: formatDateTimeLocal(training.end_date_time),
    capacity: training.capacity,
    topics: [...training.topics],
  })
}

const confirmDelete = (type: 'training' | 'registration', id: number) => {
  deleteConfirmation.openDialog({ type, id })
}

const pageTitle = computed(() =>
  props.userType === 'admin' ? 'Training Management' : 'Trainings & Workshops',
)

const pageSubtitle = computed(() =>
  props.userType === 'admin'
    ? 'Manage training sessions and registrations'
    : 'Browse and register for upcoming trainings',
)

const updateRegistrationStatus = async (
  registrationId: number,
  status: 'pending' | 'confirmed' | 'cancelled',
) => {
  try {
    const result = await updateRegistration(registrationId, { status })
    if (result.success) {
      showSnackbar(`Registration ${status} successfully!`, 'success')
    } else {
      showSnackbar(result.error || 'Failed to update registration', 'error')
    }
  } catch (err: any) {
    showSnackbar(err.message || 'An error occurred', 'error')
  }
}

const downloadRegistrations = () => {
  const csvContent = [
    ['Training Name', 'Participant', 'Email', 'Registered Date', 'Status'],
    ...registrations.value.map((r) => [
      r.training_name,
      r.user_name,
      r.user_email,
      new Date(r.created_at).toLocaleDateString(),
      r.status,
    ]),
  ]
    .map((row) => row.join(','))
    .join('\n')

  const blob = new Blob([csvContent], { type: 'text/csv' })
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `training_registrations_${new Date().toISOString().split('T')[0]}.csv`
  a.click()
}

// User functions
const openRegisterDialog = (training: any) => {
  selectedTraining.value = training
  showRegisterDialog.value = true
}

const confirmRegistration = async () => {
  if (!selectedTraining.value) return

  try {
    const result = await createRegistration({
      training_id: selectedTraining.value.id,
      training_name: selectedTraining.value.name,
      status: 'pending',
    })

    if (result.success) {
      showRegisterDialog.value = false
      showSnackbar('Registration submitted successfully!', 'success')
    } else {
      showSnackbar(result.error || 'Failed to register', 'error')
    }
  } catch (err: any) {
    showSnackbar(err.message || 'An error occurred', 'error')
  }
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'confirmed':
      return 'success'
    case 'pending':
      return 'warning'
    case 'cancelled':
      return 'error'
    default:
      return 'grey'
  }
}

const trainingHeaders = [
  { title: 'Training', key: 'name' },
  { title: 'Location', key: 'location' },
  { title: 'Start Date & Time', key: 'start_date_time' },
  { title: 'Capacity', key: 'capacity' },
  { title: 'Actions', key: 'actions' },
]

const registrationHeaders = [
  { title: 'Training Name', key: 'training_name' },
  { title: 'Participant', key: 'user_name' },
  { title: 'Email', key: 'user_email' },
  { title: 'Registered Date', key: 'created_at' },
  { title: 'Status', key: 'status' },
  { title: 'Actions', key: 'actions' },
]

// Check if user has already registered for a training
const getUserRegistration = (trainingId: number) => {
  return registrations.value.find(
    (reg) => reg.training_id === trainingId && reg.user_id === authStore.userId,
  )
}

const getRegistrationStatusText = (status: string) => {
  switch (status) {
    case 'confirmed':
      return 'Registration Confirmed'
    case 'pending':
      return 'Waiting for Confirmation'
    case 'cancelled':
      return 'Registration Cancelled'
    default:
      return 'Register Now'
  }
}

const isTrainingCompleted = (training: any | null) => {
  if (!training) return false
  try {
    return new Date(training.end_date_time) < new Date()
  } catch (e) {
    return false
  }
}
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
        <v-tab value="trainings">Training Sessions</v-tab>
        <v-tab value="registrations">Registrations</v-tab>
      </v-tabs>

      <v-window v-model="adminTab">
        <!-- Trainings Tab -->
        <v-window-item value="trainings">
          <v-row>
            <v-col cols="12">
              <v-card>
                <v-card-title class="pa-4 pa-md-6">
                  <!-- Mobile Layout -->
                  <div class="d-md-none">
                    <div class="d-flex align-center justify-space-between mb-3">
                      <div class="d-flex align-center gap-2">
                        <span class="text-h6">Training Sessions</span>
                        <v-chip v-if="trainingsTotal > 0" color="primary" size="small">{{
                          trainingsTotal
                        }}</v-chip>
                      </div>
                    </div>
                    <div class="d-flex flex-column gap-2">
                      <v-btn
                        color="primary"
                        variant="elevated"
                        prepend-icon="mdi-plus"
                        block
                        @click="handleAddTraining"
                      >
                        Add Training
                      </v-btn>
                      <v-pagination
                        v-if="trainings.length > 0"
                        v-model="trainingsPage"
                        :length="trainingsTotalPages"
                        :total-visible="3"
                        size="small"
                        rounded="circle"
                        @update:model-value="goToTrainingsPage"
                      ></v-pagination>
                    </div>
                  </div>

                  <!-- Desktop Layout -->
                  <div class="d-none d-md-flex justify-space-between align-center">
                    <div class="d-flex align-center gap-2">
                      <span class="text-h6">Training Sessions</span>
                      <v-chip v-if="trainingsTotal > 0" color="primary" size="small"
                        >{{ trainingsTotal }} total</v-chip
                      >
                    </div>
                    <div class="d-flex align-center gap-2">
                      <v-pagination
                        v-if="trainings.length > 0"
                        v-model="trainingsPage"
                        :length="trainingsTotalPages"
                        :total-visible="5"
                        size="small"
                        rounded="circle"
                        @update:model-value="goToTrainingsPage"
                      ></v-pagination>
                      <v-btn
                        color="primary"
                        variant="elevated"
                        prepend-icon="mdi-plus"
                        @click="handleAddTraining"
                      >
                        Add Training
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
                    <div class="text-h6 text-grey-darken-1 mt-4">Loading trainings...</div>
                  </div>

                  <!-- Empty State -->
                  <div v-else-if="trainings.length === 0" class="text-center py-12">
                    <v-icon icon="mdi-school-outline" size="80" color="grey-lighten-1"></v-icon>
                    <div class="text-h6 text-grey-darken-1 mt-4">No trainings yet</div>
                    <div class="text-body-2 text-grey mt-2">
                      Get started by creating your first training session
                    </div>
                    <v-btn
                      color="primary"
                      variant="elevated"
                      prepend-icon="mdi-plus"
                      class="mt-4"
                      @click="handleAddTraining"
                    >
                      Add Training
                    </v-btn>
                  </div>

                  <!-- Data Table -->
                  <v-data-table
                    v-else
                    :headers="trainingHeaders"
                    :items="trainings"
                    item-value="id"
                    hide-default-footer
                  >
                    <template v-slot:item.name="{ item }">
                      <div class="d-flex align-center">
                        <v-avatar size="60" rounded="lg" class="mr-3">
                          <v-img
                            :src="
                              item.image_url ||
                              'https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=400'
                            "
                            cover
                          ></v-img>
                        </v-avatar>
                        <div>
                          <div class="font-weight-medium">{{ item.name }}</div>
                          <div class="text-caption text-grey-darken-1">
                            {{
                              item.description
                                ? item.description.substring(0, 50) + '...'
                                : 'No description'
                            }}
                          </div>
                        </div>
                      </div>
                    </template>

                    <template v-slot:item.start_date_time="{ item }">
                      <div>
                        <div>{{ formatDateTime(item.start_date_time) }}</div>
                        <div class="text-caption text-grey-darken-1">
                          to {{ formatDateTime(item.end_date_time) }}
                        </div>
                      </div>
                    </template>

                    <template v-slot:item.actions="{ item }">
                      <v-btn
                        icon="mdi-pencil"
                        size="small"
                        variant="text"
                        color="primary"
                        @click="handleEditTraining(item)"
                      ></v-btn>
                      <v-btn
                        icon="mdi-delete"
                        size="small"
                        variant="text"
                        color="error"
                        @click="confirmDelete('training', item.id)"
                      ></v-btn>
                    </template>
                  </v-data-table>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>
        </v-window-item>

        <!-- Registrations Tab -->
        <v-window-item value="registrations">
          <v-row>
            <v-col cols="12">
              <v-card>
                <v-card-title class="pa-4 pa-md-6">
                  <!-- Mobile Layout -->
                  <div class="d-md-none">
                    <div class="d-flex align-center justify-space-between mb-3">
                      <div class="d-flex align-center gap-2">
                        <span class="text-h6">Registration List</span>
                        <v-chip v-if="registrationsTotal > 0" color="primary" size="small">{{
                          registrationsTotal
                        }}</v-chip>
                      </div>
                    </div>
                    <div class="d-flex flex-column gap-2">
                      <v-btn
                        color="success"
                        variant="elevated"
                        prepend-icon="mdi-download"
                        block
                        @click="downloadRegistrations"
                      >
                        Export Registrations
                      </v-btn>
                      <v-pagination
                        v-if="registrations.length > 0"
                        v-model="registrationsPage"
                        :length="registrationsTotalPages"
                        :total-visible="3"
                        size="small"
                        rounded="circle"
                        @update:model-value="goToRegistrationsPage"
                      ></v-pagination>
                    </div>
                  </div>

                  <!-- Desktop Layout -->
                  <div class="d-none d-md-flex justify-space-between align-center">
                    <div class="d-flex align-center gap-2">
                      <span class="text-h6">Registration List</span>
                      <v-chip v-if="registrationsTotal > 0" color="primary" size="small"
                        >{{ registrationsTotal }} total</v-chip
                      >
                    </div>
                    <div class="d-flex align-center gap-2">
                      <v-pagination
                        v-if="registrations.length > 0"
                        v-model="registrationsPage"
                        :length="registrationsTotalPages"
                        :total-visible="5"
                        size="small"
                        rounded="circle"
                        @update:model-value="goToRegistrationsPage"
                      ></v-pagination>
                      <v-btn
                        color="success"
                        variant="elevated"
                        prepend-icon="mdi-download"
                        @click="downloadRegistrations"
                      >
                        Export Registrations
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
                    <div class="text-h6 text-grey-darken-1 mt-4">Loading registrations...</div>
                  </div>

                  <!-- Empty State -->
                  <div v-else-if="registrations.length === 0" class="text-center py-12">
                    <v-icon
                      icon="mdi-account-multiple-outline"
                      size="80"
                      color="grey-lighten-1"
                    ></v-icon>
                    <div class="text-h6 text-grey-darken-1 mt-4">No registrations yet</div>
                    <div class="text-body-2 text-grey mt-2">
                      Registrations will appear here when users sign up for trainings
                    </div>
                  </div>

                  <!-- Registrations Table -->
                  <v-data-table
                    v-else
                    :headers="registrationHeaders"
                    :items="registrations"
                    item-value="id"
                    hide-default-footer
                  >
                    <template v-slot:item.created_at="{ item }">
                      {{ new Date(item.created_at).toLocaleDateString() }}
                    </template>

                    <template v-slot:item.status="{ item }">
                      <v-chip :color="getStatusColor(item.status)" size="small" variant="tonal">
                        {{ item.status }}
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
                            @click="updateRegistrationStatus(item.id, 'confirmed')"
                          ></v-list-item>
                          <v-list-item
                            title="Cancel"
                            @click="updateRegistrationStatus(item.id, 'cancelled')"
                          ></v-list-item>
                          <v-list-item
                            title="Delete"
                            @click="confirmDelete('registration', item.id)"
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

    <!-- User View -->
    <template v-else>
      <!-- Filter Buttons -->
      <v-row class="mb-4">
        <v-col cols="12">
          <v-btn-toggle
            v-model="viewFilter"
            color="primary"
            variant="outlined"
            mandatory
            style="gap: 8px"
          >
            <v-btn value="in_progress" style="flex: 1">In Progress</v-btn>
            <v-btn value="completed" style="flex: 1">Completed</v-btn>
          </v-btn-toggle>
        </v-col>
      </v-row>

      <!-- Loading State -->
      <div v-if="loading" class="text-center py-12">
        <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
        <div class="text-h6 text-grey-darken-1 mt-4">Loading trainings...</div>
      </div>

      <!-- Empty State -->
      <div v-else-if="filteredTrainings.length === 0" class="text-center py-12">
        <v-card class="pa-12">
          <v-icon icon="mdi-school-outline" size="120" color="grey-lighten-1"></v-icon>
          <div class="text-h5 text-grey-darken-1 mt-6">
            No {{ viewFilter === 'in_progress' ? 'in progress' : 'completed' }} trainings
          </div>
          <div class="text-body-1 text-grey mt-2">Check back later for new training sessions</div>
        </v-card>
      </div>

      <!-- Training Cards -->
      <v-row v-else>
        <v-col v-for="training in filteredTrainings" :key="training.id" cols="12" sm="6" md="4">
          <v-card
            class="fill-height training-card"
            @click="!isTrainingCompleted(training) && openRegisterDialog(training)"
            @keydown.enter="!isTrainingCompleted(training) && openRegisterDialog(training)"
            role="button"
            :tabindex="isTrainingCompleted(training) ? -1 : 0"
            :class="{ 'disabled-training': isTrainingCompleted(training) }"
          >
            <v-img v-if="training.image_url" :src="training.image_url" height="200" cover></v-img>
            <div v-else class="bg-grey-lighten-3 d-flex align-center justify-center default-image">
              <v-icon icon="mdi-school-outline" size="64" color="grey-lighten-1"></v-icon>
            </div>

            <v-card-title class="text-h6">{{ training.name }}</v-card-title>

            <v-card-text>
              <div v-if="training.description" class="text-body-2 mb-3 training-description">
                {{ training.description }}
              </div>

              <div class="mb-2">
                <v-icon icon="mdi-map-marker" size="small" class="mr-1"></v-icon>
                <span class="text-body-2">{{ training.location }}</span>
              </div>

              <div class="mb-2">
                <v-icon icon="mdi-calendar" size="small" class="mr-1"></v-icon>
                <span class="text-body-2">{{ formatDateTime(training.start_date_time) }}</span>
              </div>

              <div class="mb-3">
                <v-icon icon="mdi-clock-outline" size="small" class="mr-1"></v-icon>
                <span class="text-body-2">{{ formatDateTime(training.end_date_time) }}</span>
              </div>

              <div class="mb-3">
                <v-icon icon="mdi-account-group" size="small" class="mr-1"></v-icon>
                <span class="text-body-2">Capacity: {{ training.capacity }} participants</span>
              </div>

              <div class="mb-3">
                <div class="text-caption text-grey mb-2">Topics Covered:</div>
                <div class="d-flex flex-wrap gap-2">
                  <v-chip
                    v-for="(topic, index) in training.topics"
                    :key="index"
                    size="small"
                    variant="tonal"
                    color="primary"
                  >
                    {{ topic }}
                  </v-chip>
                </div>
              </div>
            </v-card-text>

            <v-card-actions>
              <template v-if="getUserRegistration(training.id)">
                <v-chip
                  :color="getStatusColor(getUserRegistration(training.id)!.status)"
                  variant="flat"
                  size="large"
                  class="w-100 justify-center"
                >
                  <v-icon
                    :icon="
                      getUserRegistration(training.id)!.status === 'confirmed'
                        ? 'mdi-check-circle'
                        : getUserRegistration(training.id)!.status === 'pending'
                          ? 'mdi-clock-outline'
                          : 'mdi-close-circle'
                    "
                    start
                  ></v-icon>
                  {{ getRegistrationStatusText(getUserRegistration(training.id)!.status) }}
                </v-chip>
              </template>
            </v-card-actions>
          </v-card>
        </v-col>
      </v-row>

      <!-- Loading More Indicator -->
      <v-row v-if="isLoadingMore && filteredTrainings.length > 0" class="mt-4">
        <v-col cols="12" class="text-center">
          <v-progress-circular indeterminate color="primary" size="48"></v-progress-circular>
          <p class="text-body-2 text-grey-darken-1 mt-2">Loading more trainings...</p>
        </v-col>
      </v-row>

      <!-- End of List Indicator -->
      <v-row
        v-if="
          !loading &&
          !isLoadingMore &&
          filteredTrainings.length > 0 &&
          trainingsPage >= trainingsTotalPages
        "
        class="mt-4"
      >
        <v-col cols="12" class="text-center">
          <v-divider class="mb-4"></v-divider>
          <p class="text-body-2 text-grey">You've reached the end of the list</p>
        </v-col>
      </v-row>
    </template>

    <!-- Training Dialog (Admin) -->
    <v-dialog v-if="userType === 'admin'" v-model="trainingDialog.isOpen.value" max-width="800px">
      <v-card>
        <v-card-title>{{
          trainingDialog.isEditing.value ? 'Edit Training' : 'Add New Training'
        }}</v-card-title>
        <v-card-text>
          <v-row>
            <v-col cols="12">
              <v-text-field
                v-model="trainingDialog.formData.value.name"
                label="Training Name *"
                variant="outlined"
                required
              ></v-text-field>
            </v-col>

            <v-col cols="12">
              <v-textarea
                v-model="trainingDialog.formData.value.description"
                label="Description"
                variant="outlined"
                rows="3"
              ></v-textarea>
            </v-col>

            <v-col cols="12" sm="6">
              <v-text-field
                v-model="trainingDialog.formData.value.location"
                label="Location *"
                variant="outlined"
                required
              ></v-text-field>
            </v-col>

            <v-col cols="12" sm="6">
              <v-text-field
                v-model.number="trainingDialog.formData.value.capacity"
                label="Capacity"
                type="number"
                variant="outlined"
                min="0"
              ></v-text-field>
            </v-col>

            <v-col cols="12" sm="6">
              <v-text-field
                v-model="trainingDialog.formData.value.start_date_time"
                label="Start Date & Time *"
                type="datetime-local"
                variant="outlined"
                required
              ></v-text-field>
            </v-col>

            <v-col cols="12" sm="6">
              <v-text-field
                v-model="trainingDialog.formData.value.end_date_time"
                label="End Date & Time *"
                type="datetime-local"
                variant="outlined"
                required
              ></v-text-field>
            </v-col>

            <v-col cols="12">
              <div class="mb-2">
                <label class="text-body-2 font-weight-medium">Topics Covered</label>
              </div>
              <v-row no-gutters>
                <v-col cols="9" class="pr-2">
                  <v-text-field
                    v-model="topicInput"
                    placeholder="Enter topic"
                    variant="outlined"
                    density="compact"
                    @keyup.enter="addTopic"
                  ></v-text-field>
                </v-col>
                <v-col cols="3">
                  <v-btn color="primary" variant="elevated" block @click="addTopic">
                    Add Topic
                  </v-btn>
                </v-col>
              </v-row>
              <div class="d-flex flex-wrap gap-2 mt-2">
                <v-chip
                  v-for="(topic, index) in trainingDialog.formData.value.topics"
                  :key="index"
                  closable
                  @click:close="removeTopic(index)"
                >
                  {{ topic }}
                </v-chip>
              </div>
            </v-col>

            <v-col cols="12">
              <div class="mb-2">
                <label class="text-body-2 font-weight-medium">Training Image</label>
              </div>
              <v-file-input
                label="Upload Image"
                variant="outlined"
                accept="image/*"
                prepend-icon="mdi-camera"
                @change="handleImageSelect"
              ></v-file-input>

              <div v-if="imagePreview" class="mt-4 position-relative">
                <v-img :src="imagePreview" height="200" cover class="rounded"></v-img>
                <v-btn
                  icon="mdi-close"
                  size="small"
                  color="error"
                  class="position-absolute"
                  style="top: 8px; right: 8px"
                  @click="removeImage"
                ></v-btn>
              </div>
            </v-col>
          </v-row>
        </v-card-text>

        <v-card-actions class="px-6 pb-6">
          <v-spacer></v-spacer>
          <v-btn variant="outlined" @click="trainingDialog.close">Cancel</v-btn>
          <v-btn
            color="primary"
            variant="elevated"
            :loading="trainingDialog.isSubmitting.value"
            @click="trainingDialog.submit"
          >
            {{ trainingDialog.isEditing.value ? 'Update' : 'Create' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Registration Dialog (User) -->
    <v-dialog v-if="userType === 'user'" v-model="showRegisterDialog" max-width="500px">
      <v-card>
        <v-card-title>Register for Training</v-card-title>
        <v-card-text>
          <div v-if="selectedTraining">
            <div class="text-h6 mb-2">{{ selectedTraining.name }}</div>
            <div class="mb-2">
              <v-icon icon="mdi-map-marker" size="small" class="mr-1"></v-icon>
              <span>{{ selectedTraining.location }}</span>
            </div>
            <div class="mb-2">
              <v-icon icon="mdi-calendar" size="small" class="mr-1"></v-icon>
              <span>{{ formatDateTime(selectedTraining.start_date_time) }}</span>
            </div>
            <div class="mb-4">
              <v-icon icon="mdi-clock-outline" size="small" class="mr-1"></v-icon>
              <span>{{ formatDateTime(selectedTraining.end_date_time) }}</span>
            </div>

            <v-alert type="info" variant="tonal" class="mt-4">
              You are registering as: <strong>{{ userName }}</strong> ({{ userEmail }})
            </v-alert>

            <v-alert type="warning" variant="tonal" class="mt-2">
              Your registration will be pending until confirmed by the admin.
            </v-alert>
          </div>
        </v-card-text>

        <v-card-actions class="px-6 pb-6">
          <v-spacer></v-spacer>
          <v-btn variant="outlined" @click="showRegisterDialog = false">Cancel</v-btn>
          <v-btn
            color="primary"
            variant="elevated"
            :disabled="selectedTraining && isTrainingCompleted(selectedTraining)"
            @click="confirmRegistration"
          >
            Register
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete Confirmation Dialog -->
    <DeleteConfirmDialog
      v-model="deleteConfirmation.isOpen.value"
      :is-deleting="deleteConfirmation.isDeleting.value"
      title="Confirm Delete"
      :message="`Are you sure you want to delete this ${deleteConfirmation.itemToDelete.value?.type || 'item'}? This action cannot be undone.`"
      @confirm="deleteConfirmation.confirmDelete"
      @cancel="deleteConfirmation.closeDialog"
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
.gap-2 {
  gap: 8px;
}

.training-description {
  display: -webkit-box;
  line-clamp: 3;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Ensure images have consistent height and are cropped uniformly so cards align */
.training-card > .v-img,
.training-card .v-img,
.training-card > .default-image {
  height: 200px;
  min-height: 200px;
  max-height: 200px;
  flex-shrink: 0;
}

.training-card .v-img img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

/* Make the card layout a column and grow the text area so footer stays at the bottom */
.training-card {
  display: flex;
  flex-direction: column;
  /* desktop baseline; lowered so cards don't appear overly tall */
  min-height: 420px;
}

.training-card .v-card-text {
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
}

/* Limit title height to two lines so it doesn't push content unexpectedly */
.training-card .v-card-title {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  min-height: 48px;
}

.disabled-training {
  opacity: 0.65;
  cursor: default;
}

/* Responsive adjustments: slightly smaller cards on narrower screens */
@media (max-width: 960px) {
  .training-card {
    min-height: 400px;
  }

  .training-card > .v-img,
  .training-card .v-img,
  .training-card > .default-image {
    height: 180px;
    min-height: 180px;
    max-height: 180px;
  }
}

@media (max-width: 600px) {
  .training-card {
    min-height: 340px;
  }

  .training-card > .v-img,
  .training-card .v-img,
  .training-card > .default-image {
    height: 140px;
    min-height: 140px;
    max-height: 140px;
  }
}
</style>
