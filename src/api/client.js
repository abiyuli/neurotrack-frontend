import axios from 'axios'

const api = axios.create({
  baseURL: 'https://u4j6cydbyf.execute-api.us-east-2.amazonaws.com/v1',
})

api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('idToken')
  if (token) {
    config.headers.Authorization = token
  }
  return config
})

export default api