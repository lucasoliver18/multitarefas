<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function loginGoogle(Request $request)
    {
        $request->validate(['credential' => 'required|string']);

        $resposta = Http::get('https://oauth2.googleapis.com/tokeninfo', [
            'id_token' => $request->credential,
        ]);

        if (! $resposta->ok()) {
            throw ValidationException::withMessages([
                'credential' => 'Não foi possível validar o login com o Google.',
            ]);
        }

        $payload = $resposta->json();

        if (($payload['aud'] ?? null) !== config('services.google.client_id')) {
            throw ValidationException::withMessages([
                'credential' => 'Token do Google inválido para este aplicativo.',
            ]);
        }

        $email = $payload['email'] ?? null;
        $emailVerificado = filter_var($payload['email_verified'] ?? false, FILTER_VALIDATE_BOOLEAN);

        if (! $email || ! $emailVerificado) {
            throw ValidationException::withMessages([
                'credential' => 'E-mail do Google não verificado.',
            ]);
        }

        $emailsPermitidos = config('services.google.allowed_emails');
        if (! in_array(strtolower($email), array_map('strtolower', $emailsPermitidos), true)) {
            throw ValidationException::withMessages([
                'credential' => 'Este e-mail não tem acesso ao sistema.',
            ]);
        }

        $user = User::updateOrCreate(
            ['google_id' => $payload['sub']],
            [
                'name' => $payload['name'] ?? $email,
                'email' => $email,
                'avatar' => $payload['picture'] ?? null,
            ]
        );

        $token = $user->createToken('app')->plainTextToken;

        return response()->json(['token' => $token, 'user' => $user]);
    }

    public function me(Request $request)
    {
        return response()->json($request->user());
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'Sessão encerrada.']);
    }
}
