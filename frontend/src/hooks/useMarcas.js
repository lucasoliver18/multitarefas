import api from '../services/api'

// Busca paginada para o campo de marca (mesmo formato de buscarClientesPagina).
export async function buscarMarcasPagina(busca, pagina) {
  const res = await api.get('/marcas', { params: { busca, por_pagina: 20, page: pagina } })
  return {
    itens: res.data.data ?? [],
    temMais: (res.data.meta?.current_page ?? 1) < (res.data.meta?.last_page ?? 1),
  }
}

export async function criarMarca(nome) {
  const res = await api.post('/marcas', { nome })
  return res.data
}

export async function excluirMarca(id) {
  await api.delete(`/marcas/${id}`)
}
