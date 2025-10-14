<script setup lang="ts">
import { computed, ref } from 'vue'
import { useAuth } from '@/composables/useAuth'

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
}

const props = withDefaults(defineProps<Props>(), {
  searchPlaceholder: 'Search...',
  showSearch: true,
  showNotifications: true,
  showSettings: true,
})

const emit = defineEmits<{
  search: [query: string]
  settingsClick: []
}>()

const { signOut } = useAuth()

const searchQuery = ref('')
const showNotificationMenu = ref(false)
const showSettingsMenu = ref(false)

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

const handleSearch = () => {
  if (searchQuery.value.trim()) {
    emit('search', searchQuery.value)
  }
}

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
  emit('settingsClick')
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

const handleLogout = async () => {
  showSettingsMenu.value = false
  await signOut()
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
      @keyup.enter="handleSearch"
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
    <v-menu v-if="showSettings" v-model="showSettingsMenu" location="bottom end" offset="8">
      <template v-slot:activator="{ props: menuProps }">
        <v-btn icon variant="text" v-bind="menuProps">
          <v-icon icon="mdi-cog-outline"></v-icon>
        </v-btn>
      </template>

      <v-list min-width="200">
        <v-list-item
          prepend-icon="mdi-account-circle"
          title="Profile"
          @click="handleSettingsClick"
        ></v-list-item>
        <v-list-item
          prepend-icon="mdi-cog"
          title="Settings"
          @click="handleSettingsClick"
        ></v-list-item>
        <v-list-item
          prepend-icon="mdi-help-circle"
          title="Help & Support"
          @click="handleSettingsClick"
        ></v-list-item>
        <v-divider></v-divider>
        <v-list-item prepend-icon="mdi-logout" title="Logout" @click="handleLogout"></v-list-item>
      </v-list>
    </v-menu>
  </div>
</template>

<style scoped>
.header-search :deep(.v-field) {
  border-radius: 24px;
}

.header-search :deep(.v-field__input) {
  padding-top: 8px;
  padding-bottom: 8px;
}
</style>
