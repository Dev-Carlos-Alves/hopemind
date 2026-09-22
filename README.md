# HopeMind — Plataforma de Saúde Mental

**Padrão Corporativo SafeMindLive** para a plataforma web PWA de triagem inteligente e agendamento psicológico **HopeMind** (React + NestJS + MariaDB + Prisma).

---

## Pilares de Qualidade & Arquitetura (SafeMindLive)

| Pilar | Implementação no HopeMind | Documentação |
|-------|---------------------------|--------------|
| **Segurança** | Cookies `httpOnly` (JWT access + refresh), Helmet, Throttler rate limit, secrets no `.env` | [`docs/projeto/seguranca.md`](docs/projeto/seguranca.md) |
| **Escalabilidade** | Paginação, filtros de busca, DTOs com `class-validator`, estatísticas de Match % | [`docs/projeto/escalabilidade.md`](docs/projeto/escalabilidade.md) |
| **Domínio Claro** | `users`, `patients`, `psychologists`, `triage_questions`, `appointments`, `audit_logs` (Código em EN, UI em PT-BR) | [`docs/projeto/mapa-entidades.md`](docs/projeto/mapa-entidades.md) |
| **Banco Operacional** | MariaDB / MySQL local automatizado com seed e migrações transparentes | [`database/README.md`](database/README.md) |
| **Design System** | Variáveis CSS `--brand-primary`, densidade de controles 32px, ícones vetoriais sem emojis | [`docs/safemindlive/design-system.md`](docs/safemindlive/design-system.md) |

---

## Stack Tecnológica

| Camada | Tecnologia |
|--------|------------|
| Frontend | React 18 · Vite · TypeScript (SPA / PWA) |
| Backend | NestJS · TypeScript (Modular Monolith REST API) |
| Banco de Dados | MariaDB / MySQL local (gerenciado automaticamente) |
| Autenticação | JWT Access Token (15m) + Refresh Token (7d) em cookies **httpOnly** |
| Documentação API | Swagger UI (`/api/docs`) |

---

## Como Rodar o Projeto (Passo a Passo Simplificado)

### 1. Preparar o Banco MariaDB e Dados de Teste
Basta rodar o comando de setup (ele prepara o banco e popula os dados automaticamente):
```bash
npm run setup
```

### 2. Iniciar a Aplicação (Backend + Frontend)
Rode o comando único para iniciar a aplicação inteira:
```bash
npm run dev
```

- **Frontend SPA**: `http://localhost:5173`
- **Backend API**: `http://localhost:3000/api`
- **Swagger Docs**: `http://localhost:3000/api/docs`

---

## Usuários de Teste (Seed Demonstrativo)

- **Paciente Demo**: `paciente@hopemind.local` / `hopemind123`
- **Psicólogo Demo**: `rafael@hopemind.local` / `hopemind123`

---

## Estrutura do Repositório

```text
hopemind/
├── .antigravity/        # Regras e instruções SafeMindLive para o Agente Antigravity
├── .env                 # Variáveis de ambiente locais (MariaDB root:root)
├── .env.example         # Exemplo de configuração
├── README.md            # Documentação técnica unificada do HopeMind
├── package.json         # Scripts unificados de desenvolvimento e build
├── backend/             # API REST NestJS
│   ├── prisma/          # Schema e Seed (executados automaticamente)
│   └── src/             # Módulos: auth, users, patients, psychologists, triage, appointments
├── frontend/            # SPA React + Vite + TypeScript (PWA)
│   └── src/             # Design System SafeMindLive, componentes e páginas
├── database/            # Scripts de automação do banco de dados (setup.ps1, setup.sh, dumps SQL)
├── imagens/             # Repositório central de marca e logos oficiais da SafeMindLive e HopeMind
└── docs/                # Documentação técnica e metodologia SafeMindLive
    ├── safemindlive/    # Metodologia e Design System corporativo da SafeMindLive
    └── projeto/         # Arquitetura, mapa de entidades e segurança do HopeMind
```
