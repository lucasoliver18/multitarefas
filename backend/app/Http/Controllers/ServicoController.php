<?php

namespace App\Http\Controllers;

use App\Models\Cliente;
use App\Models\Servico;
use Illuminate\Http\Request;

class ServicoController extends Controller
{
    public function index()
    {
        $servicos = Servico::orderBy('created_at', 'desc')->get();
        return response()->json($servicos);
    }

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

        $data = $request->all();
        $data['cliente_id'] = Cliente::firstOrCreate(['nome' => $request->cliente])->id;

        $servico = Servico::create($data);
        return response()->json($servico, 201);
    }

    public function show(Servico $servico)
    {
        return response()->json($servico);
    }

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

        $data = $request->all();

        if ($request->filled('cliente')) {
            $data['cliente_id'] = Cliente::firstOrCreate(['nome' => $request->cliente])->id;
        }

        $servico->update($data);
        return response()->json($servico);
    }

    public function destroy(Servico $servico)
    {
        $servico->delete();
        return response()->json(['message' => 'Serviço deletado com sucesso!']);
    }
}
