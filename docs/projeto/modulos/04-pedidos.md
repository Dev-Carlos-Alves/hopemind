# 04 — Pedidos

## Objetivo

Registrar e acompanhar vendas internas com itens de pedido.

## Tela

- `/pedidos` — listagem paginada, filtro por status e modal com cabeçalho e itens embutidos.

## API

`GET`, `POST` `/api/orders`; `GET`, `PATCH`, `DELETE` `/api/orders/:id`.

## Campos

- Número gerado, cliente*, vendedor da sessão, status*, observações, data e total calculado.
- Itens: produto*, quantidade*, preço unitário e total de linha calculado.

## Regras

- Status: `DRAFT`, `CONFIRMED` ou `CANCELLED`.
- O pedido contém ao menos um item; não existe CRUD isolado de `order_items`.
- O cliente e os produtos devem estar ativos.
- Cancelar preserva o histórico e impede edição posterior.
- `order_items.line_total` e `orders.total` têm o PostgreSQL como fonte de verdade, via triggers `fn_order_*`; a API relê o pedido depois da escrita.
