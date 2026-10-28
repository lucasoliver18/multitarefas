<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    protected bool $autenticar = false;

    public function test_rotas_protegidas_exigem_autenticacao(): void
    {
        $this->getJson('/api/servicos')->assertUnauthorized();
    }

    public function test_login_rejeita_senha_errada(): void
    {
        User::factory()->create(['email' => 'dono@empresa.com', 'password' => 'senha-certa']);

        $this->postJson('/api/auth/login', ['email' => 'dono@empresa.com', 'password' => 'senha-errada'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['email']);
    }

    public function test_login_rejeita_email_inexistente(): void
    {
        $this->postJson('/api/auth/login', ['email' => 'estranho@gmail.com', 'password' => 'qualquer'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['email']);
    }

    public function test_login_com_credenciais_corretas_devolve_token(): void
    {
        User::factory()->create(['email' => 'dono@empresa.com', 'password' => 'senha-certa']);

        $this->postJson('/api/auth/login', ['email' => 'dono@empresa.com', 'password' => 'senha-certa'])
            ->assertOk()
            ->assertJsonStructure(['token', 'user' => ['id', 'name', 'email']])
            ->assertJsonMissingPath('user.password');
    }

    public function test_me_retorna_usuario_autenticado(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->getJson('/api/auth/me')
            ->assertOk()
            ->assertJsonFragment(['email' => $user->email]);
    }
}
