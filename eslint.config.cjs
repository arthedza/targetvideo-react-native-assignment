const { defineConfig } = require('eslint/config');
const expo = require('eslint-config-expo/flat');
const prettier = require('eslint-config-prettier');
const simpleImportSort = require('eslint-plugin-simple-import-sort');
const reactPerf = require('eslint-plugin-react-perf');
const sonarjs = require('eslint-plugin-sonarjs');

module.exports = defineConfig([
  expo,
  prettier,
  {
    files: ['app/**/*.{ts,tsx}', 'src/**/*.{ts,tsx}'],
    ignores: ['**/__tests__/**'],
    plugins: { sonarjs, 'react-perf': reactPerf },
    rules: {
      ...Object.fromEntries(
        Object.entries(sonarjs.configs.recommended.rules).map(
          ([name, severity]) => [name, severity === 'off' ? 'off' : 'warn'],
        ),
      ),
      ...reactPerf.configs.flat.all.rules,
      'react/jsx-no-bind': [
        'error',
        { allowArrowFunctions: false, allowFunctions: false },
      ],
    },
  },
  {
    ignores: [
      'coverage/**',
      'dist/**',
      '.expo/**',
      'reports/**',
      '.scannerwork/**',
    ],
  },
  {
    plugins: { 'simple-import-sort': simpleImportSort },
    rules: {
      'simple-import-sort/imports': 'error',
      'simple-import-sort/exports': 'error',
      'max-lines': [
        'error',
        { max: 300, skipBlankLines: true, skipComments: true },
      ],
    },
  },
  {
    files: ['**/*.ts', '**/*.tsx'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-non-null-assertion': 'error',
      '@typescript-eslint/no-unused-vars': 'error',
    },
  },
]);
