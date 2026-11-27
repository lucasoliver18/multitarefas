<?php

namespace App\Services;

use App\Models\Material;
use App\Models\Orcamento;
use App\Models\Servico;

// Único ponto do sistema que mexe no estoque por causa de orçamentos.
//
// Regra: só um orçamento APROVADO tem materiais debitados do estoque.
// - aprovar   → debita tudo o que o orçamento usa;
// - reprovar, excluir o orçamento ou excluir o serviço (se pedido) → devolve;
// - editar um aprovado → debita ou devolve só a diferença.
//
// Quem chama cuida da transação e da mudança de status; esta classe só
// confere e movimenta as quantidades.
class EstoqueOrcamento
{
    // Materiais sem estoque para o orçamento inteiro (checagem antes de aprovar).
    // `$devolvidos` [id do material => quantidade] é o que volta ao estoque na
    // mesma operação (o aprovado atual do serviço, que será reprovado) e conta
    // como disponível. Arredonda em 3 casas, a precisão das colunas.
    public function faltasParaAprovar(Orcamento $orcamento, array $devolvidos = []): array
    {
        $disponivel = fn (Material $m) => round((float) $m->quantidade_estoque + ($devolvidos[$m->id] ?? 0), 3);

        return $orcamento->materiais
            ->filter(fn (Material $m) => $disponivel($m) < round((float) $m->pivot->quantidade, 3))
            ->map(fn (Material $m) => [
                'nome'           => $m->nome,
                'disponivel'     => $disponivel($m),
                'necessario'     => $m->pivot->quantidade,
                'unidade_medida' => $m->unidade_medida,
            ])
            ->values()
            ->all();
    }

    // Quanto de cada material volta ao estoque se esses orçamentos forem
    // reprovados (só os aprovados tinham debitado algo).
    public function devolucoes(iterable $orcamentos): array
    {
        $total = [];
        foreach ($orcamentos as $orcamento) {
            if ($orcamento->status !== 'aprovado') {
                continue;
            }
            foreach ($orcamento->materiais as $material) {
                $total[$material->id] = ($total[$material->id] ?? 0) + (float) $material->pivot->quantidade;
            }
        }

        return $total;
    }

    // Debita do estoque tudo o que o orçamento usa (ao aprovar).
    public function debitar(Orcamento $orcamento): void
    {
        foreach ($orcamento->materiais as $material) {
            $material->decrement('quantidade_estoque', $material->pivot->quantidade);
        }
    }

    // Devolve o que o orçamento tinha debitado. Só orçamento aprovado debitou
    // algo; para os demais não faz nada (pode ser chamado sem checar antes).
    public function devolver(Orcamento $orcamento): void
    {
        if ($orcamento->status !== 'aprovado') {
            return;
        }

        foreach ($orcamento->materiais as $material) {
            $material->increment('quantidade_estoque', $material->pivot->quantidade);
        }
    }

    // Devolve o estoque de todos os orçamentos aprovados do serviço (ao excluir
    // o serviço, quando o usuário escolhe devolver).
    public function devolverDoServico(Servico $servico): void
    {
        $servico->orcamentos()->where('status', 'aprovado')->with('materiais')->get()
            ->each(fn (Orcamento $orcamento) => $this->devolver($orcamento));
    }

    // Edição dos materiais: quanto cada um passa a consumir a mais (positivo)
    // ou a menos (negativo) em relação ao que o orçamento já tinha. Vazio se o
    // orçamento não estiver aprovado (sem nada debitado, não há o que ajustar).
    public function diferencasNaEdicao(Orcamento $orcamento, array $itens): array
    {
        if ($orcamento->status !== 'aprovado') {
            return [];
        }

        $antes = $orcamento->materiais()->get()
            ->mapWithKeys(fn ($m) => [$m->id => (float) $m->pivot->quantidade]);
        $depois = collect($itens)->mapWithKeys(fn ($i) => [(int) $i['id'] => (float) $i['quantidade']]);

        // Arredonda em 3 casas (precisão das colunas): 1,1 − 0,8 em ponto
        // flutuante dá 0,30000000000000004, que não pode passar de 0,3.
        return $antes->keys()->merge($depois->keys())->unique()
            ->mapWithKeys(fn ($id) => [$id => round(($depois[$id] ?? 0) - ($antes[$id] ?? 0), 3)])
            ->filter(fn ($d) => abs($d) > 0.0000001)
            ->all();
    }

    // Nomes dos materiais sem estoque para cobrir os aumentos da edição.
    public function faltasNasDiferencas(array $diferencas): array
    {
        $aumentos = array_filter($diferencas, fn ($d) => $d > 0);
        if (! $aumentos) {
            return [];
        }

        return Material::withTrashed()
            ->whereIn('id', array_keys($aumentos))
            ->get()
            ->filter(fn (Material $m) => round((float) $m->quantidade_estoque, 3) < round($aumentos[$m->id], 3))
            ->pluck('nome')
            ->all();
    }

    // Aplica as diferenças da edição: positivo debita, negativo devolve.
    public function aplicarDiferencas(array $diferencas): void
    {
        foreach ($diferencas as $id => $diferenca) {
            Material::withTrashed()->whereKey($id)->decrement('quantidade_estoque', $diferenca);
        }
    }

    // Mensagem padrão quando falta estoque (aprovar ou editar um aprovado).
    public static function mensagemFalta(array $nomes): string
    {
        return 'Estoque insuficiente para: ' . implode(', ', $nomes) . '.';
    }
}
