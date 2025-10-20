<!-- src/modules/auth/views/AuthPage.vue -->

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuth } from '@/composables/useAuth'

const router = useRouter()
const route = useRoute()
const { signIn, signUp, error: authError, loading: authLoading } = useAuth()

const selectedRole = ref<string>('')
const showPassword = ref(false)
const showConfirmPassword = ref(false)
const isRegisterMode = ref(false)

const form = ref({
  email: '',
  password: '',
  confirmPassword: '',
  fullName: '',
  rememberMe: false,
})

const errorMessage = ref<string>('')
const successMessage = ref<string>('')

onMounted(() => {
  if (route.query.role) {
    selectedRole.value = route.query.role as string
  }
  if (route.query.mode === 'register' && selectedRole.value !== 'admin') {
    isRegisterMode.value = true
  }
})

// Only allow registration for non-admin users
const canRegister = computed(() => selectedRole.value !== 'admin')

const toggleMode = () => {
  if (!canRegister.value) return

  isRegisterMode.value = !isRegisterMode.value
  errorMessage.value = ''
  successMessage.value = ''
  form.value = {
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    rememberMe: false,
  }
}

const handleSubmit = async () => {
  errorMessage.value = ''
  successMessage.value = ''

  // Validation
  if (!form.value.email || !form.value.password) {
    errorMessage.value = 'Please enter both email and password'
    return
  }

  if (isRegisterMode.value) {
    // Registration validation
    if (!form.value.fullName) {
      errorMessage.value = 'Please enter your full name'
      return
    }

    if (form.value.password.length < 6) {
      errorMessage.value = 'Password must be at least 6 characters long'
      return
    }

    if (form.value.password !== form.value.confirmPassword) {
      errorMessage.value = 'Passwords do not match'
      return
    }

    // Call signUp
    const result = await signUp(form.value.email, form.value.password, form.value.fullName)

    if (result?.success) {
      if (result.requiresConfirmation) {
        successMessage.value = result.message || 'Please check your email to confirm your account.'
        // Reset form
        form.value = {
          email: '',
          password: '',
          confirmPassword: '',
          fullName: '',
          rememberMe: false,
        }
        // Switch to login mode after short delay
        setTimeout(() => {
          isRegisterMode.value = false
        }, 3000)
      }
      // If no confirmation required, user is auto-redirected
    } else {
      errorMessage.value = authError.value || 'Registration failed. Please try again.'
    }
  } else {
    // Login
    const result = await signIn(form.value.email, form.value.password)

    if (!result?.success) {
      errorMessage.value = authError.value || 'Invalid email or password'
    }
  }
}

const goToLanding = () => {
  router.push('/')
}

const pageTitle = computed(() => {
  const prefix = isRegisterMode.value ? 'Create Account' : 'Welcome Back'
  if (selectedRole.value && !isRegisterMode.value) {
    return `${prefix}, ${selectedRole.value.charAt(0).toUpperCase() + selectedRole.value.slice(1)}`
  }
  return prefix
})

const pageSubtitle = computed(() => {
  if (isRegisterMode.value) {
    return 'Join to explore farm activities and fresh products'
  }
  return 'Sign in to access your AgriVista dashboard'
})
</script>

<template>
  <v-app>
    <v-main>
      <v-container fluid class="auth-container">
        <v-row align="center" justify="center" class="fill-height">
          <!-- Left Side - Branding (hidden on mobile) -->
          <v-col cols="12" lg="6" class="hidden-md-and-down branding-section">
            <div class="branding-content">
              <div class="mb-8 logo-wrapper" @click="goToLanding">
                <img src="/logo-cropped.png" alt="AgriVista" class="hero-logo" />
              </div>
              <h1 class="text-h3 font-weight-bold mb-4 text-white">AgriVista</h1>
              <p class="text-h6 text-white opacity-90 mb-8">
                Connect with Robrosa's Strawberry & Herbs Farm
              </p>
              <div class="features-list">
                <div v-for="feature in features" :key="feature.icon" class="feature-item">
                  <v-icon :icon="feature.icon" size="24" class="feature-icon"></v-icon>
                  <span class="text-white">{{ feature.text }}</span>
                </div>
              </div>
            </div>
          </v-col>

          <!-- Right Side - Auth Form -->
          <v-col cols="12" md="10" lg="6" class="form-section">
            <v-card class="auth-card" rounded="xl" elevation="0">
              <!-- Mobile Logo -->
              <div class="mobile-logo hidden-lg-and-up mb-6" @click="goToLanding">
                <img src="/logo-cropped.png" alt="AgriVista" class="mobile-logo-img" />
              </div>

              <!-- Header -->
              <div class="text-center mb-6">
                <h2 class="text-h4 font-weight-bold mb-2 gradient-text">
                  {{ pageTitle }}
                </h2>
                <p class="text-body-1 text-grey-darken-1">
                  {{ pageSubtitle }}
                </p>
              </div>

              <!-- Auth Form -->
              <v-form @submit.prevent="handleSubmit">
                <!-- Success Alert -->
                <v-alert
                  v-if="successMessage"
                  type="success"
                  variant="tonal"
                  class="mb-4"
                  closable
                  @click:close="successMessage = ''"
                >
                  {{ successMessage }}
                </v-alert>

                <!-- Error Alert -->
                <v-alert
                  v-if="errorMessage"
                  type="error"
                  variant="tonal"
                  class="mb-4"
                  closable
                  @click:close="errorMessage = ''"
                >
                  {{ errorMessage }}
                </v-alert>

                <!-- Full Name Field (Register Only) -->
                <v-expand-transition>
                  <v-text-field
                    v-if="isRegisterMode"
                    v-model="form.fullName"
                    label="Full Name"
                    variant="outlined"
                    prepend-inner-icon="mdi-account"
                    color="green-darken-2"
                    class="mb-3 modern-input"
                    required
                    density="comfortable"
                  ></v-text-field>
                </v-expand-transition>

                <!-- Email Field -->
                <v-text-field
                  v-model="form.email"
                  label="Email Address"
                  type="email"
                  variant="outlined"
                  prepend-inner-icon="mdi-email-outline"
                  color="green-darken-2"
                  class="mb-3 modern-input"
                  required
                  density="comfortable"
                ></v-text-field>

                <!-- Password Field -->
                <v-text-field
                  v-model="form.password"
                  label="Password"
                  :type="showPassword ? 'text' : 'password'"
                  variant="outlined"
                  prepend-inner-icon="mdi-lock-outline"
                  :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
                  @click:append-inner="showPassword = !showPassword"
                  color="green-darken-2"
                  class="mb-3 modern-input"
                  required
                  density="comfortable"
                  :hint="isRegisterMode ? 'Must be at least 6 characters' : ''"
                  :persistent-hint="isRegisterMode"
                ></v-text-field>

                <!-- Confirm Password (Register Only) -->
                <v-expand-transition>
                  <v-text-field
                    v-if="isRegisterMode"
                    v-model="form.confirmPassword"
                    label="Confirm Password"
                    :type="showConfirmPassword ? 'text' : 'password'"
                    variant="outlined"
                    prepend-inner-icon="mdi-lock-check-outline"
                    :append-inner-icon="showConfirmPassword ? 'mdi-eye-off' : 'mdi-eye'"
                    @click:append-inner="showConfirmPassword = !showConfirmPassword"
                    color="green-darken-2"
                    class="mb-3 modern-input"
                    required
                    density="comfortable"
                  ></v-text-field>
                </v-expand-transition>

                <!-- Remember Me / Forgot Password Row (Login Only) -->
                <v-expand-transition>
                  <v-row v-if="!isRegisterMode" class="mb-4" align="center">
                    <v-col cols="6">
                      <v-checkbox
                        v-model="form.rememberMe"
                        label="Remember me"
                        color="green-darken-2"
                        density="compact"
                        hide-details
                      ></v-checkbox>
                    </v-col>
                    <v-col cols="6" class="text-right">
                      <v-btn
                        variant="text"
                        color="green-darken-2"
                        size="small"
                        class="text-none font-weight-medium"
                      >
                        Forgot Password?
                      </v-btn>
                    </v-col>
                  </v-row>
                </v-expand-transition>

                <!-- Submit Button -->
                <v-btn
                  type="submit"
                  color="green-darken-2"
                  variant="flat"
                  block
                  size="x-large"
                  :loading="authLoading"
                  rounded="lg"
                  class="mb-4 submit-btn text-none font-weight-bold"
                  elevation="2"
                >
                  {{ isRegisterMode ? 'Create Account' : 'Sign In' }}
                </v-btn>

                <!-- Toggle Mode (Only if can register) -->
                <div v-if="canRegister" class="text-center">
                  <span class="text-grey-darken-1">
                    {{ isRegisterMode ? 'Already have an account?' : "Don't have an account?" }}
                  </span>
                  <v-btn
                    variant="text"
                    color="green-darken-2"
                    class="text-none font-weight-bold"
                    @click="toggleMode"
                  >
                    {{ isRegisterMode ? 'Sign In' : 'Sign Up' }}
                  </v-btn>
                </div>

                <!-- Admin Notice (If admin role selected) -->
                <div v-else class="text-center">
                  <v-chip color="blue-grey" variant="tonal" size="small">
                    <v-icon start icon="mdi-information"></v-icon>
                    Admin accounts are managed by administrators
                  </v-chip>
                </div>
              </v-form>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </v-main>
  </v-app>
</template>

<script lang="ts">
const features = [
  { icon: 'mdi-leaf', text: 'Farm Activities & Bookings' },
  { icon: 'mdi-package-variant-closed', text: 'Fresh Product Marketplace' },
  { icon: 'mdi-school-outline', text: 'Training & Workshops' },
  { icon: 'mdi-bullhorn', text: 'Announcements & Updates' },
]
</script>

<style scoped>
.auth-container {
  height: 100svh;
  background: linear-gradient(135deg, #f0f9f0 0%, #e8f5e9 50%, #c8e6c9 100%);
  position: relative;
  overflow: hidden;
  padding: 0 !important;
}

.auth-container::before {
  content: '';
  position: absolute;
  top: -50%;
  right: -20%;
  width: 100%;
  height: 100%;
  background: radial-gradient(circle, rgba(129, 199, 132, 0.15) 0%, transparent 70%);
  pointer-events: none;
}

.branding-section {
  background: linear-gradient(135deg, #2e7d32 0%, #43a047 100%);
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}

.branding-section::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
  opacity: 0.3;
}

.branding-content {
  position: relative;
  z-index: 1;
  padding: 0 60px;
  max-width: 600px;
}

.logo-wrapper {
  cursor: pointer;
  display: inline-block;
  transition: transform 0.3s ease;
}

.logo-wrapper:hover {
  transform: scale(1.05);
}

.hero-logo {
  height: 80px;
  width: auto;
  filter: brightness(0) invert(1);
  object-fit: contain;
}

.mobile-logo {
  text-align: center;
  cursor: pointer;
}

.mobile-logo-img {
  height: 60px;
  width: auto;
  object-fit: contain;
}

.features-list {
  display: grid;
  gap: 20px;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
}

.feature-item:hover {
  background: rgba(255, 255, 255, 0.15);
  transform: translateX(8px);
}

.feature-icon {
  color: white !important;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 8px;
  padding: 8px;
}

.form-section {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  height: 100vh;
  overflow-y: auto;
}

.auth-card {
  padding: 40px;
  max-width: 500px;
  width: 100%;
  background: rgba(255, 255, 255, 0.95) !important;
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1) !important;
  margin: auto;
}

.gradient-text {
  background: linear-gradient(135deg, #2e7d32 0%, #43a047 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.modern-input {
  transition: all 0.3s ease;
}

.modern-input:deep(.v-field) {
  border-radius: 12px;
  transition: all 0.3s ease;
}

.modern-input:deep(.v-field--focused) {
  box-shadow: 0 4px 12px rgba(46, 125, 50, 0.15);
}

.submit-btn {
  text-transform: none;
  letter-spacing: 0.5px;
  font-size: 16px;
  transition: all 0.3s ease;
}

.submit-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(46, 125, 50, 0.3) !important;
}

.divider-section {
  display: flex;
  align-items: center;
  gap: 16px;
}

.divider-text {
  color: #9e9e9e;
  font-size: 14px;
  font-weight: 500;
  white-space: nowrap;
}

.social-buttons .v-btn {
  border-width: 2px;
  font-weight: 500;
  transition: all 0.3s ease;
}

.social-buttons .v-btn:hover {
  background: rgba(0, 0, 0, 0.02);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

/* Responsive */
@media (max-width: 1264px) {
  .auth-card {
    padding: 32px 24px;
  }
}

@media (max-width: 600px) {
  .auth-card {
    padding: 24px 20px;
  }

  .form-section {
    padding: 20px 12px;
  }
}
</style>
