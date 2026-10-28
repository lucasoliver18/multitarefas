<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Orcamento extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'servico_id',
        'titulo',
        'descricao',
        'margem_lucro',
        'tipo_margem',
        'status',
    ];

    protected $appends = ['valor_materiais', 'valor_final'];

    protected $casts = [
        'aprovado_em' => 'datetime',
    ];

    // Registra quando o orçamento foi aprovado; reprovar limpa a data.
    protected static function booted(): void
    {
        static::saving(function (Orcamento $orcamento) {
            if ($orcamento->isDirty('status')) {
                $orcamento->aprovado_em = $orcamento->status === 'aprovado' ? now() : null;
            }
        });
    }

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

    // Margem em valor (R$) soma direto ao custo; em porcentagem, incide sobre ele.
    public function getValorFinalAttribute(): float
    {
        if ($this->tipo_margem === 'valor') {
            return $this->valor_materiais + $this->margem_lucro;
        }

        return $this->valor_materiais * (1 + $this->margem_lucro / 100);
    }
}
