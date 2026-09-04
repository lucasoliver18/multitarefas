import { Component } from 'react'
import { AlertTriangle } from 'lucide-react'

class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { erro: false }
  }

  static getDerivedStateFromError() {
    return { erro: true }
  }

  render() {
    if (this.state.erro) {
      return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4 px-6 text-center">
          <AlertTriangle size={40} className="text-amber-500" />
          <p className="text-base font-semibold text-slate-700">Algo deu errado.</p>
          <p className="text-xs text-slate-400">Recarregue a página para continuar.</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-[#2563eb] text-white text-sm font-semibold px-6 py-2 rounded-full"
          >
            Recarregar
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

export default ErrorBoundary
