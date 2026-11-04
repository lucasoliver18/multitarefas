<?php

namespace Tests\Feature;

use App\Models\Anotacao;
use App\Models\Servico;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AnotacaoTest extends TestCase
{
    use RefreshDatabase;

    public function test_cria_e_lista_anotacoes_da_mais_recente_para_a_mais_antiga(): void
    {
        $servico = Servico::factory()->create();

        $this->postJson("/api/servicos/{$servico->id}/anotacoes", ['conteudo' => 'Primeira'])->assertCreated();
        $this->travel(1)->minutes();
        $this->postJson("/api/servicos/{$servico->id}/anotacoes", ['conteudo' => 'Segunda'])->assertCreated();

        $this->getJson("/api/servicos/{$servico->id}/anotacoes")
             ->assertOk()
             ->assertJsonCount(2)
             ->assertJsonPath('0.conteudo', 'Segunda')
             ->assertJsonPath('1.conteudo', 'Primeira');
    }

    public function test_lista_so_as_anotacoes_do_proprio_servico(): void
    {
        [$a, $b] = Servico::factory()->count(2)->create();
        $this->postJson("/api/servicos/{$a->id}/anotacoes", ['conteudo' => 'Do A'])->assertCreated();
        $this->postJson("/api/servicos/{$b->id}/anotacoes", ['conteudo' => 'Do B'])->assertCreated();

        $this->getJson("/api/servicos/{$a->id}/anotacoes")->assertJsonCount(1)->assertJsonPath('0.conteudo', 'Do A');
    }

    public function test_conteudo_obrigatorio_e_limitado_a_500_caracteres(): void
    {
        $servico = Servico::factory()->create();
        $url = "/api/servicos/{$servico->id}/anotacoes";

        $this->postJson($url, ['conteudo' => ''])->assertUnprocessable()->assertJsonValidationErrors(['conteudo']);
        $this->postJson($url, ['conteudo' => str_repeat('a', 501)])->assertUnprocessable()->assertJsonValidationErrors(['conteudo']);
        $this->postJson($url, ['conteudo' => str_repeat('a', 500)])->assertCreated();
    }

    public function test_exclui_anotacao(): void
    {
        $servico = Servico::factory()->create();
        $id = $this->postJson("/api/servicos/{$servico->id}/anotacoes", ['conteudo' => 'Apagar'])->json('id');

        $this->deleteJson("/api/anotacoes/{$id}")->assertOk();

        $this->getJson("/api/servicos/{$servico->id}/anotacoes")->assertJsonCount(0);
        $this->assertNull(Anotacao::find($id));
    }

    public function test_servico_excluido_nao_aceita_nem_mostra_anotacoes(): void
    {
        $servico = Servico::factory()->create();
        $servico->delete();

        $this->getJson("/api/servicos/{$servico->id}/anotacoes")->assertNotFound();
        $this->postJson("/api/servicos/{$servico->id}/anotacoes", ['conteudo' => 'x'])->assertNotFound();
    }
}
