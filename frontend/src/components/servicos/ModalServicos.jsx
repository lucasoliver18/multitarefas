import { useNavigate } from 'react-router-dom'
import { CalendarRange } from 'lucide-react'
import Modal from '../Modal'
import Paginacao from '../Paginacao'
import { CampoBusca, Carregando, Vazio } from '../Pagina'
import FiltrosServicos from './FiltrosServicos'
import { ServicoLinha, CabecalhoListaServicos, FecharMenuStatus } from './ItensServico'
import { useServicos } from '../../hooks/useServicos'
import { useFiltrosServicos, useServicosFiltrados } from '../../hooks/useFiltrosServicos'
import { useAcoesServico } from '../../hooks/useAcoesServico'
import { usePaginacao } from '../../hooks/usePaginacao'
import { useServicosOrdenados } from '../../hooks/useServicosOrdenados'
import { useValorAdiado } from '../../hooks/useValorAdiado'
import { hojeISO, dataValida } from '../../utils/prazos'

const formatarData = (iso) => new Date(iso + 'T00:00:00').toLocaleDateString('pt-BR')
const dataCompleta = (v) => dataValida(v) && Number(v.slice(0, 4)) >= 1900

// O período de prazo vai para o servidor, que só devolve os serviços dentro
// dele (evita trazer a base inteira). Os demais filtros são aplicados na tela.
function periodoParaServidor(prazoDe, prazoAte) {
  const de = dataCompleta(prazoDe) ? prazoDe : null
  const ate = dataCompleta(prazoAte) ? prazoAte : null
  if (de && ate && de > ate) return {}
  return { prazo_de: de, prazo_ate: ate }
}

function ConteudoModalServicos({ parametros, filtrosIniciais, ocultarFiltros }) {
  const navigate = useNavigate()
  const filtros = useFiltrosServicos({ valoresIniciais: filtrosIniciais })
  const { prazoDe, prazoAte } = filtros.valores
  // Adia em forma de texto (comparável): um objeto novo a cada render
  // reiniciaria o atraso sem parar.
  const periodo = useValorAdiado(JSON.stringify(periodoParaServidor(prazoDe, prazoAte)))

  const { servicos, carregando, buscar, deletar, mudarStatus, mudarPago } = useServicos({
    params: { ...parametros, ...JSON.parse(periodo) },
  })
  const acoes = useAcoesServico({ deletar, mudarStatus, mudarPago, buscar })
  const filtrados = useServicosFiltrados(servicos, filtros)
  const ordenados = useServicosOrdenados(filtrados)
  const { pagina, setPagina, tamanhoPagina, mudarTamanhoPagina, totalPaginas, itensPagina } = usePaginacao(ordenados)

  const ctx = { navigate, hojeStr: hojeISO(), selecaoAtiva: false, ...acoes }

  const avisoPeriodo = (prazoDe || prazoAte) && (
    <p className="text-sm text-slate-500 inline-flex items-center gap-2">
      <CalendarRange size={16} className="text-slate-400" />
      Prazos {prazoDe ? `de ${formatarData(prazoDe)} ` : ''}{prazoAte ? `até ${formatarData(prazoAte)}` : ''}. Altere em Filtros para ver outros períodos.
    </p>
  )

  if (carregando) return <Carregando texto="Carregando serviços..." />

  return (
    <>
      <FecharMenuStatus ctx={ctx} />

      <CampoBusca valor={filtros.busca} onChange={filtros.setBusca} placeholder="Buscar serviço pelo título ou cliente..." />
      <FiltrosServicos filtros={filtros} ocultar={ocultarFiltros} />
      {avisoPeriodo}

      {filtrados.length === 0 ? (
        <Vazio>Nenhum serviço encontrado para estes filtros.</Vazio>
      ) : (
        <>
          <Paginacao pagina={pagina} setPagina={setPagina} tamanhoPagina={tamanhoPagina}
            mudarTamanhoPagina={mudarTamanhoPagina} totalPaginas={totalPaginas} total={filtrados.length} />
          <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100">
            <CabecalhoListaServicos />
            {itensPagina.map(s => <ServicoLinha key={s.id} s={s} ctx={ctx} />)}
          </div>
        </>
      )}
    </>
  )
}

// "Mini tela de Serviços" em modal: mesma busca, filtros, ações e paginação.
// `parametros` são filtros fixos do servidor (ex.: { cliente_id } ou
// { status }); `filtrosIniciais` preenche os filtros ao abrir. Os filtros
// valem só enquanto o modal está aberto.
function ModalServicos({ aberto, titulo, subtitulo, parametros, filtrosIniciais, ocultarFiltros, onFechar, chave }) {
  return (
    <Modal aberto={aberto} titulo={titulo} subtitulo={subtitulo} onFechar={onFechar}>
      {aberto && (
        <ConteudoModalServicos
          key={chave}
          parametros={parametros}
          filtrosIniciais={filtrosIniciais}
          ocultarFiltros={ocultarFiltros}
        />
      )}
    </Modal>
  )
}

export default ModalServicos
