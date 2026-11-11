import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

/* ───── fake API (synthetic data only) ───── */

const PATIENT = { id: 1, name: 'Paciente Sintético', email: 'paciente@teste.dev', userType: 'PATIENT', patient: { id: 1 }, psychologist: null, hasTriage: true, city: 'Recife', neighborhood: 'Graças' };

const match = (id: number, band: 'alta' | 'boa' | 'possivel', score: number) => ({
  psychologistId: id,
  score,
  band,
  components: { demanda: 0.9, estilo: 0.8, localizacao: 0.7, experiencia: 0.8, relacao: 0.7, disponibilidade: 1, preferencias: 0.5 },
  distanceKm: id * 1.3,
  reasons: ['Atende ansiedade e trabalho, suas prioridades', 'Estilo acolhedor, como você prefere', 'Horários compatíveis com a sua agenda'],
  considerations: ['Atende somente online'],
  psychologist: {
    id,
    name: `Dra. Psicóloga Sintética de Nome Bem Comprido ${id}`,
    crp: `CRP 02/1234${id}`,
    specialty: 'Psicologia clínica',
    approaches: ['Terapia Cognitivo-Comportamental', 'Aceitação e Compromisso'],
    biography: 'Atende adultos com ansiedade, estresse no trabalho e dificuldades de sono, com abordagem estruturada e acolhedora.',
    sessionFee: '150.00',
    modalities: ['online', 'presencial'],
    neighborhood: 'Espinheiro',
    city: 'Recife',
  },
});

const MATCHES = {
  algorithmVersion: 'hm-match-1.1.0',
  questionnaireVersion: 'test',
  safety: { level: 'NONE', resources: [] },
  evaluated: 12,
  modality: 'tanto_faz',
  location: { neighborhood: 'Graças', city: 'Recife' },
  excluded: { modalidade: 2 },
  results: [match(1, 'alta', 0.82), match(2, 'boa', 0.66), match(3, 'possivel', 0.48)],
};

async function mockApi(page: Page, loggedIn: boolean) {
  await page.route('**/api/**', (route) => {
    const path = new URL(route.request().url()).pathname.replace(/^\/api/, '');
    if (!loggedIn) return route.fulfill({ status: 401, json: { message: 'Não autenticado' } });
    if (path === '/auth/me') return route.fulfill({ json: PATIENT });
    if (path === '/matches') return route.fulfill({ json: MATCHES });
    if (path === '/triage/me') return route.fulfill({ json: { submittedAt: '2026-11-10T12:00:00.000Z', answers: {} } });
    if (path === '/sessoes') return route.fulfill({ json: [{ id: 1, dataHora: '2030-01-10T19:00:00.000Z', status: 'SCHEDULED', psicologoNome: 'Dra. Sintética', pacienteNome: 'Paciente Sintético', especialidade: 'Clínica', crp: 'CRP 02/12345' }] });
    return route.fulfill({ json: {} });
  });
}

/* ───── checks ───── */

async function expectNoHorizontalScroll(page: Page) {
  const { scrollWidth, innerWidth } = await page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, innerWidth: window.innerWidth }));
  expect(scrollWidth, 'a página não pode ter rolagem horizontal').toBeLessThanOrEqual(innerWidth);
}

async function expectReadableBaseText(page: Page) {
  const sizes = await page.evaluate(() => {
    const px = (el: Element) => parseFloat(getComputedStyle(el).fontSize);
    const body = px(document.body);
    const inputs = [...document.querySelectorAll('input, select, textarea')].filter((el) => (el as HTMLElement).offsetParent).map(px);
    // Body copy only: footnotes, captions and field hints (13px/12px) are the design
    // system's secondary text — hints, metadata — and are not "texto base".
    const small = [...document.querySelectorAll('main p, form p')]
      .filter((el) => (el as HTMLElement).offsetParent && el.textContent!.trim().length > 40)
      .filter((el) => !el.closest('.t-footnote, .t-caption, .field__hint') && px(el) < 14)
      .map((el) => `${px(el)}px .${el.className} "${el.textContent!.trim().slice(0, 50)}"`);
    return { body, inputs, small };
  });
  expect(sizes.body, 'texto base').toBeGreaterThanOrEqual(14);
  for (const s of sizes.inputs) expect(s, 'campos de formulário (evita zoom automático no celular)').toBeGreaterThanOrEqual(16);
  expect(sizes.small, 'parágrafos de conteúdo abaixo de 14px').toEqual([]);
}

async function expectTouchTargets(page: Page) {
  const small = await page.evaluate(() =>
    [...document.querySelectorAll('button, [role="button"], input[type="submit"], a.btn')]
      .filter((el) => (el as HTMLElement).offsetParent && getComputedStyle(el).visibility !== 'hidden')
      .map((el) => {
        const r = el.getBoundingClientRect();
        return { label: (el.getAttribute('aria-label') || el.textContent || el.tagName).trim().slice(0, 40), w: Math.round(r.width), h: Math.round(r.height) };
      })
      .filter((b) => b.w < 44 || b.h < 44),
  );
  expect(small, 'botões com área de toque menor que 44×44 px').toEqual([]);
}

/* ───── scenarios ───── */

const PUBLIC = [
  { name: 'login', path: '/login', ready: 'button[type="submit"]' },
  { name: 'cadastro', path: '/registro', ready: 'button[type="submit"]' },
];
const PRIVATE = [
  { name: 'início', path: '/inicio', ready: 'main' },
  { name: 'matches', path: '/matches', ready: 'text=Alta compatibilidade' },
  { name: 'consultas', path: '/consultas', ready: 'main' },
];

for (const p of PUBLIC) {
  test(`página de ${p.name} é responsiva`, async ({ page }) => {
    await mockApi(page, false);
    await page.goto(p.path);
    await page.locator(p.ready).first().waitFor();
    await expectNoHorizontalScroll(page);
    await expectReadableBaseText(page);
    await expectTouchTargets(page);
  });
}

for (const p of PRIVATE) {
  test(`tela de ${p.name} (paciente logado) é responsiva`, async ({ page }) => {
    await mockApi(page, true);
    await page.goto(p.path);
    await page.locator(p.ready).first().waitFor();
    await page.waitForLoadState('networkidle');
    await expectNoHorizontalScroll(page);
    await expectReadableBaseText(page);
  });
}

test('rotas protegidas levam ao login quando não há sessão', async ({ page }) => {
  await mockApi(page, false);
  await page.goto('/matches');
  await expect(page).toHaveURL(/\/login$/);
});
