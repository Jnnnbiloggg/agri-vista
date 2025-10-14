<template>
  <v-app>
    <v-main class="role-selection-page">
      <!-- Background Image -->
      <div class="background-image"></div>

      <!-- Main Content Card -->
      <v-container class="fill-height d-flex align-center justify-center">
        <v-card class="role-card pa-8 pa-md-12" elevation="8" rounded="xl" max-width="900">
          <!-- Logo -->
          <div class="text-center mb-8">
            <div
              @click="goToLanding"
              class="pa-2 d-flex align-center justify-center mx-auto cursor-pointer"
            >
              <img src="/logo-cropped.png" alt="AgriVista" class="logo-image" />
            </div>
          </div>

          <!-- Heading -->
          <h1 class="text-center mb-12 font-weight-bold">Choose your role to get started</h1>

          <!-- Role Selection Cards -->
          <div class="role-options d-flex flex-row justify-center" style="gap: 24px">
            <!-- User Card -->
            <v-card
              class="role-option-card pa-6"
              elevation="2"
              rounded="lg"
              hover
              @click="selectRole('user')"
              style="flex: 0 1 auto; max-width: 350px; min-width: 280px"
            >
              <div class="d-flex flex-column align-center text-center">
                <v-avatar size="80" color="#E8F5E9" class="mb-4">
                  <v-icon size="48" color="#4CAF50">mdi-account-outline</v-icon>
                </v-avatar>

                <h2 class="text-h5 font-weight-bold mb-3">User</h2>

                <p class="text-body-1 text-medium-emphasis">
                  Explore and book Robrosa's Strawberry and Herb farm experiences
                </p>
              </div>
            </v-card>

            <!-- Admin Card -->
            <v-card
              class="role-option-card pa-6"
              elevation="2"
              rounded="lg"
              hover
              @click="selectRole('admin')"
              style="flex: 0 1 auto; max-width: 350px; min-width: 280px"
            >
              <div class="d-flex flex-column align-center text-center">
                <v-avatar size="80" color="#E8F5E9" class="mb-4">
                  <v-icon size="48" color="#4CAF50">mdi-account-cowboy-hat</v-icon>
                </v-avatar>

                <h2 class="text-h5 font-weight-bold mb-3">Admin</h2>

                <p class="text-body-1 text-medium-emphasis">
                  Manage Robrosa's Strawberry and Herb farm platform
                </p>
              </div>
            </v-card>
          </div>
        </v-card>
      </v-container>
    </v-main>
  </v-app>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const selectRole = (role) => {
  router.push({ name: 'account', query: { role } })
}

const goToLanding = () => {
  router.push('/')
}
</script>

<style scoped>
.role-selection-page {
  position: relative;
  min-height: 100vh;
  overflow: hidden;
}

.background-image {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image: url('/auth/register-bg.png');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  z-index: 0;
}

.role-card {
  position: relative;
  z-index: 1;
  background: rgba(255, 255, 255, 0.98) !important;
  backdrop-filter: blur(10px);
}

.logo-image {
  max-width: 120px;
  height: auto;
  object-fit: contain;
}

.logo-container {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  position: relative;
}

.cursor-pointer {
  cursor: pointer;
}

.role-option-card {
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid transparent;
  height: 100%;
}

.role-option-card:hover {
  border-color: #4caf50;
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(76, 175, 80, 0.2) !important;
}

.role-options {
  gap: 24px;
}
</style>
