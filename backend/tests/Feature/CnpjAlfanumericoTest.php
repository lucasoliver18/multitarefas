<?php

namespace Tests\Feature;

use App\Models\Cliente;
use App\Rules\CnpjValido;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Validator;
use Tests\TestCase;

class CnpjAlfanumericoTest extends TestCase
{
    use RefreshDatabase;

    private function valido(string $cnpj): bool
    {
        return Validator::make(['cnpj' => $cnpj], ['cnpj' => [new CnpjValido]])->passes();
    }

    public function test_aceita_exemplo_oficial_da_receita(): void
    {
        // Exemplo publicado pela Receita Federal para o CNPJ alfanumérico.
        $this->assertTrue($this->valido('12.ABC.345/01DE-35'));
        $this->assertTrue($this->valido('12ABC34501DE35'));
    }

    public function test_continua_aceitando_cnpj_numerico(): void
    {
        $this->assertTrue($this->valido('11.222.333/0001-81'));
    }

    public function test_recusa_digito_verificador_errado(): void
    {
        $this->assertFalse($this->valido('12.ABC.345/01DE-36'));
        $this->assertFalse($this->valido('11.222.333/0001-82'));
    }

    public function test_recusa_letra_nos_digitos_verificadores(): void
    {
        $this->assertFalse($this->valido('12.ABC.345/01DE-3A'));
    }

    public function test_recusa_caracteres_fora_do_padrao_e_tamanho_errado(): void
    {
        $this->assertFalse($this->valido('12.ABÇ.345/01DE-35'));
        $this->assertFalse($this->valido('12.AB*.345/01DE-35'));
        $this->assertFalse($this->valido('12.ABC.345/01D-35'));
        $this->assertFalse($this->valido('AAAAAAAAAAAAAA'));
        $this->assertFalse($this->valido('00.000.000/0000-00'));
    }

    public function test_cadastra_em_maiusculas_com_mascara_mesmo_digitado_em_minusculas(): void
    {
        $this->postJson('/api/clientes', [
            'nome'        => 'Empresa Nova',
            'tipo_pessoa' => 'juridica',
            'cnpj'        => '12abc34501de35',
        ])->assertCreated()
          ->assertJsonPath('cnpj', '12.ABC.345/01DE-35');
    }

    public function test_detecta_duplicado_independente_da_formatacao(): void
    {
        Cliente::factory()->create(['tipo_pessoa' => 'juridica', 'cnpj' => '12.ABC.345/01DE-35']);

        $this->postJson('/api/clientes', [
            'nome'        => 'Outra',
            'tipo_pessoa' => 'juridica',
            'cnpj'        => '12abc34501de35',
        ])->assertUnprocessable()
          ->assertJsonValidationErrors(['cnpj']);
    }
}
