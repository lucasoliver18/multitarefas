import axios from 'axios'

const api = axios.create({
  baseURL: 'https://908c2abc876ce9.lhr.life/api',
})

export default api