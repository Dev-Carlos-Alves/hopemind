---
name: distac-database
description: >-
  Operates Distac PostgreSQL: setup, migrate deploy, seed, triggers, audit_log,
  apply-triggers, integrity rules for pedidos. Use when working on Prisma schema,
  migrations, seed, SQL triggers, audit, or database scripts.
---

# Distac — banco e triggers

## Scripts

```bash
bash database/scripts/setup.sh
bash database/scripts/migrate.sh          # deploy + seed (preferir)
bash database/scripts/apply-triggers.sh   # reaplicar 03-triggers.sql
bash database/scripts/check.sh
bash database/scripts/seed.sh
```

## Regras duras

1. **Não** usar `prisma migrate dev` dentro de scripts de equipe (gera migration interativa tipo `cadu`).
2. `audit_log.id` precisa de `DEFAULT gen_random_uuid()::text` (triggers inserem sem id).
3. Pedido **cancelado**: não edita itens / não muda status (BEFORE triggers).
4. `subtotal` e `pedido.total` são reforçados no banco.
5. Auditoria omite `password_hash`.

## Ao mudar schema

1. Editar `backend/prisma/schema.prisma`
2. Criar migration com nome descritivo
3. Se nova tabela precisa audit/updated_at/regras → atualizar `database/sql/03-triggers.sql` **e** versionar via migration
4. Rodar `migrate deploy` / `migrate.sh`
5. Atualizar `database/info/tabelas.md` + `docs/projeto/mapa-entidades.md`

## Seed

- Arquivo: `backend/prisma/seed.ts`
- Limpeza de pedidos `[SEED]` respeita triggers (disable pontual)
- Cancelado: cria como rascunho + itens, depois atualiza status

## Docs

`database/info/triggers.md` · `docs/projeto/DOMINIO-TECNICO.md` §5
