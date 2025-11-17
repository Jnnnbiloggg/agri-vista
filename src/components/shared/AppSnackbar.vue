<!-- src/components/shared/AppSnackbar.vue -->
<script setup lang="ts">
import type { SnackbarColor } from '@/composables/useSnackbar'

interface Props {
  modelValue: boolean
  message: string
  color?: SnackbarColor
  timeout?: number
  location?: 'top' | 'bottom' | 'left' | 'right'
}

const props = withDefaults(defineProps<Props>(), {
  color: 'success',
  timeout: 3000,
  location: 'top',
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const getIcon = (color: SnackbarColor) => {
  switch (color) {
    case 'success':
      return 'mdi-check-circle'
    case 'error':
      return 'mdi-alert-circle'
    case 'warning':
      return 'mdi-alert'
    case 'info':
      return 'mdi-information'
    default:
      return 'mdi-information'
  }
}
</script>

<template>
  <v-snackbar
    :model-value="modelValue"
    :color="color"
    :timeout="timeout"
    :location="location"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div class="d-flex align-center ga-2">
      <v-icon :icon="getIcon(color)" size="small" />
      <span>{{ message }}</span>
    </div>
    <template v-slot:actions>
      <v-btn
        variant="text"
        icon="mdi-close"
        size="small"
        @click="emit('update:modelValue', false)"
      ></v-btn>
    </template>
  </v-snackbar>
</template>
