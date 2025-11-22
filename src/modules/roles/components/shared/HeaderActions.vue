<script setup lang="ts">
import { computed, ref, watch, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useNotifications } from '@/composables/useNotifications'

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

// Use the notification composable
const {
  notifications,
  unreadCount,
  loading,
  unreadNotifications,
  readNotifications,
  fetchNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearReadNotifications,
  setupRealtimeSubscription,
  cleanupRealtimeSubscription,
  getNotificationIcon,
  getNotificationColor,
  timeAgo,
} = useNotifications()

onMounted(async () => {
  await fetchNotifications()
  setupRealtimeSubscription()
})

onUnmounted(() => {
  cleanupRealtimeSubscription()
})

// Debounced search watcher
watch(searchQuery, (newValue) => {
  if (debounceTimer) {
    clearTimeout(debounceTimer)
  }

  debounceTimer = setTimeout(() => {
    emit('search', newValue?.trim() || '')
  }, 300) // 300ms debounce delay
})

const handleNotificationClick = async (notification: any) => {
  // Mark as read
  if (!notification.is_read) {
    await markAsRead(notification.id)
  }

  // Navigate to route if available
  if (notification.route) {
    showNotificationMenu.value = false
    router.push(notification.route)
  }
}

const handleSettingsClick = () => {
  router.push(`/${props.userType}/settings`)
}

const displayedNotifications = computed(() => notifications.value)
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
            v-if="unreadCount > 0"
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
          v-if="displayedNotifications.length > 0"
          class="pa-0"
          max-height="400"
          style="overflow-y: auto"
        >
          <v-list-item
            v-for="notification in displayedNotifications"
            :key="notification.id"
            :class="{ 'notification-unread': !notification.is_read }"
            @click="handleNotificationClick(notification)"
          >
            <template v-slot:prepend>
              <v-avatar :color="getNotificationColor(notification.type)" size="40">
                <v-icon color="white" :icon="getNotificationIcon(notification.type)"></v-icon>
              </v-avatar>
            </template>

            <v-list-item-title class="font-weight-medium mb-1 text-wrap">
              {{ notification.title }}
            </v-list-item-title>
            <v-list-item-subtitle class="text-wrap mb-1">
              {{ notification.message }}
            </v-list-item-subtitle>
            <v-list-item-subtitle class="text-caption">
              {{ timeAgo(notification.created_at) }}
            </v-list-item-subtitle>

            <template v-slot:append>
              <v-menu>
                <template v-slot:activator="{ props: menuItemProps }">
                  <v-btn icon variant="text" size="small" v-bind="menuItemProps" @click.stop>
                    <v-icon size="20">mdi-dots-vertical</v-icon>
                  </v-btn>
                </template>

                <v-list density="compact">
                  <v-list-item v-if="!notification.is_read" @click="markAsRead(notification.id)">
                    <v-list-item-title>
                      <v-icon size="16" class="mr-2">mdi-check</v-icon>
                      Mark as read
                    </v-list-item-title>
                  </v-list-item>

                  <v-list-item @click="deleteNotification(notification.id)">
                    <v-list-item-title class="text-error">
                      <v-icon size="16" class="mr-2">mdi-delete</v-icon>
                      Delete
                    </v-list-item-title>
                  </v-list-item>
                </v-list>
              </v-menu>
            </template>
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

        <v-divider v-if="displayedNotifications.length > 0"></v-divider>

        <v-card-actions v-if="displayedNotifications.length > 0">
          <v-btn variant="text" color="error" size="small" block @click="clearReadNotifications">
            Clear read
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

.notification-unread {
  background-color: rgba(76, 175, 80, 0.08) !important;
}

.notification-unread:hover {
  background-color: rgba(76, 175, 80, 0.12) !important;
}
</style>
