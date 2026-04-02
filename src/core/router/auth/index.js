export default [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/features/auth/views/LoginView.vue'),
    meta: {
      requiresAuth: false,
      title: 'Iniciar Sesión',
    },
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('@/features/auth/views/RegisterView.vue'),
    meta: {
      requiresAuth: false,
      title: 'Registrarse',
    },
  },
  {
    path: '/forgot-password',
    name: 'ForgotPassword',
    component: () => import('@/features/auth/views/ForgotPasswordView.vue'),
    meta: {
      requiresAuth: false,
      title: 'Olvidé mi contraseña',
    },
  },
  {
    path: '/reset-password',
    name: 'ResetPassword',
    component: () => import('@/features/auth/views/ResetPasswordView.vue'),
    meta: {
      requiresAuth: false,
      title: 'Restablecer contraseña',
    },
  },
  {
    path: '/email-verified',
    name: 'EmailVerified',
    component: () => import('@/features/auth/views/EmailVerifiedView.vue'),
    meta: {
      requiresAuth: false,
      title: 'Correo confirmado',
    },
  }
]
