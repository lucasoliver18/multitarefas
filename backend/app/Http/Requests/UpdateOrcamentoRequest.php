<?php

namespace App\Http\Requests;

use App\Http\Requests\Concerns\ValidaSemMateriais;
use App\Http\Requests\Concerns\ValidaTagDosMateriais;
use App\Models\Material;
use App\Models\Orcamento;
use App\Support\LimitesBanco;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class UpdateOrcamentoRequest extends FormRequest
{
    use ValidaSemMateriais, ValidaTagDosMateriais;

    public function authorize(): bool { return true; }

    // Marcar "sem materiais" na edição passa o valor para R$.
    protected function prepareForValidation(): void
    {
        if ($this->boolean('sem_materiais')) {
            $this->merge(['tipo_margem' => 'valor']);
        }
    }

    // Vale o que veio na requisição; sem o campo, o que já está salvo.
    private function semMateriais(): bool
    {
        return $this->has('sem_materiais')
            ? $this->boolean('sem_materiais')
            : (bool) $this->route('orcamento')?->sem_materiais;
    }

    public function rules(): array
    {
        // Sem tipo na requisição, vale o tipo já salvo no orçamento.
        $tipo = $this->input('tipo_margem', $this->route('orcamento')?->tipo_margem);

        return [
            'titulo'                 => 'sometimes|required|string|max:255',
            'descricao'              => 'nullable|string|max:' . LimitesBanco::TEXTO_MAX,
            'tipo_margem'            => ['sometimes', 'required', Rule::in(LimitesBanco::TIPOS_MARGEM)],
            // Trocar o tipo exige reenviar a margem (10% e R$ 10 não são o mesmo valor).
            'margem_lucro'           => 'required_with:tipo_margem|numeric|min:0|max:' . LimitesBanco::margemMax($tipo),
            'sem_materiais'          => 'sometimes|boolean',
            'materiais'              => ['nullable', 'array', Rule::prohibitedIf(fn () => $this->semMateriais())],
            // Aceita material já excluído: o orçamento pode tê-lo de antes da exclusão.
            'materiais.*.id'         => ['required', 'integer', 'distinct', Rule::exists('materiais', 'id')],
            'materiais.*.quantidade' => 'required|numeric|min:0.001|max:' . LimitesBanco::QUANTIDADE_MAX,
        ];
    }

    // Material excluído do cadastro: só continua no orçamento se já estava
    // nele, e a quantidade pode ser mantida ou diminuída (aumentar mexeria no
    // estoque de um material que não existe mais). Remover é sempre possível.
    private function validarMateriaisExcluidos(Validator $validator, ?Orcamento $orcamento): void
    {
        $itens = $this->input('materiais');
        if (! $orcamento || ! is_array($itens) || $validator->errors()->isNotEmpty()) {
            return;
        }

        $vinculados = $orcamento->materiais()->get()->keyBy('id');
        $excluidos = Material::onlyTrashed()
            ->whereIn('id', collect($itens)->pluck('id')->map(fn ($id) => (int) $id)->all())
            ->get()
            ->keyBy('id');

        foreach ($itens as $item) {
            $material = $excluidos->get((int) ($item['id'] ?? 0));
            if (! $material) {
                continue;
            }

            $atual = $vinculados->get($material->id)?->pivot->quantidade;
            if ($atual === null) {
                $validator->errors()->add('materiais', 'Material não encontrado. Remova-o do orçamento.');
            } elseif ((float) $item['quantidade'] > (float) $atual + 0.0000001) {
                $validator->errors()->add('materiais', "O material \"{$material->nome}\" foi excluído do cadastro: só é possível manter ou diminuir a quantidade, ou removê-lo.");
            }
        }
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            $orcamento = $this->route('orcamento');
            $this->validarValorSemMateriais(
                $validator,
                $this->semMateriais(),
                $this->input('margem_lucro', $orcamento?->margem_lucro)
            );
            $this->validarMateriaisExcluidos($validator, $orcamento);
            $this->validarTagDosMateriais(
                $validator,
                $orcamento?->servico,
                $orcamento?->materiais()->pluck('materiais.id')->map(fn ($id) => (int) $id)->all() ?? []
            );
        });
    }
}
