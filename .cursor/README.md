# Pasta `.cursor/` — Distac (base Prottus)

Tudo aqui **viaja com o repositório**: quem clona já herda rules + skills do projeto.

Este é o **modelo Cursor** do repositório. Não há pasta `.vscode/` — o time trabalha no Cursor; governança do agente fica só em `.cursor/`.

| Caminho | Escopo |
|---------|--------|
| `rules/prottus/*` | Metodologia Prottus — **não editar** |
| `rules/projeto/distac.mdc` | Regras Distac (always on) — segurança, escala, stack |
| `skills/*` | Skills do projeto — fluxos essenciais do agente |
| `agents/cursor-cadu.md` | Log de sessões |

## Rules vs Skills

| | **Rules** (`.cursor/rules/`) | **Skills** (`.cursor/skills/`) |
|--|------------------------------|--------------------------------|
| Papel | Normas persistentes / restrições | Como **executar** um fluxo |
| Quando | Sempre ou por glob | Quando a descrição casar com o pedido |
| Exemplo | “JWT nunca no localStorage” | “Subir local: setup → migrate → API → UI” |

## Skills deste repo

| Skill | Uso |
|-------|-----|
| `distac-local-run` | Subir Postgres, migrate, API, UI |
| `distac-add-crud` | Novo CRUD Nest + React no padrão Distac |
| `distac-security` | Auth, cookies, Helmet, rate limit, audit |
| `distac-database` | Prisma, triggers, seed, scripts |
| `distac-load-tests` | smoke / normal / heavy |
| `distac-tech-lead-context` | Domínio técnico / reunião / onboarding |
| `prottus-base-from-distac` | Novo cliente a partir desta base |

Cada skill: `.cursor/skills/<nome>/SKILL.md`.

## Docs

`docs/projeto/DOMINIO-TECNICO.md` · `seguranca.md` · `escalabilidade.md` · `USAR-COMO-BASE.md`
