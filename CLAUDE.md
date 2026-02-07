# vroom-engine Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-02-07

## Active Technologies
- TypeScript 5.x (strict mode) + Playwright (build-time extraction only), React 18 (for rendering harnesses) (001-design-system-catalog)
- JSON files in `src/catalog/` (001-design-system-catalog)
- TypeScript 5.x (strict mode) + React 18, Fuse.js 7.x, Vite 5.x, vite-plugin-singlefile, @figma/plugin-typings 1.123.0 (001-design-system-catalog)
- TypeScript 5.5+ (strict mode) + React 18.3, Zustand 5.x (new), Fuse.js 7.x (existing) (004-zustand-global-store)
- N/A (in-memory only, session-scoped) (004-zustand-global-store)

- TypeScript 5.x (strict mode) + React 18, Fuse.js 7.x, Vite 5.x, vite-plugin-singlefile, @figma/plugin-typings (001-design-system-catalog)

## Project Structure

```text
src/
tests/
```

## Commands

npm test && npm run lint

## Code Style

TypeScript 5.x (strict mode): Follow standard conventions

## Recent Changes
- 004-zustand-global-store: Added TypeScript 5.5+ (strict mode) + React 18.3, Zustand 5.x (new), Fuse.js 7.x (existing)
- 001-design-system-catalog: Added TypeScript 5.x (strict mode) + React 18, Fuse.js 7.x, Vite 5.x, vite-plugin-singlefile, @figma/plugin-typings 1.123.0
- 001-design-system-catalog: Added TypeScript 5.x (strict mode) + Playwright (build-time extraction only), React 18 (for rendering harnesses)


<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
