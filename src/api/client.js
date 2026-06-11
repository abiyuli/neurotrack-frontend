import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
})

api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('idToken')
  if (token) {
    config.headers.Authorization = token
  }
  return config
})

api.interceptors.response.use(
  response => response,
  error => {
    const status = error.response?.status
    const url    = error.config?.url || ''
    const isAuth = url.includes('/auth/login') || url.includes('/register')

    if (!isAuth) {
      if (status === 401) {
        sessionStorage.clear()
        window.location.href = '/login?motivo=sesion_expirada'
        return new Promise(() => {}) // prevent downstream catch blocks from running
      }
      if (status === 403) {
        window.location.href = '/error?code=403'
        return new Promise(() => {})
      }
    }

    return Promise.reject(error)
  }
)

export default api