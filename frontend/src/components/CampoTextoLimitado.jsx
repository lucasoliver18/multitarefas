// Limite padrão dos textos livres (anotações, descrições de serviço e
// material). O contador fica âmbar ao se aproximar do limite.
const LIMITE_PADRAO = 500
const MARGEM_AVISO = 50

// Área de texto com limite de caracteres e contador "N/limite" abaixo, no
// padrão da tela de Anotações. `dica` aparece à esquerda do contador.
function CampoTextoLimitado({ value, onChange, limite = LIMITE_PADRAO, dica, className = '', ...props }) {
  const texto = value || ''
  return (
    <div className="flex flex-col">
      <textarea
        {...props}
        value={texto}
        // slice: colar um texto maior que o limite corta o excedente.
        onChange={e => onChange({ target: { name: e.target.name, value: e.target.value.slice(0, limite) } })}
        maxLength={limite}
        className={`${className} resize-none`}
      />
      <div className="flex justify-between items-center gap-2 mt-1.5">
        <span className="text-xs text-slate-400">{dica}</span>
        <span className={`text-xs shrink-0 ${texto.length >= limite - MARGEM_AVISO ? 'text-amber-600 font-semibold' : 'text-slate-400'}`}>
          {texto.length}/{limite}
        </span>
      </div>
    </div>
  )
}

export default CampoTextoLimitado
