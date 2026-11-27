<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('servicos', function (Blueprint $table) {
            // A listagem de clientes conta os serviços de cada um, e a tela do
            // cliente filtra por ele: sem índice, cada contagem lia a tabela
            // de serviços inteira.
            $table->index('cliente_id');
        });
    }

    public function down(): void
    {
        Schema::table('servicos', function (Blueprint $table) {
            $table->dropIndex(['cliente_id']);
        });
    }
};
