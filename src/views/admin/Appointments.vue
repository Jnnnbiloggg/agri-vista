<script setup lang="ts">
import { ref, computed } from 'vue'

// Sample appointments data - replace with real API calls
const appointments = ref([
  {
    id: 1,
    user: 'John Doe',
    email: 'john.doe@example.com',
    activity: 'Strawberry Picking',
    date: '2025-01-15',
    time: '10:00 AM',
    participants: 4,
    status: 'pending',
    notes: 'Family visit with children',
    createdAt: '2025-01-10',
  },
  {
    id: 2,
    user: 'Jane Smith',
    email: 'jane.smith@example.com',
    activity: 'Farm Tour',
    date: '2025-01-15',
    time: '2:00 PM',
    participants: 2,
    status: 'confirmed',
    notes: 'School project research',
    createdAt: '2025-01-09',
  },
  {
    id: 3,
    user: 'Mike Johnson',
    email: 'mike.johnson@example.com',
    activity: 'Agriculture Workshop',
    date: '2025-01-16',
    time: '9:00 AM',
    participants: 1,
    status: 'confirmed',
    notes: 'Learning sustainable farming',
    createdAt: '2025-01-08',
  },
  {
    id: 4,
    user: 'Sarah Wilson',
    email: 'sarah.wilson@example.com',
    activity: 'Herb Garden Tour',
    date: '2025-01-12',
    time: '3:00 PM',
    participants: 3,
    status: 'completed',
    notes: 'Team building activity',
    createdAt: '2025-01-05',
  },
])

const searchQuery = ref('')
const selectedStatus = ref('all')
const selectedDate = ref('')

const filteredAppointments = computed(() => {
  return appointments.value.filter((appointment) => {
    const matchesSearch =
      appointment.user.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      appointment.activity.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      appointment.email.toLowerCase().includes(searchQuery.value.toLowerCase())
    const matchesStatus =
      selectedStatus.value === 'all' || appointment.status === selectedStatus.value
    const matchesDate = !selectedDate.value || appointment.date === selectedDate.value

    return matchesSearch && matchesStatus && matchesDate
  })
})

const statusOptions = [
  { title: 'All Status', value: 'all' },
  { title: 'Pending', value: 'pending' },
  { title: 'Confirmed', value: 'confirmed' },
  { title: 'Completed', value: 'completed' },
  { title: 'Cancelled', value: 'cancelled' },
]

const getStatusColor = (status: string) => {
  switch (status) {
    case 'confirmed':
      return 'success'
    case 'pending':
      return 'warning'
    case 'completed':
      return 'info'
    case 'cancelled':
      return 'error'
    default:
      return 'grey'
  }
}

const handleStatusChange = (appointment: any, newStatus: string) => {
  appointment.status = newStatus
  // TODO: Implement API call to update status
  console.log(`Updated appointment ${appointment.id} status to ${newStatus}`)
}

const handleViewDetails = (appointment: any) => {
  // TODO: Implement view details functionality
  console.log('View appointment details:', appointment)
}

const handleDeleteAppointment = (id: number) => {
  const index = appointments.value.findIndex((a) => a.id === id)
  if (index !== -1) {
    appointments.value.splice(index, 1)
  }
}

// Statistics
const appointmentStats = computed(() => {
  const total = appointments.value.length
  const pending = appointments.value.filter((a) => a.status === 'pending').length
  const confirmed = appointments.value.filter((a) => a.status === 'confirmed').length
  const completed = appointments.value.filter((a) => a.status === 'completed').length
  const cancelled = appointments.value.filter((a) => a.status === 'cancelled').length

  return { total, pending, confirmed, completed, cancelled }
})
</script>

<template>
  <div>
    <!-- Page Header -->
    <v-row class="mb-6">
      <v-col cols="12">
        <h1 class="text-h4 font-weight-bold text-primary mb-2">Appointment Management</h1>
        <p class="text-h6 text-grey-darken-1">Monitor and manage all farm appointments</p>
      </v-col>
    </v-row>

    <!-- Statistics Cards -->
    <v-row class="mb-6">
      <v-col cols="12" sm="6" md="2.4">
        <v-card color="primary" variant="tonal" class="pa-4 text-center">
          <h3 class="text-h4 font-weight-bold">{{ appointmentStats.total }}</h3>
          <p class="text-body-2">Total</p>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6" md="2.4">
        <v-card color="warning" variant="tonal" class="pa-4 text-center">
          <h3 class="text-h4 font-weight-bold">{{ appointmentStats.pending }}</h3>
          <p class="text-body-2">Pending</p>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6" md="2.4">
        <v-card color="success" variant="tonal" class="pa-4 text-center">
          <h3 class="text-h4 font-weight-bold">{{ appointmentStats.confirmed }}</h3>
          <p class="text-body-2">Confirmed</p>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6" md="2.4">
        <v-card color="info" variant="tonal" class="pa-4 text-center">
          <h3 class="text-h4 font-weight-bold">{{ appointmentStats.completed }}</h3>
          <p class="text-body-2">Completed</p>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6" md="2.4">
        <v-card color="error" variant="tonal" class="pa-4 text-center">
          <h3 class="text-h4 font-weight-bold">{{ appointmentStats.cancelled }}</h3>
          <p class="text-body-2">Cancelled</p>
        </v-card>
      </v-col>
    </v-row>

    <!-- Filters -->
    <v-row class="mb-6">
      <v-col cols="12" md="4">
        <v-text-field
          v-model="searchQuery"
          label="Search appointments..."
          prepend-inner-icon="mdi-magnify"
          variant="outlined"
          clearable
        ></v-text-field>
      </v-col>
      <v-col cols="12" md="4">
        <v-select
          v-model="selectedStatus"
          label="Filter by Status"
          :items="statusOptions"
          variant="outlined"
        ></v-select>
      </v-col>
      <v-col cols="12" md="4">
        <v-text-field
          v-model="selectedDate"
          label="Filter by Date"
          type="date"
          variant="outlined"
          clearable
        ></v-text-field>
      </v-col>
    </v-row>

    <!-- Appointments Table -->
    <v-row>
      <v-col cols="12">
        <v-card>
          <v-card-title class="d-flex align-center justify-space-between">
            <span>All Appointments ({{ filteredAppointments.length }})</span>
          </v-card-title>
          <v-card-text>
            <v-data-table
              :headers="[
                { title: 'User', key: 'user', sortable: true },
                { title: 'Activity', key: 'activity' },
                { title: 'Date & Time', key: 'datetime', sortable: true },
                { title: 'Participants', key: 'participants' },
                { title: 'Status', key: 'status' },
                { title: 'Actions', key: 'actions', sortable: false },
              ]"
              :items="filteredAppointments"
              item-value="id"
            >
              <template v-slot:item.user="{ item }">
                <div>
                  <div class="font-weight-medium">{{ item.user }}</div>
                  <div class="text-caption text-grey-darken-1">{{ item.email }}</div>
                </div>
              </template>

              <template v-slot:item.datetime="{ item }">
                <div>
                  <div class="font-weight-medium">{{ item.date }}</div>
                  <div class="text-caption text-grey-darken-1">{{ item.time }}</div>
                </div>
              </template>

              <template v-slot:item.status="{ item }">
                <v-select
                  :model-value="item.status"
                  :items="statusOptions.slice(1)"
                  variant="outlined"
                  density="compact"
                  hide-details
                  @update:model-value="(value) => handleStatusChange(item, value)"
                >
                  <template v-slot:selection="{ item: statusItem }">
                    <v-chip :color="getStatusColor(statusItem.value)" size="small" variant="tonal">
                      {{ statusItem.title }}
                    </v-chip>
                  </template>
                </v-select>
              </template>

              <template v-slot:item.actions="{ item }">
                <v-btn
                  icon="mdi-eye"
                  size="small"
                  variant="text"
                  color="primary"
                  @click="handleViewDetails(item)"
                ></v-btn>
                <v-btn
                  icon="mdi-delete"
                  size="small"
                  variant="text"
                  color="error"
                  @click="handleDeleteAppointment(item.id)"
                ></v-btn>
              </template>

              <template v-slot:expanded-row="{ item }">
                <tr>
                  <td colspan="6" class="pa-4">
                    <v-card variant="tonal" class="pa-4">
                      <h4 class="mb-2">Additional Details:</h4>
                      <p><strong>Email:</strong> {{ item.email }}</p>
                      <p><strong>Created:</strong> {{ item.createdAt }}</p>
                      <p><strong>Notes:</strong> {{ item.notes || 'No additional notes' }}</p>
                    </v-card>
                  </td>
                </tr>
              </template>
            </v-data-table>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<style scoped>
/* Component specific styles */
</style>
