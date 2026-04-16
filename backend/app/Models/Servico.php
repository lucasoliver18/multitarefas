<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Servico extends Model
{
    protected $fillable = [
        'titulo',
        'descricao',
        'cliente',
        'prioridade',
        'status',
        'prazo',
        'tag',
    ];
}