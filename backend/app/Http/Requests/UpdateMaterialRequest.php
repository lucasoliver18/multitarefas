<?php

namespace App\Http\Requests;

use App\Support\LimitesBanco;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateMaterialRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        $id = $this->route('material')?->id ?? $this->route('material');

        return [
            'nome'               => ['sometimes', 'required', 'string', 'max:255', Rule::unique('materiais', 'nome')->ignore($id)->whereNull('deleted_at')],
            'marca_id'           => ['nullable', 'integer', Rule::exists('marcas', 'id')],
            'descricao'          => 'nullable|string|max:' . LimitesBanco::TEXTO_MAX,
            'tags'               => 'nullable|array',
            'tags.*'             => ['string', 'distinct', Rule::in(LimitesBanco::TAGS)],
            'unidade_medida'     => 'sometimes|required|string|max:50',
            'preco_unitario'     => 'sometimes|required|numeric|min:0|max:' . LimitesBanco::PRECO_MAX,
            'quantidade_estoque' => 'nullable|numeric|min:0|max:' . LimitesBanco::QUANTIDADE_MAX,
            'quantidade_minima'  => 'nullable|numeric|min:0|max:' . LimitesBanco::QUANTIDADE_MAX,
        ];
    }
}
