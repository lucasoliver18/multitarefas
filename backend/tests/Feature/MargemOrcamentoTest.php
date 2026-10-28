<?php

namespace Tests\Feature;

use App\Models\Material;
use App\Models\Orcamento;
use App\Models\Servico;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MargemOrcamentoTest extends TestCase
{
    use RefreshDatabase;

    private function criar(array $dados)
    {
        $servico = Servico::factory()->create();
        $material = Material::factory()->create(['preco_unitario' => 50]);

        return $this->postJson('/api/orcamentos', array_merge([
            'servico_id' => $servico->id,
            'titulo'     => 'Proposta',
            'materiais'  => [['id' => $material->id, 'quantidade' => 2]],
        ], $dados));
    }

    public function test_sem_tipo_a_margem_e_percentual(): void
    {
        $this->criar(['margem_lucro' => 10])
            ->assertCreated()
            ->assertJsonPath('tipo_margem', 'percentual')
            ->assertJsonPath('valor_final', 110);
    }

    public function test_margem_em_valor_soma_ao_custo(): void
    {
        $this->criar(['margem_lucro' => 35.5, 'tipo_margem' => 'valor'])
            ->assertCreated()
            ->assertJsonPath('tipo_margem', 'valor')
            ->assertJsonPath('valor_final', 135.5);
    }

    public function test_margem_em_valor_aceita_mais_que_o_teto_percentual(): void
    {
        $this->criar(['margem_lucro' => 2500, 'tipo_margem' => 'valor'])->assertCreated();
    }

    public function test_tipo_de_margem_invalido_e_recusado(): void
    {
        $this->criar(['margem_lucro' => 10, 'tipo_margem' => 'dolar'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['tipo_margem']);
    }

    public function test_trocar_tipo_exige_reenviar_a_margem(): void
    {
        $orcamento = Orcamento::factory()->create(['margem_lucro' => 10]);

        $this->putJson("/api/orcamentos/{$orcamento->id}", ['tipo_margem' => 'valor'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['margem_lucro']);

        $this->putJson("/api/orcamentos/{$orcamento->id}", ['tipo_margem' => 'valor', 'margem_lucro' => 1500])
            ->assertOk()
            ->assertJsonPath('tipo_margem', 'valor');
    }

    public function test_editar_margem_respeita_o_tipo_ja_salvo(): void
    {
        $orcamento = Orcamento::factory()->create(['margem_lucro' => 10, 'tipo_margem' => 'percentual']);

        $this->putJson("/api/orcamentos/{$orcamento->id}", ['margem_lucro' => 1500])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['margem_lucro']);
    }
}
