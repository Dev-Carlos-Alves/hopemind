# Escalabilidade — Distac (referência Prottus)

Nem todo cliente precisa de “escala máxima”. Este documento define **o que já está pronto**, **quando crescer** e **como crescer sem quebrar** segurança e domínio.

Segurança relacionada: [`seguranca.md`](seguranca.md).

---

## 1. Princípio

> Arquitetura **simples e correta** primeiro; otimizar com **evidência** (métricas / testes de carga).  
> Manter caminho aberto: paginação, APIs de resumo, banco com índices e regras no Postgres.

---

## 2. O que este projeto já faz (base)

| Prática | Onde | Por quê |
|---------|------|---------|
| Listagens paginadas | `page` / `pageSize` (máx. 100) | Evita carregar tabelas inteiras |
| Dashboard summary | `GET /api/dashboard/summary` | Home sem N listagens completas |
| Options leves | `/clientes/options/all`, `/produtos/options/all` | Selects sem payload de CRUD |
| Monólito modular | Nest modules + SPA | Cresce por módulo sem microserviços cedo demais |
| Postgres + Prisma | migrations versionadas | Schema evolui com o produto |
| Triggers leves | total / integridade / audit | Consistência sem round-trips extras na API |
| Teste de carga | `tests/load/run-node.mjs` | Baseline local (VUs, p95, 429) |

---

## 3. Quando **não** precisa “escalar mais”

- Poucos usuários simultâneos (dezenas).
- Volume de pedidos/cadastros modesto.
- Deploy single-node com Postgres gerenciado.

Neste caso: mantenha paginação + auth + índices; **não** introduza Kafka/Redis “por padrão”.

---

## 4. Quando o contexto pede mais escala

Sinais (exemplos):

- p95 das listagens sobe de forma constante sob carga real.
- Rate limit global dispara em uso legítimo (ajustar com cuidado).
- Relatórios pesados competem com o CRUD online.
- Vários escritórios / picos horários.

### Escada sugerida (ordem)

1. **Medir** — repetir `tests/load` + logs/APM.
2. **Índices** — em filtros reais (`cnpj`, `status`, `cliente_id`, datas).
3. **Read models / summary** — endpoints agregados (como o dashboard).
4. **Cache** (Redis) — só para leituras quentes e estáveis.
5. **Filas** — jobs assíncronos (export, e-mail), não o caminho crítico do CRUD.
6. **Réplica / pool** — Postgres gerenciado, connection pooling.
7. **Particionar `audit_log`** — retenção quando o volume de auditoria crescer.

Cada degrau deve preservar: JWT httpOnly, validação, triggers de integridade, omitir sensíveis na auditoria.

---

## 5. O que **não** fazer cedo demais

- Microserviços sem necessidade de time/domínio.
- Cache sem invalidação clara.
- Remover paginação “porque o cliente tem poucos registros”.
- Desligar rate limit em produção.
- Colocar JWT no `localStorage` “para facilitar o mobile web”.

---

## 6. Baseline local (referência)

Ver resultado documentado em [`tests/README.md`](../../tests/README.md).  
Repetir no ambiente do cliente após mudanças relevantes.

---

## 7. Checklist de evolução

- [ ] Listagens continuam paginadas
- [ ] Novos endpoints pesados têm filtro + limite
- [ ] Carga mínima rodou após mudança estrutural
- [ ] `audit_log` e triggers revisados (sem PII/segredo em claro)
- [ ] Decisão de cache/fila registrada em `especificacoes.md`
