<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useTrainings } from '../composables/useTrainings'
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

// Dialog states
const showTrainingDialog = ref(false)
const showRegisterDialog = ref(false)
const showDeleteDialog = ref(false)
const selectedTraining = ref<any | null>(null)
const editingTraining = ref<any | null>(null)
const deleteTarget = ref<{ type: 'training' | 'registration'; id: number } | null>(null)

// Snackbar
const snackbar = ref(false)
const snackbarMessage = ref('')
const snackbarColor = ref('success')

const showSnackbar = (message: string, color: 'success' | 'error' | 'info' = 'success') => {
  snackbarMessage.value = message
  snackbarColor.value = color
  snackbar.value = true
}

// View filter and admin tab
const viewFilter = ref<'upcoming' | 'current' | 'past'>('upcoming')
const adminTab = ref('trainings')

// Forms
const newTraining = ref({
  name: '',
  description: '',
  location: '',
  start_date_time: '',
  end_date_time: '',
  capacity: 0,
  topics: [] as string[],
})

const topicInput = ref('')
const imageFile = ref<File | null>(null)
const imagePreview = ref<string | null>(null)

// Load data on component mount
onMounted(async () => {
  if (props.userType === 'admin') {
    await fetchTrainings()
    await fetchRegistrations()
  } else {
    await fetchTrainings()
  }
  setupRealtimeSubscriptions()
})

// Computed filtered trainings
const filteredTrainings = computed(() => {
  const now = new Date()
  return trainings.value.filter((training) => {
    const startDate = new Date(training.start_date_time)
    const endDate = new Date(training.end_date_time)

    if (viewFilter.value === 'upcoming') return startDate > now
    if (viewFilter.value === 'current') return startDate <= now && endDate >= now
    if (viewFilter.value === 'past') return endDate < now
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

// Image handling
const handleImageSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) {
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

// Topic management
const addTopic = () => {
  if (topicInput.value.trim()) {
    newTraining.value.topics.push(topicInput.value.trim())
    topicInput.value = ''
  }
}

const removeTopic = (index: number) => {
  newTraining.value.topics.splice(index, 1)
}

// Admin functions
const handleAddTraining = () => {
  if (props.userType !== 'admin') return
  editingTraining.value = null
  newTraining.value = {
    name: '',
    description: '',
    location: '',
    start_date_time: '',
    end_date_time: '',
    capacity: 0,
    topics: [],
  }
  imageFile.value = null
  imagePreview.value = null
  showTrainingDialog.value = true
}

const handleEditTraining = (training: any) => {
  if (props.userType !== 'admin') return
  editingTraining.value = training
  newTraining.value = {
    name: training.name,
    description: training.description || '',
    location: training.location,
    start_date_time: training.start_date_time,
    end_date_time: training.end_date_time,
    capacity: training.capacity,
    topics: [...training.topics],
  }
  imagePreview.value = training.image_url
  imageFile.value = null
  showTrainingDialog.value = true
}

const handleSaveTraining = async () => {
  if (props.userType !== 'admin') return

  if (
    !newTraining.value.name ||
    !newTraining.value.location ||
    !newTraining.value.start_date_time ||
    !newTraining.value.end_date_time
  ) {
    showSnackbar('Please fill in all required fields', 'error')
    return
  }

  try {
    let result
    if (editingTraining.value) {
      result = await updateTraining(
        editingTraining.value.id,
        {
          ...newTraining.value,
          image_url: imagePreview.value,
        },
        imageFile.value,
      )
    } else {
      result = await createTraining(
        {
          ...newTraining.value,
          image_url: null,
        },
        imageFile.value,
      )
    }

    if (result.success) {
      showTrainingDialog.value = false
      showSnackbar(
        editingTraining.value ? 'Training updated successfully!' : 'Training created successfully!',
        'success',
      )
    } else {
      showSnackbar(result.error || 'Failed to save training', 'error')
    }
  } catch (err: any) {
    showSnackbar(err.message || 'An error occurred', 'error')
  }
}

const confirmDelete = (type: 'training' | 'registration', id: number) => {
  deleteTarget.value = { type, id }
  showDeleteDialog.value = true
}

const handleDelete = async () => {
  if (!deleteTarget.value) return

  try {
    let result
    if (deleteTarget.value.type === 'training') {
      result = await deleteTraining(deleteTarget.value.id)
    } else {
      result = await deleteRegistration(deleteTarget.value.id)
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

const pageSubtitle = computed(() =>
  props.userType === 'admin'
    ? 'Manage training sessions and registrations'
    : 'Browse and register for upcoming trainings',
)

const handleSearch = async (query: string) => {
  if (adminTab.value === 'trainings') {
    if (query) {
      await searchTrainings(query)
    } else {
      await clearTrainingsSearch()
    }
  } else if (adminTab.value === 'registrations') {
    if (query) {
      await searchRegistrations(query)
    } else {
      await clearRegistrationsSearch()
    }
  } else {
    // For user view, search trainings
    if (query) {
      await searchTrainings(query)
    } else {
      await clearTrainingsSearch()
    }
  }
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
            {{ userType === 'admin' ? 'Training Management' : 'Trainings & Workshops' }}
          </h1>
          <p class="text-h6 text-grey-darken-1">
            {{ pageSubtitle }}
          </p>
        </div>

        <HeaderActions
          search-placeholder="Search trainings..."
          @search="handleSearch"
          @settings-click="handleSettingsClick"
        />
      </v-col>
    </v-row>

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
                <v-card-title class="d-flex justify-space-between align-center pa-6">
                  <div class="d-flex align-center gap-4">
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
                <v-card-title class="d-flex justify-space-between align-center pa-6">
                  <div class="d-flex align-center gap-4">
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
          <v-btn-toggle v-model="viewFilter" color="primary" variant="outlined" mandatory>
            <v-btn value="upcoming">Upcoming</v-btn>
            <v-btn value="current">Current</v-btn>
            <v-btn value="past">Past</v-btn>
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
          <div class="text-h5 text-grey-darken-1 mt-6">No {{ viewFilter }} trainings</div>
          <div class="text-body-1 text-grey mt-2">Check back later for new training sessions</div>
        </v-card>
      </div>

      <!-- Training Cards -->
      <v-row v-else>
        <v-col v-for="training in filteredTrainings" :key="training.id" cols="12" sm="6" md="4">
          <v-card class="fill-height">
            <v-img v-if="training.image_url" :src="training.image_url" height="200" cover></v-img>
            <div
              v-else
              class="bg-grey-lighten-3 d-flex align-center justify-center"
              style="height: 200px"
            >
              <v-icon icon="mdi-school-outline" size="64" color="grey-lighten-1"></v-icon>
            </div>

            <v-card-title class="text-h6">{{ training.name }}</v-card-title>

            <v-card-text>
              <div v-if="training.description" class="text-body-2 mb-3">
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
              <v-btn color="primary" variant="elevated" block @click="openRegisterDialog(training)">
                Register Now
              </v-btn>
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
    <v-dialog v-if="userType === 'admin'" v-model="showTrainingDialog" max-width="800px">
      <v-card>
        <v-card-title>{{ editingTraining ? 'Edit Training' : 'Add New Training' }}</v-card-title>
        <v-card-text>
          <v-row>
            <v-col cols="12">
              <v-text-field
                v-model="newTraining.name"
                label="Training Name *"
                variant="outlined"
                required
              ></v-text-field>
            </v-col>

            <v-col cols="12">
              <v-textarea
                v-model="newTraining.description"
                label="Description"
                variant="outlined"
                rows="3"
              ></v-textarea>
            </v-col>

            <v-col cols="12" sm="6">
              <v-text-field
                v-model="newTraining.location"
                label="Location *"
                variant="outlined"
                required
              ></v-text-field>
            </v-col>

            <v-col cols="12" sm="6">
              <v-text-field
                v-model.number="newTraining.capacity"
                label="Capacity"
                type="number"
                variant="outlined"
                min="0"
              ></v-text-field>
            </v-col>

            <v-col cols="12" sm="6">
              <v-text-field
                v-model="newTraining.start_date_time"
                label="Start Date & Time *"
                type="datetime-local"
                variant="outlined"
                required
              ></v-text-field>
            </v-col>

            <v-col cols="12" sm="6">
              <v-text-field
                v-model="newTraining.end_date_time"
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
                  v-for="(topic, index) in newTraining.topics"
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
                  @click="handleRemoveImage"
                ></v-btn>
              </div>
            </v-col>
          </v-row>
        </v-card-text>

        <v-card-actions class="px-6 pb-6">
          <v-spacer></v-spacer>
          <v-btn variant="outlined" @click="showTrainingDialog = false">Cancel</v-btn>
          <v-btn color="primary" variant="elevated" @click="handleSaveTraining">
            {{ editingTraining ? 'Update' : 'Create' }}
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
          <v-btn color="primary" variant="elevated" @click="confirmRegistration">
            Confirm Registration
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
.gap-2 {
  gap: 8px;
}
</style>
