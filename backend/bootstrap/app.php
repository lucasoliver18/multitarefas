<?php

use Illuminate\Auth\AuthenticationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Exceptions\ThrottleRequestsException;
use Illuminate\Http\Request;
use Illuminate\Routing\Middleware\ThrottleRequests;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;
use Symfony\Component\HttpKernel\Exception\MethodNotAllowedHttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        $middleware->validateCsrfTokens(except: [
            'api/*'
        ]);

        $middleware->api(prepend: [
            ThrottleRequests::class.':api',
        ]);

        // API pura: convidados recebem 401 em vez de redirecionamento.
        $middleware->redirectGuestsTo(fn () => null);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        // A API nunca devolve detalhes internos (SQL, stack trace, nomes de
        // classe): só mensagens pensadas para o usuário. O erro real continua
        // indo para o log (storage/logs) pelo report padrão do Laravel.
        $exceptions->shouldRenderJsonWhen(fn (Request $request) => $request->is('api/*'));

        $exceptions->render(function (Throwable $e, Request $request) {
            if (! $request->is('api/*')) {
                return null;
            }

            // Erros de validação já trazem mensagens amigáveis por campo.
            if ($e instanceof ValidationException) {
                return null;
            }

            if ($e instanceof AuthenticationException) {
                return response()->json(['message' => 'Sessão expirada. Entre novamente.'], 401);
            }

            if ($e instanceof ThrottleRequestsException) {
                return response()->json(['message' => 'Muitas tentativas. Aguarde um instante.'], 429);
            }

            if ($e instanceof ModelNotFoundException || $e instanceof NotFoundHttpException) {
                return response()->json(['message' => 'Registro não encontrado.'], 404);
            }

            if ($e instanceof MethodNotAllowedHttpException) {
                return response()->json(['message' => 'Operação não permitida.'], 405);
            }

            if ($e instanceof HttpExceptionInterface && $e->getStatusCode() < 500) {
                return response()->json(['message' => 'Não foi possível concluir a operação.'], $e->getStatusCode());
            }

            // Qualquer outro erro (banco de dados, bug, serviço fora do ar...).
            return response()->json(['message' => 'Erro inesperado. Tente novamente.'], 500);
        });
    })->create();
