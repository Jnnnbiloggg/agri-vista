<script setup lang="ts">
interface Props {
  status: 'pending' | 'confirmed' | 'approved' | 'cancelled' | 'rejected' | 'completed'
}

const props = defineProps<Props>()

const getStatusClass = (status: string) => {
  switch (status) {
    case 'pending':
      return 'status-pending'
    case 'confirmed':
    case 'approved':
      return 'status-confirmed'
    case 'cancelled':
    case 'rejected':
      return 'status-cancelled'
    case 'completed':
      return 'status-completed'
    default:
      return ''
  }
}
</script>

<template>
  <span class="status-badge" :class="getStatusClass(status)">
    {{ status }}
  </span>
</template>

<style scoped>
.status-badge {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: 6px 14px;
  border-radius: var(--radius-full);
  font-size: var(--font-size-sm);
  font-weight: 600;
  text-transform: capitalize;
  white-space: nowrap;
}

.status-badge::before {
  content: '';
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: currentColor;
}

.status-pending {
  background-color: #fff3cd;
  color: #856404;
}

.status-confirmed {
  background-color: #d1f2d9;
  color: #155724;
}

.status-cancelled {
  background-color: #f8d7da;
  color: #721c24;
}

.status-completed {
  background-color: #d1ecf1;
  color: #0c5460;
}
</style>
