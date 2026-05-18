<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Orcamento extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'servico_id',
        'titulo',
        'descricao',
        'margem_lucro',
        'status',
    ];

    protected $appends = ['valor_materiais', 'valor_final'];

    public function servico()
    {
        return $this->belongsTo(Servico::class);
    }

    public function materiais()
    {
        return $this->belongsToMany(Material::class, 'orcamento_material')
            ->withPivot('quantidade', 'preco_unitario_snapshot')
            ->withTimestamps();
    }

    public function getValorMateriaisAttribute(): float
    {
        return $this->materiais->sum(function ($material) {
            return $material->pivot->quantidade * $material->pivot->preco_unitario_snapshot;
        });
    }

    public function getValorFinalAttribute(): float
    {
        return $this->valor_materiais * (1 + $this->margem_lucro / 100);
    }
}
