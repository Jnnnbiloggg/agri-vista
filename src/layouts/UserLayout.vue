<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import AppHeader from '@/components/shared/AppHeader.vue'

const router = useRouter()
const drawer = ref(true)

const userNavigationItems = [
  {
    title: 'Dashboard',
    id: 'user-dashboard',
    route: '/user/dashboard',
    icon: 'mdi-view-dashboard',
  },
  { title: 'My Profile', id: 'user-profile', route: '/user/profile', icon: 'mdi-account' },
  {
    title: 'Appointments',
    id: 'user-appointments',
    route: '/user/appointments',
    icon: 'mdi-calendar',
  },
  { title: 'Activities', id: 'user-activities', route: '/user/activities', icon: 'mdi-leaf' },
]

const handleLogout = () => {
  // TODO: Implement logout logic
  router.push('/')
}

const navigateTo = (route: string) => {
  router.push(route)
}
</script>

<template>
  <v-app>
    <!-- Navigation Drawer -->
    <v-navigation-drawer v-model="drawer" app color="primary" dark width="280">
      <!-- Header -->
      <v-list-item class="px-6 py-4">
        <v-list-item-title class="text-h5 font-weight-bold"> AgriVista </v-list-item-title>
        <v-list-item-subtitle class="text-caption"> User Dashboard </v-list-item-subtitle>
      </v-list-item>

      <v-divider></v-divider>

      <!-- Navigation Items -->
      <v-list density="compact" nav>
        <v-list-item
          v-for="item in userNavigationItems"
          :key="item.id"
          :to="item.route"
          :prepend-icon="item.icon"
          :title="item.title"
          rounded="xl"
          class="ma-2"
        ></v-list-item>
      </v-list>

      <template v-slot:append>
        <div class="pa-4">
          <v-btn
            block
            variant="outlined"
            color="white"
            @click="handleLogout"
            prepend-icon="mdi-logout"
          >
            Logout
          </v-btn>
        </div>
      </template>
    </v-navigation-drawer>

    <!-- App Bar -->
    <v-app-bar app color="white" elevation="1" height="64">
      <v-app-bar-nav-icon @click="drawer = !drawer"></v-app-bar-nav-icon>

      <v-app-bar-title class="text-h6 font-weight-medium"> User Dashboard </v-app-bar-title>

      <v-spacer></v-spacer>

      <!-- User Menu -->
      <v-menu>
        <template v-slot:activator="{ props }">
          <v-btn icon v-bind="props">
            <v-avatar size="36" color="primary">
              <v-icon icon="mdi-account"></v-icon>
            </v-avatar>
          </v-btn>
        </template>
        <v-list>
          <v-list-item
            title="Profile"
            prepend-icon="mdi-account"
            @click="navigateTo('/user/profile')"
          ></v-list-item>
          <v-list-item title="Settings" prepend-icon="mdi-cog"></v-list-item>
          <v-divider></v-divider>
          <v-list-item title="Logout" prepend-icon="mdi-logout" @click="handleLogout"></v-list-item>
        </v-list>
      </v-menu>
    </v-app-bar>

    <!-- Main Content -->
    <v-main>
      <v-container fluid class="pa-6">
        <router-view />
      </v-container>
    </v-main>
  </v-app>
</template>

<style scoped>
/* Layout specific styles */
</style>
