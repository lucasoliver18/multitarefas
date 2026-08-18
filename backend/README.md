# MultiTarefas — Backend

API REST em Laravel 13 (PHP 8.3) para o sistema de gestão de serviços da
INFOOSEG Sistemas de Segurança e Informática.

## Stack

- PHP 8.3 + Laravel 13
- MySQL 8.0
- Autenticação de idioma: `pt_BR` (locale padrão da aplicação)

## Como iniciar

```bash
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate
php artisan serve
```

## Testes

```bash
php artisan test
```
