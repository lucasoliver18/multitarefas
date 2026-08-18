<?php

namespace App\Http\Requests;

use App\Rules\CnpjValido;
use App\Rules\CpfValido;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateClienteRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        $clienteId = $this->route('cliente')?->id;

        return [
            'nome'        => 'sometimes|string|max:255',
            'tipo_pessoa' => 'sometimes|in:fisica,juridica',
            'telefone'    => ['nullable', 'string', 'regex:/^\(\d{2}\)\s\d{4,5}-\d{4}$/'],
            'email'       => 'nullable|email|max:255',
            'cpf'         => [
                'required_if:tipo_pessoa,fisica',
                'nullable',
                new CpfValido,
                Rule::unique('clientes', 'cpf')->ignore($clienteId)->where(fn ($query) => $query->whereNull('deleted_at')),
            ],
            'cnpj'        => [
                'required_if:tipo_pessoa,juridica',
                'nullable',
                new CnpjValido,
                Rule::unique('clientes', 'cnpj')->ignore($clienteId)->where(fn ($query) => $query->whereNull('deleted_at')),
            ],
            'observacoes' => 'nullable|string',
        ];
    }
}
