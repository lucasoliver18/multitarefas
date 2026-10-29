import Button from './Button'

// Confirmação de exclusão no rodapé dos cartões (e abaixo das linhas das
// listas). Ocupa a linha inteira, com o texto à esquerda e os botões à direita,
// sempre numa linha só. A largura disponível é medida pelo próprio componente
// (@container): onde não cabe a `mensagem` completa ao lado dos botões, como
// nos cartões estreitos de Clientes e Materiais, mostra a `mensagemCurta`.
function ConfirmacaoCartao({ mensagem, mensagemCurta = 'Excluir?', rotuloConfirmar = 'Excluir', onConfirmar, onCancelar }) {
  return (
    <div className="@container w-full" onClick={e => e.stopPropagation()}>
      <div className="entrada-suave flex items-center gap-3">
        <p className="text-sm font-medium text-slate-700 flex-1 min-w-0 whitespace-nowrap">
          <span className="@[23rem]:hidden">{mensagemCurta}</span>
          <span className="hidden @[23rem]:inline">{mensagem}</span>
        </p>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="danger" onClick={onConfirmar} className="text-sm px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap">
            {rotuloConfirmar}
          </Button>
          <Button variant="ghost" onClick={onCancelar} className="text-sm px-3 py-1.5 rounded-lg font-semibold">
            Cancelar
          </Button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmacaoCartao
