import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom'
import { AuthContext } from '../contexts/AuthContext'
import Home from '../pages/Home'

vi.mock('../services/api', () => ({ default: { get: vi.fn() } }))
import api from '../services/api'

// Mesmo formato devolvido por GET /api/dashboard.
const resumo = {
  atencao: {
    atrasados: 2, vencem_hoje_amanha: 0, finalizados_nao_pagos: 3,
    em_andamento_sem_orcamento_aprovado: 0, orcamentos_pendentes: 4,
    materiais_zerados: 1, materiais_baixos: 0,
  },
  financeiro: { a_receber: 1250.5, a_receber_qtd: 2, em_negociacao: 5.1, em_negociacao_qtd: 4 },
  agenda: Array.from({ length: 7 }, (_, i) => ({ data: `2026-10-${28 + i > 31 ? '0' + (28 + i - 31) : 28 + i}`.replace('10-0', '11-0'), alta: i === 3 ? 1 : 0, media: 0, baixa: 0 })),
  previsao_estoque: [{ id: 9, nome: 'Tinta Azul', unidade: 'L', estoque: 7, necessario: 12 }],
  desempenho: {
    aprovado: 90, aprovado_qtd: 2, finalizados: 6, finalizados_anterior: 2, criados: 3,
    tempo_medio_conclusao_dias: 43.5, taxa_aprovacao: 33,
    por_tag: { informatica: 0, pintura: 3, outros: 0, sem_tag: 1 },
  },
  atividade: [{ tipo: 'anotacao', texto: 'Serviço instalado · Instalação', data: '2026-10-24T23:49:39.000000Z', servico_id: 5 }],
}

function Local() {
  const { pathname, search } = useLocation()
  return <p data-testid="local">{pathname + search}</p>
}

const montar = () => render(
  <AuthContext.Provider value={{ user: { name: 'Lucas José' } }}>
    <MemoryRouter>
      <Routes><Route path="*" element={<><Home /><Local /></>} /></Routes>
    </MemoryRouter>
  </AuthContext.Provider>
)

describe('tela inicial', () => {
  it('mostra financeiro, pendências, previsão de estoque e desempenho', async () => {
    api.get.mockResolvedValue({ data: resumo })
    montar()

    expect(await screen.findByText('Olá, Lucas!')).toBeInTheDocument()
    expect(api.get).toHaveBeenCalledWith('/dashboard', { params: { periodo: '1m' } })
    expect(screen.getByText(/1\.250,50/)).toBeInTheDocument()
    expect(screen.getByText('2 serviços atrasados')).toBeInTheDocument()
    expect(screen.getByText('4 orçamentos aguardando aprovação')).toBeInTheDocument()
    expect(screen.getByText('1 material sem estoque')).toBeInTheDocument()
    // Pendência com zero não aparece.
    expect(screen.queryByText(/estoque baixo/)).not.toBeInTheDocument()
    expect(screen.getByText('Tinta Azul')).toBeInTheDocument()
    expect(screen.getByText('faltam 5')).toBeInTheDocument()
    expect(screen.getByText('+4 vs. período anterior')).toBeInTheDocument()
    expect(screen.getByText('43,5 dias')).toBeInTheDocument()
  })

  it('pendência leva à tela já filtrada', async () => {
    api.get.mockResolvedValue({ data: resumo })
    montar()

    fireEvent.click(await screen.findByText('3 serviços finalizados sem pagamento'))
    expect(screen.getByTestId('local')).toHaveTextContent('/servicos?status=finalizado&pago=0')
  })

  it('"Em negociação" abre o modal de orçamentos pendentes e leva aos orçamentos do serviço', async () => {
    const pendente = {
      id: 31, servico_id: 8, titulo: 'Orçamento B', margem_lucro: '10.00', tipo_margem: 'percentual',
      valor_final: 330, created_at: new Date(Date.now() - 9 * 86400000).toISOString(),
      servico: { id: 8, titulo: 'Pintura de Sala de Estar', cliente: 'Eunice', tag: 'pintura' },
    }
    api.get.mockImplementation(url => Promise.resolve({ data: url === '/orcamentos' ? [pendente] : resumo }))
    montar()

    fireEvent.click(await screen.findByText('Em negociação'))

    expect(await screen.findByText('Orçamentos em negociação')).toBeInTheDocument()
    expect(api.get).toHaveBeenCalledWith('/orcamentos', { params: { status: 'pendente' } })
    expect(await screen.findByText('Orçamento B')).toBeInTheDocument()
    expect(screen.getByText('Há 9 dias')).toBeInTheDocument()

    fireEvent.click(screen.getByText('Orçamento B'))
    expect(screen.getByTestId('local')).toHaveTextContent('/orcamentos/8')
  })

  it('sem pendências mostra "Tudo em dia"', async () => {
    const semNada = Object.fromEntries(Object.keys(resumo.atencao).map(k => [k, 0]))
    api.get.mockResolvedValue({ data: { ...resumo, atencao: semNada } })
    montar()

    expect(await screen.findByText('Tudo em dia')).toBeInTheDocument()
  })
})
