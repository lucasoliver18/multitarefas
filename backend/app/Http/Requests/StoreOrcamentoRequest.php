<?php

namespace App\Http\Requests;

use App\Http\Requests\Concerns\ValidaTagDosMateriais;
use App\Models\Servico;
use App\Support\LimitesBanco;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class StoreOrcamentoRequest extends FormRequest
{
    use ValidaTagDosMateriais;

    public function authorize(): bool { return true; }

    protected function prepareForValidation(): void
    {
        if (! $this->filled('tipo_margem')) {
            $this->merge(['tipo_margem' => 'percentual']);
        }
    }

    public function rules(): array
    {
        return [
            'servico_id'             => ['required', 'integer', Rule::exists('servicos', 'id')->whereNull('deleted_at')],
            'titulo'                 => 'required|string|max:255',
            'descricao'              => 'nullable|string|max:' . LimitesBanco::TEXTO_MAX,
            'tipo_margem'            => ['required', Rule::in(LimitesBanco::TIPOS_MARGEM)],
            'margem_lucro'           => 'required|numeric|min:0|max:' . LimitesBanco::margemMax($this->input('tipo_margem')),
            'materiais'              => 'nullable|array',
            'materiais.*.id'         => ['required', 'integer', 'distinct', Rule::exists('materiais', 'id')->whereNull('deleted_at')],
            'materiais.*.quantidade' => 'required|numeric|min:0.001|max:' . LimitesBanco::QUANTIDADE_MAX,
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            $this->validarTagDosMateriais($validator, Servico::find($this->input('servico_id')));
        });
    }
}
