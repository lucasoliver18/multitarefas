import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { ToastProvider } from '../components/ToastNotification'
import { AuthProvider } from '../components/AuthProvider'
import RotaProtegida from '../components/RotaProtegida'
import Login from '../pages/Login'

vi.mock('../paginas', () => ({ paginas: {}, precarregarPaginas: () => {} }))
vi.mock('../services/api', () => ({
  default: { get: vi.fn(), post: vi.fn() },
  definirTokenAuth: vi.fn(),
}))
import api, { definirTokenAuth } from '../services/api'

const montar = () => render(
  <MemoryRouter initialEntries={['/']}>
    <ToastProvider>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<RotaProtegida />}>
            <Route path="/" element={<p>Tela inicial</p>} />
          </Route>
        </Routes>
      </AuthProvider>
    </ToastProvider>
  </MemoryRouter>
)

const entrarCom = (email, senha) => {
  fireEvent.change(screen.getByLabelText('E-mail'), { target: { value: email } })
  fireEvent.change(screen.getByLabelText('Senha'), { target: { value: senha } })
  fireEvent.click(screen.getByRole('button', { name: 'Entrar' }))
}

describe('login e sessão', () => {
  beforeEach(() => {
    localStorage.clear()
    api.get.mockReset(); api.post.mockReset(); definirTokenAuth.mockReset()
  })

  it('sem sessão vai para o login; senha errada avisa; certa entra e guarda o token', async () => {
    api.post
      .mockRejectedValueOnce({ response: { status: 422, data: { message: 'E-mail ou senha incorretos.', errors: { email: ['E-mail ou senha incorretos.'] } } } })
      .mockResolvedValueOnce({ data: { token: 'tok-123', user: { name: 'Lucas José' } } })
    montar()

    expect(await screen.findByLabelText('E-mail')).toBeInTheDocument()
    entrarCom('dono@empresa.com', 'errada')
    expect(await screen.findByText('E-mail ou senha incorretos')).toBeInTheDocument()
    expect(screen.queryByText('Tela inicial')).not.toBeInTheDocument()

    entrarCom('dono@empresa.com', 'certa')
    expect(await screen.findByText('Tela inicial')).toBeInTheDocument()
    expect(localStorage.getItem('auth_token')).toBe('tok-123')
    expect(definirTokenAuth).toHaveBeenLastCalledWith('tok-123')
  })

  it('com token salvo entra direto; sessão expirada (401) volta ao login', async () => {
    localStorage.setItem('auth_token', 'tok-salvo')
    api.get.mockResolvedValue({ data: { name: 'Lucas José' } })
    montar()

    expect(await screen.findByText('Tela inicial')).toBeInTheDocument()
    expect(api.get).toHaveBeenCalledWith('/auth/me')

    act(() => { window.dispatchEvent(new Event('auth:unauthorized')) })
    expect(await screen.findByLabelText('E-mail')).toBeInTheDocument()
    expect(localStorage.getItem('auth_token')).toBeNull()
  })

  it('token inválido no início descarta a sessão', async () => {
    localStorage.setItem('auth_token', 'tok-velho')
    api.get.mockRejectedValue({ response: { status: 401 } })
    montar()

    expect(await screen.findByLabelText('E-mail')).toBeInTheDocument()
    await waitFor(() => expect(localStorage.getItem('auth_token')).toBeNull())
  })
})
