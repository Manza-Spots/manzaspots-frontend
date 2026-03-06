import { ref, reactive, computed } from 'vue'
import { useValidation } from './useValidation'

export function useForm(initialValues = {}, validationRules = {}, options = {}) {
  const { onSubmit: onSubmitCallback, validateOnBlur = true, validateOnChange = false } = options

  const values = reactive({ ...initialValues })
  const isSubmitting = ref(false)
  const submitCount = ref(0)

  const {
    errors,
    touched,
    isValidating,
    validators,
    validateField,
    validateAll,
    clearErrors,
    reset: resetValidation,
    setTouched,
    hasErrors,
  } = useValidation(validationRules)

  const setFieldValue = (fieldName, value) => {
    values[fieldName] = value

    if (validateOnChange && touched[fieldName]) {
      validateField(fieldName, value)
    }
  }

  const handleBlur = (fieldName) => {
    setTouched(fieldName, true)

    if (validateOnBlur) {
      validateField(fieldName, values[fieldName])
    }
  }

  const handleSubmit = async (e) => {
    if (e) {
      e.preventDefault()
    }

    submitCount.value++
    isSubmitting.value = true

    Object.keys(validationRules).forEach((field) => {
      setTouched(field, true)
    })

    const isValid = await validateAll(values)

    if (isValid && onSubmitCallback) {
      try {
        await onSubmitCallback(values)
      } catch (error) {
        console.error('Error en submit:', error)
      }
    }

    isSubmitting.value = false
  }

  const resetForm = () => {
    Object.keys(initialValues).forEach((key) => {
      values[key] = initialValues[key]
    })
    resetValidation()
    submitCount.value = 0
  }

  const setValues = (newValues) => {
    Object.keys(newValues).forEach((key) => {
      if (key in values) {
        values[key] = newValues[key]
      }
    })
  }

  const setErrors = (newErrors) => {
    Object.keys(newErrors).forEach((key) => {
      errors.value[key] = newErrors[key]
      setTouched(key, true)
    })
  }

  const isDirty = computed(() => {
    return Object.keys(values).some((key) => values[key] !== initialValues[key])
  })

  const isValid = computed(() => {
    return !hasErrors.value && Object.keys(touched).length > 0
  })

  return {
    values,
    errors,
    touched,
    isSubmitting,
    isValidating,
    submitCount,
    isDirty,
    isValid,
    hasErrors,
    validators,
    setFieldValue,
    setValues,
    handleBlur,
    handleSubmit,
    resetForm,
    validateField,
    validateAll,
    clearErrors,
    setErrors,
    setTouched,
  }
}
