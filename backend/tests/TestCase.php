<?php

namespace Tests;

use App\Models\User;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        // Todas as rotas exigem auth:sanctum; autentica como usuário genérico por padrão.
        if (property_exists($this, 'autenticar') && $this->autenticar === false) {
            return;
        }

        $this->actingAs(User::factory()->create());
    }
}
