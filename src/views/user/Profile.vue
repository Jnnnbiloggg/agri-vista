<script setup lang="ts">
import { ref } from 'vue'

// Sample user data - replace with real API calls
const userProfile = ref({
  name: 'John Doe',
  email: 'john.doe@example.com',
  phone: '+63 912 345 6789',
  address: 'Butuan City, Agusan del Norte',
  joinedDate: '2024-12-01',
  avatar: null,
})

const isEditing = ref(false)
const isLoading = ref(false)

const handleSave = async () => {
  isLoading.value = true

  // TODO: Implement actual save logic
  console.log('Saving profile:', userProfile.value)

  setTimeout(() => {
    isLoading.value = false
    isEditing.value = false
  }, 1500)
}

const handleCancel = () => {
  isEditing.value = false
  // TODO: Reset form to original values
}
</script>

<template>
  <div>
    <!-- Page Header -->
    <v-row class="mb-6">
      <v-col cols="12">
        <h1 class="text-h4 font-weight-bold text-primary mb-2">My Profile</h1>
        <p class="text-h6 text-grey-darken-1">Manage your personal information</p>
      </v-col>
    </v-row>

    <!-- Profile Card -->
    <v-row>
      <v-col cols="12" md="8">
        <v-card>
          <v-card-title class="d-flex align-center justify-space-between">
            <span>Personal Information</span>
            <v-btn
              v-if="!isEditing"
              color="primary"
              variant="text"
              @click="isEditing = true"
              prepend-icon="mdi-pencil"
            >
              Edit Profile
            </v-btn>
          </v-card-title>

          <v-card-text>
            <v-form @submit.prevent="handleSave">
              <v-row>
                <!-- Avatar Section -->
                <v-col cols="12" class="text-center mb-4">
                  <v-avatar size="120" color="primary" class="mb-4">
                    <v-icon icon="mdi-account" size="60"></v-icon>
                  </v-avatar>
                  <br />
                  <v-btn v-if="isEditing" variant="outlined" size="small" prepend-icon="mdi-camera">
                    Change Photo
                  </v-btn>
                </v-col>

                <!-- Form Fields -->
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="userProfile.name"
                    label="Full Name"
                    variant="outlined"
                    :readonly="!isEditing"
                    required
                  ></v-text-field>
                </v-col>

                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="userProfile.email"
                    label="Email Address"
                    type="email"
                    variant="outlined"
                    :readonly="!isEditing"
                    required
                  ></v-text-field>
                </v-col>

                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="userProfile.phone"
                    label="Phone Number"
                    variant="outlined"
                    :readonly="!isEditing"
                  ></v-text-field>
                </v-col>

                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="userProfile.joinedDate"
                    label="Member Since"
                    variant="outlined"
                    readonly
                  ></v-text-field>
                </v-col>

                <v-col cols="12">
                  <v-textarea
                    v-model="userProfile.address"
                    label="Address"
                    variant="outlined"
                    :readonly="!isEditing"
                    rows="3"
                  ></v-textarea>
                </v-col>

                <!-- Action Buttons -->
                <v-col v-if="isEditing" cols="12" class="d-flex gap-2 justify-end">
                  <v-btn variant="outlined" @click="handleCancel"> Cancel </v-btn>
                  <v-btn type="submit" color="primary" variant="elevated" :loading="isLoading">
                    Save Changes
                  </v-btn>
                </v-col>
              </v-row>
            </v-form>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Activity Summary -->
      <v-col cols="12" md="4">
        <v-card class="mb-4">
          <v-card-title>Activity Summary</v-card-title>
          <v-card-text>
            <v-list>
              <v-list-item>
                <template v-slot:prepend>
                  <v-icon icon="mdi-calendar" color="primary"></v-icon>
                </template>
                <v-list-item-title>Total Appointments</v-list-item-title>
                <v-list-item-subtitle>15 bookings</v-list-item-subtitle>
              </v-list-item>

              <v-list-item>
                <template v-slot:prepend>
                  <v-icon icon="mdi-leaf" color="success"></v-icon>
                </template>
                <v-list-item-title>Activities Joined</v-list-item-title>
                <v-list-item-subtitle>23 activities</v-list-item-subtitle>
              </v-list-item>

              <v-list-item>
                <template v-slot:prepend>
                  <v-icon icon="mdi-certificate" color="warning"></v-icon>
                </template>
                <v-list-item-title>Certificates</v-list-item-title>
                <v-list-item-subtitle>3 earned</v-list-item-subtitle>
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-card>

        <!-- Account Settings -->
        <v-card>
          <v-card-title>Account Settings</v-card-title>
          <v-card-text>
            <v-list>
              <v-list-item
                prepend-icon="mdi-lock"
                title="Change Password"
                subtitle="Update your password"
              ></v-list-item>

              <v-list-item
                prepend-icon="mdi-bell"
                title="Notifications"
                subtitle="Email & SMS preferences"
              ></v-list-item>

              <v-list-item
                prepend-icon="mdi-shield-check"
                title="Privacy Settings"
                subtitle="Control your data"
              ></v-list-item>
            </v-list>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<style scoped>
/* Component specific styles */
</style>
