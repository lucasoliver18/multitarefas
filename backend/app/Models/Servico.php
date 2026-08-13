<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Servico extends Model
{
    use HasFactory, SoftDeletes;

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

    public function clienteRelacao()
    {
        return $this->belongsTo(Cliente::class, 'cliente_id');
    }

    public function orcamentos()
    {
        return $this->hasMany(Orcamento::class);
    }

    public function anotacoes()
    {
        return $this->hasMany(Anotacao::class);
    }
}
