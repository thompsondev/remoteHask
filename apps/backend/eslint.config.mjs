import nestConfig from '@remotehask/shared-config/eslint/nest';

/** @type {import('eslint').Linter.Config[]} */
export default [
  ...nestConfig,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    files: ['test/**/*.ts'],
    languageOptions: {
      parserOptions: {
        project: './tsconfig.test.json',
        projectService: false,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    ignores: ['scripts/**'],
  },
];
