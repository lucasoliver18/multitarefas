# MultiTarefas — Frontend

Interface web (SPA) em React do MultiTarefas, o sistema de gestão de serviços
da INFOOSEG Sistemas de Segurança e Informática. É usada **no computador
(desktop), pelo navegador**, e consome a API REST do backend (pasta `backend/`).

## Stack

- React 19 + Vite 8
- Tailwind CSS 4
- React Router 7 (telas carregadas sob demanda)
- Axios (consumo da API, com token de acesso)
- Lucide React (ícones) e dnd-kit (arrastar cartões no quadro de serviços)
- Vitest + Testing Library (testes) e ESLint

## Como iniciar

```bash
npm install
cp .env.example .env    # VITE_API_URL, se a API não estiver em http://localhost:8000/api
npm run dev             # http://localhost:5173
```

## Organização

| Pasta | Conteúdo |
|---|---|
| `src/pages` | Telas: Início, Prazos, Serviços, Orçamentos, Materiais, Clientes, Anotações e formulários |
| `src/components` | Componentes reutilizados: menu lateral, modal, avisos, lista de seleção, campo de data e calendário, campo de texto com limite, painel de filtros, paginação |
| `src/components/servicos` | Peças das listagens de serviço (quadro, lista, detalhado), filtros e modais |
| `src/hooks` | Dados e comportamento: serviços, clientes, materiais, filtros lembrados, paginação, ações rápidas |
| `src/utils` | Funções puras: máscaras e validação de CPF/CNPJ, datas, status, valores de orçamento, textos |
| `src/services/api.js` | Cliente HTTP: token, leitura sem cache e saída automática quando a sessão expira |
| `src/test` | Testes de telas, fluxos, componentes e funções |

## Padrões da interface

- **Avisos:** curtos e sem ponto final. Erros do servidor aparecem como mensagens para o usuário, nunca com detalhes técnicos.
- **Validação:** o que dá para conferir na tela (campos obrigatórios, CPF/CNPJ, datas, limites) é conferido antes de enviar.
- **Campos:** obrigatórios marcados com asterisco vermelho. Textos livres limitados a 500 caracteres, com contador.
- **Filtros:** aceitam várias opções, ficam lembrados entre navegações e podem vir aplicados por links (ex.: "Ver todos os prazos vencidos").

## Testes e build

```bash
npm run test
npm run lint
npm run build
```
