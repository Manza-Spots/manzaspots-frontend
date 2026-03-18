export default [
  {
    path: '/ui',
    name: 'UiShowCase',
    component: () => import('@/views/UiView.vue'),
    meta: {
      requiresAuth: true,
      requiresGuest: false,
      title: 'Sistema de Diseño',
    },
  },
]
