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
        $servicos = Servico::with('clienteRelacao')
            ->withExists(['orcamentos as tem_orcamento_aprovado' => fn ($q) => $q->where('status', 'aprovado')])
            ->withExists('orcamentos as tem_orcamento')
            ->orderBy('created_at', 'desc')
            ->get();
        return ServicoResource::collection($servicos);
    }

    public function store(StoreServicoRequest $request)
    {
        $data = $request->validated();
        $data['cliente'] = Cliente::find($data['cliente_id'])->nome;
        $servico = Servico::create($data);
        return new ServicoResource($this->comOrcamentoAprovado($servico->load('clienteRelacao')));
    }

    public function show(Servico $servico)
    {
        return new ServicoResource($this->comOrcamentoAprovado($servico->load('clienteRelacao')));
    }

    public function update(UpdateServicoRequest $request, Servico $servico)
    {
        $data = $request->validated();
        if (array_key_exists('cliente_id', $data)) {
            $data['cliente'] = Cliente::find($data['cliente_id'])->nome;
        }
        $servico->update($data);
        return new ServicoResource($this->comOrcamentoAprovado($servico->load('clienteRelacao')));
    }

    public function destroy(Servico $servico)
    {
        $servico->delete();
        return response()->json(['message' => 'Serviço deletado com sucesso!']);
    }

    private function comOrcamentoAprovado(Servico $servico): Servico
    {
        $servico->setAttribute(
            'tem_orcamento_aprovado',
            $servico->orcamentos()->where('status', 'aprovado')->exists()
        );
        $servico->setAttribute(
            'tem_orcamento',
            $servico->orcamentos()->exists()
        );
        return $servico;
    }
}
