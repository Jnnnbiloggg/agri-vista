<!-- NotificationMenu.vue -->
<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useNotifications } from '@/composables/useNotifications'

const router = useRouter()
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

const menu = ref(false)
const showUnreadOnly = ref(false)

onMounted(async () => {
  await fetchNotifications()
  setupRealtimeSubscription()
})

onUnmounted(() => {
  cleanupRealtimeSubscription()
})

const handleNotificationClick = async (notification: any) => {
  // Mark as read
  if (!notification.is_read) {
    await markAsRead(notification.id)
  }

  // Navigate to route if available
  if (notification.route) {
    menu.value = false
    router.push(notification.route)
  }
}

const handleMarkAllRead = async () => {
  await markAllAsRead()
}

const handleClearRead = async () => {
  await clearReadNotifications()
}

const displayedNotifications = computed(() => {
  if (showUnreadOnly.value) {
    return unreadNotifications.value
  }
  return notifications.value
})
</script>

<template>
  <v-menu v-model="menu" :close-on-content-click="false" location="bottom" width="400">
    <template v-slot:activator="{ props }">
      <v-btn icon variant="text" v-bind="props" class="notification-btn">
        <v-badge :content="unreadCount" :model-value="unreadCount > 0" color="error" overlap>
          <v-icon>mdi-bell</v-icon>
        </v-badge>
      </v-btn>
    </template>

    <v-card class="notification-card">
      <!-- Header -->
      <v-card-title class="d-flex align-center justify-space-between px-4 py-3">
        <div class="text-h6">Notifications</div>
        <div class="d-flex gap-2">
          <v-btn
            v-if="unreadCount > 0"
            variant="text"
            size="small"
            color="primary"
            @click="handleMarkAllRead"
          >
            Mark all read
          </v-btn>
          <v-btn
            v-if="readNotifications.length > 0"
            variant="text"
            size="small"
            color="error"
            @click="handleClearRead"
          >
            Clear read
          </v-btn>
        </div>
      </v-card-title>

      <v-divider></v-divider>

      <!-- Filter Toggle -->
      <div class="px-4 py-2">
        <v-btn-toggle
          v-model="showUnreadOnly"
          mandatory
          density="compact"
          color="primary"
          variant="outlined"
          divided
        >
          <v-btn :value="false" size="small">All</v-btn>
          <v-btn :value="true" size="small"> Unread ({{ unreadCount }}) </v-btn>
        </v-btn-toggle>
      </div>

      <v-divider></v-divider>

      <!-- Notifications List -->
      <v-card-text class="pa-0 notification-list">
        <div v-if="loading" class="text-center py-8">
          <v-progress-circular indeterminate color="primary"></v-progress-circular>
        </div>

        <div v-else-if="displayedNotifications.length === 0" class="text-center py-8 text-grey">
          <v-icon size="48" color="grey-lighten-1">mdi-bell-off</v-icon>
          <div class="mt-2">No notifications</div>
        </div>

        <v-list v-else lines="three" class="py-0">
          <template v-for="(notification, index) in displayedNotifications" :key="notification.id">
            <v-list-item
              :class="{ 'notification-unread': !notification.is_read }"
              class="notification-item"
              @click="handleNotificationClick(notification)"
            >
              <template v-slot:prepend>
                <v-avatar :color="getNotificationColor(notification.type)" size="40">
                  <v-icon color="white" :icon="getNotificationIcon(notification.type)"></v-icon>
                </v-avatar>
              </template>

              <v-list-item-title class="text-wrap font-weight-medium">
                {{ notification.title }}
              </v-list-item-title>

              <v-list-item-subtitle class="text-wrap mt-1">
                {{ notification.message }}
              </v-list-item-subtitle>

              <v-list-item-subtitle class="mt-1 text-caption">
                {{ timeAgo(notification.created_at) }}
              </v-list-item-subtitle>

              <template v-slot:append>
                <v-menu>
                  <template v-slot:activator="{ props }">
                    <v-btn icon variant="text" size="small" v-bind="props" @click.stop>
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

            <v-divider v-if="index < displayedNotifications.length - 1"></v-divider>
          </template>
        </v-list>
      </v-card-text>

      <!-- Footer -->
      <v-divider v-if="displayedNotifications.length > 0"></v-divider>
      <v-card-actions v-if="displayedNotifications.length > 5" class="justify-center">
        <v-btn variant="text" color="primary" size="small"> View All Notifications </v-btn>
      </v-card-actions>
    </v-card>
  </v-menu>
</template>

<style scoped>
.notification-card {
  max-height: 600px;
  display: flex;
  flex-direction: column;
}

.notification-list {
  overflow-y: auto;
  max-height: 500px;
}

.notification-list::-webkit-scrollbar {
  width: 6px;
}

.notification-list::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.notification-list::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.notification-list::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

.notification-item {
  cursor: pointer;
  transition: background-color 0.2s;
}

.notification-item:hover {
  background-color: rgba(0, 0, 0, 0.04);
}

.notification-unread {
  background-color: rgba(76, 175, 80, 0.08);
}

.notification-unread:hover {
  background-color: rgba(76, 175, 80, 0.12);
}

.notification-btn {
  position: relative;
}
</style>
