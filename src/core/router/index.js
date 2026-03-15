import { createRouter, createWebHistory } from 'vue-router'
import { mainGuard } from './guards'
import ui from './ui'
import auth from './auth'
import legal from './legal'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('@/views/Home.vue'),
    meta: {
      requiresAuth: false,
      title: 'Inicio',
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
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    } else {
      return { top: 0 }
    }
  },
})

router.beforeEach(mainGuard)

router.afterEach((to, from) => {
  if (import.meta.env.DEV) {
    console.log('🔀 Navigation:', from.name || from.path, '→', to.name || to.path)
  }
})
export default router
