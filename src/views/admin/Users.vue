<script setup lang="ts">
import { ref, computed } from 'vue'

interface User {
  id: number
  name: string
  email: string
  role: string
  status: string
  joinedDate: string
  lastLogin: string
  appointments: number
}

// Sample users data - replace with real API calls
const users = ref([
  {
    id: 1,
    name: 'John Doe',
    email: 'john.doe@example.com',
    role: 'user',
    status: 'active',
    joinedDate: '2024-12-01',
    lastLogin: '2025-01-10',
    appointments: 5,
  },
  {
    id: 2,
    name: 'Jane Smith',
    email: 'jane.smith@example.com',
    role: 'user',
    status: 'active',
    joinedDate: '2024-11-15',
    lastLogin: '2025-01-09',
    appointments: 12,
  },
  {
    id: 3,
    name: 'Mike Johnson',
    email: 'mike.johnson@example.com',
    role: 'admin',
    status: 'active',
    joinedDate: '2024-10-01',
    lastLogin: '2025-01-11',
    appointments: 0,
  },
  {
    id: 4,
    name: 'Sarah Wilson',
    email: 'sarah.wilson@example.com',
    role: 'user',
    status: 'inactive',
    joinedDate: '2024-12-20',
    lastLogin: '2024-12-25',
    appointments: 2,
  },
])

const searchQuery = ref('')
const selectedRole = ref('all')
const selectedStatus = ref('all')
const showUserDialog = ref(false)
const editingUser = ref<User | null>(null)

const newUser = ref({
  name: '',
  email: '',
  role: 'user',
  status: 'active',
})

const filteredUsers = computed(() => {
  return users.value.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.value.toLowerCase())
    const matchesRole = selectedRole.value === 'all' || user.role === selectedRole.value
    const matchesStatus = selectedStatus.value === 'all' || user.status === selectedStatus.value

    return matchesSearch && matchesRole && matchesStatus
  })
})

const getRoleColor = (role: string) => {
  return role === 'admin' ? 'error' : 'primary'
}

const getStatusColor = (status: string) => {
  return status === 'active' ? 'success' : 'warning'
}

const handleAddUser = () => {
  editingUser.value = null
  newUser.value = {
    name: '',
    email: '',
    role: 'user',
    status: 'active',
  }
  showUserDialog.value = true
}

const handleEditUser = (user: any) => {
  editingUser.value = user
  newUser.value = { ...user }
  showUserDialog.value = true
}

const handleSaveUser = () => {
  if (editingUser.value) {
    // Update existing user
    const index = users.value.findIndex((u) => u.id === editingUser.value!.id)
    if (index !== -1) {
      users.value[index] = { ...users.value[index], ...newUser.value }
    }
  } else {
    // Add new user
    const newId = Math.max(...users.value.map((u) => u.id)) + 1
    users.value.push({
      id: newId,
      ...newUser.value,
      joinedDate: new Date().toISOString().split('T')[0],
      lastLogin: 'Never',
      appointments: 0,
    })
  }
  showUserDialog.value = false
}

const handleDeleteUser = (userId: number) => {
  const index = users.value.findIndex((u) => u.id === userId)
  if (index !== -1) {
    users.value.splice(index, 1)
  }
}
</script>

<template>
  <div>
    <!-- Page Header -->
    <v-row class="mb-6">
      <v-col cols="12" class="d-flex align-center justify-space-between">
        <div>
          <h1 class="text-h4 font-weight-bold text-primary mb-2">User Management</h1>
          <p class="text-h6 text-grey-darken-1">Manage system users and their permissions</p>
        </div>
        <v-btn
          color="primary"
          variant="elevated"
          prepend-icon="mdi-account-plus"
          @click="handleAddUser"
        >
          Add User
        </v-btn>
      </v-col>
    </v-row>

    <!-- Filters -->
    <v-row class="mb-6">
      <v-col cols="12" md="4">
        <v-text-field
          v-model="searchQuery"
          label="Search users..."
          prepend-inner-icon="mdi-magnify"
          variant="outlined"
          clearable
        ></v-text-field>
      </v-col>
      <v-col cols="12" md="4">
        <v-select
          v-model="selectedRole"
          label="Filter by Role"
          :items="[
            { title: 'All Roles', value: 'all' },
            { title: 'Users', value: 'user' },
            { title: 'Admins', value: 'admin' },
          ]"
          variant="outlined"
        ></v-select>
      </v-col>
      <v-col cols="12" md="4">
        <v-select
          v-model="selectedStatus"
          label="Filter by Status"
          :items="[
            { title: 'All Status', value: 'all' },
            { title: 'Active', value: 'active' },
            { title: 'Inactive', value: 'inactive' },
          ]"
          variant="outlined"
        ></v-select>
      </v-col>
    </v-row>

    <!-- Users Table -->
    <v-row>
      <v-col cols="12">
        <v-card>
          <v-card-title class="d-flex align-center justify-space-between">
            <span>All Users ({{ filteredUsers.length }})</span>
            <v-chip color="primary" variant="tonal">
              {{ users.filter((u: any) => u.status === 'active').length }} Active
            </v-chip>
          </v-card-title>
          <v-card-text>
            <v-data-table
              :headers="[
                { title: 'Name', key: 'name', sortable: true },
                { title: 'Email', key: 'email', sortable: true },
                { title: 'Role', key: 'role' },
                { title: 'Status', key: 'status' },
                { title: 'Joined', key: 'joinedDate', sortable: true },
                { title: 'Last Login', key: 'lastLogin' },
                { title: 'Appointments', key: 'appointments' },
                { title: 'Actions', key: 'actions', sortable: false },
              ]"
              :items="filteredUsers"
              item-value="id"
            >
              <template v-slot:item.role="{ item }">
                <v-chip :color="getRoleColor(item.role)" size="small" variant="tonal">
                  {{ item.role }}
                </v-chip>
              </template>

              <template v-slot:item.status="{ item }">
                <v-chip :color="getStatusColor(item.status)" size="small" variant="tonal">
                  {{ item.status }}
                </v-chip>
              </template>

              <template v-slot:item.actions="{ item }">
                <v-btn
                  icon="mdi-pencil"
                  size="small"
                  variant="text"
                  color="primary"
                  @click="handleEditUser(item)"
                ></v-btn>
                <v-btn
                  icon="mdi-delete"
                  size="small"
                  variant="text"
                  color="error"
                  @click="handleDeleteUser(item.id)"
                ></v-btn>
              </template>
            </v-data-table>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- User Dialog -->
    <v-dialog v-model="showUserDialog" max-width="600px">
      <v-card>
        <v-card-title>
          {{ editingUser ? 'Edit User' : 'Add New User' }}
        </v-card-title>
        <v-card-text>
          <v-form @submit.prevent="handleSaveUser">
            <v-row>
              <v-col cols="12">
                <v-text-field
                  v-model="newUser.name"
                  label="Full Name"
                  variant="outlined"
                  required
                ></v-text-field>
              </v-col>

              <v-col cols="12">
                <v-text-field
                  v-model="newUser.email"
                  label="Email Address"
                  type="email"
                  variant="outlined"
                  required
                ></v-text-field>
              </v-col>

              <v-col cols="12" md="6">
                <v-select
                  v-model="newUser.role"
                  label="Role"
                  :items="[
                    { title: 'User', value: 'user' },
                    { title: 'Admin', value: 'admin' },
                  ]"
                  variant="outlined"
                  required
                ></v-select>
              </v-col>

              <v-col cols="12" md="6">
                <v-select
                  v-model="newUser.status"
                  label="Status"
                  :items="[
                    { title: 'Active', value: 'active' },
                    { title: 'Inactive', value: 'inactive' },
                  ]"
                  variant="outlined"
                  required
                ></v-select>
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>

        <v-card-actions class="px-6 pb-6">
          <v-spacer></v-spacer>
          <v-btn variant="outlined" @click="showUserDialog = false"> Cancel </v-btn>
          <v-btn color="primary" variant="elevated" @click="handleSaveUser">
            {{ editingUser ? 'Update' : 'Create' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<style scoped>
/* Component specific styles */
</style>
