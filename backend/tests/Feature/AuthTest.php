<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    protected bool $autenticar = false;

    public function test_rotas_protegidas_exigem_autenticacao(): void
    {
        $this->getJson('/api/servicos')->assertUnauthorized();
    }

    public function test_login_rejeita_email_nao_permitido(): void
    {
        config(['services.google.allowed_emails' => ['dono@empresa.com']]);

        Http::fake([
            'oauth2.googleapis.com/*' => Http::response([
                'aud' => config('services.google.client_id'),
                'email' => 'estranho@gmail.com',
                'email_verified' => 'true',
                'sub' => 'google-id-123',
                'name' => 'Estranho',
            ]),
        ]);

        $this->postJson('/api/auth/google', ['credential' => 'token-falso'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['credential']);
    }

    public function test_login_aceita_email_permitido_e_devolve_token(): void
    {
        config(['services.google.allowed_emails' => ['dono@empresa.com']]);

        Http::fake([
            'oauth2.googleapis.com/*' => Http::response([
                'aud' => config('services.google.client_id'),
                'email' => 'dono@empresa.com',
                'email_verified' => 'true',
                'sub' => 'google-id-123',
                'name' => 'Dono',
                'picture' => 'https://exemplo.com/avatar.jpg',
            ]),
        ]);

        $this->postJson('/api/auth/google', ['credential' => 'token-falso'])
            ->assertOk()
            ->assertJsonStructure(['token', 'user' => ['id', 'name', 'email']])
            ->assertJsonFragment(['email' => 'dono@empresa.com']);

        $this->assertDatabaseHas('users', ['email' => 'dono@empresa.com', 'google_id' => 'google-id-123']);
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
