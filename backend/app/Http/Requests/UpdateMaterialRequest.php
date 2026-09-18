<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateMaterialRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        $id = $this->route('material')?->id ?? $this->route('material');

        return [
            'nome'               => ['sometimes', 'string', 'max:255', Rule::unique('materiais', 'nome')->ignore($id)->whereNull('deleted_at')],
            'marca'              => 'nullable|string|max:255',
            'descricao'          => 'nullable|string',
            'unidade_medida'     => 'sometimes|string|max:50',
            'preco_unitario'     => 'sometimes|numeric|min:0',
            'quantidade_estoque' => 'nullable|numeric|min:0',
            'quantidade_minima'  => 'nullable|numeric|min:0',
        ];
    }
}
