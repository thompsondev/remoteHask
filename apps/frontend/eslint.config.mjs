import nextConfig from '@remotehask/shared-config/eslint/next';

/** @type {import('eslint').Linter.Config[]} */
export default [
  ...nextConfig,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
];
