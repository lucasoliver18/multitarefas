import { useEffect, useLayoutEffect, useRef, useState } from 'react'

const MARGEM = 8

// Posiciona um elemento flutuante (lista, calendário) junto a uma âncora, num
// portal com position: fixed, para não ser cortado por contêineres com overflow
// (painel de filtros, modais, cartões com rolagem). Abre abaixo da âncora ou,
// sem espaço, acima; acompanha rolagem/redimensionamento e fecha ao clicar fora.
// `largura`: fixa em px; sem ela, usa a largura da âncora. `alinhamento`:
// 'esquerda' (padrão) ou 'direita', em relação à âncora. Sem `onFechar`, não
// fecha ao clicar fora (quem usa cuida disso, ex.: FecharMenuStatus).
export function useFlutuante({ aberto, onFechar, altura, largura, alinhamento = 'esquerda' }) {
  const ancoraRef = useRef(null)
  const flutuanteRef = useRef(null)
  const [posicao, setPosicao] = useState(null)

  useLayoutEffect(() => {
    if (!aberto) return
    const posicionar = () => {
      const caixa = ancoraRef.current?.getBoundingClientRect()
      if (!caixa) return
      const abaixo = window.innerHeight - caixa.bottom - MARGEM
      const acima = caixa.top - MARGEM
      const paraCima = abaixo < altura && acima > abaixo
      const w = largura ?? caixa.width
      setPosicao({
        left: Math.max(MARGEM, Math.min(alinhamento === 'direita' ? caixa.right - w : caixa.left, window.innerWidth - w - MARGEM)),
        width: w,
        maxHeight: Math.min(altura, paraCima ? acima : abaixo),
        ...(paraCima ? { bottom: window.innerHeight - caixa.top + 4 } : { top: caixa.bottom + 4 }),
      })
    }
    posicionar()
    window.addEventListener('resize', posicionar)
    window.addEventListener('scroll', posicionar, true)
    return () => {
      window.removeEventListener('resize', posicionar)
      window.removeEventListener('scroll', posicionar, true)
    }
  }, [aberto, altura, largura, alinhamento])

  // Guardado em ref para o efeito não reinscrever o listener a cada render.
  const onFecharRef = useRef(onFechar)
  useLayoutEffect(() => { onFecharRef.current = onFechar })

  const fechaAoClicarFora = !!onFechar
  useEffect(() => {
    if (!aberto || !fechaAoClicarFora) return
    const aoClicar = (e) => {
      if (!ancoraRef.current?.contains(e.target) && !flutuanteRef.current?.contains(e.target)) onFecharRef.current()
    }
    document.addEventListener('mousedown', aoClicar)
    return () => document.removeEventListener('mousedown', aoClicar)
  }, [aberto, fechaAoClicarFora])

  // Antes de medir, o elemento fica invisível para não "piscar" fora do lugar.
  const estilo = posicao ?? { visibility: 'hidden' }

  return { ancoraRef, flutuanteRef, estilo }
}
