<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreServicoRequest;
use App\Http\Requests\UpdateServicoRequest;
use App\Http\Resources\ServicoResource;
use App\Models\Cliente;
use App\Models\Servico;

class ServicoController extends Controller
{
    public function index()
    {
        $servicos = Servico::with('clienteRelacao')->orderBy('created_at', 'desc')->get();
        return ServicoResource::collection($servicos);
    }

    public function store(StoreServicoRequest $request)
    {
        $data = $request->validated();
        $data['cliente_id'] = Cliente::firstOrCreate(['nome' => $data['cliente']])->id;
        $servico = Servico::create($data);
        return new ServicoResource($servico->load('clienteRelacao'));
    }

    public function show(Servico $servico)
    {
        return new ServicoResource($servico->load('clienteRelacao'));
    }

    public function update(UpdateServicoRequest $request, Servico $servico)
    {
        $data = $request->validated();
        if (!empty($data['cliente'])) {
            $data['cliente_id'] = Cliente::firstOrCreate(['nome' => $data['cliente']])->id;
        }
        $servico->update($data);
        return new ServicoResource($servico->load('clienteRelacao'));
    }

    public function destroy(Servico $servico)
    {
        $servico->delete();
        return response()->json(['message' => 'Serviço deletado com sucesso!']);
    }
}
