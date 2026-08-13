<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreClienteRequest;
use App\Http\Requests\UpdateClienteRequest;
use App\Http\Resources\ClienteResource;
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

        return ClienteResource::collection($query->orderBy('nome')->get());
    }

    public function store(StoreClienteRequest $request)
    {
        $cliente = Cliente::create($request->validated());
        return new ClienteResource($cliente);
    }

    public function show(Cliente $cliente)
    {
        return new ClienteResource($cliente->load('servicos'));
    }

    public function update(UpdateClienteRequest $request, Cliente $cliente)
    {
        $cliente->update($request->validated());
        return new ClienteResource($cliente);
    }

    public function destroy(Cliente $cliente)
    {
        $cliente->delete();
        return response()->json(['message' => 'Cliente removido com sucesso!']);
    }
}
