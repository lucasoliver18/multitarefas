<?php

namespace App\Http\Controllers;

use App\Models\Material;
use Illuminate\Http\Request;

class MaterialController extends Controller
{
    public function index()
    {
        return response()->json(Material::orderBy('nome')->get());
    }

    public function store(Request $request)
    {
        $request->validate([
            'nome'               => 'required|string|max:255',
            'descricao'          => 'nullable|string',
            'unidade_medida'     => 'required|string|max:50',
            'preco_unitario'     => 'required|numeric|min:0',
            'quantidade_estoque' => 'required|numeric|min:0',
        ]);

        $material = Material::create($request->all());
        return response()->json($material, 201);
    }

    public function show(Material $material)
    {
        return response()->json($material);
    }

    public function update(Request $request, Material $material)
    {
        $request->validate([
            'nome'               => 'sometimes|string|max:255',
            'descricao'          => 'nullable|string',
            'unidade_medida'     => 'sometimes|string|max:50',
            'preco_unitario'     => 'sometimes|numeric|min:0',
            'quantidade_estoque' => 'sometimes|numeric|min:0',
        ]);

        $material->update($request->all());
        return response()->json($material);
    }

    public function destroy(Material $material)
    {
        $material->delete();
        return response()->json(['message' => 'Material removido com sucesso!']);
    }
}
