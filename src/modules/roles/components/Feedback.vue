<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useFeedback } from '../composables/useFeedback'
import { useInfiniteScroll } from '@/composables/useInfiniteScroll'
import HeaderActions from './shared/HeaderActions.vue'

interface Props {
  userType: 'admin' | 'user'
}

const props = defineProps<Props>()

// Get user info from auth store
const authStore = useAuthStore()
const userName = computed(() => authStore.fullName)
const userEmail = computed(() => authStore.userEmail)

// Use feedback composable
const {
  feedbacks,
  loading,
  error,
  feedbacksTotal,
  feedbacksPage,
  itemsPerPage,
  feedbacksTotalPages,
  fetchFeedbacks,
  loadMoreFeedbacks,
  searchFeedbacks,
  clearFeedbacksSearch,
  createFeedback,
  updateFeedback,
  deleteFeedback,
  calculateRatings,
  goToFeedbacksPage,
  setupRealtimeSubscription,
  cleanupRealtimeSubscription,
} = useFeedback()

// Infinite scroll for published feedback cards
const { isLoading: isLoadingMore } = useInfiniteScroll({
  onLoadMore: async () => {
    if (!loading.value && publishedFeedback.value.length > 0) {
      await loadMoreFeedbacks()
    }
  },
  hasMore: () => feedbacksPage.value < feedbacksTotalPages.value,
})

// Dialog states
const showFeedbackDialog = ref(false)
const showSuccessDialog = ref(false)
const showDeleteDialog = ref(false)
const feedbackToDelete = ref<number | null>(null)

// Snackbar
const snackbar = ref(false)
const snackbarMessage = ref('')
const snackbarColor = ref('success')

const showSnackbar = (message: string, color: 'success' | 'error' | 'info' = 'success') => {
  snackbarMessage.value = message
  snackbarColor.value = color
  snackbar.value = true
}

const feedbackForm = ref({
  profession: '',
  feedbackType: 'general' as 'general' | 'product',
  product: '',
  message: '',
  rating: 5,
  isPublic: true,
  profilePic: '',
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

// Load feedbacks on component mount
onMounted(async () => {
  await fetchFeedbacks()
  setupRealtimeSubscription()
})

onUnmounted(() => {
  cleanupRealtimeSubscription()
})

// Computed values
const generalRatings = computed(() => calculateRatings('general'))
const productRatings = computed(() => calculateRatings('product', selectedProduct.value))

const publishedFeedback = computed(() =>
  feedbacks.value.filter((f) => f.status === 'approved' && f.is_public),
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
    profilePic: 'https://i.pravatar.cc/150?img=' + Math.floor(Math.random() * 70),
  }
  showFeedbackDialog.value = true
}

const handleSubmitFeedback = async () => {
  try {
    await createFeedback({
      profession: feedbackForm.value.profession,
      feedback_type: feedbackForm.value.feedbackType,
      product: feedbackForm.value.feedbackType === 'product' ? feedbackForm.value.product : null,
      message: feedbackForm.value.message,
      rating: feedbackForm.value.rating,
      is_public: feedbackForm.value.isPublic,
      profile_pic: feedbackForm.value.profilePic,
    })

    showFeedbackDialog.value = false
    showSuccessDialog.value = true
    showSnackbar('Feedback submitted successfully!', 'success')
  } catch (err) {
    showSnackbar('Failed to submit feedback. Please try again.', 'error')
  }
}

// Admin functions
const handleUpdateFeedbackStatus = async (
  feedbackId: number,
  newStatus: 'pending' | 'approved' | 'rejected',
) => {
  if (props.userType === 'admin') {
    try {
      await updateFeedback(feedbackId, { status: newStatus })
      showSnackbar(`Feedback ${newStatus} successfully!`, 'success')
    } catch (err) {
      showSnackbar('Failed to update feedback status.', 'error')
    }
  }
}

const confirmDeleteFeedback = (feedbackId: number) => {
  feedbackToDelete.value = feedbackId
  showDeleteDialog.value = true
}

const handleDeleteFeedback = async () => {
  if (feedbackToDelete.value !== null) {
    try {
      await deleteFeedback(feedbackToDelete.value)
      showSnackbar('Feedback deleted successfully!', 'success')
    } catch (err) {
      showSnackbar('Failed to delete feedback.', 'error')
    } finally {
      showDeleteDialog.value = false
      feedbackToDelete.value = null
    }
  }
}

const handleTogglePublicStatus = async (feedbackId: number, currentStatus: boolean) => {
  if (props.userType === 'admin') {
    try {
      await updateFeedback(feedbackId, { is_public: !currentStatus })
      showSnackbar('Visibility updated successfully!', 'success')
    } catch (err) {
      showSnackbar('Failed to update visibility.', 'error')
    }
  }
}

const adminTableHeaders = [
  { title: 'User', key: 'user_name' },
  { title: 'Type', key: 'feedback_type' },
  { title: 'Rating', key: 'rating' },
  { title: 'Status', key: 'status' },
  { title: 'Public', key: 'is_public' },
  { title: 'Actions', key: 'actions', sortable: false },
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

const pageSubtitle = computed(() =>
  props.userType === 'admin'
    ? 'Manage feedback and track ratings'
    : 'View testimonials and share your experience',
)

const handleSearch = async (query: string) => {
  if (query) {
    await searchFeedbacks(query)
  } else {
    await clearFeedbacksSearch()
  }
}

const handleClearSearch = async () => {
  await clearFeedbacksSearch()
}

const handleSettingsClick = () => {
  console.log('Settings clicked')
}
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

        <HeaderActions
          search-placeholder="Search feedback..."
          :user-type="userType"
          @search="handleSearch"
          @clear-search="handleClearSearch"
          @settings-click="handleSettingsClick"
        />
      </v-col>
    </v-row>

    <!-- Loading State -->
    <v-row v-if="loading && feedbacks.length === 0" class="mb-6">
      <v-col cols="12" class="text-center py-12">
        <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
        <p class="text-h6 text-grey-darken-1 mt-4">Loading feedbacks...</p>
      </v-col>
    </v-row>

    <!-- Content -->
    <template v-else>
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
              <v-card-title class="d-flex justify-space-between align-center">
                <div class="d-flex align-center gap-4">
                  <span>All Feedback Submissions</span>
                  <v-chip v-if="feedbacksTotal > 0" color="primary" size="small"
                    >{{ feedbacksTotal }} total</v-chip
                  >
                </div>
                <v-pagination
                  v-if="feedbacks.length > 0"
                  v-model="feedbacksPage"
                  :length="feedbacksTotalPages"
                  :total-visible="5"
                  size="small"
                  rounded="circle"
                  @update:model-value="goToFeedbacksPage"
                ></v-pagination>
              </v-card-title>
              <v-card-text>
                <!-- Empty State for Admin -->
                <div v-if="feedbacks.length === 0" class="text-center py-12">
                  <v-icon icon="mdi-comment-off-outline" size="64" color="grey"></v-icon>
                  <p class="text-h6 text-grey-darken-1 mt-4">No feedback submissions yet</p>
                  <p class="text-body-2 text-grey">
                    Feedback from users will appear here once submitted
                  </p>
                </div>

                <v-data-table
                  v-else
                  :headers="adminTableHeaders"
                  :items="feedbacks"
                  item-value="id"
                  :loading="loading"
                  hide-default-footer
                >
                  <template v-slot:item.user_name="{ item }">
                    <div class="d-flex align-center">
                      <v-avatar size="40" class="mr-3">
                        <v-img
                          :src="item.profile_pic || 'https://i.pravatar.cc/150?img=12'"
                        ></v-img>
                      </v-avatar>
                      <div>
                        <div class="font-weight-medium">{{ item.user_name }}</div>
                        <div class="text-caption text-grey-darken-1">{{ item.profession }}</div>
                      </div>
                    </div>
                  </template>

                  <template v-slot:item.feedback_type="{ item }">
                    <v-chip
                      :color="item.feedback_type === 'general' ? 'primary' : 'success'"
                      size="small"
                      variant="tonal"
                    >
                      {{ item.feedback_type }}
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

                  <template v-slot:item.is_public="{ item }">
                    <v-switch
                      :model-value="item.is_public"
                      @update:model-value="handleTogglePublicStatus(item.id, item.is_public)"
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
                          @click="handleUpdateFeedbackStatus(item.id, 'approved')"
                        ></v-list-item>
                        <v-list-item
                          title="Reject"
                          prepend-icon="mdi-cancel"
                          @click="handleUpdateFeedbackStatus(item.id, 'rejected')"
                        ></v-list-item>
                        <v-divider></v-divider>
                        <v-list-item
                          title="Delete"
                          prepend-icon="mdi-delete"
                          @click="confirmDeleteFeedback(item.id)"
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
              <!-- Empty State for Published Feedback -->
              <div v-if="publishedFeedback.length === 0" class="text-center py-12">
                <v-icon icon="mdi-comment-off-outline" size="64" color="grey"></v-icon>
                <p class="text-h6 text-grey-darken-1 mt-4">No published feedback yet</p>
                <p class="text-body-2 text-grey">
                  {{
                    userType === 'user'
                      ? 'Be the first to share your experience!'
                      : 'Approved public feedback will appear here'
                  }}
                </p>
              </div>

              <v-row v-else>
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
                          <v-img
                            :src="feedback.profile_pic || 'https://i.pravatar.cc/150?img=12'"
                          ></v-img>
                        </v-avatar>
                        <div class="flex-grow-1">
                          <div class="font-weight-bold text-h6">{{ feedback.user_name }}</div>
                          <div class="text-caption text-grey-darken-1">
                            {{ feedback.profession }}
                          </div>
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
                          :color="feedback.feedback_type === 'general' ? 'primary' : 'success'"
                          size="small"
                          variant="tonal"
                        >
                          {{ feedback.feedback_type }}
                        </v-chip>
                      </div>

                      <p class="text-body-2 mb-3">{{ feedback.message }}</p>

                      <v-divider class="mb-2"></v-divider>
                      <div
                        class="d-flex align-center justify-space-between text-caption text-grey-darken-1"
                      >
                        <span>{{ new Date(feedback.created_at).toLocaleDateString() }}</span>
                        <span v-if="feedback.product">
                          <v-icon icon="mdi-tag" size="12"></v-icon> {{ feedback.product }}
                        </span>
                      </div>
                    </v-card-text>
                  </v-card>
                </v-col>
              </v-row>

              <!-- Loading More Indicator -->
              <v-row v-if="isLoadingMore && publishedFeedback.length > 0" class="mt-4">
                <v-col cols="12" class="text-center">
                  <v-progress-circular
                    indeterminate
                    color="primary"
                    size="48"
                  ></v-progress-circular>
                  <p class="text-body-2 text-grey-darken-1 mt-2">Loading more feedback...</p>
                </v-col>
              </v-row>

              <!-- End of List Indicator -->
              <v-row
                v-if="
                  !loading &&
                  !isLoadingMore &&
                  publishedFeedback.length > 0 &&
                  feedbacksPage >= feedbacksTotalPages
                "
                class="mt-4"
              >
                <v-col cols="12" class="text-center">
                  <v-divider class="mb-4"></v-divider>
                  <p class="text-body-2 text-grey">You've reached the end of the list</p>
                </v-col>
              </v-row>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </template>

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
                    <v-img
                      :src="feedbackForm.profilePic || 'https://i.pravatar.cc/150?img=12'"
                    ></v-img>
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

    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="showDeleteDialog" max-width="500px">
      <v-card>
        <v-card-title class="text-h5">Confirm Delete</v-card-title>
        <v-card-text>
          Are you sure you want to delete this feedback? This action cannot be undone.
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="showDeleteDialog = false">Cancel</v-btn>
          <v-btn color="error" variant="elevated" @click="handleDeleteFeedback">Delete</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Snackbar for notifications -->
    <v-snackbar v-model="snackbar" :color="snackbarColor" :timeout="3000" location="top">
      {{ snackbarMessage }}
      <template v-slot:actions>
        <v-btn variant="text" @click="snackbar = false">Close</v-btn>
      </template>
    </v-snackbar>
  </div>
</template>

<style scoped>
/* Component specific styles */
</style>
