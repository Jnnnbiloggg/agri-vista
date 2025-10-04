<script setup lang="ts">
import { ref, computed } from 'vue'

interface Props {
  userType: 'admin' | 'user'
}

const props = defineProps<Props>()

interface Announcement {
  id: number
  title: string
  description: string
  duration: string
  image_url: string | null
  created_at: string
}

// Sample announcements data - replace with Supabase API calls
const announcements = ref<Announcement[]>([
  {
    id: 1,
    title: 'Strawberry Season Opening',
    description:
      'The strawberry picking season is now open! Join us for fresh strawberry harvesting every weekend.',
    duration: '3 months',
    image_url: 'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=400',
    created_at: '2025-01-10',
  },
  {
    id: 2,
    title: 'New Herb Garden Tour',
    description: 'Discover our expanded herb garden with guided tours every Tuesday and Thursday.',
    duration: '1 month',
    image_url: 'https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?w=400',
    created_at: '2025-01-08',
  },
  {
    id: 3,
    title: 'Workshop Schedule Update',
    description:
      'Updated schedule for our agricultural workshops. Check the new timings on our activities page.',
    duration: '2 weeks',
    image_url: null,
    created_at: '2025-01-12',
  },
])

const showAnnouncementDialog = ref(false)
const editingAnnouncement = ref<Announcement | null>(null)
const imageFile = ref<File | null>(null)
const imagePreview = ref<string | null>(null)

const newAnnouncement = ref({
  title: '',
  description: '',
  duration: '',
  image_url: null as string | null,
})

// Handle image file selection
const handleImageSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]

  if (file) {
    imageFile.value = file
    // Create preview URL
    const reader = new FileReader()
    reader.onload = (e) => {
      imagePreview.value = e.target?.result as string
    }
    reader.readAsDataURL(file)
  }
}

// Remove image
const handleRemoveImage = () => {
  imageFile.value = null
  imagePreview.value = null
  newAnnouncement.value.image_url = null
}

// Admin-only functions
const handleAddAnnouncement = () => {
  if (props.userType !== 'admin') return
  editingAnnouncement.value = null
  newAnnouncement.value = {
    title: '',
    description: '',
    duration: '',
    image_url: null,
  }
  imageFile.value = null
  imagePreview.value = null
  showAnnouncementDialog.value = true
}

const handleEditAnnouncement = (announcement: Announcement) => {
  if (props.userType !== 'admin') return
  editingAnnouncement.value = announcement
  newAnnouncement.value = {
    title: announcement.title,
    description: announcement.description,
    duration: announcement.duration,
    image_url: announcement.image_url,
  }
  imageFile.value = null
  imagePreview.value = announcement.image_url
  showAnnouncementDialog.value = true
}

const handleSaveAnnouncement = async () => {
  if (props.userType !== 'admin') return

  // TODO: Upload image to Supabase Storage first
  // const imagePath = await uploadImage(imageFile.value)
  // newAnnouncement.value.image_url = imagePath

  if (imageFile.value) {
    // Simulate image upload - replace with actual Supabase storage upload
    newAnnouncement.value.image_url = imagePreview.value
  }

  if (editingAnnouncement.value) {
    // Update existing announcement
    const index = announcements.value.findIndex((a) => a.id === editingAnnouncement.value!.id)
    if (index !== -1) {
      announcements.value[index] = {
        ...announcements.value[index],
        ...newAnnouncement.value,
      }
    }
  } else {
    // Add new announcement
    const newId = Math.max(...announcements.value.map((a) => a.id), 0) + 1
    announcements.value.unshift({
      id: newId,
      ...newAnnouncement.value,
      created_at: new Date().toISOString().split('T')[0],
    })
  }
  showAnnouncementDialog.value = false
}

const handleDeleteAnnouncement = (id: number) => {
  if (props.userType !== 'admin') return
  const index = announcements.value.findIndex((a) => a.id === id)
  if (index !== -1) {
    announcements.value.splice(index, 1)
  }
}

// Headers configuration based on user type
const tableHeaders = computed(() => {
  const baseHeaders = [
    { title: 'Image', key: 'image_url' },
    { title: 'Title', key: 'title' },
    { title: 'Duration', key: 'duration' },
    { title: 'Date', key: 'created_at' },
  ]

  if (props.userType === 'admin') {
    baseHeaders.push({ title: 'Actions', key: 'actions' })
  }

  return baseHeaders
})

const pageTitle = computed(() =>
  props.userType === 'admin' ? 'Announcements' : 'Farm Announcements',
)

const pageSubtitle = computed(() =>
  props.userType === 'admin'
    ? 'Manage farm announcements and news'
    : 'Stay updated with the latest farm news and events',
)
</script>

<template>
  <div>
    <!-- Page Header -->
    <v-row class="mb-6">
      <v-col cols="12" class="d-flex align-center justify-space-between">
        <div>
          <h1 class="text-h4 font-weight-bold text-primary mb-2">{{ pageTitle }}</h1>
          <p class="text-h6 text-grey-darken-1">{{ pageSubtitle }}</p>
        </div>
        <v-btn
          v-if="userType === 'admin'"
          color="primary"
          variant="elevated"
          prepend-icon="mdi-plus"
          @click="handleAddAnnouncement"
        >
          New Announcement
        </v-btn>
      </v-col>
    </v-row>

    <!-- User View: Card Layout -->
    <template v-if="userType === 'user'">
      <v-row>
        <v-col v-for="announcement in announcements" :key="announcement.id" cols="12" md="6" lg="4">
          <v-card class="fill-height">
            <v-img v-if="announcement.image_url" :src="announcement.image_url" height="200" cover>
              <template v-slot:placeholder>
                <v-row class="fill-height ma-0" align="center" justify="center">
                  <v-progress-circular indeterminate color="grey-lighten-5"></v-progress-circular>
                </v-row>
              </template>
            </v-img>
            <div
              v-else
              class="bg-grey-lighten-3 d-flex align-center justify-center"
              style="height: 200px"
            >
              <v-icon icon="mdi-image-off-outline" size="64" color="grey-lighten-1"></v-icon>
            </div>

            <v-card-title>
              {{ announcement.title }}
            </v-card-title>

            <v-card-text>
              <p class="text-body-2 mb-3">{{ announcement.description }}</p>
              <div class="d-flex align-center text-caption text-grey-darken-1">
                <v-icon icon="mdi-clock-outline" size="16" class="mr-1"></v-icon>
                Duration: {{ announcement.duration }}
                <v-spacer></v-spacer>
                <v-icon icon="mdi-calendar" size="16" class="mr-1"></v-icon>
                {{ announcement.created_at }}
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </template>

    <!-- Admin View: Table Layout -->
    <template v-else>
      <v-row>
        <v-col cols="12">
          <v-card>
            <v-card-title>All Announcements</v-card-title>
            <v-card-text>
              <v-data-table :headers="tableHeaders" :items="announcements" item-value="id">
                <template v-slot:item.image_url="{ item }">
                  <v-avatar v-if="item.image_url" size="60" rounded="lg" class="my-2">
                    <v-img :src="item.image_url" cover></v-img>
                  </v-avatar>
                  <v-avatar v-else size="60" rounded="lg" class="my-2 bg-grey-lighten-3">
                    <v-icon icon="mdi-image-off-outline" color="grey"></v-icon>
                  </v-avatar>
                </template>

                <template v-slot:item.title="{ item }">
                  <div>
                    <div class="font-weight-medium">{{ item.title }}</div>
                    <div class="text-caption text-grey-darken-1">
                      {{ item.description.substring(0, 60) }}...
                    </div>
                  </div>
                </template>

                <template v-slot:item.actions="{ item }">
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
    </template>

    <!-- Admin Announcement Dialog -->
    <v-dialog v-if="userType === 'admin'" v-model="showAnnouncementDialog" max-width="700px">
      <v-card>
        <v-card-title>
          {{ editingAnnouncement ? 'Edit Announcement' : 'New Announcement' }}
        </v-card-title>
        <v-card-text>
          <v-form @submit.prevent="handleSaveAnnouncement">
            <v-row>
              <!-- Image Upload Section -->
              <v-col cols="12">
                <div class="text-subtitle-2 mb-2">Image</div>

                <!-- Image Preview -->
                <div v-if="imagePreview" class="mb-4 position-relative">
                  <v-img :src="imagePreview" max-height="300" class="rounded" cover></v-img>
                  <v-btn
                    icon="mdi-close"
                    size="small"
                    color="error"
                    class="position-absolute"
                    style="top: 8px; right: 8px"
                    @click="handleRemoveImage"
                  ></v-btn>
                </div>

                <!-- Upload Button -->
                <v-file-input
                  v-else
                  accept="image/*"
                  label="Upload Image"
                  prepend-icon="mdi-camera"
                  variant="outlined"
                  @change="handleImageSelect"
                ></v-file-input>
              </v-col>

              <v-col cols="12">
                <v-text-field
                  v-model="newAnnouncement.title"
                  label="Title"
                  variant="outlined"
                  required
                ></v-text-field>
              </v-col>

              <v-col cols="12">
                <v-text-field
                  v-model="newAnnouncement.duration"
                  label="Duration"
                  placeholder="e.g., 2 weeks, 1 month, 3 months"
                  variant="outlined"
                  required
                ></v-text-field>
              </v-col>

              <v-col cols="12">
                <v-textarea
                  v-model="newAnnouncement.description"
                  label="Description"
                  variant="outlined"
                  rows="6"
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
