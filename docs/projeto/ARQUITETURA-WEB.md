# Arquitetura Web — HopeMind (SafeMindLive)

Este documento estabelece as decisões arquiteturais do projeto **HopeMind** no padrão corporativo da **SafeMindLive**.

---

## 1. Decisão: Monólito Modular + SPA (PWA)

| Critério | Escolha SafeMindLive |
|----------|----------------------|
| Modelo de Aplicação | **Monólito Modular** (NestJS API REST) + **SPA React** (Vite + TypeScript) |
| Banco de Dados | **MariaDB / MySQL local** + Prisma ORM |
| Autenticação | **JWT Access (15m) + Refresh Token (7d)** em cookies **httpOnly** |
| Interface | **Design System SafeMindLive** (Densidade 32px, Ícones vetoriais SVG, Sem Emojis na UI) |

---

## 2. Camadas do Sistema (Presentation → Business → Data)

```text
┌─────────────────────────────────────────────┐
│ Presentation (Client)                       │
│  frontend/ — React SPA, AuthContext, pages  │
│  Sem lógica de negócio crítica no browser   │
└──────────────────┬──────────────────────────┘
                   │ HTTPS / HTTP + cookies httpOnly
┌──────────────────▼──────────────────────────┐
│ Business (Application)                      │
│  backend/ — NestJS modules                  │
│  auth | users | patients | psychologists |   │
│  triage | appointments | audit              │
└──────────────────┬──────────────────────────┘
                   │ Prisma ORM
┌──────────────────▼──────────────────────────┐
│ Data Access & Integrity                     │
│  MariaDB / MySQL (hopemind database)        │
│  Schema, migrations e seed via Prisma       │
└─────────────────────────────────────────────┘
```

---

## 3. Segurança (SafeMindLive Security Standard)

1. **JWT httpOnly Cookies**: Impossibilita acesso a tokens de autenticação via scripts maliciosos (XSS).
2. **Helmet**: Proteção contra vulnerabilidades web comuns através de cabeçalhos HTTP seguros.
3. **Throttler (Rate Limiting)**: Prevenção contra ataques de força bruta.
4. **ValidationPipe Global**: Sanitização e validação de todos os DTOs recebidos na API.
