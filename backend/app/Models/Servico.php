<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Servico extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'titulo',
        'descricao',
        'cliente',
        'cliente_id',
        'prioridade',
        'status',
        'prazo',
        'tag',
    ];

    public function orcamentos()
    {
        return $this->hasMany(Orcamento::class);
    }

    public function anotacoes()
    {
        return $this->hasMany(Anotacao::class);
    }
}
