export default [
  {
    path: '/terms',
    name: 'Terms',
    component: () => import('@/views/TermsAndConditions.vue'),
    meta: {
      requiresAuth: false,
      title: 'Términos y Condiciones',
    },
  },
  {
    path: '/privacy',
    name: 'Privacy',
    component: () => import('@/views/PolicyPrivacy.vue'),
    meta: {
      requiresAuth: false,
      title: 'Política de Privacidad',
    },
  },
]
