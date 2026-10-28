<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreMaterialRequest;
use App\Http\Requests\UpdateMaterialRequest;
use App\Http\Resources\MaterialResource;
use App\Models\Material;
use App\Support\LimitesBanco;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class MaterialController extends Controller
{
    public function index(Request $request)
    {
        $filtros = $request->validate([
            'busca'      => 'nullable|string|max:255',
            'tag'        => ['nullable', Rule::in(LimitesBanco::TAGS)],
            'por_pagina' => 'nullable|integer|min:1|max:100',
        ]);

        $query = Material::with('marca');

        if (! empty($filtros['busca'])) {
            $termo = '%' . $filtros['busca'] . '%';
            $query->where(fn ($q) => $q->where('nome', 'like', $termo)
                ->orWhereHas('marca', fn ($m) => $m->where('nome', 'like', $termo)));
        }

        if (! empty($filtros['tag'])) {
            $query->whereJsonContains('tags', $filtros['tag']);
        }

        $query->orderBy('nome');

        if (! empty($filtros['por_pagina'])) {
            return MaterialResource::collection($query->paginate($filtros['por_pagina']));
        }

        return MaterialResource::collection($query->get());
    }

    public function store(StoreMaterialRequest $request)
    {
        $data = $request->validated();
        $data['quantidade_estoque'] = $data['quantidade_estoque'] ?? 0;
        return new MaterialResource(Material::create($data));
    }

    public function show(Material $material)
    {
        return new MaterialResource($material);
    }

    public function update(UpdateMaterialRequest $request, Material $material)
    {
        $material->update($request->validated());
        return new MaterialResource($material);
    }

    public function destroy(Material $material)
    {
        $material->delete();
        return response()->json(['message' => 'Material removido.']);
    }
}
