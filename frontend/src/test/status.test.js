import { describe, it, expect } from 'vitest'
import {
  badgeStatus,
  labelStatus,
  borderPrioridade,
  labelPrioridade,
  corTextoPrioridade,
  TAG_LABEL,
  STATUS_OPCOES,
} from '../utils/status'

describe('badgeStatus', () => {
  it('retorna classes corretas para finalizado', () => {
    expect(badgeStatus('finalizado')).toContain('dcfce7')
  })

  it('retorna classes corretas para em_andamento', () => {
    expect(badgeStatus('em_andamento')).toContain('dbeafe')
  })

  it('retorna classes corretas para pendente', () => {
    expect(badgeStatus('pendente')).toContain('fef9c3')
  })

  it('retorna fallback para status desconhecido', () => {
    expect(badgeStatus('outro')).toContain('fef9c3')
  })
})

describe('labelStatus', () => {
  it('retorna label correto para finalizado', () => {
    expect(labelStatus('finalizado')).toBe('✔ Finalizado')
  })

  it('retorna label correto para em_andamento', () => {
    expect(labelStatus('em_andamento')).toBe('🔄 Em andamento')
  })

  it('retorna label correto para pendente', () => {
    expect(labelStatus('pendente')).toBe('⏳ Pendente')
  })

  it('retorna fallback para status desconhecido', () => {
    expect(labelStatus('invalido')).toBe('⏳ Pendente')
  })
})

describe('borderPrioridade', () => {
  it('retorna vermelho para alta', () => {
    expect(borderPrioridade('alta')).toContain('dc2626')
  })

  it('retorna amarelo para media', () => {
    expect(borderPrioridade('media')).toContain('ca8a04')
  })

  it('retorna verde para baixa', () => {
    expect(borderPrioridade('baixa')).toContain('16a34a')
  })
})

describe('labelPrioridade', () => {
  it('retorna label de alta prioridade', () => {
    expect(labelPrioridade('alta')).toBe('🔴 Alta')
  })

  it('retorna label de média prioridade', () => {
    expect(labelPrioridade('media')).toBe('🟠 Média')
  })

  it('retorna label de baixa prioridade', () => {
    expect(labelPrioridade('baixa')).toBe('🟢 Baixa')
  })
})

describe('corTextoPrioridade', () => {
  it('retorna vermelho para alta', () => {
    expect(corTextoPrioridade('alta')).toBe('text-red-500')
  })

  it('retorna âmbar para media', () => {
    expect(corTextoPrioridade('media')).toBe('text-amber-500')
  })

  it('retorna verde para baixa', () => {
    expect(corTextoPrioridade('baixa')).toBe('text-green-600')
  })
})

describe('TAG_LABEL', () => {
  it('mapeia informatica corretamente', () => {
    expect(TAG_LABEL.informatica).toBe('Informática')
  })

  it('mapeia pintura corretamente', () => {
    expect(TAG_LABEL.pintura).toBe('Pintura')
  })

  it('mapeia outros corretamente', () => {
    expect(TAG_LABEL.outros).toBe('Outros')
  })
})

describe('STATUS_OPCOES', () => {
  it('contém exatamente 3 opções', () => {
    expect(STATUS_OPCOES).toHaveLength(3)
  })

  it('inclui pendente, em_andamento e finalizado', () => {
    const vals = STATUS_OPCOES.map(o => o.val)
    expect(vals).toContain('pendente')
    expect(vals).toContain('em_andamento')
    expect(vals).toContain('finalizado')
  })
})
