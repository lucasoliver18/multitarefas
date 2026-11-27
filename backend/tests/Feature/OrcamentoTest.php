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

    // Material excluído do cadastro trava a aprovação (pendente ou reprovado)
    // até ser removido do orçamento; estoque e status não mudam.
    public function test_nao_aprova_orcamento_com_material_excluido(): void
    {
        $tinta = Material::factory()->create(['nome' => 'Tinta Azul', 'quantidade_estoque' => 10]);
        $rolo  = Material::factory()->create(['nome' => 'Rolo', 'quantidade_estoque' => 10]);

        foreach (['pendente', 'reprovado'] as $status) {
            $orcamento = Orcamento::factory()->create(['status' => $status]);
            $orcamento->materiais()->attach($tinta->id, ['quantidade' => 2, 'preco_unitario_snapshot' => 10]);
            $orcamento->materiais()->attach($rolo->id, ['quantidade' => 1, 'preco_unitario_snapshot' => 5]);
            $orcamentos[$status] = $orcamento;
        }
        $this->deleteJson("/api/materiais/{$tinta->id}")->assertOk();

        foreach ($orcamentos as $status => $orcamento) {
            $this->patchJson("/api/orcamentos/{$orcamento->id}/aprovar")
                 ->assertUnprocessable()
                 ->assertJsonPath('message', 'Não é possível aprovar: o material "Tinta Azul" foi excluído do cadastro. Edite o orçamento e remova-o.')
                 ->assertJsonPath('materiais_excluidos', ['Tinta Azul']);
            $this->assertEquals($status, $orcamento->fresh()->status);
        }
        $this->assertEquals(10, Material::withTrashed()->find($tinta->id)->quantidade_estoque);
        $this->assertEquals(10, $rolo->fresh()->quantidade_estoque);

        // A API marca o item excluído, para a tela destacá-lo.
        $this->getJson("/api/orcamentos/{$orcamentos['pendente']->id}")
             ->assertJsonPath('materiais.0.excluido', true)
             ->assertJsonPath('materiais.1.excluido', false);

        // Removido o material excluído, aprova normalmente.
        $id = $orcamentos['pendente']->id;
        $this->putJson("/api/orcamentos/{$id}", ['materiais' => [['id' => $rolo->id, 'quantidade' => 1]]])->assertOk();
        $this->patchJson("/api/orcamentos/{$id}/aprovar")->assertOk();
        $this->assertEquals(9, $rolo->fresh()->quantidade_estoque);
    }

    public function test_mensagem_lista_todos_os_materiais_excluidos(): void
    {
        $orcamento = Orcamento::factory()->create();
        foreach (['Tinta', 'Rolo'] as $nome) {
            $m = Material::factory()->create(['nome' => $nome]);
            $orcamento->materiais()->attach($m->id, ['quantidade' => 1, 'preco_unitario_snapshot' => 1]);
            $m->delete();
        }

        $this->patchJson("/api/orcamentos/{$orcamento->id}/aprovar")
             ->assertUnprocessable()
             ->assertJsonPath('message', 'Não é possível aprovar: os materiais "Tinta", "Rolo" foram excluídos do cadastro. Edite o orçamento e remova-os.');
    }

    // Na edição, material excluído só pode ser mantido, diminuído ou removido;
    // e não dá para vincular um material excluído que o orçamento não tinha.
    public function test_edicao_com_material_excluido(): void
    {
        $tinta = Material::factory()->create(['nome' => 'Tinta Azul', 'quantidade_estoque' => 10]);
        $outro = Material::factory()->create(['nome' => 'Lixa']);
        $orcamento = Orcamento::factory()->create();
        $orcamento->materiais()->attach($tinta->id, ['quantidade' => 3, 'preco_unitario_snapshot' => 10]);
        $this->patchJson("/api/orcamentos/{$orcamento->id}/aprovar")->assertOk();
        $tinta->delete();
        $outro->delete();

        $this->putJson("/api/orcamentos/{$orcamento->id}", ['materiais' => [['id' => $tinta->id, 'quantidade' => 4]]])
             ->assertUnprocessable()
             ->assertJsonPath('errors.materiais.0', 'O material "Tinta Azul" foi excluído do cadastro: só é possível manter ou diminuir a quantidade, ou removê-lo.');

        $this->putJson("/api/orcamentos/{$orcamento->id}", ['materiais' => [
            ['id' => $tinta->id, 'quantidade' => 3], ['id' => $outro->id, 'quantidade' => 1],
        ]])->assertUnprocessable()->assertJsonPath('errors.materiais.0', 'Material não encontrado. Remova-o do orçamento.');

        // Manter e diminuir funcionam (o aprovado devolve a diferença).
        $this->putJson("/api/orcamentos/{$orcamento->id}", ['materiais' => [['id' => $tinta->id, 'quantidade' => 3]]])->assertOk();
        $this->putJson("/api/orcamentos/{$orcamento->id}", ['materiais' => [['id' => $tinta->id, 'quantidade' => 1]]])->assertOk();
        $this->assertEquals(9, Material::withTrashed()->find($tinta->id)->quantidade_estoque);
    }

    // Reprovado pode voltar a ser aprovado (e debita o estoque de novo).
    public function test_pode_aprovar_orcamento_reprovado(): void
    {
        $material  = Material::factory()->create(['quantidade_estoque' => 10]);
        $orcamento = Orcamento::factory()->create();
        $orcamento->materiais()->attach($material->id, ['quantidade' => 4, 'preco_unitario_snapshot' => 10]);

        $this->patchJson("/api/orcamentos/{$orcamento->id}/aprovar")->assertOk();
        $this->patchJson("/api/orcamentos/{$orcamento->id}/reprovar")->assertOk();
        $this->assertEquals(10, $material->fresh()->quantidade_estoque);

        $this->patchJson("/api/orcamentos/{$orcamento->id}/aprovar")->assertOk();
        $this->assertEquals('aprovado', $orcamento->fresh()->status);
        $this->assertEquals(6, $material->fresh()->quantidade_estoque);
    }

    public function test_reprovado_nao_aprova_sem_estoque(): void
    {
        $material  = Material::factory()->create(['quantidade_estoque' => 1]);
        $orcamento = Orcamento::factory()->create(['status' => 'reprovado']);
        $orcamento->materiais()->attach($material->id, ['quantidade' => 4, 'preco_unitario_snapshot' => 10]);

        $this->patchJson("/api/orcamentos/{$orcamento->id}/aprovar")->assertUnprocessable();
        $this->assertEquals('reprovado', $orcamento->fresh()->status);
        $this->assertEquals(1, $material->fresh()->quantidade_estoque);
    }

    public function test_cria_orcamento_sem_materiais_com_valor_em_reais(): void
    {
        $servico = Servico::factory()->create();

        $res = $this->postJson('/api/orcamentos', [
            'servico_id'    => $servico->id,
            'titulo'        => 'Só mão de obra',
            'margem_lucro'  => 350,
            'tipo_margem'   => 'percentual',
            'sem_materiais' => true,
        ])->assertCreated()->json();

        $this->assertTrue($res['sem_materiais']);
        $this->assertEquals('valor', $res['tipo_margem']);
        $this->assertEquals(350, $res['valor_final']);
        $this->assertCount(0, $res['materiais']);
    }

    public function test_orcamento_sem_materiais_recusa_materiais_e_valor_zero(): void
    {
        $servico  = Servico::factory()->create();
        $material = Material::factory()->create();
        $base = ['servico_id' => $servico->id, 'titulo' => 'X', 'sem_materiais' => true];

        $this->postJson('/api/orcamentos', $base + [
            'margem_lucro' => 100,
            'materiais'    => [['id' => $material->id, 'quantidade' => 1]],
        ])->assertUnprocessable()
          ->assertJsonPath('errors.materiais.0', 'Orçamento marcado como sem materiais não pode ter materiais vinculados.');

        $this->postJson('/api/orcamentos', $base + ['margem_lucro' => 0])
             ->assertUnprocessable()
             ->assertJsonPath('errors.margem_lucro.0', 'Informe o valor do orçamento sem materiais.');
    }

    // Marcar "sem materiais" num aprovado tira os materiais e devolve o estoque.
    public function test_editar_para_sem_materiais_devolve_estoque_do_aprovado(): void
    {
        $material  = Material::factory()->create(['quantidade_estoque' => 10]);
        $orcamento = Orcamento::factory()->create();
        $orcamento->materiais()->attach($material->id, ['quantidade' => 3, 'preco_unitario_snapshot' => 10]);
        $this->patchJson("/api/orcamentos/{$orcamento->id}/aprovar")->assertOk();
        $this->assertEquals(7, $material->fresh()->quantidade_estoque);

        $this->putJson("/api/orcamentos/{$orcamento->id}", [
            'sem_materiais' => true,
            'margem_lucro'  => 200,
        ])->assertOk()->assertJsonPath('sem_materiais', true)->assertJsonPath('valor_final', 200);

        $this->assertEquals(10, $material->fresh()->quantidade_estoque);
        $this->assertCount(0, $orcamento->fresh()->materiais);
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

    // "Aprovar um reprova os demais": o que o aprovado atual devolve ao ser
    // reprovado conta como estoque disponível para o novo. Ex.: estoque 10,
    // aprovado A usa 10 (sobra 0); aprovar B (também 10) troca um pelo outro.
    public function test_trocar_o_aprovado_conta_o_estoque_que_o_anterior_devolve(): void
    {
        $servico  = Servico::factory()->create();
        $material = Material::factory()->create(['quantidade_estoque' => 10]);

        $a = Orcamento::factory()->create(['servico_id' => $servico->id]);
        $a->materiais()->attach($material->id, ['quantidade' => 10, 'preco_unitario_snapshot' => $material->preco_unitario]);
        $b = Orcamento::factory()->create(['servico_id' => $servico->id]);
        $b->materiais()->attach($material->id, ['quantidade' => 10, 'preco_unitario_snapshot' => $material->preco_unitario]);

        $this->patchJson("/api/orcamentos/{$a->id}/aprovar")->assertOk();
        $this->assertEquals(0, $material->fresh()->quantidade_estoque);

        $this->patchJson("/api/orcamentos/{$b->id}/aprovar")->assertOk();

        $this->assertEquals('reprovado', $a->fresh()->status);
        $this->assertEquals('aprovado', $b->fresh()->status);
        $this->assertEquals(0, $material->fresh()->quantidade_estoque);
    }

    public function test_trocar_o_aprovado_ainda_barra_quando_nem_com_a_devolucao_ha_estoque(): void
    {
        $servico  = Servico::factory()->create();
        $material = Material::factory()->create(['nome' => 'Tinta', 'quantidade_estoque' => 10]);

        $a = Orcamento::factory()->create(['servico_id' => $servico->id]);
        $a->materiais()->attach($material->id, ['quantidade' => 10, 'preco_unitario_snapshot' => $material->preco_unitario]);
        $b = Orcamento::factory()->create(['servico_id' => $servico->id]);
        $b->materiais()->attach($material->id, ['quantidade' => 12, 'preco_unitario_snapshot' => $material->preco_unitario]);

        $this->patchJson("/api/orcamentos/{$a->id}/aprovar")->assertOk();

        $this->patchJson("/api/orcamentos/{$b->id}/aprovar")
             ->assertUnprocessable()
             ->assertJsonPath('message', 'Estoque insuficiente para: Tinta.');

        // Nada muda: A continua aprovado e B continua reprovado (aprovar A já o reprovou).
        $this->assertEquals('aprovado', $a->fresh()->status);
        $this->assertEquals('reprovado', $b->fresh()->status);
        $this->assertEquals(0, $material->fresh()->quantidade_estoque);
    }

    // Quantidades com casas decimais: 1,1 − 0,8 dá 0,30000000000000004 em
    // ponto flutuante, e isso não pode virar "estoque insuficiente" quando
    // sobra exatamente 0,3.
    public function test_editar_aprovado_com_decimais_usa_a_precisao_do_estoque(): void
    {
        $material  = Material::factory()->create(['quantidade_estoque' => 1.1]);
        $orcamento = Orcamento::factory()->create();
        $orcamento->materiais()->attach($material->id, ['quantidade' => 0.8, 'preco_unitario_snapshot' => $material->preco_unitario]);

        $this->patchJson("/api/orcamentos/{$orcamento->id}/aprovar")->assertOk();
        $this->assertEquals(0.3, round((float) $material->fresh()->quantidade_estoque, 3));

        $this->putJson("/api/orcamentos/{$orcamento->id}", ['materiais' => [['id' => $material->id, 'quantidade' => 1.1]]])
             ->assertOk();

        $this->assertEquals(0, round((float) $material->fresh()->quantidade_estoque, 3));
    }

    // Material excluído do cadastro depois da aprovação: reprovar (ou excluir)
    // o orçamento devolve o estoque dele mesmo assim.
    public function test_reprovar_devolve_estoque_de_material_excluido_depois_da_aprovacao(): void
    {
        $material  = Material::factory()->create(['quantidade_estoque' => 10]);
        $orcamento = Orcamento::factory()->create();
        $orcamento->materiais()->attach($material->id, ['quantidade' => 4, 'preco_unitario_snapshot' => $material->preco_unitario]);

        $this->patchJson("/api/orcamentos/{$orcamento->id}/aprovar")->assertOk();
        $material->delete();

        $this->patchJson("/api/orcamentos/{$orcamento->id}/reprovar")->assertOk();

        $this->assertEquals(10, Material::withTrashed()->find($material->id)->quantidade_estoque);
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
