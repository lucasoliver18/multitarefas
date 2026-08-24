<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreOrcamentoRequest;
use App\Http\Requests\UpdateOrcamentoRequest;
use App\Http\Resources\OrcamentoResource;
use App\Models\Material;
use App\Models\Orcamento;
use App\Models\Servico;
use Illuminate\Support\Facades\DB;

class OrcamentoController extends Controller
{
    public function index()
    {
        return OrcamentoResource::collection(
            Orcamento::with('materiais')->orderBy('created_at', 'desc')->get()
        );
    }

    public function byServico(Servico $servico)
    {
        return OrcamentoResource::collection(
            $servico->orcamentos()->with('materiais')->orderBy('created_at', 'desc')->get()
        );
    }

    public function store(StoreOrcamentoRequest $request)
    {
        $data     = $request->validated();
        $orcamento = Orcamento::create($data);

        if (!empty($data['materiais'])) {
            $pivot = [];
            foreach ($data['materiais'] as $item) {
                $material = Material::find($item['id']);
                $pivot[$item['id']] = [
                    'quantidade'              => $item['quantidade'],
                    'preco_unitario_snapshot' => $material->preco_unitario,
                ];
            }
            $orcamento->materiais()->attach($pivot);
        }

        return new OrcamentoResource($orcamento->load('materiais'));
    }

    public function show(Orcamento $orcamento)
    {
        return new OrcamentoResource($orcamento->load('materiais'));
    }

    public function update(UpdateOrcamentoRequest $request, Orcamento $orcamento)
    {
        $data = $request->validated();
        $orcamento->update($data);

        if (array_key_exists('materiais', $data)) {
            $pivot = [];
            foreach ($data['materiais'] ?? [] as $item) {
                $material = Material::find($item['id']);
                $pivot[$item['id']] = [
                    'quantidade'              => $item['quantidade'],
                    'preco_unitario_snapshot' => $material->preco_unitario,
                ];
            }
            $orcamento->materiais()->sync($pivot);
        }

        return new OrcamentoResource($orcamento->load('materiais'));
    }

    public function destroy(Orcamento $orcamento)
    {
        $orcamento->delete();
        return response()->json(['message' => 'Orçamento removido com sucesso!']);
    }

    public function aprovar(Orcamento $orcamento)
    {
        if ($orcamento->status === 'aprovado') {
            return response()->json(['message' => 'Orçamento já está aprovado.'], 422);
        }

        $orcamento->load('materiais');

        $insuficientes = [];
        foreach ($orcamento->materiais as $material) {
            $necessario = $material->pivot->quantidade;
            if ($material->quantidade_estoque < $necessario) {
                $insuficientes[] = [
                    'nome'           => $material->nome,
                    'disponivel'     => $material->quantidade_estoque,
                    'necessario'     => $necessario,
                    'unidade_medida' => $material->unidade_medida,
                ];
            }
        }

        if (!empty($insuficientes)) {
            $nomes = collect($insuficientes)->pluck('nome')->implode(', ');

            return response()->json([
                'message' => "Não foi possível aprovar: não há estoque suficiente para {$nomes}. Ajuste as quantidades do orçamento ou reponha o estoque antes de aprovar.",
                'materiais_insuficientes' => $insuficientes,
            ], 422);
        }

        DB::transaction(function () use ($orcamento) {
            foreach ($orcamento->materiais as $material) {
                $material->decrement('quantidade_estoque', $material->pivot->quantidade);
            }
            $orcamento->update(['status' => 'aprovado']);
        });

        return new OrcamentoResource($orcamento->load('materiais'));
    }

    public function reprovar(Orcamento $orcamento)
    {
        if ($orcamento->status === 'reprovado') {
            return response()->json(['message' => 'Orçamento já está reprovado.'], 422);
        }

        $eraAprovado = $orcamento->status === 'aprovado';
        $orcamento->load('materiais');

        DB::transaction(function () use ($orcamento, $eraAprovado) {
            if ($eraAprovado) {
                foreach ($orcamento->materiais as $material) {
                    $material->increment('quantidade_estoque', $material->pivot->quantidade);
                }
            }
            $orcamento->update(['status' => 'reprovado']);
        });

        return new OrcamentoResource($orcamento->load('materiais'));
    }
}
