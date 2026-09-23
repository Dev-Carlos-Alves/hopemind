# HopeMind

**Terapia que combina com você.** O HopeMind conecta pacientes a psicólogos com o estilo de atendimento, a experiência e a agenda mais compatíveis — com um algoritmo determinístico, explicável e que nunca trata respostas de risco como pontuação.

Projeto acadêmico da **SafeMindLive** · React + NestJS + PostgreSQL (Supabase) + Prisma · PWA.

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

Pré-requisitos: Node 18+ e um projeto gratuito no [Supabase](https://supabase.com) (o banco fica online, não precisa instalar nada).

```bash
npm run install:all
```

Copie `.env.example` para `.env` **e** para `backend/.env` e preencha `DATABASE_URL` e `DIRECT_URL` com as URLs do Supabase (passo a passo em [database/README.md](database/README.md)).

```bash
npm run setup
```

```bash
npm run dev
```

- App: http://localhost:5173
- API: http://localhost:3000/api — Swagger em http://localhost:3000/api/docs

**Atualizando de uma versão anterior?** Rode `npm run setup` de novo: ele adiciona as colunas novas (endereço/CEP) sem apagar nada e atualiza os dados de demonstração. Se preferir começar do zero (apaga o banco de desenvolvimento):

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
| Paciente — Graças (Recife), aceita online ou presencial | `paciente@hopemind.local` |
| Psicólogo — TCC, ansiedade/carreira, Espinheiro, online e presencial | `rafael@hopemind.local` |
| Outros 25 psicólogos | `roberto@`, `camila@`, `larissa@`, `marcelo@`, `sofia@`… `hopemind.local` (lista em `backend/prisma/seed.ts`) |

Todos os 26 psicólogos ficam no **Recife**, em 21 bairros diferentes, com CEPs reais (ViaCEP) e o centro de cada bairro (OpenStreetMap). Os perfis exercitam todos os filtros: há quem atenda só presencial, só de manhã, só crianças, que não atenda certas demandas ou que encaminhe casos de risco. A Ana recebe 22 matches (10 + “ver mais”) e 4 ficam de fora.

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
