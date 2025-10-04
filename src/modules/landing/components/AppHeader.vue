<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'

interface NavigationItem {
  title: string
  id: string
  route?: string
}

const props = defineProps<{
  navigationItems: NavigationItem[]
  currentSection?: string
  showSectionNavigation?: boolean
}>()

const emit = defineEmits<{
  navigate: [section: string]
}>()

const router = useRouter()

const handleNavigation = (item: NavigationItem) => {
  if (item.route) {
    // For router navigation
    router.push(item.route)
  } else if (item.id) {
    // For section scrolling
    emit('navigate', item.id)
  }
}
</script>

<template>
  <v-app-bar app fixed color="white" elevation="0" height="80">
    <v-container fluid class="d-flex align-center">
      <v-row align="center" no-gutters>
        <v-col cols="auto" class="d-flex align-center">
          <!-- Logo -->
          <v-btn
            text
            @click="handleNavigation({ title: 'Home', id: 'home' })"
            class="pa-2 d-flex align-center"
          >
            <img src="/logo-cropped.png" alt="AgriVista" class="logo-image" />
          </v-btn>
        </v-col>

        <v-spacer></v-spacer>

        <!-- Desktop Navigation -->
        <v-col cols="auto" class="d-none d-md-flex">
          <v-btn
            v-for="item in navigationItems"
            :key="item.id"
            text
            @click="handleNavigation(item)"
            class="mx-2 text-body-1"
            :class="{ 'text-primary font-weight-bold': currentSection === item.id }"
          >
            {{ item.title }}
          </v-btn>
        </v-col>

        <!-- Mobile Menu -->
        <v-col cols="auto" class="d-md-none">
          <v-menu>
            <template v-slot:activator="{ props }">
              <v-btn icon="mdi-menu" v-bind="props" variant="text"></v-btn>
            </template>
            <v-list>
              <v-list-item
                v-for="item in navigationItems"
                :key="item.id"
                @click="handleNavigation(item)"
              >
                <v-list-item-title>{{ item.title }}</v-list-item-title>
              </v-list-item>
            </v-list>
          </v-menu>
        </v-col>
      </v-row>
    </v-container>
  </v-app-bar>
</template>

<style scoped>
.v-app-bar {
  position: fixed !important;
  top: 0 !important;
  z-index: 1000 !important;
}

.logo-image {
  max-height: 50px;
  width: auto;
  height: auto;
  display: block;
}

.v-btn {
  min-height: auto !important;
}
</style>
