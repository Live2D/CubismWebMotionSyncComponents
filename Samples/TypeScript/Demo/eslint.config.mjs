import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import globals from 'globals';
import eslintConfigPrettier from 'eslint-config-prettier';
import eslintPluginPrettier from 'eslint-plugin-prettier';

export default tseslint.config(
  eslint.configs.recommended,
  tseslint.configs.eslintRecommended,
  ...tseslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  eslintConfigPrettier,
  {
    languageOptions:
    {
      parserOptions:
      {
        sourceType: 'module',
        ecmaVersion: 2020,
        project: './tsconfig.json',
      },
      globals:
      {
        ...globals.browser,
      },
    },
    plugins:
    {
      'prettier': eslintPluginPrettier,
    },
    rules:
    {
      'prettier/prettier': [
        'error',
        {
          singleQuote: true,
          trailingComma: 'none',
          arrowParens: 'avoid',
        }
      ],
      camelcase: 'off',
      '@typescript-eslint/naming-convention': [
        'warn',
        {
          selector: 'default',
          format: ['camelCase'],
        },
        {
          selector: 'import',
          format: ['PascalCase'],
        },
        {
          selector: 'variable',
          format: ['camelCase'],
        },
        {
          selector: 'variable',
          format: [],
          custom: {
            // 指定の文字列で始まるものは許容
            regex: '^[A-Z]|^s_',
            match: true,
          },
          modifiers: ['global']
        },
        {
          selector: ['enum', 'enumMember'],
          format: ['PascalCase'],
        },
        {
          selector: 'classProperty',
          format: ['camelCase'],
          leadingUnderscore: 'allow',
        },
        {
          selector: 'class',
          format: ['PascalCase'],
        },
        {
          selector: 'interface',
          format: ['PascalCase'],
        },
      ],
      '@typescript-eslint/no-use-before-define': 'off',
      '@typescript-eslint/ban-ts-comment': 'off',
      '@typescript-eslint/unbound-method': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-floating-promises': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
  {
    // ignores property はなぜか単独で指定していないと効果がない。
    ignores: [
      '**/*.*',
      '!src/**/*.ts',
    ],
  },
);
