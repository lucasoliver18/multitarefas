<?php

namespace Tests\Feature;

use App\Models\Material;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MaterialTest extends TestCase
{
    use RefreshDatabase;

    public function test_pode_listar_materiais(): void
    {
        Material::factory()->count(3)->create();

        $this->getJson('/api/materiais')
             ->assertOk()
             ->assertJsonCount(3);
    }

    public function test_pode_criar_material(): void
    {
        $this->postJson('/api/materiais', [
            'nome'               => 'Tinta Branca',
            'unidade_medida'     => 'L',
            'preco_unitario'     => 25.90,
            'quantidade_estoque' => 10,
        ])->assertCreated()
          ->assertJsonFragment(['nome' => 'Tinta Branca'])
          ->assertJsonFragment(['unidade_medida' => 'L']);
    }

    public function test_nao_cria_material_sem_nome(): void
    {
        $this->postJson('/api/materiais', [
            'unidade_medida' => 'L',
            'preco_unitario' => 25.90,
        ])->assertUnprocessable()
          ->assertJsonValidationErrors(['nome']);
    }

    public function test_nao_cria_material_com_nome_duplicado(): void
    {
        Material::factory()->create(['nome' => 'Tinta Branca']);

        $this->postJson('/api/materiais', [
            'nome'           => 'Tinta Branca',
            'unidade_medida' => 'L',
            'preco_unitario' => 30.00,
        ])->assertUnprocessable()
          ->assertJsonValidationErrors(['nome']);
    }

    public function test_quantidade_estoque_padrao_zero(): void
    {
        $res = $this->postJson('/api/materiais', [
            'nome'           => 'Cabo de Rede',
            'unidade_medida' => 'm',
            'preco_unitario' => 5.00,
        ])->assertCreated()->json();

        $this->assertEquals(0, $res['quantidade_estoque']);
    }

    public function test_deletar_material_usa_soft_delete(): void
    {
        $material = Material::factory()->create();

        $this->deleteJson("/api/materiais/{$material->id}")->assertOk();

        $this->assertSoftDeleted('materiais', ['id' => $material->id]);
    }

    public function test_apos_soft_delete_nome_pode_ser_reutilizado(): void
    {
        $material = Material::factory()->create(['nome' => 'Parafuso']);
        $this->deleteJson("/api/materiais/{$material->id}")->assertOk();

        $this->postJson('/api/materiais', [
            'nome'           => 'Parafuso',
            'unidade_medida' => 'cx',
            'preco_unitario' => 12.00,
        ])->assertCreated();
    }
}
