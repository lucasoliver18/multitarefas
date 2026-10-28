<?php

namespace App\Http\Requests\Concerns;

use App\Rules\CnpjValido;

// Grava o CNPJ sempre no mesmo formato (maiúsculas, com máscara
// XX.XXX.XXX/XXXX-XX), para que a checagem de duplicidade funcione mesmo
// se ele for digitado em minúsculas ou sem pontuação.
trait NormalizaCnpj
{
    protected function prepareForValidation(): void
    {
        if (! $this->filled('cnpj')) {
            return;
        }

        $cnpj = CnpjValido::normalizar($this->input('cnpj'));

        if (preg_match('/^[A-Z0-9]{14}$/', $cnpj)) {
            $cnpj = substr($cnpj, 0, 2) . '.' . substr($cnpj, 2, 3) . '.' . substr($cnpj, 5, 3)
                . '/' . substr($cnpj, 8, 4) . '-' . substr($cnpj, 12, 2);
        }

        $this->merge(['cnpj' => $cnpj]);
    }
}
