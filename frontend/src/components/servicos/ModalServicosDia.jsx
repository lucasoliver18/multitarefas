import { useNavigate } from 'react-router-dom'
import Modal from '../Modal'
import { Vazio } from '../Pagina'
import { ServicoLinha, CabecalhoListaServicos, FecharMenuStatus } from './ItensServico'
import { useAcoesServico } from '../../hooks/useAcoesServico'
import { hojeISO } from '../../utils/prazos'
import { plural } from '../../utils/texto'

// Todos os serviços de um dia do calendário de Prazos, na mesma lista do modal
// "Ver mais" do quadro de Serviços. Recebe a lista já filtrada pela tela (assim
// mostra exatamente os serviços daquele dia) e as funções de useServicos().
function ModalServicosDia({ aberto, titulo, servicos, deletar, mudarStatus, mudarPago, buscar, onFechar }) {
  const navigate = useNavigate()
  const acoes = useAcoesServico({ deletar, mudarStatus, mudarPago, buscar })
  const ctx = { navigate, hojeStr: hojeISO(), selecaoAtiva: false, ...acoes }

  return (
    <Modal
      aberto={aberto}
      titulo={titulo}
      subtitulo={`${plural(servicos.length, 'serviço', 'serviços')} · Clique em um serviço para editá-lo`}
      onFechar={onFechar}
    >
      <FecharMenuStatus ctx={ctx} />
      {servicos.length === 0 ? (
        <Vazio>Nenhum serviço com prazo neste dia.</Vazio>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100">
          <CabecalhoListaServicos semPrazo />
          {servicos.map(s => <ServicoLinha key={s.id} s={s} ctx={ctx} semPrazo />)}
        </div>
      )}
    </Modal>
  )
}

export default ModalServicosDia
