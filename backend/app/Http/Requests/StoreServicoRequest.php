<?php

namespace App\Http\Requests;

use App\Support\LimitesBanco;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreServicoRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'titulo'     => 'required|string|max:255',
            'cliente_id' => ['required', 'integer', Rule::exists('clientes', 'id')->where(fn ($q) => $q->whereNull('deleted_at'))],
            'prioridade' => 'required|in:alta,media,baixa',
            'status'     => 'required|in:pendente,em_andamento,finalizado',
            'pago'       => 'nullable|boolean',
            'prazo'      => 'nullable|date_format:Y-m-d|after_or_equal:' . LimitesBanco::DATA_MIN . '|before_or_equal:' . LimitesBanco::DATA_MAX,
            'descricao'  => 'nullable|string|max:' . LimitesBanco::TEXTO_MAX,
            'tag'        => ['nullable', Rule::in(LimitesBanco::TAGS)],
        ];
    }
}
