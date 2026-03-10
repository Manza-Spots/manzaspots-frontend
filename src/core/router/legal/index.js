export default [
  {
    path: '/terms-conditions',
    name: 'TermsAndConditions',
    component: () => import('@/views/TermsAndConditions.vue'),
    meta: {
      requiresAuth: false,
    },
  },
  {
    path: '/policy-privacy',
    name: 'PolicyPrivacy',
    component: () => import('@/views/PolicyPrivacy.vue'),
    meta: {
      requiresAuth: false,
    },
  },
]
