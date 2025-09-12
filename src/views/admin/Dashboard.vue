<script setup lang="ts">
import { ref } from 'vue'

// Sample data - replace with real API calls
const dashboardStats = ref([
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

const systemAlerts = ref([
  { type: 'warning', message: 'Low strawberry stock - consider restocking', time: '2 hours ago' },
  { type: 'info', message: 'New user registration: Maria Garcia', time: '4 hours ago' },
  { type: 'success', message: 'Monthly backup completed successfully', time: '6 hours ago' },
])

const monthlyStats = ref({
  revenue: [12000, 19000, 15000, 25000, 30000, 45280],
  visitors: [45, 52, 38, 67, 89, 124],
  labels: ['Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan'],
})
</script>

<template>
  <div>
    <!-- Page Header -->
    <v-row class="mb-6">
      <v-col cols="12">
        <h1 class="text-h4 font-weight-bold text-primary mb-2">Admin Dashboard</h1>
        <p class="text-h6 text-grey-darken-1">Manage Robrosa's Farm operations and analytics</p>
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
              <v-chip size="x-small" :color="stat.color" variant="outlined">
                {{ stat.change }}
              </v-chip>
            </v-col>
          </v-row>
        </v-card>
      </v-col>
    </v-row>

    <!-- Main Content Grid -->
    <v-row>
      <!-- Recent Appointments -->
      <v-col cols="12" lg="8">
        <v-card class="mb-6">
          <v-card-title class="d-flex align-center justify-space-between">
            <span class="d-flex align-center">
              <v-icon icon="mdi-calendar-multiple" class="mr-2"></v-icon>
              Recent Appointments
            </span>
            <v-btn color="primary" variant="text" size="small"> View All </v-btn>
          </v-card-title>
          <v-card-text>
            <v-data-table
              :headers="[
                { title: 'User', key: 'user' },
                { title: 'Activity', key: 'activity' },
                { title: 'Date', key: 'date' },
                { title: 'Status', key: 'status' },
                { title: 'Actions', key: 'actions', sortable: false },
              ]"
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
          </v-card-text>
        </v-card>

        <!-- Quick Actions -->
        <v-card>
          <v-card-title>Quick Actions</v-card-title>
          <v-card-text>
            <v-row>
              <v-col cols="6" md="3">
                <v-btn color="primary" variant="elevated" block class="py-6">
                  <div class="text-center">
                    <v-icon icon="mdi-account-plus" size="24" class="mb-1"></v-icon>
                    <br />
                    <span class="text-caption">Add User</span>
                  </div>
                </v-btn>
              </v-col>
              <v-col cols="6" md="3">
                <v-btn color="success" variant="elevated" block class="py-6">
                  <div class="text-center">
                    <v-icon icon="mdi-bullhorn" size="24" class="mb-1"></v-icon>
                    <br />
                    <span class="text-caption">New Announcement</span>
                  </div>
                </v-btn>
              </v-col>
              <v-col cols="6" md="3">
                <v-btn color="info" variant="elevated" block class="py-6">
                  <div class="text-center">
                    <v-icon icon="mdi-leaf" size="24" class="mb-1"></v-icon>
                    <br />
                    <span class="text-caption">Add Activity</span>
                  </div>
                </v-btn>
              </v-col>
              <v-col cols="6" md="3">
                <v-btn color="warning" variant="elevated" block class="py-6">
                  <div class="text-center">
                    <v-icon icon="mdi-chart-line" size="24" class="mb-1"></v-icon>
                    <br />
                    <span class="text-caption">View Reports</span>
                  </div>
                </v-btn>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- System Alerts & Overview -->
      <v-col cols="12" lg="4">
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
              <!-- Placeholder for chart - you can integrate Chart.js or similar -->
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
              <!-- Placeholder for chart -->
              <div
                class="chart-placeholder bg-grey-lighten-4 rounded d-flex align-center justify-center"
                style="height: 120px"
              >
                <v-icon icon="mdi-chart-bar" size="40" color="grey"></v-icon>
              </div>
            </div>
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
