import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { ToastProvider } from '../components/ToastNotification'
import NovoCliente from '../pages/NovoCliente'
import MiniCadastroCliente from '../components/MiniCadastroCliente'

vi.mock('../services/api', () => ({ default: { get: vi.fn(), post: vi.fn() } }))
import api from '../services/api'

// CPF e CNPJ têm o mesmo tratamento nos dois cadastros de cliente (tela de
// cliente e cadastro rápido dentro do serviço): documento errado é barrado na
// tela, sem ir ao servidor, e "já cadastrado" vem com mensagem clara.
const CADASTROS = {
  'tela de cliente': {
    montar: () => render(
      <MemoryRouter initialEntries={['/clientes/novo']}>
        <ToastProvider>
          <Routes>
            <Route path="/clientes/novo" element={<NovoCliente />} />
            <Route path="/clientes" element={<p>Lista de clientes</p>} />
          </Routes>
        </ToastProvider>
      </MemoryRouter>
    ),
    salvar: 'Salvar cliente',
  },
  'cadastro rápido no serviço': {
    montar: () => render(
      <ToastProvider><MiniCadastroCliente nomeInicial="" onCriado={() => {}} onCancelar={() => {}} /></ToastProvider>
    ),
    salvar: 'Cadastrar',
  },
}

const campo = (nome) => document.querySelector(`[name="${nome}"]`)
const digitar = (nome, valor) => fireEvent.change(campo(nome), { target: { value: valor } })

describe.each(Object.entries(CADASTROS))('documento do cliente: %s', (_, { montar, salvar }) => {
  beforeEach(() => { api.post.mockReset() })

  it.each([
    ['CPF', 'Pessoa Física', 'cpf', '12357615924', 'CPF inválido'],
    ['CPF', 'Pessoa Física', 'cpf', '11111111111', 'CPF inválido'],
    ['CNPJ', 'Pessoa Jurídica', 'cnpj', '11222333000182', 'CNPJ inválido'],
    ['CNPJ', 'Pessoa Jurídica', 'cnpj', '11111111111111', 'CNPJ inválido'],
  ])('%s com dígito verificador errado é barrado na tela', async (_doc, tipo, nome, valor, mensagem) => {
    montar()
    fireEvent.click(screen.getByRole('button', { name: tipo }))
    digitar('nome', 'Cliente Teste')
    digitar(nome, valor)
    fireEvent.click(screen.getByRole('button', { name: salvar }))

    expect(await screen.findByText(mensagem.replace(/\.$/, ''))).toBeInTheDocument()
    expect(api.post).not.toHaveBeenCalled()
  })

  it.each([
    ['CPF', 'Pessoa Física', 'cpf', '12357615923', 'Já existe um cliente cadastrado com este CPF.'],
    ['CNPJ', 'Pessoa Jurídica', 'cnpj', '11222333000181', 'Já existe um cliente cadastrado com este CNPJ.'],
  ])('%s já cadastrado mostra a mensagem do servidor, não um erro genérico', async (_doc, tipo, nome, valor, mensagem) => {
    api.post.mockRejectedValue({ response: { status: 422, data: { message: mensagem, errors: { [nome]: [mensagem] } } } })
    montar()
    fireEvent.click(screen.getByRole('button', { name: tipo }))
    digitar('nome', 'Cliente Teste')
    digitar(nome, valor)
    fireEvent.click(screen.getByRole('button', { name: salvar }))

    await waitFor(() => expect(api.post).toHaveBeenCalledTimes(1))
    expect(await screen.findByText(mensagem.replace(/\.$/, ''))).toBeInTheDocument()
    expect(screen.queryByText(/Erro inesperado|Erro ao/)).not.toBeInTheDocument()
  })
})
