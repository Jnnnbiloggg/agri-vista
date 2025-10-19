<script setup lang="ts">
import { computed } from 'vue'
import HeaderActions from './HeaderActions.vue'

interface Props {
  title: string
  subtitle: string
  showSearch?: boolean
  showNotifications?: boolean
  showSettings?: boolean
  searchPlaceholder?: string
}

const props = withDefaults(defineProps<Props>(), {
  showSearch: true,
  showNotifications: true,
  showSettings: true,
  searchPlaceholder: 'Search...',
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
      <v-row align="center" justify="space-between" class="mb-md">
        <v-col cols="12" md="auto">
          <h1 class="page-title">{{ title }}</h1>
          <p class="page-subtitle">{{ subtitle }}</p>
        </v-col>
        <v-col cols="12" md="auto" class="d-flex justify-end">
          <HeaderActions
            :search-placeholder="searchPlaceholder"
            :show-search="showSearch"
            :show-notifications="showNotifications"
            :show-settings="showSettings"
            @search="handleSearch"
            @settings-click="handleSettingsClick"
          />
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
