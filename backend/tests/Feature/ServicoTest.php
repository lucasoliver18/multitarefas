<?php

namespace Tests\Feature;

use App\Models\Cliente;
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

    public function test_deletar_servico_usa_soft_delete(): void
    {
        $servico = Servico::factory()->create();

        $this->deleteJson("/api/servicos/{$servico->id}")->assertOk();

        $this->assertSoftDeleted('servicos', ['id' => $servico->id]);
        $this->getJson('/api/servicos')->assertJsonMissing(['id' => $servico->id]);
    }
}
