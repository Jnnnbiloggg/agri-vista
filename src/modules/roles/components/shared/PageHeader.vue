<script setup lang="ts">
import { inject, type Ref } from 'vue'
import HeaderActions from './HeaderActions.vue'
import DrawerToggle from '@/components/shared/DrawerToggle.vue'

interface Props {
  title: string
  subtitle: string
  userType: 'admin' | 'user'
  searchPlaceholder?: string
  showSearch?: boolean
}

withDefaults(defineProps<Props>(), {
  searchPlaceholder: 'Search...',
  showSearch: true,
})

const emit = defineEmits<{
  search: [query: string]
  settingsClick: []
}>()

const drawer = inject<Ref<boolean>>('drawer')
</script>

<template>
  <v-row class="mb-6">
    <v-col cols="12">
      <!-- Mobile Layout -->
      <div class="d-md-none">
        <!-- Top Row: DrawerToggle + HeaderActions -->
        <div class="d-flex align-center justify-space-between mb-4">
          <DrawerToggle v-if="drawer !== undefined" v-model:drawer="drawer" />
          <HeaderActions
            :search-placeholder="searchPlaceholder"
            :user-type="userType"
            :show-search="false"
            @search="emit('search', $event)"
            @settings-click="emit('settingsClick')"
          />
        </div>
        <!-- Title and Subtitle -->
        <div class="mb-4">
          <h1 class="text-h5 font-weight-bold text-primary mb-2">{{ title }}</h1>
          <p class="text-body-1 text-grey-darken-1">{{ subtitle }}</p>
        </div>
        <!-- Search Bar (Full Width) -->
        <HeaderActions
          v-if="showSearch"
          :search-placeholder="searchPlaceholder"
          :user-type="userType"
          :show-notifications="false"
          :show-settings="false"
          @search="emit('search', $event)"
          @settings-click="emit('settingsClick')"
        />
      </div>

      <!-- Desktop Layout -->
      <div class="d-none d-md-flex align-center justify-space-between">
        <div class="d-flex align-start">
          <DrawerToggle v-if="drawer !== undefined" v-model:drawer="drawer" />
          <div>
            <h1 class="text-h4 font-weight-bold text-primary mb-2">{{ title }}</h1>
            <p class="text-h6 text-grey-darken-1">{{ subtitle }}</p>
          </div>
        </div>
        <HeaderActions
          :search-placeholder="searchPlaceholder"
          :user-type="userType"
          :show-search="showSearch"
          @search="emit('search', $event)"
          @settings-click="emit('settingsClick')"
        />
      </div>
    </v-col>
  </v-row>
</template>

<style scoped>
/* Component specific styles if needed */
</style>
