<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Material extends Model
{
    use SoftDeletes;

    protected $table = 'materiais';

    protected $fillable = [
        'nome',
        'descricao',
        'unidade_medida',
        'preco_unitario',
        'quantidade_estoque',
    ];

    public function orcamentos()
    {
        return $this->belongsToMany(Orcamento::class, 'orcamento_material')
            ->withPivot('quantidade', 'preco_unitario_snapshot')
            ->withTimestamps();
    }
}
