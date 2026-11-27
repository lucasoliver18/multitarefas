<?php

namespace App\Http\Requests;

use App\Http\Requests\Concerns\ValidaSemMateriais;
use App\Http\Requests\Concerns\ValidaTagDosMateriais;
use App\Models\Servico;
use App\Support\LimitesBanco;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class StoreOrcamentoRequest extends FormRequest
{
    use ValidaSemMateriais, ValidaTagDosMateriais;

    public function authorize(): bool { return true; }

    protected function prepareForValidation(): void
    {
        // Sem materiais, o valor do orçamento é informado direto em R$.
        if ($this->boolean('sem_materiais')) {
            $this->merge(['tipo_margem' => 'valor']);
        } elseif (! $this->filled('tipo_margem')) {
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
            'sem_materiais'          => 'sometimes|boolean',
            'materiais'              => ['nullable', 'array', Rule::prohibitedIf(fn () => $this->boolean('sem_materiais'))],
            'materiais.*.id'         => ['required', 'integer', 'distinct', Rule::exists('materiais', 'id')->whereNull('deleted_at')],
            'materiais.*.quantidade' => 'required|numeric|min:0.001|max:' . LimitesBanco::QUANTIDADE_MAX,
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            $this->validarValorSemMateriais($validator, $this->boolean('sem_materiais'), $this->input('margem_lucro'));
            // servico_id fora do formato já foi recusado pelas regras acima.
            $servicoId = $this->input('servico_id');
            $this->validarTagDosMateriais($validator, is_numeric($servicoId) ? Servico::find($servicoId) : null);
        });
    }
}
