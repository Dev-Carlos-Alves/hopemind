# Fluxo da aplicação — Distac

Guia reutilizável do boot até os módulos do domínio em inglês.

## Visão geral

```text
frontend/ React + Vite :5173
  → fetch com cookies httpOnly
backend/ NestJS :3000/api
  → Prisma
PostgreSQL: users, clients, products, orders, order_items, audit_log
```

## Inicialização

Na raiz, `npm run install:all` instala os pacotes e `npm run setup` prepara banco, migrations e verificações. `npm run dev:api` inicia a API e `npm run dev:web` inicia a SPA.

O bootstrap Nest aplica Helmet, `cookieParser`, CORS com credentials, `ValidationPipe`, o prefixo `/api` e Swagger em `/api/docs`. `AppModule` registra throttling e o `JwtAuthGuard` como `APP_GUARD`.

## Sessão

1. A SPA inicia `AuthContext` e chama `GET /api/auth/me`.
2. Login chama `POST /api/auth/login`; a resposta grava `access_token` e `refresh_token` em cookies httpOnly.
3. O guard global extrai o access token do cookie; cada novo endpoint só é público se declarar `@Public()`.
4. Em 401, o cliente chama `POST /api/auth/refresh` uma vez e repete a solicitação original.

## Hub e CRUDs

`AppShell` concentra navegação e a página `HubPage` apresenta os módulos. `FilterBar`, `DataTable`, `Modal` e `StatusToggle` são a base visual das páginas CRUD.

| Módulo | UI | API |
|---|---|---|
| Clientes | `/clientes` | `/api/clients` |
| Produtos | `/produtos` | `/api/products` |
| Pedidos | `/pedidos` | `/api/orders` |
| Usuários | `/usuarios` | `/api/users` |
| Dashboard | Hub | `/api/dashboard/summary` |

Listagens são paginadas. Clients, products e users são desativados logicamente; `DELETE /api/orders/:id` cancela o pedido.

## Pedido e banco

Ao criar ou atualizar um pedido, a API valida client/produtos ativos e grava os itens. Triggers `fn_order_item_before` e `fn_order_recalc_total` calculam `line_total` e `orders.total`; o service relê a resposta. As triggers de auditoria também alimentam `audit_log` sem `password_hash`.

## Modelo reutilizável

Ao clonar a base, mantenha a ordem boot → sessão → shell → módulos, o prefixo `/api`, pagination, Swagger, Helmet, JWT global, triggers/audit e o harness de stress. Troque os módulos, entidades, campos, rotas de UI e documentação de domínio.
