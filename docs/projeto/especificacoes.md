# Especificações técnicas — Distac

Documento do **produto Distac** e da **base web Prottus** deste repositório.

Metodologia / qualidade universais: [`docs/prottus/metodologia.md`](../prottus/metodologia.md) — **não** misturar decisões de stack lá.  
Segurança: [`seguranca.md`](seguranca.md) · Escalabilidade: [`escalabilidade.md`](escalabilidade.md) · Arquitetura: [`ARQUITETURA-WEB.md`](ARQUITETURA-WEB.md).

---

## 1. Arquitetura

| Decisão | Valor |
|---------|-------|
| Estilo | **Modular Monolith** + SPA (padrão MVP/Startup — Wildnet) |
| Repositório | Mono-repo |
| Containers | **Não** — Postgres e app locais (sem Docker neste padrão) |
| Papel do repo | Produto Distac **e** referência inicial para outros clientes Prottus |

---

## 2. Stack (confirmada)

| Camada | Tecnologia |
|--------|------------|
| Frontend | React · Vite · TypeScript |
| Backend / API | NestJS · TypeScript |
| Banco | PostgreSQL |
| ORM | Prisma |
| Validação API | class-validator + ValidationPipe |
| HTTP client FE | `fetch` com `credentials: 'include'` |
| Auth | JWT access + refresh em cookie **httpOnly** |
| UI | CSS variables (`distac-tokens.css`) |
| Filas / cache | Nenhum no escopo atual — ver [`escalabilidade.md`](escalabilidade.md) |

| # | Tecnologia | Papel |
|---|------------|--------|
| 1 | TypeScript | FE e BE |
| 2 | React + Vite | SPA |
| 3 | NestJS | API REST modular |
| 4 | Prisma | Schema, migrations, client tipado |
| 5 | PostgreSQL | Persistência + triggers |
| 6 | JWT httpOnly | Sessão |
| 7 | Helmet + Throttler | Hardening HTTP |

Equivalência de telas com o catálogo Prottus: [`padrao-aplicacoes.md`](padrao-aplicacoes.md).

---

## 3. Infra e ambientes

| Item | Valor |
|------|-------|
| Local | Postgres `127.0.0.1:5432` + API `:3000` + UI `:5173` |
| Homolog / prod | A definir por cliente (TLS obrigatório em produção) |
| CI/CD | A definir por cliente (modelo local não exige pipeline; ver roadmap em `ARQUITETURA-WEB.md`) |
| Docs operacionais do banco | [`database/`](../../database/) |

### PostgreSQL (local Distac)

| Item | Valor |
|------|-------|
| Host | `127.0.0.1` |
| Porta | `5432` |
| Usuário / senha | `postgree` / `postgree` (somente desenvolvimento) |
| Database | `distac` |
| Triggers / audit | `database/sql/03-triggers.sql` |

---

## 4. Autenticação e integrações

| Item | Valor |
|------|-------|
| Auth | JWT em cookies httpOnly (`access_token`, `refresh_token`) |
| Usuário | Tabela `user` (plataforma) — fora das 4 tabelas de negócio |
| Integrações externas | Nenhuma no escopo |

Detalhes e riscos: [`seguranca.md`](seguranca.md).

---

## 5. Convenções deste repo

| Área | Convenção |
|------|-----------|
| Pastas | `frontend/`, `backend/`, `database/`, `tests/`, `docs/`, `imagens/` |
| Env (nomes) | `DATABASE_URL`, `JWT_*`, `PORT`, `CORS_ORIGIN`, `NODE_ENV`, `SEED_DEMO_USER_ON_BOOT`; FE opcional `VITE_API_URL` |
| Auth na API | `JwtAuthGuard` **global**; rotas públicas só com `@Public()` |
| `orders.total` | Fonte da verdade = trigger Postgres; API não grava o campo |
| Tabelas de negócio | `clients`, `products`, `orders`, `order_items` (+ `users`, `audit_log`) |
| Plataforma | `user`, `audit_log` |
| Secrets | Nunca no git |
| UI | Sem emojis; `Icon` component |

---

## 6. Restrições de domínio

- Negócio: apenas as quatro tabelas do brief (+ auth/audit de plataforma).
- Sem exposição de hash de senha em auditoria.
- Metodologia Prottus em `docs/prottus/` permanece intacta.
