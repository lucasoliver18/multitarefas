<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

// CNPJ numérico ou alfanumérico (IN RFB nº 2.229/2024): os 12 primeiros
// caracteres podem ser letras maiúsculas ou números e os 2 últimos (dígitos
// verificadores) são sempre números. No cálculo do módulo 11, cada caractere
// vale seu código ASCII menos 48 ('0'..'9' = 0..9, 'A' = 17 ... 'Z' = 42),
// então um CNPJ só numérico continua sendo validado exatamente como antes.
class CnpjValido implements ValidationRule
{
    public static function normalizar(?string $valor): string
    {
        return strtoupper(preg_replace('/[.\/\-\s]/', '', (string) $valor));
    }

    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        $cnpj = self::normalizar($value);

        if (! preg_match('/^[A-Z0-9]{12}\d{2}$/', $cnpj) || preg_match('/^(.)\1{13}$/', $cnpj)) {
            $fail('O :attribute informado é inválido.');
            return;
        }

        $pesosPrimeiroDigito = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
        $pesosSegundoDigito = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

        foreach ([$pesosPrimeiroDigito, $pesosSegundoDigito] as $pesos) {
            $posicao = count($pesos);
            $soma = 0;
            for ($i = 0; $i < $posicao; $i++) {
                $soma += (ord($cnpj[$i]) - 48) * $pesos[$i];
            }
            $resto = $soma % 11;
            $digitoVerificador = $resto < 2 ? 0 : 11 - $resto;

            if ((int) $cnpj[$posicao] !== $digitoVerificador) {
                $fail('O :attribute informado é inválido.');
                return;
            }
        }
    }
}
