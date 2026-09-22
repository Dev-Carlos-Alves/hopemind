# Arquitetura web — Distac (base Prottus)

Referência de padrões: [Web Application Architecture Patterns That Scale Securely](https://www.wildnetedge.com/blogs/web-application-architecture-patterns) (Wildnet Edge, 2026).

Este documento **fixa a decisão** da base Prottus: o que adotamos, o que rejeitamos neste estágio e o checklist para evoluir sem reescrever cedo demais.

---

## 1. Decisão: Modular Monolith + SPA

| Critério do artigo | Distac / Prottus base |
|--------------------|------------------------|
| MVP / Startup / time pequeno | **Modular Monolith** |
| Frontend pesado / app interna | **SPA** (React + Vite) — não PWA (sem offline) |
| Microservices / Cloud Native / Serverless | **Fora de escopo agora** — custo operacional > ganho |

O artigo deixa explícito: *microservices não são sempre melhores*; monólito bem modular é o padrão certo até bater escala real. Distac é **modelo de desenvolvimento** da empresa — prioriza clareza, velocidade de clone e governança Cursor (rules/skills), não orquestração prematura.

---

## 2. Camadas (Presentation → Business → Data)

Alinhado às *Modern Web Application Architecture Layers* do artigo:

```
┌─────────────────────────────────────────────┐
│ Presentation (Client)                       │
│  frontend/ — React SPA, AuthContext, pages  │
│  Sem lógica de negócio crítica no browser   │
└──────────────────┬──────────────────────────┘
                   │ HTTPS + cookies httpOnly
┌──────────────────▼──────────────────────────┐
│ Business (Application)                      │
│  backend/ — Nest modules                    │
│  auth | clientes | produtos | pedidos |     │
│  dashboard — Controller → Service           │
└──────────────────┬──────────────────────────┘
                   │ Prisma
┌──────────────────▼──────────────────────────┐
│ Data Access & Integrity                     │
│  PostgreSQL + Prisma schema/migrations      │
│  Triggers (total, regras, audit_log)        │
└─────────────────────────────────────────────┘
```

| Camada | Onde | Responsabilidade |
|--------|------|------------------|
| Presentation | `frontend/src` | UX, formulários, navegação; chama API |
| Business | `backend/src/*` modules | Regras, auth, validação DTO, orquestra |
| Data | Prisma + `database/sql` | Persistência + integridade/auditoria no banco |

O cliente **nunca** fala com o banco — só com `/api`.

---

## 3. Segurança (Zero Trust na borda da API)

Práticas do artigo → implementação Distac:

| Prática Wildnet | Distac |
|-----------------|--------|
| Verify every request | `JwtAuthGuard` **global** (`APP_GUARD`); exceções só com `@Public()` |
| Identity (JWT/OAuth) | JWT em cookies httpOnly (não localStorage) |
| Defense in depth | Helmet · Throttler · ValidationPipe · triggers · audit |
| DevSecOps / CI scans | Ainda **a evoluir** (pipeline CI + audit npm) — ver roadmap |
| Encrypt in transit | HTTPS em produção (CORS + Secure cookies) |

Rotas públicas permitidas: `GET /api/health`, `POST /api/auth/login|refresh|logout`.  
Todo o restante exige cookie `access_token`.

Detalhe operacional: [`seguranca.md`](seguranca.md).

---

## 4. Escalabilidade (sem reescrever o core)

Estratégias do artigo vs estágio Distac:

| Estratégia | Agora | Quando evoluir |
|------------|-------|----------------|
| Stateless API | Sim (JWT no cookie; sem sessão em memória de app) | — |
| Paginação / agregações | Sim | — |
| Load balancer | Não (single instance local) | Homolog/prod multi-instância |
| Cache (Redis/CDN) | Não | Listagens quentes / assets estáticos |
| Filas assíncronas | Não | Relatórios / e-mail / importações |
| Microservices | Não | Domínio com time/deploy independente |

Detalhe: [`escalabilidade.md`](escalabilidade.md).

---

## 5. O que **não** fazer nesta base (anti-padrões)

1. Quebrar em microservices “porque o blog menciona”.
2. Introduzir Docker/K8s só por checklist — só quando o cliente exigir ops cloud.
3. Colocar regras de negócio críticas só no frontend.
4. Marcar CRUD novo com `@Public()` por preguiça.
5. Confiar só no ORM — triggers/audit fazem parte da camada de dados.

---

## 6. Checklist do modelo Prottus (clone)

- [ ] Continua **Modular Monolith + SPA**
- [ ] Módulos Nest com fronteira clara (um agregado ≈ um module)
- [ ] `JwtAuthGuard` global; novos endpoints públicos só com `@Public()` documentado
- [ ] Camada Data via Prisma; triggers/audit mantidos quando o domínio precisar de integridade
- [ ] Docs `seguranca` + `escalabilidade` + este arquivo atualizados se a decisão mudar
- [ ] Teste `smoke` passa

---

## 7. Roadmap consciente (não urgente)

Ordem sugerida quando um cliente sair do “modelo interno”:

1. CI (lint + `smoke` + `npm audit`)  
2. HTTPS + secrets vault  
3. Roles/RBAC se multi-perfil  
4. Cache/fila se métricas pedirem  
5. Extrair serviço só com dor operacional real  

---

## Fontes

- Wildnet Edge — [Web Application Architecture Patterns](https://www.wildnetedge.com/blogs/web-application-architecture-patterns)  
- Interno: [`DOMINIO-TECNICO.md`](DOMINIO-TECNICO.md) · [`especificacoes.md`](especificacoes.md) · [`USAR-COMO-BASE.md`](USAR-COMO-BASE.md)
