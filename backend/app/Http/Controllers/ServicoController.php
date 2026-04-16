<?php

namespace App\Http\Controllers;

use App\Models\Servico;
use Illuminate\Http\Request;

class ServicoController extends Controller
{
    // Listar todos os serviços
    public function index()
    {
        $servicos = Servico::orderBy('created_at', 'desc')->get();
        return response()->json($servicos);
    }

    // Criar novo serviço
    public function store(Request $request)
    {
        $request->validate([
            'titulo'    => 'required|string|max:255',
            'cliente'   => 'required|string|max:255',
            'prioridade'=> 'required|in:alta,media,baixa',
            'status'    => 'required|in:pendente,em_andamento,finalizado',
            'prazo'     => 'nullable|date',
            'descricao' => 'nullable|string',
            'tag'       => 'nullable|string',
        ]);

        $servico = Servico::create($request->all());
        return response()->json($servico, 201);
    }

    // Buscar um serviço
    public function show(Servico $servico)
    {
        return response()->json($servico);
    }

    // Atualizar serviço
    public function update(Request $request, Servico $servico)
    {
        $request->validate([
            'titulo'    => 'sometimes|string|max:255',
            'cliente'   => 'sometimes|string|max:255',
            'prioridade'=> 'sometimes|in:alta,media,baixa',
            'status'    => 'sometimes|in:pendente,em_andamento,finalizado',
            'prazo'     => 'nullable|date',
            'descricao' => 'nullable|string',
            'tag'       => 'nullable|string',
        ]);

        $servico->update($request->all());
        return response()->json($servico);
    }

    // Deletar serviço
    public function destroy(Servico $servico)
    {
        $servico->delete();
        return response()->json(['message' => 'Serviço deletado com sucesso!']);
    }
}