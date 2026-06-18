import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import Navbar from '../components/Navbar'

function RingProgresso({ diasRestantes }) {
  const r = 18
  const circ = 2 * Math.PI * r

  let cor, progresso
  if (diasRestantes < 0) {
    cor = '#ef4444'; progresso = 1
  } else if (diasRestantes <= 2) {
    cor = '#ef4444'; progresso = 0.92
  } else if (diasRestantes <= 7) {
    cor = '#f97316'; progresso = 0.55 + (7 - diasRestantes) / 7 * 0.30
  } else if (diasRestantes <= 14) {
    cor = '#eab308'; progresso = 0.25 + (14 - diasRestantes) / 14 * 0.30
  } else {
    cor = '#22c55e'; progresso = Math.max(0.08, (30 - Math.min(diasRestantes, 30)) / 30 * 0.25)
  }

  const dashoffset = circ * (1 - progresso)

  const labelNum = diasRestantes < 0 ? '!' : String(diasRestantes)
  const labelSub = diasRestantes < 0 ? 'venc.' : diasRestantes === 1 ? 'dia' : 'dias'

  return (
    <svg width="52" height="52" viewBox="0 0 52 52" className="shrink-0">
      <circle cx="26" cy="26" r={r} fill="none" stroke="#e2e8f0" strokeWidth="3.5" />
      <circle
        cx="26" cy="26" r={r}
        fill="none"
        stroke={cor}
        strokeWidth="3.5"
        strokeDasharray={circ}
        strokeDashoffset={dashoffset}
        strokeLinecap="round"
        transform="rotate(-90 26 26)"
      />
      <text x="26" y="22" textAnchor="middle" dominantBaseline="middle" fontSize="11" fontWeight="700" fill={cor}>
        {labelNum}
      </text>
      <text x="26" y="33" textAnchor="middle" dominantBaseline="middle" fontSize="7.5" fill={cor}>
        {labelSub}
      </text>
    </svg>
  )
}

const corTexto = (d) =>
  d < 0 ? 'text-red-500' : d <= 2 ? 'text-red-500' : d <= 7 ? 'text-orange-500' : d <= 14 ? 'text-yellow-600' : 'text-green-600'

const badgeStatus = (s) => ({
  finalizado:   'bg-[#dcfce7] text-[#166534]',
  em_andamento: 'bg-[#dbeafe] text-[#1e40af]',
  pendente:     'bg-[#fef9c3] text-[#854d0e]',
}[s] || 'bg-[#fef9c3] text-[#854d0e]')

const labelStatus = (s) => ({
  finalizado:   '✔ Finalizado',
  em_andamento: '🔄 Em andamento',
  pendente:     '⏳ Pendente',
}[s] || '⏳ Pendente')

const PERIODOS = [
  { val: '7d', label: '7 dias' },
  { val: '1m', label: '1 mês' },
  { val: '6m', label: '6 meses' },
]

function Home() {
  const [servicos, setServicos] = useState([])
  const [periodo, setPeriodo] = useState('1m')
  const navigate = useNavigate()

  useEffect(() => {
    api.get('/servicos').then(res => {
      setServicos(Array.isArray(res.data) ? res.data : [])
    }).catch(() => {})
  }, [])

  const hoje = useMemo(() => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d
  }, [])

  const servicosPeriodo = useMemo(() => {
    const limite = new Date()
    if (periodo === '7d') limite.setDate(limite.getDate() - 7)
    else if (periodo === '1m') limite.setMonth(limite.getMonth() - 1)
    else limite.setMonth(limite.getMonth() - 6)
    limite.setHours(0, 0, 0, 0)
    return servicos.filter(s => s.created_at && new Date(s.created_at) >= limite)
  }, [servicos, periodo])

  const proximos = useMemo(() => {
    return servicos
      .filter(s => s.prazo && s.status !== 'finalizado')
      .map(s => {
        const prazo = new Date(s.prazo + 'T00:00:00')
        const dias = Math.round((prazo - hoje) / (1000 * 60 * 60 * 24))
        return { ...s, diasRestantes: dias }
      })
      .sort((a, b) => a.diasRestantes - b.diasRestantes)
      .slice(0, 3)
  }, [servicos, hoje])

  const emAndamento = useMemo(() =>
    servicos.filter(s => s.status === 'em_andamento').slice(0, 3),
    [servicos]
  )

  const totais = useMemo(() => ({
    pendente:     servicosPeriodo.filter(s => s.status === 'pendente').length,
    em_andamento: servicosPeriodo.filter(s => s.status === 'em_andamento').length,
    finalizado:   servicosPeriodo.filter(s => s.status === 'finalizado').length,
  }), [servicosPeriodo])

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col pb-24">

      {/* Header */}
      <div className="page-header bg-[#1e3a5f] px-6 pb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#2563eb] flex items-center justify-center text-white font-bold text-sm shrink-0">
            L
          </div>
          <div>
            <h1 className="text-base font-bold text-white">Olá, Lucas!</h1>
            <p className="text-xs text-slate-300">Pronto para mais um dia?</p>
          </div>
        </div>

        {/* Seletor de período */}
        <div className="flex gap-1.5 mt-4">
          {PERIODOS.map(({ val, label }) => (
            <button
              key={val}
              onClick={() => setPeriodo(val)}
              className={`text-xs px-3 py-1 rounded-full font-medium transition-colors ${
                periodo === val ? 'bg-white text-[#1e3a5f]' : 'bg-white/15 text-white/70'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Indicadores de status */}
        <div className="flex gap-2 mt-3">
          {[
            { label: 'Pendentes',    val: totais.pendente,     cor: 'bg-yellow-400/20 text-yellow-200' },
            { label: 'Em andamento', val: totais.em_andamento, cor: 'bg-blue-400/20 text-blue-200' },
            { label: 'Finalizados',  val: totais.finalizado,   cor: 'bg-green-400/20 text-green-200' },
          ].map(({ label, val, cor }) => (
            <div key={label} className={`flex-1 rounded-xl px-2 py-2 text-center ${cor}`}>
              <p className="text-lg font-bold leading-none">{val}</p>
              <p className="text-xs mt-0.5 leading-tight">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Próximos Prazos */}
      <div className="px-6 mt-5 mb-5">
        <h2 className="text-sm font-bold text-slate-800 mb-3">Próximos Prazos</h2>

        {proximos.length === 0 ? (
          <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm text-center">
            <p className="text-xs text-slate-400">Nenhum prazo pendente.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {proximos.map(s => (
              <div key={s.id} className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{s.titulo}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{s.cliente}</p>
                    <p className={`text-xs font-semibold mt-1 ${corTexto(s.diasRestantes)}`}>
                      {s.diasRestantes < 0
                        ? 'Prazo vencido!'
                        : s.diasRestantes === 0
                        ? 'Vence hoje!'
                        : `Vence em ${s.diasRestantes} dia${s.diasRestantes > 1 ? 's' : ''}`}
                    </p>
                  </div>
                  <RingProgresso diasRestantes={s.diasRestantes} />
                </div>
              </div>
            ))}
          </div>
        )}

        <p className="text-xs text-[#2563eb] mt-2 cursor-pointer font-medium" onClick={() => navigate('/prazos')}>
          Ver calendário →
        </p>
      </div>

      {/* Serviços em andamento */}
      <div className="px-6 mb-4">
        <h2 className="text-sm font-bold text-slate-800 mb-3">Serviços em andamento</h2>

        {emAndamento.length === 0 ? (
          <p className="text-xs text-slate-400">Nenhum serviço em andamento.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {emAndamento.map(s => (
              <div key={s.id} className="bg-white rounded-2xl p-3 border border-slate-100 shadow-sm flex justify-between items-center">
                <div className="flex-1 min-w-0 pr-2">
                  <p className="text-sm font-semibold text-slate-800 truncate">{s.titulo}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{s.cliente}</p>
                </div>
                <span className={`text-xs font-semibold px-2 py-1 rounded-full shrink-0 ${badgeStatus(s.status)}`}>
                  {labelStatus(s.status)}
                </span>
              </div>
            ))}
          </div>
        )}

        <p onClick={() => navigate('/servicos')} className="text-xs text-[#2563eb] mt-2 cursor-pointer font-medium">
          Ver todos →
        </p>
      </div>

      <Navbar />
    </div>
  )
}

export default Home
