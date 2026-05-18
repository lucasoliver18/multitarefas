<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('servicos', function (Blueprint $table) {
            $table->unsignedBigInteger('cliente_id')->nullable()->after('id');
        });

        // Migrar nomes de cliente já existentes para a tabela clientes
        $nomes = DB::table('servicos')
            ->whereNotNull('cliente')
            ->where('cliente', '!=', '')
            ->distinct()
            ->pluck('cliente');

        foreach ($nomes as $nome) {
            $clienteId = DB::table('clientes')->insertGetId([
                'nome'       => $nome,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
            DB::table('servicos')->where('cliente', $nome)->update(['cliente_id' => $clienteId]);
        }
    }

    public function down(): void
    {
        Schema::table('servicos', function (Blueprint $table) {
            $table->dropColumn('cliente_id');
        });
    }
};
