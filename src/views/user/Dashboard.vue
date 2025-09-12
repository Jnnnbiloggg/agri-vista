<script setup lang="ts">
import { ref } from 'vue'

// Sample data - replace with real API calls
const dashboardStats = ref([
  { title: 'My Appointments', value: 3, icon: 'mdi-calendar', color: 'primary' },
  { title: 'Activities Joined', value: 12, icon: 'mdi-leaf', color: 'success' },
  { title: 'Farm Visits', value: 5, icon: 'mdi-map-marker', color: 'info' },
  { title: 'Certificates Earned', value: 2, icon: 'mdi-certificate', color: 'warning' },
])

const upcomingAppointments = ref([
  { date: '2025-01-15', time: '10:00 AM', activity: 'Strawberry Picking', status: 'confirmed' },
  { date: '2025-01-18', time: '2:00 PM', activity: 'Herb Garden Tour', status: 'pending' },
  { date: '2025-01-22', time: '9:00 AM', activity: 'Agriculture Workshop', status: 'confirmed' },
])

const recentActivities = ref([
  { date: '2025-01-10', activity: 'Completed Organic Farming Workshop', type: 'workshop' },
  { date: '2025-01-08', activity: 'Joined Strawberry Harvest Festival', type: 'event' },
  { date: '2025-01-05', activity: 'Farm Tour with Family', type: 'tour' },
])
</script>

<template>
  <div>
    <!-- Page Header -->
    <v-row class="mb-6">
      <v-col cols="12">
        <h1 class="text-h4 font-weight-bold text-primary mb-2">Welcome Back!</h1>
        <p class="text-h6 text-grey-darken-1">Here's what's happening at Robrosa's Farm</p>
      </v-col>
    </v-row>

    <!-- Stats Cards -->
    <v-row class="mb-6">
      <v-col v-for="stat in dashboardStats" :key="stat.title" cols="12" sm="6" md="3">
        <v-card :color="stat.color" variant="tonal" class="pa-4">
          <v-row align="center" no-gutters>
            <v-col cols="auto">
              <v-icon :icon="stat.icon" size="40" :color="stat.color"></v-icon>
            </v-col>
            <v-col class="pl-4">
              <h3 class="text-h4 font-weight-bold">{{ stat.value }}</h3>
              <p class="text-body-2">{{ stat.title }}</p>
            </v-col>
          </v-row>
        </v-card>
      </v-col>
    </v-row>

    <!-- Main Content Grid -->
    <v-row>
      <!-- Upcoming Appointments -->
      <v-col cols="12" md="6">
        <v-card class="fill-height">
          <v-card-title class="d-flex align-center">
            <v-icon icon="mdi-calendar" class="mr-2"></v-icon>
            Upcoming Appointments
          </v-card-title>
          <v-card-text>
            <v-list>
              <v-list-item
                v-for="appointment in upcomingAppointments"
                :key="appointment.date + appointment.time"
                class="px-0"
              >
                <template v-slot:prepend>
                  <v-avatar
                    :color="appointment.status === 'confirmed' ? 'success' : 'warning'"
                    size="small"
                  >
                    <v-icon icon="mdi-calendar-check" size="16"></v-icon>
                  </v-avatar>
                </template>
                <v-list-item-title>{{ appointment.activity }}</v-list-item-title>
                <v-list-item-subtitle>
                  {{ appointment.date }} at {{ appointment.time }}
                </v-list-item-subtitle>
                <template v-slot:append>
                  <v-chip
                    :color="appointment.status === 'confirmed' ? 'success' : 'warning'"
                    size="small"
                    variant="tonal"
                  >
                    {{ appointment.status }}
                  </v-chip>
                </template>
              </v-list-item>
            </v-list>
            <v-btn color="primary" variant="text" block class="mt-4"> View All Appointments </v-btn>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Recent Activities -->
      <v-col cols="12" md="6">
        <v-card class="fill-height">
          <v-card-title class="d-flex align-center">
            <v-icon icon="mdi-history" class="mr-2"></v-icon>
            Recent Activities
          </v-card-title>
          <v-card-text>
            <v-timeline density="compact">
              <v-timeline-item
                v-for="activity in recentActivities"
                :key="activity.date"
                dot-color="primary"
                size="small"
              >
                <template v-slot:opposite>
                  <span class="text-caption text-grey-darken-1">{{ activity.date }}</span>
                </template>
                <div>
                  <p class="text-body-2 font-weight-medium">{{ activity.activity }}</p>
                  <v-chip
                    :color="
                      activity.type === 'workshop'
                        ? 'info'
                        : activity.type === 'event'
                          ? 'success'
                          : 'primary'
                    "
                    size="x-small"
                    variant="tonal"
                  >
                    {{ activity.type }}
                  </v-chip>
                </div>
              </v-timeline-item>
            </v-timeline>
            <v-btn color="primary" variant="text" block class="mt-4"> View Activity History </v-btn>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Quick Actions -->
    <v-row class="mt-6">
      <v-col cols="12">
        <v-card>
          <v-card-title>Quick Actions</v-card-title>
          <v-card-text>
            <v-row>
              <v-col cols="12" sm="6" md="3">
                <v-btn color="primary" variant="elevated" block size="large" class="py-8">
                  <div class="text-center">
                    <v-icon icon="mdi-calendar-plus" size="32" class="mb-2"></v-icon>
                    <br />
                    Book Appointment
                  </div>
                </v-btn>
              </v-col>
              <v-col cols="12" sm="6" md="3">
                <v-btn color="success" variant="elevated" block size="large" class="py-8">
                  <div class="text-center">
                    <v-icon icon="mdi-leaf" size="32" class="mb-2"></v-icon>
                    <br />
                    Join Activity
                  </div>
                </v-btn>
              </v-col>
              <v-col cols="12" sm="6" md="3">
                <v-btn color="info" variant="elevated" block size="large" class="py-8">
                  <div class="text-center">
                    <v-icon icon="mdi-account-edit" size="32" class="mb-2"></v-icon>
                    <br />
                    Update Profile
                  </div>
                </v-btn>
              </v-col>
              <v-col cols="12" sm="6" md="3">
                <v-btn color="warning" variant="elevated" block size="large" class="py-8">
                  <div class="text-center">
                    <v-icon icon="mdi-help-circle" size="32" class="mb-2"></v-icon>
                    <br />
                    Get Help
                  </div>
                </v-btn>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<style scoped>
/* Component specific styles */
</style>
