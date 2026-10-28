export const FORM_CLIENTE_VAZIO = { nome: '', tipo_pessoa: 'fisica', cpf: '', cnpj: '', telefone: '', email: '', observacoes: '' }

// Monta o corpo enviado à API: só o documento do tipo de pessoa escolhido.
export const payloadCliente = (form) => ({
  ...form,
  cpf: form.tipo_pessoa === 'fisica' ? form.cpf : null,
  cnpj: form.tipo_pessoa === 'juridica' ? form.cnpj : null,
})
