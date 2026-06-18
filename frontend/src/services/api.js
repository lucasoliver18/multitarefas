import axios from 'axios'

const api = axios.create({
  baseURL: 'http://100.86.53.126:8000/api',
})

api.interceptors.request.use(config => {
  if (config.method === 'get') {
    config.params = { ...config.params, _t: Date.now() }
  }
  return config
})

export default api
