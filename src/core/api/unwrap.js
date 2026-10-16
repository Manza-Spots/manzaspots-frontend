// El backend envuelve todas las respuestas con StandardJSONRenderer:
// `{ success, errors, data, message }`.

/** Devuelve el `data` de la envoltura. */
export function unwrap(response) {
  return response.data?.data ?? response.data
}

/**
 * Devuelve siempre un array: los listados paginados (PageNumberPagination)
 * traen `{ count, next, previous, results }`; las acciones custom, un array plano.
 */
export function unwrapList(response) {
  const payload = response.data?.data
  if (Array.isArray(payload)) return payload
  return payload?.results ?? []
}
