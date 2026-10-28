<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

// Datas de quando cada evento aconteceu, para os indicadores de período da
// tela inicial (recebido no mês, finalizados no mês, aprovado no mês...).
// Para registros antigos não há como saber a data real: usa-se a da última
// alteração (updated_at) como melhor aproximação.
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('servicos', function (Blueprint $table) {
            $table->timestamp('pago_em')->nullable()->after('pago');
            $table->timestamp('finalizado_em')->nullable()->after('status');
            $table->index('pago_em');
            $table->index('finalizado_em');
        });

        Schema::table('orcamentos', function (Blueprint $table) {
            $table->timestamp('aprovado_em')->nullable()->after('status');
            $table->index('aprovado_em');
        });

        DB::table('servicos')->where('pago', true)->update(['pago_em' => DB::raw('updated_at')]);
        DB::table('servicos')->where('status', 'finalizado')->update(['finalizado_em' => DB::raw('updated_at')]);
        DB::table('orcamentos')->where('status', 'aprovado')->update(['aprovado_em' => DB::raw('updated_at')]);
    }

    public function down(): void
    {
        Schema::table('servicos', function (Blueprint $table) {
            $table->dropIndex(['pago_em']);
            $table->dropIndex(['finalizado_em']);
            $table->dropColumn(['pago_em', 'finalizado_em']);
        });

        Schema::table('orcamentos', function (Blueprint $table) {
            $table->dropIndex(['aprovado_em']);
            $table->dropColumn('aprovado_em');
        });
    }
};
