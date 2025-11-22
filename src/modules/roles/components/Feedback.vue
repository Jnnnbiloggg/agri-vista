<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, inject, type Ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useFeedback } from '../composables/useFeedback'
import { useProducts } from '../composables/useProducts'
import { useInfiniteScroll } from '@/composables/useInfiniteScroll'
import HeaderActions from './shared/HeaderActions.vue'
import { useSnackbar } from '@/composables/useSnackbar'
import { useFormDialog } from '@/composables/useFormDialog'
import AppSnackbar from '@/components/shared/AppSnackbar.vue'
import DeleteConfirmDialog from '@/components/shared/DeleteConfirmDialog.vue'
import { useDeleteConfirmation } from '@/composables/useDeleteConfirmation'
import { usePageActions } from '@/composables/usePageActions'
import DrawerToggle from '@/components/shared/DrawerToggle.vue'
import PageHeader from './shared/PageHeader.vue'

interface Props {
  userType: 'admin' | 'user'
}

const props = defineProps<Props>()

const drawer = inject<Ref<boolean>>('drawer')

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

// Use products composable to fetch products for the dropdown
const { products: productsList, fetchProducts: fetchProductsList } = useProducts()

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
const showSuccessDialog = ref(false)

// Use snackbar composable
const { snackbar, snackbarMessage, snackbarColor, showSnackbar } = useSnackbar()

// Use delete confirmation composable
const deleteConfirmation = useDeleteConfirmation<number>({
  onDelete: async (feedbackId) => {
    const result = await deleteFeedback(feedbackId)
    return { success: result !== undefined }
  },
  showSnackbar,
  successMessage: 'Feedback deleted successfully',
  errorMessage: 'Failed to delete feedback',
})

// Use page actions composable
const { handleSearch, handleClearSearch, handleSettingsClick } = usePageActions({
  userType: props.userType,
  onSearch: async (query: string) => {
    if (query) {
      await searchFeedbacks(query)
    } else {
      await clearFeedbacksSearch()
    }
  },
})

// Feedback dialog (user)
interface FeedbackForm {
  profession: string
  feedbackType: 'general' | 'product'
  product: string
  message: string
  rating: number
  isPublic: boolean
}

const feedbackDialog = useFormDialog<FeedbackForm>({
  initialData: {
    profession: '',
    feedbackType: 'general',
    product: '',
    message: '',
    rating: 5,
    isPublic: true,
  },
  onSubmit: async (formData) => {
    try {
      await createFeedback({
        profession: formData.profession,
        feedback_type: formData.feedbackType,
        product: formData.feedbackType === 'product' ? formData.product : null,
        message: formData.message,
        rating: formData.rating,
        is_public: formData.isPublic,
      })

      showSuccessDialog.value = true
      return { success: true }
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to submit feedback' }
    }
  },
  showSnackbar,
})

// Edit feedback dialog (user)
const editFeedbackDialog = useFormDialog<FeedbackForm & { id: number }>({
  initialData: {
    id: 0,
    profession: '',
    feedbackType: 'general',
    product: '',
    message: '',
    rating: 5,
    isPublic: true,
  },
  onSubmit: async (formData) => {
    try {
      await updateFeedback(formData.id, {
        profession: formData.profession,
        feedback_type: formData.feedbackType,
        product: formData.feedbackType === 'product' ? formData.product : null,
        message: formData.message,
        rating: formData.rating,
        is_public: formData.isPublic,
      })

      showSnackbar('Feedback updated successfully!', 'success')
      return { success: true }
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to update feedback' }
    }
  },
  showSnackbar,
})

const professions = [
  { title: 'Professor', value: 'professor' },
  { title: 'Student', value: 'student' },
  { title: 'Guest', value: 'guest' },
  { title: 'Researcher', value: 'researcher' },
  { title: 'Business Owner', value: 'business-owner' },
  { title: 'Other', value: 'other' },
]

// Computed property to get products from database
const products = computed(() =>
  productsList.value.map((product) => ({
    title: product.name,
    value: product.name.toLowerCase(),
  })),
)

// Admin analytics
const timeRange = ref<'weekly' | 'monthly' | 'yearly'>('monthly')
const selectedProduct = ref('strawberry')

// Load feedbacks and products on component mount
onMounted(async () => {
  await fetchFeedbacks()
  await fetchProductsList({ itemsPerPage: 1000 }) // Fetch all products for dropdown
  setupRealtimeSubscription()
})

onUnmounted(() => {
  cleanupRealtimeSubscription()
})

// Computed values
const generalRatings = computed(() => calculateRatings('general'))
const productRatings = computed(() => calculateRatings('product', selectedProduct.value))

const publishedFeedback = computed(() => feedbacks.value.filter((f) => f.is_public))

const myFeedback = computed(() => feedbacks.value.filter((f) => f.user_id === authStore.userId))

// User functions
const openFeedbackDialog = () => feedbackDialog.openForCreate()

const openEditFeedbackDialog = (feedback: any) => {
  editFeedbackDialog.formData.value = {
    id: feedback.id,
    profession: feedback.profession,
    feedbackType: feedback.feedback_type,
    product: feedback.product || '',
    message: feedback.message,
    rating: feedback.rating,
    isPublic: feedback.is_public,
  }
  editFeedbackDialog.isOpen.value = true
}

const confirmDeleteFeedback = (feedbackId: number) => {
  deleteConfirmation.openDialog(feedbackId)
}

const handleTogglePublicStatus = async (feedbackId: number, currentStatus: boolean) => {
  try {
    await updateFeedback(feedbackId, { is_public: !currentStatus })
    showSnackbar('Visibility updated successfully!', 'success')
  } catch (err) {
    showSnackbar('Failed to update visibility.', 'error')
  }
}

// My Feedback Dialog
const showMyFeedbackDialog = ref(false)
const openMyFeedbackDialog = () => {
  showMyFeedbackDialog.value = true
}

const adminTableHeaders = [
  { title: 'User', key: 'user_name' },
  { title: 'Type', key: 'feedback_type' },
  { title: 'Rating', key: 'rating' },
  { title: 'Visibility', key: 'is_public' },
  { title: 'Actions', key: 'actions', sortable: false },
]

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
</script>

<template>
  <div>
    <!-- Page Header -->
    <PageHeader
      :title="pageTitle"
      :subtitle="pageSubtitle"
      :user-type="userType"
      search-placeholder="Search activities..."
      @search="handleSearch"
      @settings-click="handleSettingsClick"
    />

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
            <v-btn-toggle
              v-model="timeRange"
              color="primary"
              variant="outlined"
              mandatory
              style="gap: 8px"
            >
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
                <div class="d-flex align-center gap-2">
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
                      <v-avatar size="40" class="mr-3" color="primary">
                        <span class="text-white">{{ item.user_name.charAt(0).toUpperCase() }}</span>
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

                  <template v-slot:item.is_public="{ item }">
                    <v-chip
                      :color="item.is_public ? 'success' : 'grey'"
                      size="small"
                      variant="tonal"
                    >
                      {{ item.is_public ? 'Public' : 'Private' }}
                    </v-chip>
                  </template>

                  <template v-slot:item.actions="{ item }">
                    <v-btn
                      icon="mdi-delete"
                      size="small"
                      variant="text"
                      color="error"
                      @click="confirmDeleteFeedback(item.id)"
                    ></v-btn>
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

              <div v-if="userType === 'user'" class="d-flex" style="gap: 8px">
                <v-btn
                  color="secondary"
                  variant="outlined"
                  prepend-icon="mdi-account-box"
                  @click="openMyFeedbackDialog"
                >
                  My Feedback
                </v-btn>
                <v-btn
                  color="primary"
                  variant="elevated"
                  prepend-icon="mdi-plus"
                  @click="openFeedbackDialog"
                >
                  Submit Feedback
                </v-btn>
              </div>
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
                        <v-avatar size="50" class="mr-3" color="primary">
                          <span class="text-white text-h6">{{
                            feedback.user_name.charAt(0).toUpperCase()
                          }}</span>
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
    <v-dialog
      v-if="userType === 'user'"
      v-model="feedbackDialog.isOpen.value"
      max-width="700px"
      persistent
    >
      <v-card>
        <v-card-title>
          <v-icon icon="mdi-comment-edit" class="mr-2"></v-icon>
          Submit Your Feedback
        </v-card-title>
        <v-card-text>
          <v-form @submit.prevent="feedbackDialog.submit">
            <v-row>
              <!-- User Info Display -->
              <v-col cols="12">
                <div class="d-flex align-center pa-4 bg-grey-lighten-4 rounded">
                  <v-avatar size="50" class="mr-3" color="primary">
                    <span class="text-white text-h6">{{ userName.charAt(0).toUpperCase() }}</span>
                  </v-avatar>
                  <div>
                    <div class="text-h6 font-weight-bold">{{ userName }}</div>
                    <div class="text-caption text-grey-darken-1">Submitting as</div>
                  </div>
                </div>
              </v-col>

              <v-col cols="12">
                <v-select
                  v-model="feedbackDialog.formData.value.profession"
                  label="Profession/Role *"
                  :items="professions"
                  variant="outlined"
                  required
                ></v-select>
              </v-col>

              <v-col cols="12">
                <v-radio-group v-model="feedbackDialog.formData.value.feedbackType" inline>
                  <v-radio label="General Feedback/Testimonial" value="general"></v-radio>
                  <v-radio label="Product Feedback" value="product"></v-radio>
                </v-radio-group>
              </v-col>

              <v-col v-if="feedbackDialog.formData.value.feedbackType === 'product'" cols="12">
                <v-select
                  v-model="feedbackDialog.formData.value.product"
                  label="Select Product *"
                  :items="products"
                  variant="outlined"
                  required
                ></v-select>
              </v-col>

              <v-col cols="12">
                <v-textarea
                  v-model="feedbackDialog.formData.value.message"
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
                  v-model="feedbackDialog.formData.value.rating"
                  :length="5"
                  color="warning"
                  active-color="warning"
                  size="large"
                  hover
                ></v-rating>
              </v-col>

              <v-col cols="12">
                <v-checkbox
                  v-model="feedbackDialog.formData.value.isPublic"
                  label="Allow this feedback to be displayed publicly"
                  hide-details
                ></v-checkbox>
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>

        <v-card-actions class="px-6 pb-6">
          <v-spacer></v-spacer>
          <v-btn variant="outlined" @click="feedbackDialog.close">Cancel</v-btn>
          <v-btn
            color="primary"
            variant="elevated"
            prepend-icon="mdi-send"
            :loading="feedbackDialog.isSubmitting.value"
            @click="feedbackDialog.submit"
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
    <DeleteConfirmDialog
      v-model="deleteConfirmation.isOpen.value"
      :is-deleting="deleteConfirmation.isDeleting.value"
      title="Confirm Delete"
      message="Are you sure you want to delete this feedback? This action cannot be undone."
      @confirm="deleteConfirmation.confirmDelete"
      @cancel="deleteConfirmation.closeDialog"
    />

    <!-- My Feedback Dialog -->
    <v-dialog v-if="userType === 'user'" v-model="showMyFeedbackDialog" max-width="1000px">
      <v-card>
        <v-card-title class="d-flex align-center justify-space-between">
          <div>
            <v-icon icon="mdi-account-box" class="mr-2"></v-icon>
            My Feedback
          </div>
          <v-btn icon="mdi-close" variant="text" @click="showMyFeedbackDialog = false"></v-btn>
        </v-card-title>
        <v-card-text>
          <!-- Empty State -->
          <div v-if="myFeedback.length === 0" class="text-center py-12">
            <v-icon icon="mdi-comment-off-outline" size="64" color="grey"></v-icon>
            <p class="text-h6 text-grey-darken-1 mt-4">No feedback submitted yet</p>
            <p class="text-body-2 text-grey">Share your thoughts and experiences!</p>
          </div>

          <!-- My Feedback List -->
          <v-row v-else>
            <v-col v-for="feedback in myFeedback" :key="feedback.id" cols="12">
              <v-card variant="outlined">
                <v-card-text>
                  <div class="d-flex justify-space-between align-start mb-3">
                    <div class="flex-grow-1">
                      <div class="d-flex align-center mb-2">
                        <v-chip
                          :color="feedback.feedback_type === 'general' ? 'primary' : 'success'"
                          size="small"
                          variant="tonal"
                          class="mr-2"
                        >
                          {{ feedback.feedback_type }}
                          <span v-if="feedback.product"> - {{ feedback.product }}</span>
                        </v-chip>
                        <v-chip
                          :color="feedback.is_public ? 'success' : 'grey'"
                          size="small"
                          variant="tonal"
                        >
                          <v-icon
                            :icon="feedback.is_public ? 'mdi-eye' : 'mdi-eye-off'"
                            size="small"
                            class="mr-1"
                          ></v-icon>
                          {{ feedback.is_public ? 'Public' : 'Private' }}
                        </v-chip>
                      </div>
                      <v-rating
                        :model-value="feedback.rating"
                        :length="5"
                        color="warning"
                        size="small"
                        readonly
                        class="mb-2"
                      ></v-rating>
                      <p class="text-body-2">{{ feedback.message }}</p>
                      <div class="text-caption text-grey-darken-1 mt-2">
                        Submitted: {{ new Date(feedback.created_at).toLocaleString() }}
                      </div>
                    </div>
                    <div class="d-flex gap-2 ml-4">
                      <v-btn
                        icon="mdi-pencil"
                        size="small"
                        variant="text"
                        color="primary"
                        @click="openEditFeedbackDialog(feedback)"
                      ></v-btn>
                      <v-btn
                        :icon="feedback.is_public ? 'mdi-eye-off' : 'mdi-eye'"
                        size="small"
                        variant="text"
                        color="secondary"
                        @click="handleTogglePublicStatus(feedback.id, feedback.is_public)"
                      ></v-btn>
                      <v-btn
                        icon="mdi-delete"
                        size="small"
                        variant="text"
                        color="error"
                        @click="confirmDeleteFeedback(feedback.id)"
                      ></v-btn>
                    </div>
                  </div>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>
    </v-dialog>

    <!-- Edit Feedback Dialog -->
    <v-dialog
      v-if="userType === 'user'"
      v-model="editFeedbackDialog.isOpen.value"
      max-width="700px"
      persistent
    >
      <v-card>
        <v-card-title>
          <v-icon icon="mdi-pencil" class="mr-2"></v-icon>
          Edit Your Feedback
        </v-card-title>
        <v-card-text>
          <v-form @submit.prevent="editFeedbackDialog.submit">
            <v-row>
              <v-col cols="12">
                <v-select
                  v-model="editFeedbackDialog.formData.value.profession"
                  label="Profession/Role *"
                  :items="professions"
                  variant="outlined"
                  required
                ></v-select>
              </v-col>

              <v-col cols="12">
                <v-radio-group v-model="editFeedbackDialog.formData.value.feedbackType" inline>
                  <v-radio label="General Feedback/Testimonial" value="general"></v-radio>
                  <v-radio label="Product Feedback" value="product"></v-radio>
                </v-radio-group>
              </v-col>

              <v-col v-if="editFeedbackDialog.formData.value.feedbackType === 'product'" cols="12">
                <v-select
                  v-model="editFeedbackDialog.formData.value.product"
                  label="Select Product *"
                  :items="products"
                  variant="outlined"
                  required
                ></v-select>
              </v-col>

              <v-col cols="12">
                <v-textarea
                  v-model="editFeedbackDialog.formData.value.message"
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
                  v-model="editFeedbackDialog.formData.value.rating"
                  :length="5"
                  color="warning"
                  active-color="warning"
                  size="large"
                  hover
                ></v-rating>
              </v-col>

              <v-col cols="12">
                <v-checkbox
                  v-model="editFeedbackDialog.formData.value.isPublic"
                  label="Allow this feedback to be displayed publicly"
                  hide-details
                ></v-checkbox>
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>

        <v-card-actions class="px-6 pb-6">
          <v-spacer></v-spacer>
          <v-btn variant="outlined" @click="editFeedbackDialog.close">Cancel</v-btn>
          <v-btn
            color="primary"
            variant="elevated"
            prepend-icon="mdi-content-save"
            :loading="editFeedbackDialog.isSubmitting.value"
            @click="editFeedbackDialog.submit"
          >
            Save Changes
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
  </div>
</template>

<style scoped>
/* Component specific styles */
</style>
