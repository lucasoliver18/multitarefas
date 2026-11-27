import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import ComboboxAsync from '../components/ComboboxAsync'

// Falha na busca (sem conexão, servidor fora do ar): o campo continua
// funcionando, sem erro sem tratamento e sem repetir a busca sozinho.
describe('busca do campo com lista (ComboboxAsync) quando o servidor falha', () => {
  it('não deixa o erro escapar e uma nova digitação busca de novo', async () => {
    const buscarPagina = vi.fn()
      .mockRejectedValueOnce(new Error('Network Error'))
      .mockResolvedValue({ itens: [{ id: 1, nome: 'Eunice' }], temMais: false })

    render(
      <ComboboxAsync valor="" onChangeTexto={() => {}} onSelecionar={() => {}}
        buscarPagina={buscarPagina} renderItem={c => <span>{c.nome}</span>} />
    )
    const campo = screen.getByRole('textbox')

    fireEvent.focus(campo)
    fireEvent.change(campo, { target: { value: 'Eu' } })
    await waitFor(() => expect(buscarPagina).toHaveBeenCalledTimes(1))
    // A falha não traz itens nem fica "Carregando..." para sempre.
    await waitFor(() => expect(screen.queryByText('Carregando...')).not.toBeInTheDocument())
    expect(screen.queryByText('Eunice')).not.toBeInTheDocument()

    // Sem nova digitação, não tenta de novo sozinho.
    await act(() => new Promise(r => setTimeout(r, 400)))
    expect(buscarPagina).toHaveBeenCalledTimes(1)

    fireEvent.change(campo, { target: { value: 'Eun' } })
    expect(await screen.findByText('Eunice')).toBeInTheDocument()
    expect(buscarPagina).toHaveBeenCalledTimes(2)
  })

  it('falha ao carregar mais itens para de pedir a próxima página', async () => {
    const buscarPagina = vi.fn()
      .mockResolvedValueOnce({ itens: [{ id: 1, nome: 'Cliente 1' }], temMais: true })
      .mockRejectedValue(new Error('Network Error'))

    // IntersectionObserver de mentira que "vê" a sentinela na hora (como rolar até o fim).
    const observados = []
    globalThis.IntersectionObserver = class {
      constructor(cb) { this.cb = cb }
      observe(el) { observados.push(el); this.cb([{ isIntersecting: true, target: el }]) }
      disconnect() {}
    }

    render(
      <ComboboxAsync valor="" onChangeTexto={() => {}} onSelecionar={() => {}}
        buscarPagina={buscarPagina} renderItem={c => <span>{c.nome}</span>} />
    )
    const campo = screen.getByRole('textbox')
    fireEvent.focus(campo)
    fireEvent.change(campo, { target: { value: 'Cli' } })

    expect(await screen.findByText('Cliente 1')).toBeInTheDocument()
    await waitFor(() => expect(buscarPagina).toHaveBeenCalledTimes(2))
    await act(() => new Promise(r => setTimeout(r, 300)))

    // Uma única tentativa de página 2; a lista que já estava continua na tela.
    expect(buscarPagina).toHaveBeenCalledTimes(2)
    expect(screen.getByText('Cliente 1')).toBeInTheDocument()
    delete globalThis.IntersectionObserver
  })
})
