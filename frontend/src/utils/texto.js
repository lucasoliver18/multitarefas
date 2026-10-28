// Quantidade com a palavra no singular ou no plural, sem formas como
// "material(is)" ou "serviço(s)": 1 → singular; 0 ou mais de 1 → plural.
export const plural = (n, singular, pluralForma) => `${n} ${n === 1 ? singular : pluralForma}`
