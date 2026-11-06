<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreOrcamentoRequest;
use App\Http\Requests\UpdateOrcamentoRequest;
use App\Http\Resources\OrcamentoResource;
use App\Models\Material;
use App\Models\Orcamento;
use App\Models\Servico;
use App\Services\EstoqueOrcamento;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class OrcamentoController extends Controller
{
    // Toda movimentação de estoque fica em EstoqueOrcamento.
    public function __construct(private EstoqueOrcamento $estoque) {}

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
        $trocaMateriais = array_key_exists('materiais', $data);

        // Orçamento aprovado já debitou o estoque: mudar os materiais debita ou
        // devolve só a diferença (senão reprovar/excluir depois devolveria a
        // quantidade errada).
        $diferencas = $trocaMateriais ? $this->estoque->diferencasNaEdicao($orcamento, $data['materiais'] ?? []) : [];

        $faltas = $this->estoque->faltasNasDiferencas($diferencas);
        if ($faltas) {
            return response()->json(['message' => EstoqueOrcamento::mensagemFalta($faltas)], 422);
        }

        DB::transaction(function () use ($data, $orcamento, $trocaMateriais, $diferencas) {
            $orcamento->update($data);

            if ($trocaMateriais) {
                $orcamento->materiais()->sync($this->montarPivot($data['materiais'] ?? []));
            }

            $this->estoque->aplicarDiferencas($diferencas);
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
            $this->estoque->devolver($orcamento);
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

        $faltas = $this->estoque->faltasParaAprovar($orcamento);
        if ($faltas) {
            return response()->json([
                'message' => EstoqueOrcamento::mensagemFalta(array_column($faltas, 'nome')),
                'materiais_insuficientes' => $faltas,
            ], 422);
        }

        DB::transaction(function () use ($orcamento) {
            $this->estoque->debitar($orcamento);
            $orcamento->update(['status' => 'aprovado']);

            // Só um orçamento aprovado por serviço: aprovar um reprova os demais.
            $outros = Orcamento::where('servico_id', $orcamento->servico_id)
                ->where('id', '!=', $orcamento->id)
                ->where('status', '!=', 'reprovado')
                ->with('materiais')
                ->get();

            foreach ($outros as $outro) {
                $this->estoque->devolver($outro);
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

        // Devolve antes de mudar o status: só um aprovado tinha estoque debitado.
        DB::transaction(function () use ($orcamento) {
            $this->estoque->devolver($orcamento);
            $orcamento->update(['status' => 'reprovado']);
        });

        return new OrcamentoResource($orcamento->load('materiais'));
    }
}
