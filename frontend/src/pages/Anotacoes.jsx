import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Trash2 } from 'lucide-react'
import api from '../services/api'
import Button from '../components/Button'
import { Pagina, CabecalhoPagina, Carregando } from '../components/Pagina'
import { useToast } from '../hooks/useToast'
import { mensagemErro } from '../utils/erros'

const LIMITE_CARACTERES = 500
const LIMITE_AVISO = 450

function Anotacoes() {
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const [servico, setServico] = useState(null)
  const [anotacoes, setAnotacoes] = useState([])
  const [novaAnotacao, setNovaAnotacao] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get(`/servicos/${id}`),
      api.get(`/servicos/${id}/anotacoes`),
    ]).then(([resServico, resAnotacoes]) => {
      setServico(resServico.data)
      setAnotacoes(Array.isArray(resAnotacoes.data) ? resAnotacoes.data : [])
    }).catch(e => {
      toast.erro(mensagemErro(e, 'Erro ao carregar anotações.'))
      navigate('/servicos')
    }).finally(() => setCarregando(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const salvarAnotacao = async () => {
    if (!novaAnotacao.trim()) return
    setSalvando(true)
    try {
      const res = await api.post(`/servicos/${id}/anotacoes`, { conteudo: novaAnotacao.trim() })
      setAnotacoes(prev => [res.data, ...prev])
      setNovaAnotacao('')
      toast.sucesso('Anotação salva')
    } catch (e) {
      toast.erro(mensagemErro(e, 'Erro ao salvar anotação.'))
    } finally {
      setSalvando(false)
    }
  }

  const deletarAnotacao = (anotacaoId) => {
    toast.confirmar('Remover esta anotação?', async () => {
      try {
        await api.delete(`/anotacoes/${anotacaoId}`)
        setAnotacoes(prev => prev.filter(a => a.id !== anotacaoId))
        toast.sucesso('Anotação removida')
      } catch (e) {
        toast.erro(mensagemErro(e, 'Erro ao remover anotação.'))
      }
    })
  }

  const formatarData = (iso) => {
    const d = new Date(iso)
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  if (carregando) return <Carregando />

  return (
    <Pagina largura="max-w-6xl">
      <CabecalhoPagina
        titulo="Anotações"
        subtitulo={servico ? [servico.titulo, servico.cliente].filter(Boolean).join(' · ') : null}
        voltar={{ label: 'Voltar', onClick: () => navigate(-1) }}
      />

      <div className="grid grid-cols-[22rem_minmax(0,1fr)] gap-6 items-start">
        <div className="sticky top-8 bg-white rounded-2xl p-6 border border-slate-200 flex flex-col">
          <p className="text-base font-bold text-slate-800 mb-3">Nova anotação</p>
          <textarea
            value={novaAnotacao}
            onChange={e => setNovaAnotacao(e.target.value.slice(0, LIMITE_CARACTERES))}
            onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) salvarAnotacao() }}
            placeholder="Escreva sua anotação aqui..."
            rows={8}
            maxLength={LIMITE_CARACTERES}
            className="w-full text-sm text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none resize-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
          <div className="flex justify-between items-center mt-1.5">
            <span className="text-xs text-slate-400">Ctrl + Enter para salvar</span>
            <span className={`text-xs ${novaAnotacao.length >= LIMITE_AVISO ? 'text-amber-600 font-semibold' : 'text-slate-400'}`}>
              {novaAnotacao.length}/{LIMITE_CARACTERES}
            </span>
          </div>
          <Button
            onClick={salvarAnotacao}
            disabled={salvando || !novaAnotacao.trim()}
            className="mt-4 text-sm font-semibold py-2.5 rounded-xl"
          >
            {salvando ? 'Salvando...' : 'Salvar anotação'}
          </Button>
        </div>

        <div className="flex flex-col gap-3">
          {anotacoes.length === 0 ? (
            <div className="text-center text-slate-400 text-sm py-16 bg-white rounded-2xl border border-dashed border-slate-200">
              Nenhuma anotação ainda. Adicione a primeira ao lado!
            </div>
          ) : (
            anotacoes.map(a => (
              <div key={a.id} className="bg-white rounded-2xl p-5 border border-slate-200 group">
                <div className="flex justify-between items-center gap-2 mb-2">
                  <span className="text-xs font-medium text-slate-400">{formatarData(a.created_at)}</span>
                  <button
                    onClick={() => deletarAnotacao(a.id)}
                    aria-label="Remover anotação"
                    title="Remover"
                    className="p-1.5 text-red-400 rounded-lg shrink-0 hover:text-red-600 hover:bg-red-50 active:scale-90 transition-all"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
                <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap break-words">{a.conteudo}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </Pagina>
  )
}

export default Anotacoes
