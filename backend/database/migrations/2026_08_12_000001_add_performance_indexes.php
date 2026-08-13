<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('servicos', function (Blueprint $table) {
            $table->index('deleted_at');
            $table->index('status');
            $table->index('prazo');
        });

        Schema::table('materiais', function (Blueprint $table) {
            $table->index('deleted_at');
        });

        Schema::table('clientes', function (Blueprint $table) {
            $table->index('deleted_at');
        });

        Schema::table('orcamentos', function (Blueprint $table) {
            $table->index('status');
        });

        Schema::table('anotacoes', function (Blueprint $table) {
            $table->index('servico_id');
        });
    }

    public function down(): void
    {
        Schema::table('servicos', function (Blueprint $table) {
            $table->dropIndex(['deleted_at']);
            $table->dropIndex(['status']);
            $table->dropIndex(['prazo']);
        });

        Schema::table('materiais', function (Blueprint $table) {
            $table->dropIndex(['deleted_at']);
        });

        Schema::table('clientes', function (Blueprint $table) {
            $table->dropIndex(['deleted_at']);
        });

        Schema::table('orcamentos', function (Blueprint $table) {
            $table->dropIndex(['status']);
        });

        Schema::table('anotacoes', function (Blueprint $table) {
            $table->dropIndex(['servico_id']);
        });
    }
};
