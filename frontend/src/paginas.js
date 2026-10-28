import { lazy } from 'react'

// Cada tela é carregada sob demanda (code splitting). `precarregarPaginas`
// baixa todas logo após o login, para que a primeira visita a uma tela não
// mostre "Carregando..." no lugar do conteúdo.
const carregadores = {
  Prazos:          () => import('./pages/Prazos'),
  NovoServico:     () => import('./pages/NovoServico'),
  Servicos:        () => import('./pages/Servicos'),
  EditarServico:   () => import('./pages/EditarServico'),
  Materiais:       () => import('./pages/Materiais'),
  NovoMaterial:    () => import('./pages/NovoMaterial'),
  EditarMaterial:  () => import('./pages/EditarMaterial'),
  Orcamentos:      () => import('./pages/Orcamentos'),
  NovoOrcamento:   () => import('./pages/NovoOrcamento'),
  EditarOrcamento: () => import('./pages/EditarOrcamento'),
  Clientes:        () => import('./pages/Clientes'),
  NovoCliente:     () => import('./pages/NovoCliente'),
  EditarCliente:   () => import('./pages/EditarCliente'),
  Anotacoes:       () => import('./pages/Anotacoes'),
}

export const paginas = Object.fromEntries(
  Object.entries(carregadores).map(([nome, carregar]) => [nome, lazy(carregar)])
)

export function precarregarPaginas() {
  Object.values(carregadores).forEach(carregar => carregar().catch(() => {}))
}
