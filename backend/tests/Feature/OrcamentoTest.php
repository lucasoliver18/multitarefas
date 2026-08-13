<?php

namespace Tests\Feature;

use App\Models\Material;
use App\Models\Orcamento;
use App\Models\Servico;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class OrcamentoTest extends TestCase
{
    use RefreshDatabase;

    public function test_pode_criar_orcamento(): void
    {
        $servico = Servico::factory()->create();

        $this->postJson('/api/orcamentos', [
            'servico_id'  => $servico->id,
            'titulo'      => 'Proposta A',
            'margem_lucro'=> 20,
        ])->assertCreated()
          ->assertJsonFragment(['titulo' => 'Proposta A']);
    }

    public function test_pode_criar_orcamento_com_materiais(): void
    {
        $servico  = Servico::factory()->create();
        $material = Material::factory()->create(['preco_unitario' => 50.00]);

        $res = $this->postJson('/api/orcamentos', [
            'servico_id'  => $servico->id,
            'titulo'      => 'Proposta com material',
            'margem_lucro'=> 10,
            'materiais'   => [['id' => $material->id, 'quantidade' => 2]],
        ])->assertCreated()->json();

        $this->assertCount(1, $res['materiais']);
        $this->assertEquals(2, $res['materiais'][0]['pivot']['quantidade']);
        $this->assertEquals(50.00, $res['materiais'][0]['pivot']['preco_unitario_snapshot']);
    }

    public function test_aprovar_orcamento_debita_estoque(): void
    {
        $material  = Material::factory()->create(['quantidade_estoque' => 10]);
        $orcamento = Orcamento::factory()->create();
        $orcamento->materiais()->attach($material->id, [
            'quantidade'              => 3,
            'preco_unitario_snapshot' => $material->preco_unitario,
        ]);

        $this->patchJson("/api/orcamentos/{$orcamento->id}/aprovar")->assertOk();

        $this->assertEquals(7, $material->fresh()->quantidade_estoque);
        $this->assertEquals('aprovado', $orcamento->fresh()->status);
    }

    public function test_nao_aprova_com_estoque_insuficiente(): void
    {
        $material  = Material::factory()->create(['quantidade_estoque' => 2]);
        $orcamento = Orcamento::factory()->create();
        $orcamento->materiais()->attach($material->id, [
            'quantidade'              => 5,
            'preco_unitario_snapshot' => $material->preco_unitario,
        ]);

        $this->patchJson("/api/orcamentos/{$orcamento->id}/aprovar")->assertUnprocessable();

        $this->assertEquals(2, $material->fresh()->quantidade_estoque);
        $this->assertEquals('pendente', $orcamento->fresh()->status);
    }

    public function test_reprovar_orcamento_aprovado_restaura_estoque(): void
    {
        $material  = Material::factory()->create(['quantidade_estoque' => 10]);
        $orcamento = Orcamento::factory()->create();
        $orcamento->materiais()->attach($material->id, [
            'quantidade'              => 4,
            'preco_unitario_snapshot' => $material->preco_unitario,
        ]);

        $this->patchJson("/api/orcamentos/{$orcamento->id}/aprovar")->assertOk();
        $this->assertEquals(6, $material->fresh()->quantidade_estoque);

        $this->patchJson("/api/orcamentos/{$orcamento->id}/reprovar")->assertOk();
        $this->assertEquals(10, $material->fresh()->quantidade_estoque);
    }

    public function test_nao_aprova_orcamento_ja_aprovado(): void
    {
        $orcamento = Orcamento::factory()->create(['status' => 'aprovado']);

        $this->patchJson("/api/orcamentos/{$orcamento->id}/aprovar")
             ->assertUnprocessable();
    }
}
