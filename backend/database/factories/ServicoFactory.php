<?php

namespace Database\Factories;

use App\Models\Cliente;
use Illuminate\Database\Eloquent\Factories\Factory;

class ServicoFactory extends Factory
{
    public function definition(): array
    {
        $cliente = Cliente::factory()->create();

        return [
            'titulo'    => $this->faker->sentence(4, true),
            'descricao' => $this->faker->optional()->paragraph(),
            'cliente'   => $cliente->nome,
            'cliente_id'=> $cliente->id,
            'prioridade'=> $this->faker->randomElement(['alta', 'media', 'baixa']),
            'status'    => $this->faker->randomElement(['pendente', 'em_andamento', 'finalizado']),
            'prazo'     => $this->faker->optional()->dateTimeBetween('now', '+3 months')?->format('Y-m-d'),
            'tag'       => $this->faker->optional()->randomElement(['informatica', 'pintura', 'outros']),
        ];
    }
}
