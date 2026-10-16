const CHAVE = 'viewMode'
export const MODOS_VALIDOS = ['auto', 'mobile', 'desktop']

export function lerModoSalvo() {
  try {
    const valor = localStorage.getItem(CHAVE)
    return MODOS_VALIDOS.includes(valor) ? valor : 'auto'
  } catch {
    return 'auto'
  }
}

export function salvarModo(modo) {
  try {
    localStorage.setItem(CHAVE, modo)
  } catch {
    // localStorage indisponível (ex: modo privado) — segue sem persistir
  }
}

export function aplicarModo(modo) {
  if (modo === 'auto') {
    delete document.documentElement.dataset.viewMode
  } else {
    document.documentElement.dataset.viewMode = modo
  }
}
