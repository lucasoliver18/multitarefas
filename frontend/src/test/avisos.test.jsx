import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { ToastProvider } from '../components/ToastNotification'
import { semPontoFinal } from '../utils/texto'
import { useToast } from '../hooks/useToast'
import { mensagemErro } from '../utils/erros'

describe('padrão dos avisos: sem ponto final', () => {
  it('tira só o ponto final; reticências, "?" e pontos no meio ficam', () => {
    expect(semPontoFinal('Informe o nome.')).toBe('Informe o nome')
    expect(semPontoFinal('Material não encontrado. Remova-o do orçamento.')).toBe('Material não encontrado. Remova-o do orçamento')
    expect(semPontoFinal('Excluir este serviço?')).toBe('Excluir este serviço?')
    expect(semPontoFinal('Salvando...')).toBe('Salvando...')
    expect(semPontoFinal('Margem máxima: R$ 99.999.999,99')).toBe('Margem máxima: R$ 99.999.999,99')
  })

  it('mensagem do servidor aparece no aviso sem o ponto final', () => {
    function Tela() {
      const toast = useToast()
      const erroDoServidor = { response: { status: 422, data: { errors: { cpf: ['O CPF informado é inválido.'] } } } }
      return (
        <>
          <button onClick={() => toast.erro(mensagemErro(erroDoServidor))}>erro</button>
          <button onClick={() => toast.erro(mensagemErro({ request: {} }))}>sem rede</button>
          <button onClick={() => toast.confirmar('Excluir mesmo assim? O estoque será devolvido.', () => {})}>confirmar</button>
        </>
      )
    }
    render(<ToastProvider><Tela /></ToastProvider>)

    act(() => { fireEvent.click(screen.getByText('erro')) })
    act(() => { fireEvent.click(screen.getByText('sem rede')) })
    act(() => { fireEvent.click(screen.getByText('confirmar')) })
    expect(screen.getByText('O CPF informado é inválido')).toBeInTheDocument()
    expect(screen.getByText('Sem conexão com o servidor')).toBeInTheDocument()
    expect(screen.getByText('Excluir mesmo assim? O estoque será devolvido')).toBeInTheDocument()
  })
})
