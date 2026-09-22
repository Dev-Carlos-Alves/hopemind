# Metodologia de Desenvolvimento — SafeMindLive

Este documento estabelece as diretrizes de desenvolvimento, arquitetura e qualidade de software da **SafeMindLive** aplicadas ao projeto **HopeMind**.

---

## 1. Pilares da Metodologia SafeMindLive

| Pilar | Descrição |
|-------|-----------|
| **Segurança por Padrão** | JWT em cookies `httpOnly`, Helmet headers, Throttler rate limiting e validação rigorosa via DTOs |
| **Monólito Modular + SPA** | API REST limpa em NestJS + SPA React 18 com Vite e TypeScript |
| **Domínio Claro** | Entidades e banco de dados em **Inglês** (`users`, `patients`, `psychologists`, `appointments`, `triage`), UI e documentação de negócio em **Português (pt-BR)** |
| **Design System Consistente** | Controles de 32px de altura, ícones vetoriais SVG (sem emojis em telas de produto), cabeçalhos de módulo em **UPPERCASE bold** |
| **Comando Único de Desenvolvimento** | Execução unificada de backend e frontend via `npm run dev` |

---

## 2. Padrões de Código & Repositório

```text
hopemind/
├── .antigravity/        # Regras e instruções do Agente Antigravity para a SafeMindLive
├── .env                 # Variáveis de ambiente locais (nunca versionar)
├── .env.example         # Exemplo de configuração
├── README.md            # Documentação principal atualizada do HopeMind
├── package.json         # Scripts unificados de desenvolvimento e build
├── backend/             # NestJS + Prisma ORM (MariaDB / MySQL)
├── frontend/            # React 18 + Vite + TypeScript (PWA)
└── docs/                # Documentação técnica e padrões da SafeMindLive
    ├── safemindlive/    # Metodologia e Design System corporativo
    └── projeto/         # Arquitetura, mapa de entidades e segurança do HopeMind
```
