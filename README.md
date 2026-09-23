# HopeMind

**Terapia que combina com você.** O HopeMind conecta pacientes a psicólogos com o estilo de atendimento, a experiência e a agenda mais compatíveis — com um algoritmo determinístico, explicável e que nunca trata respostas de risco como pontuação.

Projeto acadêmico da **SafeMindLive** · React + NestJS + MariaDB + Prisma · PWA.

---

## Destaques

| | |
|---|---|
| **Match explicável** | Filtros objetivos (formato, cidade, faixa etária, agenda) + 7 componentes ponderados. A pessoa vê *por que* cada profissional foi indicado, não uma porcentagem. [Detalhes](docs/projeto/requisitos/algoritmo-de-match.md) |
| **Cuidado com risco** | Respostas sobre autoagressão abrem um alerta para a equipe e mostram canais de apoio (CVV 188, SAMU 192), sem afetar o ranking |
| **Questionários versionados** | Perguntas definidas em código; cada resposta e cada recomendação guardam a versão usada |
| **Visual estilo Apple** | Tema claro/escuro, layout de app no celular, paleta derivada do logo com contraste AA. [Design system](docs/projeto/design-system.md) |
| **Segurança** | Cookies `httpOnly`, refresh automático, rate limit, DTOs validados, sem acesso a dados de outros usuários. [Detalhes](docs/projeto/seguranca.md) |

---

## Como rodar

Pré-requisitos: Node 18+ e MariaDB/MySQL rodando na porta 3306.

```bash
npm run install:all
```

Copie `.env.example` para `.env` **e** para `backend/.env` e ajuste a `DATABASE_URL` (usuário/senha do seu banco).

```bash
npm run setup
```

```bash
npm run dev
```

- App: http://localhost:5173
- API: http://localhost:3000/api — Swagger em http://localhost:3000/api/docs

**Já tinha o banco da versão anterior?** O modelo de dados do questionário mudou. Rode uma vez (apaga e recria o banco de desenvolvimento com os dados de demonstração):

```bash
npm run db:reset
```

### Testes

```bash
npm test
```

Cobre as regras do algoritmo de match: fórmula, pesos, cada filtro, fluxo de segurança e validação das respostas.

---

## Contas de demonstração

Senha de todas: `hopemind123`

| Perfil | E-mail |
|---|---|
| Paciente (questionário já respondido) | `paciente@hopemind.local` |
| Psicólogo — TCC, ansiedade/carreira, online e SP | `rafael@hopemind.local` |
| Outros perfis variados | `roberto@`, `camila@`, `felipe@`, `juliana@`, `beatriz@`, `thiago@` `hopemind.local` |

Os perfis foram montados para exercitar todos os filtros: há quem atenda só presencial, só de manhã, que não atenda certas demandas ou que encaminhe casos de risco.

---

## Estrutura

```text
hopemind/
├── backend/            API NestJS
│   ├── prisma/         schema e seed
│   └── src/
│       ├── auth/       cadastro, login, refresh, guard JWT
│       ├── triage/
│       │   ├── questionnaire/   questionários versionados + validação
│       │   └── match/           motor de match e fluxo de segurança (+ testes)
│       └── appointments/
├── frontend/           SPA React (Vite)
│   └── src/
│       ├── styles/     design system (tokens, base, componentes, layout)
│       ├── components/ AppShell, ui, QuestionField, BookingSheet, SafetyPanel
│       └── pages/
├── database/           scripts e DDL de referência
├── imagens/            logos e mascote originais
└── docs/
    ├── projeto/        documentação do HopeMind
    └── safemindlive/   metodologia da empresa
```

Documentação completa: [`docs/projeto/`](docs/projeto/README.md).
