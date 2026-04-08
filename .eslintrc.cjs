/* eslint-disable */
// This config is used by the CI lint job.
// Plugins are installed at CI time (not in package.json) to keep the dev bundle lean.
module.exports = {
  root: true,
  env: {
    browser: true,
    es2020: true,
  },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:react/jsx-runtime',
    'plugin:react-hooks/recommended',
  ],
  plugins: [
    '@typescript-eslint',
    'react',
    'react-hooks',
    'react-refresh',
    'no-secrets',
  ],
  settings: {
    react: { version: 'detect' },
  },
  rules: {
    // ── Security rules ───────────────────────────────────────────────────────
    // Detect high-entropy strings that look like embedded credentials/tokens.
    // tolerance 4.2 = aggressive (lower = more sensitive). Adjust if noisy.
    'no-secrets/no-secrets': ['error', { tolerance: 4.2 }],

    // Disallow eval and dynamic code execution
    'no-eval': 'error',
    'no-implied-eval': 'error',
    'no-new-func': 'error',

    // Disallow __proto__ and prototype mutation
    'no-proto': 'error',
    'no-extend-native': 'error',

    // Disallow console.log (can leak data; use a proper logger)
    'no-console': ['warn', { allow: ['warn', 'error'] }],

    // ── TypeScript rules ─────────────────────────────────────────────────────
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-non-null-assertion': 'warn',

    // ── React rules ──────────────────────────────────────────────────────────
    'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],

    // Disallow dangerouslySetInnerHTML (XSS vector)
    'react/no-danger': 'error',
    'react/no-danger-with-children': 'error',

    // Hook rules (logic correctness)
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',
  },
  ignorePatterns: ['dist/', 'node_modules/', '*.config.js', '*.config.ts', 'postcss.config.cjs'],
}
