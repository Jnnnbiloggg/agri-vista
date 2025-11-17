<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'
import PageLayout from './shared/PageLayout.vue'
import { supabase } from '../../../../utils/supabase'
import AppSnackbar from '@/components/shared/AppSnackbar.vue'
import { useSnackbar } from '@/composables/useSnackbar'
import { useImageHandler } from '@/composables/useImageHandler'
import { formatDate } from '@/utils/formatters'

interface Props {
  userType: 'admin' | 'user'
}

const props = defineProps<Props>()

const router = useRouter()
const authStore = useAuthStore()

// User info
const userName = computed(() => authStore.fullName)
const userEmail = computed(() => authStore.userEmail)
const editableFullName = ref('')
const isEditingName = ref(false)
const nameLoading = ref(false)

// All users (for admin)
interface UserData {
  id: string
  email: string
  full_name: string
  created_at: string
  last_sign_in_at: string | null
  user_metadata: any
}

const allUsers = ref<UserData[]>([])
const usersLoading = ref(false)
const usersSearchQuery = ref('')
const showEditUserDialog = ref(false)
const showDeleteUserDialog = ref(false)
const selectedUser = ref<UserData | null>(null)
const editUserForm = ref({
  fullName: '',
  email: '',
})
const editUserLoading = ref(false)
const deleteUserLoading = ref(false)
const deleteUserConfirmation = ref('')

// Change password form
const showPasswordDialog = ref(false)
const passwordForm = ref({
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
})
const passwordLoading = ref(false)

// Delete account
const showDeleteDialog = ref(false)
const deleteLoading = ref(false)
const deleteConfirmation = ref('')

// Use snackbar composable
const { snackbar, snackbarMessage, snackbarColor, showSnackbar } = useSnackbar()

// Load all users (admin only)
const fetchAllUsers = async () => {
  if (props.userType !== 'admin') return

  usersLoading.value = true
  try {
    // Since we can't use admin API from client, we'll aggregate user info from various tables
    // Get unique user IDs and their data from tables that store user information

    // Fetch from appointments (has full_name and email)
    const { data: appointmentsData } = await supabase
      .from('appointments')
      .select('user_id, full_name, email')
      .order('created_at', { ascending: false })

    // Fetch from bookings
    const { data: bookingsData } = await supabase
      .from('bookings')
      .select('user_id')
      .order('created_at', { ascending: false })

    // Fetch from orders
    const { data: ordersData } = await supabase
      .from('orders')
      .select('user_id, buyer_name, buyer_email')
      .order('created_at', { ascending: false })

    // Fetch from training_registrations
    const { data: trainingsData } = await supabase
      .from('training_registrations')
      .select('user_id, user_name, user_email')
      .order('created_at', { ascending: false })

    // Fetch from feedbacks
    const { data: feedbacksData } = await supabase
      .from('feedbacks')
      .select('user_id, user_name')
      .order('created_at', { ascending: false })

    // Aggregate user data
    const userMap = new Map<string, UserData>()

    // Process appointments data
    appointmentsData?.forEach((item: any) => {
      if (item.user_id && !userMap.has(item.user_id)) {
        userMap.set(item.user_id, {
          id: item.user_id,
          email: item.email || '',
          full_name: item.full_name || item.email?.split('@')[0] || 'Unknown',
          created_at: new Date().toISOString(),
          last_sign_in_at: null,
          user_metadata: {},
        })
      }
    })

    // Process orders data
    ordersData?.forEach((item: any) => {
      if (item.user_id && !userMap.has(item.user_id)) {
        userMap.set(item.user_id, {
          id: item.user_id,
          email: item.buyer_email || '',
          full_name: item.buyer_name || item.buyer_email?.split('@')[0] || 'Unknown',
          created_at: new Date().toISOString(),
          last_sign_in_at: null,
          user_metadata: {},
        })
      }
    })

    // Process trainings data
    trainingsData?.forEach((item: any) => {
      if (item.user_id && !userMap.has(item.user_id)) {
        userMap.set(item.user_id, {
          id: item.user_id,
          email: item.user_email || '',
          full_name: item.user_name || item.user_email?.split('@')[0] || 'Unknown',
          created_at: new Date().toISOString(),
          last_sign_in_at: null,
          user_metadata: {},
        })
      }
    })

    // Process feedbacks data
    feedbacksData?.forEach((item: any) => {
      if (item.user_id && !userMap.has(item.user_id)) {
        userMap.set(item.user_id, {
          id: item.user_id,
          email: '',
          full_name: item.user_name || 'Unknown',
          created_at: new Date().toISOString(),
          last_sign_in_at: null,
          user_metadata: {},
        })
      }
    })

    // Process bookings data (just to get user IDs)
    bookingsData?.forEach((item: any) => {
      if (item.user_id && !userMap.has(item.user_id)) {
        userMap.set(item.user_id, {
          id: item.user_id,
          email: '',
          full_name: 'User',
          created_at: new Date().toISOString(),
          last_sign_in_at: null,
          user_metadata: {},
        })
      }
    })

    // Add current user to the list
    if (authStore.user && !userMap.has(authStore.userId)) {
      userMap.set(authStore.userId, {
        id: authStore.userId,
        email: authStore.userEmail,
        full_name: authStore.fullName,
        created_at: new Date().toISOString(),
        last_sign_in_at: new Date().toISOString(),
        user_metadata: {},
      })
    }

    allUsers.value = Array.from(userMap.values())

    if (allUsers.value.length === 0) {
      showSnackbar('No users found in the system', 'info')
    }
  } catch (error: any) {
    console.error('Error fetching users:', error)
    showSnackbar('Failed to fetch users: ' + error.message, 'error')
  } finally {
    usersLoading.value = false
  }
}

// Filter users based on search
const filteredUsers = computed(() => {
  if (!usersSearchQuery.value) return allUsers.value

  const query = usersSearchQuery.value.toLowerCase()
  return allUsers.value.filter(
    (user) =>
      user.email.toLowerCase().includes(query) || user.full_name.toLowerCase().includes(query),
  )
})

// Edit own full name
const startEditingName = () => {
  editableFullName.value = userName.value
  isEditingName.value = true
}

const cancelEditingName = () => {
  isEditingName.value = false
  editableFullName.value = ''
}

const saveFullName = async () => {
  if (!editableFullName.value.trim()) {
    showSnackbar('Full name cannot be empty', 'error')
    return
  }

  nameLoading.value = true
  try {
    const { error } = await supabase.auth.updateUser({
      data: {
        full_name: editableFullName.value.trim(),
      },
    })

    if (error) throw error

    // Update auth store
    if (authStore.userProfile) {
      authStore.setUserProfile({
        ...authStore.userProfile,
        fullName: editableFullName.value.trim(),
      })
    }

    isEditingName.value = false
    showSnackbar('Full name updated successfully!', 'success')
  } catch (error: any) {
    showSnackbar(error.message || 'Failed to update full name', 'error')
  } finally {
    nameLoading.value = false
  }
}

// Edit user (admin only)
const openEditUserDialog = (user: UserData) => {
  selectedUser.value = user
  editUserForm.value = {
    fullName: user.full_name,
    email: user.email,
  }
  showEditUserDialog.value = true
}

const handleEditUser = async () => {
  if (!selectedUser.value) return

  if (!editUserForm.value.fullName.trim()) {
    showSnackbar('Full name cannot be empty', 'error')
    return
  }

  if (!editUserForm.value.email.trim()) {
    showSnackbar('Email cannot be empty', 'error')
    return
  }

  editUserLoading.value = true
  try {
    const userId = selectedUser.value.id
    const newFullName = editUserForm.value.fullName.trim()
    const newEmail = editUserForm.value.email.trim()

    // Update user info in all relevant tables
    const updatePromises = []

    // Update appointments
    updatePromises.push(
      supabase
        .from('appointments')
        .update({ full_name: newFullName, email: newEmail })
        .eq('user_id', userId),
    )

    // Update orders
    updatePromises.push(
      supabase
        .from('orders')
        .update({ buyer_name: newFullName, buyer_email: newEmail })
        .eq('user_id', userId),
    )

    // Update training_registrations
    updatePromises.push(
      supabase
        .from('training_registrations')
        .update({ user_name: newFullName, user_email: newEmail })
        .eq('user_id', userId),
    )

    // Update feedbacks
    updatePromises.push(
      supabase.from('feedbacks').update({ user_name: newFullName }).eq('user_id', userId),
    )

    await Promise.all(updatePromises)

    // If editing own account, update auth metadata
    if (userId === authStore.userId) {
      await supabase.auth.updateUser({
        email: newEmail,
        data: {
          full_name: newFullName,
        },
      })

      // Update auth store
      if (authStore.userProfile) {
        authStore.setUserProfile({
          ...authStore.userProfile,
          fullName: newFullName,
          email: newEmail,
        })
      }
    }

    showEditUserDialog.value = false
    showSnackbar('User information updated successfully!', 'success')
    await fetchAllUsers()
  } catch (error: any) {
    console.error('Error updating user:', error)
    showSnackbar(error.message || 'Failed to update user', 'error')
  } finally {
    editUserLoading.value = false
  }
}

// Delete user (admin only)
const openDeleteUserDialog = (user: UserData) => {
  selectedUser.value = user
  deleteUserConfirmation.value = ''
  showDeleteUserDialog.value = true
}

const handleDeleteUser = async () => {
  if (!selectedUser.value) return

  if (deleteUserConfirmation.value !== 'DELETE') {
    showSnackbar('Please type "DELETE" to confirm', 'error')
    return
  }

  // Prevent deleting own account
  if (selectedUser.value.id === authStore.userId) {
    showSnackbar('You cannot delete your own account from here', 'error')
    return
  }

  deleteUserLoading.value = true
  try {
    const userId = selectedUser.value.id

    // Delete all user data from all tables
    await supabase.from('bookings').delete().eq('user_id', userId)
    await supabase.from('appointments').delete().eq('user_id', userId)
    await supabase.from('orders').delete().eq('user_id', userId)
    await supabase.from('training_registrations').delete().eq('user_id', userId)
    await supabase.from('feedbacks').delete().eq('user_id', userId)

    // Delete records created by the user
    await supabase.from('activities').delete().eq('created_by', userId)
    await supabase.from('products').delete().eq('created_by', userId)
    await supabase.from('trainings').delete().eq('created_by', userId)
    await supabase.from('announcements').delete().eq('created_by', userId)
    await supabase.from('carousel_slides').delete().eq('created_by', userId)

    // Note: We cannot delete from auth.users without admin API access
    // The user's auth account will remain, but all their data is removed

    showDeleteUserDialog.value = false
    showSnackbar(
      'User data deleted successfully! (Auth account remains but is inactive)',
      'success',
    )
    await fetchAllUsers()
  } catch (error: any) {
    console.error('Error deleting user:', error)
    showSnackbar(error.message || 'Failed to delete user data', 'error')
  } finally {
    deleteUserLoading.value = false
  }
}

// Change password
const handleChangePassword = async () => {
  if (!passwordForm.value.newPassword || !passwordForm.value.confirmPassword) {
    showSnackbar('Please fill in all password fields', 'error')
    return
  }

  if (passwordForm.value.newPassword !== passwordForm.value.confirmPassword) {
    showSnackbar('New passwords do not match', 'error')
    return
  }

  if (passwordForm.value.newPassword.length < 6) {
    showSnackbar('Password must be at least 6 characters long', 'error')
    return
  }

  passwordLoading.value = true

  try {
    const { error } = await supabase.auth.updateUser({
      password: passwordForm.value.newPassword,
    })

    if (error) throw error

    showPasswordDialog.value = false
    passwordForm.value = {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    }
    showSnackbar('Password updated successfully!', 'success')
  } catch (error: any) {
    showSnackbar(error.message || 'Failed to update password', 'error')
  } finally {
    passwordLoading.value = false
  }
}

// Delete account
const handleDeleteAccount = async () => {
  if (deleteConfirmation.value !== 'DELETE') {
    showSnackbar('Please type "DELETE" to confirm', 'error')
    return
  }

  deleteLoading.value = true

  try {
    // Delete all user data from all tables
    const userId = authStore.user?.id
    if (!userId) throw new Error('User not found')

    // Delete in order that respects foreign keys
    // First delete records that reference other tables
    await supabase.from('bookings').delete().eq('user_id', userId)
    await supabase.from('appointments').delete().eq('user_id', userId)
    await supabase.from('orders').delete().eq('user_id', userId)
    await supabase.from('training_registrations').delete().eq('user_id', userId)
    await supabase.from('feedbacks').delete().eq('user_id', userId)

    // Delete records created by the user (admin content)
    await supabase.from('activities').delete().eq('created_by', userId)
    await supabase.from('products').delete().eq('created_by', userId)
    await supabase.from('trainings').delete().eq('created_by', userId)
    await supabase.from('announcements').delete().eq('created_by', userId)
    await supabase.from('carousel_slides').delete().eq('created_by', userId)

    // Sign out the user (account remains but data is deleted)
    await supabase.auth.signOut()

    showSnackbar('Account data deleted successfully', 'success')
    // Redirect to landing page
    router.push('/')
  } catch (error: any) {
    showSnackbar(error.message || 'Failed to delete account', 'error')
  } finally {
    deleteLoading.value = false
  }
}

const pageTitle = computed(() => 'Account Settings')
const pageSubtitle = computed(() =>
  props.userType === 'admin'
    ? 'Manage your admin account settings'
    : 'Manage your account settings',
)

// Load users on mount if admin
onMounted(() => {
  if (props.userType === 'admin') {
    fetchAllUsers()
  }
})
</script>

<template>
  <PageLayout
    :title="pageTitle"
    :subtitle="pageSubtitle"
    :show-search="false"
    :show-notifications="false"
    :show-settings="false"
  >
    <div class="settings-container">
      <!-- User Info Section -->
      <v-card class="modern-card mb-6">
        <v-card-title class="text-h6 font-weight-bold">User Information</v-card-title>
        <v-card-text>
          <v-row>
            <v-col cols="12" md="6">
              <v-text-field
                v-if="!isEditingName"
                :model-value="userName"
                label="Full Name"
                readonly
                variant="outlined"
                class="modern-input"
              >
                <template #append-inner>
                  <v-btn
                    v-if="userType === 'admin'"
                    icon
                    size="small"
                    variant="text"
                    @click="startEditingName"
                  >
                    <v-icon>mdi-pencil</v-icon>
                  </v-btn>
                </template>
              </v-text-field>
              <v-text-field
                v-else
                v-model="editableFullName"
                label="Full Name"
                variant="outlined"
                class="modern-input"
                :loading="nameLoading"
              >
                <template #append-inner>
                  <v-btn
                    icon
                    size="small"
                    variant="text"
                    color="success"
                    :disabled="nameLoading"
                    @click="saveFullName"
                  >
                    <v-icon>mdi-check</v-icon>
                  </v-btn>
                  <v-btn
                    icon
                    size="small"
                    variant="text"
                    color="error"
                    :disabled="nameLoading"
                    @click="cancelEditingName"
                  >
                    <v-icon>mdi-close</v-icon>
                  </v-btn>
                </template>
              </v-text-field>
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field
                :model-value="userEmail"
                label="Email Address"
                readonly
                variant="outlined"
                class="modern-input"
              />
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>

      <!-- Security Section -->
      <v-card class="modern-card mb-6">
        <v-card-title class="text-h6 font-weight-bold">Security</v-card-title>
        <v-card-text>
          <v-btn
            color="primary"
            variant="elevated"
            class="modern-btn"
            @click="showPasswordDialog = true"
          >
            <v-icon start>mdi-lock-reset</v-icon>
            Change Password
          </v-btn>
        </v-card-text>
      </v-card>

      <!-- User Management Section (Admin Only) -->
      <v-card v-if="userType === 'admin'" class="modern-card mb-6">
        <v-card-title class="text-h6 font-weight-bold d-flex align-center justify-space-between">
          <span>User Management</span>
          <v-btn icon size="small" variant="text" :loading="usersLoading" @click="fetchAllUsers">
            <v-icon>mdi-refresh</v-icon>
          </v-btn>
        </v-card-title>
        <v-card-text>
          <!-- Search -->
          <v-text-field
            v-model="usersSearchQuery"
            label="Search users"
            prepend-inner-icon="mdi-magnify"
            variant="outlined"
            clearable
            class="modern-input mb-4"
          />

          <!-- Users Table -->
          <v-data-table
            :headers="[
              { title: 'Full Name', key: 'full_name', sortable: true },
              { title: 'Email', key: 'email', sortable: true },
              { title: 'User ID', key: 'id', sortable: true },
              { title: 'Actions', key: 'actions', sortable: false, align: 'end' },
            ]"
            :items="filteredUsers"
            :loading="usersLoading"
            items-per-page="10"
            class="modern-table elevation-0"
          >
            <template #item.id="{ item }">
              <span class="text-caption text-grey">{{ item.id.substring(0, 8) }}...</span>
            </template>
            <template #item.actions="{ item }">
              <v-btn
                icon
                size="small"
                variant="text"
                color="primary"
                @click="openEditUserDialog(item)"
              >
                <v-icon>mdi-pencil</v-icon>
              </v-btn>
              <v-btn
                icon
                size="small"
                variant="text"
                color="error"
                :disabled="item.id === authStore.userId"
                @click="openDeleteUserDialog(item)"
              >
                <v-icon>mdi-delete</v-icon>
              </v-btn>
            </template>
            <template #no-data>
              <div class="text-center py-4">
                <v-icon size="48" color="grey">mdi-account-off</v-icon>
                <p class="text-grey mt-2">No users found</p>
              </div>
            </template>
          </v-data-table>
        </v-card-text>
      </v-card>

      <!-- Danger Zone -->
      <v-card class="modern-card border-error">
        <v-card-title class="text-h5 font-weight-bold text-error">
          <v-icon start color="error">mdi-alert-circle</v-icon>
          Danger Zone
        </v-card-title>
        <v-card-text>
          <p class="mb-4 text-body-1">
            Once you delete your account, there is no going back. This will permanently delete your
            account and remove all of your data from our servers.
          </p>
          <v-btn
            color="error"
            variant="elevated"
            class="modern-btn"
            @click="showDeleteDialog = true"
          >
            <v-icon start>mdi-delete-forever</v-icon>
            Delete Account
          </v-btn>
        </v-card-text>
      </v-card>
    </div>

    <!-- Change Password Dialog -->
    <v-dialog v-model="showPasswordDialog" max-width="500">
      <v-card class="modern-dialog">
        <v-card-title class="text-h5 font-weight-bold">
          <v-icon start>mdi-lock-reset</v-icon>
          Change Password
        </v-card-title>
        <v-card-text>
          <v-text-field
            v-model="passwordForm.newPassword"
            label="New Password"
            type="password"
            variant="outlined"
            :rules="[(v: string) => !!v || 'Password is required']"
            class="modern-input mb-4"
          />
          <v-text-field
            v-model="passwordForm.confirmPassword"
            label="Confirm New Password"
            type="password"
            variant="outlined"
            :rules="[(v: string) => !!v || 'Please confirm your password']"
            class="modern-input mb-4"
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="showPasswordDialog = false"> Cancel </v-btn>
          <v-btn
            color="primary"
            variant="elevated"
            :loading="passwordLoading"
            class="modern-btn"
            @click="handleChangePassword"
          >
            <v-icon start>mdi-check</v-icon>
            Update Password
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete Account Dialog -->
    <v-dialog v-model="showDeleteDialog" max-width="500">
      <v-card class="modern-dialog">
        <v-card-title class="text-h5 font-weight-bold text-error">
          <v-icon start color="error">mdi-alert-circle</v-icon>
          Delete Account
        </v-card-title>
        <v-card-text>
          <p class="mb-4 text-body-1">
            This action cannot be undone. This will permanently delete your account and remove all
            your data from our servers.
          </p>
          <p class="mb-4 text-body-1">Type <strong>DELETE</strong> to confirm:</p>
          <v-text-field
            v-model="deleteConfirmation"
            label="Type DELETE to confirm"
            variant="outlined"
            class="modern-input"
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="showDeleteDialog = false"> Cancel </v-btn>
          <v-btn
            color="error"
            variant="elevated"
            :loading="deleteLoading"
            class="modern-btn"
            @click="handleDeleteAccount"
          >
            <v-icon start>mdi-delete-forever</v-icon>
            Delete Account
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Edit User Dialog (Admin Only) -->
    <v-dialog v-model="showEditUserDialog" max-width="500">
      <v-card class="modern-dialog">
        <v-card-title class="text-h5 font-weight-bold">
          <v-icon start>mdi-account-edit</v-icon>
          Edit User
        </v-card-title>
        <v-card-text>
          <v-text-field
            v-model="editUserForm.fullName"
            label="Full Name"
            variant="outlined"
            :rules="[(v: string) => !!v || 'Full name is required']"
            class="modern-input mb-4"
          />
          <v-text-field
            v-model="editUserForm.email"
            label="Email"
            type="email"
            variant="outlined"
            :rules="[(v: string) => !!v || 'Email is required']"
            class="modern-input mb-4"
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="showEditUserDialog = false"> Cancel </v-btn>
          <v-btn
            color="primary"
            variant="elevated"
            :loading="editUserLoading"
            class="modern-btn"
            @click="handleEditUser"
          >
            <v-icon start>mdi-check</v-icon>
            Save Changes
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete User Dialog (Admin Only) -->
    <v-dialog v-model="showDeleteUserDialog" max-width="500">
      <v-card class="modern-dialog">
        <v-card-title class="text-h5 font-weight-bold text-error">
          <v-icon start color="error">mdi-alert-circle</v-icon>
          Delete User Data
        </v-card-title>
        <v-card-text>
          <p class="mb-4 text-body-1">
            This action cannot be undone. This will permanently delete all data for
            <strong>{{ selectedUser?.full_name }}</strong> ({{ selectedUser?.email }}) from the
            system, including bookings, appointments, orders, registrations, and feedbacks.
          </p>
          <p class="mb-2 text-body-2 text-grey">
            Note: The user's authentication account will remain but will be inactive.
          </p>
          <p class="mb-4 text-body-1">Type <strong>DELETE</strong> to confirm:</p>
          <v-text-field
            v-model="deleteUserConfirmation"
            label="Type DELETE to confirm"
            variant="outlined"
            class="modern-input"
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="showDeleteUserDialog = false"> Cancel </v-btn>
          <v-btn
            color="error"
            variant="elevated"
            :loading="deleteUserLoading"
            class="modern-btn"
            @click="handleDeleteUser"
          >
            <v-icon start>mdi-delete-forever</v-icon>
            Delete User Data
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Snackbar for notifications -->
    <AppSnackbar
      v-model="snackbar"
      :message="snackbarMessage"
      :color="snackbarColor"
      :timeout="3000"
      location="top"
    />
  </PageLayout>
</template>

<style scoped>
.settings-container {
  width: 100%;
}

.border-error {
  border: 2px solid rgb(var(--v-theme-error));
}
</style>
