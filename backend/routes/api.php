<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\ServicoController;

Route::apiResource('servicos', ServicoController::class);