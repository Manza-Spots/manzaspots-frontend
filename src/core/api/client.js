import axios from 'axios'
import { API_CONFIG } from '@/core/config/api.config'
import { setupInterceptors } from './interceptors'

const apiClient = axios.create(API_CONFIG)

setupInterceptors(apiClient)

export default apiClient
