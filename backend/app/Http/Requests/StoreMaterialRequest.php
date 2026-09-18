<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreMaterialRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'nome'               => ['required', 'string', 'max:255', Rule::unique('materiais', 'nome')->whereNull('deleted_at')],
            'marca'              => 'nullable|string|max:255',
            'descricao'          => 'nullable|string',
            'unidade_medida'     => 'required|string|max:50',
            'preco_unitario'     => 'required|numeric|min:0',
            'quantidade_estoque' => 'nullable|numeric|min:0',
            'quantidade_minima'  => 'nullable|numeric|min:0',
        ];
    }
}
