<!-- AdminLayout.vue -->
<script setup lang="ts">
import { ref, provide } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()
const drawer = ref(true)

// Provide drawer state to child components
provide('drawer', drawer)

const adminNavigationItems = [
  {
    title: 'Home',
    id: 'admin-dashboard',
    route: '/admin/dashboard',
    icon: 'mdi-home',
  },
  {
    title: 'Announcements',
    id: 'admin-announcements',
    route: '/admin/announcements',
    icon: 'mdi-bullhorn',
  },
  {
    title: 'Activities / Bookings / Appointments',
    id: 'admin-activities',
    route: '/admin/activities',
    icon: 'mdi-calendar-multiple',
  },
  {
    title: 'Products',
    id: 'admin-products',
    route: '/admin/products',
    icon: 'mdi-package-variant',
  },
  {
    title: 'Trainings and Workshop',
    id: 'admin-trainings',
    route: '/admin/trainings',
    icon: 'mdi-school',
  },
  {
    title: 'Feedback / Testimonial Form',
    id: 'admin-feedback',
    route: '/admin/feedback',
    icon: 'mdi-comment-text',
  },
]

const handleLogout = () => {
  router.push('/')
}
</script>

<template>
  <v-app>
    <!-- Navigation Drawer -->
    <v-navigation-drawer v-model="drawer" app color="white" width="280" :elevation="2">
      <!-- Header -->
      <v-list-item class="px-6 py-4">
        <v-list-item-title class="text-h5 font-weight-bold text-primary">
          AgriVista
        </v-list-item-title>
        <v-list-item-subtitle class="text-caption text-grey-darken-1">
          Admin Dashboard
        </v-list-item-subtitle>
      </v-list-item>

      <v-divider></v-divider>

      <!-- Navigation Items -->
      <v-list density="compact" nav class="px-3 py-2">
        <v-list-item
          v-for="item in adminNavigationItems"
          :key="item.id"
          :to="item.route"
          rounded="xl"
          class="my-1 nav-item"
          :class="{ 'nav-item-active': $route.path === item.route }"
        >
          <template v-slot:prepend>
            <div class="nav-icon-container">
              <v-icon :icon="item.icon" size="20"></v-icon>
            </div>
          </template>
          <v-list-item-title class="nav-title">{{ item.title }}</v-list-item-title>
        </v-list-item>
      </v-list>

      <template v-slot:append>
        <div class="pa-4">
          <div class="d-flex align-center justify-space-between">
            <!-- User Info Section -->
            <div class="d-flex align-center">
              <v-avatar size="32" color="primary" class="mr-3">
                <v-icon icon="mdi-shield-account" color="white"></v-icon>
              </v-avatar>
              <div>
                <div class="text-subtitle-2 text-primary">{{ authStore.userEmail }}</div>
                <div class="text-caption text-grey-darken-1">
                  {{ authStore.userProfile?.userType === 'admin' ? 'Admin' : 'User' }}
                </div>
              </div>
            </div>

            <!-- Logout Button -->
            <v-btn icon variant="text" color="primary" @click="handleLogout" size="small">
              <v-icon>mdi-logout</v-icon>
            </v-btn>
          </div>
        </div>
      </template>
    </v-navigation-drawer>

    <!-- Main Content -->
    <v-main>
      <v-container fluid class="pa-6">
        <router-view />
      </v-container>
    </v-main>
  </v-app>
</template>

<style scoped>
/* Navigation drawer fixed positioning */
:deep(.v-navigation-drawer) {
  position: fixed !important;
  top: 0 !important;
  bottom: 0 !important;
  z-index: 1000;
}

/* Main content scrolling */
:deep(.v-main) {
  overflow: hidden;
}

:deep(.v-main .v-container) {
  height: calc(100vh - 48px);
  overflow-y: auto;
  overflow-x: hidden;
}

/* Custom scrollbar */
:deep(.v-container)::-webkit-scrollbar {
  width: 6px;
}

:deep(.v-container)::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

:deep(.v-container)::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

:deep(.v-container)::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

/* Navigation item base styling */
.nav-item {
  padding: 8px 12px !important;
  margin-bottom: 4px !important;
  transition: all 0.3s ease !important;
  cursor: pointer;
  position: relative;
}

.nav-item :deep(.v-list-item__prepend) {
  margin-right: 12px !important;
}

.nav-item :deep(.v-list-item__content) {
  padding: 0 !important;
}

/* Icon container */
.nav-icon-container {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  background-color: transparent;
}

/* Navigation title */
.nav-title {
  font-size: 14px;
  font-weight: 500;
  color: #666666;
  transition: all 0.3s ease;
}

/* Inactive state */
.nav-item .nav-icon-container {
  background-color: #f5f5f5;
}

.nav-item .nav-icon-container :deep(.v-icon) {
  color: #666666;
}

/* Hover state */
.nav-item:hover .nav-icon-container {
  background-color: #e8f5e9;
}

.nav-item:hover .nav-title {
  color: #2e7d32;
}

.nav-item:hover .nav-icon-container :deep(.v-icon) {
  color: #2e7d32;
}

/* Active state */
.nav-item-active {
  background-color: #4caf50 !important;
  border-radius: 50px !important;
}

.nav-item-active .nav-icon-container {
  background-color: #2e7d32 !important;
}

.nav-item-active .nav-icon-container :deep(.v-icon) {
  color: white !important;
}

.nav-item-active .nav-title {
  color: white !important;
  font-weight: 600;
}

/* Active hover state */
.nav-item-active:hover {
  background-color: #45a049 !important;
}

.nav-item-active:hover .nav-icon-container {
  background-color: #1b5e20 !important;
}
</style>
