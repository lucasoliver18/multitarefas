<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class ServicoResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id'         => $this->id,
            'titulo'     => $this->titulo,
            'cliente'    => $this->clienteRelacao?->nome ?? $this->cliente,
            'cliente_id' => $this->cliente_id,
            'prioridade' => $this->prioridade,
            'status'     => $this->status,
            'prazo'      => $this->prazo,
            'tag'        => $this->tag,
            'descricao'  => $this->descricao,
            'created_at' => $this->created_at,
        ];
    }
}
