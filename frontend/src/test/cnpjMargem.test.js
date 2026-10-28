import { describe, it, expect } from 'vitest'
import { cnpjValido, mascararCnpj } from '../utils/mascaras'
import { calcularValorFinal, descreverMargem } from '../utils/orcamentos'

describe('cnpjValido', () => {
  it('aceita o exemplo oficial de CNPJ alfanumérico da Receita', () => {
    expect(cnpjValido('12.ABC.345/01DE-35')).toBe(true)
    expect(cnpjValido('12abc34501de35')).toBe(true)
  })

  it('continua aceitando CNPJ numérico', () => {
    expect(cnpjValido('11.222.333/0001-81')).toBe(true)
  })

  it('recusa dígito verificador errado ou com letra', () => {
    expect(cnpjValido('12.ABC.345/01DE-36')).toBe(false)
    expect(cnpjValido('12.ABC.345/01DE-3A')).toBe(false)
  })

  it('recusa tamanho errado e caracteres repetidos', () => {
    expect(cnpjValido('12.ABC.345/01D-35')).toBe(false)
    expect(cnpjValido('AAAAAAAAAAAAAA')).toBe(false)
    expect(cnpjValido('00.000.000/0000-00')).toBe(false)
  })
})

describe('mascararCnpj', () => {
  it('formata em maiúsculas com a máscara padrão', () => {
    expect(mascararCnpj('12abc34501de35')).toBe('12.ABC.345/01DE-35')
  })

  it('não aceita letras nos dígitos verificadores nem caracteres especiais', () => {
    expect(mascararCnpj('12ABC34501DEXY35')).toBe('12.ABC.345/01DE-35')
    expect(mascararCnpj('12*ABÇ')).toBe('12.AB')
  })

  it('mostra a máscara parcial enquanto digita', () => {
    expect(mascararCnpj('12A')).toBe('12.A')
    expect(mascararCnpj('12ABC345')).toBe('12.ABC.345')
  })
})

describe('margem do orçamento', () => {
  it('em porcentagem incide sobre o custo', () => {
    expect(calcularValorFinal(100, '10', 'percentual')).toBeCloseTo(110)
  })

  it('em valor soma direto ao custo', () => {
    expect(calcularValorFinal(100, '35.5', 'valor')).toBeCloseTo(135.5)
  })

  it('descreve a margem conforme o tipo', () => {
    expect(descreverMargem('10', 'percentual')).toBe('10%')
    expect(descreverMargem('35.5', 'valor')).toMatch(/R\$\s?35,50/)
  })
})
