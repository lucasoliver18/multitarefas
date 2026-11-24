<?php

namespace App\Http\Requests\Concerns;

use Illuminate\Validation\Validator;

// Orçamento "sem materiais" não tem custo: o valor informado em R$ é o total,
// então precisa ser maior que zero.
trait ValidaSemMateriais
{
    protected function validarValorSemMateriais(Validator $validator, bool $semMateriais, mixed $valor): void
    {
        if (! $semMateriais || $validator->errors()->has('margem_lucro')) {
            return;
        }

        if (! is_numeric($valor) || (float) $valor <= 0) {
            $validator->errors()->add('margem_lucro', 'Informe o valor do orçamento sem materiais.');
        }
    }
}
