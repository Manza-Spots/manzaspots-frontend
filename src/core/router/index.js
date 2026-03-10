import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/features/auth/store'
import ui from './ui'
import auth from './auth'
import legal from './legal'

const routes = [
  {
    path: '/',
    name: 'home',
    component: () => import('@/views/Home.vue'),
    meta: {
      requiresAuth: false,
    },
  },
  ...ui,
  ...auth,
  ...legal,
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/NotFound.vue'),
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()

  if (to.meta.requiresAuth && !authStore.isAuthtenticated) {
    next({ name: 'Login', query: { redirect: to.fullPath } })
  } else if (to.me === 'Login' && authStore.isAuthtenticated) {
    next({ name: 'Home' })
  } else {
    next()
  }
})

export default router
