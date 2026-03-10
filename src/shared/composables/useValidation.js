import { ref, computed } from 'vue'

export function useValidation(rules) {
  const errors = ref({})
  const touched = ref({})
  const isValidating = ref(false)

  const validators = {
    required:
      (message = 'Este campo es requerido') =>
      (value) => {
        if (value === null || value === undefined || value === '') {
          return message
        }
        if (Array.isArray(value) && value.length === 0) {
          return message
        }
        return null
      },

    email:
      (message = 'Email inválido') =>
      (value) => {
        if (!value) return null
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(value)) {
          return message
        }
        return null
      },

    minLength: (min, message) => (value) => {
      if (!value) return null
      const msg = message || `Debe tener al menos ${min} caracteres`
      if (value.length < min) {
        return msg
      }
      return null
    },

    maxLength: (max, message) => (value) => {
      if (!value) return null
      const msg = message || `No debe exceder ${max} caracteres`
      if (value.length > max) {
        return msg
      }
      return null
    },

    min: (min, message) => (value) => {
      if (!value && value !== 0) return null
      const msg = message || `El valor mínimo es ${min}`
      if (Number(value) < min) {
        return msg
      }
      return null
    },

    max: (max, message) => (value) => {
      if (!value && value !== 0) return null
      const msg = message || `El valor máximo es ${max}`
      if (Number(value) > max) {
        return msg
      }
      return null
    },

    pattern:
      (regex, message = 'Formato inválido') =>
      (value) => {
        if (!value) return null
        if (!regex.test(value)) {
          return message
        }
        return null
      },

    url:
      (message = 'URL inválida') =>
      (value) => {
        if (!value) return null
        try {
          new URL(value)
          return null
        } catch {
          return message
        }
      },

    numeric:
      (message = 'Solo se permiten números') =>
      (value) => {
        if (!value) return null
        if (!/^\d+$/.test(value)) {
          return message
        }
        return null
      },

    alpha:
      (message = 'Solo se permiten letras') =>
      (value) => {
        if (!value) return null
        if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(value)) {
          return message
        }
        return null
      },

    alphanumeric:
      (message = 'Solo se permiten letras y números') =>
      (value) => {
        if (!value) return null
        if (!/^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s]+$/.test(value)) {
          return message
        }
        return null
      },

    phone:
      (message = 'Teléfono inválido') =>
      (value) => {
        if (!value) return null
        const phoneRegex = /^[\d\s\-+()]+$/
        if (!phoneRegex.test(value) || value.replace(/\D/g, '').length < 10) {
          return message
        }
        return null
      },

    match: (fieldRef, fieldLabel, message) => (value) => {
      if (!value) return null
      const msg = message || `No coincide con ${fieldLabel}`
      if (value !== fieldRef.value) {
        return msg
      }
      return null
    },

    oneOf: (options, message) => (value) => {
      if (!value) return null
      const msg = message || `Debe ser uno de: ${options.join(', ')}`
      if (!options.includes(value)) {
        return msg
      }
      return null
    },

    custom:
      (validatorFn, message = 'Validación fallida') =>
      (value) => {
        const isValid = validatorFn(value)
        if (!isValid) {
          return message
        }
        return null
      },

    async:
      (asyncFn, message = 'Validación fallida') =>
      async (value) => {
        try {
          const isValid = await asyncFn(value)
          if (!isValid) {
            return message
          }
          return null
        } catch (error) {
          return message + `: ${error}`
        }
      },
  }

  const validateField = async (fieldName, value) => {
    const fieldRules = rules[fieldName]
    if (!fieldRules) return true

    touched.value[fieldName] = true
    isValidating.value = true

    try {
      for (const rule of fieldRules) {
        const error = await rule(value)
        if (error) {
          errors.value[fieldName] = error
          isValidating.value = false
          return false
        }
      }

      errors.value[fieldName] = null
      isValidating.value = false
      return true
    } catch (error) {
      console.error('Error en validación:', error)
      errors.value[fieldName] = 'Error de validación'
      isValidating.value = false
      return false
    }
  }

  const validateAll = async (values) => {
    isValidating.value = true
    let isValid = true

    const validationPromises = Object.keys(rules).map(async (fieldName) => {
      const fieldValid = await validateField(fieldName, values[fieldName])
      if (!fieldValid) {
        isValid = false
      }
    })

    await Promise.all(validationPromises)
    isValidating.value = false

    return isValid
  }

  const clearErrors = (fieldName) => {
    if (fieldName) {
      errors.value[fieldName] = null
    } else {
      errors.value = {}
    }
  }

  const clearTouched = (fieldName) => {
    if (fieldName) {
      touched.value[fieldName] = false
    } else {
      touched.value = {}
    }
  }

  const reset = () => {
    errors.value = {}
    touched.value = {}
    isValidating.value = false
  }

  const setTouched = (fieldName, value = true) => {
    touched.value[fieldName] = value
  }

  const hasErrors = computed(() => {
    return Object.values(errors.value).some((error) => error !== null && error !== undefined)
  })

  const isFieldValid = (fieldName) => {
    return computed(() => {
      return touched.value[fieldName] && !errors.value[fieldName]
    })
  }

  const isFieldInvalid = (fieldName) => {
    return computed(() => {
      return touched.value[fieldName] && !!errors.value[fieldName]
    })
  }

  return {
    errors,
    touched,
    isValidating,
    validators,
    validateField,
    validateAll,
    clearErrors,
    clearTouched,
    reset,
    setTouched,
    hasErrors,
    isFieldValid,
    isFieldInvalid,
  }
}
