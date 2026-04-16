<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('servicos', function (Blueprint $table) {
            $table->id();
            $table->string('titulo');
            $table->text('descricao')->nullable();
            $table->string('cliente');
            $table->enum('prioridade', ['alta', 'media', 'baixa'])->default('media');
            $table->enum('status', ['pendente', 'em_andamento', 'finalizado'])->default('pendente');
            $table->date('prazo')->nullable();
            $table->string('tag')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('servicos');
    }
};