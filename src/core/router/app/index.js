export default [
  {
    path: '/spots',
    name: 'Spots',
    component: () => import('@/views/SpotsView.vue'),
    meta: {
      requiresAuth: false,
      title: 'Spots',
    },
  },
  {
    path: '/record-route',
    name: 'RecordRoute',
    component: () => import('@/views/RecordRouteView.vue'),
    meta: {
      requiresAuth: false,
      title: 'Grabar Ruta',
    },
  },
  {
    path: '/profile',
    name: 'Profile',
    component: () => import('@/views/ProfileView.vue'),
    meta: {
      requiresAuth: false,
      title: 'Perfil',
    },
  },
]
