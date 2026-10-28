<?php

namespace Tests\Feature;

use App\Models\Marca;
use App\Models\Material;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MarcaTest extends TestCase
{
    use RefreshDatabase;

    public function test_busca_marcas_pelo_nome_com_contagem_de_materiais(): void
    {
        $suvinil = Marca::factory()->create(['nome' => 'Suvinil']);
        Marca::factory()->create(['nome' => 'Coral']);
        Material::factory()->count(2)->create(['marca_id' => $suvinil->id]);

        $res = $this->getJson('/api/marcas?busca=suv')->assertOk()->json();

        $this->assertCount(1, $res['data']);
        $this->assertEquals(['Suvinil', 2], [$res['data'][0]['nome'], $res['data'][0]['materiais_count']]);
    }

    public function test_cadastra_marca_e_recusa_duplicada(): void
    {
        $this->postJson('/api/marcas', ['nome' => '  Suvinil  '])->assertCreated()->assertJsonPath('nome', 'Suvinil');

        $this->postJson('/api/marcas', ['nome' => 'Suvinil'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['nome']);
    }

    public function test_excluir_marca_em_uso_deixa_materiais_sem_marca(): void
    {
        $marca = Marca::factory()->create();
        $material = Material::factory()->create(['marca_id' => $marca->id]);

        $this->deleteJson("/api/marcas/{$marca->id}")->assertOk();

        $this->assertDatabaseMissing('marcas', ['id' => $marca->id]);
        $this->assertNull($material->fresh()->marca_id);
    }

    public function test_material_salva_e_devolve_a_marca(): void
    {
        $marca = Marca::factory()->create(['nome' => 'Coral']);

        $this->postJson('/api/materiais', [
            'nome' => 'Tinta', 'unidade_medida' => 'L', 'preco_unitario' => 10, 'marca_id' => $marca->id,
        ])->assertCreated()
          ->assertJsonPath('marca', 'Coral')
          ->assertJsonPath('marca_id', $marca->id);
    }

    public function test_material_recusa_marca_inexistente(): void
    {
        $this->postJson('/api/materiais', [
            'nome' => 'Tinta', 'unidade_medida' => 'L', 'preco_unitario' => 10, 'marca_id' => 999,
        ])->assertUnprocessable()
          ->assertJsonValidationErrors(['marca_id']);
    }

    public function test_busca_de_material_encontra_pela_marca(): void
    {
        $marca = Marca::factory()->create(['nome' => 'Gavião Fiel']);
        Material::factory()->create(['nome' => 'Pregos', 'marca_id' => $marca->id]);
        Material::factory()->create(['nome' => 'Outro']);

        $nomes = collect($this->getJson('/api/materiais?busca=Gavi&por_pagina=20')->assertOk()->json('data'))->pluck('nome');

        $this->assertEquals(['Pregos'], $nomes->all());
    }
}
