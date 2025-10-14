<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import HeaderActions from './shared/HeaderActions.vue'

interface Props {
  userType: 'admin' | 'user'
}

const props = defineProps<Props>()

// Get user info from auth store
const authStore = useAuthStore()
const userName = computed(() => authStore.fullName)
const userProfilePic = computed(() => 'https://i.pravatar.cc/150?img=12')

interface Feedback {
  id: number
  name: string
  profilePic: string
  profession: string
  feedbackType: 'general' | 'product'
  product?: string
  message: string
  rating: number
  status: string
  submittedAt: string
  isPublic: boolean
}

const feedbacks = ref<Feedback[]>([
  {
    id: 1,
    name: 'Maria Santos',
    profilePic: 'https://i.pravatar.cc/150?img=1',
    profession: 'Professor',
    feedbackType: 'general',
    message:
      'Amazing farm experience! The staff was knowledgeable and the tour was very educational.',
    rating: 5,
    status: 'approved',
    submittedAt: '2025-01-15T10:30:00',
    isPublic: true,
  },
  {
    id: 2,
    name: 'John Rivera',
    profilePic: 'https://i.pravatar.cc/150?img=3',
    profession: 'Student',
    feedbackType: 'product',
    product: 'Strawberry',
    message: "The strawberries are so fresh and sweet! Best quality I've ever tasted.",
    rating: 5,
    status: 'approved',
    submittedAt: '2025-01-14T14:20:00',
    isPublic: true,
  },
  {
    id: 3,
    name: 'Sarah Lee',
    profilePic: 'https://i.pravatar.cc/150?img=5',
    profession: 'Guest',
    feedbackType: 'product',
    product: 'Tomatoes',
    message: 'Good quality tomatoes, though a bit pricey.',
    rating: 4,
    status: 'approved',
    submittedAt: '2025-01-13T09:15:00',
    isPublic: true,
  },
])

const showFeedbackDialog = ref(false)
const showSuccessDialog = ref(false)

const feedbackForm = ref({
  profession: '',
  feedbackType: 'general' as 'general' | 'product',
  product: '',
  message: '',
  rating: 5,
  isPublic: true,
})

const professions = [
  { title: 'Professor', value: 'professor' },
  { title: 'Student', value: 'student' },
  { title: 'Guest', value: 'guest' },
  { title: 'Researcher', value: 'researcher' },
  { title: 'Business Owner', value: 'business-owner' },
  { title: 'Other', value: 'other' },
]

const products = [
  { title: 'Strawberry', value: 'strawberry' },
  { title: 'Tomatoes', value: 'tomatoes' },
  { title: 'Lettuce', value: 'lettuce' },
  { title: 'Herbs', value: 'herbs' },
  { title: 'Other Vegetables', value: 'other-vegetables' },
]

// Admin analytics
const timeRange = ref<'weekly' | 'monthly' | 'yearly'>('monthly')
const selectedProduct = ref('strawberry')

const calculateRatings = (type: 'general' | 'product', productName?: string) => {
  const filtered = feedbacks.value.filter((f) => {
    if (type === 'general') return f.feedbackType === 'general' && f.status === 'approved'
    return (
      f.feedbackType === 'product' &&
      f.product?.toLowerCase() === productName?.toLowerCase() &&
      f.status === 'approved'
    )
  })

  const positive = filtered.filter((f) => f.rating >= 4).length
  const negative = filtered.filter((f) => f.rating < 4).length

  return { positive, negative, total: filtered.length }
}

const generalRatings = computed(() => calculateRatings('general'))
const productRatings = computed(() => calculateRatings('product', selectedProduct.value))

const publishedFeedback = computed(() =>
  feedbacks.value.filter((f) => f.status === 'approved' && f.isPublic),
)

// User functions
const openFeedbackDialog = () => {
  feedbackForm.value = {
    profession: '',
    feedbackType: 'general',
    product: '',
    message: '',
    rating: 5,
    isPublic: true,
  }
  showFeedbackDialog.value = true
}

const handleSubmitFeedback = () => {
  const newFeedback: Feedback = {
    id: Math.max(...feedbacks.value.map((f) => f.id), 0) + 1,
    name: userName.value,
    profilePic: userProfilePic.value,
    profession: feedbackForm.value.profession,
    feedbackType: feedbackForm.value.feedbackType,
    product: feedbackForm.value.feedbackType === 'product' ? feedbackForm.value.product : undefined,
    message: feedbackForm.value.message,
    rating: feedbackForm.value.rating,
    status: 'pending',
    submittedAt: new Date().toISOString(),
    isPublic: feedbackForm.value.isPublic,
  }

  feedbacks.value.unshift(newFeedback)
  showFeedbackDialog.value = false
  showSuccessDialog.value = true
}

// Admin functions
const updateFeedbackStatus = (feedbackId: number, newStatus: string) => {
  if (props.userType === 'admin') {
    const feedback = feedbacks.value.find((f) => f.id === feedbackId)
    if (feedback) {
      feedback.status = newStatus
    }
  }
}

const deleteFeedback = (feedbackId: number) => {
  if (props.userType === 'admin') {
    const index = feedbacks.value.findIndex((f) => f.id === feedbackId)
    if (index !== -1) {
      feedbacks.value.splice(index, 1)
    }
  }
}

const togglePublicStatus = (feedbackId: number) => {
  if (props.userType === 'admin') {
    const feedback = feedbacks.value.find((f) => f.id === feedbackId)
    if (feedback) {
      feedback.isPublic = !feedback.isPublic
    }
  }
}

const adminTableHeaders = [
  { title: 'User', key: 'name' },
  { title: 'Type', key: 'feedbackType' },
  { title: 'Rating', key: 'rating' },
  { title: 'Status', key: 'status' },
  { title: 'Public', key: 'isPublic' },
  { title: 'Actions', key: 'actions' },
]

const getStatusColor = (status: string) => {
  switch (status) {
    case 'approved':
      return 'success'
    case 'pending':
      return 'warning'
    case 'rejected':
      return 'error'
    default:
      return 'grey'
  }
}

const pageTitle = computed(() =>
  props.userType === 'admin'
    ? 'Feedback/Testimonial & Other Ratings'
    : 'Community Feedback & Testimonials',
)

const handleSearch = (query: string) => {
  console.log('Search query:', query)
  // Implement your search logic here
}

const handleSettingsClick = () => {
  console.log('Settings clicked')
  // Navigate to settings or open settings dialog
}
</script>

<template>
  <div>
    <!-- Page Header -->
    <v-row class="mb-6">
      <v-col cols="12" class="d-flex align-center justify-space-between">
        <div>
          <h1 class="text-h4 font-weight-bold text-primary mb-2">{{ pageTitle }}</h1>
          <p class="text-h6 text-grey-darken-1">
            {{
              userType === 'admin'
                ? 'Manage feedback and track ratings'
                : 'View testimonials and share your experience'
            }}
          </p>
        </div>

        <HeaderActions
          search-placeholder="Search feedback..."
          @search="handleSearch"
          @settings-click="handleSettingsClick"
        />
      </v-col>
    </v-row>

    <!-- Admin View: Analytics Cards -->
    <template v-if="userType === 'admin'">
      <v-row class="mb-6">
        <v-col cols="12" class="d-flex justify-end mb-2">
          <v-btn-toggle v-model="timeRange" color="primary" variant="outlined" mandatory>
            <v-btn value="weekly">Weekly</v-btn>
            <v-btn value="monthly">Monthly</v-btn>
            <v-btn value="yearly">Yearly</v-btn>
          </v-btn-toggle>
        </v-col>

        <!-- General Ratings Card -->
        <v-col cols="12" md="6">
          <v-card>
            <v-card-title class="d-flex align-center">
              <v-icon icon="mdi-chart-bar" class="mr-2"></v-icon>
              General Feedback Track
            </v-card-title>
            <v-card-text>
              <div class="mb-4">
                <div class="d-flex justify-space-between mb-2">
                  <span class="text-body-2">Positive (4-5 stars)</span>
                  <span class="font-weight-bold text-success">{{ generalRatings.positive }}</span>
                </div>
                <v-progress-linear
                  :model-value="
                    generalRatings.total
                      ? (generalRatings.positive / generalRatings.total) * 100
                      : 0
                  "
                  color="success"
                  height="24"
                  rounded
                >
                  <template v-slot:default>
                    <strong
                      >{{
                        generalRatings.total
                          ? Math.round((generalRatings.positive / generalRatings.total) * 100)
                          : 0
                      }}%</strong
                    >
                  </template>
                </v-progress-linear>
              </div>

              <div>
                <div class="d-flex justify-space-between mb-2">
                  <span class="text-body-2">Negative (1-3 stars)</span>
                  <span class="font-weight-bold text-error">{{ generalRatings.negative }}</span>
                </div>
                <v-progress-linear
                  :model-value="
                    generalRatings.total
                      ? (generalRatings.negative / generalRatings.total) * 100
                      : 0
                  "
                  color="error"
                  height="24"
                  rounded
                >
                  <template v-slot:default>
                    <strong
                      >{{
                        generalRatings.total
                          ? Math.round((generalRatings.negative / generalRatings.total) * 100)
                          : 0
                      }}%</strong
                    >
                  </template>
                </v-progress-linear>
              </div>

              <v-divider class="my-4"></v-divider>
              <div class="text-center">
                <div class="text-h4 font-weight-bold">{{ generalRatings.total }}</div>
                <div class="text-caption text-grey-darken-1">Total Feedback</div>
              </div>
            </v-card-text>
          </v-card>
        </v-col>

        <!-- Product Ratings Card -->
        <v-col cols="12" md="6">
          <v-card>
            <v-card-title class="d-flex align-center justify-space-between">
              <div>
                <v-icon icon="mdi-package-variant" class="mr-2"></v-icon>
                Product Feedback Track
              </div>
              <v-select
                v-model="selectedProduct"
                :items="products"
                variant="outlined"
                density="compact"
                hide-details
                style="max-width: 200px"
              ></v-select>
            </v-card-title>
            <v-card-text>
              <div class="mb-4">
                <div class="d-flex justify-space-between mb-2">
                  <span class="text-body-2">Positive (4-5 stars)</span>
                  <span class="font-weight-bold text-success">{{ productRatings.positive }}</span>
                </div>
                <v-progress-linear
                  :model-value="
                    productRatings.total
                      ? (productRatings.positive / productRatings.total) * 100
                      : 0
                  "
                  color="success"
                  height="24"
                  rounded
                >
                  <template v-slot:default>
                    <strong
                      >{{
                        productRatings.total
                          ? Math.round((productRatings.positive / productRatings.total) * 100)
                          : 0
                      }}%</strong
                    >
                  </template>
                </v-progress-linear>
              </div>

              <div>
                <div class="d-flex justify-space-between mb-2">
                  <span class="text-body-2">Negative (1-3 stars)</span>
                  <span class="font-weight-bold text-error">{{ productRatings.negative }}</span>
                </div>
                <v-progress-linear
                  :model-value="
                    productRatings.total
                      ? (productRatings.negative / productRatings.total) * 100
                      : 0
                  "
                  color="error"
                  height="24"
                  rounded
                >
                  <template v-slot:default>
                    <strong
                      >{{
                        productRatings.total
                          ? Math.round((productRatings.negative / productRatings.total) * 100)
                          : 0
                      }}%</strong
                    >
                  </template>
                </v-progress-linear>
              </div>

              <v-divider class="my-4"></v-divider>
              <div class="text-center">
                <div class="text-h4 font-weight-bold">{{ productRatings.total }}</div>
                <div class="text-caption text-grey-darken-1">Total Feedback</div>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Admin Feedback Management Table -->
      <v-row>
        <v-col cols="12">
          <v-card>
            <v-card-title>All Feedback Submissions</v-card-title>
            <v-card-text>
              <v-data-table :headers="adminTableHeaders" :items="feedbacks" item-value="id">
                <template v-slot:item.name="{ item }">
                  <div class="d-flex align-center">
                    <v-avatar size="40" class="mr-3">
                      <v-img :src="item.profilePic"></v-img>
                    </v-avatar>
                    <div>
                      <div class="font-weight-medium">{{ item.name }}</div>
                      <div class="text-caption text-grey-darken-1">{{ item.profession }}</div>
                    </div>
                  </div>
                </template>

                <template v-slot:item.feedbackType="{ item }">
                  <v-chip
                    :color="item.feedbackType === 'general' ? 'primary' : 'success'"
                    size="small"
                    variant="tonal"
                  >
                    {{ item.feedbackType }}
                    <span v-if="item.product"> - {{ item.product }}</span>
                  </v-chip>
                </template>

                <template v-slot:item.rating="{ item }">
                  <v-rating
                    :model-value="item.rating"
                    :length="5"
                    color="warning"
                    size="small"
                    readonly
                  ></v-rating>
                </template>

                <template v-slot:item.status="{ item }">
                  <v-chip :color="getStatusColor(item.status)" size="small" variant="tonal">
                    {{ item.status }}
                  </v-chip>
                </template>

                <template v-slot:item.isPublic="{ item }">
                  <v-switch
                    :model-value="item.isPublic"
                    @update:model-value="togglePublicStatus(item.id)"
                    hide-details
                    density="compact"
                  ></v-switch>
                </template>

                <template v-slot:item.actions="{ item }">
                  <v-menu>
                    <template v-slot:activator="{ props: menuProps }">
                      <v-btn
                        icon="mdi-dots-vertical"
                        size="small"
                        variant="text"
                        v-bind="menuProps"
                      ></v-btn>
                    </template>
                    <v-list>
                      <v-list-item
                        title="Approve"
                        prepend-icon="mdi-check"
                        @click="updateFeedbackStatus(item.id, 'approved')"
                      ></v-list-item>
                      <v-list-item
                        title="Reject"
                        prepend-icon="mdi-cancel"
                        @click="updateFeedbackStatus(item.id, 'rejected')"
                      ></v-list-item>
                      <v-divider></v-divider>
                      <v-list-item
                        title="Delete"
                        prepend-icon="mdi-delete"
                        @click="deleteFeedback(item.id)"
                      ></v-list-item>
                    </v-list>
                  </v-menu>
                </template>
              </v-data-table>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </template>

    <!-- Published Feedback Section (Both Views) -->
    <v-row :class="userType === 'admin' ? 'mt-6' : ''">
      <v-col cols="12">
        <v-card>
          <v-col cols="12" class="d-flex align-center justify-space-between">
            <v-card-title>
              <v-icon icon="mdi-forum" class="mr-2"></v-icon>
              Community Feedback & Testimonials
            </v-card-title>

            <v-btn
              v-if="userType === 'user'"
              color="primary"
              variant="elevated"
              prepend-icon="mdi-plus"
              @click="openFeedbackDialog"
            >
              Submit Feedback
            </v-btn>
          </v-col>
          <v-card-text>
            <v-row>
              <v-col
                v-for="feedback in publishedFeedback"
                :key="feedback.id"
                cols="12"
                md="6"
                lg="4"
              >
                <v-card variant="outlined" height="100%">
                  <v-card-text>
                    <div class="d-flex align-center mb-3">
                      <v-avatar size="50" class="mr-3">
                        <v-img :src="feedback.profilePic"></v-img>
                      </v-avatar>
                      <div class="flex-grow-1">
                        <div class="font-weight-bold text-h6">{{ feedback.name }}</div>
                        <div class="text-caption text-grey-darken-1">{{ feedback.profession }}</div>
                      </div>
                    </div>

                    <div class="d-flex align-center justify-space-between mb-3">
                      <v-rating
                        :model-value="feedback.rating"
                        :length="5"
                        color="warning"
                        size="small"
                        readonly
                      ></v-rating>
                      <v-chip
                        :color="feedback.feedbackType === 'general' ? 'primary' : 'success'"
                        size="small"
                        variant="tonal"
                      >
                        {{ feedback.feedbackType }}
                      </v-chip>
                    </div>

                    <p class="text-body-2 mb-3">{{ feedback.message }}</p>

                    <v-divider class="mb-2"></v-divider>
                    <div
                      class="d-flex align-center justify-space-between text-caption text-grey-darken-1"
                    >
                      <span>{{ new Date(feedback.submittedAt).toLocaleDateString() }}</span>
                      <span v-if="feedback.product">
                        <v-icon icon="mdi-tag" size="12"></v-icon> {{ feedback.product }}
                      </span>
                    </div>
                  </v-card-text>
                </v-card>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- User Feedback Dialog -->
    <v-dialog v-if="userType === 'user'" v-model="showFeedbackDialog" max-width="700px" persistent>
      <v-card>
        <v-card-title>
          <v-icon icon="mdi-comment-edit" class="mr-2"></v-icon>
          Submit Your Feedback
        </v-card-title>
        <v-card-text>
          <v-form @submit.prevent="handleSubmitFeedback">
            <v-row>
              <!-- User Info Display -->
              <v-col cols="12">
                <div class="d-flex align-center pa-4 bg-grey-lighten-4 rounded">
                  <v-avatar size="50" class="mr-3">
                    <v-img :src="userProfilePic"></v-img>
                  </v-avatar>
                  <div>
                    <div class="text-h6 font-weight-bold">{{ userName }}</div>
                    <div class="text-caption text-grey-darken-1">Submitting as</div>
                  </div>
                </div>
              </v-col>

              <v-col cols="12">
                <v-select
                  v-model="feedbackForm.profession"
                  label="Profession/Role *"
                  :items="professions"
                  variant="outlined"
                  required
                ></v-select>
              </v-col>

              <v-col cols="12">
                <v-radio-group v-model="feedbackForm.feedbackType" inline>
                  <v-radio label="General Feedback/Testimonial" value="general"></v-radio>
                  <v-radio label="Product Feedback" value="product"></v-radio>
                </v-radio-group>
              </v-col>

              <v-col v-if="feedbackForm.feedbackType === 'product'" cols="12">
                <v-select
                  v-model="feedbackForm.product"
                  label="Select Product *"
                  :items="products"
                  variant="outlined"
                  required
                ></v-select>
              </v-col>

              <v-col cols="12">
                <v-textarea
                  v-model="feedbackForm.message"
                  label="Your Feedback *"
                  variant="outlined"
                  rows="5"
                  required
                  placeholder="Share your thoughts, suggestions, or experience..."
                ></v-textarea>
              </v-col>

              <v-col cols="12">
                <div class="mb-2">
                  <label class="text-body-1 font-weight-medium">Rating *</label>
                </div>
                <v-rating
                  v-model="feedbackForm.rating"
                  :length="5"
                  color="warning"
                  active-color="warning"
                  size="large"
                  hover
                ></v-rating>
              </v-col>

              <v-col cols="12">
                <v-checkbox
                  v-model="feedbackForm.isPublic"
                  label="Allow this feedback to be displayed publicly"
                  hide-details
                ></v-checkbox>
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>

        <v-card-actions class="px-6 pb-6">
          <v-spacer></v-spacer>
          <v-btn variant="outlined" @click="showFeedbackDialog = false">Cancel</v-btn>
          <v-btn
            color="primary"
            variant="elevated"
            prepend-icon="mdi-send"
            @click="handleSubmitFeedback"
          >
            Submit Feedback
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Success Dialog -->
    <v-dialog v-model="showSuccessDialog" max-width="400px">
      <v-card>
        <v-card-text class="text-center pa-8">
          <v-icon icon="mdi-check-circle" size="64" color="success" class="mb-4"></v-icon>
          <h3 class="text-h5 font-weight-bold mb-4">Thank You!</h3>
          <p class="text-body-1">
            Your feedback has been submitted successfully. We appreciate your input!
          </p>
        </v-card-text>
        <v-card-actions class="justify-center pb-6">
          <v-btn color="primary" variant="elevated" @click="showSuccessDialog = false">OK</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<style scoped>
/* Component specific styles */
</style>
