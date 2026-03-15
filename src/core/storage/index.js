import { Preferences } from '@capacitor/preferences'
import { isNative } from '@/core/capacitor'

class StorageService {
  async set(key, value) {
    try {
      const stringValue = JSON.stringify(value)

      if (isNative) {
        await Preferences.set({ key, value: stringValue })
      } else {
        localStorage.setItem(key, stringValue)
      }
    } catch (error) {
      console.error('Storage set error:', error)
      throw error
    }
  }

  async get(key) {
    try {
      let stringValue = null

      if (isNative) {
        const result = await Preferences.get({ key })
        stringValue = result.value
      } else {
        stringValue = localStorage.getItem(key)
      }

      if (!stringValue) return null

      return JSON.parse(stringValue)
    } catch (error) {
      console.error('Storage get error:', error)
      return null
    }
  }

  async remove(key) {
    try {
      if (isNative) {
        await Preferences.remove({ key })
      } else {
        localStorage.removeItem(key)
      }
    } catch (error) {
      console.error('Storage remove error:', error)
      throw error
    }
  }
  async clear() {
    try {
      if (isNative) {
        await Preferences.clear()
      } else {
        localStorage.clear()
      }
    } catch (error) {
      console.error('Storage clear error:', error)
      throw error
    }
  }
  async keys() {
    try {
      if (isNative) {
        const result = await Preferences.keys()
        return result.keys
      } else {
        return Object.keys(localStorage)
      }
    } catch (error) {
      console.error('Storage keys error:', error)
      return []
    }
  }

  async migrate() {
    if (!isNative) return

    try {
      const keys = Object.keys(localStorage)

      for (const key of keys) {
        const value = localStorage.getItem(key)
        if (value) {
          await Preferences.set({ key, value })
        }
      }
    } catch (error) {
      console.error('Migration error:', error)
    }
  }
}

export const storage = new StorageService()
