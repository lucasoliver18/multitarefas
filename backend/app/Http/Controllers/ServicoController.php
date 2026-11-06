<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreServicoRequest;
use App\Http\Requests\UpdateServicoRequest;
use App\Http\Resources\ServicoResource;
use App\Models\Cliente;
use App\Models\Servico;
use App\Services\EstoqueOrcamento;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ServicoController extends Controller
{
    public function index(Request $request)
    {
        // Filtros opcionais aplicados no banco, para telas que não precisam da
        // lista inteira (ex.: modal "Ver mais" do quadro, limitado a 1 mês).
        $filtros = $request->validate([
            'cliente_id' => 'nullable|integer|min:1',
            'status'     => 'nullable|in:pendente,em_andamento,finalizado',
            'prazo_de'   => 'nullable|date_format:Y-m-d',
            'prazo_ate'  => 'nullable|date_format:Y-m-d|after_or_equal:prazo_de',
        ]);

        $servicos = Servico::with('clienteRelacao')
            ->withExists(['orcamentos as tem_orcamento_aprovado' => fn ($q) => $q->where('status', 'aprovado')])
            ->withExists('orcamentos as tem_orcamento')
            ->withExists(['orcamentos as tem_orcamento_pendente' => fn ($q) => $q->where('status', 'pendente')])
            ->when(! empty($filtros['cliente_id']), fn ($q) => $q->where('cliente_id', $filtros['cliente_id']))
            ->when(! empty($filtros['status']), fn ($q) => $q->where('status', $filtros['status']))
            ->when(! empty($filtros['prazo_de']), fn ($q) => $q->where('prazo', '>=', $filtros['prazo_de']))
            ->when(! empty($filtros['prazo_ate']), fn ($q) => $q->where('prazo', '<=', $filtros['prazo_ate']))
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

    // Com `devolver_estoque`, o que os orçamentos aprovados do serviço tinham
    // debitado volta ao estoque; sem ele, o estoque fica como está (o material
    // pode já ter sido usado). A tela pergunta antes de excluir.
    public function destroy(Request $request, Servico $servico, EstoqueOrcamento $estoque)
    {
        $request->validate(['devolver_estoque' => 'nullable|boolean']);
        $devolver = $request->boolean('devolver_estoque');

        DB::transaction(function () use ($servico, $devolver, $estoque) {
            if ($devolver) {
                $estoque->devolverDoServico($servico);
            }
            $servico->delete();
        });

        return response()->json(['message' => $devolver ? 'Serviço excluído e estoque devolvido.' : 'Serviço excluído.']);
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
        $servico->setAttribute(
            'tem_orcamento_pendente',
            $servico->orcamentos()->where('status', 'pendente')->exists()
        );
        return $servico;
    }
}
