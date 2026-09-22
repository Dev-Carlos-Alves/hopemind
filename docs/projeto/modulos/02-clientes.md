# 02 — Clientes

## Objetivo

Gerenciar lojas clientes da Distribuidora Distac.

## Tela

- `/clientes` — `FilterBar`, `DataTable` paginada e modal para criar ou editar.

## API

`GET`, `POST` `/api/clients`; `GET`, `PATCH`, `DELETE` `/api/clients/:id`.

## Campos

- Nome*, documento (CNPJ/CPF)*, telefone, e-mail, cidade, UF e ativo*.

## Regras

- `document` é único e normalizado.
- Listagem usa paginação, busca e campos existentes no formulário.
- Exclusão lógica define `active = false`, preservando pedidos históricos.
- O status ATIVO/INATIVO aparece tanto ao criar quanto ao editar.
