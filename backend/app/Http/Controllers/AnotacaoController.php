<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreAnotacaoRequest;
use App\Http\Resources\AnotacaoResource;
use App\Models\Anotacao;
use App\Models\Servico;

class AnotacaoController extends Controller
{
    public function index(Servico $servico)
    {
        return AnotacaoResource::collection(
            $servico->anotacoes()->orderBy('created_at', 'desc')->get()
        );
    }

    public function store(StoreAnotacaoRequest $request, Servico $servico)
    {
        $anotacao = $servico->anotacoes()->create($request->validated());
        return new AnotacaoResource($anotacao);
    }

    public function destroy(Anotacao $anotacao)
    {
        $anotacao->delete();
        return response()->json(['message' => 'Anotação removida.']);
    }
}
