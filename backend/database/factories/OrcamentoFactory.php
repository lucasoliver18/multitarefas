<?php

namespace Database\Factories;

use App\Models\Servico;
use Illuminate\Database\Eloquent\Factories\Factory;

class OrcamentoFactory extends Factory
{
    public function definition(): array
    {
        return [
            'servico_id'  => Servico::factory(),
            'titulo'      => $this->faker->sentence(3, true),
            'descricao'   => $this->faker->optional()->sentence(),
            'margem_lucro'=> $this->faker->randomFloat(2, 0, 50),
            'status'      => 'pendente',
        ];
    }
}
