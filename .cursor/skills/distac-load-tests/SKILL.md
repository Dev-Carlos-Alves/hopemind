---
name: distac-load-tests
description: >-
  Runs Distac load/security tests at smoke, normal, or heavy levels and
  interprets PASS/FAIL, 401, Helmet, latency, and 429 rate limits. Use when
  the user asks to test, load test, stress, smoke test, or validate security
  checks from the terminal.
---

# Distac — testes smoke / normal / heavy

## Pré-requisito

API no ar: `cd backend && npm run start:dev`  
Health: `http://127.0.0.1:3000/api/health`

## Comandos (raiz do repo)

```bash
node tests/load/run-node.mjs smoke
node tests/load/run-node.mjs normal
node tests/load/run-node.mjs heavy
```

| Nível | VUs | Duração | Uso |
|-------|-----|---------|-----|
| smoke | 5 | 5s | Gate rápido |
| normal | 20 | 12s | Baseline |
| heavy | 50 | 25s | Stress |

## Como ler o terminal

1. Health  
2. Auth sem cookie → **401** (se **429** residual após outros testes: script aguarda; não falha se não houver **200**)  
3. Helmet `nosniff`  
4. Sessões JWT  
5. Carga (p50/p95, ok/fail/429, por rota)  
6. Rate limit login (≥1× 429)  
7. Resumo PASS/FAIL  

**429 na carga = proteção (Throttler), não bug de app.**  
**fail** = erro HTTP ≠ 429 (ex.: 500).

## Depois de smoke/normal

Heavy pode ver 429 residual no check de auth — esperado; o runner trata.

## Doc

`tests/README.md`
