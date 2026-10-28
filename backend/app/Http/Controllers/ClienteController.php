<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreClienteRequest;
use App\Http\Requests\UpdateClienteRequest;
use App\Http\Resources\ClienteResource;
use App\Models\Cliente;
use App\Models\Servico;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ClienteController extends Controller
{
    public function index(Request $request)
    {
        $filtros = $request->validate([
            'busca'      => 'nullable|string|max:255',
            'por_pagina' => 'nullable|integer|min:1|max:100',
        ]);

        $query = Cliente::withCount('servicos');

        if (! empty($filtros['busca'])) {
            $query->where('nome', 'like', '%' . $filtros['busca'] . '%');
        }

        $query->orderBy('nome');

        if (! empty($filtros['por_pagina'])) {
            return ClienteResource::collection($query->paginate($filtros['por_pagina']));
        }

        return ClienteResource::collection($query->get());
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
        $vinculados = $cliente->servicos()->count();
        if ($vinculados > 0) {
            return response()->json([
                'message' => 'Cliente com ' . ($vinculados === 1 ? '1 serviço vinculado.' : "{$vinculados} serviços vinculados."),
                'servicos_count' => $vinculados,
            ], 422);
        }

        $cliente->delete();
        return response()->json(['message' => 'Cliente removido.']);
    }

    public function transferirServicos(Request $request, Cliente $cliente)
    {
        $data = $request->validate([
            'novo_cliente_id' => [
                'required',
                'integer',
                Rule::exists('clientes', 'id')->where(fn ($q) => $q->whereNull('deleted_at')),
                Rule::notIn([$cliente->id]),
            ],
        ]);

        $total = Servico::where('cliente_id', $cliente->id)->count();
        Servico::where('cliente_id', $cliente->id)->update(['cliente_id' => $data['novo_cliente_id']]);

        return response()->json([
            'message' => $total === 1 ? '1 serviço transferido.' : "{$total} serviços transferidos.",
            'transferidos' => $total,
        ]);
    }
}
