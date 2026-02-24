import prettier from 'eslint-config-prettier';
import { includeIgnoreFile } from '@eslint/compat';
import js from '@eslint/js';
import svelte from 'eslint-plugin-svelte';
import globals from 'globals';
import { fileURLToPath } from 'node:url';
import ts from 'typescript-eslint';
import svelteConfig from './svelte.config.js';

const gitignorePath = fileURLToPath(new URL('./.gitignore', import.meta.url));

export default ts.config(
  includeIgnoreFile(gitignorePath),
  js.configs.recommended,
  ...ts.configs.recommended,
  ...svelte.configs.recommended,
  prettier,
  ...svelte.configs.prettier,
  {
    languageOptions: {
      globals: { ...globals.browser, ...globals.node }
    },
    rules: {
      'no-undef': 'off',
      // Forge uses base path '/' — resolve() adds no value
      'svelte/no-navigation-without-resolve': 'off',
      'svelte/require-each-key': 'error'
    }
  },
  {
    files: ['**/*.svelte', '**/*.svelte.ts', '**/*.svelte.js'],
    languageOptions: {
      parserOptions: {
        projectService: true,
        extraFileExtensions: ['.svelte'],
        parser: ts.parser,
        svelteConfig
      }
    }
  },
  // === Hexagonal Architecture Boundary Rules ===
  // Production code must not import test utilities
  {
    files: ['src/**/*.{ts,js,svelte}'],
    ignores: ['**/*.spec.*', '**/*.test.*', 'src/lib/test-utils/**'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: '$lib/test-utils',
              message: 'Production code must not import $lib/test-utils.'
            }
          ]
        }
      ]
    }
  },
  // Domain layer: no application, infrastructure, svelte, or prisma imports
  {
    files: ['src/lib/domain/**'],
    ignores: ['**/*.spec.*', '**/*.test.*'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'svelte',
              message: 'Domain layer must remain framework-agnostic.'
            },
            {
              name: '$lib/test-utils',
              message: 'Production code must not import $lib/test-utils.'
            }
          ],
          patterns: [
            {
              group: [
                '@sveltejs/*',
                '@sveltejs/**',
                'svelte/*',
                '@prisma/*',
                '$lib/application',
                '$lib/application/*',
                '$lib/application/**',
                '$lib/infrastructure',
                '$lib/infrastructure/*',
                '$lib/infrastructure/**',
                '$lib/components',
                '$lib/components/*',
                '$lib/components/**',
                '$lib/server',
                '$lib/server/*',
                '$lib/server/**'
              ],
              message: 'Domain layer must not depend on application, infrastructure, or UI.'
            }
          ]
        }
      ]
    }
  },
  // Application use cases: no infrastructure, svelte, or prisma imports
  {
    files: ['src/lib/application/useCases/**'],
    ignores: ['**/*.spec.*', '**/*.test.*'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: '$lib/test-utils',
              message: 'Production code must not import $lib/test-utils.'
            }
          ],
          patterns: [
            {
              group: [
                '$lib/infrastructure',
                '$lib/infrastructure/*',
                '$lib/infrastructure/**',
                '$lib/components',
                '$lib/components/*',
                '$lib/components/**',
                '$lib/server',
                '$lib/server/*',
                '$lib/server/**',
                '@prisma/*'
              ],
              message: 'Use cases must depend only on domain, ports, and utilities.'
            }
          ]
        }
      ]
    }
  },
  // Application ports: no infrastructure, UI, or use case imports
  {
    files: ['src/lib/application/ports/**'],
    ignores: ['**/*.spec.*', '**/*.test.*'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: '$lib/test-utils',
              message: 'Production code must not import $lib/test-utils.'
            }
          ],
          patterns: [
            {
              group: [
                '$lib/infrastructure',
                '$lib/infrastructure/*',
                '$lib/infrastructure/**',
                '$lib/components',
                '$lib/components/*',
                '$lib/components/**',
                '$lib/server',
                '$lib/server/*',
                '$lib/server/**',
                '@prisma/*'
              ],
              message: 'Ports must not depend on infrastructure, routes, or UI modules.'
            }
          ]
        }
      ]
    }
  },
  // Components: no direct infrastructure imports
  {
    files: ['src/lib/components/**'],
    ignores: ['**/*.spec.*', '**/*.test.*'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: '$lib/test-utils',
              message: 'Production code must not import $lib/test-utils.'
            }
          ],
          patterns: [
            {
              group: [
                '$lib/infrastructure',
                '$lib/infrastructure/*',
                '$lib/infrastructure/**',
                '$lib/server',
                '$lib/server/*',
                '$lib/server/**',
                '@prisma/*'
              ],
              message:
                'Components should use application facades/context, not infrastructure directly.'
            }
          ]
        }
      ]
    }
  },
  // Routes: no direct infrastructure imports (except +server.ts and +page.server.ts which use getEnvironment)
  {
    files: ['src/routes/**/*.svelte'],
    ignores: ['**/*.spec.*', '**/*.test.*'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: '$lib/test-utils',
              message: 'Production code must not import $lib/test-utils.'
            }
          ],
          patterns: [
            {
              group: [
                '$lib/infrastructure',
                '$lib/infrastructure/*',
                '$lib/infrastructure/**',
                '$lib/server',
                '$lib/server/*',
                '$lib/server/**',
                '@prisma/*'
              ],
              message:
                'Svelte route components must not import infrastructure or server modules directly.'
            }
          ]
        }
      ]
    }
  }
);
