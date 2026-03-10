export default [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/features/auth/views/LoginView.vue'),
    meta: {
      requiresAuth: false,
    },
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('@/features/auth/views/RegisterView.vue'),
    meta: {
      requiresAuth: false,
    },
  },
]
