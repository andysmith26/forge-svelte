# Forge Svelte — Agent Guidelines

## Formatting

- **Indentation: 2 spaces. Never use tabs.** This is enforced by Prettier, EditorConfig, and VSCode settings.
- Run `pnpm format` to auto-format. Run `pnpm lint` to check.
- Prettier config is in `.prettierrc` — single quotes, no trailing commas, 100 char print width.

## Tech Stack

- SvelteKit 2 + Svelte 5, TypeScript, Tailwind CSS 4, Vite, Vitest
- Prisma ORM, Auth.js (@auth/sveltekit)
- Package manager: **pnpm**

## Architecture

- Hexagonal architecture — domain / application / infrastructure layers
- ESLint enforces layer boundaries (see `eslint.config.js`)
- Domain must not import application, infrastructure, UI, or framework code
- Use cases must not import infrastructure directly — depend on ports

## Commands

- `pnpm dev` — dev server
- `pnpm build` — production build
- `pnpm check` — svelte-check + TypeScript
- `pnpm lint` — prettier --check + eslint
- `pnpm format` — prettier --write
- `pnpm test` — vitest (run once)
