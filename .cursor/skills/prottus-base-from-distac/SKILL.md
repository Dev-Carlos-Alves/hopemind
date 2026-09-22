---
name: prottus-base-from-distac
description: >-
  Guides cloning this Distac repo as the Prottus web base for a new client
  (brand, domain, schema, keep security/scale pillars). Use when starting a
  new Prottus project from this model, forking, or adapting for another
  customer.
---

# Prottus — novo cliente a partir do Distac

Este repo **é** a base. Não existe pasta template vazia.

## Manter (não remover)

- JWT httpOnly + Helmet + Throttler + ValidationPipe
- Paginação + summary/options quando couber
- `database/` (scripts + triggers/audit)
- `tests/load` (3 níveis)
- `docs/projeto/seguranca.md` + `escalabilidade.md` + `DOMINIO-TECNICO.md`
- ConfigModule / validação de env + Swagger `/api/docs`
- `.cursor/rules/prottus/` e skills essenciais (adaptar as `distac-*`)
- `docs/prottus/` intacto

## Trocar

1. Marca / logo / tokens (`design-system`, `distac-tokens.css`, `imagens/`)
2. Brief, contexto, requisitos, mapa-entidades
3. Rule `.cursor/rules/projeto/<cliente>.mdc` (substituir `distac.mdc`)
4. Schema Prisma + CRUDs + seed
5. Skills: renomear/adaptar `distac-*` para o novo cliente **ou** manter prefixo se ainda for o mesmo modelo
6. Título/tags Swagger
7. `.env` novo (secrets fortes)

## Checklist pronto

- [ ] Login seguro documentado
- [ ] CRUD paginado do domínio
- [ ] Triggers/audit ok
- [ ] Swagger `/api/docs` ok
- [ ] `smoke` passando
- [ ] README aponta Domínio técnico + Usar como base

## Doc

`docs/projeto/USAR-COMO-BASE.md` · `docs/projeto/DOMINIO-TECNICO.md`
