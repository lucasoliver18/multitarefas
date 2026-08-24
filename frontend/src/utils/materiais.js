export const UNIDADES = ['un', 'kg', 'g', 'L', 'mL', 'm', 'm²', 'm³', 'cx', 'pç', 'rolo']

export const materiaisComEstoqueInsuficiente = (itens) =>
  itens.filter(i => i.quantidade_estoque != null && parseFloat(i.quantidade || 0) > parseFloat(i.quantidade_estoque))
