import axios from 'axios'

const api = axios.create({
  baseURL: 'http://100.86.53.126:8000/api',
})

export default api