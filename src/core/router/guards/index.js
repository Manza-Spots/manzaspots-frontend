import { useAuthStore } from '@/features/auth/store'

export async function authGuard(to, from, next) {
  const authStore = useAuthStore()

  if (!authStore.initialized) {
    await authStore.initialize()
  }

  if (!authStore.isAuthenticated) {
    next({
      name: 'Login',
      query: { redirect: to.fullPath },
    })
    return
  }

  if (!authStore.user) {
    try {
      await authStore.fetchUser()
    } catch (error) {
      console.error('Error fetching user:', error)
      await authStore.logout()
      next({ name: 'Login' })
      return
    }
  }

  next()
}

export async function guestGuard(to, from, next) {
  const authStore = useAuthStore()

  if (!authStore.initialized) {
    await authStore.initialize()
  }

  if (authStore.isAuthenticated) {
    next({ name: 'Home' })
    return
  }

  next()
}

export async function mainGuard(to, from, next) {
  if (to.meta.title) {
    document.title = `${to.meta.title} - Manza Spots`
  } else {
    document.title = 'Manza Spots'
  }

  if (to.meta.requiresAuth) {
    return authGuard(to, from, next)
  }

  if (to.meta.requiresGuest) {
    return guestGuard(to, from, next)
  }

  next()
}
