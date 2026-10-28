<?php

namespace App\Http\Requests\Concerns;

use App\Models\Material;
use App\Models\Servico;
use Illuminate\Validation\Validator;

// Um orçamento só pode usar materiais da mesma tag do serviço (ex.: um
// serviço de Pintura só aceita materiais marcados como Pintura). Serviço
// sem tag aceita qualquer material.
trait ValidaTagDosMateriais
{
    /** @param int[] $idsJaVinculados materiais que o orçamento já tinha (mantidos mesmo fora da tag) */
    protected function validarTagDosMateriais(Validator $validator, ?Servico $servico, array $idsJaVinculados = []): void
    {
        if (! $servico?->tag || $validator->errors()->isNotEmpty()) {
            return;
        }

        $ids = collect($this->input('materiais', []))
            ->pluck('id')
            ->filter(fn ($id) => ! in_array((int) $id, $idsJaVinculados, true))
            ->map(fn ($id) => (int) $id)
            ->all();

        if (empty($ids)) {
            return;
        }

        $foraDaTag = Material::withTrashed()
            ->whereIn('id', $ids)
            ->get()
            ->filter(fn (Material $m) => ! in_array($servico->tag, $m->tags ?? [], true));

        if ($foraDaTag->isNotEmpty()) {
            $validator->errors()->add(
                'materiais',
                'Materiais fora da tag do serviço: ' . $foraDaTag->pluck('nome')->implode(', ') . '.'
            );
        }
    }
}
