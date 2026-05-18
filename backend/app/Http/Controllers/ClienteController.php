<?php

namespace App\Http\Controllers;

use App\Models\Cliente;
use Illuminate\Http\Request;

class ClienteController extends Controller
{
    public function index(Request $request)
    {
        $query = Cliente::withCount('servicos');

        if ($request->filled('busca')) {
            $query->where('nome', 'like', '%' . $request->busca . '%');
        }

        return response()->json($query->orderBy('nome')->get());
    }

    public function store(Request $request)
    {
        $request->validate([
            'nome'        => 'required|string|max:255',
            'telefone'    => 'nullable|string|max:50',
            'email'       => 'nullable|email|max:255',
            'observacoes' => 'nullable|string',
        ]);

        $cliente = Cliente::create($request->all());
        return response()->json($cliente, 201);
    }

    public function show(Cliente $cliente)
    {
        return response()->json($cliente->load('servicos'));
    }

    public function update(Request $request, Cliente $cliente)
    {
        $request->validate([
            'nome'        => 'sometimes|string|max:255',
            'telefone'    => 'nullable|string|max:50',
            'email'       => 'nullable|email|max:255',
            'observacoes' => 'nullable|string',
        ]);

        $cliente->update($request->all());
        return response()->json($cliente);
    }

    public function destroy(Cliente $cliente)
    {
        $cliente->delete();
        return response()->json(['message' => 'Cliente removido com sucesso!']);
    }
}
