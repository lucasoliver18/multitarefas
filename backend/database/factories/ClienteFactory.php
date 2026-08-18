<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

class ClienteFactory extends Factory
{
    public function definition(): array
    {
        return [
            'nome'     => $this->faker->name(),
            'telefone' => $this->faker->numerify('(##) 9####-####'),
            'email'    => $this->faker->unique()->safeEmail(),
        ];
    }
}
