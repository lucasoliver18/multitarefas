<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('clientes', function (Blueprint $table) {
            $table->enum('tipo_pessoa', ['fisica', 'juridica'])->default('fisica')->after('nome');
            $table->string('cpf', 14)->nullable()->unique()->after('tipo_pessoa');
            $table->string('cnpj', 18)->nullable()->unique()->after('cpf');
        });
    }

    public function down(): void
    {
        Schema::table('clientes', function (Blueprint $table) {
            $table->dropColumn(['tipo_pessoa', 'cpf', 'cnpj']);
        });
    }
};
