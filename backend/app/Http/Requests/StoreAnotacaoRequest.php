<?php

namespace App\Http\Requests;

use App\Support\LimitesBanco;
use Illuminate\Foundation\Http\FormRequest;

class StoreAnotacaoRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'conteudo' => 'required|string|max:' . LimitesBanco::TEXTO_MAX,
        ];
    }
}
