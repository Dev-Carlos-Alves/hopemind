# 03 — Produtos

## Objetivo

Gerenciar o catálogo de materiais distribuídos pela Distac.

## Tela

- `/produtos` — `FilterBar`, `DataTable` paginada e modal para criar ou editar.

## API

`GET`, `POST` `/api/products`; `GET`, `PATCH`, `DELETE` `/api/products/:id`.

## Campos

- SKU*, nome*, unidade*, preço* e ativo*.

## Regras

- `sku` é único; unidade e SKU são normalizados.
- Preço é decimal não negativo.
- Exclusão lógica define `active = false`, sem romper itens de pedidos.
- O status ATIVO/INATIVO existe no cadastro e na edição.
