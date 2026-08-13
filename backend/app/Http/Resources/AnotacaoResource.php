<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class AnotacaoResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id'         => $this->id,
            'servico_id' => $this->servico_id,
            'conteudo'   => $this->conteudo,
            'created_at' => $this->created_at,
        ];
    }
}
