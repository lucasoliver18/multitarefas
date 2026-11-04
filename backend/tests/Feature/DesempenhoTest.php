<?php

namespace Tests\Feature;

use App\Models\Cliente;
use App\Models\Material;
use App\Models\Orcamento;
use App\Models\Servico;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

// Garante que as listagens não fazem uma consulta por registro (N+1): o
// número de consultas tem que ser o mesmo com 2 ou com 20 registros.
class DesempenhoTest extends TestCase
{
    use RefreshDatabase;

    private function consultas(string $url): int
    {
        DB::flushQueryLog();
        DB::enableQueryLog();
        $this->getJson($url)->assertOk();
        $total = count(DB::getQueryLog());
        DB::disableQueryLog();

        return $total;
    }

    private function criarServicosComOrcamento(int $quantidade): void
    {
        Servico::factory()->count($quantidade)->create()->each(function (Servico $s) {
            $orcamento = Orcamento::factory()->create(['servico_id' => $s->id]);
            $orcamento->materiais()->attach(Material::factory()->create()->id, ['quantidade' => 1, 'preco_unitario_snapshot' => 10]);
            $s->anotacoes()->create(['conteudo' => 'Nota']);
        });
    }

    public function test_listagens_nao_crescem_em_consultas_com_mais_registros(): void
    {
        $urls = ['/api/servicos', '/api/orcamentos', '/api/clientes', '/api/materiais', '/api/marcas', '/api/dashboard'];

        $this->criarServicosComOrcamento(2);
        $antes = array_map(fn ($u) => $this->consultas($u), $urls);

        $this->criarServicosComOrcamento(18);
        Cliente::factory()->count(10)->create();
        $depois = array_map(fn ($u) => $this->consultas($u), $urls);

        $this->assertSame(array_combine($urls, $antes), array_combine($urls, $depois));
    }
}
