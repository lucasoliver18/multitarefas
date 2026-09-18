<?php

namespace Tests;

use App\Models\User;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        // Todas as rotas da API exigem autenticação (auth:sanctum); os testes de
        // Feature autenticam como um usuário genérico por padrão.
        if (property_exists($this, 'autenticar') && $this->autenticar === false) {
            return;
        }

        $this->actingAs(User::factory()->create());
    }
}
