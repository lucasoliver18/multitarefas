<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreServicoRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'titulo'    => 'required|string|max:255',
            'cliente'   => 'required|string|max:255',
            'prioridade'=> 'required|in:alta,media,baixa',
            'status'    => 'required|in:pendente,em_andamento,finalizado',
            'prazo'     => 'nullable|date',
            'descricao' => 'nullable|string',
            'tag'       => 'nullable|in:informatica,pintura,outros',
        ];
    }
}
