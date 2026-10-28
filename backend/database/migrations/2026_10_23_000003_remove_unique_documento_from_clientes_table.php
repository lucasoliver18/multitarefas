<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    // O índice único do banco também barrava CPF/CNPJ de clientes excluídos
    // (soft delete), gerando erro de banco ao recadastrá-los. A unicidade
    // passa a ser garantida só pela validação, que ignora os excluídos.
    public function up(): void
    {
        Schema::table('clientes', function (Blueprint $table) {
            $table->dropUnique(['cpf']);
            $table->dropUnique(['cnpj']);
            $table->index('cpf');
            $table->index('cnpj');
        });
    }

    public function down(): void
    {
        Schema::table('clientes', function (Blueprint $table) {
            $table->dropIndex(['cpf']);
            $table->dropIndex(['cnpj']);
            $table->unique('cpf');
            $table->unique('cnpj');
        });
    }
};
