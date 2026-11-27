// Mesma lista do backend (LimitesBanco::UNIDADES).
export const UNIDADES = ['un', 'kg', 'g', 'L', 'mL', 'm', 'm²', 'm³']

// Compara em 3 casas, a precisão do estoque no banco: em ponto flutuante,
// 0,7 + 0,1 dá 0,7999999999999999 e pedir 0,8 pareceria faltar estoque.
const emTresCasas = (v) => Math.round(parseFloat(v) * 1000) / 1000

export const materiaisComEstoqueInsuficiente = (itens) =>
  itens.filter(i => i.quantidade_estoque != null && emTresCasas(i.quantidade || 0) > emTresCasas(i.quantidade_estoque))

export const estaComEstoqueBaixo = (material) =>
  material.quantidade_minima != null &&
  parseFloat(material.quantidade_estoque) <= parseFloat(material.quantidade_minima)

// Validação e corpo enviado à API no cadastro/edição de material.
export function erroMaterial(form) {
  if (!form.nome || !form.preco_unitario) return 'Informe nome e preço'
  // Texto digitado sem escolher uma marca da lista (ou cadastrar uma nova).
  if (form.marca?.trim() && !form.marca_id) return 'Selecione uma marca da lista ou cadastre uma nova'
  return null
}

export function payloadMaterial(form) {
  // eslint-disable-next-line no-unused-vars
  const { marca, ...resto } = form
  return {
    ...resto,
    marca_id: form.marca_id || null,
    quantidade_estoque: form.quantidade_estoque === '' ? 0 : form.quantidade_estoque,
    quantidade_minima: form.quantidade_minima === '' ? null : form.quantidade_minima,
  }
}
