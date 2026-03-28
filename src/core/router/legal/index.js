export default [
  {
    path: '/terms',
    name: 'Terms',
    component: () => import('@/views/TermsAndConditionsView.vue'),
    meta: {
      requiresAuth: false,
      title: 'Términos y Condiciones',
    },
  },
  {
    path: '/privacy',
    name: 'Privacy',
    component: () => import('@/views/PolicyPrivacyView.vue'),
    meta: {
      requiresAuth: false,
      title: 'Política de Privacidad',
    },
  },
]
