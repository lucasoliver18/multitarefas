import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { ToastProvider } from '../components/ToastNotification'
import NovoMaterial from '../pages/NovoMaterial'

vi.mock('../services/api', () => ({ default: { get: vi.fn(), post: vi.fn(), delete: vi.fn() } }))
import api from '../services/api'

const marcas = [
  { id: 4, nome: 'Genérica', materiais_count: 1 },
  { id: 5, nome: 'Genérico', materiais_count: 0 },
]

const montar = () => render(
  <MemoryRouter><ToastProvider><NovoMaterial /></ToastProvider></MemoryRouter>
)

// O campo de marca é o primeiro combobox (sem placeholder) depois do nome.
const campoMarca = () => screen.getAllByRole('textbox')[1]

describe('campo de marca do material', () => {
  beforeEach(() => {
    api.get.mockReset(); api.post.mockReset(); api.delete.mockReset()
    api.get.mockResolvedValue({ data: { data: marcas, meta: { current_page: 1, last_page: 1 } } })
  })

  it('só busca marcas depois de começar a digitar', async () => {
    montar()
    fireEvent.focus(campoMarca())
    await new Promise(r => setTimeout(r, 400))
    expect(api.get).not.toHaveBeenCalledWith('/marcas', expect.anything())

    fireEvent.change(campoMarca(), { target: { value: 'Gen' } })
    expect(await screen.findByText('Genérica')).toBeInTheDocument()
    expect(screen.getByText('Genérico')).toBeInTheDocument()
    expect(screen.getByText('1 material')).toBeInTheDocument()
    expect(screen.getByText('0 materiais')).toBeInTheDocument()
    expect(api.get).toHaveBeenCalledWith('/marcas', expect.objectContaining({ params: expect.objectContaining({ busca: 'Gen' }) }))
  })

  it('exclui uma marca pela lixeira após confirmar, avisando se está em uso', async () => {
    api.delete.mockResolvedValue({})
    montar()
    fireEvent.change(campoMarca(), { target: { value: 'Gen' } })
    await screen.findByText('Genérica')

    fireEvent.mouseDown(screen.getByLabelText('Excluir marca: Genérica'))
    expect(await screen.findByText(/"Genérica" está em 1 material\. Excluir mesmo assim\? Ele ficará sem marca\./)).toBeInTheDocument()

    fireEvent.click(screen.getByText('Confirmar'))
    await waitFor(() => expect(api.delete).toHaveBeenCalledWith('/marcas/4'))
    expect(await screen.findByText('Marca excluída')).toBeInTheDocument()
  })

  it('oferece cadastrar a marca digitada quando ela não existe', async () => {
    api.get.mockResolvedValue({ data: { data: [], meta: { current_page: 1, last_page: 1 } } })
    api.post.mockResolvedValue({ data: { id: 9, nome: 'Coral', materiais_count: 0 } })
    montar()

    fireEvent.change(campoMarca(), { target: { value: 'Coral' } })
    fireEvent.focus(campoMarca())
    fireEvent.mouseDown(await screen.findByText('Cadastrar "Coral" como nova marca'))

    await waitFor(() => expect(api.post).toHaveBeenCalledWith('/marcas', { nome: 'Coral' }))
    expect(await screen.findByText('Marca cadastrada')).toBeInTheDocument()
  })
})
