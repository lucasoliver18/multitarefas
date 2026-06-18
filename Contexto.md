# MultiTarefas — Contexto do Projeto

## Sobre o projeto
Sistema web PWA mobile-first para gestão de serviços da empresa INFOOSEG Sistemas de Segurança e Informática.
Desenvolvido como estágio obrigatório por Lucas José Gomes Oliveira.

## Stack
- **Backend:** PHP 8.3 + Laravel 13 + MySQL 8.0
- **Frontend:** React 18 + Vite + Tailwind CSS
- **API:** REST com Axios

## Estrutura
- `C:\multitarefas\backend` — Laravel (API REST)
- `C:\multitarefas\frontend` — React (PWA mobile-first)

## Para iniciar
**Backend:** `cd backend && php artisan serve`
**Frontend:** `cd frontend && npm run dev`

## O que já está pronto
- CRUD completo de serviços
- Telas: Home, Prazos, Serviços, Novo Serviço, Editar Serviço
- API REST conectada ao frontend
- Banco de dados MySQL configurado

## O que falta
- Navbar como componente reutilizável
- Prazos conectados ao banco
- Filtros por tag e prioridade
- Mudança de status rápida
- Ajustes visuais finais

## Terminal 1 — Backend (Laravel):
cd C:\multitarefas\backend
php artisan serve

cd backend
php artisan serve --host=0.0.0.0 --port=8000

## Terminal 2 — Frontend (React):
cd C:\multitarefas\frontend
npm run dev

cd frontend
npm run dev -- --host