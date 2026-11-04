import { describe, it, expect, vi } from 'vitest'
import { useState } from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { ToastProvider } from '../components/ToastNotification'
import ServicoForm from '../components/ServicoForm'

vi.mock('../services/api', () => ({ default: { get: vi.fn(), post: vi.fn() } }))

function Formulario({ onSalvar }) {
  const [form, setForm] = useState({
    titulo: 'Troca de tela', cliente: 'Luciano', cliente_id: 1, descricao: '',
    tag: '', prioridade: 'media', prazo: '2026-11-10', status: 'pendente', pago: false,
  })
  return (
    <MemoryRouter>
      <ToastProvider>
        <ServicoForm titulo="Editar serviço" form={form} setForm={setForm} statusOriginal="pendente"
          salvando={false} onSalvar={onSalvar} onCancelar={() => {}} />
      </ToastProvider>
    </MemoryRouter>
  )
}

describe('formulário de serviço', () => {
  it('não salva enquanto o prazo estiver inválido', () => {
    const onSalvar = vi.fn()
    render(<Formulario onSalvar={onSalvar} />)
    const prazo = document.querySelector('input[name="prazo"]')

    fireEvent.change(prazo, { target: { value: '31022026' } })
    fireEvent.blur(prazo)
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }))
    expect(onSalvar).not.toHaveBeenCalled()

    fireEvent.change(prazo, { target: { value: '20112026' } })
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }))
    expect(onSalvar).toHaveBeenCalledTimes(1)
  })

  it('limita a descrição a 500 caracteres com contador', () => {
    render(<Formulario onSalvar={() => {}} />)
    const descricao = document.querySelector('textarea[name="descricao"]')
    fireEvent.change(descricao, { target: { value: 'a'.repeat(600) } })
    expect(descricao).toHaveValue('a'.repeat(500))
    expect(screen.getByText('500/500')).toBeInTheDocument()
  })
})
