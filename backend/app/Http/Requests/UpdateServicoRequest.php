<?php

namespace App\Http\Requests;

use App\Support\LimitesBanco;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class UpdateServicoRequest extends FormRequest
{
    // Esteira de status: um serviço só avança, nunca retrocede.
    private const ORDEM_STATUS = ['pendente' => 0, 'em_andamento' => 1, 'finalizado' => 2];

    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'titulo'     => 'sometimes|required|string|max:255',
            'cliente_id' => ['sometimes', 'integer', Rule::exists('clientes', 'id')->where(fn ($q) => $q->whereNull('deleted_at'))],
            'prioridade' => 'sometimes|required|in:alta,media,baixa',
            'status'     => 'sometimes|required|in:pendente,em_andamento,finalizado',
            'pago'       => 'sometimes|required|boolean',
            'prazo'      => 'nullable|date_format:Y-m-d|after_or_equal:' . LimitesBanco::DATA_MIN . '|before_or_equal:' . LimitesBanco::DATA_MAX,
            'descricao'  => 'nullable|string|max:' . LimitesBanco::TEXTO_MAX,
            'tag'        => ['nullable', Rule::in(LimitesBanco::TAGS)],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            if (!$this->filled('status')) {
                return;
            }

            $statusAtual = $this->route('servico')?->status;
            $ordemAtual = self::ORDEM_STATUS[$statusAtual] ?? null;
            $ordemNova = self::ORDEM_STATUS[$this->status] ?? null;

            if ($ordemAtual !== null && $ordemNova !== null && $ordemNova < $ordemAtual) {
                $validator->errors()->add('status', 'Não é possível retroceder o status de um serviço.');
            }
        });
    }
}
