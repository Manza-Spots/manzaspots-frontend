import { ref, reactive, computed, watch, isRef } from 'vue'
import { useValidation } from './useValidation'

/**
 * Dado el _matchTarget de un validador `match`, intenta inferir a qué campo
 * del formulario apunta para poder registrar la dependencia de revalidación.
 *
 * Soporta:
 *   - función:  () => values.password  /  () => values['password']
 *   - ref:      no es posible inferir el nombre, se ignora (la validación
 *               sigue funcionando, solo no hay revalidación automática)
 */
function resolveMatchFieldName(target, fieldNames) {
  if (!target || isRef(target)) return null

  if (typeof target === 'function') {
    const src = target.toString()
    for (const name of fieldNames) {
      if (
        src.includes(`.${name}`) ||
        src.includes(`['${name}']`) ||
        src.includes(`["${name}"]`)
      ) {
        return name
      }
    }
  }

  return null
}

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
    registerRevalidation,
    getDependents,
  } = useValidation(validationRules)

  // ─── Registrar dependencias de revalidación automática ───────────────────────
  // Recorre todas las reglas buscando validadores `match` que tengan _matchTarget.
  // Si el target es una función que referencia otro campo del formulario,
  // registra la dependencia para que ese campo dispare una revalidación.
  const fieldNames = Object.keys(validationRules)

  for (const [dependentField, fieldRules] of Object.entries(validationRules)) {
    for (const rule of fieldRules) {
      if (rule._matchTarget) {
        const sourceField = resolveMatchFieldName(rule._matchTarget, fieldNames)
        if (sourceField) {
          registerRevalidation(dependentField, sourceField)
        }
      }
    }
  }

  // Monta un watcher por cada campo que tenga dependientes.
  // Solo revalida si el campo dependiente ya fue tocado, para no
  // mostrar errores antes de que el usuario haya interactuado con él.
  for (const sourceField of fieldNames) {
    const dependents = getDependents(sourceField)
    if (dependents.length === 0) continue

    watch(
      () => values[sourceField],
      () => {
        for (const dep of dependents) {
          if (touched.value[dep]) {
            validateField(dep, values[dep])
          }
        }
      }
    )
  }

  // ─── API ──────────────────────────────────────────────────────────────────────

  const setFieldValue = (fieldName, value) => {
    values[fieldName] = value

    if (validateOnChange && touched.value[fieldName]) {
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
    if (e) e.preventDefault()

    submitCount.value++
    isSubmitting.value = true

    Object.keys(validationRules).forEach((field) => setTouched(field, true))

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
      if (key in values) values[key] = newValues[key]
    })
  }

  const setErrors = (newErrors) => {
    Object.keys(newErrors).forEach((key) => {
      errors.value[key] = newErrors[key]
      setTouched(key, true)
    })
  }

  const isDirty = computed(() =>
    Object.keys(values).some((key) => values[key] !== initialValues[key])
  )

  const isValid = computed(
    () => !hasErrors.value && Object.keys(touched.value).length > 0
  )

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