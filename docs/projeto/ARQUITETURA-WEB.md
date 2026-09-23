# Arquitetura — HopeMind

## Decisão: monólito modular + SPA (PWA)

| Critério | Escolha |
|---|---|
| API | NestJS (REST), módulos por domínio |
| Front | React 18 + Vite + TypeScript, SPA instalável (PWA) |
| Banco | MariaDB / MySQL + Prisma ORM (`prisma db push` em desenvolvimento) |
| Sessão | JWT de acesso (15 min) + refresh (7 dias) em cookies `httpOnly` |
| Interface | Design system próprio, sem framework CSS ([`design-system.md`](design-system.md)) |

Um monólito modular é suficiente para o volume de um projeto acadêmico e mantém deploy e debug simples; os módulos já separam as fronteiras caso algum precise virar serviço próprio.

## Camadas

```text
frontend/ (React)
  pages/        telas (login, cadastro, questionário, recomendações, sessões, ajustes)
  components/   AppShell, ui.tsx (botões, campos, sheets...), QuestionField, BookingSheet
  services/     api.ts (axios + renovação de sessão), questionnaire.ts, theme.ts
        │  HTTP + cookies httpOnly (proxy /api no Vite)
backend/ (NestJS)
  auth/          cadastro, login, refresh, logout, /me — guard JWT global + rate limit
  triage/
    questionnaire/  definição versionada dos questionários + validação das respostas
    match/          motor de match (funções puras, testadas) e fluxo de segurança
  appointments/  agendamento com checagem de conflito
  prisma/        acesso ao banco
        │  Prisma
MariaDB — users, patients, psychologists, triage_submissions,
          safety_alerts, match_runs, appointments, audit_logs
```

## Por que o motor de match é "puro"

`backend/src/triage/match/match-engine.ts` não acessa banco nem HTTP: recebe perfis e devolve o ranking. Isso permite testar cada regra do documento de requisitos isoladamente (`npm test`) e trocar pesos/versões sem tocar no resto da API. O `TriageService` só busca os dados, chama o motor e registra o resultado em `match_runs`.

## Rotas principais

| Método | Rota | Quem |
|---|---|---|
| POST | `/api/auth/register` · `/login` · `/refresh` · `/logout` | público (rate limit 5/min em cadastro e login) |
| GET | `/api/auth/me` | logado |
| GET | `/api/triage/questionnaire` · `/api/triage/me` | paciente ou psicólogo |
| POST | `/api/triage/submissions` | paciente ou psicólogo |
| GET | `/api/matches` | paciente (sempre o próprio) |
| GET / POST | `/api/sessoes` · `/api/sessoes/agendar` | logado / paciente |

Documentação interativa: `http://localhost:3000/api/docs` (Swagger).
