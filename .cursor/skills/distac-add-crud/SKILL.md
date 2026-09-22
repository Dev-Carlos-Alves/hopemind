---
name: distac-add-crud
description: >-
  Adds a Distac-style CRUD end-to-end (Prisma model, Nest module, React page,
  pagination, JWT guard). Use when creating a new entity CRUD, module, grid,
  form modal, or extending clientes/produtos/pedidos patterns.
---

# Distac — adicionar CRUD (padrão base)

Siga o espelho de `clientes` / `produtos`. Pedidos (itens) são o caso composto.

## Checklist

```
- [ ] Prisma model + migration (deploy)
- [ ] Nest: module, controller, service, DTOs
- [ ] Sem `@Public()` no CRUD (JWT já é global)
- [ ] Paginação via common/pagination (page/pageSize, máx 100)
- [ ] FE: page + resources.ts + rota ProtectedRoute
- [ ] Modal create/edit; btn-primary compacto (não width 100%)
- [ ] Docs: mapa-entidades + aplicacoes se for domínio novo
```

## Backend

1. Model em `backend/prisma/schema.prisma` → `npx prisma migrate dev` **só** quando criar migration nova com nome claro; em CI/time use `migrate deploy`.
2. Copiar estrutura:

```
backend/src/<recurso>/
  <recurso>.module.ts
  <recurso>.controller.ts
  <recurso>.service.ts
  dto/
```

3. Registrar módulo em `app.module.ts`.
4. Controller: **não** marcar `@Public()`; JWT global cobre. List com `page`/`pageSize`.
5. Options leves (`/options/all`, `take: 100`) se for usado em select.

## Frontend

1. `frontend/src/lib/resources.ts` — API helper com `credentials` via `apiFetch`.
2. Page em `pages/` com toolbar (`btn-ghost` Buscar + `btn-primary` Novo), tabela, `PaginationBar`, Modal.
3. Rota em `App.tsx` dentro de `AppShell`.
4. Item no nav `AppShell.tsx`.
5. Estilos: `crud.css` global — não redefinir `btn-primary { width:100% }` fora do login.

## Regras

- Sem JWT no `localStorage`
- Sem emoji na UI (`Icon`)
- Nomes de tabela de negócio conforme brief
- Triggers/audit: se tabela nova precisa auditoria, atualizar `database/sql/03-triggers.sql` + migration

## Referência

`docs/projeto/DOMINIO-TECNICO.md` · `docs/projeto/ARQUITETURA-WEB.md` · `docs/projeto/padrao-aplicacoes.md`
