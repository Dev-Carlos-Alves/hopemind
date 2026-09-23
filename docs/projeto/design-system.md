# Design system — HopeMind

Inspirado nas Human Interface Guidelines da Apple: tipografia grande e confiante, muito respiro, superfícies translúcidas, cantos arredondados e movimento suave. Tudo em CSS puro, sem dependências.

Arquivos: [`frontend/src/styles/`](../../frontend/src/styles/) — `tokens.css` (cores, tipos, espaçamento), `base.css`, `components.css`, `layout.css`. Componentes React em [`components/ui.tsx`](../../frontend/src/components/ui.tsx).

## Cores

A paleta vem do próprio logo:

| Token | Claro | Escuro | Origem / uso |
|---|---|---|---|
| `--tint` | `#3A7733` | `#8FCB7A` | Sálvia das mãos — ações, seleção, links |
| `--sand` / `--sand-label` | `#E9C987` / `#8B6420` | `#E8C37E` | Cérebro — destaques e "boa compatibilidade" |
| `--peach` / `--peach-label` | `#F2B173` / `#9A5418` | `#F4BD8A` | Mascote — acolhimento, painel de apoio |
| `--bg` / `--bg-elevated` | `#F5F5F7` / `#FFFFFF` | `#000000` / `#1C1C1E` | Fundo agrupado e cartões |
| `--label` / `--label-2` | `#1D1D1F` / `#6E6E73` | `#F5F5F7` / `#A1A1A6` | Texto principal e secundário |

Todos os pares de texto/fundo passam em **WCAG AA (≥ 4,5:1)**. O tema segue o sistema e pode ser forçado em *Ajustes → Aparência*.

## Tipografia

Fonte do sistema (SF Pro no Apple, Inter como fallback) com a escala da HIG:

| Classe | Tamanho | Uso |
|---|---|---|
| `.t-large-title` | 34 px (30 no celular) | Título da página |
| `.t-title-1/2/3` | 28 / 22 / 20 px | Seções e cartões |
| `.t-headline` | 17 px semibold | Nomes, rótulos fortes |
| `.t-callout` / `.t-subhead` / `.t-footnote` | 15 / 14 / 13 px | Texto de apoio |

Títulos usam espaçamento negativo (−0,02 a −0,035 em) como na Apple.

## Componentes

| Componente | Onde |
|---|---|
| Botões em pílula: `filled`, `tinted`, `gray`, `plain`, `danger` | `Button` |
| Campo com rótulo flutuante (estilo Apple ID), senha com mostrar/ocultar | `TextField`, `PasswordField`, `SelectField` |
| Segmented control com trilho animado e navegação por setas | `Segmented` |
| Lista agrupada (estilo Ajustes do iOS) | `.group`, `.list-row` |
| Sheet: diálogo no desktop, bottom sheet com alça no celular | `Sheet` |
| Toasts no lugar de `alert()` | `useToast` |
| Skeletons no lugar de "Carregando..." | `Skeleton` |
| Avatar com iniciais e gradiente derivado do nome | `Avatar` |
| Chips, escala 1–5, grade semanal, matriz | `QuestionField` |

## Layout

- **Desktop:** barra lateral translúcida (264 px) + conteúdo até 1080 px.
- **Celular (< 900 px):** barra superior translúcida + **tab bar** inferior, respeitando a área segura do iPhone.
- Animações de entrada curtas (`rise-in`), desligadas com `prefers-reduced-motion`.

## Regras

- Sem emojis na interface; ícones SVG de traço (`Icon.tsx`).
- Nunca mostrar compatibilidade como porcentagem — usar faixa + razões.
- Texto em português, direto e acolhedor; evitar jargão clínico.
