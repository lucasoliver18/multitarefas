import { describe, it, expect, vi } from 'vitest'
import { useState } from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import Select from '../components/Select'

const montar = (onChange = vi.fn(), value = '') => {
  render(
    <Select name="tag" value={value} onChange={onChange}>
      <option value="">Nenhuma</option>
      <option value="informatica">Informática</option>
      <option value="pintura">Pintura</option>
    </Select>
  )
  return onChange
}

describe('Select personalizado', () => {
  it('mostra a opção atual e abre a lista do sistema ao clicar', () => {
    montar(undefined, 'pintura')
    const campo = screen.getByRole('combobox')
    expect(campo).toHaveTextContent('Pintura')
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()

    fireEvent.click(campo)
    expect(screen.getAllByRole('option')).toHaveLength(3)
    expect(screen.getByRole('option', { name: 'Pintura' })).toHaveAttribute('aria-selected', 'true')
  })

  it('chama onChange com name e value, como o <select>', () => {
    const onChange = montar()
    fireEvent.click(screen.getByRole('combobox'))
    fireEvent.click(screen.getByRole('option', { name: 'Informática' }))

    expect(onChange).toHaveBeenCalledWith({ target: { name: 'tag', value: 'informatica' } })
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })

  it('funciona pelo teclado e Esc fecha só a lista', () => {
    const onChange = montar()
    const campo = screen.getByRole('combobox')
    const aoTeclarFora = vi.fn(e => e.key === 'Escape' && escFora())
    const escFora = vi.fn()
    document.addEventListener('keydown', aoTeclarFora)

    fireEvent.keyDown(campo, { key: 'ArrowDown' })
    fireEvent.keyDown(campo, { key: 'Escape' })
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
    expect(escFora).not.toHaveBeenCalled()

    fireEvent.keyDown(campo, { key: 'Enter' })
    fireEvent.keyDown(campo, { key: 'p' })
    fireEvent.keyDown(campo, { key: 'Enter' })
    expect(onChange).toHaveBeenCalledWith({ target: { name: 'tag', value: 'pintura' } })
    document.removeEventListener('keydown', aoTeclarFora)
  })

  it('com multiple, marca várias opções e "Todas" desmarca as demais', () => {
    const onChange = vi.fn()
    function Multiplo() {
      const [valor, setValor] = useState([])
      return (
        <Select multiple name="unidade" value={valor} onChange={e => { setValor(e.target.value); onChange(e) }}>
          <option value="">Todas</option>
          <option value="un">un</option>
          <option value="kg">kg</option>
          <option value="m">m</option>
        </Select>
      )
    }
    render(<Multiplo />)
    const campo = screen.getByRole('combobox')
    const opcao = nome => screen.getByRole('option', { name: nome })

    fireEvent.click(campo)
    expect(opcao('Todas')).toHaveAttribute('aria-selected', 'true')

    fireEvent.click(opcao('m'))
    fireEvent.click(opcao('un'))
    // A lista continua aberta e mantém a ordem das opções.
    expect(onChange).toHaveBeenLastCalledWith({ target: { name: 'unidade', value: ['un', 'm'] } })
    expect(opcao('Todas')).toHaveAttribute('aria-selected', 'false')
    expect(opcao('un')).toHaveAttribute('aria-selected', 'true')
    expect(campo).toHaveTextContent('un, m')

    fireEvent.click(opcao('un'))
    expect(onChange).toHaveBeenLastCalledWith({ target: { name: 'unidade', value: ['m'] } })

    fireEvent.click(opcao('Todas'))
    expect(onChange).toHaveBeenLastCalledWith({ target: { name: 'unidade', value: [] } })
    expect(campo).toHaveTextContent('Todas')
  })
})
