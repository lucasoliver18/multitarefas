<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreMaterialRequest;
use App\Http\Requests\UpdateMaterialRequest;
use App\Http\Resources\MaterialResource;
use App\Models\Material;

class MaterialController extends Controller
{
    public function index()
    {
        return MaterialResource::collection(Material::orderBy('nome')->get());
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
