# Requisitos — Distac

Sistema: **Vendas Internas Distac** | Cliente: **Distribuidora Distac** | Desenvolvedora: **Prottus**

Este projeto também serve de **base reutilizável** Prottus — requisitos de segurança e escalabilidade entram nas métricas de desenvolvimento (não são opcionais de documentação).

---

## 1. Visão

Plataforma para vendedores internos registrarem e acompanharem vendas de material de construção (PE), com login, CRUDs do domínio e padrões explícitos de **segurança** e **escalabilidade**.

## 2. Operações

- Autenticar vendedor (login)
- CRUD clientes, produtos, pedidos (+ itens)
- Consultar vendas / cadastros (listagens paginadas)
- Dashboard com resumo (sem listar tudo)

## 3. Perguntas que o sistema responde

- Quais pedidos (e para qual cliente)?
- Quais itens/quantidades de um pedido?
- Quais clientes e produtos estão disponíveis?

## 4. Requisitos não-funcionais

| ID | Requisito | Como Distac atende | Doc |
|----|-----------|--------------------|-----|
| RNF-01 | Escalável conforme o contexto | Paginação, summary, monólito modular, caminho documentado para cache/fila | [`escalabilidade.md`](../escalabilidade.md) |
| RNF-02 | Seguro | JWT httpOnly, Helmet, rate limit, secrets em env, rotas autenticadas | [`seguranca.md`](../seguranca.md) |
| RNF-03 | Simples e completo no domínio | 4 tabelas de negócio + auth/audit | [`mapa-entidades.md`](../mapa-entidades.md) |
| RNF-04 | Integridade no banco | Triggers BEFORE/AFTER + `audit_log` | [`database/info/triggers.md`](../../../database/info/triggers.md) |
| RNF-05 | Dados sensíveis protegidos | bcrypt; `password_hash` omitido na auditoria; sem JWT no localStorage | [`seguranca.md`](../seguranca.md) |
| RNF-06 | Qualidade verificável | Smoke segurança + carga | [`tests/`](../../../tests/) |
| RNF-07 | UI sem emojis | Componente `Icon` + DS Distac | [`design-system.md`](../design-system.md) |

## 5. Integrações

Nenhuma no escopo.

## 6. Prioridades

1. Manter base Distac correta (segurança + escala + domínio).
2. Homologação / ajustes DOP quando houver.
3. Deploy com TLS e secrets de produção.
