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

    public function test_descricao_do_orcamento_limitada_a_500_caracteres(): void
    {
        $servico = Servico::factory()->create();
        $dados = ['servico_id' => $servico->id, 'titulo' => 'Proposta', 'margem_lucro' => 0];

        $this->postJson('/api/orcamentos', $dados + ['descricao' => str_repeat('a', 501)])
             ->assertUnprocessable()->assertJsonValidationErrors(['descricao']);
        $id = $this->postJson('/api/orcamentos', $dados + ['descricao' => str_repeat('a', 500)])->assertCreated()->json('id');

        $this->putJson("/api/orcamentos/{$id}", ['descricao' => str_repeat('b', 501)])
             ->assertUnprocessable()->assertJsonValidationErrors(['descricao']);
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

    // Editar materiais de um orçamento já aprovado ajusta o estoque pela
    // diferença; senão reprovar/excluir depois devolveria a quantidade errada.
    public function test_editar_orcamento_aprovado_ajusta_estoque_pela_diferenca(): void
    {
        $tinta  = Material::factory()->create(['quantidade_estoque' => 10]);
        $rolo   = Material::factory()->create(['quantidade_estoque' => 5]);
        $orcamento = Orcamento::factory()->create();
        $orcamento->materiais()->attach($tinta->id, ['quantidade' => 3, 'preco_unitario_snapshot' => 10]);
        $this->patchJson("/api/orcamentos/{$orcamento->id}/aprovar")->assertOk();
        $this->assertEquals(7, $tinta->fresh()->quantidade_estoque);

        // Tinta de 3 para 5 (debita mais 2) e entra 1 rolo.
        $this->putJson("/api/orcamentos/{$orcamento->id}", [
            'materiais' => [['id' => $tinta->id, 'quantidade' => 5], ['id' => $rolo->id, 'quantidade' => 1]],
        ])->assertOk();
        $this->assertEquals(5, $tinta->fresh()->quantidade_estoque);
        $this->assertEquals(4, $rolo->fresh()->quantidade_estoque);

        // Tira a tinta: devolve as 5.
        $this->putJson("/api/orcamentos/{$orcamento->id}", [
            'materiais' => [['id' => $rolo->id, 'quantidade' => 1]],
        ])->assertOk();
        $this->assertEquals(10, $tinta->fresh()->quantidade_estoque);

        // Reprovar devolve exatamente o que está debitado agora.
        $this->patchJson("/api/orcamentos/{$orcamento->id}/reprovar")->assertOk();
        $this->assertEquals(10, $tinta->fresh()->quantidade_estoque);
        $this->assertEquals(5, $rolo->fresh()->quantidade_estoque);
    }

    public function test_editar_orcamento_aprovado_recusa_aumento_sem_estoque(): void
    {
        $tinta = Material::factory()->create(['quantidade_estoque' => 4]);
        $orcamento = Orcamento::factory()->create();
        $orcamento->materiais()->attach($tinta->id, ['quantidade' => 3, 'preco_unitario_snapshot' => 10]);
        $this->patchJson("/api/orcamentos/{$orcamento->id}/aprovar")->assertOk();

        // Sobrou 1 em estoque: ir de 3 para 5 exige mais 2.
        $this->putJson("/api/orcamentos/{$orcamento->id}", [
            'materiais' => [['id' => $tinta->id, 'quantidade' => 5]],
        ])->assertUnprocessable()->assertJsonFragment(['message' => "Estoque insuficiente para: {$tinta->nome}."]);

        $this->assertEquals(1, $tinta->fresh()->quantidade_estoque);
        $this->assertEquals(3, $orcamento->fresh()->materiais->first()->pivot->quantidade);
    }

    // O orçamento guarda o preço do material no momento (snapshot): excluir o
    // material depois não pode mudar o total nem sumir com o item.
    public function test_excluir_material_nao_altera_orcamentos_existentes(): void
    {
        $material = Material::factory()->create(['preco_unitario' => 50, 'quantidade_estoque' => 10]);
        $orcamento = Orcamento::factory()->create(['margem_lucro' => 0, 'tipo_margem' => 'percentual']);
        $orcamento->materiais()->attach($material->id, ['quantidade' => 2, 'preco_unitario_snapshot' => 50]);

        $this->deleteJson("/api/materiais/{$material->id}")->assertOk();

        $res = $this->getJson("/api/orcamentos/{$orcamento->id}")->assertOk()->json();
        $this->assertEquals(100, $res['valor_final']);
        $this->assertCount(1, $res['materiais']);
        $this->assertCount(1, $this->getJson("/api/servicos/{$orcamento->servico_id}/orcamentos")->json('0.materiais'));
    }

    public function test_nao_aprova_com_estoque_insuficiente(): void
    {
        $material  = Material::factory()->create(['quantidade_estoque' => 2]);
        $orcamento = Orcamento::factory()->create();
        $orcamento->materiais()->attach($material->id, [
            'quantidade'              => 5,
            'preco_unitario_snapshot' => $material->preco_unitario,
        ]);

        $this->patchJson("/api/orcamentos/{$orcamento->id}/aprovar")
            ->assertUnprocessable()
            ->assertJsonPath('message', "Estoque insuficiente para: {$material->nome}.")
            ->assertJsonPath('materiais_insuficientes.0.nome', $material->nome)
            ->assertJsonPath('materiais_insuficientes.0.unidade_medida', $material->unidade_medida);

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

    public function test_nao_aprova_orcamento_reprovado(): void
    {
        $orcamento = Orcamento::factory()->create(['status' => 'reprovado']);

        $this->patchJson("/api/orcamentos/{$orcamento->id}/aprovar")
             ->assertUnprocessable();

        $this->assertEquals('reprovado', $orcamento->fresh()->status);
    }

    public function test_nao_reprova_orcamento_ja_reprovado(): void
    {
        $orcamento = Orcamento::factory()->create(['status' => 'reprovado']);

        $this->patchJson("/api/orcamentos/{$orcamento->id}/reprovar")
             ->assertUnprocessable();
    }

    public function test_aprovar_reprova_automaticamente_os_outros_orcamentos_do_servico(): void
    {
        $servico = Servico::factory()->create();
        $aprovado = Orcamento::factory()->create(['servico_id' => $servico->id, 'status' => 'pendente']);
        $pendente1 = Orcamento::factory()->create(['servico_id' => $servico->id, 'status' => 'pendente']);
        $pendente2 = Orcamento::factory()->create(['servico_id' => $servico->id, 'status' => 'pendente']);
        $jaReprovado = Orcamento::factory()->create(['servico_id' => $servico->id, 'status' => 'reprovado']);

        $this->patchJson("/api/orcamentos/{$aprovado->id}/aprovar")->assertOk();

        $this->assertEquals('aprovado', $aprovado->fresh()->status);
        $this->assertEquals('reprovado', $pendente1->fresh()->status);
        $this->assertEquals('reprovado', $pendente2->fresh()->status);
        $this->assertEquals('reprovado', $jaReprovado->fresh()->status);
    }

    public function test_aprovar_restaura_estoque_de_outro_orcamento_que_estava_aprovado(): void
    {
        $servico  = Servico::factory()->create();
        $material = Material::factory()->create(['quantidade_estoque' => 10]);

        $antigoAprovado = Orcamento::factory()->create(['servico_id' => $servico->id, 'status' => 'aprovado']);
        $antigoAprovado->materiais()->attach($material->id, [
            'quantidade'              => 4,
            'preco_unitario_snapshot' => $material->preco_unitario,
        ]);
        $material->decrement('quantidade_estoque', 4);

        $novoOrcamento = Orcamento::factory()->create(['servico_id' => $servico->id, 'status' => 'pendente']);

        $this->patchJson("/api/orcamentos/{$novoOrcamento->id}/aprovar")->assertOk();

        $this->assertEquals('reprovado', $antigoAprovado->fresh()->status);
        $this->assertEquals('aprovado', $novoOrcamento->fresh()->status);
        $this->assertEquals(10, $material->fresh()->quantidade_estoque);
    }

    public function test_lista_pendentes_com_servico_do_mais_antigo_ao_mais_novo(): void
    {
        $servico = Servico::factory()->create(['titulo' => 'Pintura da sala']);
        $novo = Orcamento::factory()->create(['servico_id' => $servico->id, 'status' => 'pendente', 'created_at' => now()]);
        $antigo = Orcamento::factory()->create(['servico_id' => $servico->id, 'status' => 'pendente', 'created_at' => now()->subDays(5)]);
        Orcamento::factory()->create(['status' => 'aprovado']);
        $excluido = Servico::factory()->create();
        Orcamento::factory()->create(['servico_id' => $excluido->id, 'status' => 'pendente']);
        $excluido->delete();

        $res = $this->getJson('/api/orcamentos?status=pendente')->assertOk()->json();

        $this->assertEquals([$antigo->id, $novo->id], array_column($res, 'id'));
        $this->assertEquals('Pintura da sala', $res[0]['servico']['titulo']);
        $this->assertArrayHasKey('valor_final', $res[0]);
    }

    public function test_status_invalido_na_listagem_e_barrado(): void
    {
        $this->getJson('/api/orcamentos?status=qualquer')
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['status']);
    }

    public function test_excluir_orcamento_aprovado_devolve_estoque(): void
    {
        $material  = Material::factory()->create(['quantidade_estoque' => 10]);
        $orcamento = Orcamento::factory()->create();
        $orcamento->materiais()->attach($material->id, ['quantidade' => 3, 'preco_unitario_snapshot' => 5]);
        $this->patchJson("/api/orcamentos/{$orcamento->id}/aprovar")->assertOk();
        $this->assertEquals(7, $material->fresh()->quantidade_estoque);

        $this->deleteJson("/api/orcamentos/{$orcamento->id}")->assertOk();

        $this->assertSoftDeleted('orcamentos', ['id' => $orcamento->id]);
        $this->assertEquals(10, $material->fresh()->quantidade_estoque);
    }

    public function test_excluir_orcamento_pendente_nao_mexe_no_estoque(): void
    {
        $material  = Material::factory()->create(['quantidade_estoque' => 10]);
        $orcamento = Orcamento::factory()->create(['status' => 'pendente']);
        $orcamento->materiais()->attach($material->id, ['quantidade' => 3, 'preco_unitario_snapshot' => 5]);

        $this->deleteJson("/api/orcamentos/{$orcamento->id}")->assertOk();

        $this->assertSoftDeleted('orcamentos', ['id' => $orcamento->id]);
        $this->assertEquals(10, $material->fresh()->quantidade_estoque);
    }
}
