import { describe, it, expect, vi, afterEach } from 'vitest'
import api, { definirTokenAuth } from '../services/api'

// Cliente HTTP real, com um "adaptador" falso no lugar da rede.
const responderCom = (resposta) => {
  const adaptador = vi.fn(config => resposta(config))
  api.defaults.adapter = adaptador
  return adaptador
}

describe('cliente da API', () => {
  afterEach(() => definirTokenAuth(null))

  it('envia o token e evita cache nas leituras (GET)', async () => {
    const adaptador = responderCom(config => Promise.resolve({ data: [], status: 200, statusText: 'OK', headers: {}, config }))
    definirTokenAuth('tok-1')

    await api.get('/servicos', { params: { status: 'pendente' } })
    const config = adaptador.mock.calls[0][0]
    expect(config.headers.Authorization).toBe('Bearer tok-1')
    expect(config.params.status).toBe('pendente')
    expect(typeof config.params._t).toBe('number')

    await api.patch('/servicos/1', { pago: true })
    expect(adaptador.mock.calls[1][0].params?._t).toBeUndefined()
  })

  it('resposta 401 avisa a aplicação para encerrar a sessão', async () => {
    const ouvinte = vi.fn()
    window.addEventListener('auth:unauthorized', ouvinte)
    responderCom(config => Promise.reject(Object.assign(new Error('401'), { config, response: { status: 401 } })))

    await expect(api.get('/auth/me')).rejects.toBeTruthy()
    expect(ouvinte).toHaveBeenCalledTimes(1)
    window.removeEventListener('auth:unauthorized', ouvinte)
  })
})
