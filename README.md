# HopeMind — Plataforma de Saúde Mental

**Padrão Corporativo SafeMindLive** para a plataforma web PWA de triagem inteligente e agendamento psicológico **HopeMind** (React + NestJS + MariaDB + Prisma).

---

## Pilares de Qualidade & Arquitetura (SafeMindLive)

| Pilar | Implementação no HopeMind | Documentação |
|-------|---------------------------|--------------|
| **Segurança** | Cookies `httpOnly` (JWT access + refresh), Helmet, Throttler rate limit, secrets no `.env` | [`docs/projeto/seguranca.md`](docs/projeto/seguranca.md) |
| **Escalabilidade** | Paginação, filtros de busca, DTOs com `class-validator`, estatísticas de Match % | [`docs/projeto/escalabilidade.md`](docs/projeto/escalabilidade.md) |
| **Domínio Claro** | `users`, `patients`, `psychologists`, `triage_questions`, `appointments`, `audit_logs` (Código em EN, UI em PT-BR) | [`docs/projeto/mapa-entidades.md`](docs/projeto/mapa-entidades.md) |
| **Banco Operacional** | MariaDB / MySQL local com Prisma ORM, migrations e seed demonstrativo | [`backend/prisma/schema.prisma`](backend/prisma/schema.prisma) |
| **Design System** | Variáveis CSS `--brand-primary`, densidade de controles 32px, ícones vetoriais sem emojis | [`docs/safemindlive/design-system.md`](docs/safemindlive/design-system.md) |

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

## Como Rodar Localmente (Comando Único)

### 1. Iniciar o Ambiente de Desenvolvimento (Backend + Frontend)
Basta rodar **um único comando** na raiz do projeto:
```bash
npm run dev
```
- **Frontend SPA**: `http://localhost:5173`
- **Backend API**: `http://localhost:3000/api`
- **Swagger Docs**: `http://localhost:3000/api/docs`

---

## Outros Comandos Úteis

| Comando | Descrição |
|---------|-----------|
| `npm run setup` | Atualiza o schema no MariaDB e roda os dados demonstrativos |
| `npm run build` | Compila o backend NestJS e o frontend React para produção |
| `npm run install:all` | Instala as dependências da raiz, backend e frontend |

---

## Estrutura do Repositório

```text
hopemind/
├── .antigravity/        # Regras e instruções SafeMindLive para o Agente Antigravity
├── .env                 # Variáveis de ambiente locais (MariaDB, JWT, Portas)
├── .env.example         # Exemplo de configuração para novos desenvolvedores
├── README.md            # Documentação técnica oficial do HopeMind
├── package.json         # Scripts de orquestração (npm run dev unificado)
├── backend/             # API REST NestJS + Prisma ORM
│   ├── prisma/          # Schema MariaDB (schema.prisma) e Seed (seed.ts)
│   └── src/             # Módulos: auth, users, patients, psychologists, triage, appointments
├── frontend/            # SPA React + Vite + TypeScript
│   └── src/             # Design System SafeMindLive, componentes, contextos e páginas
└── docs/                # Documentação técnica e metodologia SafeMindLive
    ├── safemindlive/    # Metodologia e Design System corporativo da SafeMindLive
    └── projeto/         # Arquitetura, mapa de entidades e segurança do HopeMind
```
