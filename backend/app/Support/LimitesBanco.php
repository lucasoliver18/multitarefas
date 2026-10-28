<?php

namespace App\Support;

// Limites das colunas no banco, usados nas validações para que um valor
// fora do suportado seja barrado com mensagem amigável antes de chegar ao
// banco (e não vire um erro de SQL).
final class LimitesBanco
{
    public const TAGS = ['informatica', 'pintura', 'outros'];

    // decimal(10,2)
    public const PRECO_MAX = 99999999.99;

    // decimal(10,3)
    public const QUANTIDADE_MAX = 9999999.999;

    // A margem pode ser em porcentagem ou em valor (R$); a coluna é
    // decimal(10,2), mas a porcentagem tem um teto de negócio menor.
    public const TIPOS_MARGEM = ['percentual', 'valor'];
    public const MARGEM_PERCENTUAL_MAX = 999.99;
    public const MARGEM_VALOR_MAX = 99999999.99;

    public static function margemMax(?string $tipo): float
    {
        return $tipo === 'valor' ? self::MARGEM_VALOR_MAX : self::MARGEM_PERCENTUAL_MAX;
    }

    // Colunas TEXT aceitam ~65 mil bytes; o limite fica bem abaixo disso
    // para caber mesmo com acentos (até 4 bytes por caractere).
    public const TEXTO_MAX = 5000;

    public const DATA_MIN = '1900-01-01';
    public const DATA_MAX = '2999-12-31';
}
