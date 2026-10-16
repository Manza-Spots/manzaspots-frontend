import apiClient from './client'

export { apiClient }
export { unwrap, unwrapList } from './unwrap'

export const api = {
  get: (url, config) => apiClient.get(url, config),
  post: (url, data, config) => apiClient.post(url, data, config),
  put: (url, data, config) => apiClient.put(url, data, config),
  patch: (url, data, config) => apiClient.patch(url, data, config),
  delete: (url, config) => apiClient.delete(url, config),
  // multipart/form-data: el cliente usa JSON por defecto y axios serializaría
  // el FormData a JSON, perdiendo los archivos.
  postForm: (url, data, config) => apiClient.postForm(url, data, config),
  patchForm: (url, data, config) => apiClient.patchForm(url, data, config),
}
