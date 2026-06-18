<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Anotacao extends Model
{
    protected $table = 'anotacoes';

    protected $fillable = ['servico_id', 'conteudo'];

    public function servico()
    {
        return $this->belongsTo(Servico::class);
    }
}
