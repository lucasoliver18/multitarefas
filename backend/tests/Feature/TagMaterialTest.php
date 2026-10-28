<?php

namespace Tests\Feature;

use App\Models\Material;
use App\Models\Orcamento;
use App\Models\Servico;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TagMaterialTest extends TestCase
{
    use RefreshDatabase;

    public function test_material_salva_e_devolve_tags(): void
    {
        $this->postJson('/api/materiais', [
            'nome'           => 'Tinta acrílica',
            'unidade_medida' => 'L',
            'preco_unitario' => 80,
            'tags'           => ['pintura', 'outros'],
        ])->assertCreated()
          ->assertJsonPath('tags', ['pintura', 'outros']);
    }

    public function test_material_rejeita_tag_invalida(): void
    {
        $this->postJson('/api/materiais', [
            'nome'           => 'Cabo',
            'unidade_medida' => 'm',
            'preco_unitario' => 3,
            'tags'           => ['eletrica'],
        ])->assertUnprocessable()
          ->assertJsonValidationErrors(['tags.0']);
    }

    public function test_listagem_filtra_materiais_pela_tag(): void
    {
        Material::factory()->create(['nome' => 'Rolo de pintura', 'tags' => ['pintura']]);
        Material::factory()->create(['nome' => 'Mouse', 'tags' => ['informatica']]);
        Material::factory()->create(['nome' => 'Sem tag', 'tags' => null]);

        $nomes = collect($this->getJson('/api/materiais?tag=pintura')->assertOk()->json())->pluck('nome');

        $this->assertEquals(['Rolo de pintura'], $nomes->all());
    }

    public function test_orcamento_recusa_material_de_outra_tag(): void
    {
        $servico = Servico::factory()->create(['tag' => 'pintura']);
        $mouse = Material::factory()->create(['nome' => 'Mouse', 'tags' => ['informatica']]);

        $this->postJson('/api/orcamentos', [
            'servico_id'   => $servico->id,
            'titulo'       => 'Proposta',
            'margem_lucro' => 10,
            'materiais'    => [['id' => $mouse->id, 'quantidade' => 1]],
        ])->assertUnprocessable()
          ->assertJsonValidationErrors(['materiais']);
    }

    public function test_orcamento_aceita_material_da_mesma_tag(): void
    {
        $servico = Servico::factory()->create(['tag' => 'pintura']);
        $rolo = Material::factory()->create(['tags' => ['pintura', 'outros']]);

        $this->postJson('/api/orcamentos', [
            'servico_id'   => $servico->id,
            'titulo'       => 'Proposta',
            'margem_lucro' => 10,
            'materiais'    => [['id' => $rolo->id, 'quantidade' => 2]],
        ])->assertCreated();
    }

    public function test_editar_orcamento_mantem_material_antigo_fora_da_tag(): void
    {
        $servico = Servico::factory()->create(['tag' => 'pintura']);
        $antigo = Material::factory()->create(['tags' => null]);
        $orcamento = Orcamento::factory()->create(['servico_id' => $servico->id]);
        $orcamento->materiais()->attach($antigo->id, ['quantidade' => 1, 'preco_unitario_snapshot' => 10]);

        $this->putJson("/api/orcamentos/{$orcamento->id}", [
            'materiais' => [['id' => $antigo->id, 'quantidade' => 3]],
        ])->assertOk();
    }
}
