# Quickstart: Adding a Design System to the Catalog

## Prerequisites

- Node.js 18+
- Playwright installed (`npx playwright install chromium`)

## Step 1: Create a Component Registry

Create `tools/extract-catalog/registries/<system-id>.tsx`:

```tsx
import { Button, Card } from 'your-design-system';
import type { ComponentRegistry } from '../types';

const registry: ComponentRegistry = {
  systemId: 'your-system',
  systemName: 'Your Design System',
  version: '1.0',
  sourceUrl: 'https://your-system.dev/',
  components: {
    button: {
      name: 'Button',
      aliases: ['btn'],
      category: 'input',
      description: 'A clickable button.',
      element: <Button>Button</Button>,
    },
    card: {
      name: 'Card',
      aliases: ['panel'],
      category: 'surface',
      description: 'A content container.',
      element: (
        <Card>
          <h3>Card Title</h3>
          <p>Card content</p>
        </Card>
      ),
    },
  },
};

export default registry;
```

## Step 2: Install the Design System

```bash
npm install your-design-system --save-dev
```

## Step 3: Extract Catalog

```bash
npm run extract-catalog -- --system your-system
```

This renders each component in a headless browser, extracts computed styles as inline CSS, and writes `src/catalog/your-system.json`.

Optional flags:

```bash
# Extract a single component
npm run extract-catalog -- --system your-system --component button

# Dry run (prints HTML, skips file writes)
npm run extract-catalog -- --system your-system --dry-run
```

## Step 4: Validate

```bash
npm run validate-catalog
```

## Step 5: Register in canvas.ts

Add the import and push to `loadCatalogData()` in `src/canvas.ts`:

```typescript
import yourSystem from '@/catalog/your-system.json';
// ...
catalogs.push(yourSystem as DesignSystem);
```

## Adding Variants

Each component can define variant renders:

```tsx
button: {
  // ...
  variants: {
    outlined: <Button variant="outlined">Button</Button>,
    small: <Button size="small">Button</Button>,
  },
},
```

Variants get their own `html` field in the catalog JSON.

## Theme Customization

To extract with a non-default theme, wrap the element in a theme provider:

```tsx
element: (
  <ThemeProvider theme={darkTheme}>
    <Button>Button</Button>
  </ThemeProvider>
),
```
