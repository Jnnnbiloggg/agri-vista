<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'

interface Notification {
  id: number
  title: string
  message: string
  time: string
  read: boolean
  type: 'info' | 'success' | 'warning' | 'error'
}

interface Props {
  searchPlaceholder?: string
  showSearch?: boolean
  showNotifications?: boolean
  showSettings?: boolean
  userType?: 'admin' | 'user'
}

const props = withDefaults(defineProps<Props>(), {
  searchPlaceholder: 'Search...',
  showSearch: true,
  showNotifications: true,
  showSettings: true,
  userType: 'user',
})

const emit = defineEmits<{
  search: [query: string]
  settingsClick: []
}>()

const router = useRouter()

const searchQuery = ref('')
const showNotificationMenu = ref(false)
let debounceTimer: ReturnType<typeof setTimeout> | null = null

// Debounced search watcher
watch(searchQuery, (newValue) => {
  if (debounceTimer) {
    clearTimeout(debounceTimer)
  }

  debounceTimer = setTimeout(() => {
    emit('search', newValue?.trim() || '')
  }, 300) // 300ms debounce delay
})

// Sample notifications data
const notifications = ref<Notification[]>([
  {
    id: 1,
    title: 'New Booking',
    message: 'Maria Santos booked Strawberry Picking',
    time: '5 min ago',
    read: false,
    type: 'success',
  },
  {
    id: 2,
    title: 'Appointment Request',
    message: 'John Doe requested a farm tour',
    time: '1 hour ago',
    read: false,
    type: 'info',
  },
  {
    id: 3,
    title: 'Activity Updated',
    message: 'Organic Workshop capacity increased',
    time: '3 hours ago',
    read: true,
    type: 'info',
  },
])

const unreadCount = computed(() => notifications.value.filter((n) => !n.read).length)

const markAsRead = (id: number) => {
  const notification = notifications.value.find((n) => n.id === id)
  if (notification) {
    notification.read = true
  }
}

const markAllAsRead = () => {
  notifications.value.forEach((n) => (n.read = true))
}

const clearNotifications = () => {
  notifications.value = []
}

const handleSettingsClick = () => {
  router.push(`/${props.userType}/settings`)
}

const getNotificationIcon = (type: Notification['type']) => {
  switch (type) {
    case 'success':
      return 'mdi-check-circle'
    case 'warning':
      return 'mdi-alert'
    case 'error':
      return 'mdi-alert-circle'
    default:
      return 'mdi-information'
  }
}

const getNotificationColor = (type: Notification['type']) => {
  switch (type) {
    case 'success':
      return 'success'
    case 'warning':
      return 'warning'
    case 'error':
      return 'error'
    default:
      return 'info'
  }
}
</script>

<template>
  <div class="d-flex align-center ga-3">
    <!-- Search Bar -->
    <v-text-field
      v-if="showSearch"
      v-model="searchQuery"
      :placeholder="searchPlaceholder"
      prepend-inner-icon="mdi-magnify"
      variant="outlined"
      density="compact"
      hide-details
      single-line
      clearable
      class="header-search"
      style="min-width: 250px; width: 250px"
      @click:clear="searchQuery = ''"
    ></v-text-field>

    <!-- Notifications -->
    <v-menu
      v-if="showNotifications"
      v-model="showNotificationMenu"
      :close-on-content-click="false"
      location="bottom end"
      offset="8"
    >
      <template v-slot:activator="{ props: menuProps }">
        <v-btn icon variant="text" v-bind="menuProps">
          <v-badge :content="unreadCount" :model-value="unreadCount > 0" color="error" overlap>
            <v-icon icon="mdi-bell-outline"></v-icon>
          </v-badge>
        </v-btn>
      </template>

      <v-card min-width="350" max-width="400">
        <v-card-title class="d-flex align-center justify-space-between">
          <span>Notifications</span>
          <v-btn
            v-if="notifications.length > 0"
            variant="text"
            size="small"
            color="primary"
            @click="markAllAsRead"
          >
            Mark all read
          </v-btn>
        </v-card-title>

        <v-divider></v-divider>

        <v-list
          v-if="notifications.length > 0"
          class="pa-0"
          max-height="400"
          style="overflow-y: auto"
        >
          <v-list-item
            v-for="notification in notifications"
            :key="notification.id"
            :class="{ 'bg-blue-lighten-5': !notification.read }"
            @click="markAsRead(notification.id)"
          >
            <template v-slot:prepend>
              <v-avatar :color="getNotificationColor(notification.type)" variant="tonal">
                <v-icon :icon="getNotificationIcon(notification.type)"></v-icon>
              </v-avatar>
            </template>

            <v-list-item-title class="font-weight-medium mb-1">
              {{ notification.title }}
            </v-list-item-title>
            <v-list-item-subtitle class="text-wrap mb-1">
              {{ notification.message }}
            </v-list-item-subtitle>
            <v-list-item-subtitle class="text-caption">
              {{ notification.time }}
            </v-list-item-subtitle>
          </v-list-item>
        </v-list>

        <div v-else class="pa-8 text-center">
          <v-icon
            icon="mdi-bell-off-outline"
            size="48"
            color="grey-lighten-1"
            class="mb-2"
          ></v-icon>
          <p class="text-grey-darken-1">No notifications</p>
        </div>

        <v-divider v-if="notifications.length > 0"></v-divider>

        <v-card-actions v-if="notifications.length > 0">
          <v-btn variant="text" color="error" size="small" block @click="clearNotifications">
            Clear all
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-menu>

    <!-- Settings -->
    <v-btn v-if="showSettings" icon variant="text" @click="handleSettingsClick">
      <v-icon icon="mdi-cog-outline"></v-icon>
    </v-btn>
  </div>
</template>

<style scoped>
.header-search {
  min-width: 280px;
}

.header-search :deep(.v-field) {
  border-radius: var(--radius-full) !important;
  border: 1px solid rgba(0, 0, 0, 0.12);
  transition: all var(--transition-fast);
}

.header-search :deep(.v-field:hover) {
  border-color: rgba(76, 175, 80, 0.3);
}

.header-search :deep(.v-field--focused) {
  border-color: rgba(76, 175, 80, 0.5) !important;
}

.header-search :deep(.v-field__input) {
  padding-top: var(--spacing-sm);
  padding-bottom: var(--spacing-sm);
}

/* Notification list items */
:deep(.v-list-item) {
  border-radius: var(--radius-md);
  margin: var(--spacing-xs) var(--spacing-sm);
  transition: all var(--transition-fast);
}

:deep(.v-list-item:hover) {
  background-color: rgba(76, 175, 80, 0.04) !important;
}

:deep(.bg-blue-lighten-5) {
  background-color: rgba(33, 150, 243, 0.08) !important;
}
</style>
