<?php

namespace Tests\Feature;

use App\Models\Cliente;
use App\Models\Material;
use App\Models\Servico;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Route;
use Tests\TestCase;

class TratamentoErrosTest extends TestCase
{
    use RefreshDatabase;

    public function test_erro_de_banco_vira_mensagem_generica(): void
    {
        Route::middleware('api')->get('/api/teste-erro-banco', function () {
            DB::select('select * from tabela_que_nao_existe');
        });

        $res = $this->getJson('/api/teste-erro-banco')->assertStatus(500);

        $this->assertSame(['message' => 'Erro inesperado. Tente novamente.'], $res->json());
        $this->assertStringNotContainsString('tabela_que_nao_existe', $res->getContent());
    }

    public function test_registro_inexistente_vira_mensagem_amigavel(): void
    {
        $res = $this->getJson('/api/servicos/999999')->assertNotFound();

        $this->assertSame(['message' => 'Registro não encontrado.'], $res->json());
    }

    public function test_margem_acima_do_suportado_pelo_banco_e_barrada_na_validacao(): void
    {
        $servico = Servico::factory()->create();

        $this->postJson('/api/orcamentos', [
            'servico_id'   => $servico->id,
            'titulo'       => 'Proposta',
            'margem_lucro' => 1000,
        ])->assertUnprocessable()
          ->assertJsonValidationErrors(['margem_lucro']);
    }

    public function test_preco_acima_do_suportado_pelo_banco_e_barrado_na_validacao(): void
    {
        $this->postJson('/api/materiais', [
            'nome'           => 'Caro demais',
            'unidade_medida' => 'un',
            'preco_unitario' => 100000000,
        ])->assertUnprocessable()
          ->assertJsonValidationErrors(['preco_unitario']);
    }

    public function test_por_pagina_invalido_e_barrado_na_validacao(): void
    {
        $this->getJson('/api/materiais?por_pagina=0')
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['por_pagina']);
    }

    public function test_pode_recadastrar_cpf_de_cliente_excluido(): void
    {
        $cliente = Cliente::factory()->create(['tipo_pessoa' => 'fisica', 'cpf' => '529.982.247-25']);
        $cliente->delete();

        $this->postJson('/api/clientes', [
            'nome'        => 'Novo dono do CPF',
            'tipo_pessoa' => 'fisica',
            'cpf'         => '529.982.247-25',
        ])->assertCreated();
    }

    public function test_orcamento_nao_aceita_material_excluido(): void
    {
        $servico = Servico::factory()->create();
        $material = Material::factory()->create();
        $material->delete();

        $this->postJson('/api/orcamentos', [
            'servico_id'   => $servico->id,
            'titulo'       => 'Proposta',
            'margem_lucro' => 0,
            'materiais'    => [['id' => $material->id, 'quantidade' => 1]],
        ])->assertUnprocessable()
          ->assertJsonValidationErrors(['materiais.0.id']);
    }
}
