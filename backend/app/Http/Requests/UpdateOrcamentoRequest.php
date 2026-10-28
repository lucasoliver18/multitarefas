<?php

namespace App\Http\Requests;

use App\Http\Requests\Concerns\ValidaTagDosMateriais;
use App\Support\LimitesBanco;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class UpdateOrcamentoRequest extends FormRequest
{
    use ValidaTagDosMateriais;

    public function authorize(): bool { return true; }

    public function rules(): array
    {
        // Sem tipo na requisição, vale o tipo já salvo no orçamento.
        $tipo = $this->input('tipo_margem', $this->route('orcamento')?->tipo_margem);

        return [
            'titulo'                 => 'sometimes|required|string|max:255',
            'descricao'              => 'nullable|string|max:' . LimitesBanco::TEXTO_MAX,
            'tipo_margem'            => ['sometimes', 'required', Rule::in(LimitesBanco::TIPOS_MARGEM)],
            // Trocar o tipo exige reenviar a margem (10% e R$ 10 não são o mesmo valor).
            'margem_lucro'           => 'required_with:tipo_margem|numeric|min:0|max:' . LimitesBanco::margemMax($tipo),
            'materiais'              => 'nullable|array',
            // Aceita material já excluído: o orçamento pode tê-lo de antes da exclusão.
            'materiais.*.id'         => ['required', 'integer', 'distinct', Rule::exists('materiais', 'id')],
            'materiais.*.quantidade' => 'required|numeric|min:0.001|max:' . LimitesBanco::QUANTIDADE_MAX,
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            $orcamento = $this->route('orcamento');
            $this->validarTagDosMateriais(
                $validator,
                $orcamento?->servico,
                $orcamento?->materiais()->pluck('materiais.id')->map(fn ($id) => (int) $id)->all() ?? []
            );
        });
    }
}
