<!-- src/components/shared/DeleteConfirmDialog.vue -->
<script setup lang="ts">
interface Props {
  modelValue: boolean
  isDeleting?: boolean
  title?: string
  message?: string
  itemName?: string
  confirmText?: string
  cancelText?: string
}

const props = withDefaults(defineProps<Props>(), {
  isDeleting: false,
  title: 'Confirm Delete',
  message: 'Are you sure you want to delete',
  confirmText: 'Delete',
  cancelText: 'Cancel',
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  confirm: []
  cancel: []
}>()

const handleConfirm = () => {
  emit('confirm')
}

const handleCancel = () => {
  emit('update:modelValue', false)
  emit('cancel')
}
</script>

<template>
  <v-dialog :model-value="modelValue" max-width="500" persistent>
    <v-card rounded="lg">
      <v-card-title class="text-h5 d-flex align-center ga-2 bg-error text-white pa-4">
        <v-icon icon="mdi-alert-circle" size="28" />
        {{ title }}
      </v-card-title>

      <v-card-text class="pa-6">
        <p class="text-body-1">
          {{ message }}
          <strong v-if="itemName">"{{ itemName }}"</strong>?
        </p>
        <p class="text-body-2 text-medium-emphasis mt-2">This action cannot be undone.</p>
      </v-card-text>

      <v-card-actions class="pa-4 pt-0">
        <v-spacer />
        <v-btn
          variant="outlined"
          color="grey-darken-1"
          :disabled="isDeleting"
          @click="handleCancel"
        >
          {{ cancelText }}
        </v-btn>
        <v-btn
          variant="flat"
          color="error"
          :loading="isDeleting"
          :disabled="isDeleting"
          @click="handleConfirm"
        >
          {{ confirmText }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style scoped>
.v-card-title {
  border-radius: var(--radius-lg) var(--radius-lg) 0 0;
}
</style>
