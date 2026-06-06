import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import Navbar from '../components/Navbar'

function Home() {
  const [servicos, setServicos] = useState([])
  const navigate = useNavigate()

  useEffect(() => {
    api.get('/servicos').then(res => {
      setServicos(Array.isArray(res.data) ? res.data : [])
    })
  }, [])

  const corPrioridade = (p) =>
    p === 'alta' ? 'text-red-500' : p === 'media' ? 'text-amber-500' : 'text-green-600'

  const labelPrioridade = (p) =>
    p === 'alta' ? '🔺 Alta' : p === 'media' ? '🔸 Média' : '🔻 Baixa'

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col max-w-sm mx-auto">

      {/* Header */}
      <div className="bg-[#1e3a5f] px-6 pt-10 pb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#2563eb] flex items-center justify-center text-white font-bold text-sm shrink-0">
            L
          </div>
          <div>
            <h1 className="text-base font-bold text-white">Olá, Luciano!</h1>
            <p className="text-xs text-slate-300">Pronto para mais um dia?</p>
          </div>
        </div>
      </div>

      {/* Próximos Prazos */}
      <div className="px-6 mt-5 mb-5">
        <h2 className="text-sm font-bold text-slate-800 mb-3">Próximos Prazos</h2>
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <p className="text-sm font-semibold text-slate-800">Revisão de Sistema de Segurança</p>
              <p className="text-xs text-slate-500 mt-1">Em <span className="text-red-500 font-semibold">1 dia</span></p>
              <div className="flex items-center gap-1 mt-3">
                <div className="w-3 h-3 rounded-full border-2 border-slate-300" />
                <div className="flex-1 h-0.5 bg-slate-200" />
                <div className="w-3 h-3 rounded-full border-2 border-slate-300" />
                <div className="flex-1 h-0.5 bg-slate-200" />
                <div className="w-3 h-3 rounded-full border-2 border-slate-300" />
                <div className="flex-1 h-0.5 bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-red-400" />
              </div>
            </div>
            <div className="ml-4 w-16 h-16 rounded-full border-2 border-red-400 flex flex-col items-center justify-center shrink-0">
              <span className="text-red-500 font-bold text-xl leading-none">1</span>
              <span className="text-red-500 text-xs leading-none">dia</span>
              <span className="text-red-500 text-xs leading-none">restante</span>
            </div>
          </div>
          <p className="text-xs text-[#2563eb] mt-3 cursor-pointer font-medium" onClick={() => navigate('/prazos')}>
            Ver prazos →
          </p>
        </div>
      </div>

      {/* Serviços em andamento */}
      <div className="px-6 mb-8">
        <h2 className="text-sm font-bold text-slate-800 mb-3">Serviços em andamento</h2>
        {servicos.length === 0 ? (
          <p className="text-xs text-slate-400">Nenhum serviço cadastrado ainda.</p>
        ) : (
          <div className="flex gap-2">
            {servicos.slice(0, 3).map(s => (
              <div key={s.id} className="flex-1 bg-white rounded-2xl p-3 border border-slate-100 shadow-sm">
                <p className="text-xs text-slate-700 font-medium leading-tight">{s.titulo}</p>
                <p className="text-xs text-slate-400 mt-1">{s.cliente}</p>
                <p className={`text-xs mt-2 font-semibold ${corPrioridade(s.prioridade)}`}>
                  {labelPrioridade(s.prioridade)}
                </p>
              </div>
            ))}
          </div>
        )}
        <p
          onClick={() => navigate('/servicos')}
          className="text-xs text-[#2563eb] mt-2 cursor-pointer font-medium"
        >
          Ver todos →
        </p>
      </div>

      <Navbar />
    </div>
  )
}

export default Home
