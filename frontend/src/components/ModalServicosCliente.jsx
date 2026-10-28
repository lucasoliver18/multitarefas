import ModalServicos from './servicos/ModalServicos'

// Todos os serviços de um cliente, com os mesmos filtros, ações e paginação
// da tela de Serviços.
function ModalServicosCliente({ cliente, onFechar }) {
  return (
    <ModalServicos
      aberto={!!cliente}
      chave={cliente?.id}
      titulo={cliente ? `Serviços de ${cliente.nome}` : ''}
      subtitulo="Clique em um serviço para editá-lo"
      parametros={{ cliente_id: cliente?.id }}
      onFechar={onFechar}
    />
  )
}

export default ModalServicosCliente
