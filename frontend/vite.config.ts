/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: '127.0.0.1',
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3000',
        changeOrigin: true,
      },
    },
  },
  // Vitest (Plano e Projeto de Teste, 1.1): component and unit tests in jsdom.
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    css: false,
    coverage: {
      provider: 'v8',
      include: ['src/services/**', 'src/components/CepField.tsx', 'src/components/SafetyPanel.tsx', 'src/components/QuestionnaireForm.tsx'],
      reporter: ['text', 'html'],
    },
  },
});
