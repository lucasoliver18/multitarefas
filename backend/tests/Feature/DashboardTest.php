<?php

namespace Tests\Feature;

use App\Models\Material;
use App\Models\Orcamento;
use App\Models\Servico;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Tests\TestCase;

class DashboardTest extends TestCase
{
    use RefreshDatabase;

    private function orcamentoAprovado(Servico $servico, float $preco, float $qtd = 1, float $margem = 0): Orcamento
    {
        $material = Material::factory()->create(['preco_unitario' => $preco, 'quantidade_estoque' => 100]);
        $orcamento = Orcamento::factory()->create(['servico_id' => $servico->id, 'margem_lucro' => $margem]);
        $orcamento->materiais()->attach($material->id, ['quantidade' => $qtd, 'preco_unitario_snapshot' => $preco]);
        $orcamento->update(['status' => 'aprovado']);
        return $orcamento;
    }

    public function test_contadores_de_atencao(): void
    {
        Servico::factory()->create(['status' => 'pendente', 'prazo' => now()->subDays(3)->toDateString()]);
        Servico::factory()->create(['status' => 'pendente', 'prazo' => now()->toDateString()]);
        Servico::factory()->create(['status' => 'em_andamento', 'prazo' => now()->addDay()->toDateString()]);
        Servico::factory()->create(['status' => 'finalizado', 'pago' => false, 'prazo' => now()->subDays(10)->toDateString()]);
        Material::factory()->create(['quantidade_estoque' => 0]);
        Material::factory()->create(['quantidade_estoque' => 2, 'quantidade_minima' => 5]);

        $this->getJson('/api/dashboard')->assertOk()->assertJson(['atencao' => [
            'atrasados' => 1,
            'vencem_hoje_amanha' => 2,
            'finalizados_nao_pagos' => 1,
            'em_andamento_sem_orcamento_aprovado' => 1,
            'materiais_zerados' => 1,
            'materiais_baixos' => 1,
        ]]);
    }

    public function test_a_receber_soma_finalizados_nao_pagos(): void
    {
        $naoPago = Servico::factory()->create(['status' => 'finalizado', 'pago' => false]);
        $pago = Servico::factory()->create(['status' => 'finalizado', 'pago' => true]);
        $this->orcamentoAprovado($naoPago, 100, 2, 10); // 220
        $this->orcamentoAprovado($pago, 50);

        $res = $this->getJson('/api/dashboard')->assertOk()->json('financeiro');

        $this->assertEquals(220, $res['a_receber']);
        $this->assertEquals(1, $res['a_receber_qtd']);
    }

    public function test_previsao_de_estoque_aponta_falta_para_orcamentos_pendentes(): void
    {
        $tinta = Material::factory()->create(['nome' => 'Tinta', 'quantidade_estoque' => 7]);
        $sobra = Material::factory()->create(['nome' => 'Rolo', 'quantidade_estoque' => 50]);
        $orcamento = Orcamento::factory()->create(['status' => 'pendente']);
        $orcamento->materiais()->attach($tinta->id, ['quantidade' => 12, 'preco_unitario_snapshot' => 1]);
        $orcamento->materiais()->attach($sobra->id, ['quantidade' => 3, 'preco_unitario_snapshot' => 1]);

        $previsao = $this->getJson('/api/dashboard')->assertOk()->json('previsao_estoque');

        $this->assertCount(1, $previsao);
        $this->assertEquals(['Tinta', 7, 12], [$previsao[0]['nome'], $previsao[0]['estoque'], $previsao[0]['necessario']]);
    }

    public function test_datas_de_evento_sao_registradas_automaticamente(): void
    {
        $servico = Servico::factory()->create(['status' => 'pendente', 'pago' => false]);
        $this->assertNull($servico->pago_em);

        $this->patchJson("/api/servicos/{$servico->id}", ['pago' => true])->assertOk();
        $this->assertNotNull($servico->fresh()->pago_em);

        $this->patchJson("/api/servicos/{$servico->id}", ['pago' => false])->assertOk();
        $this->assertNull($servico->fresh()->pago_em);

        $this->patchJson("/api/servicos/{$servico->id}", ['status' => 'finalizado'])->assertOk();
        $this->assertNotNull($servico->fresh()->finalizado_em);

        $orcamento = Orcamento::factory()->create(['servico_id' => $servico->id]);
        $this->patchJson("/api/orcamentos/{$orcamento->id}/aprovar")->assertOk();
        $this->assertNotNull($orcamento->fresh()->aprovado_em);
        $this->patchJson("/api/orcamentos/{$orcamento->id}/reprovar")->assertOk();
        $this->assertNull($orcamento->fresh()->aprovado_em);
    }

    public function test_desempenho_respeita_o_periodo(): void
    {
        $recente = Servico::factory()->create(['status' => 'finalizado', 'pago' => true, 'tag' => 'pintura']);
        $this->orcamentoAprovado($recente, 300);

        Carbon::setTestNow(now()->subMonths(3));
        $antigo = Servico::factory()->create(['status' => 'finalizado', 'pago' => true, 'tag' => 'informatica']);
        $this->orcamentoAprovado($antigo, 999);
        Carbon::setTestNow();

        $mes = $this->getJson('/api/dashboard?periodo=1m')->assertOk()->json('desempenho');
        $this->assertEquals(300, $mes['aprovado']);
        $this->assertArrayNotHasKey('recebido', $mes);
        $this->assertEquals(1, $mes['finalizados']);
        $this->assertEquals(1, $mes['por_tag']['pintura']);
        $this->assertEquals(0, $mes['por_tag']['informatica']);

        $semestre = $this->getJson('/api/dashboard?periodo=6m')->assertOk()->json('desempenho');
        $this->assertEquals(1299, $semestre['aprovado']);
        $this->assertEquals(2, $semestre['finalizados']);
    }

    public function test_servico_excluido_nao_entra_no_resumo(): void
    {
        $servico = Servico::factory()->create(['status' => 'finalizado', 'pago' => false]);
        $this->orcamentoAprovado($servico, 100);
        $servico->delete();

        $res = $this->getJson('/api/dashboard')->assertOk()->json();

        $this->assertEquals(0, $res['financeiro']['a_receber']);
        $this->assertEquals(0, $res['atencao']['finalizados_nao_pagos']);
    }

    public function test_periodo_invalido_e_barrado(): void
    {
        $this->getJson('/api/dashboard?periodo=1ano')
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['periodo']);
    }
}
