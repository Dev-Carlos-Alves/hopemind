# 01 — Login (auth)

| Campo | Valor |
|-------|-------|
| App / rota | `/login` |
| Família catálogo | Blank / segurança (equivalência Scriptcase) |
| Módulo | Auth |
| Status | OK (scaffold Gate) |

## Objetivo

Autenticar vendedor interno com JWT (access + refresh) em cookies **httpOnly**.

## Regras

- Validação de e-mail e senha (mín. 6)
- Cookies: `access_token`, `refresh_token`
- Endpoints: `POST /api/auth/login`, `POST /api/auth/refresh`, `POST /api/auth/logout`, `GET /api/auth/me`
- Marca: logo `imagens/distac.png` / `frontend/public/assets/distac.png`

## Usuário seed (protótipo)

- E-mail: `vendedor@distac.local`
- Senha: `distac123` (apenas ambiente local)

## Desvios

Nenhum.
