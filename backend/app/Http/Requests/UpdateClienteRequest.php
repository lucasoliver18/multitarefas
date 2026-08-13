<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateClienteRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'nome'        => 'sometimes|string|max:255',
            'telefone'    => 'nullable|string|max:50',
            'email'       => 'nullable|email|max:255',
            'observacoes' => 'nullable|string',
        ];
    }
}
