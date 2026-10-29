import { describe, it, expect, vi } from 'vitest'
import { useState } from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import CampoData from '../components/CampoData'

function Controlado({ inicial = '', onChange = () => {}, onInvalida }) {
  const [valor, setValor] = useState(inicial)
  return (
    <CampoData
      name="prazo"
      value={valor}
      onChange={e => { setValor(e.target.value); onChange(e) }}
      onInvalida={onInvalida}
    />
  )
}

const campo = () => screen.getByRole('combobox')

describe('CampoData', () => {
  it('exibe a data no formato dd/mm/aaaa', () => {
    render(<Controlado inicial="2026-10-29" />)
    expect(campo()).toHaveValue('29/10/2026')
  })

  it('aplica a máscara ao digitar e só emite a data completa e válida', () => {
    const onChange = vi.fn()
    render(<Controlado onChange={onChange} />)

    fireEvent.change(campo(), { target: { value: '0503' } })
    expect(campo()).toHaveValue('05/03')
    expect(onChange).not.toHaveBeenCalled()

    fireEvent.change(campo(), { target: { value: '05032027' } })
    expect(campo()).toHaveValue('05/03/2027')
    expect(onChange).toHaveBeenCalledWith({ target: { name: 'prazo', value: '2027-03-05' } })
  })

  it('avisa e volta ao valor anterior ao sair com data inexistente', () => {
    const onInvalida = vi.fn()
    render(<Controlado inicial="2026-10-29" onInvalida={onInvalida} />)

    fireEvent.change(campo(), { target: { value: '31/09/2026' } })
    fireEvent.blur(campo())

    expect(onInvalida).toHaveBeenCalled()
    expect(campo()).toHaveValue('29/10/2026')
  })

  it('abre o calendário do sistema no mês da data e seleciona um dia', () => {
    const onChange = vi.fn()
    render(<Controlado inicial="2026-10-29" onChange={onChange} />)

    fireEvent.click(campo())
    expect(screen.getByRole('dialog', { name: 'Calendário' })).toBeInTheDocument()
    expect(screen.getByText('Outubro 2026')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '29/10/2026' })).toHaveAttribute('aria-pressed', 'true')

    fireEvent.click(screen.getByRole('button', { name: 'Próximo mês' }))
    expect(screen.getByText('Novembro 2026')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '15/11/2026' }))
    expect(onChange).toHaveBeenCalledWith({ target: { name: 'prazo', value: '2026-11-15' } })
    expect(campo()).toHaveValue('15/11/2026')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('escolhe mês pela visão de meses e limpa pelo rodapé', () => {
    const onChange = vi.fn()
    render(<Controlado inicial="2026-10-29" onChange={onChange} />)

    fireEvent.click(campo())
    fireEvent.click(screen.getByText('Outubro 2026'))
    fireEvent.click(screen.getByRole('button', { name: 'Próximo ano' }))
    fireEvent.click(screen.getByRole('button', { name: 'Fev' }))
    expect(screen.getByText('Fevereiro 2027')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Limpar' }))
    expect(onChange).toHaveBeenLastCalledWith({ target: { name: 'prazo', value: '' } })
    expect(campo()).toHaveValue('')
  })

  it('navega pelo teclado e Esc fecha só o calendário', () => {
    const onChange = vi.fn()
    render(<Controlado inicial="2026-10-29" onChange={onChange} />)
    const escFora = vi.fn()
    const aoTeclarFora = e => e.key === 'Escape' && escFora()
    document.addEventListener('keydown', aoTeclarFora)

    fireEvent.keyDown(campo(), { key: 'ArrowDown' })
    fireEvent.keyDown(campo(), { key: 'Escape' })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(escFora).not.toHaveBeenCalled()

    fireEvent.keyDown(campo(), { key: 'ArrowDown' })
    fireEvent.keyDown(campo(), { key: 'ArrowRight' })
    fireEvent.keyDown(campo(), { key: 'ArrowDown' })
    fireEvent.keyDown(campo(), { key: 'Enter' })
    expect(onChange).toHaveBeenCalledWith({ target: { name: 'prazo', value: '2026-11-06' } })
    document.removeEventListener('keydown', aoTeclarFora)
  })

  it('atualiza o texto quando o valor muda por fora', () => {
    const { rerender } = render(<CampoData value="2026-10-29" onChange={() => {}} />)
    rerender(<CampoData value="" onChange={() => {}} />)
    expect(campo()).toHaveValue('')
  })
})
