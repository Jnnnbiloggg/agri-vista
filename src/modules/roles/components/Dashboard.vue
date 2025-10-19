<script setup lang="ts">
import { ref, computed } from 'vue'
import StatusBadge from './shared/StatusBadge.vue'

interface Props {
  userType: 'admin' | 'user'
}

const props = defineProps<Props>()

// Admin dashboard stats
const adminDashboardStats = ref([
  {
    title: 'Total Users',
    value: 847,
    icon: 'mdi-account-multiple',
    color: 'primary',
    change: '+12%',
  },
  {
    title: 'Active Appointments',
    value: 124,
    icon: 'mdi-calendar',
    color: 'success',
    change: '+8%',
  },
  {
    title: 'Monthly Revenue',
    value: '₱45,280',
    icon: 'mdi-currency-php',
    color: 'info',
    change: '+15%',
  },
  { title: 'Farm Activities', value: 18, icon: 'mdi-leaf', color: 'warning', change: '+3%' },
])

// User dashboard stats
const userDashboardStats = ref([
  { title: 'My Appointments', value: 3, icon: 'mdi-calendar', color: 'primary', change: '+2' },
  { title: 'Activities Joined', value: 12, icon: 'mdi-leaf', color: 'success', change: '+5' },
  { title: 'Farm Visits', value: 5, icon: 'mdi-map-marker', color: 'info', change: '+1' },
  {
    title: 'Certificates Earned',
    value: 2,
    icon: 'mdi-certificate',
    color: 'warning',
    change: '+1',
  },
])

// Computed properties based on user type
const dashboardStats = computed(() =>
  props.userType === 'admin' ? adminDashboardStats.value : userDashboardStats.value,
)

const pageTitle = computed(() => (props.userType === 'admin' ? 'Admin Dashboard' : 'Welcome Back!'))

const pageSubtitle = computed(() =>
  props.userType === 'admin'
    ? "Manage Robrosa's Farm operations and analytics"
    : "Here's what's happening at Robrosa's Farm",
)

const recentAppointments = ref<
  Array<{
    id: number
    user: string
    activity: string
    date: string
    status: 'pending' | 'confirmed' | 'cancelled' | 'approved' | 'rejected' | 'completed'
  }>
>([
  {
    id: 1,
    user: 'John Doe',
    activity: 'Strawberry Picking',
    date: '2025-01-15',
    status: 'confirmed',
  },
  { id: 2, user: 'Jane Smith', activity: 'Farm Tour', date: '2025-01-15', status: 'pending' },
  {
    id: 3,
    user: 'Mike Johnson',
    activity: 'Agriculture Workshop',
    date: '2025-01-16',
    status: 'confirmed',
  },
  {
    id: 4,
    user: 'Sarah Wilson',
    activity: 'Herb Garden Tour',
    date: '2025-01-16',
    status: 'pending',
  },
])

const upcomingAppointments = ref<
  Array<{
    date: string
    time: string
    activity: string
    status: 'pending' | 'confirmed' | 'cancelled' | 'approved' | 'rejected' | 'completed'
  }>
>([
  { date: '2025-01-15', time: '10:00 AM', activity: 'Strawberry Picking', status: 'confirmed' },
  { date: '2025-01-18', time: '2:00 PM', activity: 'Herb Garden Tour', status: 'pending' },
  { date: '2025-01-22', time: '9:00 AM', activity: 'Agriculture Workshop', status: 'confirmed' },
])

const recentActivities = ref([
  { date: '2025-01-10', activity: 'Completed Organic Farming Workshop', type: 'workshop' },
  { date: '2025-01-08', activity: 'Joined Strawberry Harvest Festival', type: 'event' },
  { date: '2025-01-05', activity: 'Farm Tour with Family', type: 'tour' },
])

const systemAlerts = ref([
  { type: 'warning', message: 'Low strawberry stock - consider restocking', time: '2 hours ago' },
  { type: 'info', message: 'New user registration: Maria Garcia', time: '4 hours ago' },
  { type: 'success', message: 'Monthly backup completed successfully', time: '6 hours ago' },
])

// Quick actions based on user type
const quickActions = computed(() => {
  if (props.userType === 'admin') {
    return [
      { title: 'Add User', icon: 'mdi-account-plus', color: 'primary' },
      { title: 'New Announcement', icon: 'mdi-bullhorn', color: 'success' },
      { title: 'Add Activity', icon: 'mdi-leaf', color: 'info' },
      { title: 'View Reports', icon: 'mdi-chart-line', color: 'warning' },
    ]
  } else {
    return [
      { title: 'Book Appointment', icon: 'mdi-calendar-plus', color: 'primary' },
      { title: 'Join Activity', icon: 'mdi-leaf', color: 'success' },
      { title: 'Update Profile', icon: 'mdi-account-edit', color: 'info' },
      { title: 'Get Help', icon: 'mdi-help-circle', color: 'warning' },
    ]
  }
})

const appointmentTableHeaders = computed(() => {
  const baseHeaders = [
    { title: 'Activity', key: 'activity' },
    { title: 'Date', key: 'date' },
    { title: 'Status', key: 'status' },
  ]

  if (props.userType === 'admin') {
    baseHeaders.unshift({ title: 'User', key: 'user' })
    baseHeaders.push({ title: 'Actions', key: 'actions' })
  } else {
    baseHeaders.splice(1, 0, { title: 'Time', key: 'time' })
  }

  return baseHeaders
})
</script>

<template>
  <div class="dashboard-container">
    <!-- Page Header -->
    <div class="page-header mb-2xl">
      <h1 class="page-title">{{ pageTitle }}</h1>
      <p class="page-subtitle">{{ pageSubtitle }}</p>
    </div>

    <!-- Stats Cards -->
    <v-row class="mb-2xl spacing-lg">
      <v-col v-for="stat in dashboardStats" :key="stat.title" cols="12" sm="6" md="3">
        <v-card class="stats-card" :color="stat.color" variant="tonal">
          <div class="d-flex align-center justify-space-between">
            <div>
              <div class="stats-label mb-sm">{{ stat.title }}</div>
              <div class="stats-value">{{ stat.value }}</div>
              <div
                v-if="stat.change"
                class="text-caption mt-sm"
                style="color: #2e7d32; font-weight: 500"
              >
                {{ stat.change }} from last month
              </div>
            </div>
            <div class="stats-icon" :style="`background: rgba(var(--v-theme-${stat.color}), 0.2);`">
              <v-icon :icon="stat.icon" size="24" :color="stat.color"></v-icon>
            </div>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <!-- Main Content Grid -->
    <v-row class="spacing-lg">
      <!-- Admin: Recent Appointments Table / User: Upcoming Appointments List -->
      <v-col cols="12" :lg="userType === 'admin' ? 8 : 6">
        <v-card class="modern-card mb-lg" :class="{ 'fill-height': userType === 'user' }">
          <v-card-title class="px-xl py-lg">
            <div class="d-flex align-center justify-space-between">
              <span class="text-h5 font-weight-bold">
                {{ userType === 'admin' ? 'Recent Appointments' : 'Upcoming Appointments' }}
              </span>
              <v-btn
                v-if="userType === 'admin'"
                variant="text"
                color="primary"
                class="modern-btn"
                size="small"
              >
                View All
              </v-btn>
            </div>
          </v-card-title>

          <v-divider class="modern-divider"></v-divider>

          <!-- Admin Table View -->
          <template v-if="userType === 'admin'">
            <v-data-table
              :headers="appointmentTableHeaders"
              :items="recentAppointments"
              :items-per-page="5"
              class="modern-table"
              hide-default-footer
            >
              <template v-slot:item.status="{ item }">
                <StatusBadge :status="item.status" />
              </template>
              <template v-slot:item.actions="{ item }">
                <v-btn icon size="small" variant="text" color="primary" class="modern-btn-icon">
                  <v-icon size="20">mdi-eye</v-icon>
                </v-btn>
                <v-btn icon size="small" variant="text" color="success" class="modern-btn-icon">
                  <v-icon size="20">mdi-check</v-icon>
                </v-btn>
              </template>
            </v-data-table>
          </template>

          <!-- User List View -->
          <template v-else>
            <v-list class="px-md py-md">
              <v-list-item
                v-for="(appointment, index) in upcomingAppointments"
                :key="index"
                class="modern-list-item px-lg py-md mb-sm"
              >
                <template v-slot:prepend>
                  <v-avatar color="primary" variant="tonal" class="modern-avatar" size="48">
                    <v-icon icon="mdi-calendar"></v-icon>
                  </v-avatar>
                </template>

                <v-list-item-title class="font-weight-bold mb-1">
                  {{ appointment.activity }}
                </v-list-item-title>
                <v-list-item-subtitle class="mb-2">
                  {{ appointment.date }} at {{ appointment.time }}
                </v-list-item-subtitle>

                <template v-slot:append>
                  <StatusBadge :status="appointment.status" />
                </template>
              </v-list-item>
            </v-list>
          </template>
        </v-card>

        <!-- Quick Actions (Admin only, shown below table) -->
        <v-card v-if="userType === 'admin'" class="modern-card">
          <v-card-title class="px-xl py-lg">
            <span class="text-h5 font-weight-bold">Quick Actions</span>
          </v-card-title>
          <v-divider class="modern-divider"></v-divider>
          <v-card-text class="px-xl py-lg">
            <v-row class="spacing-md">
              <v-col v-for="action in quickActions" :key="action.title" cols="6">
                <v-btn
                  :color="action.color"
                  variant="tonal"
                  block
                  size="large"
                  class="modern-btn py-6"
                >
                  <v-icon :icon="action.icon" class="mr-2"></v-icon>
                  {{ action.title }}
                </v-btn>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Right Column: Admin alerts/charts, User recent activities -->
      <v-col cols="12" :lg="userType === 'admin' ? 4 : 6">
        <!-- Admin: System Alerts & Overview -->
        <template v-if="userType === 'admin'">
          <v-card class="modern-card mb-lg">
            <v-card-title class="px-xl py-lg">
              <span class="text-h5 font-weight-bold">System Alerts</span>
            </v-card-title>
            <v-divider class="modern-divider"></v-divider>
            <v-list class="px-md py-md">
              <v-list-item
                v-for="(alert, index) in systemAlerts"
                :key="index"
                class="modern-list-item px-lg py-md mb-sm"
              >
                <template v-slot:prepend>
                  <v-avatar :color="alert.type" variant="tonal" class="modern-avatar" size="40">
                    <v-icon
                      :icon="
                        alert.type === 'warning'
                          ? 'mdi-alert'
                          : alert.type === 'success'
                            ? 'mdi-check-circle'
                            : 'mdi-information'
                      "
                    ></v-icon>
                  </v-avatar>
                </template>

                <v-list-item-title class="font-weight-medium mb-1">
                  {{ alert.message }}
                </v-list-item-title>
                <v-list-item-subtitle class="text-caption">
                  {{ alert.time }}
                </v-list-item-subtitle>
              </v-list-item>
            </v-list>
          </v-card>

          <v-card class="modern-card">
            <v-card-title class="px-xl py-lg">
              <span class="text-h5 font-weight-bold">Analytics Overview</span>
            </v-card-title>
            <v-divider class="modern-divider"></v-divider>
            <v-card-text class="px-xl py-xl">
              <div
                class="chart-placeholder d-flex align-center justify-center"
                style="
                  height: 250px;
                  border-radius: var(--radius-lg);
                  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
                "
              >
                <div class="text-center">
                  <v-icon icon="mdi-chart-line" size="64" color="grey-lighten-1"></v-icon>
                  <p class="text-grey-darken-1 mt-4">Chart visualization here</p>
                </div>
              </div>
            </v-card-text>
          </v-card>
        </template>

        <!-- User: Recent Activities -->
        <template v-else>
          <v-card class="modern-card fill-height">
            <v-card-title class="px-xl py-lg">
              <span class="text-h5 font-weight-bold">Recent Activities</span>
            </v-card-title>
            <v-divider class="modern-divider"></v-divider>
            <v-list class="px-md py-md">
              <v-list-item
                v-for="(activity, index) in recentActivities"
                :key="index"
                class="modern-list-item px-lg py-md mb-sm"
              >
                <template v-slot:prepend>
                  <v-avatar
                    :color="
                      activity.type === 'workshop'
                        ? 'primary'
                        : activity.type === 'event'
                          ? 'success'
                          : 'info'
                    "
                    variant="tonal"
                    class="modern-avatar"
                    size="40"
                  >
                    <v-icon
                      :icon="
                        activity.type === 'workshop'
                          ? 'mdi-school'
                          : activity.type === 'event'
                            ? 'mdi-calendar-star'
                            : 'mdi-map-marker'
                      "
                    ></v-icon>
                  </v-avatar>
                </template>

                <v-list-item-title class="font-weight-medium mb-1">
                  {{ activity.activity }}
                </v-list-item-title>
                <v-list-item-subtitle class="text-caption">
                  {{ activity.date }}
                </v-list-item-subtitle>
              </v-list-item>
            </v-list>
          </v-card>
        </template>
      </v-col>
    </v-row>

    <!-- User Quick Actions (bottom section) -->
    <v-row v-if="userType === 'user'" class="mt-xl spacing-lg">
      <v-col cols="12">
        <v-card class="modern-card">
          <v-card-title class="px-xl py-lg">
            <span class="text-h5 font-weight-bold">Quick Actions</span>
          </v-card-title>
          <v-divider class="modern-divider"></v-divider>
          <v-card-text class="px-xl py-lg">
            <v-row class="spacing-md">
              <v-col v-for="action in quickActions" :key="action.title" cols="12" sm="6" md="3">
                <v-btn
                  :color="action.color"
                  variant="tonal"
                  block
                  size="large"
                  class="modern-btn py-6"
                >
                  <v-icon :icon="action.icon" class="mr-2"></v-icon>
                  {{ action.title }}
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
.dashboard-container {
  width: 100%;
}

.modern-list-item {
  border-radius: var(--radius-md) !important;
  border: 1px solid rgba(0, 0, 0, 0.04);
  transition: all var(--transition-fast);
}

.modern-list-item:hover {
  border-color: rgba(76, 175, 80, 0.2);
  background-color: rgba(76, 175, 80, 0.02);
  transform: translateX(4px);
}

.chart-placeholder {
  border: 2px dashed #dee2e6;
}
</style>
