<script setup lang="ts">
import { ref } from 'vue'

interface Announcement {
  id: number
  title: string
  content: string
  type: string
  status: string
  publishDate: string
  author: string
  priority: string
}

// Sample announcements data - replace with real API calls
const announcements = ref([
  {
    id: 1,
    title: 'Strawberry Season Opening',
    content:
      'The strawberry picking season is now open! Join us for fresh strawberry harvesting every weekend.',
    type: 'event',
    status: 'published',
    publishDate: '2025-01-10',
    author: 'Admin',
    priority: 'high',
  },
  {
    id: 2,
    title: 'New Herb Garden Tour',
    content: 'Discover our expanded herb garden with guided tours every Tuesday and Thursday.',
    type: 'announcement',
    status: 'published',
    publishDate: '2025-01-08',
    author: 'Admin',
    priority: 'medium',
  },
  {
    id: 3,
    title: 'Workshop Schedule Update',
    content:
      'Updated schedule for our agricultural workshops. Check the new timings on our activities page.',
    type: 'update',
    status: 'draft',
    publishDate: '2025-01-12',
    author: 'Admin',
    priority: 'low',
  },
])

const showAnnouncementDialog = ref(false)
const editingAnnouncement = ref<Announcement | null>(null)

const newAnnouncement = ref({
  title: '',
  content: '',
  type: 'announcement',
  status: 'draft',
  priority: 'medium',
})

const announcementTypes = [
  { title: 'Announcement', value: 'announcement' },
  { title: 'Event', value: 'event' },
  { title: 'Update', value: 'update' },
  { title: 'News', value: 'news' },
]

const statusOptions = [
  { title: 'Draft', value: 'draft' },
  { title: 'Published', value: 'published' },
  { title: 'Archived', value: 'archived' },
]

const priorityOptions = [
  { title: 'Low', value: 'low' },
  { title: 'Medium', value: 'medium' },
  { title: 'High', value: 'high' },
]

const getTypeColor = (type: string) => {
  switch (type) {
    case 'event':
      return 'success'
    case 'update':
      return 'info'
    case 'news':
      return 'warning'
    default:
      return 'primary'
  }
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'published':
      return 'success'
    case 'draft':
      return 'warning'
    case 'archived':
      return 'grey'
    default:
      return 'primary'
  }
}

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'high':
      return 'error'
    case 'medium':
      return 'warning'
    case 'low':
      return 'success'
    default:
      return 'grey'
  }
}

const handleAddAnnouncement = () => {
  editingAnnouncement.value = null
  newAnnouncement.value = {
    title: '',
    content: '',
    type: 'announcement',
    status: 'draft',
    priority: 'medium',
  }
  showAnnouncementDialog.value = true
}

const handleEditAnnouncement = (announcement: any) => {
  editingAnnouncement.value = announcement
  newAnnouncement.value = { ...announcement }
  showAnnouncementDialog.value = true
}

const handleSaveAnnouncement = () => {
  if (editingAnnouncement.value) {
    // Update existing announcement
    const index = announcements.value.findIndex((a) => a.id === editingAnnouncement.value!.id)
    if (index !== -1) {
      announcements.value[index] = { ...announcements.value[index], ...newAnnouncement.value }
    }
  } else {
    // Add new announcement
    const newId = Math.max(...announcements.value.map((a) => a.id)) + 1
    announcements.value.unshift({
      id: newId,
      ...newAnnouncement.value,
      publishDate: new Date().toISOString().split('T')[0],
      author: 'Admin',
    })
  }
  showAnnouncementDialog.value = false
}

const handleDeleteAnnouncement = (id: number) => {
  const index = announcements.value.findIndex((a) => a.id === id)
  if (index !== -1) {
    announcements.value.splice(index, 1)
  }
}

const handlePublishAnnouncement = (announcement: any) => {
  announcement.status = 'published'
  announcement.publishDate = new Date().toISOString().split('T')[0]
}
</script>

<template>
  <div>
    <!-- Page Header -->
    <v-row class="mb-6">
      <v-col cols="12" class="d-flex align-center justify-space-between">
        <div>
          <h1 class="text-h4 font-weight-bold text-primary mb-2">Announcements</h1>
          <p class="text-h6 text-grey-darken-1">Manage farm announcements and news</p>
        </div>
        <v-btn
          color="primary"
          variant="elevated"
          prepend-icon="mdi-plus"
          @click="handleAddAnnouncement"
        >
          New Announcement
        </v-btn>
      </v-col>
    </v-row>

    <!-- Announcements List -->
    <v-row>
      <v-col cols="12">
        <v-card>
          <v-card-title>All Announcements</v-card-title>
          <v-card-text>
            <v-data-table
              :headers="[
                { title: 'Title', key: 'title', sortable: true },
                { title: 'Type', key: 'type' },
                { title: 'Status', key: 'status' },
                { title: 'Priority', key: 'priority' },
                { title: 'Publish Date', key: 'publishDate', sortable: true },
                { title: 'Actions', key: 'actions', sortable: false },
              ]"
              :items="announcements"
              item-value="id"
            >
              <template v-slot:item.title="{ item }">
                <div>
                  <div class="font-weight-medium">{{ item.title }}</div>
                  <div class="text-caption text-grey-darken-1">
                    {{ item.content.substring(0, 80) }}...
                  </div>
                </div>
              </template>

              <template v-slot:item.type="{ item }">
                <v-chip :color="getTypeColor(item.type)" size="small" variant="tonal">
                  {{ item.type }}
                </v-chip>
              </template>

              <template v-slot:item.status="{ item }">
                <v-chip :color="getStatusColor(item.status)" size="small" variant="tonal">
                  {{ item.status }}
                </v-chip>
              </template>

              <template v-slot:item.priority="{ item }">
                <v-chip :color="getPriorityColor(item.priority)" size="small" variant="tonal">
                  {{ item.priority }}
                </v-chip>
              </template>

              <template v-slot:item.actions="{ item }">
                <v-btn
                  v-if="item.status === 'draft'"
                  icon="mdi-publish"
                  size="small"
                  variant="text"
                  color="success"
                  @click="handlePublishAnnouncement(item)"
                ></v-btn>
                <v-btn
                  icon="mdi-pencil"
                  size="small"
                  variant="text"
                  color="primary"
                  @click="handleEditAnnouncement(item)"
                ></v-btn>
                <v-btn
                  icon="mdi-delete"
                  size="small"
                  variant="text"
                  color="error"
                  @click="handleDeleteAnnouncement(item.id)"
                ></v-btn>
              </template>
            </v-data-table>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Announcement Dialog -->
    <v-dialog v-model="showAnnouncementDialog" max-width="800px">
      <v-card>
        <v-card-title>
          {{ editingAnnouncement ? 'Edit Announcement' : 'New Announcement' }}
        </v-card-title>
        <v-card-text>
          <v-form @submit.prevent="handleSaveAnnouncement">
            <v-row>
              <v-col cols="12">
                <v-text-field
                  v-model="newAnnouncement.title"
                  label="Title"
                  variant="outlined"
                  required
                ></v-text-field>
              </v-col>

              <v-col cols="12" md="4">
                <v-select
                  v-model="newAnnouncement.type"
                  label="Type"
                  :items="announcementTypes"
                  variant="outlined"
                  required
                ></v-select>
              </v-col>

              <v-col cols="12" md="4">
                <v-select
                  v-model="newAnnouncement.status"
                  label="Status"
                  :items="statusOptions"
                  variant="outlined"
                  required
                ></v-select>
              </v-col>

              <v-col cols="12" md="4">
                <v-select
                  v-model="newAnnouncement.priority"
                  label="Priority"
                  :items="priorityOptions"
                  variant="outlined"
                  required
                ></v-select>
              </v-col>

              <v-col cols="12">
                <v-textarea
                  v-model="newAnnouncement.content"
                  label="Content"
                  variant="outlined"
                  rows="8"
                  required
                ></v-textarea>
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>

        <v-card-actions class="px-6 pb-6">
          <v-spacer></v-spacer>
          <v-btn variant="outlined" @click="showAnnouncementDialog = false"> Cancel </v-btn>
          <v-btn color="primary" variant="elevated" @click="handleSaveAnnouncement">
            {{ editingAnnouncement ? 'Update' : 'Create' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<style scoped>
/* Component specific styles */
</style>
