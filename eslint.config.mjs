import baseConfig from '@remotehask/shared-config/eslint/base';
import nextPlugin from '@next/eslint-plugin-next';

/** @type {import('eslint').Linter.Config[]} */
export default [
  {
    ignores: ['apps/backend/scripts/**', 'apps/backend/openapi.json'],
  },
  ...baseConfig,
  {
    files: ['apps/backend/**/*.ts'],
    rules: {
      '@typescript-eslint/no-extraneous-class': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
    },
  },
  {
    files: ['apps/frontend/**/*.{ts,tsx}'],
    plugins: {
      '@next/next': nextPlugin,
    },
    settings: {
      next: {
        rootDir: 'apps/frontend',
      },
    },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs['core-web-vitals'].rules,
      'import/no-default-export': 'off',
    },
  },
];
