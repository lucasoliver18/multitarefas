<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreOrcamentoRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'servico_id'             => 'required|exists:servicos,id',
            'titulo'                 => 'required|string|max:255',
            'descricao'              => 'nullable|string',
            'margem_lucro'           => 'required|numeric|min:0|max:1000',
            'materiais'              => 'nullable|array',
            'materiais.*.id'         => 'required|exists:materiais,id',
            'materiais.*.quantidade' => 'required|numeric|min:0.001',
        ];
    }
}
