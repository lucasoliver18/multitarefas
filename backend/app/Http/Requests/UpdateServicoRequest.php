<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class UpdateServicoRequest extends FormRequest
{
    // Ordem da esteira de status: um serviço só pode avançar
    // (pendente -> em_andamento -> finalizado), nunca retroceder.
    private const ORDEM_STATUS = ['pendente' => 0, 'em_andamento' => 1, 'finalizado' => 2];

    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'titulo'     => 'sometimes|string|max:255',
            'cliente_id' => ['sometimes', 'integer', Rule::exists('clientes', 'id')->where(fn ($q) => $q->whereNull('deleted_at'))],
            'prioridade' => 'sometimes|in:alta,media,baixa',
            'status'     => 'sometimes|in:pendente,em_andamento,finalizado',
            'pago'       => 'sometimes|boolean',
            'prazo'      => 'nullable|date_format:Y-m-d',
            'descricao'  => 'nullable|string',
            'tag'        => 'nullable|in:informatica,pintura,outros',
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
