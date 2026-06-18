<?php

namespace App\Http\Controllers;

use App\Models\Anotacao;
use App\Models\Servico;
use Illuminate\Http\Request;

class AnotacaoController extends Controller
{
    public function index(Servico $servico)
    {
        return response()->json(
            $servico->anotacoes()->orderBy('created_at', 'desc')->get()
        );
    }

    public function store(Request $request, Servico $servico)
    {
        $request->validate([
            'conteudo' => 'required|string',
        ]);

        $anotacao = $servico->anotacoes()->create([
            'conteudo' => $request->conteudo,
        ]);

        return response()->json($anotacao, 201);
    }

    public function destroy(Anotacao $anotacao)
    {
        $anotacao->delete();
        return response()->json(['message' => 'Anotação removida.']);
    }
}
