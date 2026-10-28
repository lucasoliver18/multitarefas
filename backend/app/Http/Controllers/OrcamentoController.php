<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreOrcamentoRequest;
use App\Http\Requests\UpdateOrcamentoRequest;
use App\Http\Resources\OrcamentoResource;
use App\Models\Material;
use App\Models\Orcamento;
use App\Models\Servico;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class OrcamentoController extends Controller
{
    // Lista geral (com o serviço de cada orçamento). `status` filtra, ex.: os
    // pendentes para o modal "Em negociação" da tela inicial, do mais antigo
    // (esperando há mais tempo) ao mais novo. Orçamentos de serviços
    // excluídos ficam de fora.
    public function index(Request $request)
    {
        $filtros = $request->validate([
            'status' => 'nullable|in:pendente,aprovado,reprovado',
        ]);

        $orcamentos = Orcamento::with(['materiais', 'servico.clienteRelacao'])
            ->whereHas('servico')
            ->when(! empty($filtros['status']), fn ($q) => $q->where('status', $filtros['status']))
            ->orderBy('created_at', ($filtros['status'] ?? null) === 'pendente' ? 'asc' : 'desc')
            ->get();

        return OrcamentoResource::collection($orcamentos);
    }

    public function byServico(Servico $servico)
    {
        return OrcamentoResource::collection(
            $servico->orcamentos()->with('materiais')->orderBy('created_at', 'desc')->get()
        );
    }

    public function store(StoreOrcamentoRequest $request)
    {
        $data = $request->validated();

        $orcamento = DB::transaction(function () use ($data) {
            $orcamento = Orcamento::create($data);

            if (!empty($data['materiais'])) {
                $orcamento->materiais()->attach($this->montarPivot($data['materiais']));
            }

            return $orcamento;
        });

        return new OrcamentoResource($orcamento->load('materiais'));
    }

    public function show(Orcamento $orcamento)
    {
        return new OrcamentoResource($orcamento->load('materiais'));
    }

    public function update(UpdateOrcamentoRequest $request, Orcamento $orcamento)
    {
        $data = $request->validated();

        DB::transaction(function () use ($data, $orcamento) {
            $orcamento->update($data);

            if (array_key_exists('materiais', $data)) {
                $orcamento->materiais()->sync($this->montarPivot($data['materiais'] ?? []));
            }
        });

        return new OrcamentoResource($orcamento->load('materiais'));
    }

    // Grava o preço do material no momento do orçamento (snapshot). Usa
    // withTrashed porque um material já vinculado pode ter sido excluído depois.
    private function montarPivot(array $itens): array
    {
        $precos = Material::withTrashed()
            ->whereIn('id', array_column($itens, 'id'))
            ->pluck('preco_unitario', 'id');

        $pivot = [];
        foreach ($itens as $item) {
            $pivot[$item['id']] = [
                'quantidade'              => $item['quantidade'],
                'preco_unitario_snapshot' => $precos[$item['id']],
            ];
        }

        return $pivot;
    }

    // Excluir um orçamento aprovado devolve ao estoque o que a aprovação tinha
    // debitado (mesma regra de reprovar).
    public function destroy(Orcamento $orcamento)
    {
        DB::transaction(function () use ($orcamento) {
            if ($orcamento->status === 'aprovado') {
                foreach ($orcamento->materiais as $material) {
                    $material->increment('quantidade_estoque', $material->pivot->quantidade);
                }
            }
            $orcamento->delete();
        });

        return response()->json(['message' => 'Orçamento excluído.']);
    }

    public function aprovar(Orcamento $orcamento)
    {
        if ($orcamento->status === 'reprovado') {
            return response()->json(['message' => 'Orçamento reprovado não pode ser aprovado.'], 422);
        }

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
                'message' => "Estoque insuficiente para: {$nomes}.",
                'materiais_insuficientes' => $insuficientes,
            ], 422);
        }

        DB::transaction(function () use ($orcamento) {
            foreach ($orcamento->materiais as $material) {
                $material->decrement('quantidade_estoque', $material->pivot->quantidade);
            }
            $orcamento->update(['status' => 'aprovado']);

            // Só um orçamento aprovado por serviço: aprovar um reprova os demais.
            $outros = Orcamento::where('servico_id', $orcamento->servico_id)
                ->where('id', '!=', $orcamento->id)
                ->where('status', '!=', 'reprovado')
                ->with('materiais')
                ->get();

            foreach ($outros as $outro) {
                if ($outro->status === 'aprovado') {
                    foreach ($outro->materiais as $material) {
                        $material->increment('quantidade_estoque', $material->pivot->quantidade);
                    }
                }
                $outro->update(['status' => 'reprovado']);
            }
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
