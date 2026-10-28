<?php

namespace App\Http\Controllers;

use App\Models\Anotacao;
use App\Models\Material;
use App\Models\Orcamento;
use App\Models\Servico;
use Carbon\CarbonImmutable;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

// Resumo da tela inicial, calculado no servidor (a tela não precisa baixar
// todos os serviços). Serviços e orçamentos excluídos ficam de fora.
class DashboardController extends Controller
{
    private const PERIODOS = ['7d', '1m', '6m'];
    private const LIMITE_LISTAS = 6;

    public function index(Request $request)
    {
        $dados = $request->validate([
            'periodo' => 'nullable|in:' . implode(',', self::PERIODOS),
        ]);

        $hoje = CarbonImmutable::today();
        [$inicio, $fim, $inicioAnterior] = $this->intervalo($dados['periodo'] ?? '1m');

        return response()->json([
            'atencao'          => $this->atencao($hoje),
            'financeiro'       => $this->financeiro(),
            'agenda'           => $this->agenda($hoje),
            'previsao_estoque' => $this->previsaoEstoque(),
            'desempenho'       => $this->desempenho($inicio, $fim, $inicioAnterior),
            'atividade'        => $this->atividade(),
        ]);
    }

    // Período atual (até agora) e o início do período anterior de mesmo tamanho.
    private function intervalo(string $periodo): array
    {
        $fim = CarbonImmutable::now();
        $inicio = match ($periodo) {
            '7d' => $fim->subDays(7),
            '6m' => $fim->subMonths(6),
            default => $fim->subMonth(),
        };

        return [$inicio, $fim, $inicio->sub($inicio->diff($fim))];
    }

    private function atencao(CarbonImmutable $hoje): array
    {
        $emAberto = fn () => Servico::where('status', '!=', 'finalizado');

        return [
            'atrasados'           => $emAberto()->whereNotNull('prazo')->where('prazo', '<', $hoje->toDateString())->count(),
            'vencem_hoje_amanha'  => $emAberto()->whereBetween('prazo', [$hoje->toDateString(), $hoje->addDay()->toDateString()])->count(),
            'finalizados_nao_pagos' => Servico::where('status', 'finalizado')->where('pago', false)->count(),
            'em_andamento_sem_orcamento_aprovado' => Servico::where('status', 'em_andamento')
                ->whereDoesntHave('orcamentos', fn ($q) => $q->where('status', 'aprovado'))
                ->count(),
            'orcamentos_pendentes' => Orcamento::where('status', 'pendente')->whereHas('servico')->count(),
            'materiais_zerados'    => Material::where('quantidade_estoque', '<=', 0)->count(),
            'materiais_baixos'     => Material::whereNotNull('quantidade_minima')
                ->whereColumn('quantidade_estoque', '<=', 'quantidade_minima')
                ->count(),
        ];
    }

    private function financeiro(): array
    {
        $aprovados = Orcamento::with(['materiais', 'servico'])->where('status', 'aprovado')->whereHas('servico')->get();
        $pendentes = Orcamento::with('materiais')->where('status', 'pendente')->whereHas('servico')->get();

        $aReceber = $aprovados->filter(fn ($o) => $o->servico->status === 'finalizado' && ! $o->servico->pago);

        return [
            'a_receber'           => $this->soma($aReceber),
            'a_receber_qtd'       => $aReceber->count(),
            'em_negociacao'       => $this->soma($pendentes),
            'em_negociacao_qtd'   => $pendentes->count(),
        ];
    }

    // Próximos 7 dias (hoje incluso): quantidade de serviços em aberto por prioridade.
    private function agenda(CarbonImmutable $hoje): array
    {
        $fim = $hoje->addDays(6);
        $servicos = Servico::where('status', '!=', 'finalizado')
            ->whereBetween('prazo', [$hoje->toDateString(), $fim->toDateString()])
            ->get(['prazo', 'prioridade']);

        $dias = [];
        for ($d = $hoje; $d->lte($fim); $d = $d->addDay()) {
            $doDia = $servicos->filter(fn ($s) => substr((string) $s->prazo, 0, 10) === $d->toDateString());
            $dias[] = [
                'data'  => $d->toDateString(),
                'alta'  => $doDia->where('prioridade', 'alta')->count(),
                'media' => $doDia->where('prioridade', 'media')->count(),
                'baixa' => $doDia->where('prioridade', 'baixa')->count(),
            ];
        }

        return $dias;
    }

    // Materiais cujo estoque não cobre o que os orçamentos pendentes vão
    // consumir se forem aprovados.
    private function previsaoEstoque(): array
    {
        return DB::table('orcamento_material as om')
            ->join('orcamentos as o', 'o.id', '=', 'om.orcamento_id')
            ->join('servicos as s', 's.id', '=', 'o.servico_id')
            ->join('materiais as m', 'm.id', '=', 'om.material_id')
            ->where('o.status', 'pendente')
            ->whereNull('o.deleted_at')
            ->whereNull('s.deleted_at')
            ->whereNull('m.deleted_at')
            ->groupBy('m.id', 'm.nome', 'm.unidade_medida', 'm.quantidade_estoque')
            ->havingRaw('SUM(om.quantidade) > m.quantidade_estoque')
            ->orderByRaw('SUM(om.quantidade) - m.quantidade_estoque DESC')
            ->limit(self::LIMITE_LISTAS)
            ->get(['m.id', 'm.nome', 'm.unidade_medida', 'm.quantidade_estoque', DB::raw('SUM(om.quantidade) as necessario')])
            ->map(fn ($m) => [
                'id'          => $m->id,
                'nome'        => $m->nome,
                'unidade'     => $m->unidade_medida,
                'estoque'     => (float) $m->quantidade_estoque,
                'necessario'  => (float) $m->necessario,
            ])
            ->all();
    }

    private function desempenho(CarbonImmutable $inicio, CarbonImmutable $fim, CarbonImmutable $inicioAnterior): array
    {
        $finalizados = Servico::whereBetween('finalizado_em', [$inicio, $fim])->get(['created_at', 'finalizado_em']);

        $aprovadosNoPeriodo = Orcamento::with('materiais')
            ->whereBetween('aprovado_em', [$inicio, $fim])
            ->whereHas('servico')
            ->get();

        $decididos = Orcamento::whereIn('status', ['aprovado', 'reprovado'])
            ->whereBetween('updated_at', [$inicio, $fim])
            ->whereHas('servico')
            ->pluck('status');

        $porTag = Servico::whereBetween('created_at', [$inicio, $fim])
            ->select('tag', DB::raw('COUNT(*) as total'))
            ->groupBy('tag')
            ->pluck('total', 'tag');

        return [
            'aprovado'                => $this->soma($aprovadosNoPeriodo),
            'aprovado_qtd'            => $aprovadosNoPeriodo->count(),
            'finalizados'             => $finalizados->count(),
            'finalizados_anterior'    => Servico::where('finalizado_em', '>=', $inicioAnterior)->where('finalizado_em', '<', $inicio)->count(),
            'criados'                 => Servico::whereBetween('created_at', [$inicio, $fim])->count(),
            'tempo_medio_conclusao_dias' => $finalizados->isEmpty() ? null
                : round($finalizados->avg(fn ($s) => $s->created_at->diffInHours($s->finalizado_em) / 24), 1),
            'taxa_aprovacao'          => $decididos->isEmpty() ? null
                : round($decididos->filter(fn ($st) => $st === 'aprovado')->count() / $decididos->count() * 100),
            'por_tag' => [
                'informatica' => (int) ($porTag['informatica'] ?? 0),
                'pintura'     => (int) ($porTag['pintura'] ?? 0),
                'outros'      => (int) ($porTag['outros'] ?? 0),
                'sem_tag'     => (int) ($porTag[''] ?? 0),
            ],
        ];
    }

    // Últimos acontecimentos, de várias origens, em ordem do mais recente.
    private function atividade(): array
    {
        $limite = self::LIMITE_LISTAS;
        $evento = fn ($tipo, $texto, $servicoId, $data) => compact('tipo', 'texto', 'data') + ['servico_id' => $servicoId];

        $eventos = collect()
            ->concat(Servico::latest()->take($limite)->get()
                ->map(fn ($s) => $evento('servico_criado', $s->titulo, $s->id, $s->created_at)))
            ->concat(Servico::whereNotNull('finalizado_em')->orderByDesc('finalizado_em')->take($limite)->get()
                ->map(fn ($s) => $evento('servico_finalizado', $s->titulo, $s->id, $s->finalizado_em)))
            ->concat(Orcamento::with('servico')->whereHas('servico')->latest()->take($limite)->get()
                ->map(fn ($o) => $evento('orcamento_criado', "{$o->titulo} · {$o->servico->titulo}", $o->servico_id, $o->created_at)))
            ->concat(Orcamento::with('servico')->whereHas('servico')->whereNotNull('aprovado_em')->orderByDesc('aprovado_em')->take($limite)->get()
                ->map(fn ($o) => $evento('orcamento_aprovado', "{$o->titulo} · {$o->servico->titulo}", $o->servico_id, $o->aprovado_em)))
            ->concat(Anotacao::with('servico')->whereHas('servico')->latest()->take($limite)->get()
                ->map(fn ($a) => $evento('anotacao', Str::limit($a->conteudo, 70) . " · {$a->servico->titulo}", $a->servico_id, $a->created_at)));

        return $eventos->sortByDesc(fn ($e) => $e['data'])->take($limite)->values()->all();
    }

    private function soma(Collection $orcamentos): float
    {
        return round($orcamentos->sum('valor_final'), 2);
    }
}
