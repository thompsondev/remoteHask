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
];
