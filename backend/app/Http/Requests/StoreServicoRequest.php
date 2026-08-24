<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreServicoRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'titulo'     => 'required|string|max:255',
            'cliente_id' => ['required', 'integer', Rule::exists('clientes', 'id')->where(fn ($q) => $q->whereNull('deleted_at'))],
            'prioridade' => 'required|in:alta,media,baixa',
            'status'     => 'required|in:pendente,em_andamento,finalizado',
            'prazo'      => 'nullable|date',
            'descricao'  => 'nullable|string',
            'tag'        => 'nullable|in:informatica,pintura,outros',
        ];
    }
}
