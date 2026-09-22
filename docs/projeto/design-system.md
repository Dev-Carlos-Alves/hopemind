# Design System — Distac (marca do projeto)

Extende o padrão Prottus: [`docs/prottus/design-system.md`](../prottus/design-system.md).

Defaults de apps: [`padrao-aplicacoes.md`](padrao-aplicacoes.md).

**Fonte da marca:** logo oficial [`imagens/distac.png`](../../imagens/distac.png) (triângulo vermelho + DISTAC preto + faixa azul DISTRIBUIDORA).

Cores amostradas do logo: vermelho `#C02028`, azul `#60A0D8`, preto `#000000`, branco `#FFFFFF`.  
Hover/active da primária: derivados do vermelho da marca (declarado aqui).

## 1. Marca

| Token | Hex | Uso |
|-------|-----|-----|
| `--brand-primary` | `#C02028` | Ações primárias, CTAs, destaque (telhado do logo) |
| `--brand-primary-hover` | `#A01A20` | Hover (derivado da primária) |
| `--brand-primary-active` | `#801418` | Active (derivado da primária) |
| `--brand-secondary` | `#60A0D8` | Acentos, faixa DISTRIBUIDORA, links secundários |
| `--brand-secondary-hover` | `#4A8AC4` | Hover secundário (derivado) |
| `--brand-ink` | `#000000` | Títulos / wordmark DISTAC |

## 2. Superfícies

| Token | Hex | Uso |
|-------|-----|-----|
| `--header-bg` | `#FFFFFF` | Topbar profissional (logo legível) |
| `--header-text` | `#000000` | Texto do header |
| `--sidebar-bg` | `#1A2332` | Sidebar sóbria |
| `--sidebar-active-bg` | `#C02028` | Item ativo (primária) |
| `--page-bg` | `#F4F7FA` | Fundo da página |
| `--card-bg` | `#FFFFFF` | Cards / painéis |
| `--filter-bar-bg` | `#E8F1F8` | FilterBar (azul Distac claro) |
| `--table-header-bg` | `#60A0D8` | Header de tabela (secundária) |
| `--tile-bg` | `#FFFFFF` | Tiles |

Header com borda inferior sutil `--border-color` para separação profissional sem competir com o logo.

## 3. Texto, bordas e status

| Token | Hex |
|-------|-----|
| `--text-primary` | `#1A1A1A` |
| `--text-secondary` | `#4A5568` |
| `--text-muted` | `#718096` |
| `--border-color` | `#D0D7DE` |
| `--info-banner` | `#E8F1F8` |
| `--success` | `#2F9E44` |
| `--warning` | `#F59F00` |
| `--danger` | `#C02028` |
| `--info` | `#60A0D8` |
| `--neutral` | `#868E96` |

## 4. Tipografia

Padrão Prottus (tamanhos) + sans-serif moderna alinhada ao wordmark do logo.

| Token | Valor |
|-------|-------|
| `--font-family` | `"Source Sans 3", "Segoe UI", sans-serif` |
| `--font-size-body` | 14px |
| `--font-size-small` | 12px |
| `--font-size-title` | 16px |
| `--font-size-module` | 18px |

Títulos de módulo: **bold, UPPERCASE** (contrato Prottus).

## 5. Assets

| Item | Caminho |
|------|---------|
| Logo fonte | `imagens/distac.png` |
| Logo app | `frontend/public/assets/distac.png` |
| Tokens CSS | `frontend/src/styles/distac-tokens.css` |
| Uso | Login, header/shell, favicon se couber |
