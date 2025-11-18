<script setup lang="ts">
import { computed, inject, type Ref } from 'vue'
import HeaderActions from './HeaderActions.vue'
import DrawerToggle from '@/components/shared/DrawerToggle.vue'

interface Props {
  title: string
  subtitle: string
  showSearch?: boolean
  showNotifications?: boolean
  showSettings?: boolean
  searchPlaceholder?: string
  userType?: 'admin' | 'user'
}

// Inject drawer state from layout
const drawer = inject<Ref<boolean>>('drawer')

const props = withDefaults(defineProps<Props>(), {
  showSearch: true,
  showNotifications: true,
  showSettings: true,
  searchPlaceholder: 'Search...',
  userType: 'user',
})

const emit = defineEmits<{
  search: [query: string]
  clearSearch: []
  settingsClick: []
}>()

const handleSearch = (query: string) => {
  emit('search', query)
}

const handleClearSearch = () => {
  emit('clearSearch')
}

const handleSettingsClick = () => {
  emit('settingsClick')
}
</script>

<template>
  <div class="page-layout">
    <!-- Page Header -->
    <div class="page-header">
      <v-row class="mb-md">
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
                :show-notifications="showNotifications"
                :show-settings="showSettings"
                @search="handleSearch"
                @settings-click="handleSettingsClick"
              />
            </div>
            <!-- Title and Subtitle -->
            <div class="mb-4">
              <h1 class="text-h5 font-weight-bold text-primary mb-2">{{ title }}</h1>
              <p class="text-body-1 text-grey-darken-1">{{ subtitle }}</p>
            </div>
            <!-- Search Bar (Full Width) - Only show if search is enabled -->
            <HeaderActions
              v-if="showSearch"
              :search-placeholder="searchPlaceholder"
              :user-type="userType"
              :show-notifications="false"
              :show-settings="false"
              @search="handleSearch"
              @settings-click="handleSettingsClick"
            />
          </div>

          <!-- Desktop Layout -->
          <div class="d-none d-md-flex align-center justify-space-between">
            <div class="d-flex align-start">
              <DrawerToggle v-if="drawer !== undefined" v-model:drawer="drawer" />
              <div>
                <h1 class="page-title text-h4 font-weight-bold text-primary mb-2">{{ title }}</h1>
                <p class="page-subtitle text-h6 text-grey-darken-1">{{ subtitle }}</p>
              </div>
            </div>
            <HeaderActions
              :search-placeholder="searchPlaceholder"
              :user-type="userType"
              :show-search="showSearch"
              :show-notifications="showNotifications"
              :show-settings="showSettings"
              @search="handleSearch"
              @settings-click="handleSettingsClick"
            />
          </div>
        </v-col>
      </v-row>
    </div>

    <!-- Page Content -->
    <div class="page-content">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.page-layout {
  width: 100%;
  height: 100%;
}

.page-content {
  width: 100%;
}

@media (max-width: 960px) {
  .page-header :deep(.v-col) {
    padding-bottom: var(--spacing-sm);
  }
}
</style>
