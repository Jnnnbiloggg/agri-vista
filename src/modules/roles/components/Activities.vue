<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useActivities } from '../composables/useActivities'
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

// Use activities composable
const {
  activities,
  bookings,
  appointments,
  loading,
  error,
  activitiesTotal,
  bookingsTotal,
  appointmentsTotal,
  activitiesPage,
  bookingsPage,
  appointmentsPage,
  itemsPerPage,
  activitiesTotalPages,
  bookingsTotalPages,
  appointmentsTotalPages,
  fetchActivities,
  loadMoreActivities,
  searchActivities,
  clearActivitiesSearch,
  createActivity,
  updateActivity,
  deleteActivity,
  goToActivitiesPage,
  fetchBookings,
  searchBookings,
  clearBookingsSearch,
  createBooking,
  updateBooking,
  deleteBooking,
  goToBookingsPage,
  fetchAppointments,
  searchAppointments,
  clearAppointmentsSearch,
  createAppointment,
  updateAppointment,
  deleteAppointment,
  goToAppointmentsPage,
  setupRealtimeSubscriptions,
} = useActivities()

// Infinite scroll for user activities view
const { isLoading: isLoadingMore } = useInfiniteScroll({
  onLoadMore: async () => {
    if (props.userType === 'user' && !loading.value) {
      await loadMoreActivities()
    }
  },
  hasMore: () => props.userType === 'user' && activitiesPage.value < activitiesTotalPages.value,
})

// Dialog states
const showAppointmentDialog = ref(false)
const showBookingDialog = ref(false)
const showActivityDialog = ref(false)
const showDeleteDialog = ref(false)
const selectedActivity = ref<any | null>(null)
const editingActivity = ref<any | null>(null)
const deleteTarget = ref<{ type: 'activity' | 'booking' | 'appointment'; id: number } | null>(null)

// Snackbar
const snackbar = ref(false)
const snackbarMessage = ref('')
const snackbarColor = ref('success')

// Admin tab
const adminTab = ref('activities')

// Forms
const appointmentForm = ref({
  full_name: userName.value,
  email: userEmail.value,
  contact_number: '',
  appointment_type: '',
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

// Load data on component mount
onMounted(async () => {
  if (props.userType === 'admin') {
    await fetchActivities()
    await fetchBookings()
    await fetchAppointments()
  } else {
    await fetchActivities()
  }
  setupRealtimeSubscriptions()
})

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
    full_name: userName.value,
    email: userEmail.value,
    contact_number: '',
    appointment_type: '',
    date: '',
    time: '',
    note: '',
  }
  showAppointmentDialog.value = true
}

const submitAppointment = async () => {
  if (
    !appointmentForm.value.contact_number ||
    !appointmentForm.value.appointment_type ||
    !appointmentForm.value.date ||
    !appointmentForm.value.time
  ) {
    showSnackbar('Please fill in all required fields', 'error')
    return
  }

  try {
    const result = await createAppointment({
      ...appointmentForm.value,
      status: 'pending',
    })
    if (result.success) {
      showAppointmentDialog.value = false
      showSnackbar('Appointment scheduled successfully!', 'success')
    } else {
      showSnackbar(result.error || 'Failed to schedule appointment', 'error')
    }
  } catch (err: any) {
    showSnackbar(err.message || 'An error occurred', 'error')
  }
}

const openBookingDialog = (activity: any) => {
  selectedActivity.value = activity
  showBookingDialog.value = true
}

const confirmBooking = async () => {
  if (!selectedActivity.value) return

  try {
    const today = new Date().toISOString().split('T')[0]
    const result = await createBooking({
      activity_id: selectedActivity.value.id,
      activity_name: selectedActivity.value.name,
      booking_date: today,
      status: 'pending',
    })

    if (result.success) {
      showBookingDialog.value = false
      showSnackbar('Booking created successfully!', 'success')
    } else {
      showSnackbar(result.error || 'Failed to create booking', 'error')
    }
  } catch (err: any) {
    showSnackbar(err.message || 'An error occurred', 'error')
  }
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

const handleEditActivity = (activity: any) => {
  editingActivity.value = activity
  newActivity.value = {
    name: activity.name,
    description: activity.description,
    type: activity.type,
    capacity: activity.capacity,
    location: activity.location,
  }
  imagePreview.value = activity.image_url
  imageFile.value = null
  showActivityDialog.value = true
}

const handleSaveActivity = async () => {
  if (
    !newActivity.value.name ||
    !newActivity.value.description ||
    !newActivity.value.type ||
    !newActivity.value.capacity ||
    !newActivity.value.location
  ) {
    showSnackbar('Please fill in all required fields', 'error')
    return
  }

  try {
    let result
    if (editingActivity.value) {
      result = await updateActivity(
        editingActivity.value.id,
        {
          ...newActivity.value,
          image_url: imagePreview.value,
        },
        imageFile.value,
      )
    } else {
      result = await createActivity(
        {
          ...newActivity.value,
          image_url: imagePreview.value,
        },
        imageFile.value,
      )
    }

    if (result.success) {
      showActivityDialog.value = false
      showSnackbar(
        editingActivity.value ? 'Activity updated successfully!' : 'Activity created successfully!',
        'success',
      )
    } else {
      showSnackbar(result.error || 'Failed to save activity', 'error')
    }
  } catch (err: any) {
    showSnackbar(err.message || 'An error occurred', 'error')
  }
}

const confirmDelete = (type: 'activity' | 'booking' | 'appointment', id: number) => {
  deleteTarget.value = { type, id }
  showDeleteDialog.value = true
}

const handleDelete = async () => {
  if (!deleteTarget.value) return

  try {
    let result
    switch (deleteTarget.value.type) {
      case 'activity':
        result = await deleteActivity(deleteTarget.value.id)
        break
      case 'booking':
        result = await deleteBooking(deleteTarget.value.id)
        break
      case 'appointment':
        result = await deleteAppointment(deleteTarget.value.id)
        break
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

const updateBookingStatus = async (
  bookingId: number,
  status: 'pending' | 'confirmed' | 'cancelled',
) => {
  try {
    const result = await updateBooking(bookingId, { status })
    if (result.success) {
      showSnackbar(`Booking ${status} successfully!`, 'success')
    } else {
      showSnackbar(result.error || 'Failed to update booking status', 'error')
    }
  } catch (err: any) {
    showSnackbar(err.message || 'An error occurred', 'error')
  }
}

const updateAppointmentStatus = async (
  appointmentId: number,
  status: 'pending' | 'confirmed' | 'cancelled',
) => {
  try {
    const result = await updateAppointment(appointmentId, { status })
    if (result.success) {
      showSnackbar(`Appointment ${status} successfully!`, 'success')
    } else {
      showSnackbar(result.error || 'Failed to update appointment status', 'error')
    }
  } catch (err: any) {
    showSnackbar(err.message || 'An error occurred', 'error')
  }
}

const downloadBookings = () => {
  const csvContent = [
    ['Activity Name', 'User Name', 'Email', 'Booking Date', 'Status'],
    ...bookings.value.map((b) => [
      b.activity_name,
      b.user_name,
      b.user_email,
      b.booking_date,
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
      a.full_name,
      a.email,
      a.contact_number,
      a.appointment_type,
      a.date,
      a.time,
      a.note || '',
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

const showSnackbar = (message: string, color: string = 'success') => {
  snackbarMessage.value = message
  snackbarColor.value = color
  snackbar.value = true
}

const activityHeaders = [
  { title: 'Activity', key: 'name' },
  { title: 'Type', key: 'type' },
  { title: 'Capacity', key: 'capacity' },
  { title: 'Location', key: 'location' },
  { title: 'Actions', key: 'actions' },
]

const bookingHeaders = [
  { title: 'Activity Name', key: 'activity_name' },
  { title: 'User Name', key: 'user_name' },
  { title: 'Email', key: 'user_email' },
  { title: 'Booking Date', key: 'booking_date' },
  { title: 'Status', key: 'status' },
  { title: 'Actions', key: 'actions' },
]

const appointmentHeaders = [
  { title: 'Full Name', key: 'full_name' },
  { title: 'Contact', key: 'contact_number' },
  { title: 'Type', key: 'appointment_type' },
  { title: 'Date & Time', key: 'date' },
  { title: 'Status', key: 'status' },
  { title: 'Actions', key: 'actions' },
]

const pageSubtitle = computed(() =>
  props.userType === 'admin'
    ? 'Manage farm activities, bookings, and appointments'
    : 'Explore and book farm activities',
)

const handleSearch = async (query: string) => {
  if (props.userType === 'admin') {
    switch (adminTab.value) {
      case 'activities':
        if (query) {
          await searchActivities(query)
        } else {
          await clearActivitiesSearch()
        }
        break
      case 'bookings':
        if (query) {
          await searchBookings(query)
        } else {
          await clearBookingsSearch()
        }
        break
      case 'appointments':
        if (query) {
          await searchAppointments(query)
        } else {
          await clearAppointmentsSearch()
        }
        break
    }
  } else {
    if (query) {
      await searchActivities(query)
    } else {
      await clearActivitiesSearch()
    }
  }
}

const handleClearSearch = async () => {
  if (props.userType === 'admin') {
    switch (adminTab.value) {
      case 'activities':
        await clearActivitiesSearch()
        break
      case 'bookings':
        await clearBookingsSearch()
        break
      case 'appointments':
        await clearAppointmentsSearch()
        break
    }
  } else {
    await clearActivitiesSearch()
  }
}

const handleSettingsClick = () => {
  console.log('Settings clicked')
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

const formatTime = (timeString: string) => {
  return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  })
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
          :user-type="userType"
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

      <!-- Loading State -->
      <v-row v-if="loading">
        <v-col cols="12" class="text-center py-12">
          <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
          <p class="text-h6 text-grey-darken-1 mt-4">Loading activities...</p>
        </v-col>
      </v-row>

      <!-- No Activities State -->
      <v-row v-else-if="!loading && activities.length === 0">
        <v-col cols="12">
          <v-card class="text-center py-12" elevation="0" color="grey-lighten-4">
            <v-icon icon="mdi-sprout-outline" size="100" color="grey-darken-1"></v-icon>
            <v-card-title class="text-h5 mb-2">No Activities Available</v-card-title>
            <v-card-text class="text-body-1 text-grey-darken-1">
              There are currently no farm activities available for booking.
              <br />
              Please check back later for new activities!
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Activities Cards -->
      <v-row v-else>
        <v-col v-for="activity in activities" :key="activity.id" cols="12" md="6" lg="4">
          <v-card class="fill-height">
            <v-img
              :src="
                activity.image_url ||
                'https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=400'
              "
              height="200"
              cover
            ></v-img>

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

      <!-- Loading More Indicator -->
      <v-row v-if="isLoadingMore && activities.length > 0" class="mt-4">
        <v-col cols="12" class="text-center">
          <v-progress-circular indeterminate color="primary" size="48"></v-progress-circular>
          <p class="text-body-2 text-grey-darken-1 mt-2">Loading more activities...</p>
        </v-col>
      </v-row>

      <!-- End of List Indicator -->
      <v-row
        v-if="
          !loading &&
          !isLoadingMore &&
          activities.length > 0 &&
          activitiesPage >= activitiesTotalPages
        "
        class="mt-4"
      >
        <v-col cols="12" class="text-center">
          <v-divider class="mb-4"></v-divider>
          <p class="text-body-2 text-grey">You've reached the end of the list</p>
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
            <v-col cols="12">
              <v-card>
                <v-card-title class="d-flex justify-space-between align-center pa-6">
                  <div class="d-flex align-center gap-4">
                    <span class="text-h6">All Farm Activities</span>
                    <v-chip v-if="activitiesTotal > 0" color="primary" size="small"
                      >{{ activitiesTotal }} total</v-chip
                    >
                  </div>
                  <div class="d-flex align-center gap-2">
                    <v-pagination
                      v-if="activities.length > 0"
                      v-model="activitiesPage"
                      :length="activitiesTotalPages"
                      :total-visible="5"
                      size="small"
                      rounded="circle"
                      @update:model-value="goToActivitiesPage"
                    ></v-pagination>
                    <v-btn color="primary" prepend-icon="mdi-plus" @click="handleAddActivity">
                      Add Activity
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
                    <p class="text-body-1 text-grey-darken-1 mt-4">Loading activities...</p>
                  </div>

                  <!-- No Data State -->
                  <div v-else-if="!loading && activities.length === 0" class="text-center py-12">
                    <v-icon icon="mdi-sprout-outline" size="80" color="grey-darken-1"></v-icon>
                    <p class="text-h6 text-grey-darken-1 mt-4">No activities yet</p>
                    <p class="text-body-2 text-grey">
                      Click "Add Activity" to create your first farm activity.
                    </p>
                  </div>

                  <!-- Data Table -->
                  <v-data-table
                    v-else
                    :headers="activityHeaders"
                    :items="activities"
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
                        @click="confirmDelete('activity', item.id)"
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
            <v-col cols="12">
              <v-card>
                <v-card-title class="d-flex justify-space-between align-center pa-6">
                  <div class="d-flex align-center gap-4">
                    <span class="text-h6">Activity Bookings</span>
                    <v-chip v-if="bookingsTotal > 0" color="primary" size="small"
                      >{{ bookingsTotal }} total</v-chip
                    >
                  </div>
                  <div class="d-flex align-center gap-2">
                    <v-pagination
                      v-if="bookings.length > 0"
                      v-model="bookingsPage"
                      :length="bookingsTotalPages"
                      :total-visible="5"
                      size="small"
                      rounded="circle"
                      @update:model-value="goToBookingsPage"
                    ></v-pagination>
                    <v-btn
                      color="success"
                      variant="elevated"
                      prepend-icon="mdi-download"
                      @click="downloadBookings"
                    >
                      View All Bookings
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
                    <p class="text-body-1 text-grey-darken-1 mt-4">Loading bookings...</p>
                  </div>

                  <!-- No Data State -->
                  <div v-else-if="!loading && bookings.length === 0" class="text-center py-12">
                    <v-icon
                      icon="mdi-calendar-blank-outline"
                      size="80"
                      color="grey-darken-1"
                    ></v-icon>
                    <p class="text-h6 text-grey-darken-1 mt-4">No bookings yet</p>
                    <p class="text-body-2 text-grey">
                      Bookings will appear here when users book farm activities.
                    </p>
                  </div>

                  <!-- Data Table -->
                  <v-data-table
                    v-else
                    :headers="bookingHeaders"
                    :items="bookings"
                    item-value="id"
                    hide-default-footer
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
            <v-col cols="12">
              <v-card>
                <v-card-title class="d-flex justify-space-between align-center pa-6">
                  <div class="d-flex align-center gap-4">
                    <span class="text-h6">User Appointments</span>
                    <v-chip v-if="appointmentsTotal > 0" color="primary" size="small"
                      >{{ appointmentsTotal }} total</v-chip
                    >
                  </div>
                  <div class="d-flex align-center gap-2">
                    <v-pagination
                      v-if="appointments.length > 0"
                      v-model="appointmentsPage"
                      :length="appointmentsTotalPages"
                      :total-visible="5"
                      size="small"
                      rounded="circle"
                      @update:model-value="goToAppointmentsPage"
                    ></v-pagination>
                    <v-btn
                      color="success"
                      variant="elevated"
                      prepend-icon="mdi-download"
                      @click="downloadAppointments"
                    >
                      View All Appointments
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
                    <p class="text-body-1 text-grey-darken-1 mt-4">Loading appointments...</p>
                  </div>

                  <!-- No Data State -->
                  <div v-else-if="!loading && appointments.length === 0" class="text-center py-12">
                    <v-icon
                      icon="mdi-calendar-clock-outline"
                      size="80"
                      color="grey-darken-1"
                    ></v-icon>
                    <p class="text-h6 text-grey-darken-1 mt-4">No appointments yet</p>
                    <p class="text-body-2 text-grey">
                      Appointments will appear here when users schedule them.
                    </p>
                  </div>

                  <!-- Data Table -->
                  <v-data-table
                    v-else
                    :headers="appointmentHeaders"
                    :items="appointments"
                    item-value="id"
                    hide-default-footer
                  >
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
                  v-model="appointmentForm.full_name"
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
                  v-model="appointmentForm.contact_number"
                  label="Contact Number *"
                  variant="outlined"
                  required
                ></v-text-field>
              </v-col>

              <v-col cols="12">
                <v-select
                  v-model="appointmentForm.appointment_type"
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
          <v-img
            :src="
              selectedActivity.image_url ||
              'https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=400'
            "
            height="150"
            cover
            class="rounded mb-4"
          ></v-img>

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

    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="showDeleteDialog" max-width="400px">
      <v-card>
        <v-card-title class="text-h5">Confirm Delete</v-card-title>
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

    <!-- Snackbar -->
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
