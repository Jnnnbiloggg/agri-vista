import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'landing',
      component: () => import('@/modules/landing/views/LandingPage.vue'),
      meta: { requiresAuth: false },
    },
    // user selection page
    {
      path: '/select-user',
      name: 'select-user',
      component: () => import('@/modules/auth/views/SelectUserPage.vue'),
      meta: { requiresAuth: false },
    },
    {
      path: '/account',
      name: 'account',
      component: () => import('@/modules/auth/views/AuthPage.vue'),
      meta: { requiresAuth: false },
    },
    {
      path: '/user',
      name: 'user',
      component: () => import('@/layouts/UserLayout.vue'),
      meta: { requiresAuth: true, requiresUser: true },
      children: [
        {
          path: 'dashboard',
          name: 'user-dashboard',
          component: () => import('@/modules/roles/components/Dashboard.vue'),
          props: { userType: 'user' },
          meta: { requiresAuth: true, requiresUser: true },
        },
        {
          path: 'announcements',
          name: 'user-announcements',
          component: () => import('@/modules/roles/components/Announcements.vue'),
          props: { userType: 'user' },
          meta: { requiresAuth: true, requiresUser: true },
        },
        {
          path: 'activities',
          name: 'user-activities',
          component: () => import('@/modules/roles/components/Activities.vue'),
          props: { userType: 'user' },
          meta: { requiresAuth: true, requiresUser: true },
        },
        {
          path: 'products',
          name: 'user-products',
          component: () => import('@/modules/roles/components/Products.vue'),
          props: { userType: 'user' },
          meta: { requiresAuth: true, requiresUser: true },
        },
        {
          path: 'trainings',
          name: 'user-trainings',
          component: () => import('@/modules/roles/components/Trainings.vue'),
          props: { userType: 'user' },
          meta: { requiresAuth: true, requiresUser: true },
        },
        {
          path: 'feedback',
          name: 'user-feedback',
          component: () => import('@/modules/roles/components/Feedback.vue'),
          props: { userType: 'user' },
          meta: { requiresAuth: true, requiresUser: true },
        },
      ],
    },
    {
      path: '/admin',
      name: 'admin',
      component: () => import('@/layouts/AdminLayout.vue'),
      meta: { requiresAuth: true, requiresAdmin: true },
      children: [
        {
          path: 'dashboard',
          name: 'admin-dashboard',
          component: () => import('@/modules/roles/components/Dashboard.vue'),
          props: { userType: 'admin' },
          meta: { requiresAuth: true, requiresAdmin: true },
        },
        {
          path: 'announcements',
          name: 'admin-announcements',
          component: () => import('@/modules/roles/components/Announcements.vue'),
          props: { userType: 'admin' },
          meta: { requiresAuth: true, requiresAdmin: true },
        },
        {
          path: 'activities',
          name: 'admin-activities',
          component: () => import('@/modules/roles/components/Activities.vue'),
          props: { userType: 'admin' },
          meta: { requiresAuth: true, requiresAdmin: true },
        },
        {
          path: 'products',
          name: 'admin-products',
          component: () => import('@/modules/roles/components/Products.vue'),
          props: { userType: 'admin' },
          meta: { requiresAuth: true, requiresAdmin: true },
        },
        {
          path: 'trainings',
          name: 'admin-trainings',
          component: () => import('@/modules/roles/components/Trainings.vue'),
          props: { userType: 'admin' },
          meta: { requiresAuth: true, requiresAdmin: true },
        },
        {
          path: 'feedback',
          name: 'admin-feedback',
          component: () => import('@/modules/roles/components/Feedback.vue'),
          props: { userType: 'admin' },
          meta: { requiresAuth: true, requiresAdmin: true },
        },
      ],
    },
  ],
})

// Navigation guard
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()

  // Wait for auth to initialize
  if (authStore.isLoading) {
    // If auth is still loading, wait for it
    const unwatch = authStore.$subscribe(() => {
      if (!authStore.isLoading) {
        unwatch()
        checkAuth()
      }
    })
  } else {
    checkAuth()
  }

  function checkAuth() {
    const requiresAuth = to.meta.requiresAuth
    const requiresAdmin = to.meta.requiresAdmin
    const requiresUser = to.meta.requiresUser

    // If route doesn't require auth, allow access
    if (!requiresAuth) {
      next()
      return
    }

    // If route requires auth and user is not authenticated
    if (requiresAuth && !authStore.isAuthenticated) {
      next({ name: 'account', query: { redirect: to.fullPath } })
      return
    }

    // If route requires admin access
    if (requiresAdmin && !authStore.isAdmin) {
      next({ name: authStore.isAuthenticated ? 'user-dashboard' : 'account' })
      return
    }

    // If route requires user access (non-admin trying to access admin routes)
    if (requiresUser && authStore.isAdmin) {
      next({ name: 'admin-dashboard' })
      return
    }

    // All checks passed
    next()
  }
})

export default router
