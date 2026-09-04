<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreMaterialRequest;
use App\Http\Requests\UpdateMaterialRequest;
use App\Http\Resources\MaterialResource;
use App\Models\Material;
use Illuminate\Http\Request;

class MaterialController extends Controller
{
    public function index(Request $request)
    {
        $query = Material::query();

        if ($request->filled('busca')) {
            $query->where('nome', 'like', '%' . $request->busca . '%');
        }

        $query->orderBy('nome');

        if ($request->filled('por_pagina')) {
            $porPagina = min((int) $request->por_pagina, 100);
            return MaterialResource::collection($query->paginate($porPagina));
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
        return response()->json(['message' => 'Material removido com sucesso!']);
    }
}
