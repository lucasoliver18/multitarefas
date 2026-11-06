# MultiTarefas — Backend

API REST em Laravel 13 (PHP 8.3) do MultiTarefas, o sistema web de gestão de
serviços da INFOOSEG Sistemas de Segurança e Informática. É consumida pelo
frontend em React (pasta `frontend/`).

## Stack

- PHP 8.3 + Laravel 13
- MySQL 8.0 (os testes usam SQLite em memória)
- Laravel Sanctum (autenticação por token)
- Idioma padrão `pt_BR`: mensagens de validação em português (`lang/pt_BR`)

## Como iniciar

```bash
composer install
cp .env.example .env
php artisan key:generate
```

No `.env`, configure:

- **Banco:** `DB_CONNECTION=mysql`, `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD`
- **Usuário de acesso:** `ADMIN_NAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`

Depois:

```bash
php artisan migrate
php artisan db:seed     # cria (ou atualiza) o único usuário, a partir de ADMIN_*
php artisan serve       # http://localhost:8000
```

## Organização

| Pasta | Responsabilidade |
|---|---|
| `routes/api.php` | Rotas da API. Todas exigem login, exceto `auth/login`, que tem limite de tentativas |
| `app/Http/Requests` | Validação de cada requisição: regras de campo, limites e regras de negócio (ex.: status não retrocede) |
| `app/Http/Controllers` | Recebem a requisição validada, coordenam a operação e devolvem a resposta |
| `app/Services/EstoqueOrcamento.php` | **Único ponto que movimenta estoque** por causa de orçamentos (aprovar, reprovar, excluir, editar aprovado, excluir serviço) |
| `app/Http/Resources` | Formato das respostas JSON |
| `app/Models` | Modelos Eloquent, todos com soft delete |
| `app/Rules` | Validação de CPF e de CNPJ (inclusive alfanumérico) |
| `app/Support/LimitesBanco.php` | Limites centralizados: tamanho de texto, valores máximos, datas, tags e unidades |
| `bootstrap/app.php` | Tratamento de erros: a API nunca expõe detalhes internos, só mensagens para o usuário |

## Principais rotas

| Recurso | Rotas |
|---|---|
| Autenticação | `POST auth/login`, `GET auth/me`, `POST auth/logout` |
| Painel inicial | `GET dashboard?periodo=7d\|1m\|6m` |
| Serviços | CRUD em `servicos` (filtros `cliente_id`, `status`, `prazo_de`, `prazo_ate`); `DELETE servicos/{id}?devolver_estoque=1` |
| Orçamentos | CRUD em `orcamentos`, `PATCH orcamentos/{id}/aprovar`, `PATCH orcamentos/{id}/reprovar`, `GET servicos/{id}/orcamentos` |
| Materiais e marcas | CRUD em `materiais` (busca, tag, paginação); `marcas` (listar, cadastrar, excluir) |
| Clientes | CRUD em `clientes` (busca, paginação); `PATCH clientes/{id}/transferir-servicos` |
| Anotações | `GET`/`POST servicos/{id}/anotacoes`, `DELETE anotacoes/{id}` |

## Testes

```bash
php artisan test
```

Os testes cobrem as regras de negócio, as validações e as mensagens de erro, o
estoque em todos os fluxos de orçamento e serviço, e um teste de desempenho. Esse
último garante que as listagens fazem o mesmo número de consultas ao banco com
poucos ou muitos registros.
