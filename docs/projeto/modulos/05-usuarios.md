# 05 — Usuários

## Objetivo

Gerenciar vendedores internos que acessam o sistema.

## Tela

- `/usuarios` — `FilterBar`, `DataTable` paginada e modal para criar ou editar.

## API

`GET`, `POST` `/api/users`; `GET`, `PATCH`, `DELETE` `/api/users/:id`.

## Campos

- Nome*, e-mail*, senha* no cadastro (opcional na edição) e ativo*.

## Regras

- E-mail é único e armazenado normalizado.
- Senhas são hasheadas com bcrypt e nunca retornadas pela API ou auditoria.
- Usuário inativo não autentica; a remoção é lógica (`active = false`).
- Controle de status disponível ao criar e editar.
