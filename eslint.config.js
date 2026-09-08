import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';

export default tseslint.config(
  { ignores: ['dist', 'dist-single', 'node_modules', 'src/generated', 'android', 'public'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      globals: { ...globals.browser, ...globals.node },
    },
    plugins: { 'react-hooks': reactHooks },
    rules: {
      ...reactHooks.configs.recommended.rules,
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      // The domain layer must stay free of UI concerns; this is the guard.
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            { group: ['**/ui/*', '**/routes/*', 'react', 'react-dom'], message: 'Domain code must not import UI.' },
          ],
        },
      ],
    },
  },
  {
    files: ['scripts/**/*.mjs'],
    languageOptions: { globals: globals.node },
    rules: { 'no-undef': 'off' },
  },
  {
    // The rule above only applies to the domain layer.
    files: ['src/ui/**', 'src/routes/**', 'src/hooks/**', 'src/lib/router*', 'src/main.tsx', 'src/App.tsx', 'src/test/**'],
    rules: { 'no-restricted-imports': 'off' },
  },
);
