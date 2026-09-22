# Diretivas Antigravity — HopeMind (Empresa SafeMindLive)

Este repositório segue rigorosamente o padrão de desenvolvimento da **SafeMindLive**. Todas as interações do assistente Antigravity devem obedecer a este contrato de engenharia.

---

## 1. Documentação Mestra e Leitura Obrigatória

Antes de implementar qualquer funcionalidade ou realizar refatorações no HopeMind:
- **Metodologia & Qualidade**: `docs/safemindlive/metodologia.md`
- **Design System UI/UX**: `docs/safemindlive/design-system.md` e `docs/projeto/design-system.md`
- **Arquitetura Web & Monólito Modular**: `docs/projeto/ARQUITETURA-WEB.md`
- **Mapa de Entidades (MariaDB/MySQL via Prisma)**: `docs/projeto/mapa-entidades.md`
- **Segurança (JWT httpOnly Cookies + Helmet)**: `docs/projeto/seguranca.md`

---

## 2. Contrato de Código e Linguagem

- **Código e Banco de Dados em Inglês**: Nomes de tabelas, entidades, variáveis, DTOs, controllers, serviços e rotas em inglês (ex.: `users`, `patients`, `psychologists`, `triage`, `appointments`, `audit_logs`).
- **UI/UX e Documentação de Negócio em Português (pt-BR)**: Labels, títulos, mensagens de erro, botões e documentação do produto em português.
- **Zero Emojis na Interface**: Utilizar exclusivamente ícones vetoriais SVG (`<Icon name="..." />`). Emojis são expressamente proibidos em componentes de interface do produto.
- **Títulos de Módulo**: Títulos de seção/módulo sempre em **UPPERCASE bold**.
- **Controles de Interface (Densidade SafeMindLive)**: Botões e inputs com altura padrão de **32px**.

---

## 3. Segurança & Autenticação

- **JWT em Cookies httpOnly**: `access_token` (15 min) e `refresh_token` (7 dias) armazenados exclusivamente via cookies `httpOnly` configurados pela API NestJS. **Proibido** salvar tokens JWT em `localStorage` ou `sessionStorage`.
- **JwtAuthGuard Global**: Todos os endpoints exigem autenticação por padrão (`APP_GUARD`). Endpoints abertos devem ser expressamente anotados com o decorator `@Public()`.
- **Comando Único**: Inicialização unificada de backend e frontend através de `npm run dev`.
