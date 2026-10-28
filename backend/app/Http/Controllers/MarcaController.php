<?php

namespace App\Http\Controllers;

use App\Models\Marca;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class MarcaController extends Controller
{
    // Lista paginada para o campo de busca de marca (mesmo formato de clientes).
    public function index(Request $request)
    {
        $filtros = $request->validate([
            'busca'      => 'nullable|string|max:255',
            'por_pagina' => 'nullable|integer|min:1|max:100',
        ]);

        $marcas = Marca::withCount('materiais')
            ->when(! empty($filtros['busca']), fn ($q) => $q->where('nome', 'like', '%' . $filtros['busca'] . '%'))
            ->orderBy('nome')
            ->paginate($filtros['por_pagina'] ?? 20);

        return response()->json([
            'data' => $marcas->map(fn ($m) => $this->formatar($m)),
            'meta' => ['current_page' => $marcas->currentPage(), 'last_page' => $marcas->lastPage()],
        ]);
    }

    public function store(Request $request)
    {
        $request->merge(['nome' => trim(preg_replace('/\s+/', ' ', (string) $request->input('nome')))]);
        $dados = $request->validate([
            'nome' => ['required', 'string', 'max:255', Rule::unique('marcas', 'nome')],
        ], [
            'nome.unique' => 'Essa marca já está cadastrada.',
        ]);

        $marca = Marca::create($dados);
        $marca->materiais_count = 0;

        return response()->json($this->formatar($marca), 201);
    }

    // Excluir uma marca em uso deixa os materiais dela sem marca (a tela avisa
    // antes, mostrando quantos materiais usam).
    public function destroy(Marca $marca)
    {
        DB::transaction(function () use ($marca) {
            $marca->materiais()->withTrashed()->update(['marca_id' => null]);
            $marca->delete();
        });

        return response()->json(['message' => 'Marca excluída.']);
    }

    private function formatar(Marca $marca): array
    {
        return [
            'id'              => $marca->id,
            'nome'            => $marca->nome,
            'materiais_count' => (int) $marca->materiais_count,
        ];
    }
}
