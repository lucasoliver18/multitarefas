# MultiTarefas

Sistema web de gestão de serviços desenvolvido para a **INFOOSEG Sistemas de
Segurança e Informática**, como projeto do estágio obrigatório de Engenharia
de Software (UniFil) de Lucas José Gomes Oliveira.

Substitui as anotações em bloco de notas e os combinados por WhatsApp por um
sistema único, usado **no computador (desktop), pelo navegador**, que organiza
serviços, prazos, orçamentos, estoque de materiais e clientes.

## Funcionalidades

| Módulo | O que faz |
|---|---|
| **Início** | Painel com pendências (atrasados, finalizados não pagos, orçamentos pendentes, estoque zerado ou baixo), financeiro, agenda da semana, previsão de estoque e desempenho por período |
| **Prazos** | Calendário mensal dos prazos, serviços do dia, prazos vencidos e serviços sem prazo |
| **Serviços** | Visualizações em Quadro (arrastar entre status), Lista e Detalhado; filtros combináveis e lembrados; prazo editável direto na listagem; exclusão em massa |
| **Orçamentos** | Materiais do serviço com preço guardado no momento, margem em % ou em R$, aprovação e reprovação com controle de estoque |
| **Materiais** | Estoque com ajuste rápido, estoque mínimo, marcas, tags e unidades de medida |
| **Clientes** | Pessoa física ou jurídica, CPF e CNPJ (inclusive alfanumérico) validados, transferência de serviços antes de excluir |
| **Anotações** | Histórico de anotações por serviço |

## Regras de negócio principais

- O status do serviço só avança (Pendente → Em andamento → Finalizado), nunca volta.
- O tipo de pessoa do cliente (física ou jurídica) não muda depois do cadastro.
- Cada serviço tem no máximo um orçamento aprovado: aprovar um reprova os demais.
- Só um orçamento **aprovado** desconta materiais do estoque. Reprovar ou excluir devolve. Editar um aprovado ajusta só a diferença. Ao excluir um serviço com orçamento aprovado, o usuário escolhe se o estoque volta.
- O orçamento guarda o preço de cada material no momento em que foi feito, e excluir o material depois não altera o total.
- Um orçamento só aceita materiais da mesma tag do serviço (serviço sem tag aceita qualquer material).
- Exclusões são lógicas (soft delete): os registros saem das telas, mas o histórico fica no banco.
- Todas as regras são validadas no servidor. A tela também valida antes de enviar, para o usuário ver o erro na hora.

## Arquitetura

```
Navegador (desktop)
  └─ frontend/  React 19 + Vite (SPA)
        │  HTTP/JSON (Axios), token de acesso (Laravel Sanctum)
        ▼
     backend/   API REST em Laravel 13
        │  Rotas → Form Requests (validação) → Controllers
        │       → Services (regras com estado, ex.: estoque) → Models (Eloquent)
        │       → API Resources (formato das respostas)
        ▼
     MySQL 8
```

- **backend/** — API REST. Detalhes em [backend/README.md](backend/README.md).
- **frontend/** — interface web. Detalhes em [frontend/README.md](frontend/README.md).
- **index.html** e **assets/** — página de apresentação do projeto (GitHub Pages).

## Como rodar

Requisitos: PHP 8.3, Composer, MySQL 8 e Node.js 22 LTS (ou 20.19 ou superior).

```bash
# 1) Backend (API em http://localhost:8000)
cd backend
composer install
cp .env.example .env          # configure DB_* (MySQL) e ADMIN_* (usuário de acesso)
php artisan key:generate
php artisan migrate
php artisan db:seed           # cria o usuário definido em ADMIN_EMAIL/ADMIN_PASSWORD
php artisan serve

# 2) Frontend (em outro terminal, abre em http://localhost:5173)
cd frontend
npm install
cp .env.example .env          # VITE_API_URL, se a API não estiver em localhost:8000
npm run dev
```

Acesse `http://localhost:5173` no navegador do computador e entre com o
e-mail e a senha definidos em `ADMIN_EMAIL` e `ADMIN_PASSWORD`.

## Testes

```bash
cd backend  && php artisan test                  # API: regras, validações, estoque, desempenho
cd frontend && npm run test && npm run lint      # telas, fluxos e componentes
```

Os testes do backend usam um banco SQLite em memória, então não precisam do
MySQL. Em novembro de 2026 eram 118 testes no backend e 158 no frontend.
