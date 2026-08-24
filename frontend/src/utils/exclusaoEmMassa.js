export async function excluirEmMassa(ids, deletarUm) {
  const resultados = await Promise.allSettled(ids.map(id => deletarUm(id)))

  let sucesso = 0
  const falhas = []
  resultados.forEach((r, i) => {
    if (r.status === 'fulfilled') sucesso++
    else falhas.push({ id: ids[i], erro: r.reason })
  })

  return { sucesso, falhas }
}
