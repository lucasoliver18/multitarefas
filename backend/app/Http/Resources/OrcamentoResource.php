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
            'tipo_margem'  => $this->tipo_margem ?? 'percentual',
            'valor_final'  => $this->whenLoaded('materiais', fn () => round($this->valor_final, 2)),
            'status'       => $this->status,
            'aprovado_em'  => $this->aprovado_em,
            'created_at'   => $this->created_at,
            'servico'      => $this->whenLoaded('servico', fn () => [
                'id'      => $this->servico->id,
                'titulo'  => $this->servico->titulo,
                'cliente' => $this->servico->clienteRelacao?->nome ?? $this->servico->cliente,
                'tag'     => $this->servico->tag,
            ]),
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
