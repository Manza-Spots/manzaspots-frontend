export default [
  {
    path: '/ui',
    name: 'UiShowCase',
    component: () => import('@/views/Ui.vue'),
    meta: {
      requiresAuth: false,
    },
  },
]
