<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use RuntimeException;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(): void
    {
        $admin = config('auth.admin');

        if (! $admin['email'] || ! $admin['password']) {
            throw new RuntimeException('Defina ADMIN_EMAIL e ADMIN_PASSWORD no .env antes de rodar o seeder.');
        }

        $user = User::updateOrCreate(
            ['email' => $admin['email']],
            ['name' => $admin['name'] ?: $admin['email'], 'password' => $admin['password']]
        );

        // Garante que só esse usuário tenha acesso: remove qualquer outro
        // (ex.: o antigo usuário de teste) e os tokens deles.
        User::whereKeyNot($user->id)->get()->each(function (User $outro) {
            $outro->tokens()->delete();
            $outro->delete();
        });
    }
}
