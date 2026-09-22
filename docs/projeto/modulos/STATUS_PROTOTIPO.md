# Status da base — Distac (referência Prottus)

**Atualizado:** 2026-07-30  
**Papel:** produto Distac **e** base web reutilizável da Prottus (fusão metodologia oficial + hardening Distac).

## Veredito

| Critério | Status |
|----------|--------|
| Domínio código EN + UI PT | OK |
| Clone / onboarding | OK — `COMO-INICIAR-UM-NOVO-PROJETO.md` + `USAR-COMO-BASE.md` |
| Segurança (JWT global, user ativo, Helmet, throttle, audit) | OK |
| Escalabilidade (paginação, summary) | OK |
| Fluxo documentado | OK — `FLUXO-APLICACAO.md` |
| Testes smoke + stress | OK — `tests/load` · `backend/stress` |
| Homolog/prod / CI | A definir **por cliente** |

## Camadas

| Camada | Status |
|--------|--------|
| Docs Prottus | Intactos (não editar) |
| Docs projeto | Completos (EN domain) |
| Frontend | OK — Hub, Clients, Products, Orders, Users |
| Backend | OK — users/clients/products/orders + dashboard + health |
| Banco | OK — migration limpa EN + triggers + `audit_log` |
| Cursor | OK — rules + skills |

## Rotas UI → API

| UI | API |
|----|-----|
| `/login` | `/api/auth/*` |
| `/` | `/api/dashboard/summary` |
| `/clientes` | `/api/clients` |
| `/produtos` | `/api/products` |
| `/pedidos` | `/api/orders` |
| `/usuarios` | `/api/users` |

## Como subir

```bash
npm run install:all && npm run setup
npm run dev:api   # :3000/api
npm run dev:web   # :5173
```

Se o banco local ainda for o schema português antigo, **recrie o database** antes do `setup`.
