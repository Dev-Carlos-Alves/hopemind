# Usar o Distac como base Prottus

Este repositório **é** a base. Não existe pasta separada de “template vazio”.

Metodologia empresa (não alterar): [`../prottus/`](../prottus/).  
O que se customiza por cliente: tudo em `docs/projeto/`, código de domínio, marca e schema.

---

## Passos

1. **Copiar** o mono-repo (ou branch a partir dele).
2. **Renomear** contexto: cliente, sistema, logo (`imagens/`), tokens em `design-system.md` + `frontend/src/styles/`.
3. **Atualizar** `.cursor/rules/projeto/` (uma rule do cliente, como `distac.mdc`).
4. **Substituir domínio** em `backend/prisma/schema.prisma`, migrations, seed, módulos Nest e páginas React.
5. **Manter** (não remover sem decisão explícita):
   - Auth JWT httpOnly + Helmet + rate limit
   - Paginação e endpoints de summary/options quando fizer sentido
   - Pasta `database/` (scripts + SQL de triggers/audit)
   - `tests/load` (ajustar cenários ao domínio)
   - Docs `seguranca.md`, `escalabilidade.md`, `DOMINIO-TECNICO.md`, `ARQUITETURA-WEB.md`, **`FLUXO-APLICACAO.md`** (atualizar tabelas ao domínio novo)
   - `.cursor/skills/` (adaptar skills `distac-*`) e `.cursor/rules/prottus/`
   - `ConfigModule` + validação de env + Swagger (`/api/docs`)
6. **Limpar** seed/login de exemplo; nunca publicar senhas reais; em cliente use `SEED_DEMO_USER_ON_BOOT=false`.
7. **Adaptar** título/tags do Swagger (`/api/docs`).
8. **Atualizar** [`FLUXO-APLICACAO.md`](FLUXO-APLICACAO.md): manter seções do modelo; trocar paths/rotas/módulos do cliente (checklist no próprio arquivo).
9. **Rodar** `npm run setup` → `npm run dev:api` → `npm run dev:web` → `/api/docs` → `npm run test:smoke`.

---

## O que muda vs o que fica

| Costuma mudar | Costuma ficar |
|---------------|---------------|
| Tabelas de negócio | Forma de auth (cookies httpOnly + JwtAuthGuard global) |
| Telas / marca | Estrutura `frontend` / `backend` / `database` / `tests` |
| Brief e requisitos | `docs/prottus/` e rules Prottus |
| Seed e CNPJs de exemplo | Anonimização em `audit_log`; `orders.total` via trigger |
| Nomes de módulos Nest + tabelas do `FLUXO-APLICACAO.md` | Estrutura do fluxo (boot → auth → shell → CRUD) |
| Conteúdo das telas no fluxo | Convenção de triggers `fn_` / `trg_` |
| Rule/skills `distac-*` | Pilares de skills (local-run, security, tests) |
| Título Swagger | ConfigModule + Swagger |

---

## Critério de pronto (base reutilizável)

- [ ] Login seguro documentado
- [ ] `FLUXO-APLICACAO.md` atualizado ao domínio do cliente
- [ ] CRUD do domínio com paginação
- [ ] Triggers/audit aplicados e documentados (`total` do pedido no banco)
- [ ] Segurança e escalabilidade linkados no README do novo projeto
- [ ] Swagger `/api/docs` funcionando
- [ ] `SEED_DEMO_USER_ON_BOOT=false` (ou removido) em ambiente de cliente
- [ ] Teste de smoke/carga executável
