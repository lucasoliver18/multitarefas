<?php

namespace Tests\Feature;

use App\Models\Cliente;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ClienteTest extends TestCase
{
    use RefreshDatabase;

    public function test_pode_listar_clientes(): void
    {
        Cliente::factory()->count(3)->create();

        $this->getJson('/api/clientes')
             ->assertOk()
             ->assertJsonCount(3);
    }

    public function test_pode_criar_cliente(): void
    {
        $this->postJson('/api/clientes', [
            'nome'        => 'Maria Souza',
            'tipo_pessoa' => 'fisica',
            'cpf'         => '111.444.777-35',
            'telefone'    => '(43) 99999-9999',
            'email'       => 'maria@email.com',
        ])->assertCreated()
          ->assertJsonFragment(['nome' => 'Maria Souza']);
    }

    public function test_pode_criar_cliente_pessoa_juridica(): void
    {
        $this->postJson('/api/clientes', [
            'nome'        => 'Empresa LTDA',
            'tipo_pessoa' => 'juridica',
            'cnpj'        => '11.222.333/0001-81',
            'telefone'    => '(43) 3333-4444',
        ])->assertCreated()
          ->assertJsonFragment(['nome' => 'Empresa LTDA']);
    }

    public function test_nao_cria_cliente_com_cpf_invalido(): void
    {
        $this->postJson('/api/clientes', [
            'nome'        => 'Fulano',
            'tipo_pessoa' => 'fisica',
            'cpf'         => '111.111.111-11',
        ])->assertUnprocessable()
          ->assertJsonValidationErrors(['cpf']);
    }

    public function test_nao_cria_cliente_sem_nome(): void
    {
        $this->postJson('/api/clientes', ['telefone' => '(43) 99999-9999'])
             ->assertUnprocessable()
             ->assertJsonValidationErrors(['nome']);
    }

    public function test_nao_cria_cliente_com_email_invalido(): void
    {
        $this->postJson('/api/clientes', [
            'nome'        => 'Fulano',
            'tipo_pessoa' => 'fisica',
            'cpf'         => '111.444.777-35',
            'email'       => 'nao-é-um-email',
        ])->assertUnprocessable()
          ->assertJsonValidationErrors(['email']);
    }

    public function test_pode_atualizar_cliente(): void
    {
        $cliente = Cliente::factory()->create(['nome' => 'Nome Antigo']);

        $this->putJson("/api/clientes/{$cliente->id}", ['nome' => 'Nome Novo'])
             ->assertOk()
             ->assertJsonFragment(['nome' => 'Nome Novo']);
    }

    public function test_deletar_cliente_usa_soft_delete(): void
    {
        $cliente = Cliente::factory()->create();

        $this->deleteJson("/api/clientes/{$cliente->id}")->assertOk();

        $this->assertSoftDeleted('clientes', ['id' => $cliente->id]);
    }
}
