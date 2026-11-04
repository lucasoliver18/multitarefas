import { describe, it, expect } from 'vitest'
import { UNIDADES, erroMaterial, payloadMaterial, estaComEstoqueBaixo, materiaisComEstoqueInsuficiente } from '../utils/materiais'

describe('cadastro de material', () => {
  it('oferece só as unidades de uso diário (sem cx, pç e rolo)', () => {
    expect(UNIDADES).toEqual(['un', 'kg', 'g', 'L', 'mL', 'm', 'm²', 'm³'])
  })

  it('exige nome e preço, e marca escolhida da lista', () => {
    expect(erroMaterial({ nome: '', preco_unitario: '5' })).toBe('Informe nome e preço')
    expect(erroMaterial({ nome: 'Tinta', preco_unitario: '' })).toBe('Informe nome e preço')
    expect(erroMaterial({ nome: 'Tinta', preco_unitario: '5', marca: 'Suvi', marca_id: null })).toMatch(/Selecione uma marca/)
    expect(erroMaterial({ nome: 'Tinta', preco_unitario: '5', marca: '', marca_id: null })).toBeNull()
  })

  it('monta o envio: estoque vazio vira 0, mínimo vazio vira sem mínimo', () => {
    const corpo = payloadMaterial({ nome: 'Tinta', marca: 'Suvinil', marca_id: 3, preco_unitario: '5', quantidade_estoque: '', quantidade_minima: '' })
    expect(corpo).toEqual({ nome: 'Tinta', marca_id: 3, preco_unitario: '5', quantidade_estoque: 0, quantidade_minima: null })
  })

  it('estoque baixo e falta de estoque no orçamento', () => {
    expect(estaComEstoqueBaixo({ quantidade_estoque: '2', quantidade_minima: '2' })).toBe(true)
    expect(estaComEstoqueBaixo({ quantidade_estoque: '3', quantidade_minima: '2' })).toBe(false)
    expect(estaComEstoqueBaixo({ quantidade_estoque: '0', quantidade_minima: null })).toBe(false)
    expect(materiaisComEstoqueInsuficiente([
      { id: 1, quantidade: '3', quantidade_estoque: '2' },
      { id: 2, quantidade: '1', quantidade_estoque: '2' },
      { id: 3, quantidade: '9', quantidade_estoque: null },
    ]).map(i => i.id)).toEqual([1])
  })
})
