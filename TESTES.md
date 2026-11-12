# Testes do HopeMind

Implementação do **Plano e Projeto de Teste (v1.1)**. Nenhum teste automatizado usa o banco real do
Supabase: a API é testada com um banco simulado em memória, e a web, com respostas simuladas.

## API (`backend/`)

| Comando | O que roda |
|---|---|
| `npm run lint` | ESLint (TypeScript) |
| `npm run typecheck` | Verificação de tipos (código e testes) |
| `npm test` | Testes unitários (Jest): motor de match, protocolo de segurança, distância, CEP (ViaCEP/BrasilAPI/Nominatim simulados), DTOs, cookies e cascata do schema |
| `npm run test:cov` | Unitários + cobertura (mínimo de 80% de linhas nos módulos de regra de negócio) |
| `npm run test:e2e` | Integração HTTP (Jest + Supertest): autenticação, segurança, triagem, match e agendamento |

Teste de carga (k6), **só na homologação**:

```bash
k6 run -e BASE_URL=https://<api-de-homologacao>/api -e EMAIL=<paciente> -e PASSWORD=<senha> backend/test/load/k6-matches.js
```

(no ambiente de homologação, defina `THROTTLE_LIMIT` alto, porque o k6 envia tudo de um único IP).

## Web (`frontend/`)

| Comando | O que roda |
|---|---|
| `npm run lint` | ESLint (React + TypeScript) |
| `npm run typecheck` | Verificação de tipos |
| `npm test` / `npm run test:cov` | Componentes e serviços (Vitest + Testing Library) |
| `npm run test:e2e` | Build + Playwright: responsividade em 360px, 768px e 1440px (usa o Edge instalado no Windows) |

## App Android (`hopemind-android-app`)

```bash
./gradlew testDebugUnitTest
```

Testes unitários (JUnit) e capturas de tela (Robolectric + Roborazzi, em `app/build/outputs/roborazzi`).

## CI

`.github/workflows/ci.yml` roda tudo acima (exceto o k6) em cada Pull Request e push na `main`.
`.github/workflows/smoke.yml` confere `GET /api/health` da produção depois de cada deploy.
