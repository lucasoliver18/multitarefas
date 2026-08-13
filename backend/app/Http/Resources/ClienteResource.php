<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class ClienteResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id'             => $this->id,
            'nome'           => $this->nome,
            'telefone'       => $this->telefone,
            'email'          => $this->email,
            'observacoes'    => $this->observacoes,
            'servicos_count' => $this->when(array_key_exists('servicos_count', $this->resource->getAttributes()), $this->servicos_count),
            'servicos'       => $this->whenLoaded('servicos'),
        ];
    }
}
