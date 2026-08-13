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
            'descricao'          => $this->descricao,
            'unidade_medida'     => $this->unidade_medida,
            'preco_unitario'     => $this->preco_unitario,
            'quantidade_estoque' => $this->quantidade_estoque,
        ];
    }
}
