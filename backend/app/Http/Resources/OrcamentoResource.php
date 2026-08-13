<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class OrcamentoResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id'           => $this->id,
            'servico_id'   => $this->servico_id,
            'titulo'       => $this->titulo,
            'descricao'    => $this->descricao,
            'margem_lucro' => $this->margem_lucro,
            'status'       => $this->status,
            'created_at'   => $this->created_at,
            'materiais'    => $this->whenLoaded('materiais', function () {
                return $this->materiais->map(fn ($m) => [
                    'id'             => $m->id,
                    'nome'           => $m->nome,
                    'unidade_medida' => $m->unidade_medida,
                    'pivot'          => [
                        'quantidade'              => $m->pivot->quantidade,
                        'preco_unitario_snapshot' => $m->pivot->preco_unitario_snapshot,
                    ],
                ]);
            }),
        ];
    }
}
