# HopeMind — Plataforma de Saúde Mental

**Referência operacional da Prottus** para a plataforma web PWA de triagem inteligente e agendamento psicológico **HopeMind** (React + NestJS + PostgreSQL + Prisma).

---

## Pilares de Qualidade & Arquitetura (Modelo Prottus)

| Pilar | Implementação no HopeMind | Documentação |
|-------|---------------------------|--------------|
| **Segurança** | Cookies `httpOnly` (JWT access + refresh), Helmet, Throttler rate limit, secrets no `.env` | [`docs/projeto/seguranca.md`](docs/projeto/seguranca.md) |
| **Escalabilidade** | Paginação, filtros de busca, DTOs com `class-validator`, estatísticas de Match % | [`docs/projeto/escalabilidade.md`](docs/projeto/escalabilidade.md) |
| **Domínio Claro** | `users`, `patients`, `psychologists`, `triage_questions`, `appointments`, `audit_logs` (Código em EN, UI em PT-BR) | [`docs/projeto/mapa-entidades.md`](docs/projeto/mapa-entidades.md) |
| **Banco Operacional** | PostgreSQL local com Prisma ORM, migrations e seed demonstrativo | [`backend/prisma/schema.prisma`](backend/prisma/schema.prisma) |
| **Design System** | Variáveis CSS `--brand-primary`, densidade de controles 32px, ícones vetoriais sem emojis | [`docs/prottus/design-system.md`](docs/prottus/design-system.md) |

---

## Stack Tecnológica

| Camada | Tecnologia |
|--------|------------|
| Frontend | React 18 · Vite · TypeScript (SPA / PWA) |
| Backend | NestJS · TypeScript (Modular Monolith REST API) |
| Banco de Dados | MariaDB / MySQL local + Prisma ORM |
| Autenticação | JWT Access Token (15m) + Refresh Token (7d) em cookies **httpOnly** |
| Documentação API | Swagger UI (`/api/docs`) |

---

## Como Rodar Localmente

### Pré-requisitos
- Node.js (v18+)
- MariaDB / MySQL rodando em `127.0.0.1:3306`

### 1. Instalar Dependências
```bash
npm run install:all
```

### 2. Configurar Variáveis de Ambiente
Copie o arquivo `.env.example` para `.env` e `backend/.env`:
```bash
cp .env.example .env
cp .env.example backend/.env
```

### 3. Gerar Prisma Client & Seed
```bash
cd backend
npx prisma generate
npx prisma db push
npx prisma db seed
```

### 4. Iniciar Servidores de Desenvolvimento
```bash
# Terminal 1 — Backend NestJS API (http://localhost:3000/api)
npm run dev:api

# Terminal 2 — Frontend React SPA (http://localhost:5173)
npm run dev:web
```

| Serviço | URL |
|---------|-----|
| Frontend SPA | http://localhost:5173 |
| API NestJS | http://localhost:3000/api |
| Documentação Swagger | http://localhost:3000/api/docs |

### Usuários de Teste (Seed Local)
- **Paciente Demo**: `paciente@hopemind.local` / `hopemind123`
- **Psicólogo Demo**: `rafael@hopemind.local` / `hopemind123`

---

## Estrutura do Repositório

```text
hopemind/
├── backend/          # API REST NestJS + Prisma ORM
│   ├── prisma/       # Schema e Seed em PostgreSQL
│   └── src/          # Módulos: auth, users, patients, psychologists, triage, appointments
├── frontend/         # SPA React + Vite + TypeScript (PWA)
│   └── src/          # Design System Prottus, componentes, contextos e páginas
├── database/         # Scripts de banco de dados
├── docs/             # Documentação técnica e metodologia Prottus
│   ├── prottus/      # Padrões empresa (Design System, Metodologia)
│   └── projeto/      # Decisões do produto HopeMind (Arquitetura, Domínio, Segurança)
├── .cursor/          # Regras, agentes e habilidades da Prottus
├── .env.example      # Variáveis de ambiente padrão
└── package.json      # Scripts de orquestração do monorepo
```
