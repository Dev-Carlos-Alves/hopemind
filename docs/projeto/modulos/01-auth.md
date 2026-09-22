# 01 — Auth / Login

## Objetivo

Autenticar vendedores internos sem expor tokens ao JavaScript.

## Tela

- `/login` — formulário público, sem credenciais pré-preenchidas e sem navegação autenticada.

## API

| Método | Endpoint |
|---|---|
| POST | `/api/auth/login` |
| POST | `/api/auth/logout` |
| POST | `/api/auth/refresh` |
| GET | `/api/auth/me` |

## Regras

- Access e refresh JWT são cookies `httpOnly`; nunca usar `localStorage`.
- `JwtAuthGuard` é global; estas rotas e health são públicas apenas por `@Public()`.
- Usuário inativo não autentica nem renova sessão.
- Login e refresh têm limite de requisições.
- O frontend envia `credentials: 'include'` e tenta refresh uma única vez diante de 401.
