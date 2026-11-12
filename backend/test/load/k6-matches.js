/**
 * Teste de carga do matchmaking (Plano e Projeto de Teste, seção 2.3 — RNF-002 / RNF-006).
 *
 * Executar SOMENTE contra a homologação, nunca contra a produção:
 *   k6 run -e BASE_URL=https://<api-de-homologacao>/api -e EMAIL=<paciente-do-seed> -e PASSWORD=<senha> backend/test/load/k6-matches.js
 *
 * Pré-requisitos no ambiente de homologação:
 *   - banco com o seed (npm run seed) e um paciente com triagem respondida;
 *   - THROTTLE_LIMIT alto (ex.: 100000), porque todo o tráfego sai de um único IP.
 *
 * Metas: p95 de GET /api/matches < 2,5 s, p99 < 3,0 s e menos de 1% de erros 5xx.
 */
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000/api';
const serverErrors = new Rate('server_errors');

export const options = {
  scenarios: {
    rampa: {
      executor: 'ramping-vus',
      startVUs: 1,
      stages: [
        { duration: '1m', target: 20 },
        { duration: '2m', target: 50 },
        { duration: '1m', target: 100 },
        { duration: '30s', target: 0 },
      ],
    },
  },
  thresholds: {
    'http_req_duration{endpoint:matches}': ['p(95)<2500', 'p(99)<3000'],
    server_errors: ['rate<0.01'],
    checks: ['rate>0.99'],
  },
};

/** One login for the whole run; every virtual user reuses the session cookie. */
export function setup() {
  const res = http.post(`${BASE_URL}/auth/login`, JSON.stringify({ email: __ENV.EMAIL, password: __ENV.PASSWORD }), {
    headers: { 'Content-Type': 'application/json' },
  });
  if (res.status !== 200) throw new Error(`login falhou: HTTP ${res.status}`);
  const access = res.cookies.access_token && res.cookies.access_token[0];
  return { cookie: `access_token=${access.value}` };
}

export default function (data) {
  const res = http.get(`${BASE_URL}/matches`, { headers: { Cookie: data.cookie }, tags: { endpoint: 'matches' } });
  serverErrors.add(res.status >= 500);
  check(res, {
    'status 200': (r) => r.status === 200,
    'traz recomendações ordenadas': (r) => {
      const results = r.json('results') || [];
      return results.every((x, i) => i === 0 || results[i - 1].score >= x.score);
    },
  });
  sleep(1);
}
