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

interface Activity {
  id: number
  name: string
  description: string
  image: string
  type: string
  capacity: number
  location: string
}

interface Booking {
  id: number
  activityName: string
  userName: string
  userEmail: string
  bookingDate: string
  status: 'pending' | 'confirmed' | 'cancelled'
}

interface Appointment {
  id: number
  fullName: string
  email: string
  contactNumber: string
  appointmentType: string
  date: string
  time: string
  note: string
  status: 'pending' | 'confirmed' | 'cancelled'
}

// Sample data
const activities = ref<Activity[]>([
  {
    id: 1,
    name: 'Strawberry Picking Experience',
    description:
      'Join us for a fun strawberry picking session in our organic strawberry fields. Perfect for families!',
    image: 'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=400',
    type: 'Harvesting',
    capacity: 20,
    location: 'Strawberry Field A',
  },
  {
    id: 2,
    name: 'Organic Farming Workshop',
    description:
      'Learn the basics of organic farming techniques and sustainable agriculture practices.',
    image: 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=400',
    type: 'Workshop',
    capacity: 15,
    location: 'Training Center',
  },
])

const bookings = ref<Booking[]>([
  {
    id: 1,
    activityName: 'Strawberry Picking Experience',
    userName: 'Maria Santos',
    userEmail: 'maria@email.com',
    bookingDate: '2025-01-20',
    status: 'confirmed',
  },
  {
    id: 2,
    activityName: 'Organic Farming Workshop',
    userName: 'Juan Rivera',
    userEmail: 'juan@email.com',
    bookingDate: '2025-01-22',
    status: 'pending',
  },
])

const appointments = ref<Appointment[]>([
  {
    id: 1,
    fullName: 'Sarah Lee',
    email: 'sarah@email.com',
    contactNumber: '09123456789',
    appointmentType: 'Farm Tour',
    date: '2025-01-25',
    time: '10:00',
    note: 'Interested in learning about organic practices',
    status: 'pending',
  },
])

// Dialog states
const showAppointmentDialog = ref(false)
const showBookingDialog = ref(false)
const showActivityDialog = ref(false)
const selectedActivity = ref<Activity | null>(null)
const editingActivity = ref<Activity | null>(null)

// Admin tab
const adminTab = ref('activities')

// Forms
const appointmentForm = ref({
  fullName: userName.value,
  email: userEmail.value,
  contactNumber: '',
  appointmentType: '',
  date: '',
  time: '',
  note: '',
})

const newActivity = ref({
  name: '',
  description: '',
  type: '',
  capacity: 0,
  location: '',
})

const imageFile = ref<File | null>(null)
const imagePreview = ref<string | null>(null)

const appointmentTypes = [
  'Farm Tour',
  'Consultation',
  'Educational Visit',
  'Business Inquiry',
  'Other',
]

const activityTypes = ['Workshop', 'Tour', 'Harvesting', 'Training', 'Event']

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

// User functions
const openAppointmentForm = () => {
  appointmentForm.value = {
    fullName: userName.value,
    email: userEmail.value,
    contactNumber: '',
    appointmentType: '',
    date: '',
    time: '',
    note: '',
  }
  showAppointmentDialog.value = true
}

const submitAppointment = () => {
  const newAppointment: Appointment = {
    id: Math.max(...appointments.value.map((a) => a.id), 0) + 1,
    ...appointmentForm.value,
    status: 'pending',
  }

  appointments.value.unshift(newAppointment)
  showAppointmentDialog.value = false
}

const openBookingDialog = (activity: Activity) => {
  selectedActivity.value = activity
  showBookingDialog.value = true
}

const confirmBooking = () => {
  if (!selectedActivity.value) return

  const newBooking: Booking = {
    id: Math.max(...bookings.value.map((b) => b.id), 0) + 1,
    activityName: selectedActivity.value.name,
    userName: userName.value,
    userEmail: userEmail.value,
    bookingDate: new Date().toISOString().split('T')[0],
    status: 'pending',
  }

  bookings.value.unshift(newBooking)
  showBookingDialog.value = false
}

// Admin functions
const handleAddActivity = () => {
  editingActivity.value = null
  newActivity.value = {
    name: '',
    description: '',
    type: '',
    capacity: 0,
    location: '',
  }
  imageFile.value = null
  imagePreview.value = null
  showActivityDialog.value = true
}

const handleEditActivity = (activity: Activity) => {
  editingActivity.value = activity
  newActivity.value = {
    name: activity.name,
    description: activity.description,
    type: activity.type,
    capacity: activity.capacity,
    location: activity.location,
  }
  imagePreview.value = activity.image
  imageFile.value = null
  showActivityDialog.value = true
}

const handleSaveActivity = () => {
  const image =
    imagePreview.value || 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=400'

  if (editingActivity.value) {
    const index = activities.value.findIndex((a) => a.id === editingActivity.value!.id)
    if (index !== -1) {
      activities.value[index] = {
        ...activities.value[index],
        ...newActivity.value,
        image,
      }
    }
  } else {
    const newId = Math.max(...activities.value.map((a) => a.id), 0) + 1
    activities.value.unshift({
      id: newId,
      ...newActivity.value,
      image,
    })
  }
  showActivityDialog.value = false
}

const handleDeleteActivity = (id: number) => {
  const index = activities.value.findIndex((a) => a.id === id)
  if (index !== -1) {
    activities.value.splice(index, 1)
  }
}

const updateBookingStatus = (bookingId: number, status: Booking['status']) => {
  const booking = bookings.value.find((b) => b.id === bookingId)
  if (booking) {
    booking.status = status
  }
}

const updateAppointmentStatus = (appointmentId: number, status: Appointment['status']) => {
  const appointment = appointments.value.find((a) => a.id === appointmentId)
  if (appointment) {
    appointment.status = status
  }
}

const downloadBookings = () => {
  const csvContent = [
    ['Activity Name', 'User Name', 'Email', 'Booking Date', 'Status'],
    ...bookings.value.map((b) => [
      b.activityName,
      b.userName,
      b.userEmail,
      b.bookingDate,
      b.status,
    ]),
  ]
    .map((row) => row.join(','))
    .join('\n')

  const blob = new Blob([csvContent], { type: 'text/csv' })
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `bookings_${new Date().toISOString().split('T')[0]}.csv`
  a.click()
}

const downloadAppointments = () => {
  const csvContent = [
    ['Full Name', 'Email', 'Contact', 'Type', 'Date', 'Time', 'Note', 'Status'],
    ...appointments.value.map((a) => [
      a.fullName,
      a.email,
      a.contactNumber,
      a.appointmentType,
      a.date,
      a.time,
      a.note,
      a.status,
    ]),
  ]
    .map((row) => row.join(','))
    .join('\n')

  const blob = new Blob([csvContent], { type: 'text/csv' })
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `appointments_${new Date().toISOString().split('T')[0]}.csv`
  link.click()
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

const activityHeaders = [
  { title: 'Activity', key: 'name' },
  { title: 'Type', key: 'type' },
  { title: 'Capacity', key: 'capacity' },
  { title: 'Location', key: 'location' },
  { title: 'Actions', key: 'actions' },
]

const bookingHeaders = [
  { title: 'Activity Name', key: 'activityName' },
  { title: 'User Name', key: 'userName' },
  { title: 'Email', key: 'userEmail' },
  { title: 'Booking Date', key: 'bookingDate' },
  { title: 'Status', key: 'status' },
  { title: 'Actions', key: 'actions' },
]

const appointmentHeaders = [
  { title: 'Full Name', key: 'fullName' },
  { title: 'Contact', key: 'contactNumber' },
  { title: 'Type', key: 'appointmentType' },
  { title: 'Date & Time', key: 'date' },
  { title: 'Status', key: 'status' },
  { title: 'Actions', key: 'actions' },
]

const pageSubtitle = computed(() =>
  props.userType === 'admin'
    ? 'Manage farm activities, bookings, and appointments'
    : 'Explore and book farm activities',
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
            {{ userType === 'admin' ? 'Activities & Bookings Management' : 'Farm Activities' }}
          </h1>
          <p class="text-h6 text-grey-darken-1">{{ pageSubtitle }}</p>
        </div>
        <HeaderActions
          search-placeholder="Search announcements..."
          @search="handleSearch"
          @settings-click="handleSettingsClick"
        />
      </v-col>
    </v-row>

    <!-- User View -->
    <template v-if="userType === 'user'">
      <!-- Appointment Form Button -->
      <v-row class="mb-4">
        <v-col cols="12" class="d-flex justify-end">
          <v-btn
            color="success"
            variant="elevated"
            prepend-icon="mdi-calendar-check"
            @click="openAppointmentForm"
          >
            Appointment Form
          </v-btn>
        </v-col>
      </v-row>

      <!-- Activities Cards -->
      <v-row>
        <v-col v-for="activity in activities" :key="activity.id" cols="12" md="6" lg="4">
          <v-card class="fill-height">
            <v-img :src="activity.image" height="200" cover></v-img>

            <v-card-title>{{ activity.name }}</v-card-title>

            <v-card-text>
              <p class="text-body-2 mb-3">{{ activity.description }}</p>

              <div class="mb-2">
                <v-chip color="primary" size="small" variant="tonal" class="mr-2">
                  {{ activity.type }}
                </v-chip>
                <v-chip color="info" size="small" variant="tonal">
                  <v-icon icon="mdi-map-marker" size="small" class="mr-1"></v-icon>
                  {{ activity.location }}
                </v-chip>
              </div>

              <div class="text-caption text-grey-darken-1">
                Capacity: {{ activity.capacity }} participants
              </div>
            </v-card-text>

            <v-card-actions>
              <v-btn color="primary" variant="elevated" block @click="openBookingDialog(activity)">
                Book Activity
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-col>
      </v-row>
    </template>

    <!-- Admin View -->
    <template v-if="userType === 'admin'">
      <v-tabs v-model="adminTab" bg-color="primary" class="mb-6">
        <v-tab value="activities">Farm Activities</v-tab>
        <v-tab value="bookings">Farm Bookings</v-tab>
        <v-tab value="appointments">Appointments</v-tab>
      </v-tabs>

      <v-window v-model="adminTab">
        <!-- Farm Activities Tab -->
        <v-window-item value="activities">
          <v-row>
            <v-col cols="12" class="d-flex justify-end mb-4">
              <v-btn
                color="primary"
                variant="elevated"
                prepend-icon="mdi-plus"
                @click="handleAddActivity"
              >
                Add Activity
              </v-btn>
            </v-col>
            <v-col cols="12">
              <v-card>
                <v-card-title>All Farm Activities</v-card-title>
                <v-card-text>
                  <v-data-table :headers="activityHeaders" :items="activities" item-value="id">
                    <template v-slot:item.name="{ item }">
                      <div class="d-flex align-center">
                        <v-avatar size="60" rounded="lg" class="mr-3">
                          <v-img :src="item.image" cover></v-img>
                        </v-avatar>
                        <div>
                          <div class="font-weight-medium">{{ item.name }}</div>
                          <div class="text-caption text-grey-darken-1">
                            {{ item.description.substring(0, 50) }}...
                          </div>
                        </div>
                      </div>
                    </template>

                    <template v-slot:item.actions="{ item }">
                      <v-btn
                        icon="mdi-pencil"
                        size="small"
                        variant="text"
                        color="primary"
                        @click="handleEditActivity(item)"
                      ></v-btn>
                      <v-btn
                        icon="mdi-delete"
                        size="small"
                        variant="text"
                        color="error"
                        @click="handleDeleteActivity(item.id)"
                      ></v-btn>
                    </template>
                  </v-data-table>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>
        </v-window-item>

        <!-- Farm Bookings Tab -->
        <v-window-item value="bookings">
          <v-row>
            <v-col cols="12" class="d-flex justify-end mb-4">
              <v-btn
                color="success"
                variant="elevated"
                prepend-icon="mdi-download"
                @click="downloadBookings"
              >
                View All Bookings
              </v-btn>
            </v-col>
            <v-col cols="12">
              <v-card>
                <v-card-title>Activity Bookings</v-card-title>
                <v-card-text>
                  <v-data-table :headers="bookingHeaders" :items="bookings" item-value="id">
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
                            @click="updateBookingStatus(item.id, 'confirmed')"
                          ></v-list-item>
                          <v-list-item
                            title="Cancel"
                            @click="updateBookingStatus(item.id, 'cancelled')"
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

        <!-- Appointments Tab -->
        <v-window-item value="appointments">
          <v-row>
            <v-col cols="12" class="d-flex justify-end mb-4">
              <v-btn
                color="success"
                variant="elevated"
                prepend-icon="mdi-download"
                @click="downloadAppointments"
              >
                View All Appointments
              </v-btn>
            </v-col>
            <v-col cols="12">
              <v-card>
                <v-card-title>User Appointments</v-card-title>
                <v-card-text>
                  <v-data-table :headers="appointmentHeaders" :items="appointments" item-value="id">
                    <template v-slot:item.date="{ item }">
                      <div>
                        <div>{{ item.date }}</div>
                        <div class="text-caption">{{ item.time }}</div>
                      </div>
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
                            @click="updateAppointmentStatus(item.id, 'confirmed')"
                          ></v-list-item>
                          <v-list-item
                            title="Cancel"
                            @click="updateAppointmentStatus(item.id, 'cancelled')"
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

    <!-- Appointment Form Dialog -->
    <v-dialog v-model="showAppointmentDialog" max-width="600px">
      <v-card>
        <v-card-title>Schedule an Appointment</v-card-title>
        <v-card-text>
          <v-form @submit.prevent="submitAppointment">
            <v-row>
              <v-col cols="12">
                <v-text-field
                  v-model="appointmentForm.fullName"
                  label="Full Name"
                  variant="outlined"
                  readonly
                ></v-text-field>
              </v-col>

              <v-col cols="12">
                <v-text-field
                  v-model="appointmentForm.email"
                  label="Email Address"
                  variant="outlined"
                  readonly
                ></v-text-field>
              </v-col>

              <v-col cols="12">
                <v-text-field
                  v-model="appointmentForm.contactNumber"
                  label="Contact Number *"
                  variant="outlined"
                  required
                ></v-text-field>
              </v-col>

              <v-col cols="12">
                <v-select
                  v-model="appointmentForm.appointmentType"
                  label="Appointment Type *"
                  :items="appointmentTypes"
                  variant="outlined"
                  required
                ></v-select>
              </v-col>

              <v-col cols="12" md="6">
                <v-text-field
                  v-model="appointmentForm.date"
                  label="Date *"
                  type="date"
                  variant="outlined"
                  required
                ></v-text-field>
              </v-col>

              <v-col cols="12" md="6">
                <v-text-field
                  v-model="appointmentForm.time"
                  label="Time *"
                  type="time"
                  variant="outlined"
                  required
                ></v-text-field>
              </v-col>

              <v-col cols="12">
                <v-textarea
                  v-model="appointmentForm.note"
                  label="Note/Request"
                  variant="outlined"
                  rows="4"
                ></v-textarea>
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>

        <v-card-actions class="px-6 pb-6">
          <v-spacer></v-spacer>
          <v-btn variant="outlined" @click="showAppointmentDialog = false">Cancel</v-btn>
          <v-btn color="primary" variant="elevated" @click="submitAppointment">
            Confirm Appointment
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Booking Dialog -->
    <v-dialog v-model="showBookingDialog" max-width="500px">
      <v-card v-if="selectedActivity">
        <v-card-title>Book Activity</v-card-title>
        <v-card-text>
          <v-img :src="selectedActivity.image" height="150" cover class="rounded mb-4"></v-img>

          <h3 class="text-h6 font-weight-bold mb-2">{{ selectedActivity.name }}</h3>
          <p class="text-body-2 mb-4">{{ selectedActivity.description }}</p>

          <v-list>
            <v-list-item>
              <template v-slot:prepend>
                <v-icon icon="mdi-tag"></v-icon>
              </template>
              <v-list-item-title>{{ selectedActivity.type }}</v-list-item-title>
            </v-list-item>
            <v-list-item>
              <template v-slot:prepend>
                <v-icon icon="mdi-map-marker"></v-icon>
              </template>
              <v-list-item-title>{{ selectedActivity.location }}</v-list-item-title>
            </v-list-item>
            <v-list-item>
              <template v-slot:prepend>
                <v-icon icon="mdi-account-group"></v-icon>
              </template>
              <v-list-item-title
                >Capacity: {{ selectedActivity.capacity }} participants</v-list-item-title
              >
            </v-list-item>
          </v-list>
        </v-card-text>

        <v-card-actions class="px-6 pb-6">
          <v-spacer></v-spacer>
          <v-btn variant="outlined" @click="showBookingDialog = false">Cancel</v-btn>
          <v-btn color="primary" variant="elevated" @click="confirmBooking">
            Confirm Booking
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Admin Activity Dialog -->
    <v-dialog v-if="userType === 'admin'" v-model="showActivityDialog" max-width="700px">
      <v-card>
        <v-card-title>
          {{ editingActivity ? 'Edit Activity' : 'New Activity' }}
        </v-card-title>
        <v-card-text>
          <v-form @submit.prevent="handleSaveActivity">
            <v-row>
              <v-col cols="12">
                <div class="text-subtitle-2 mb-2">Activity Image</div>

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
                  v-model="newActivity.name"
                  label="Activity Name *"
                  variant="outlined"
                  required
                ></v-text-field>
              </v-col>

              <v-col cols="12">
                <v-textarea
                  v-model="newActivity.description"
                  label="Description *"
                  variant="outlined"
                  rows="4"
                  required
                ></v-textarea>
              </v-col>

              <v-col cols="12" md="6">
                <v-select
                  v-model="newActivity.type"
                  label="Type *"
                  :items="activityTypes"
                  variant="outlined"
                  required
                ></v-select>
              </v-col>

              <v-col cols="12" md="6">
                <v-text-field
                  v-model.number="newActivity.capacity"
                  label="Capacity *"
                  type="number"
                  variant="outlined"
                  required
                ></v-text-field>
              </v-col>

              <v-col cols="12">
                <v-text-field
                  v-model="newActivity.location"
                  label="Location *"
                  variant="outlined"
                  required
                ></v-text-field>
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>

        <v-card-actions class="px-6 pb-6">
          <v-spacer></v-spacer>
          <v-btn variant="outlined" @click="showActivityDialog = false">Cancel</v-btn>
          <v-btn color="primary" variant="elevated" @click="handleSaveActivity">
            {{ editingActivity ? 'Update' : 'Create' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<style scoped>
/* Component specific styles */
</style>
