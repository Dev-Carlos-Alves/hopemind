# Domínio técnico — Distac (base Prottus)

**Audiência:** tech leads e desenvolvedores sênior que precisam **dominar** este repositório — não só “saber onde clicar”.  
**Objetivo:** chegar em reunião técnica (ou dirigir um projeto novo a partir desta base) e explicar **o que está no código**, **como funciona por dentro**, **por que** está assim, **o que já deu errado** e **o impacto** para a Prottus e para o cliente.

Este arquivo é o **handbook canônico** do modelo. Domínio de código atual: **inglês** (`clients` / `orders`…); UI em português. Docs irmãos trazem detalhe operacional; aqui está a narrativa completa de domínio técnico.

| Tema | Arquivo |
|------|---------|
| Decisão de padrão arquitetural (Modular Monolith) | [`ARQUITETURA-WEB.md`](ARQUITETURA-WEB.md) |
| Fluxo boot → CRUD (modelo) | [`FLUXO-APLICACAO.md`](FLUXO-APLICACAO.md) |
| Specs / stack confirmada | [`especificacoes.md`](especificacoes.md) |
| Segurança (checklist operacional) | [`seguranca.md`](seguranca.md) |
| Escalabilidade (quando evoluir) | [`escalabilidade.md`](escalabilidade.md) |
| Domínio de negócio / campos | [`mapa-entidades.md`](mapa-entidades.md) |
| Banco (ops) | [`../../database/README.md`](../../database/README.md) |
| Triggers (SQL detalhado) | [`../../database/info/triggers.md`](../../database/info/triggers.md) |
| Testes de carga | [`../../tests/README.md`](../../tests/README.md) |
| Reuso do repo | [`USAR-COMO-BASE.md`](USAR-COMO-BASE.md) |
| Índice de exports | [`../../backend/FUNCTIONS.md`](../../backend/FUNCTIONS.md) · [`../../frontend/FUNCTIONS.md`](../../frontend/FUNCTIONS.md) |
| Skills / rules Cursor | [`../../.cursor/README.md`](../../.cursor/README.md) |

Metodologia empresa (**não editar**): [`../prottus/metodologia.md`](../prottus/metodologia.md).

---

## 1. Como usar este documento

| Situação | O que ler |
|----------|-----------|
| Onboarding de tech lead (1º dia) | §2 → §3 → §4 → §9 |
| Antes de reunião / sabatina de arquitetura | §2 + §3 + §5 + §6 + §7 + §8 + §13 |
| Incidente de auth / 401 / cookie | §5 + `seguranca.md` |
| “Por que não usamos X?” | §3 (cada item) + §8 |
| Entender pedido ponta a ponta | §6 |
| Mapa de execução (arquivo a arquivo) | [`FLUXO-APLICACAO.md`](FLUXO-APLICACAO.md) |
| O que já quebrou neste repo | §7 |
| Novo cliente a partir desta base | [`USAR-COMO-BASE.md`](USAR-COMO-BASE.md) + §12 + atualizar `FLUXO-APLICACAO.md` |

**Regra Prottus:** se está no código ou no `.env`, alguém do time precisa saber explicar. Este doc é o mapa.

---

## 2. O que este projeto é, de fato

Duas coisas ao mesmo tempo — e isso muda qualquer resposta de arquitetura:

1. **Um produto:** sistema de vendas internas para a Distac (distribuidora de materiais de construção em Pernambuco) — clientes (lojas), catálogo de produtos, pedidos com itens.
2. **Um modelo de desenvolvimento:** a Prottus usa este repositório como ponto de partida (“clonar e trocar o domínio”) para outros clientes. Toda decisão aqui carrega peso duplo: não é só “resolve a Distac”, é “vira prática obrigatória no próximo cliente”.

Isso explica escolhas que, isoladas, pareceriam over-engineering para um CRUD de quatro entidades (triggers de auditoria, ConfigModule validando `.env` no boot, Swagger, rate limit granular, JwtAuthGuard global): elas não existem pelo tamanho da Distac — existem para **não reinventar** segurança, integridade e padronização em cada projeto novo.

**Pergunta típica de sabatina:** *“Por que um sistema tão simples tem tanta infraestrutura?”*  
**Resposta:** porque não é o tamanho do domínio que dita o padrão — é o fato de ser o **molde**. Pagar o custo uma vez no modelo é mais barato do que pagar em todo cliente.

Visão em uma página:

```
┌─────────────────┐     cookies httpOnly      ┌──────────────────────┐
│  SPA React      │  ←──────────────────────→ │  API NestJS          │
│  Vite :5173     │   credentials: include    │  :3000 /api          │
│  React Router   │                           │  Helmet · Throttler  │
│  AuthContext    │                           │  JWT · ValidationPipe│
└─────────────────┘                           └──────────┬───────────┘
                                                         │ Prisma
                                                         ▼
                                              ┌──────────────────────┐
                                              │  PostgreSQL :5432    │
                                              │  DB distac           │
                                              │  triggers + audit_log│
                                              └──────────────────────┘
```

| Camada | Porta | Pasta |
|--------|-------|--------|
| UI | `5173` | `frontend/` |
| API | `3000` (`/api`) | `backend/` |
| Banco | `5432` | Postgres local + `database/` + `backend/prisma/` |

**Estilo:** Modular Monolith + SPA (mono-repo). Sem Docker neste padrão. Detalhe da decisão: [`ARQUITETURA-WEB.md`](ARQUITETURA-WEB.md).

---

## 3. Arquitetura em camadas — o que está onde e por quê

```
┌───────────────────────────────────────────────┐
│ PRESENTATION — frontend/src (React SPA)       │
│ Sem regra de negócio crítica; UX + chamadas   │
└──────────────────┬──────────────────────────────┘
                   │ HTTPS + cookies httpOnly
┌──────────────────▼──────────────────────────────┐
│ BUSINESS — backend/src (NestJS)                 │
│ Controller (fino) → Service (regra) → Prisma    │
└──────────────────┬──────────────────────────────┘
                   │ Prisma Client
┌──────────────────▼──────────────────────────────┐
│ DATA — PostgreSQL + schema Prisma + triggers    │
│ Integridade e auditoria reforçadas no banco     │
└───────────────────────────────────────────────┘
```

**Regra que atravessa as três camadas:** o browser **nunca** fala com o banco. Toda escrita passa por `/api`; a API valida para UX (erro rápido, mensagem clara); o Postgres reforça para garantir que nenhuma escrita — SQL direto, bug futuro, outra ferramenta — corrompa o dado. Isso é **defesa em profundidade**.

### Por que não microserviços

Time pequeno, domínio coeso (quatro entidades relacionadas). Separar agora paga rede, deploy e observabilidade distribuída sem ganho: nenhuma parte tem ciclo de deploy ou time independente. A dor que justificaria extrair serviço (escala ou time distinto por módulo) **ainda não existe**.

### Por que não Next.js / SSR

App interno, atrás de login, sem SEO nem first-paint para anônimo. SSR adicionaria hidratação/cache de servidor sem resolver problema real do produto.

### Por que não PWA

Uso B2B interno; offline não é requisito. PWA seria complexidade sem demanda.

---

## 4. Catálogo de tecnologias — o que é, como funciona, por que, o que não foi escolhido

### 4.1 TypeScript (frontend e backend)

**O que é:** tipagem estática sobre JavaScript.

**Como funciona aqui:** backend com modo estrito via Nest CLI; frontend com `tsc -b` antes do `vite build`. Tipos de domínio (`Cliente`, `Produto`, `Pedido`) ficam em `frontend/src/lib/types.ts` — **espelham o schema Prisma, mas não são gerados automaticamente**. Não há tRPC nem OpenAPI-codegen neste modelo.

**Por quê:** contratos claros FE↔BE, menos regressão em CRUD, padrão de mercado para times mistos.

**Lead deve saber responder:** *“Se eu adicionar um campo no Prisma, quantos lugares toco no FE?”* — pelo menos `types.ts`, o formulário da página e possivelmente `resources.ts`. Limitação consciente: sem pipeline ponta a ponta de tipos.

### 4.2 React 19 + Vite 8

**O que é:** UI declarativa + bundler/dev server (ESM em dev, Rollup no build).

**Como funciona:** SPA pura. `main.tsx` monta `<App />` em `#root` com `StrictMode` (em dev **dobra efeitos** de propósito — chamadas de API “duplicadas” em dev muitas vezes são StrictMode, não bug). Estado de servidor: `useEffect` + `useState` por página — **sem** React Query, SWR, Zustand ou Redux (proposital neste tamanho).

**Por quê Vite e não CRA:** CRA obsoleto; Vite tem HMR rápido.

**Não escolhido:** Next.js (ver §3); Angular (curva maior para este escopo).

### 4.3 React Router DOM 7

Roteamento em `App.tsx`: `/login` público; resto sob `<ProtectedRoute>` (`Outlet` vs `Navigate` conforme `AuthContext`). Dentro da árvore protegida, `<AppShell>` é layout route (sidebar + topbar + `Outlet` aninhado).

**Lead deve saber:** rotas de negócio ficam **dentro** de `ProtectedRoute` + `AppShell` — nunca “solta” sem guarda.

### 4.4 NestJS 11 (Express)

Framework modular com DI, inspirado em Angular, sobre Express.

**Como funciona neste projeto:**

- Cada domínio (`auth`, `clientes`, `produtos`, `pedidos`, `dashboard`) é um módulo com `Controller` + `Service`. `PrismaModule` é `@Global()`.
- **Dois `APP_GUARD` globais** em `app.module.ts`: `ThrottlerGuard` e `JwtAuthGuard`. Toda rota passa por ambos, salvo `@Public()`.
- **Ordem importa:** Throttler vem antes do JWT — uma requisição pode tomar **429 antes** de a API checar identidade. Relevante em testes de carga.
- `@Public()` = `SetMetadata` lido via `Reflector` (`common/public.decorator.ts`). Públicas hoje: `POST /auth/login|refresh|logout`, `GET /health`.
- `ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true })`: remove campos extras **e rejeita** a request (400) se vier campo não declarado — postura rígida.

**Por quê Nest e não Express cru:** esqueleto previsível para o modelo (`*.controller.ts`, `*.service.ts`, `dto/`) — qualquer dev ou agente Cursor sabe onde plugar código.

**Não escolhido:** Fastify (Express default basta sem evidência de gargalo de I/O).

### 4.5 ConfigModule + Swagger

`validateEnv` em `config/env.validation.ts` falha cedo se `.env` estiver incompleto; secrets JWT fracos (`change-in-prod`) são bloqueados em `production`. Swagger em `/api/docs` — contrato vivo sem ler controllers.

**Impacto Prottus:** todo clone herda o mesmo kit de boot e documentação de API.

### 4.6 PostgreSQL

Instância local (sem Docker), DB `distac`, role `postgree`. Domínio (`cliente`, `produto`, `pedido`, `pedido_item`) + plataforma (`user`, `audit_log`).

**Por quê Postgres:** domínio relacional (FK, unique); triggers e JSONB maduros (usados em `audit_log`).

**Não escolhido:** Mongo (pedido/itens pedem FK); SQLite (não para multi-dev/prod).

### 4.7 Prisma 6 — ORM, migrations e o detalhe que quebra em CI

`schema.prisma` é a fonte do modelo. `migrate deploy` (scripts/CI, não interativo) vs `migrate dev` (local interativo — **evitar em script de equipe**). `prisma generate` gera o Client tipado **e** baixa engine nativo (Rust) de `binaries.prisma.sh` — em rede restrita o client pode “compilar” e falhar em runtime. Quando houver CI, allowlist precisa incluir esse domínio.

**Histórico real de migrations:**

| Migration | O que fez |
|-----------|-----------|
| `20260723135213_init_auth_and_domain` | Schema inicial |
| `20260723181500_triggers_audit_integrity` | `audit_log` + triggers |
| `20260723182933_cadu` | **Incidente:** `DROP DEFAULT` em `audit_log.id` + nome de pessoa |
| `20260723183500_restore_audit_log_id_default` | Correção do default |

Ver §7 e `backend/prisma/migrations/20260723182933_cadu/README.md`.

**Não escolhido:** TypeORM (mais boilerplate); Knex puro (sem client tipado).

### 4.8 JWT + Passport + cookies httpOnly — fluxo completo

Este é o ponto mais comum de sabatina. Narrar o fluxo inteiro.

**Login**

1. FE `POST /auth/login` com `{ email, password }`, `credentials: 'include'`.
2. Rota `@Public()` + `@Throttle(10/min)` — mais apertado que o global (300/min) contra brute force.
3. `validateUser`: busca user, checa `active`, `bcrypt.compare`. Falha → `UnauthorizedException` com mensagem **genérica** (“Credenciais inválidas”) — não vaza se o e-mail existe (user enumeration).
4. Assina **dois** JWTs com secrets **diferentes**: access (~15m, `JWT_ACCESS_SECRET`) e refresh (~7d, `JWT_REFRESH_SECRET`). Secrets distintos: vazamento de um não forja o outro.
5. Controller grava cookies httpOnly; body só `{ user: { id, email, name } }` — FE **nunca** vê o JWT em JS.
6. Cookies: `httpOnly`, `sameSite: 'lax'`, `secure` só em produção (em HTTP local, `secure: true` quebraria o login).

**Chamada autenticada**

1. `apiFetch` sempre com `credentials: 'include'` — o browser anexa cookies sozinho.
2. `ThrottlerGuard` → pode 429.
3. `JwtAuthGuard` → `JwtStrategy` com **extrator de cookie** (`access_token`), não Bearer header.
4. `validate` injeta `{ userId, email }` em `req.user`.

**Refresh silencioso**

Em `frontend/src/lib/api.ts`, qualquer 401 (exceto login/refresh) dispara `POST /auth/refresh` e, se ok, **repete a chamada original uma vez**. Access de 15m expira sem o usuário perceber; só quando o refresh de 7d também falha cai no login. Evita loop infinito ao excluir as rotas de auth do interceptor.

**Por que httpOnly e não localStorage:** XSS que roda na página não lê o cookie; token em `localStorage` seria exfiltrável. XSS ainda pode fazer requests *como* o usuário enquanto a aba está aberta — mas não leva o token embora.

### 4.9 bcrypt

Cost **10** (`2^10` iterações). Em `audit_log`, trigger omite `password_hash` do JSON (`to_jsonb(...) - 'password_hash'`) — nem o hash entra na auditoria.

### 4.10 Helmet

Headers de segurança (`nosniff`, etc.). CSP desligada fora de produção porque o Swagger UI quebra com CSP padrão — trade-off documentado, não esquecimento.

### 4.11 @nestjs/throttler

Global 300/min; login 10/min; refresh 20/min; health `@SkipThrottle`. Store **in-memory**: uma instância ok; N instâncias atrás de LB **multiplicam** o limite efetivo — evoluir para Redis quando houver multi-instância (`escalabilidade.md`).

Em teste **heavy**, muitos **429** são a proteção funcionando, não bug.

### 4.12 class-validator + class-transformer

DTOs declarativos. `transform: true` + `@Type(() => Number)` porque JSON/query às vezes chega como string e `@IsNumber` falharia sem conversão.

### 4.13 cookie-parser + CORS com credentials

Sem `cookie-parser`, a strategy não lê `access_token`. CORS: `origin` = `CORS_ORIGIN` (não `*`) **e** `credentials: true` — combinação obrigatória pela spec; sem isso cookies não fluem entre `:5173` e `:3000`.

### 4.14 Triggers PostgreSQL + `audit_log`

Ponto menos óbvio para quem só conhece stack JS. Detalhe SQL: [`../../database/info/triggers.md`](../../database/info/triggers.md).

| Trigger / função | Papel |
|------------------|--------|
| `fn_audit_row` + AFTER em tabelas de domínio/`user` | Grava `audit_log` (antes/depois JSON); omite `password_hash`; `SECURITY DEFINER` |
| `fn_pedido_item_before` (BEFORE item) | Bloqueia pedido inexistente/cancelado; qty/preço inválidos; **recalcula `subtotal`** (API não é dona desse número) |
| `fn_pedido_recalc_total` (AFTER item) | **Única fonte de verdade de `pedido.total`** — API não escreve mais esse campo |

Há hook preparado `current_setting('app.user_id')` para usuário da aplicação no audit — hoje a API **não seta**; é extensão futura, não feature ativa.

**Por que no banco:** escrita fora da API (script, BI, correção manual) ainda respeita a regra.

**Trade-off:** lógica em TypeScript **e** PL/pgSQL — quem muda “cancelado não edita” precisa lembrar dos dois lados. Aceitável porque o núcleo de integridade é pequeno e estável.

### 4.15 Testes

| Tipo | Onde | O que cobre |
|------|------|-------------|
| Carga Node | `tests/load/run-node.mjs` (`smoke`/`normal`/`heavy`) | Baseline + rate limit; k6 opcional |
| Unitário Jest | `*.service.spec.ts` (clientes, produtos, pedidos) | Regras de erro dos services com Prisma mockado |
| E2E | Quase só `/health` | Fronteira HTTP ainda fraca |

**Honestidade:** cobre a lógica de negócio mais arriscada dos services; **não** cobre controllers, e2e de CRUD nem frontend. É ponto de evolução, não “está completo”.

### 4.16 Sem Docker — decisão, não lacuna

Postgres instalado na máquina; scripts em `database/scripts/`. Onboarding previsível em vibe coding com Cursor; custo admitido: “funciona na minha máquina” — documentar versão mínima de Postgres entre devs.

### 4.17 Linters

ESLint + Prettier no backend; Oxlint no frontend. Índice de exports e JSDoc: regra em `.cursor/rules/prottus/padroes.mdc` + `FUNCTIONS.md`.

---

## 5. Modelo de segurança — o que protege e o que não protege

### Protege

- Token inacessível via JS (httpOnly) → mitiga roubo por XSS.
- Senha nunca em claro nem em audit (bcrypt + omissão).
- Rate limit apertado no login → dificulta brute force.
- ValidationPipe rígido → reduz superfície de payload.
- JWT **global** (Zero Trust na borda) → endpoint novo esquecido **não** fica público por acidente.
- Auditoria no banco → bypass na API ainda deixa rastro.
- Env validado no boot; secrets fracos barrados em production.
- Seed demo **só** com `SEED_DEMO_USER_ON_BOOT=true` (default `false`).

### Não protege (limitações conscientes — saber apontar sem esconder)

| Limitação | Detalhe | Próximo passo natural |
|-----------|---------|------------------------|
| Sem denylist de refresh | Token vazado vale até expirar (~7d) | Tabela de sessões / revogação |
| CSRF só SameSite=lax + CORS | Não é token CSRF dedicado | CSRF token se o risco subir |
| Sem RBAC | Autenticado = acesso a todo o domínio | Roles quando houver 2º perfil real |
| Seed demo | Credencial conhecida se flag ligada | Manter `false` em clones/prod |

Checklist operacional: [`seguranca.md`](seguranca.md).

---

## 6. Ciclo de vida completo de um pedido (do clique ao trigger)

Caso de uso mais complexo — o lead deve narrar do início ao fim.

1. **UI (`PedidosPage`):** modal Novo pedido; cliente via `clientesApi.options()` (lista enxuta); produtos via `produtosApi.options()`. `useMemo` mostra **total estimado no cliente** — só feedback visual; **nunca** é a verdade enviada ao backend.
2. **Submit:** `{ clienteId, status?, observacao?, itens: [{ produtoId, quantidade, precoUnitario? }] }` → `POST /pedidos`.
3. **Borda:** Throttler → JwtAuthGuard → ValidationPipe (`CreatePedidoDto`, `@ArrayMinSize(1)`, nested items).
4. **`PedidosService.create`:**
   - Cliente existe e `ativo`.
   - `buildItens`: `findMany` dos produtos ativos; se count ≠ IDs únicos → produto inválido/inativo; calcula `subtotal` (preço explícito ou preço do produto).
   - `pedido.create` **sem** campo `total` (default 0) + nested `itens.create`.
5. **PostgreSQL:**
   - BEFORE em cada item: valida de novo e recalcula `subtotal`.
   - AFTER em cada item: `fn_pedido_recalc_total` atualiza `pedido.total`.
   - AFTER audit no pedido e nos itens.
6. **API relê** o pedido com `include` (cliente + itens + produto) — resposta carrega o `total` **já recalculado pelo trigger**.
7. FE fecha modal e recarrega listagem.

**Frase de reunião:** *“A API decide o que pode acontecer; o banco garante que, se acontecer, os números batem — mesmo que alguém escreva direto no Postgres um dia. E `pedido.total` tem um dono só: o trigger.”*

### Domínio de dados (quadro)

```
user (auth)
cliente 1 ─── N pedido 1 ─── N pedido_item N ─── 1 produto
                 │
                 └── status: rascunho | confirmado | cancelado
                 └── total ← SUM(subtotais) [trigger ONLY]

audit_log ← INSERT/UPDATE/DELETE (triggers; sem password_hash)
```

| Tabela | Para quê |
|--------|----------|
| `cliente` | Loja B2B (CNPJ único); com pedidos → soft `ativo=false` |
| `produto` | Catálogo (código único); com itens → soft `ativo=false` |
| `pedido` | Cabeçalho; `total` só via trigger |
| `pedido_item` | Linhas; `subtotal` reforçado no BEFORE |
| `user` | Login interno |
| `audit_log` | Histórico DML |

Campos: [`mapa-entidades.md`](mapa-entidades.md).

---

## 7. Retrospectiva de incidentes reais

Avaliador técnico valoriza mais “o que quebrou e como resolvemos” do que “está perfeito”.

### Incidente 1 — Migration `20260723182933_cadu`

**O que:** migration (provavelmente agente sem revisão) removeu `DEFAULT` de `audit_log.id` e usou **nome de pessoa**. Triggers inserem em `audit_log` sem `id` explícito → em banco limpo, **todo DML auditado falharia** (NOT NULL).

**Como foi pego:** revisão humana — não havia teste de integração tocando o banco que pegasse isso.

**Correção:** migration `…_restore_audit_log_id_default`; README na pasta; regra em `.cursor/rules/prottus/padroes.mdc` (nome descritivo + `prisma migrate diff` antes de aceitar migration de agente). **Não renomear** a pasta `cadu` — já está em `_prisma_migrations`.

**Lição:** IA gera SQL sintaticamente válido que remove garantia de schema sem erro imediato. Diff de schema não é opcional.

### Incidente 2 — Dupla fonte de verdade para `pedido.total`

**O que (antes):** API somava em JS e escrevia `total` no `update`/`create`, na mesma transação em que a trigger `fn_pedido_recalc_total` também escrevia `total` após inserts de item. Os números batiam por coincidência de arredondamento (`.toFixed(2)` vs `ROUND`) — não por garantia estrutural. Mudança futura em um lado só → divergência silenciosa.

**Correção:** trigger é a **única** dona de `total`. API só cria/atualiza itens e cabeçalho e **relê** o pedido.

**Lição:** defesa em profundidade é ótima para *validação* (duas camadas dizendo “inválido”); é perigosa para *cálculo derivado* com dois escritores. Cálculo deve ter **um dono**; validação pode ter várias camadas.

---

## 8. Escalabilidade — o que já existe, o que falta, quando resolver

**Já existe (sem reescrita):**

- Paginação obrigatória (`page`/`pageSize`, máx. 100).
- `GET /dashboard/summary` agrega no banco (não soma lista no FE).
- `options/all` enxutos para selects.
- API stateless (JWT no cookie) — pré-requisito de multi-instância futura.
- Testes de carga documentam baseline.

**Ainda não — e o gatilho:**

| Capacidade | Quando |
|------------|--------|
| Cache Redis/CDN | Listagem “quente” comprovada |
| Filas | Relatório/e-mail/importação lenta real |
| Throttler Redis | API em >1 instância |
| Extrair serviço | Dor de deploy/escala por módulo, não “moda” |

**Frase:** *“Nem todo cliente precisa de Kafka; todo cliente precisa de paginação e auth decente.”*  
Detalhe: [`escalabilidade.md`](escalabilidade.md).

---

## 9. Convenções do repositório (não quebrar o padrão)

- **Nomenclatura:** UI e docs de negócio em português; código/plataforma em inglês onde o ecossistema pede (`PrismaService`); tabelas/colunas de domínio Distac em português do negócio (`cliente`, `preco_unitario`).
- **Controller fino; Service com regra**, query e `throw` de domínio.
- **DTO sempre com class-validator** na borda.
- **Exclusão:** referenciado → `ativo: false`; `DELETE` físico só sem referências.
- **Zero emojis na UI** — `Icon` SVG (`components/Icon.tsx`).
- **JSDoc em export público** + `FUNCTIONS.md` atualizado.
- **Migration:** nome descreve schema; nunca nome de pessoa; diff antes de aceitar agente.
- **Novo CRUD:** seguir skill `distac-add-crud`; JWT global — **não** marcar `@Public()` em recurso de negócio.

---

## 10. Mapa de pastas

```
Modelo Distac (mono-repo)
├── frontend/                 # React + Vite
│   ├── src/lib/              # apiFetch, resources, types
│   ├── src/auth/             # AuthContext, ProtectedRoute
│   ├── src/pages/            # CRUDs / Home
│   └── FUNCTIONS.md
├── backend/
│   ├── src/{auth,clientes,produtos,pedidos,dashboard,common,config,prisma}/
│   ├── prisma/               # schema, migrations, seed
│   └── FUNCTIONS.md
├── database/                 # scripts setup/migrate/check + SQL triggers
├── tests/load/               # smoke | normal | heavy
├── docs/projeto/             # verdade do produto + este handbook
├── docs/prottus/             # metodologia empresa (somente leitura)
├── .cursor/rules|skills/     # governança do agente
└── .env.example
```

---

## 11. Operação local (o lead precisa subir do zero)

```bash
# Banco
bash database/scripts/setup.sh
bash database/scripts/migrate.sh    # migrate deploy + seed
bash database/scripts/check.sh

# API
cd backend && npm install && npm run start:dev   # alias: npm run dev

# UI
cd frontend && npm install && npm run dev

# Testes (API no ar)
node tests/load/run-node.mjs smoke
cd backend && npm run test
```

| Item | Valor local |
|------|-------------|
| Login seed | `vendedor@distac.local` / `distac123` (requer `SEED_DEMO_USER_ON_BOOT=true`) |
| API | http://127.0.0.1:3000/api |
| Swagger | http://127.0.0.1:3000/api/docs |
| Health | http://127.0.0.1:3000/api/health |
| UI | http://127.0.0.1:5173 |

Env críticos (validados em `env.validation.ts`): `DATABASE_URL`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `CORS_ORIGIN`, `PORT`, `NODE_ENV`, `SEED_DEMO_USER_ON_BOOT`.

---

## 12. O que muda vs o que fica ao clonar para outro cliente

| Costuma mudar | Costuma ficar |
|---------------|---------------|
| Marca, logo, tokens CSS | Auth cookies httpOnly + JwtAuthGuard global |
| Tabelas/telas de negócio | Paginação, summary/options quando couber |
| Seed e CNPJs de exemplo | Pasta `database/` + triggers/audit |
| Rule/skills `distac-*` | `docs/prottus/` + rules Prottus |
| Título Swagger / domínio | ConfigModule + Swagger + pilares de teste |

Playbook: [`USAR-COMO-BASE.md`](USAR-COMO-BASE.md).

---

## 13. Decisões e trade-offs (defender em reunião)

| Decisão | Benefício | Custo / risco |
|---------|-----------|----------------|
| Sem Docker | Setup simples | Drift de versão Postgres entre máquinas |
| Cookies httpOnly | Mitiga roubo de token via XSS | CORS+credentials; CSRF não é “completo” |
| Prisma | Velocidade + tipos | Triggers fora do happy path do ORM |
| Throttler in-memory | Simples | Multi-instância dilui o limite |
| Modular Monolith | Menos ops | Extrair serviço só com dor real |
| Audit no Postgres | Independente da API | `audit_log` cresce — planejar retenção |
| Tipos FE manuais | Simplicidade | Risco de dessincronia vs Prisma |
| Trigger dona do `total` | Uma fonte de verdade | Lógica em TS + PL/pgSQL |
| Migration `…_cadu` | Histórico preservado (não renomear) | Drift de agente; corrigido na migration seguinte |

---

## 14. Cola rápida (60 segundos) + sabatina

**Cola:**

- Stack: React+Vite+TS · Nest+TS · Prisma · Postgres · JWT em cookie httpOnly.  
- Domínio: 4 tabelas de venda + `user` + `audit_log`.  
- Segurança: Helmet, throttle, ValidationPipe, bcrypt, audit sem hash, JWT global, sem token no localStorage.  
- Escala: paginação, summary, options, smoke/normal/heavy.  
- Banco: triggers de subtotal/total/integridade/auditoria; **total do pedido = trigger**.  
- Repo: base Prottus — clonar e trocar domínio/marca, manter pilares.  
- Subir: `database/scripts/*` → backend → frontend → `smoke`.

**Perguntas e respostas diretas:**

| Pergunta | Resposta curta |
|----------|----------------|
| Por que JWT e não sessão Redis? | Stateless; escala horizontal sem redesenhar auth. Custo: sem revogação imediata de refresh. |
| Token expirar no meio da tela? | `apiFetch` faz refresh e repete; só cai no login se o refresh também falhar. |
| Por que regra na API **e** no trigger? | API = UX; banco = última linha que não depende de como o dado chegou. |
| Quem decide `pedido.total`? | Só o banco (`fn_pedido_recalc_total`). API relê. Ver §7 incidente 2. |
| O que é auditado? | DML em cliente/produto/pedido/pedido_item/user; sem `password_hash`. |
| Por que sem RBAC? | Distac tem um perfil; RBAC sem segundo perfil real é desenhar no escuro. |
| Maior fragilidade de segurança hoje? | Sem denylist de refresh (válido até expirar). |
| Como pegam erro de agente/Cursor? | Revisão humana + regra de migration + incidente `cadu` documentado. |
| Cobertura de teste adequada? | Parcial: services unitários sim; HTTP/FE/e2e ainda não. |

---

## 15. O que o time deve saber apontar no código

| Pergunta | Arquivo |
|----------|---------|
| Cookie setado? | `backend/src/auth/auth.controller.ts` |
| JWT lido do cookie? | `backend/src/auth/jwt.strategy.ts` |
| JWT exigido por padrão? | `backend/src/app.module.ts` (`APP_GUARD`) + `@Public()` |
| Modular Monolith documentado? | [`ARQUITETURA-WEB.md`](ARQUITETURA-WEB.md) |
| Helmet / CORS / Swagger? | `backend/src/main.ts` |
| Env validado? | `backend/src/config/env.validation.ts` |
| Seed gated? | `auth.service.ts` + `SEED_DEMO_USER_ON_BOOT` |
| Paginação? | `backend/src/common/pagination.ts` |
| FE manda cookie / refresh? | `frontend/src/lib/api.ts` |
| Sessão React? | `frontend/src/auth/AuthContext.tsx` |
| Schema? | `backend/prisma/schema.prisma` |
| Triggers? | `database/sql/03-triggers.sql` |
| Total do pedido (sem escrever na API)? | `backend/src/pedidos/pedidos.service.ts` |
| Incidente migration? | `prisma/migrations/20260723182933_cadu/README.md` |
| Carga 3 níveis? | `tests/load/run-node.mjs` |
| Unitários de service? | `*.service.spec.ts` em clientes/produtos/pedidos |

---

## 16. Critério de “domínio técnico adquirido”

O tech lead está apto neste projeto-base quando consegue, **sem ler o chat**:

- [ ] Explicar login → cookie → refresh silencioso → CRUD  
- [ ] Explicar por que **não** JWT no `localStorage`  
- [ ] Explicar por que `pedido.total` é do banco (e o incidente da dupla fonte)  
- [ ] Narrar o incidente `cadu` e a regra que nasceu dele  
- [ ] Listar as 4 limitações de segurança conscientes (§5) sem escondê-las  
- [ ] Explicar o que um **429** significa no heavy  
- [ ] Nomear as 6 tabelas e o papel de `audit_log`  
- [ ] Explicar por que não há microserviços / Docker / RBAC / cache **hoje** e o gatilho de cada um  
- [ ] Subir banco + API + UI do zero e rodar `smoke`  
- [ ] Dizer o que os unitários cobrem e o que ainda falta  
- [ ] Listar 3 coisas que mudam vs 3 que ficam ao clonar para outro cliente  

Se faltar um item: reler §2–§8 e os docs irmãos do topo.
