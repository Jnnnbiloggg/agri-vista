<script setup lang="ts">
interface Props {
  drawer: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:drawer': [value: boolean]
}>()

const toggleDrawer = () => {
  emit('update:drawer', !props.drawer)
}
</script>

<template>
  <v-btn
    icon="mdi-menu"
    variant="text"
    color="grey-darken-1"
    @click="toggleDrawer"
    class="drawer-toggle-btn"
  >
    <v-icon>mdi-menu</v-icon>
  </v-btn>
</template>

<style scoped>
.drawer-toggle-btn {
  margin-left: -10px;
}
</style>
