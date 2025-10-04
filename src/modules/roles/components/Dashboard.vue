<script setup lang="ts">
import { ref, computed } from 'vue'

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
  { title: 'My Appointments', value: 3, icon: 'mdi-calendar', color: 'primary' },
  { title: 'Activities Joined', value: 12, icon: 'mdi-leaf', color: 'success' },
  { title: 'Farm Visits', value: 5, icon: 'mdi-map-marker', color: 'info' },
  { title: 'Certificates Earned', value: 2, icon: 'mdi-certificate', color: 'warning' },
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

const recentAppointments = ref([
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
  <div>
    <!-- Page Header -->
    <v-row class="mb-6">
      <v-col cols="12">
        <h1 class="text-h4 font-weight-bold text-primary mb-2">{{ pageTitle }}</h1>
        <p class="text-h6 text-grey-darken-1">{{ pageSubtitle }}</p>
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
              <h3 class="text-h5 font-weight-bold">{{ stat.value }}</h3>
              <p class="text-body-2 mb-1">{{ stat.title }}</p>
              <v-chip
                v-if="userType === 'admin' && 'change' in stat"
                size="x-small"
                :color="stat.color"
                variant="outlined"
              >
                {{ stat.change }}
              </v-chip>
            </v-col>
          </v-row>
        </v-card>
      </v-col>
    </v-row>

    <!-- Main Content Grid -->
    <v-row>
      <!-- Admin: Recent Appointments Table / User: Upcoming Appointments List -->
      <v-col cols="12" :lg="userType === 'admin' ? 8 : 6">
        <v-card class="mb-6" :class="{ 'fill-height': userType === 'user' }">
          <v-card-title class="d-flex align-center justify-space-between">
            <span class="d-flex align-center">
              <v-icon
                :icon="userType === 'admin' ? 'mdi-calendar-multiple' : 'mdi-calendar'"
                class="mr-2"
              ></v-icon>
              {{ userType === 'admin' ? 'Recent Appointments' : 'Upcoming Appointments' }}
            </span>
            <v-btn color="primary" variant="text" size="small">
              {{ userType === 'admin' ? 'View All' : 'View All Appointments' }}
            </v-btn>
          </v-card-title>

          <v-card-text>
            <!-- Admin Table View -->
            <v-data-table
              v-if="userType === 'admin'"
              :headers="appointmentTableHeaders"
              :items="recentAppointments"
              :items-per-page="5"
              hide-default-footer
            >
              <template v-slot:item.status="{ item }">
                <v-chip
                  :color="item.status === 'confirmed' ? 'success' : 'warning'"
                  size="small"
                  variant="tonal"
                >
                  {{ item.status }}
                </v-chip>
              </template>

              <template v-slot:item.actions="{ item }">
                <v-btn icon="mdi-eye" size="small" variant="text"></v-btn>
                <v-btn icon="mdi-pencil" size="small" variant="text"></v-btn>
              </template>
            </v-data-table>

            <!-- User List View -->
            <v-list v-else>
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
          </v-card-text>
        </v-card>

        <!-- Quick Actions (always shown) -->
        <v-card v-if="userType === 'admin'">
          <v-card-title>Quick Actions</v-card-title>
          <v-card-text>
            <v-row>
              <v-col v-for="action in quickActions" :key="action.title" cols="6" md="3">
                <v-btn :color="action.color" variant="elevated" block class="py-6">
                  <div class="text-center">
                    <v-icon :icon="action.icon" size="24" class="mb-1"></v-icon>
                    <br />
                    <span class="text-caption">{{ action.title }}</span>
                  </div>
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
          <v-card class="mb-6">
            <v-card-title class="d-flex align-center">
              <v-icon icon="mdi-alert-circle" class="mr-2"></v-icon>
              System Alerts
            </v-card-title>
            <v-card-text>
              <v-list>
                <v-list-item v-for="alert in systemAlerts" :key="alert.message" class="px-0">
                  <template v-slot:prepend>
                    <v-icon
                      :color="
                        alert.type === 'warning'
                          ? 'warning'
                          : alert.type === 'success'
                            ? 'success'
                            : 'info'
                      "
                      :icon="
                        alert.type === 'warning'
                          ? 'mdi-alert'
                          : alert.type === 'success'
                            ? 'mdi-check-circle'
                            : 'mdi-information'
                      "
                    ></v-icon>
                  </template>
                  <v-list-item-title class="text-body-2">{{ alert.message }}</v-list-item-title>
                  <v-list-item-subtitle>{{ alert.time }}</v-list-item-subtitle>
                </v-list-item>
              </v-list>
            </v-card-text>
          </v-card>

          <!-- Monthly Overview -->
          <v-card>
            <v-card-title>Monthly Overview</v-card-title>
            <v-card-text>
              <div class="mb-4">
                <h4 class="text-h6 font-weight-bold text-primary">Revenue Trend</h4>
                <p class="text-body-2 text-grey-darken-1">Last 6 months performance</p>
                <div
                  class="chart-placeholder bg-grey-lighten-4 rounded d-flex align-center justify-center"
                  style="height: 120px"
                >
                  <v-icon icon="mdi-chart-line" size="40" color="grey"></v-icon>
                </div>
              </div>

              <v-divider class="my-4"></v-divider>

              <div>
                <h4 class="text-h6 font-weight-bold text-success">Visitor Trend</h4>
                <p class="text-body-2 text-grey-darken-1">Monthly farm visitors</p>
                <div
                  class="chart-placeholder bg-grey-lighten-4 rounded d-flex align-center justify-center"
                  style="height: 120px"
                >
                  <v-icon icon="mdi-chart-bar" size="40" color="grey"></v-icon>
                </div>
              </div>
            </v-card-text>
          </v-card>
        </template>

        <!-- User: Recent Activities -->
        <template v-else>
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
              <v-btn color="primary" variant="text" block class="mt-4">
                View Activity History
              </v-btn>
            </v-card-text>
          </v-card>
        </template>
      </v-col>
    </v-row>

    <!-- User Quick Actions (bottom section) -->
    <v-row v-if="userType === 'user'" class="mt-6">
      <v-col cols="12">
        <v-card>
          <v-card-title>Quick Actions</v-card-title>
          <v-card-text>
            <v-row>
              <v-col v-for="action in quickActions" :key="action.title" cols="12" sm="6" md="3">
                <v-btn :color="action.color" variant="elevated" block size="large" class="py-8">
                  <div class="text-center">
                    <v-icon :icon="action.icon" size="32" class="mb-2"></v-icon>
                    <br />
                    {{ action.title }}
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
.chart-placeholder {
  border: 2px dashed #e0e0e0;
}
</style>
