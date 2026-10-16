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
    path: '/spots/new',
    name: 'CreateSpot',
    component: () => import('@/views/CreateSpotView.vue'),
    meta: {
      requiresAuth: true,
      title: 'Nuevo spot',
    },
  },
  {
    path: '/spots/:id',
    name: 'SpotDetail',
    component: () => import('@/views/SpotDetailView.vue'),
    meta: {
      requiresAuth: false,
      title: 'Detalle del spot',
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
