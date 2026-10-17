import { useAuthStore } from '@/features/auth/store'
import { isNetworkError } from '@/core/network/connectivity'

export async function authGuard(to, from, next) {
  const authStore = useAuthStore()

  if (!authStore.initialized) {
    await authStore.initialize()
  }

  if (!authStore.isAuthenticated) {
    next({
      name: 'Profile',
      query: { redirect: to.fullPath },
      replace: true,
    })
    return
  }

  if (!authStore.user) {
    try {
      await authStore.fetchUser()
    } catch (error) {
      console.error('Error fetching user:', error)
      // Sin red se deja pasar con la sesión guardada; la vista se recarga al volver la señal.
      if (isNetworkError(error)) return next()
      await authStore.logout()
      next({ name: 'Profile' })
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
    next({ name: 'Home', replace: true })
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
