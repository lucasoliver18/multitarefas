<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Material extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'materiais';

    protected $fillable = [
        'nome',
        'marca',
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
