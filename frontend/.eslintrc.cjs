module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended', 'plugin:react-hooks/recommended'],
  ignorePatterns: ['dist', 'coverage', 'playwright-report', 'test-results', '.eslintrc.cjs'],
  parser: '@typescript-eslint/parser',
  plugins: ['react-refresh'],
  rules: {
    'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
  },
  overrides: [
    // Tests and tooling run in Node (fs, path, __dirname).
    { files: ['**/*.test.{ts,tsx}', 'e2e/**/*.ts', '*.config.ts', 'src/test/**/*.ts'], env: { node: true } },
    // Context modules export their hook next to the provider, and ui.tsx shares small helpers.
    { files: ['src/context/*.tsx', 'src/components/ui.tsx'], rules: { 'react-refresh/only-export-components': 'off' } },
  ],
};
