import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'landing',
      component: () => import('@/modules/landing/views/LandingPage.vue'),
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('@/modules/auth/views/LoginPage.vue'),
    },
    {
      path: '/user',
      name: 'user',
      component: () => import('@/layouts/UserLayout.vue'),
      children: [
        {
          path: 'dashboard',
          name: 'user-dashboard',
          component: () => import('@/modules/roles/components/Dashboard.vue'),
          props: { userType: 'user' },
        },
        {
          path: 'announcements',
          name: 'user-announcements',
          component: () => import('@/modules/roles/components/Announcements.vue'),
          props: { userType: 'user' },
        },
        {
          path: 'activities',
          name: 'user-activities',
          component: () => import('@/modules/roles/components/Activities.vue'),
          props: { userType: 'user' },
        },
        {
          path: 'products',
          name: 'user-products',
          component: () => import('@/modules/roles/components/Products.vue'),
          props: { userType: 'user' },
        },
        {
          path: 'trainings',
          name: 'user-trainings',
          component: () => import('@/modules/roles/components/Trainings.vue'),
          props: { userType: 'user' },
        },
        {
          path: 'feedback',
          name: 'user-feedback',
          component: () => import('@/modules/roles/components/Feedback.vue'),
          props: { userType: 'user' },
        },
      ],
    },
    {
      path: '/admin',
      name: 'admin',
      component: () => import('@/layouts/AdminLayout.vue'),
      children: [
        {
          path: 'dashboard',
          name: 'admin-dashboard',
          component: () => import('@/modules/roles/components/Dashboard.vue'),
          props: { userType: 'admin' },
        },
        {
          path: 'announcements',
          name: 'admin-announcements',
          component: () => import('@/modules/roles/components/Announcements.vue'),
          props: { userType: 'admin' },
        },
        {
          path: 'activities',
          name: 'admin-activities',
          component: () => import('@/modules/roles/components/Activities.vue'),
          props: { userType: 'admin' },
        },
        {
          path: 'products',
          name: 'admin-products',
          component: () => import('@/modules/roles/components/Products.vue'),
          props: { userType: 'admin' },
        },
        {
          path: 'trainings',
          name: 'admin-trainings',
          component: () => import('@/modules/roles/components/Trainings.vue'),
          props: { userType: 'admin' },
        },
        {
          path: 'feedback',
          name: 'admin-feedback',
          component: () => import('@/modules/roles/components/Feedback.vue'),
          props: { userType: 'admin' },
        },
      ],
    },
  ],
})

export default router
