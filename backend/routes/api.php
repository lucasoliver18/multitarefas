<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AnotacaoController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\ClienteController;
use App\Http\Controllers\MaterialController;
use App\Http\Controllers\OrcamentoController;
use App\Http\Controllers\ServicoController;

Route::post('auth/google', [AuthController::class, 'loginGoogle']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('auth/me', [AuthController::class, 'me']);
    Route::post('auth/logout', [AuthController::class, 'logout']);

    Route::apiResource('servicos', ServicoController::class);
    Route::apiResource('clientes', ClienteController::class);
    Route::patch('clientes/{cliente}/transferir-servicos', [ClienteController::class, 'transferirServicos']);
    Route::apiResource('materiais', MaterialController::class)->parameters(['materiais' => 'material']);
    Route::apiResource('orcamentos', OrcamentoController::class);

    Route::patch('orcamentos/{orcamento}/aprovar', [OrcamentoController::class, 'aprovar']);
    Route::patch('orcamentos/{orcamento}/reprovar', [OrcamentoController::class, 'reprovar']);
    Route::get('servicos/{servico}/orcamentos', [OrcamentoController::class, 'byServico']);
    Route::get('servicos/{servico}/anotacoes', [AnotacaoController::class, 'index']);
    Route::post('servicos/{servico}/anotacoes', [AnotacaoController::class, 'store']);
    Route::delete('anotacoes/{anotacao}', [AnotacaoController::class, 'destroy']);
});
