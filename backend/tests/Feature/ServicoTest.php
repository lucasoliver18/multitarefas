<?php

namespace Tests\Feature;

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
        $this->postJson('/api/servicos', [
            'titulo'    => 'Instalação de câmera',
            'cliente'   => 'João Silva',
            'prioridade'=> 'alta',
            'status'    => 'pendente',
        ])->assertCreated()
          ->assertJsonFragment(['titulo' => 'Instalação de câmera'])
          ->assertJsonFragment(['cliente' => 'João Silva']);
    }

    public function test_cria_cliente_automaticamente_ao_criar_servico(): void
    {
        $this->postJson('/api/servicos', [
            'titulo'    => 'Manutenção',
            'cliente'   => 'Novo Cliente Automático',
            'prioridade'=> 'baixa',
            'status'    => 'pendente',
        ])->assertCreated();

        $this->assertDatabaseHas('clientes', ['nome' => 'Novo Cliente Automático']);
    }

    public function test_nao_cria_servico_sem_titulo(): void
    {
        $this->postJson('/api/servicos', [
            'cliente'   => 'João Silva',
            'prioridade'=> 'alta',
            'status'    => 'pendente',
        ])->assertUnprocessable()
          ->assertJsonValidationErrors(['titulo']);
    }

    public function test_nao_cria_servico_com_prioridade_invalida(): void
    {
        $this->postJson('/api/servicos', [
            'titulo'    => 'Serviço X',
            'cliente'   => 'Cliente',
            'prioridade'=> 'urgente',
            'status'    => 'pendente',
        ])->assertUnprocessable()
          ->assertJsonValidationErrors(['prioridade']);
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
