# Design System — Padrão SafeMindLive

Documento **mestre de UI/UX da empresa SafeMindLive**. Define padrões de interface reutilizáveis para a plataforma HopeMind.

A **marca do cliente / produto** (cores, logo SafeMindLive, tokens hex) fica em `docs/projeto/design-system.md` e **deve** estender este padrão.

---

## 1. Princípios Visuais SafeMindLive

- Tokens via CSS `var(--...)` — nunca hardcode de cor em componentes novos
- **Zero emojis na UI de produto** — apenas componente `Icon` (SVG outline)
- Títulos de módulo: **bold, UPPERCASE**
- Labels de formulário: tamanho pequeno, cor secundária
- Altura padrão de botões e inputs: **32px (Densidade SafeMindLive)**
- Fidelidade à marca SafeMindLive / HopeMind nos tokens `--brand-*`

---

## 2. Tokens Obrigatórios (Contrato)

Todo projeto SafeMindLive deve definir os seguintes tokens:

| Token | Uso |
|-------|-----|
| `--brand-primary` / `-hover` / `-active` | Ações primárias, item ativo (#2E7D32) |
| `--brand-secondary` | Acentos secundários (#4CAF50) |
| `--header-bg` / `--header-text` | Topbar (#1B3B2B / #FFFFFF) |
| `--sidebar-bg` / `--sidebar-active-bg` | Sidebar (#15291F / #2E7D32) |
| `--page-bg` / `--card-bg` | Superfícies (#F4F6F5 / #FFFFFF) |
| `--filter-bar-bg` / `--table-header-bg` | Listagens (#EAF2EC / #E8F5E9) |
| `--text-primary` / `--secondary` / `--muted` | Tipografia (#1C2B23 / #556B60) |
| `--border-color` | Bordas (#D2E0D7) |
| `--success` / `--warning` / `--danger` / `--info` | Status |

---

## 3. Tipografia Padrão

| Token | Valor |
|-------|-------|
| `--font-family` | 'Inter', sans-serif |
| `--font-size-body` | 14px |
| `--font-size-small` | 12px |
| `--font-size-title` | 16px |
| `--font-size-module` | 18px |

---

## 4. Componentes Obrigatórios

- **Botões (`.btn`)**: Altura 32px, `btn-primary`, `btn-secondary`, `btn-outline`.
- **FilterBar (`.filter-bar`)**: Barra de pesquisa e filtros por especialidade.
- **DataTable (`.data-table`)**: Tabela de dados com header estilizado.
- **Icon (`Icon.tsx`)**: Ícones vetoriais SVG (sem emojis).
- **Layout Shell (`.app-shell`)**: Header corporativo SafeMindLive + Sidebar lateral.
