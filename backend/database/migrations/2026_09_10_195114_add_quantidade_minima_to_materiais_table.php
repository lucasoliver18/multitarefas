<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('materiais', function (Blueprint $table) {
            $table->decimal('quantidade_minima', 10, 3)->nullable()->after('quantidade_estoque');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('materiais', function (Blueprint $table) {
            $table->dropColumn('quantidade_minima');
        });
    }
};
