<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

class MaterialFactory extends Factory
{
    public function definition(): array
    {
        return [
            'nome'               => $this->faker->unique()->words(2, true),
            'descricao'          => $this->faker->optional()->sentence(),
            'unidade_medida'     => $this->faker->randomElement(['un', 'kg', 'L', 'm', 'cx']),
            'preco_unitario'     => $this->faker->randomFloat(2, 1, 500),
            'quantidade_estoque' => $this->faker->randomFloat(3, 0, 100),
        ];
    }
}
