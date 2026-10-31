<?php

namespace App\Http\Requests;

use App\Http\Requests\Concerns\NormalizaCnpj;
use App\Rules\CnpjValido;
use App\Rules\CpfValido;
use App\Support\LimitesBanco;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateClienteRequest extends FormRequest
{
    use NormalizaCnpj;

    public function authorize(): bool { return true; }

    public function rules(): array
    {
        $cliente = $this->route('cliente');
        $clienteId = $cliente?->id;

        return [
            'nome'        => 'sometimes|required|string|max:255',
            // O tipo de pessoa é definido no cadastro e não muda depois:
            // um cliente PF continua PF (só o CPF pode ser corrigido).
            'tipo_pessoa' => [
                'sometimes', 'required', 'in:fisica,juridica',
                function (string $attribute, mixed $value, \Closure $fail) use ($cliente) {
                    if ($cliente && $value !== $cliente->tipo_pessoa) {
                        $fail('O tipo de pessoa não pode ser alterado após o cadastro.');
                    }
                },
            ],
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
            'observacoes' => 'nullable|string|max:' . LimitesBanco::TEXTO_MAX,
        ];
    }
}
