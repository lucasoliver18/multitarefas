<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\ClienteController;
use App\Http\Controllers\MaterialController;
use App\Http\Controllers\OrcamentoController;
use App\Http\Controllers\ServicoController;

Route::apiResource('servicos', ServicoController::class);
Route::apiResource('clientes', ClienteController::class);
Route::apiResource('materiais', MaterialController::class);
Route::apiResource('orcamentos', OrcamentoController::class);

Route::patch('orcamentos/{orcamento}/aprovar', [OrcamentoController::class, 'aprovar']);
Route::patch('orcamentos/{orcamento}/reprovar', [OrcamentoController::class, 'reprovar']);
Route::get('servicos/{servico}/orcamentos', [OrcamentoController::class, 'byServico']);
