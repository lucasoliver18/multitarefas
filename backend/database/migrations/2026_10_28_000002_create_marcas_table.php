<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

// A marca deixa de ser um texto livre em cada material e passa a ser um
// cadastro próprio (como clientes), para evitar marcas duplicadas. As marcas
// já digitadas viram registros; nomes iguais (ignorando maiúsculas e espaços)
// são unidos em uma só.
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('marcas', function (Blueprint $table) {
            $table->id();
            $table->string('nome')->unique();
            $table->timestamps();
        });

        Schema::table('materiais', function (Blueprint $table) {
            $table->foreignId('marca_id')->nullable()->after('nome')->constrained('marcas')->nullOnDelete();
        });

        $ids = [];
        foreach (DB::table('materiais')->whereNotNull('marca')->get(['id', 'marca']) as $material) {
            $nome = trim(preg_replace('/\s+/', ' ', $material->marca));
            if ($nome === '') {
                continue;
            }
            $chave = mb_strtolower($nome);
            $ids[$chave] ??= DB::table('marcas')->insertGetId(['nome' => $nome, 'created_at' => now(), 'updated_at' => now()]);
            DB::table('materiais')->where('id', $material->id)->update(['marca_id' => $ids[$chave]]);
        }

        Schema::table('materiais', function (Blueprint $table) {
            $table->dropColumn('marca');
        });
    }

    public function down(): void
    {
        Schema::table('materiais', function (Blueprint $table) {
            $table->string('marca')->nullable()->after('nome');
        });

        foreach (DB::table('materiais')->whereNotNull('marca_id')->get(['id', 'marca_id']) as $material) {
            DB::table('materiais')->where('id', $material->id)
                ->update(['marca' => DB::table('marcas')->where('id', $material->marca_id)->value('nome')]);
        }

        Schema::table('materiais', function (Blueprint $table) {
            $table->dropConstrainedForeignId('marca_id');
        });

        Schema::dropIfExists('marcas');
    }
};
