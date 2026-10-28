import { useEffect, useState } from 'react'

// Devolve `valor` só depois de ele ficar `atraso` ms sem mudar. Evita disparar
// uma busca a cada tecla (ex.: enquanto se digita uma data).
export function useValorAdiado(valor, atraso = 400) {
  const [adiado, setAdiado] = useState(valor)

  useEffect(() => {
    const t = setTimeout(() => setAdiado(valor), atraso)
    return () => clearTimeout(t)
  }, [valor, atraso])

  return adiado
}
