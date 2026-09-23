# Database — HopeMind (PostgreSQL no Supabase)

Este diretório contém os scripts de automação, o DDL de referência e a documentação do banco de dados do **HopeMind** (Padrão SafeMindLive).

---

## Estrutura do Banco de Dados

- **SGBD**: PostgreSQL hospedado no [Supabase](https://supabase.com) (plano gratuito)
- **Schema**: `hopemind` (definido pelo `?schema=` da URL — outros projetos podem usar outros schemas no mesmo Supabase)
- **ORM**: Prisma ORM (schema em `backend/prisma/schema.prisma`)

```text
database/
├── README.md              # Este arquivo de documentação
├── scripts/               # Scripts automatizados de setup e migração
│   ├── setup.ps1          # Schema + seed (PowerShell)
│   ├── migrate.ps1        # Só o schema (PowerShell)
│   └── setup.sh           # Schema + seed (Bash)
└── sql/                   # DDL de referência (gerado pelo Prisma)
    └── hopemind_schema.sql
```

---

## Conectar ao Supabase

1. No painel do projeto, clique em **Connect → ORMs → Prisma**.
2. Copie as duas linhas (`DATABASE_URL` e `DIRECT_URL`) para `backend/.env`, trocando `[YOUR-PASSWORD]` pela senha do banco.
3. No fim das duas URLs, acrescente `schema=hopemind` (com `&` se já houver `?`, ou `?` se não houver).

| Variável | Porta | Para quê |
|---|---|---|
| `DATABASE_URL` | 6543 (pooler de transações, `pgbouncer=true`) | Consultas da API |
| `DIRECT_URL` | 5432 (conexão de sessão) | `prisma db push` (criar/alterar tabelas) |

> A conexão "Direct" (`db.<ref>.supabase.co`) só funciona em redes com IPv6. As URLs do **pooler** funcionam em qualquer rede.
> No plano gratuito, projetos sem uso por 7 dias são pausados; é só reativar no painel.

---

## Como Executar

### Banco novo (tabelas + dados de demonstração)
```bash
npm run setup
```

### Levar os dados de um banco para outro
```bash
npm run db:export -- D:/hopemind_backups/dados.json   # com o DATABASE_URL do banco de origem
npm run db:import -- D:/hopemind_backups/dados.json   # com o DATABASE_URL do destino (tabelas vazias)
```
Os ids são preservados, então contas, questionários e sessões continuam ligados. Foi assim que os dados do MariaDB local foram para o Supabase.

### Via scripts (PowerShell)
```powershell
.\database\scripts\setup.ps1
```
