<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateServicoRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'titulo'    => 'sometimes|string|max:255',
            'cliente'   => 'sometimes|string|max:255',
            'prioridade'=> 'sometimes|in:alta,media,baixa',
            'status'    => 'sometimes|in:pendente,em_andamento,finalizado',
            'prazo'     => 'nullable|date',
            'descricao' => 'nullable|string',
            'tag'       => 'nullable|in:informatica,pintura,outros',
        ];
    }
}
