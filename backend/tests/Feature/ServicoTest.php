<?php

namespace Tests\Feature;

use App\Models\Cliente;
use App\Models\Orcamento;
use App\Models\Servico;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ServicoTest extends TestCase
{
    use RefreshDatabase;

    public function test_pode_listar_servicos(): void
    {
        Servico::factory()->count(3)->create();

        $this->getJson('/api/servicos')
             ->assertOk()
             ->assertJsonCount(3);
    }

    public function test_pode_criar_servico(): void
    {
        $cliente = Cliente::factory()->create(['nome' => 'João Silva']);

        $this->postJson('/api/servicos', [
            'titulo'     => 'Instalação de câmera',
            'cliente_id' => $cliente->id,
            'prioridade' => 'alta',
            'status'     => 'pendente',
        ])->assertCreated()
          ->assertJsonFragment(['titulo' => 'Instalação de câmera'])
          ->assertJsonFragment(['cliente' => 'João Silva'])
          ->assertJsonFragment(['cliente_id' => $cliente->id]);
    }

    public function test_nao_cria_cliente_automaticamente_ao_criar_servico(): void
    {
        $this->postJson('/api/servicos', [
            'titulo'     => 'Manutenção',
            'cliente_id' => 999999,
            'prioridade' => 'baixa',
            'status'     => 'pendente',
        ])->assertUnprocessable()
          ->assertJsonValidationErrors(['cliente_id']);

        $this->assertDatabaseMissing('clientes', ['nome' => 'Novo Cliente Automático']);
    }

    public function test_nao_cria_servico_sem_titulo(): void
    {
        $cliente = Cliente::factory()->create();

        $this->postJson('/api/servicos', [
            'cliente_id' => $cliente->id,
            'prioridade' => 'alta',
            'status'     => 'pendente',
        ])->assertUnprocessable()
          ->assertJsonValidationErrors(['titulo']);
    }

    public function test_nao_cria_servico_com_prioridade_invalida(): void
    {
        $cliente = Cliente::factory()->create();

        $this->postJson('/api/servicos', [
            'titulo'     => 'Serviço X',
            'cliente_id' => $cliente->id,
            'prioridade' => 'urgente',
            'status'     => 'pendente',
        ])->assertUnprocessable()
          ->assertJsonValidationErrors(['prioridade']);
    }

    public function test_nao_cria_servico_com_cliente_id_inexistente(): void
    {
        $this->postJson('/api/servicos', [
            'titulo'     => 'Serviço X',
            'cliente_id' => 999999,
            'prioridade' => 'alta',
            'status'     => 'pendente',
        ])->assertUnprocessable()
          ->assertJsonValidationErrors(['cliente_id']);
    }

    public function test_atualizar_cliente_id_atualiza_nome_do_cliente_no_servico(): void
    {
        $servico = Servico::factory()->create();
        $novoCliente = Cliente::factory()->create(['nome' => 'Maria Souza']);

        $this->patchJson("/api/servicos/{$servico->id}", ['cliente_id' => $novoCliente->id])
             ->assertOk()
             ->assertJsonFragment(['cliente' => 'Maria Souza', 'cliente_id' => $novoCliente->id]);
    }

    public function test_pode_atualizar_status_do_servico(): void
    {
        $servico = Servico::factory()->create(['status' => 'pendente']);

        $this->patchJson("/api/servicos/{$servico->id}", ['status' => 'finalizado'])
             ->assertOk()
             ->assertJsonFragment(['status' => 'finalizado']);
    }

    public function test_sinaliza_se_servico_tem_orcamento_aprovado(): void
    {
        $semOrcamento = Servico::factory()->create();
        $comOrcamentoPendente = Servico::factory()->create();
        Orcamento::factory()->create(['servico_id' => $comOrcamentoPendente->id, 'status' => 'pendente']);
        $comOrcamentoAprovado = Servico::factory()->create();
        Orcamento::factory()->create(['servico_id' => $comOrcamentoAprovado->id, 'status' => 'aprovado']);

        $this->getJson('/api/servicos')
             ->assertOk()
             ->assertJsonFragment(['id' => $semOrcamento->id, 'tem_orcamento_aprovado' => false])
             ->assertJsonFragment(['id' => $comOrcamentoPendente->id, 'tem_orcamento_aprovado' => false])
             ->assertJsonFragment(['id' => $comOrcamentoAprovado->id, 'tem_orcamento_aprovado' => true]);

        $this->getJson("/api/servicos/{$comOrcamentoAprovado->id}")
             ->assertOk()
             ->assertJsonFragment(['tem_orcamento_aprovado' => true]);
    }

    public function test_nao_permite_retroceder_status_do_servico(): void
    {
        $servico = Servico::factory()->create(['status' => 'em_andamento']);

        $this->patchJson("/api/servicos/{$servico->id}", ['status' => 'pendente'])
             ->assertStatus(422)
             ->assertJsonValidationErrors('status');

        $this->assertSame('em_andamento', $servico->fresh()->status);
    }

    public function test_pode_marcar_servico_como_pago(): void
    {
        $servico = Servico::factory()->create(['pago' => false]);

        $this->patchJson("/api/servicos/{$servico->id}", ['pago' => true])
             ->assertOk()
             ->assertJsonFragment(['pago' => true]);

        $this->assertTrue($servico->fresh()->pago);
    }

    public function test_servico_nasce_nao_pago_por_padrao(): void
    {
        $cliente = Cliente::factory()->create();

        $res = $this->postJson('/api/servicos', [
            'titulo'     => 'Serviço novo',
            'cliente_id' => $cliente->id,
            'prioridade' => 'media',
            'status'     => 'pendente',
        ])->assertCreated()->json();

        $this->assertFalse($res['pago']);
    }

    public function test_deletar_servico_usa_soft_delete(): void
    {
        $servico = Servico::factory()->create();

        $this->deleteJson("/api/servicos/{$servico->id}")->assertOk();

        $this->assertSoftDeleted('servicos', ['id' => $servico->id]);
        $this->getJson('/api/servicos')->assertJsonMissing(['id' => $servico->id]);
    }

    public function test_lista_apenas_servicos_do_cliente_informado(): void
    {
        $cliente = Cliente::factory()->create();
        Servico::factory()->count(2)->create(['cliente_id' => $cliente->id, 'cliente' => $cliente->nome]);
        Servico::factory()->create();

        $res = $this->getJson("/api/servicos?cliente_id={$cliente->id}")->assertOk()->json();

        $this->assertCount(2, $res);
        $this->assertEquals([$cliente->id], array_values(array_unique(array_column($res, 'cliente_id'))));
    }

    public function test_filtra_por_status_e_periodo_de_prazo(): void
    {
        Servico::factory()->create(['titulo' => 'Dentro', 'status' => 'pendente', 'prazo' => '2026-11-10']);
        Servico::factory()->create(['titulo' => 'Fora do periodo', 'status' => 'pendente', 'prazo' => '2027-01-10']);
        Servico::factory()->create(['titulo' => 'Sem prazo', 'status' => 'pendente', 'prazo' => null]);
        Servico::factory()->create(['titulo' => 'Outro status', 'status' => 'finalizado', 'prazo' => '2026-11-10']);

        $titulos = collect($this->getJson('/api/servicos?status=pendente&prazo_de=2026-10-26&prazo_ate=2026-11-26')
            ->assertOk()->json())->pluck('titulo')->all();

        $this->assertEquals(['Dentro'], $titulos);
    }

    public function test_periodo_de_prazo_invertido_e_barrado_na_validacao(): void
    {
        $this->getJson('/api/servicos?prazo_de=2026-12-01&prazo_ate=2026-11-01')
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['prazo_ate']);
    }

    public function test_cliente_id_invalido_e_barrado_na_validacao(): void
    {
        $this->getJson('/api/servicos?cliente_id=abc')
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['cliente_id']);
    }
}
