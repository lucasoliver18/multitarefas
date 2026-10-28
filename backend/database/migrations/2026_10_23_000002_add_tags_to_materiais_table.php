<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('materiais', function (Blueprint $table) {
            // Mesmas tags do serviço (informatica, pintura, outros): o orçamento
            // de um serviço só oferece os materiais da tag dele.
            $table->json('tags')->nullable()->after('descricao');
        });
    }

    public function down(): void
    {
        Schema::table('materiais', function (Blueprint $table) {
            $table->dropColumn('tags');
        });
    }
};
