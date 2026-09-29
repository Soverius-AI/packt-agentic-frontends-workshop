import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import angular from 'angular-eslint';
import sheriff from '@softarc/eslint-plugin-sheriff';

export default tseslint.config(
  { ignores: ['dist/**', '.angular/**'] },
  {
    files: ['src/**/*.ts'],
    extends: [
      eslint.configs.recommended,
      ...tseslint.configs.recommended,
      ...angular.configs.tsRecommended,
    ],
    processor: angular.processInlineTemplates,
    rules: {
      '@angular-eslint/component-class-suffix': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { varsIgnorePattern: '^_', argsIgnorePattern: '^_' },
      ],
    },
  },
  {
    files: ['src/**/*.html'],
    extends: [...angular.configs.templateRecommended, ...angular.configs.templateAccessibility],
  },
  { files: ['src/app/**/*.ts'], extends: [sheriff.configs.all] },
  {
    files: ['src/app/domains/*/{data,model,ui}/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@copilotkit/*'],
              message:
                'Keep CopilotKit in the feature integration; domain state and UI must work independently.',
            },
          ],
        },
      ],
    },
  },
);
