import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, within, waitFor } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { ToastProvider } from '../components/ToastNotification'
import Anotacoes from '../pages/Anotacoes'

vi.mock('../services/api', () => ({ default: { get: vi.fn(), post: vi.fn(), delete: vi.fn() } }))
import api from '../services/api'

const montar = () => render(
  <MemoryRouter initialEntries={['/servicos/9/anotacoes']}>
    <ToastProvider>
      <Routes><Route path="/servicos/:id/anotacoes" element={<Anotacoes />} /></Routes>
    </ToastProvider>
  </MemoryRouter>
)

describe('tela de Anotações', () => {
  beforeEach(() => {
    api.get.mockReset(); api.post.mockReset(); api.delete.mockReset()
    api.get.mockImplementation(url => Promise.resolve({
      data: url.endsWith('/anotacoes')
        ? [{ id: 1, conteudo: 'Cliente pediu orçamento', created_at: '2026-11-01T10:00:00Z' }]
        : { id: 9, titulo: 'Pintura', cliente: 'Luciano' },
    }))
  })

  it('salva com Ctrl+Enter (sem espaços nas pontas), mostra no topo e limpa o campo', async () => {
    api.post.mockResolvedValue({ data: { id: 2, conteudo: 'Comprar tinta', created_at: '2026-11-04T10:00:00Z' } })
    montar()
    expect(await screen.findByText('Pintura · Luciano')).toBeInTheDocument()
    const campo = screen.getByPlaceholderText('Escreva sua anotação aqui...')

    expect(screen.getByRole('button', { name: 'Salvar anotação' })).toBeDisabled()
    fireEvent.change(campo, { target: { value: '  Comprar tinta  ' } })
    expect(screen.getByText('17/500')).toBeInTheDocument()
    fireEvent.keyDown(campo, { key: 'Enter', ctrlKey: true })

    await waitFor(() => expect(campo).toHaveValue(''))
    expect(api.post).toHaveBeenCalledWith('/servicos/9/anotacoes', { conteudo: 'Comprar tinta' })
    const textos = screen.getAllByText(/Comprar tinta|Cliente pediu orçamento/).map(e => e.textContent)
    expect(textos).toEqual(['Comprar tinta', 'Cliente pediu orçamento'])
  })

  it('Ctrl+Enter repetido enquanto salva não grava em dobro', async () => {
    let concluir
    api.post.mockReturnValue(new Promise(r => { concluir = r }))
    montar()
    const campo = await screen.findByPlaceholderText('Escreva sua anotação aqui...')

    fireEvent.change(campo, { target: { value: 'Nota' } })
    fireEvent.keyDown(campo, { key: 'Enter', ctrlKey: true })
    fireEvent.keyDown(campo, { key: 'Enter', ctrlKey: true })
    concluir({ data: { id: 3, conteudo: 'Nota', created_at: '2026-11-04T10:00:00Z' } })

    await screen.findByText('Nota')
    expect(api.post).toHaveBeenCalledTimes(1)
  })

  it('remove depois de confirmar', async () => {
    api.delete.mockResolvedValue({ data: {} })
    montar()
    await screen.findByText('Cliente pediu orçamento')

    fireEvent.click(screen.getByRole('button', { name: 'Remover anotação' }))
    const aviso = screen.getByText('Remover esta anotação?').parentElement
    fireEvent.click(within(aviso.closest('div[class*="rounded"]') ?? aviso).getByRole('button', { name: 'Confirmar' }))

    await waitFor(() => expect(api.delete).toHaveBeenCalledWith('/anotacoes/1'))
    expect(screen.queryByText('Cliente pediu orçamento')).not.toBeInTheDocument()
    expect(screen.getByText(/Nenhuma anotação ainda/)).toBeInTheDocument()
  })
})
