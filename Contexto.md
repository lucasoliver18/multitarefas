# MultiTarefas — Contexto do Projeto

## Sobre o projeto
Sistema web de gestão de serviços da empresa INFOOSEG Sistemas de Segurança e
Informática, usado no computador (desktop), pelo navegador.
Desenvolvido como estágio obrigatório por Lucas José Gomes Oliveira.

## Stack
- **Backend:** PHP 8.3 + Laravel 13 + MySQL 8.0 (API REST, autenticação com Sanctum)
- **Frontend:** React 19 + Vite + Tailwind CSS 4
- **API:** REST com Axios

## Estrutura
- `backend/` — Laravel (API REST)
- `frontend/` — React (interface web para desktop)
- `index.html` e `assets/` — página de apresentação do projeto

## Para iniciar
**Backend:** `cd backend && php artisan serve` (http://localhost:8000)
**Frontend:** `cd frontend && npm run dev` (http://localhost:5173)

Instalação completa, configuração do `.env` e testes: ver `README.md` na raiz.

## O que está pronto
- Início: pendências, financeiro, agenda da semana, previsão de estoque e desempenho
- Prazos: calendário mensal, serviços do dia, vencidos e sem prazo
- Serviços: quadro, lista e detalhado, filtros, prazo editável, exclusão em massa
- Orçamentos: materiais, margem em % ou R$, aprovação e reprovação com controle de estoque
- Materiais: estoque, estoque mínimo, marcas, tags e unidades
- Clientes: pessoa física e jurídica, CPF/CNPJ validados, transferência de serviços
- Anotações por serviço
- Testes automatizados no backend e no frontend
