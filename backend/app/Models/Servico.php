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
        'pago',
        'prazo',
        'tag',
    ];

    protected $casts = [
        'pago'          => 'boolean',
        'pago_em'       => 'datetime',
        'finalizado_em' => 'datetime',
    ];

    // Registra quando o serviço foi pago e quando foi finalizado, para os
    // indicadores de período da tela inicial. Desmarcar o pagamento limpa a data.
    protected static function booted(): void
    {
        static::saving(function (Servico $servico) {
            if ($servico->isDirty('pago')) {
                $servico->pago_em = $servico->pago ? now() : null;
            }
            if ($servico->isDirty('status')) {
                $servico->finalizado_em = $servico->status === 'finalizado' ? ($servico->finalizado_em ?? now()) : null;
            }
        });
    }

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
