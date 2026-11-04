// Quantidade com a palavra no singular ou no plural, sem formas como
// "material(is)" ou "serviço(s)": 1 → singular; 0 ou mais de 1 → plural.
export const plural = (n, singular, pluralForma) => `${n} ${n === 1 ? singular : pluralForma}`

// Primeira letra maiúscula: "terça-feira, 3 de novembro" → "Terça-feira, 3 de novembro".
export const capitalizar = (texto) => texto.charAt(0).toUpperCase() + texto.slice(1)

// Padrão dos avisos (toasts): sem ponto final, inclusive nas mensagens que
// vêm do servidor. Reticências ("Salvando...") e "?" ficam como estão.
export const semPontoFinal = (mensagem) =>
  typeof mensagem === 'string' ? mensagem.trim().replace(/(?<!\.)\.$/, '') : mensagem
