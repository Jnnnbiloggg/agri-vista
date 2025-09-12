<script setup lang="ts">
import { ref } from 'vue'

// Sample appointments data - replace with real API calls
const appointments = ref([
  {
    id: 1,
    date: '2025-01-15',
    time: '10:00 AM',
    activity: 'Strawberry Picking',
    status: 'confirmed',
    participants: 4,
    notes: 'Family visit with children',
  },
  {
    id: 2,
    date: '2025-01-18',
    time: '2:00 PM',
    activity: 'Herb Garden Tour',
    status: 'pending',
    participants: 2,
    notes: 'Educational tour for school project',
  },
  {
    id: 3,
    date: '2025-01-22',
    time: '9:00 AM',
    activity: 'Agriculture Workshop',
    status: 'confirmed',
    participants: 1,
    notes: 'Learning sustainable farming techniques',
  },
  {
    id: 4,
    date: '2025-01-12',
    time: '3:00 PM',
    activity: 'Farm Tour',
    status: 'completed',
    participants: 6,
    notes: 'Company team building activity',
  },
])

const showNewAppointmentDialog = ref(false)
const newAppointment = ref({
  date: '',
  time: '',
  activity: '',
  participants: 1,
  notes: '',
})

const activities = [
  'Strawberry Picking',
  'Herb Garden Tour',
  'Agriculture Workshop',
  'Farm Tour',
  'Organic Farming Demo',
  'Community Extension Program',
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

const handleBookAppointment = () => {
  // TODO: Implement booking logic
  console.log('Booking appointment:', newAppointment.value)
  appointments.value.unshift({
    id: Date.now(),
    ...newAppointment.value,
    status: 'pending',
  })
  showNewAppointmentDialog.value = false
  newAppointment.value = {
    date: '',
    time: '',
    activity: '',
    participants: 1,
    notes: '',
  }
}

const handleCancelAppointment = (id: number) => {
  const appointment = appointments.value.find((apt) => apt.id === id)
  if (appointment) {
    appointment.status = 'cancelled'
  }
}
</script>

<template>
  <div>
    <!-- Page Header -->
    <v-row class="mb-6">
      <v-col cols="12" class="d-flex align-center justify-space-between">
        <div>
          <h1 class="text-h4 font-weight-bold text-primary mb-2">My Appointments</h1>
          <p class="text-h6 text-grey-darken-1">Manage your farm visits and activities</p>
        </div>
        <v-btn
          color="primary"
          variant="elevated"
          prepend-icon="mdi-plus"
          @click="showNewAppointmentDialog = true"
        >
          Book Appointment
        </v-btn>
      </v-col>
    </v-row>

    <!-- Appointments List -->
    <v-row>
      <v-col cols="12">
        <v-card>
          <v-card-title>All Appointments</v-card-title>
          <v-card-text>
            <v-data-table
              :headers="[
                { title: 'Date & Time', key: 'datetime', sortable: true },
                { title: 'Activity', key: 'activity' },
                { title: 'Participants', key: 'participants' },
                { title: 'Status', key: 'status' },
                { title: 'Actions', key: 'actions', sortable: false },
              ]"
              :items="appointments"
              item-value="id"
            >
              <template v-slot:item.datetime="{ item }">
                <div>
                  <div class="font-weight-medium">{{ item.date }}</div>
                  <div class="text-caption text-grey-darken-1">{{ item.time }}</div>
                </div>
              </template>

              <template v-slot:item.status="{ item }">
                <v-chip :color="getStatusColor(item.status)" size="small" variant="tonal">
                  {{ item.status }}
                </v-chip>
              </template>

              <template v-slot:item.actions="{ item }">
                <v-btn
                  v-if="item.status === 'pending' || item.status === 'confirmed'"
                  icon="mdi-cancel"
                  size="small"
                  variant="text"
                  color="error"
                  @click="handleCancelAppointment(item.id)"
                >
                </v-btn>
                <v-btn icon="mdi-eye" size="small" variant="text" color="primary"> </v-btn>
              </template>

              <template v-slot:expanded-row="{ item }">
                <tr>
                  <td colspan="5" class="pa-4">
                    <v-card variant="tonal" class="pa-4">
                      <h4 class="mb-2">Notes:</h4>
                      <p>{{ item.notes || 'No additional notes' }}</p>
                    </v-card>
                  </td>
                </tr>
              </template>
            </v-data-table>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- New Appointment Dialog -->
    <v-dialog v-model="showNewAppointmentDialog" max-width="600px">
      <v-card>
        <v-card-title>Book New Appointment</v-card-title>
        <v-card-text>
          <v-form @submit.prevent="handleBookAppointment">
            <v-row>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="newAppointment.date"
                  label="Date"
                  type="date"
                  variant="outlined"
                  required
                ></v-text-field>
              </v-col>

              <v-col cols="12" md="6">
                <v-text-field
                  v-model="newAppointment.time"
                  label="Time"
                  type="time"
                  variant="outlined"
                  required
                ></v-text-field>
              </v-col>

              <v-col cols="12">
                <v-select
                  v-model="newAppointment.activity"
                  label="Activity"
                  :items="activities"
                  variant="outlined"
                  required
                ></v-select>
              </v-col>

              <v-col cols="12">
                <v-number-input
                  v-model="newAppointment.participants"
                  label="Number of Participants"
                  variant="outlined"
                  :min="1"
                  :max="20"
                  required
                ></v-number-input>
              </v-col>

              <v-col cols="12">
                <v-textarea
                  v-model="newAppointment.notes"
                  label="Additional Notes"
                  variant="outlined"
                  rows="3"
                  placeholder="Any special requirements or information..."
                ></v-textarea>
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>

        <v-card-actions class="px-6 pb-6">
          <v-spacer></v-spacer>
          <v-btn variant="outlined" @click="showNewAppointmentDialog = false"> Cancel </v-btn>
          <v-btn color="primary" variant="elevated" @click="handleBookAppointment">
            Book Appointment
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<style scoped>
/* Component specific styles */
</style>
