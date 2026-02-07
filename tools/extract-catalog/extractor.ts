#!/usr/bin/env node
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import esbuild from 'esbuild';
import { chromium, type Page } from 'playwright';

type ExtractorArgs = {
  system?: string;
  component?: string;
  dryRun: boolean;
};

const toolDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(toolDir, '../..');
const harnessPath = resolve(toolDir, 'render-harness.html');
const domWalkerPath = resolve(toolDir, 'dom-walker.ts');
const catalogDir = resolve(repoRoot, 'src/catalog');

const registryMap: Record<string, string> = {
  'mui-v5': resolve(toolDir, 'registries/mui-v5.tsx'),
  spectrum: resolve(toolDir, 'registries/spectrum.tsx'),
  'tailwind-ui': resolve(toolDir, 'registries/tailwind-ui.tsx'),
};

const usage = () => {
  console.log(`Usage:
  npm run extract-catalog
  npm run extract-catalog -- --system mui-v5
  npm run extract-catalog -- --system mui-v5 --component button
  npm run extract-catalog -- --dry-run
`);
};

const parseArgs = (argv: string[]): ExtractorArgs => {
  const args: ExtractorArgs = { dryRun: false };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === '--system') {
      const value = argv[index + 1];
      if (!value) {
        throw new Error('Missing value for --system');
      }
      args.system = value;
      index += 1;
      continue;
    }

    if (arg === '--component') {
      const value = argv[index + 1];
      if (!value) {
        throw new Error('Missing value for --component');
      }
      args.component = value;
      index += 1;
      continue;
    }

    if (arg === '--dry-run') {
      args.dryRun = true;
      continue;
    }

    if (arg === '--help') {
      usage();
      process.exit(0);
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  return args;
};

const buildHarnessBundle = async (registryPath: string) => {
  const result = await esbuild.build({
    bundle: true,
    platform: 'browser',
    format: 'iife',
    target: ['es2020'],
    write: false,
    outdir: 'out',
    stdin: {
      sourcefile: 'harness-entry.tsx',
      loader: 'tsx',
      resolveDir: repoRoot,
      contents: `
        import React from 'react';
        import { createRoot } from 'react-dom/client';
        import registry from ${JSON.stringify(registryPath)};
        import { walkDOM } from ${JSON.stringify(domWalkerPath)};

        const rootElement = document.getElementById('root');
        const root = rootElement ? createRoot(rootElement) : null;
        const Wrapper = registry.wrapper ?? React.Fragment;

        const renderComponent = (componentId, variantName) => {
          if (!root) return;
          const entry = registry.components[componentId];
          if (!entry) {
            throw new Error('Unknown component: ' + componentId);
          }
          const element = variantName && entry.variants ? entry.variants[variantName] : entry.element;
          root.render(
            <Wrapper>
              <div id="__extract-target" style={{ display: 'contents' }}>{element}</div>
            </Wrapper>
          );
        };

        const extractHtml = () => {
          const target = document.getElementById('__extract-target');
          if (!target) return '';
          const element = target.firstElementChild;
          if (!element) return '';
          return walkDOM(element);
        };

        window.__extractCatalog = { renderComponent, extractHtml };
      `,
    },
  });

  const script = result.outputFiles.find((file) => file.path.endsWith('.js'))?.text ?? '';
  const css = result.outputFiles.find((file) => file.path.endsWith('.css'))?.text;

  return { script, css };
};

const renderAndExtract = async (
  page: Page,
  componentId: string,
  variantName?: string,
) => {
  await page.evaluate(
    ({ componentId, variantName }) => {
      (window as any).__extractCatalog?.renderComponent(componentId, variantName);
    },
    { componentId, variantName },
  );

  await page.waitForFunction(() => document.getElementById('root')?.firstElementChild);

  await page.evaluate(async () => {
    const fonts = (document as any).fonts;
    if (fonts?.ready) {
      await fonts.ready;
    }
  });

  return page.evaluate(() => (window as any).__extractCatalog?.extractHtml() ?? '');
};

const updateCatalog = async (
  page: Page,
  systemId: string,
  componentFilter: string | undefined,
  dryRun: boolean,
) => {
  const catalogPath = resolve(catalogDir, `${systemId}.json`);
  const catalog = JSON.parse(readFileSync(catalogPath, 'utf-8'));
  const updatedComponents = [];

  for (const component of catalog.components ?? []) {
    if (componentFilter && component.id !== componentFilter) {
      updatedComponents.push(component);
      continue;
    }

    let html = component.html;
    try {
      html = await renderAndExtract(page, component.id);
    } catch (error) {
      console.warn(
        `Failed to extract ${systemId}/${component.id}: ${
          error instanceof Error ? error.message : error
        }`,
      );
      updatedComponents.push(component);
      continue;
    }
    const updatedComponent = { ...component, html };

    if (component.variants?.length) {
      const updatedVariants = [];
      for (const variant of component.variants) {
        let variantHtml = variant.html;
        try {
          variantHtml = await renderAndExtract(page, component.id, variant.name);
        } catch (error) {
          console.warn(
            `Failed to extract ${systemId}/${component.id}/${variant.name}: ${
              error instanceof Error ? error.message : error
            }`,
          );
          updatedVariants.push(variant);
          continue;
        }
        updatedVariants.push({ ...variant, html: variantHtml });
      }
      updatedComponent.variants = updatedVariants;
    }

    if (dryRun) {
      console.log(`[dry-run] ${systemId}/${component.id}`);
      console.log(html);
    }

    updatedComponents.push(updatedComponent);
  }

  if (!dryRun) {
    writeFileSync(
      catalogPath,
      JSON.stringify(
        {
          ...catalog,
          components: updatedComponents,
        },
        null,
        2,
      ),
    );
  }
};

const main = async () => {
  const args = parseArgs(process.argv.slice(2));
  const systems = args.system ? [args.system] : Object.keys(registryMap);

  for (const systemId of systems) {
    const registryPath = registryMap[systemId];
    if (!registryPath) {
      throw new Error(`Unknown system "${systemId}". Available: ${Object.keys(registryMap).join(', ')}`);
    }

    if (!existsSync(registryPath)) {
      if (args.system) {
        throw new Error(`Registry file missing for "${systemId}": ${registryPath}`);
      }
      console.warn(`Skipping "${systemId}" (registry missing): ${registryPath}`);
      continue;
    }

    if (!existsSync(resolve(catalogDir, `${systemId}.json`))) {
      if (args.system) {
        throw new Error(`Catalog file missing for "${systemId}": ${resolve(catalogDir, `${systemId}.json`)}`);
      }
      console.warn(`Skipping "${systemId}" (catalog missing): ${resolve(catalogDir, `${systemId}.json`)}`);
      continue;
    }

    const browser = await chromium.launch();
    const page = await browser.newPage();
    page.on('pageerror', (error) => {
      console.error(`[pageerror] ${error.message}`);
    });
    await page.goto(pathToFileURL(harnessPath).href);

    if (systemId === 'tailwind-ui') {
      await page.addInitScript(() => {
        (window as any).tailwind = {
          config: {
            corePlugins: { preflight: false },
          },
        };
      });
      await page.addScriptTag({ url: 'https://cdn.tailwindcss.com' });
    }

    const harnessBundle = await buildHarnessBundle(registryPath);
    if (harnessBundle.css) {
      await page.addStyleTag({ content: harnessBundle.css });
    }
    await page.addScriptTag({ content: harnessBundle.script });

    await updateCatalog(page, systemId, args.component, args.dryRun);

    await browser.close();
  }
};

main().catch((error) => {
  if (error instanceof Error) {
    console.error(error.stack ?? error.message);
  } else {
    console.error(error);
  }
  process.exit(1);
});
