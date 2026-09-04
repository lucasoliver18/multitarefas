<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateServicoRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'titulo'     => 'sometimes|string|max:255',
            'cliente_id' => ['sometimes', 'integer', Rule::exists('clientes', 'id')->where(fn ($q) => $q->whereNull('deleted_at'))],
            'prioridade' => 'sometimes|in:alta,media,baixa',
            'status'     => 'sometimes|in:pendente,em_andamento,finalizado',
            'prazo'      => 'nullable|date_format:Y-m-d',
            'descricao'  => 'nullable|string',
            'tag'        => 'nullable|in:informatica,pintura,outros',
        ];
    }
}
