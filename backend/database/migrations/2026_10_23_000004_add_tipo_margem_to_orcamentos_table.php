<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orcamentos', function (Blueprint $table) {
            // Margem em valor (R$) precisa de mais casas que a porcentagem (5,2).
            $table->decimal('margem_lucro', 10, 2)->default(0)->change();
            $table->enum('tipo_margem', ['percentual', 'valor'])->default('percentual')->after('margem_lucro');
        });
    }

    public function down(): void
    {
        Schema::table('orcamentos', function (Blueprint $table) {
            $table->dropColumn('tipo_margem');
            $table->decimal('margem_lucro', 5, 2)->default(0)->change();
        });
    }
};
