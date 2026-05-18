<?php

namespace App\Http\Controllers;

use App\Models\Material;
use App\Models\Orcamento;
use App\Models\Servico;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class OrcamentoController extends Controller
{
    public function index()
    {
        return response()->json(Orcamento::with('materiais')->orderBy('created_at', 'desc')->get());
    }

    public function byServico(Servico $servico)
    {
        $orcamentos = $servico->orcamentos()->with('materiais')->orderBy('created_at', 'desc')->get();
        return response()->json($orcamentos);
    }

    public function store(Request $request)
    {
        $request->validate([
            'servico_id'  => 'required|exists:servicos,id',
            'titulo'      => 'required|string|max:255',
            'descricao'   => 'nullable|string',
            'margem_lucro'=> 'required|numeric|min:0|max:1000',
            'materiais'   => 'nullable|array',
            'materiais.*.id'         => 'required|exists:materiais,id',
            'materiais.*.quantidade' => 'required|numeric|min:0.001',
        ]);

        $orcamento = Orcamento::create($request->only('servico_id', 'titulo', 'descricao', 'margem_lucro'));

        if ($request->filled('materiais')) {
            $pivot = [];
            foreach ($request->materiais as $item) {
                $material = Material::find($item['id']);
                $pivot[$item['id']] = [
                    'quantidade'              => $item['quantidade'],
                    'preco_unitario_snapshot' => $material->preco_unitario,
                ];
            }
            $orcamento->materiais()->attach($pivot);
        }

        return response()->json($orcamento->load('materiais'), 201);
    }

    public function show(Orcamento $orcamento)
    {
        return response()->json($orcamento->load('materiais'));
    }

    public function update(Request $request, Orcamento $orcamento)
    {
        $request->validate([
            'titulo'      => 'sometimes|string|max:255',
            'descricao'   => 'nullable|string',
            'margem_lucro'=> 'sometimes|numeric|min:0|max:1000',
            'materiais'   => 'nullable|array',
            'materiais.*.id'         => 'required|exists:materiais,id',
            'materiais.*.quantidade' => 'required|numeric|min:0.001',
        ]);

        $orcamento->update($request->only('titulo', 'descricao', 'margem_lucro'));

        if ($request->has('materiais')) {
            $pivot = [];
            foreach ($request->materiais as $item) {
                $material = Material::find($item['id']);
                $pivot[$item['id']] = [
                    'quantidade'              => $item['quantidade'],
                    'preco_unitario_snapshot' => $material->preco_unitario,
                ];
            }
            $orcamento->materiais()->sync($pivot);
        }

        return response()->json($orcamento->load('materiais'));
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

        // Verifica estoque antes de qualquer operação
        foreach ($orcamento->materiais as $material) {
            $necessario = $material->pivot->quantidade;
            if ($material->quantidade_estoque < $necessario) {
                return response()->json([
                    'message' => "Estoque insuficiente para o material \"{$material->nome}\". Disponível: {$material->quantidade_estoque} {$material->unidade_medida}, necessário: {$necessario} {$material->unidade_medida}.",
                ], 422);
            }
        }

        DB::transaction(function () use ($orcamento) {
            foreach ($orcamento->materiais as $material) {
                $material->decrement('quantidade_estoque', $material->pivot->quantidade);
            }
            $orcamento->update(['status' => 'aprovado']);
        });

        return response()->json($orcamento->load('materiais'));
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

        return response()->json($orcamento->load('materiais'));
    }
}
