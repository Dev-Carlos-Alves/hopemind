# Padrão de aplicações — Distac

Métricas de construção **deste projeto**. Toda nova tela deve seguir este arquivo + o catálogo [`docs/prottus/aplicacoes/`](../prottus/aplicacoes/) (equivalência web).

Marca (hex/logo): [`design-system.md`](design-system.md).  
Stack: [`especificacoes.md`](especificacoes.md).

---

## 1. Plataforma

| Item | Valor |
|------|-------|
| Plataforma | Web custom (React + NestJS) — não Scriptcase |
| Versão Scriptcase | não se aplica |
| Nome do projeto SC | não se aplica |
| Conexão padrão (BD) | PostgreSQL via `DATABASE_URL` |
| App de segurança / login | Tela `/login` + API auth JWT (cookies httpOnly) |
| App inicial pós-login | Shell com menu → Hub (`/`) com summary |
| Menu | Shell vertical: Início, Clientes, Produtos, Pedidos, Usuários |

---

## 2. Tema visual

| Item | Valor |
|------|-------|
| Nome do tema Scriptcase | não se aplica |
| Espelha tokens de | `docs/projeto/design-system.md` |
| Primária (confirmação) | `#C02028` |
| Secundária | `#60A0D8` |
| Header fundo / texto | `#FFFFFF` / `#000000` |
| Tipografia (família) | Source Sans 3 (padrão Prottus / sans moderna) |
| Densidade | padrão |
| Logo | `imagens/distac.png` |

---

## 3. Defaults de construção

| Família (catálogo Prottus) | Equivalente web neste projeto |
|----------------------------|-------------------------------|
| Formulário | Página/form único registro; edição via modal a partir da listagem |
| Consulta / relatório | Tabela horizontal; busca rápida; action bar ícone+texto |
| Gráfico | Fora do escopo inicial |
| Dashboard | Hub `/` com `GET /api/dashboard/summary` (counts + recentes) |
| Menu | Shell vertical: Início, Clientes, Produtos, Pedidos, Usuários |
| Calendário | Fora do escopo inicial |
| Blank / programação | Só com justificativa |
| i18n | pt-BR; outros: nenhum |

`pedido_item`: detalhe mestre-detalhe dentro do formulário/tela de `pedido`.

---

## 4. Padrões de grid / tabela

| Item | Valor |
|------|-------|
| Orientação default | Horizontal |
| Quicksearch | Sim |
| Paginação (tamanho) | 20 |
| Scroll infinito | Não |
| Header de tabela | `--table-header-bg` (`#60A0D8`) |
| Filter bar | `--filter-bar-bg` |
| Ordenação default | `orders.ordered_at` desc; `clients.name` / `products.name` asc |
| Componentes de grid | `FilterBar` + `DataTable` + `PaginationBar` (pageSize 20) |
| API | Inglês (`/api/clients`…); rotas UI em português (`/clientes`…) |

### Exports liberados no projeto

| Formato | Consulta | Resumo | Gráfico |
|---------|----------|--------|---------|
| PDF | Sim | Não | — |
| Excel | Sim | Não | — |
| JSON | Não | Não | — |
| XML | Não | Não | — |
| E-mail da exportação | Não | Não | — |

---

## 5. Nomenclatura de aplicações

Manter prefixos Prottus como **identificadores de spec/tela** (mesmo em React):

| Prefixo | Uso |
|---------|-----|
| `frm_` | Formulários |
| `grid_` | Consultas / listagens |
| `menu_` | Menus / shell |
| `blank_` | Telas especiais (ex.: login se documentado assim) |

Exemplos: `grid_cliente`, `frm_pedido`, `menu_main`.  
Rotas React: `/login`, `/`, `/clientes`, `/produtos`, `/pedidos`, `/usuarios`.  
API: `/api/clients`, `/api/products`, `/api/orders`, `/api/users`.

---

## 6. Exceções

1. Desvio pontual: documentar em `docs/projeto/aplicacoes/NN-*.md`.
2. Mudança de default global: atualizar este arquivo + agent.
3. Não alterar `docs/prottus/aplicacoes/`.
