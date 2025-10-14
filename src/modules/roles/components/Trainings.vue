<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import HeaderActions from './shared/HeaderActions.vue'

interface Props {
  userType: 'admin' | 'user'
}

const props = defineProps<Props>()

// Get user info from auth store
const authStore = useAuthStore()
const userName = computed(() => authStore.fullName)
const userEmail = computed(() => authStore.userEmail)

interface Training {
  id: number
  name: string
  location: string
  startDateTime: string
  endDateTime: string
  topics: string[]
  image: string
}

interface Registration {
  id: number
  trainingName: string
  userName: string
  userEmail: string
  registeredAt: string
  status: 'confirmed' | 'pending' | 'cancelled'
}

// Sample data
const trainings = ref<Training[]>([
  {
    id: 1,
    name: 'Organic Farming Fundamentals',
    location: 'Training Center A',
    startDateTime: '2025-02-01T09:00',
    endDateTime: '2025-02-01T17:00',
    topics: ['Soil Health', 'Composting', 'Pest Management', 'Crop Rotation'],
    image: 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=400',
  },
  {
    id: 2,
    name: 'Greenhouse Management',
    location: 'Greenhouse Complex',
    startDateTime: '2025-03-15T08:00',
    endDateTime: '2025-03-16T16:00',
    topics: ['Climate Control', 'Irrigation Systems', 'Crop Selection', 'Disease Prevention'],
    image: 'https://images.unsplash.com/photo-1530836369250-ef72a3f5cda8?w=400',
  },
  {
    id: 3,
    name: 'Sustainable Agriculture Practices',
    location: 'Main Field',
    startDateTime: '2024-12-10T10:00',
    endDateTime: '2024-12-10T15:00',
    topics: ['Water Conservation', 'Renewable Energy', 'Biodiversity'],
    image: 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=400',
  },
  {
    id: 4,
    name: 'Hydroponics Workshop',
    location: 'Innovation Lab',
    startDateTime: '2025-01-18T09:00',
    endDateTime: '2025-01-18T16:00',
    topics: ['Nutrient Solutions', 'System Setup', 'pH Management'],
    image: 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=400',
  },
])

const registrations = ref<Registration[]>([
  {
    id: 1,
    trainingName: 'Organic Farming Fundamentals',
    userName: 'Maria Santos',
    userEmail: 'maria@email.com',
    registeredAt: '2025-01-15',
    status: 'confirmed',
  },
  {
    id: 2,
    trainingName: 'Greenhouse Management',
    userName: 'Juan Rivera',
    userEmail: 'juan@email.com',
    registeredAt: '2025-01-20',
    status: 'pending',
  },
])

// Dialog states
const showTrainingDialog = ref(false)
const showRegisterDialog = ref(false)
const selectedTraining = ref<Training | null>(null)
const editingTraining = ref<Training | null>(null)
const viewFilter = ref<'upcoming' | 'current' | 'past'>('upcoming')
const adminTab = ref('trainings')

// Forms
const newTraining = ref({
  name: '',
  location: '',
  startDateTime: '',
  endDateTime: '',
  topics: [] as string[],
})

const topicInput = ref('')
const imageFile = ref<File | null>(null)
const imagePreview = ref<string | null>(null)

// Computed filtered trainings
const filteredTrainings = computed(() => {
  const now = new Date()

  return trainings.value.filter((training) => {
    const start = new Date(training.startDateTime)
    const end = new Date(training.endDateTime)

    if (viewFilter.value === 'upcoming') {
      return start > now
    } else if (viewFilter.value === 'current') {
      return start <= now && end >= now
    } else {
      return end < now
    }
  })
})

// Format date and time
const formatDateTime = (dateTime: string) => {
  const date = new Date(dateTime)
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
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
  editingTraining.value = null
  newTraining.value = {
    name: '',
    location: '',
    startDateTime: '',
    endDateTime: '',
    topics: [],
  }
  imageFile.value = null
  imagePreview.value = null
  topicInput.value = ''
  showTrainingDialog.value = true
}

const handleEditTraining = (training: Training) => {
  editingTraining.value = training
  newTraining.value = {
    name: training.name,
    location: training.location,
    startDateTime: training.startDateTime,
    endDateTime: training.endDateTime,
    topics: [...training.topics],
  }
  imagePreview.value = training.image
  imageFile.value = null
  showTrainingDialog.value = true
}

const handleSaveTraining = () => {
  const image =
    imagePreview.value || 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=400'

  if (editingTraining.value) {
    const index = trainings.value.findIndex((t) => t.id === editingTraining.value!.id)
    if (index !== -1) {
      trainings.value[index] = {
        ...trainings.value[index],
        ...newTraining.value,
        image,
      }
    }
  } else {
    const newId = Math.max(...trainings.value.map((t) => t.id), 0) + 1
    trainings.value.unshift({
      id: newId,
      ...newTraining.value,
      image,
    })
  }
  showTrainingDialog.value = false
}

const handleDeleteTraining = (id: number) => {
  const index = trainings.value.findIndex((t) => t.id === id)
  if (index !== -1) {
    trainings.value.splice(index, 1)
  }
}

const updateRegistrationStatus = (registrationId: number, status: Registration['status']) => {
  const registration = registrations.value.find((r) => r.id === registrationId)
  if (registration) {
    registration.status = status
  }
}

const downloadRegistrations = () => {
  const csvContent = [
    ['Training Name', 'User Name', 'Email', 'Registered At', 'Status'],
    ...registrations.value.map((r) => [
      r.trainingName,
      r.userName,
      r.userEmail,
      r.registeredAt,
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
const openRegisterDialog = (training: Training) => {
  selectedTraining.value = training
  showRegisterDialog.value = true
}

const confirmRegistration = () => {
  if (!selectedTraining.value) return

  const newRegistration: Registration = {
    id: Math.max(...registrations.value.map((r) => r.id), 0) + 1,
    trainingName: selectedTraining.value.name,
    userName: userName.value,
    userEmail: userEmail.value,
    registeredAt: new Date().toISOString().split('T')[0],
    status: 'pending',
  }

  registrations.value.unshift(newRegistration)
  showRegisterDialog.value = false
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'pending':
      return 'warning'
    case 'confirmed':
      return 'success'
    case 'cancelled':
      return 'error'
    default:
      return 'grey'
  }
}

const registrationHeaders = [
  { title: 'Training Name', key: 'trainingName' },
  { title: 'User Name', key: 'userName' },
  { title: 'Email', key: 'userEmail' },
  { title: 'Registered At', key: 'registeredAt' },
  { title: 'Status', key: 'status' },
  { title: 'Actions', key: 'actions' },
]

const pageSubtitle = computed(() =>
  props.userType === 'admin'
    ? 'Manage training programs and registrations'
    : 'Enhance your farming skills with expert-led programs',
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
            {{ userType === 'admin' ? 'Training & Workshop Management' : 'Trainings & Workshops' }}
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

    <!-- Admin Tabs -->
    <v-tabs v-if="userType === 'admin'" v-model="adminTab" bg-color="primary" class="mb-6">
      <v-tab value="trainings">Trainings</v-tab>
      <v-tab value="registrations">Registrations</v-tab>
    </v-tabs>

    <!-- Admin View -->
    <template v-if="userType === 'admin'">
      <v-window v-model="adminTab">
        <!-- Trainings Tab -->
        <v-window-item value="trainings">
          <v-row class="mb-4">
            <v-col cols="12" class="d-flex justify-space-between align-center">
              <v-btn-toggle v-model="viewFilter" color="primary" variant="outlined" mandatory>
                <v-btn value="upcoming">Upcoming</v-btn>
                <v-btn value="current">Current</v-btn>
                <v-btn value="past">Past</v-btn>
              </v-btn-toggle>
              <v-btn
                color="primary"
                variant="elevated"
                prepend-icon="mdi-plus"
                @click="handleAddTraining"
              >
                Add Training
              </v-btn>
            </v-col>
          </v-row>

          <v-row>
            <v-col v-for="training in filteredTrainings" :key="training.id" cols="12" md="6" lg="4">
              <v-card class="fill-height">
                <v-img :src="training.image" height="200" cover></v-img>

                <v-card-title>{{ training.name }}</v-card-title>

                <v-card-text>
                  <div class="mb-3">
                    <div class="d-flex align-center mb-2">
                      <v-icon icon="mdi-map-marker" size="small" class="mr-2"></v-icon>
                      <span class="text-body-2">{{ training.location }}</span>
                    </div>

                    <div class="d-flex align-center mb-2">
                      <v-icon icon="mdi-calendar-start" size="small" class="mr-2"></v-icon>
                      <span class="text-body-2">{{ formatDateTime(training.startDateTime) }}</span>
                    </div>

                    <div class="d-flex align-center">
                      <v-icon icon="mdi-calendar-end" size="small" class="mr-2"></v-icon>
                      <span class="text-body-2">{{ formatDateTime(training.endDateTime) }}</span>
                    </div>
                  </div>

                  <v-divider class="my-3"></v-divider>

                  <div>
                    <div class="text-caption text-grey-darken-1 mb-2">Topics Covered:</div>
                    <div class="d-flex flex-wrap gap-1">
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
                  <v-btn
                    icon="mdi-pencil"
                    variant="text"
                    color="primary"
                    @click="handleEditTraining(training)"
                  ></v-btn>
                  <v-btn
                    icon="mdi-delete"
                    variant="text"
                    color="error"
                    @click="handleDeleteTraining(training.id)"
                  ></v-btn>
                </v-card-actions>
              </v-card>
            </v-col>

            <v-col v-if="filteredTrainings.length === 0" cols="12">
              <v-card>
                <v-card-text class="text-center py-12">
                  <v-icon
                    icon="mdi-calendar-blank"
                    size="64"
                    color="grey-lighten-1"
                    class="mb-4"
                  ></v-icon>
                  <div class="text-h6 text-grey-darken-1">
                    No {{ viewFilter }} trainings available
                  </div>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>
        </v-window-item>

        <!-- Registrations Tab -->
        <v-window-item value="registrations">
          <v-row>
            <v-col cols="12" class="d-flex justify-end mb-4">
              <v-btn
                color="success"
                variant="elevated"
                prepend-icon="mdi-download"
                @click="downloadRegistrations"
              >
                View All Registrations
              </v-btn>
            </v-col>
            <v-col cols="12">
              <v-card>
                <v-card-title>Training Registrations</v-card-title>
                <v-card-text>
                  <v-data-table
                    :headers="registrationHeaders"
                    :items="registrations"
                    item-value="id"
                  >
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
      <!-- Filter Tabs -->
      <v-row class="mb-4">
        <v-col cols="12">
          <v-btn-toggle v-model="viewFilter" color="primary" variant="outlined" mandatory>
            <v-btn value="upcoming">Upcoming</v-btn>
            <v-btn value="current">Current</v-btn>
            <v-btn value="past">Past</v-btn>
          </v-btn-toggle>
        </v-col>
      </v-row>

      <!-- Training Cards -->
      <v-row>
        <v-col v-for="training in filteredTrainings" :key="training.id" cols="12" md="6" lg="4">
          <v-card class="fill-height">
            <v-img :src="training.image" height="200" cover></v-img>

            <v-card-title>{{ training.name }}</v-card-title>

            <v-card-text>
              <div class="mb-3">
                <div class="d-flex align-center mb-2">
                  <v-icon icon="mdi-map-marker" size="small" class="mr-2"></v-icon>
                  <span class="text-body-2">{{ training.location }}</span>
                </div>

                <div class="d-flex align-center mb-2">
                  <v-icon icon="mdi-calendar-start" size="small" class="mr-2"></v-icon>
                  <span class="text-body-2">{{ formatDateTime(training.startDateTime) }}</span>
                </div>

                <div class="d-flex align-center">
                  <v-icon icon="mdi-calendar-end" size="small" class="mr-2"></v-icon>
                  <span class="text-body-2">{{ formatDateTime(training.endDateTime) }}</span>
                </div>
              </div>

              <v-divider class="my-3"></v-divider>

              <div>
                <div class="text-caption text-grey-darken-1 mb-2">Topics Covered:</div>
                <div class="d-flex flex-wrap gap-1">
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

        <v-col v-if="filteredTrainings.length === 0" cols="12">
          <v-card>
            <v-card-text class="text-center py-12">
              <v-icon
                icon="mdi-calendar-blank"
                size="64"
                color="grey-lighten-1"
                class="mb-4"
              ></v-icon>
              <div class="text-h6 text-grey-darken-1">No {{ viewFilter }} trainings available</div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </template>

    <!-- Admin Registrations Dialog -->
    <v-dialog v-if="userType === 'admin'" v-model="showTrainingDialog" max-width="700px">
      <v-card>
        <v-card-title>
          {{ editingTraining ? 'Edit Training' : 'New Training' }}
        </v-card-title>
        <v-card-text>
          <v-form @submit.prevent="handleSaveTraining">
            <v-row>
              <!-- Image Upload -->
              <v-col cols="12">
                <div class="text-subtitle-2 mb-2">Training Image</div>

                <div v-if="imagePreview" class="mb-4 position-relative">
                  <v-img :src="imagePreview" max-height="200" class="rounded"></v-img>
                  <v-btn
                    icon="mdi-close"
                    size="small"
                    color="error"
                    class="position-absolute"
                    style="top: 8px; right: 8px"
                    @click="handleRemoveImage"
                  ></v-btn>
                </div>

                <v-file-input
                  v-else
                  accept="image/*"
                  label="Upload Image"
                  prepend-icon="mdi-camera"
                  variant="outlined"
                  @change="handleImageSelect"
                ></v-file-input>
              </v-col>

              <v-col cols="12">
                <v-text-field
                  v-model="newTraining.name"
                  label="Training Name *"
                  variant="outlined"
                  required
                ></v-text-field>
              </v-col>

              <v-col cols="12">
                <v-text-field
                  v-model="newTraining.location"
                  label="Location *"
                  variant="outlined"
                  required
                ></v-text-field>
              </v-col>

              <v-col cols="12" md="6">
                <v-text-field
                  v-model="newTraining.startDateTime"
                  label="Start Date & Time *"
                  type="datetime-local"
                  variant="outlined"
                  required
                ></v-text-field>
              </v-col>

              <v-col cols="12" md="6">
                <v-text-field
                  v-model="newTraining.endDateTime"
                  label="End Date & Time *"
                  type="datetime-local"
                  variant="outlined"
                  required
                ></v-text-field>
              </v-col>

              <v-col cols="12">
                <div class="text-subtitle-2 mb-2">Topics *</div>
                <div class="d-flex gap-2 mb-2">
                  <v-text-field
                    v-model="topicInput"
                    label="Add Topic"
                    variant="outlined"
                    density="compact"
                    hide-details
                    @keyup.enter="addTopic"
                  ></v-text-field>
                  <v-btn color="primary" @click="addTopic">Add</v-btn>
                </div>
                <div class="d-flex flex-wrap gap-2">
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
            </v-row>
          </v-form>
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

    <!-- User Registration Dialog -->
    <v-dialog v-if="userType === 'user'" v-model="showRegisterDialog" max-width="600px">
      <v-card v-if="selectedTraining">
        <v-card-title>Register for Training</v-card-title>
        <v-card-text>
          <v-img :src="selectedTraining.image" height="150" cover class="rounded mb-4"></v-img>

          <h3 class="text-h6 font-weight-bold mb-3">{{ selectedTraining.name }}</h3>

          <v-list>
            <v-list-item>
              <template v-slot:prepend>
                <v-icon icon="mdi-map-marker"></v-icon>
              </template>
              <v-list-item-title>{{ selectedTraining.location }}</v-list-item-title>
            </v-list-item>
            <v-list-item>
              <template v-slot:prepend>
                <v-icon icon="mdi-calendar-start"></v-icon>
              </template>
              <v-list-item-title>{{
                formatDateTime(selectedTraining.startDateTime)
              }}</v-list-item-title>
              <v-list-item-subtitle>Start</v-list-item-subtitle>
            </v-list-item>
            <v-list-item>
              <template v-slot:prepend>
                <v-icon icon="mdi-calendar-end"></v-icon>
              </template>
              <v-list-item-title>{{
                formatDateTime(selectedTraining.endDateTime)
              }}</v-list-item-title>
              <v-list-item-subtitle>End</v-list-item-subtitle>
            </v-list-item>
          </v-list>

          <v-divider class="my-3"></v-divider>

          <div class="mb-3">
            <div class="text-subtitle-2 mb-2">Topics:</div>
            <div class="d-flex flex-wrap gap-1">
              <v-chip
                v-for="(topic, index) in selectedTraining.topics"
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

        <v-card-actions class="px-6 pb-6">
          <v-spacer></v-spacer>
          <v-btn variant="outlined" @click="showRegisterDialog = false">Cancel</v-btn>
          <v-btn color="primary" variant="elevated" @click="confirmRegistration">
            Confirm Registration
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<style scoped>
.gap-2 {
  gap: 0.5rem;
}
</style>
