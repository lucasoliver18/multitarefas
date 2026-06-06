import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import Navbar from '../components/Navbar'
import { useToast } from '../hooks/useToast'

const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
const DIAS_SEMANA = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb']

const COR_PONTO = { alta: 'bg-red-500', media: 'bg-orange-400', baixa: 'bg-green-400' }

const TAG_LABEL = { informatica: 'Informática', pintura: 'Pintura', outros: 'Outros' }

const badgeStatus = (s) => ({
  finalizado:   'bg-[#dcfce7] text-[#166534]',
  em_andamento: 'bg-[#dbeafe] text-[#1e40af]',
  pendente:     'bg-[#fef9c3] text-[#854d0e]',
}[s] || 'bg-[#fef9c3] text-[#854d0e]')

const LABEL_STATUS = { finalizado: '✔ Finalizado', em_andamento: '🔄 Em andamento', pendente: '⏳ Pendente' }

function Prazos() {
  const navigate = useNavigate()
  const toast = useToast()
  const hoje = new Date()

  const [servicos, setServicos] = useState([])
  const [ano, setAno] = useState(hoje.getFullYear())
  const [mes, setMes] = useState(hoje.getMonth())
  const [diaSelecionado, setDiaSelecionado] = useState(hoje.getDate())
  const [filtroTags, setFiltroTags] = useState([])
  const [filtroPrioridade, setFiltroPrioridade] = useState(null)
  const [filtroStatus, setFiltroStatus] = useState(null)
  const [editandoNota, setEditandoNota] = useState(null)
  const [rascunhoNota, setRascunhoNota] = useState('')
  const [salvandoNota, setSalvandoNota] = useState(false)

  useEffect(() => {
    api.get('/servicos').then(res => {
      setServicos(Array.isArray(res.data) ? res.data : [])
    })
  }, [])

  const todasTags = useMemo(() =>
    [...new Set(servicos.map(s => s.tag).filter(Boolean))],
    [servicos]
  )

  const servicosFiltrados = useMemo(() => {
    return servicos.filter(s => {
      if (filtroTags.length > 0 && !filtroTags.includes(s.tag)) return false
      if (filtroPrioridade && s.prioridade !== filtroPrioridade) return false
      if (filtroStatus && s.status !== filtroStatus) return false
      return true
    })
  }, [servicos, filtroTags, filtroPrioridade, filtroStatus])

  const servicosDaData = (d) => {
    const dateStr = `${ano}-${String(mes + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    return servicosFiltrados.filter(s => s.prazo === dateStr)
  }

  const servicosDiaSelecionado = useMemo(() => {
    if (!diaSelecionado) return []
    const dateStr = `${ano}-${String(mes + 1).padStart(2, '0')}-${String(diaSelecionado).padStart(2, '0')}`
    return servicosFiltrados.filter(s => s.prazo === dateStr)
  }, [servicosFiltrados, diaSelecionado, ano, mes])

  const semanas = useMemo(() => {
    const diasNoMes = new Date(ano, mes + 1, 0).getDate()
    const primeiroDia = new Date(ano, mes, 1).getDay()
    const resultado = []
    let semana = Array(primeiroDia).fill(null)
    for (let dia = 1; dia <= diasNoMes; dia++) {
      semana.push(dia)
      if (semana.length === 7) { resultado.push(semana); semana = [] }
    }
    if (semana.length > 0) {
      while (semana.length < 7) semana.push(null)
      resultado.push(semana)
    }
    return resultado
  }, [ano, mes])

  const mesAnterior = () => {
    setMes(m => { if (m === 0) { setAno(a => a - 1); return 11 } return m - 1 })
    setDiaSelecionado(null)
  }

  const proximoMes = () => {
    setMes(m => { if (m === 11) { setAno(a => a + 1); return 0 } return m + 1 })
    setDiaSelecionado(null)
  }

  const toggleTag = (tag) =>
    setFiltroTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])
  const togglePrioridade = (p) => setFiltroPrioridade(prev => prev === p ? null : p)
  const toggleStatus = (s) => setFiltroStatus(prev => prev === s ? null : s)

  const abrirEdicaoNota = (s) => {
    setEditandoNota(s.id)
    setRascunhoNota(s.descricao || '')
  }

  const cancelarEdicaoNota = () => {
    setEditandoNota(null)
    setRascunhoNota('')
  }

  const salvarNota = async (servicoId) => {
    setSalvandoNota(true)
    try {
      await api.patch(`/servicos/${servicoId}`, { descricao: rascunhoNota })
      setServicos(prev => prev.map(s => s.id === servicoId ? { ...s, descricao: rascunhoNota } : s))
      setEditandoNota(null)
      toast.sucesso('Nota salva!')
    } catch {
      toast.erro('Erro ao salvar nota.')
    } finally {
      setSalvandoNota(false)
    }
  }

  const limparFiltros = () => { setFiltroTags([]); setFiltroPrioridade(null); setFiltroStatus(null) }
  const temFiltroAtivo = filtroTags.length > 0 || filtroPrioridade || filtroStatus

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col max-w-sm mx-auto">

      {/* Header */}
      <div className="bg-[#1e3a5f] px-6 pt-10 pb-5">
        <h1 className="text-lg font-bold text-white">Prazos</h1>
        <p className="text-xs text-slate-300 mt-0.5">Calendário de serviços</p>
      </div>

      {/* Filtros */}
      <div className="px-6 pt-4 mb-3 flex flex-col gap-2">
        {todasTags.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            {todasTags.map(tag => (
              <button key={tag} onClick={() => toggleTag(tag)}
                className={`text-xs px-3 py-1 rounded-full font-medium ${filtroTags.includes(tag) ? 'bg-[#2563eb] text-white' : 'bg-slate-200 text-slate-600'}`}>
                {TAG_LABEL[tag] || `#${tag}`}
              </button>
            ))}
          </div>
        )}

        <div className="flex gap-2 flex-wrap items-center">
          <span className="text-xs text-slate-400">Prioridade:</span>
          {[
            { val: 'alta',  label: '🔺 Alta',  ativo: 'bg-red-500 text-white',    inativo: 'bg-slate-100 text-slate-600' },
            { val: 'media', label: '🔸 Média',  ativo: 'bg-orange-400 text-white', inativo: 'bg-slate-100 text-slate-600' },
            { val: 'baixa', label: '🔻 Baixa',  ativo: 'bg-green-500 text-white',  inativo: 'bg-slate-100 text-slate-600' },
          ].map(({ val, label, ativo, inativo }) => (
            <button key={val} onClick={() => togglePrioridade(val)}
              className={`text-xs px-3 py-1 rounded-full font-medium ${filtroPrioridade === val ? ativo : inativo}`}>
              {label}
            </button>
          ))}
        </div>

        <div className="flex gap-2 flex-wrap items-center">
          <span className="text-xs text-slate-400">Status:</span>
          {[
            { val: 'pendente',     label: 'Pendente' },
            { val: 'em_andamento', label: 'Em andamento' },
            { val: 'finalizado',   label: 'Finalizado' },
          ].map(({ val, label }) => (
            <button key={val} onClick={() => toggleStatus(val)}
              className={`text-xs px-3 py-1 rounded-full font-medium ${filtroStatus === val ? 'bg-[#2563eb] text-white' : 'bg-slate-100 text-slate-600'}`}>
              {label}
            </button>
          ))}
        </div>

        {temFiltroAtivo && (
          <button onClick={limparFiltros} className="text-xs text-red-400 underline self-start">
            Limpar filtros
          </button>
        )}
      </div>

      {/* Calendário */}
      <div className="px-6 mb-4">
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">

          <div className="flex items-center justify-between mb-3">
            <button onClick={mesAnterior} className="w-8 h-8 flex items-center justify-center text-slate-500 text-lg hover:bg-slate-100 rounded-full">
              ‹
            </button>
            <p translate="no" className="text-sm font-semibold text-slate-700">
              {MESES[mes]} {ano}
            </p>
            <button onClick={proximoMes} className="w-8 h-8 flex items-center justify-center text-slate-500 text-lg hover:bg-slate-100 rounded-full">
              ›
            </button>
          </div>

          {/* Headers dos dias — via CSS attr() para imunidade ao autocomplete/translate */}
          <div className="grid grid-cols-7 mb-1">
            {DIAS_SEMANA.map(d => (
              <div
                key={d}
                data-dia={d}
                translate="no"
                className="cal-header text-center text-xs text-slate-400 font-medium py-1"
              />
            ))}
          </div>

          {/* Dias do mês */}
          {semanas.map((semana, i) => (
            <div key={i} className="grid grid-cols-7">
              {semana.map((dia, j) => {
                if (!dia) return <div key={j} className="h-9" />
                const servsDia = servicosDaData(dia)
                const isSelected = dia === diaSelecionado
                const isHoje = ano === hoje.getFullYear() && mes === hoje.getMonth() && dia === hoje.getDate()
                const pontosUnicos = [...new Set(servsDia.map(s => s.prioridade))]

                return (
                  <div key={j} onClick={() => setDiaSelecionado(dia)}
                    className="flex flex-col items-center py-0.5 cursor-pointer">
                    <div className={`w-7 h-7 flex items-center justify-center rounded-full text-xs
                      ${isSelected ? 'bg-[#2563eb] text-white font-bold'
                        : isHoje ? 'border-2 border-[#2563eb] text-[#2563eb] font-semibold'
                        : 'text-slate-700 hover:bg-slate-100'}`}>
                      {dia}
                    </div>
                    {pontosUnicos.length > 0 && (
                      <div className="flex gap-0.5 mt-0.5">
                        {pontosUnicos.map(p => (
                          <div key={p} className={`w-1.5 h-1.5 rounded-full ${COR_PONTO[p]}`} />
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Serviços do dia selecionado */}
      {diaSelecionado && (
        <div className="px-6 mb-24">
          <h2 className="text-sm font-bold text-slate-800 mb-3">
            {diaSelecionado} de {MESES[mes]} de {ano}
            <span className="text-xs font-normal text-slate-400 ml-2">
              ({servicosDiaSelecionado.length === 0 ? 'nenhum' : servicosDiaSelecionado.length === 1 ? '1 serviço' : `${servicosDiaSelecionado.length} serviços`})
            </span>
          </h2>

          {servicosDiaSelecionado.length === 0 ? (
            <div className="text-center text-slate-400 text-sm py-6 bg-white rounded-2xl border border-slate-100">
              Nenhum serviço com prazo neste dia.
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {servicosDiaSelecionado.map(s => (
                <div key={s.id} className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">{s.titulo}</p>
                      <p className="text-xs text-slate-500 mt-0.5">Cliente: {s.cliente}</p>
                    </div>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ${badgeStatus(s.status)}`}>
                      {LABEL_STATUS[s.status]}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 mt-2">
                    <span className={`text-xs font-semibold ${
                      s.prioridade === 'alta' ? 'text-red-500' :
                      s.prioridade === 'media' ? 'text-amber-500' : 'text-green-600'
                    }`}>
                      {s.prioridade === 'alta' ? '🔺 Alta' : s.prioridade === 'media' ? '🔸 Média' : '🔻 Baixa'}
                    </span>
                    {s.tag && (
                      <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full">
                        {TAG_LABEL[s.tag] || s.tag}
                      </span>
                    )}
                  </div>

                  {/* Notas */}
                  <div className="mt-2 bg-amber-50 rounded-xl px-3 py-2 border border-amber-100">
                    <div className="flex justify-between items-center mb-1">
                      <p className="text-xs text-slate-500 font-semibold">📝 Notas</p>
                      {editandoNota !== s.id && (
                        <button
                          onClick={() => abrirEdicaoNota(s)}
                          className="text-xs text-amber-600 font-semibold"
                        >
                          {s.descricao ? 'Editar' : '+ Adicionar'}
                        </button>
                      )}
                    </div>

                    {editandoNota === s.id ? (
                      <>
                        <textarea
                          value={rascunhoNota}
                          onChange={e => setRascunhoNota(e.target.value)}
                          placeholder="Escreva suas anotações aqui..."
                          rows={3}
                          className="w-full text-xs text-slate-700 bg-white border border-amber-200 rounded-lg px-2 py-1.5 outline-none resize-none focus:border-amber-400"
                          autoFocus
                        />
                        <div className="flex gap-2 mt-1.5">
                          <button
                            onClick={() => salvarNota(s.id)}
                            disabled={salvandoNota}
                            className="text-xs bg-amber-500 text-white px-3 py-1 rounded-full font-semibold disabled:opacity-60"
                          >
                            {salvandoNota ? 'Salvando...' : 'Salvar'}
                          </button>
                          <button
                            onClick={cancelarEdicaoNota}
                            className="text-xs text-slate-400 px-3 py-1 rounded-full font-semibold"
                          >
                            Cancelar
                          </button>
                        </div>
                      </>
                    ) : (
                      <p className="text-xs text-slate-600">
                        {s.descricao || <span className="text-slate-400 italic">Nenhuma nota adicionada.</span>}
                      </p>
                    )}
                  </div>

                  <button onClick={() => navigate(`/editar/${s.id}`)}
                    className="mt-3 text-xs text-[#2563eb] font-semibold">
                    Editar serviço →
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <Navbar />
    </div>
  )
}

export default Prazos
