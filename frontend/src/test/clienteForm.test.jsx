import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { ToastProvider } from '../components/ToastNotification'
import NovoCliente from '../pages/NovoCliente'
import EditarCliente from '../pages/EditarCliente'

vi.mock('../services/api', () => ({ default: { get: vi.fn(), post: vi.fn(), put: vi.fn() } }))
import api from '../services/api'

const montar = (url) => render(
  <MemoryRouter initialEntries={[url]}>
    <ToastProvider>
      <Routes>
        <Route path="/clientes/novo" element={<NovoCliente />} />
        <Route path="/clientes/editar/:id" element={<EditarCliente />} />
        <Route path="/clientes" element={<p>Lista de clientes</p>} />
      </Routes>
    </ToastProvider>
  </MemoryRouter>
)
const campo = (nome) => document.querySelector(`[name="${nome}"]`)
const digitar = (nome, valor) => fireEvent.change(campo(nome), { target: { value: valor } })

describe('cadastro de cliente', () => {
  beforeEach(() => { api.get.mockReset(); api.post.mockReset(); api.put.mockReset() })

  it('valida nome, CPF e telefone antes de enviar', async () => {
    montar('/clientes/novo')
    const salvar = screen.getByRole('button', { name: 'Salvar cliente' })

    fireEvent.click(salvar)
    expect(await screen.findByText('Informe o nome')).toBeInTheDocument()

    digitar('nome', 'Ana Lima')
    digitar('cpf', '1235761')
    fireEvent.click(salvar)
    expect(await screen.findByText('CPF inválido')).toBeInTheDocument()

    // 11 dígitos, mas dígito verificador errado: barrado na tela, sem ir ao servidor.
    digitar('cpf', '12357615924')
    fireEvent.click(salvar)
    expect(await screen.findAllByText('CPF inválido')).toHaveLength(2)

    digitar('cpf', '12357615923')
    digitar('telefone', '439961')
    fireEvent.click(salvar)
    expect(await screen.findByText('Telefone incompleto')).toBeInTheDocument()
    expect(api.post).not.toHaveBeenCalled()
  })

  it('aplica as máscaras, envia só o documento do tipo escolhido e volta à lista', async () => {
    api.post.mockResolvedValue({ data: {} })
    montar('/clientes/novo')

    digitar('nome', 'Ana Lima')
    digitar('cpf', '12357615923')
    digitar('telefone', '43996105977')
    expect(campo('cpf')).toHaveValue('123.576.159-23')
    expect(campo('telefone')).toHaveValue('(43) 99610-5977')

    fireEvent.click(screen.getByRole('button', { name: 'Salvar cliente' }))
    expect(await screen.findByText('Lista de clientes')).toBeInTheDocument()
    expect(api.post).toHaveBeenCalledWith('/clientes', expect.objectContaining({
      nome: 'Ana Lima', tipo_pessoa: 'fisica', cpf: '123.576.159-23', cnpj: null, telefone: '(43) 99610-5977',
    }))
  })

  it('pessoa jurídica exige CNPJ válido', async () => {
    montar('/clientes/novo')
    fireEvent.click(screen.getByRole('button', { name: 'Pessoa Jurídica' }))
    digitar('nome', 'Bruno Ltda')
    digitar('cnpj', '54742524000188')
    fireEvent.click(screen.getByRole('button', { name: 'Salvar cliente' }))
    expect(await screen.findByText('CNPJ inválido')).toBeInTheDocument()
  })

  it('mostra o erro do servidor (ex.: CPF já cadastrado) e continua na tela', async () => {
    api.post.mockRejectedValue({ response: { status: 422, data: { message: 'O CPF já está em uso.', errors: { cpf: ['O CPF já está em uso.'] } } } })
    montar('/clientes/novo')
    digitar('nome', 'Ana Lima')
    digitar('cpf', '12357615923')
    fireEvent.click(screen.getByRole('button', { name: 'Salvar cliente' }))

    expect(await screen.findByText('O CPF já está em uso')).toBeInTheDocument()
    expect(screen.queryByText('Lista de clientes')).not.toBeInTheDocument()
  })
})

describe('observações do cliente', () => {
  it('limita a 500 caracteres com contador', async () => {
    montar('/clientes/novo')
    fireEvent.change(campo('observacoes'), { target: { value: 'x'.repeat(620) } })
    expect(campo('observacoes')).toHaveValue('x'.repeat(500))
    expect(screen.getByText('500/500')).toBeInTheDocument()
  })
})

describe('edição de cliente', () => {
  beforeEach(() => { api.get.mockReset(); api.put.mockReset() })

  it('carrega os dados, mantém o tipo travado e permite apagar o telefone', async () => {
    api.get.mockResolvedValue({ data: { id: 4, nome: 'Ana Lima', tipo_pessoa: 'fisica', cpf: '123.576.159-23', telefone: '(43) 99610-5977' } })
    api.put.mockResolvedValue({ data: {} })
    montar('/clientes/editar/4')

    await waitFor(() => expect(campo('nome')).toHaveValue('Ana Lima'))
    expect(screen.getByRole('button', { name: 'Pessoa Jurídica' })).toBeDisabled()
    expect(screen.getByText('O tipo de cadastro não pode ser alterado.')).toBeInTheDocument()

    digitar('telefone', '')
    expect(campo('telefone')).toHaveValue('')
    fireEvent.click(screen.getByRole('button', { name: 'Salvar alterações' }))

    await waitFor(() => expect(api.put).toHaveBeenCalledWith('/clientes/4', expect.objectContaining({ telefone: '', tipo_pessoa: 'fisica' })))
  })
})
