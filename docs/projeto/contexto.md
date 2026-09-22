# Contexto do projeto — Distac

> Stack → [`especificacoes.md`](especificacoes.md) · Segurança → [`seguranca.md`](seguranca.md) · Escala → [`escalabilidade.md`](escalabilidade.md)

## Objetivo

Sistema de vendas internas da **Distribuidora Distac** (Prottus). Distribuição de material de construção em Pernambuco; clientes do negócio são lojas. Vendedores internos registram e acompanham vendas de forma **simples, completa, segura** e **preparada para crescer conforme o contexto**.

Este repositório é também a **base operacional** Prottus para novos projetos na mesma stack — ver [`USAR-COMO-BASE.md`](USAR-COMO-BASE.md).

## Usuários

- **Vendedor interno:** pedidos, clientes, produtos.
- Outros perfis: confirmar em DOP se necessário.

## Escopo

- Login (JWT httpOnly)
- CRUD `cliente`, `produto`, `pedido` + `pedido_item`
- Listagens paginadas e dashboard summary
- Integridade/auditoria no PostgreSQL
- Testes de segurança e carga

## Fora de escopo

- Tabelas de negócio além das quatro (exceto `user` / `audit_log` de plataforma)
- Integrações ERP/fiscal/estoque/e-commerce
- App do lojista final
- Financeiro / logística / CRM ampliado

## Onde ler o quê

| Assunto | Arquivo |
|---------|---------|
| **Domínio técnico (tech lead)** | [`DOMINIO-TECNICO.md`](DOMINIO-TECNICO.md) |
| Metodologia Prottus | [`docs/prottus/metodologia.md`](../prottus/metodologia.md) |
| Specs técnicas | [`especificacoes.md`](especificacoes.md) |
| **Segurança** | [`seguranca.md`](seguranca.md) |
| **Escalabilidade** | [`escalabilidade.md`](escalabilidade.md) |
| Usar como base | [`USAR-COMO-BASE.md`](USAR-COMO-BASE.md) |
| Marca | [`design-system.md`](design-system.md) |
| Domínio de negócio | [`mapa-entidades.md`](mapa-entidades.md) |
| Requisitos | [`requisitos/requisito.md`](requisitos/requisito.md) |
| Status | [`modulos/STATUS_PROTOTIPO.md`](modulos/STATUS_PROTOTIPO.md) |
| Banco | [`../../database/`](../../database/) |
| Testes | [`../../tests/`](../../tests/) |
