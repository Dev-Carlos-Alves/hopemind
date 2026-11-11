import { defineConfig, devices } from '@playwright/test';

/**
 * Testes E2E de responsividade (Plano e Projeto de Teste, 1.1 — RNF-003).
 * Rodam contra o build de produção servido pelo `vite preview`; a API é simulada com
 * page.route, então nenhum dado real é usado.
 *
 * Local (Windows): usa o Microsoft Edge já instalado (sem baixar navegador).
 * CI: usa o Chromium do Playwright (`npx playwright install --with-deps chromium`).
 */
const channel = process.env.CI ? undefined : process.env.PW_CHANNEL ?? 'msedge';
const PORT = 4173;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    channel,
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'mobile-360', use: { ...devices['Desktop Chrome'], channel, viewport: { width: 360, height: 740 }, isMobile: false, hasTouch: true } },
    { name: 'tablet-768', use: { ...devices['Desktop Chrome'], channel, viewport: { width: 768, height: 1024 } } },
    { name: 'desktop-1440', use: { ...devices['Desktop Chrome'], channel, viewport: { width: 1440, height: 900 } } },
  ],
  webServer: {
    command: `npx vite preview --host 127.0.0.1 --port ${PORT} --strictPort`,
    url: `http://127.0.0.1:${PORT}/login`,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
