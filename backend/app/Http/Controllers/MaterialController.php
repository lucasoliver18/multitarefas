<?php

namespace App\Http\Controllers;

use App\Models\Material;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class MaterialController extends Controller
{
    public function index()
    {
        return response()->json(Material::orderBy('nome')->get());
    }

    public function store(Request $request)
    {
        $request->validate([
            'nome'               => ['required', 'string', 'max:255', Rule::unique('materiais', 'nome')->whereNull('deleted_at')],
            'descricao'          => 'nullable|string',
            'unidade_medida'     => 'required|string|max:50',
            'preco_unitario'     => 'required|numeric|min:0',
            'quantidade_estoque' => 'nullable|numeric|min:0',
        ]);

        $data = $request->all();
        $data['quantidade_estoque'] = $request->input('quantidade_estoque') ?? 0;

        $material = Material::create($data);
        return response()->json($material, 201);
    }

    public function show(Material $material)
    {
        return response()->json($material);
    }

    public function update(Request $request, Material $material)
    {
        $request->validate([
            'nome'               => ['sometimes', 'string', 'max:255', Rule::unique('materiais', 'nome')->ignore($material->id)->whereNull('deleted_at')],
            'descricao'          => 'nullable|string',
            'unidade_medida'     => 'sometimes|string|max:50',
            'preco_unitario'     => 'sometimes|numeric|min:0',
            'quantidade_estoque' => 'nullable|numeric|min:0',
        ]);

        $material->update($request->all());
        return response()->json($material);
    }

    public function destroy(Material $material)
    {
        $material->orcamentos()->detach();
        $material->forceDelete();
        return response()->json(['message' => 'Material removido com sucesso!']);
    }
}
