export default [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/features/auth/views/LoginView.vue'),
    meta: {
      requiresAuth: false,
      requiresGuest: true,
      title: 'Iniciar Sesión',
    },
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('@/features/auth/views/RegisterView.vue'),
    meta: {
      requiresAuth: false,
      requiresGuest: true,
      title: 'Crear Cuenta',
    },
  },
]
