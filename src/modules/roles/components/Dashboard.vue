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
