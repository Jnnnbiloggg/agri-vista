<script setup lang="ts" generic="T">
import { computed } from 'vue'

interface Props {
  headers: Array<{ title: string; key: string; sortable?: boolean }>
  items: T[]
  itemsPerPage?: number
  loading?: boolean
  totalItems?: number
  page?: number
  showFooter?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  itemsPerPage: 10,
  loading: false,
  showFooter: true,
})

const emit = defineEmits<{
  'update:page': [page: number]
}>()

const totalPages = computed(() => {
  if (!props.totalItems) return 1
  return Math.ceil(props.totalItems / props.itemsPerPage)
})

const handlePageChange = (page: number) => {
  emit('update:page', page)
}
</script>

<template>
  <div class="modern-data-table">
    <v-data-table
      :headers="headers"
      :items="items"
      :items-per-page="itemsPerPage"
      :loading="loading"
      class="modern-table elevation-0"
      :hide-default-footer="!showFooter"
    >
      <!-- Pass through all slots -->
      <template v-for="(_, name) in $slots" v-slot:[name]="slotData">
        <slot :name="name" v-bind="slotData || {}"></slot>
      </template>

      <!-- Custom footer with modern pagination -->
      <template v-if="showFooter && totalItems" #bottom>
        <div class="d-flex align-center justify-space-between px-lg py-md">
          <div class="text-caption text-grey-darken-1">
            Showing {{ ((page || 1) - 1) * itemsPerPage + 1 }} to
            {{ Math.min((page || 1) * itemsPerPage, totalItems) }} of {{ totalItems }} items
          </div>
          <v-pagination
            :model-value="page || 1"
            :length="totalPages"
            :total-visible="5"
            class="modern-pagination"
            @update:model-value="handlePageChange"
          ></v-pagination>
        </div>
      </template>
    </v-data-table>
  </div>
</template>

<style scoped>
.modern-data-table {
  border-radius: var(--radius-xl);
  overflow: hidden;
  border: 1px solid rgba(0, 0, 0, 0.06);
}
</style>
