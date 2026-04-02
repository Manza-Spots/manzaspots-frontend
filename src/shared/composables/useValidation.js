import { ref, computed, isRef } from 'vue'

function resolveValue(target) {
  if (isRef(target)) return target.value
  if (typeof target === 'function') return target()
  return target
}

export function useValidation(rules) {
  const errors = ref({})
  const touched = ref({})
  const isValidating = ref(false)
  const revalidationDeps = {}

  const validators = {
    required:
      (message = 'Este campo es requerido') =>
      (value) => {
        const v = resolveValue(value)
        if (v === null || v === undefined || v === '') return message
        if (Array.isArray(v) && v.length === 0) return message
        return null
      },

    email:
      (message = 'Email inválido') =>
      (value) => {
        const v = resolveValue(value)
        if (!v) return null
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? null : message
      },

    minLength: (min, message) => (value) => {
      const v = resolveValue(value)
      if (!v) return null
      return v.length < min ? (message || `Debe tener al menos ${min} caracteres`) : null
    },

    maxLength: (max, message) => (value) => {
      const v = resolveValue(value)
      if (!v) return null
      return v.length > max ? (message || `No debe exceder ${max} caracteres`) : null
    },

    min: (min, message) => (value) => {
      const v = resolveValue(value)
      if (!v && v !== 0) return null
      return Number(v) < min ? (message || `El valor mínimo es ${min}`) : null
    },

    max: (max, message) => (value) => {
      const v = resolveValue(value)
      if (!v && v !== 0) return null
      return Number(v) > max ? (message || `El valor máximo es ${max}`) : null
    },

    pattern:
      (regex, message = 'Formato inválido') =>
      (value) => {
        const v = resolveValue(value)
        if (!v) return null
        return regex.test(v) ? null : message
      },

    url:
      (message = 'URL inválida') =>
      (value) => {
        const v = resolveValue(value)
        if (!v) return null
        try {
          new URL(v)
          return null
        } catch {
          return message
        }
      },

    numeric:
      (message = 'Solo se permiten números') =>
      (value) => {
        const v = resolveValue(value)
        if (!v) return null
        return /^\d+$/.test(v) ? null : message
      },

    alpha:
      (message = 'Solo se permiten letras') =>
      (value) => {
        const v = resolveValue(value)
        if (!v) return null
        return /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(v) ? null : message
      },

    alphanumeric:
      (message = 'Solo se permiten letras y números') =>
      (value) => {
        const v = resolveValue(value)
        if (!v) return null
        return /^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ]+$/.test(v) ? null : message
      },

    phone:
      (message = 'Teléfono inválido') =>
      (value) => {
        const v = resolveValue(value)
        if (!v) return null
        const clean = v.replace(/\D/g, '')
        return /^[\d\s\-+()]+$/.test(v) && clean.length >= 10 ? null : message
      },

    match: (target, fieldLabel, message) => {
      const validator = (value) => {
        const v = resolveValue(value)
        if (!v) return null
        const targetVal = resolveValue(target)
        return v === targetVal ? null : (message || `No coincide con ${fieldLabel}`)
      }

      validator._matchTarget = target
      return validator
    },

    oneOf: (options, message) => (value) => {
      const v = resolveValue(value)
      if (!v) return null
      return options.includes(v) ? null : (message || `Debe ser uno de: ${options.join(', ')}`)
    },

    custom:
      (validatorFn, message = 'Validación fallida') =>
      (value) => {
        const v = resolveValue(value)
        return validatorFn(v) ? null : message
      },

    async:
      (asyncFn, message = 'Validación fallida') =>
      async (value) => {
        const v = resolveValue(value)
        try {
          const isValid = await asyncFn(v)
          return isValid ? null : message
        } catch (error) {
          return `${message}: ${error}`
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

    await Promise.all(
      Object.keys(rules).map(async (fieldName) => {
        const fieldValid = await validateField(fieldName, values[fieldName])
        if (!fieldValid) isValid = false
      })
    )

    isValidating.value = false
    return isValid
  }

  const registerRevalidation = (dependentField, sourceField) => {
    if (!revalidationDeps[sourceField]) {
      revalidationDeps[sourceField] = []
    }
    if (!revalidationDeps[sourceField].includes(dependentField)) {
      revalidationDeps[sourceField].push(dependentField)
    }
  }

  const getDependents = (fieldName) => revalidationDeps[fieldName] ?? []

  const clearErrors = (fieldName) => {
    if (fieldName) errors.value[fieldName] = null
    else errors.value = {}
  }

  const clearTouched = (fieldName) => {
    if (fieldName) touched.value[fieldName] = false
    else touched.value = {}
  }

  const reset = () => {
    errors.value = {}
    touched.value = {}
    isValidating.value = false
  }

  const setTouched = (fieldName, value = true) => {
    touched.value[fieldName] = value
  }

  const hasErrors = computed(() =>
    Object.values(errors.value).some((e) => e !== null && e !== undefined)
  )

  const isFieldValid = (fieldName) =>
    computed(() => touched.value[fieldName] && !errors.value[fieldName])

  const isFieldInvalid = (fieldName) =>
    computed(() => touched.value[fieldName] && !!errors.value[fieldName])

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
    registerRevalidation,
    getDependents,
  }
}