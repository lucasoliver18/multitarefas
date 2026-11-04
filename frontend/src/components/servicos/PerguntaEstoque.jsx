import Modal from '../Modal'
import Button from '../Button'
import { plural } from '../../utils/texto'

// Ao excluir serviço com orçamento aprovado: o estoque que a aprovação
// descontou volta ou fica descontado (o material pode já ter sido usado).
// `quantidade` só na exclusão em massa: quantos dos selecionados têm
// orçamento aprovado. Fechar (X/Esc/Cancelar) desiste da exclusão.
function PerguntaEstoque({ aberto, quantidade, onEscolher, onCancelar }) {
  return (
    <Modal aberto={aberto} titulo="Devolver ao estoque?" onFechar={onCancelar} largura="max-w-lg">
      <p className="text-sm text-slate-700">
        {quantidade
          ? `${plural(quantidade, 'dos serviços selecionados tem', 'dos serviços selecionados têm')} orçamento aprovado, que descontou materiais do estoque.`
          : 'Este serviço tem orçamento aprovado, que descontou materiais do estoque.'}
        {' '}Devolver esses materiais ao estoque?
      </p>
      <div className="flex justify-end gap-2">
        <Button variant="ghost" onClick={onCancelar} className="text-sm font-semibold px-4 py-2.5 rounded-xl">
          Cancelar
        </Button>
        <Button variant="secondary" onClick={() => onEscolher(false)} className="text-sm font-semibold px-4 py-2.5 rounded-xl">
          Manter descontado
        </Button>
        <Button onClick={() => onEscolher(true)} className="text-sm font-semibold px-4 py-2.5 rounded-xl">
          Devolver ao estoque
        </Button>
      </div>
    </Modal>
  )
}

export default PerguntaEstoque
