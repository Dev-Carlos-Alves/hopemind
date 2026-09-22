# Database — HopeMind (MariaDB / MySQL)

Este diretório contém os scripts de automação, dumps SQL de referência e documentação do banco de dados do **HopeMind** (Padrão SafeMindLive).

---

## Estrutura do Banco de Dados

- **SGBD**: MariaDB / MySQL (Porta `3306`)
- **Database**: `hopemind`
- **ORM**: Prisma ORM (Schema em `backend/prisma/schema.prisma`)

```text
database/
├── README.md              # Este arquivo de documentação
├── scripts/               # Scripts automatizados de setup e migração
│   ├── setup.ps1          # Setup do banco e seed (PowerShell)
│   ├── migrate.ps1        # Push do schema Prisma no MariaDB
│   ├── setup.sh           # Setup Bash (Linux/macOS)
│   └── migrate.sh         # Migration Bash
└── sql/                   # Dumps SQL de referência
    └── hopemind_schema.sql
```

---

## Como Executar

### Opção 1: Via Scripts da Raiz
```bash
npm run setup      # Aplica o schema no MariaDB e executa o seed
```

### Opção 2: Via Scripts do Banco (PowerShell)
```powershell
.\database\scripts\setup.ps1
```
