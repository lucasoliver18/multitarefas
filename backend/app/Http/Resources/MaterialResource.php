<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class MaterialResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id'                 => $this->id,
            'nome'               => $this->nome,
            'marca_id'           => $this->marca_id,
            'marca'              => $this->marca?->nome,
            'descricao'          => $this->descricao,
            'tags'               => $this->tags ?? [],
            'unidade_medida'     => $this->unidade_medida,
            'preco_unitario'     => $this->preco_unitario,
            'quantidade_estoque' => $this->quantidade_estoque,
            'quantidade_minima'  => $this->quantidade_minima,
        ];
    }
}
