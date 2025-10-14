<script setup lang="ts">
import { ref } from 'vue'

interface NavigationItem {
  title: string
  id: string
  route?: string
}

const props = defineProps<{
  navigationItems: NavigationItem[]
}>()

const emit = defineEmits<{
  navigate: [section: string]
}>()

const email = ref('')

const handleNavigation = (item: NavigationItem) => {
  if (item.route) {
    // For router navigation in the future
    // router.push(item.route)
  } else if (item.id) {
    // For section scrolling
    emit('navigate', item.id)
  }
}

const handleSubscribe = () => {
  if (email.value) {
    // TODO: Implement newsletter subscription logic
    email.value = ''
  }
}
</script>

<template>
  <footer class="footer-section">
    <v-container class="footer-container">
      <v-row>
        <!-- Left Column - Logo -->
        <v-col cols="12" md="4" class="text-center">
          <img
            src="/logo-cropped.png"
            alt="AgriVista"
            class="mb-4"
            style="max-height: 80px; width: auto"
          />
          <p class="text-body-2 text-primary">
            Connecting you with Robrosa's Strawberry & Herbs Farm
          </p>
        </v-col>

        <!-- Center Column - Navigation Links -->
        <v-col cols="12" md="4" class="text-center">
          <h4 class="text-h6 font-weight-bold mb-4 text-primary">Our Links</h4>
          <div class="d-flex flex-column">
            <a
              v-for="item in navigationItems"
              :key="item.id"
              @click="handleNavigation(item)"
              class="nav-link mb-2"
            >
              {{ item.title }}
            </a>
          </div>
        </v-col>

        <!-- Right Column - Newsletter -->
        <v-col cols="12" md="4" class="text-center text-md-left">
          <h4 class="text-h6 font-weight-bold mb-4 text-primary">Newsletter</h4>
          <p class="text-body-2 text-primary mb-4 text-left">Receive news straight to your inbox</p>
          <div class="d-flex align-center" style="gap: 12px">
            <v-text-field
              v-model="email"
              placeholder="Enter your email"
              variant="outlined"
              density="compact"
              hide-details
              class="flex-grow-1"
              @keyup.enter="handleSubscribe"
            ></v-text-field>
            <v-btn
              color="primary"
              variant="elevated"
              rounded
              @click="handleSubscribe"
              class="flex-shrink-0"
            >
              Subscribe
            </v-btn>
          </div>
        </v-col>
      </v-row>

      <v-divider class="my-6"></v-divider>

      <v-row>
        <v-col cols="12" class="text-center">
          <p class="text-body-2 text-primary">
            © 2025 AgriVista. All rights reserved. | Robrosa's Strawberry & Herbs Farm
          </p>
        </v-col>
      </v-row>
    </v-container>
  </footer>
</template>

<style scoped>
.footer-section {
  background-color: #f5f5f5;
  padding: 60px 0 40px 0;
  margin-top: 0;
}

.footer-container {
  max-width: 1200px;
  padding: 0 24px;
}

.nav-link {
  color: #4caf50;
  text-decoration: none;
  cursor: pointer;
  transition: color 0.3s ease;
  padding: 4px 0;
}

.nav-link:hover {
  color: #388e3c;
  text-decoration: none;
}
</style>
