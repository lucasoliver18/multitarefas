import { describe, it, expect } from 'vitest'
import { usaMateriais, mensagemAprovar, mensagemReprovar, mensagemExcluir } from '../utils/orcamentos'

const comMat = (status) => ({ status, sem_materiais: false, materiais: [{ id: 1 }] })
const semMat = (status) => ({ status, sem_materiais: true, materiais: [] })
const vazio = (status) => ({ status, sem_materiais: false, materiais: [] })

// Só fala de estoque quando o orçamento realmente mexe nele.
describe('confirmações de orçamento', () => {
  it('usaMateriais só com materiais e sem a opção "sem materiais"', () => {
    expect(usaMateriais(comMat('pendente'))).toBe(true)
    expect(usaMateriais(semMat('pendente'))).toBe(false)
    expect(usaMateriais(vazio('pendente'))).toBe(false)
  })

  it('aprovar', () => {
    expect(mensagemAprovar(comMat('pendente'))).toBe('Aprovar? O estoque será debitado')
    expect(mensagemAprovar(semMat('reprovado'))).toBe('Aprovar este orçamento?')
    expect(mensagemAprovar(comMat('pendente'), true)).toBe('Aprovar? O estoque será debitado. O orçamento aprovado atual será reprovado')
    expect(mensagemAprovar(semMat('pendente'), true)).toBe('Aprovar este orçamento? O orçamento aprovado atual será reprovado')
  })

  it('reprovar', () => {
    expect(mensagemReprovar(comMat('aprovado'))).toBe('Reprovar? O estoque será devolvido')
    expect(mensagemReprovar(semMat('aprovado'))).toBe('Reprovar este orçamento?')
    expect(mensagemReprovar(comMat('pendente'))).toBe('Reprovar este orçamento?')
  })

  it('excluir', () => {
    expect(mensagemExcluir(comMat('aprovado'))).toBe('Orçamento aprovado. Excluir mesmo assim? O estoque será devolvido')
    expect(mensagemExcluir(semMat('aprovado'))).toBe('Orçamento aprovado. Excluir mesmo assim?')
    expect(mensagemExcluir(comMat('reprovado'))).toBe('Excluir este orçamento?')
  })
})
