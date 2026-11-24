<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orcamentos', function (Blueprint $table) {
            // Orçamento só de mão de obra: não vincula materiais e o valor é
            // informado direto em R$ (guardado em margem_lucro, tipo "valor").
            $table->boolean('sem_materiais')->default(false)->after('tipo_margem');
        });
    }

    public function down(): void
    {
        Schema::table('orcamentos', function (Blueprint $table) {
            $table->dropColumn('sem_materiais');
        });
    }
};
