<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const form = ref({
  email: '',
  password: '',
  rememberMe: false,
})

const isLoading = ref(false)

const handleLogin = async () => {
  isLoading.value = true

  // TODO: Implement actual login logic
  console.log('Login attempt:', form.value)

  // Simulate API call
  setTimeout(() => {
    isLoading.value = false
    // For demo purposes, redirect based on email
    if (form.value.email.includes('admin')) {
      router.push('/admin/dashboard')
    } else {
      router.push('/user/dashboard')
    }
  }, 1500)
}

const goToLanding = () => {
  router.push('/')
}
</script>

<template>
  <v-app>
    <v-main>
      <v-container fluid class="login-container">
        <v-row align="center" justify="center" class="fill-height">
          <v-col cols="12" sm="8" md="6" lg="4">
            <v-card class="pa-8" rounded="lg" elevation="8">
              <!-- Header -->
              <v-card-item class="text-center pb-6">
                <v-btn text @click="goToLanding" class="text-h4 font-weight-bold text-primary mb-4">
                  AgriVista
                </v-btn>
                <h2 class="text-h5 font-weight-medium mb-2">Welcome Back</h2>
                <p class="text-body-2 text-grey-darken-1">
                  Sign in to access your farm management dashboard
                </p>
              </v-card-item>

              <!-- Login Form -->
              <v-form @submit.prevent="handleLogin">
                <v-text-field
                  v-model="form.email"
                  label="Email Address"
                  type="email"
                  variant="outlined"
                  prepend-inner-icon="mdi-email"
                  class="mb-4"
                  required
                ></v-text-field>

                <v-text-field
                  v-model="form.password"
                  label="Password"
                  type="password"
                  variant="outlined"
                  prepend-inner-icon="mdi-lock"
                  class="mb-4"
                  required
                ></v-text-field>

                <v-row class="mb-4">
                  <v-col cols="6">
                    <v-checkbox
                      v-model="form.rememberMe"
                      label="Remember me"
                      density="compact"
                    ></v-checkbox>
                  </v-col>
                  <v-col cols="6" class="text-right">
                    <v-btn text color="primary" size="small"> Forgot Password? </v-btn>
                  </v-col>
                </v-row>

                <v-btn
                  type="submit"
                  color="primary"
                  variant="elevated"
                  block
                  size="large"
                  :loading="isLoading"
                  rounded="lg"
                  class="mb-4"
                >
                  Sign In
                </v-btn>
              </v-form>

              <!-- Demo Credentials -->
              <v-divider class="my-6"></v-divider>

              <v-card variant="tonal" color="info" class="pa-4" rounded="lg">
                <h3 class="text-subtitle-1 font-weight-bold mb-2">Demo Credentials:</h3>
                <p class="text-body-2 mb-1"><strong>Admin:</strong> admin@agrivista.com</p>
                <p class="text-body-2 mb-1"><strong>User:</strong> user@agrivista.com</p>
                <p class="text-body-2"><strong>Password:</strong> password123</p>
              </v-card>

              <!-- Back to Landing -->
              <v-card-actions class="justify-center pt-6">
                <v-btn text color="primary" @click="goToLanding" prepend-icon="mdi-arrow-left">
                  Back to Homepage
                </v-btn>
              </v-card-actions>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </v-main>
  </v-app>
</template>

<style scoped>
.login-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #e8f5e8 0%, #c8e6c9 100%);
}
</style>
