# Extractor API Contract

## CLI Interface

```bash
# Extract all components from all registries
npm run extract-catalog

# Extract a specific design system
npm run extract-catalog -- --system mui-v5

# Extract a specific component
npm run extract-catalog -- --system mui-v5 --component button

# Dry run (print HTML to stdout, don't write files)
npm run extract-catalog -- --dry-run
```

## Registry File Contract

Each registry file (`tools/extract-catalog/registries/<system-id>.tsx`) must export:

```typescript
import type { ComponentRegistry } from '../types';

const registry: ComponentRegistry = {
  systemId: 'mui-v5',
  systemName: 'Material UI',
  version: '5.15',
  sourceUrl: 'https://mui.com/material-ui/',
  components: {
    button: {
      name: 'Button',
      aliases: ['btn', 'cta'],
      category: 'input',
      description: 'Buttons allow users to take actions.',
      element: <Button variant="contained">Button</Button>,
      variants: {
        outlined: <Button variant="outlined">Button</Button>,
        text: <Button variant="text">Button</Button>,
      },
    },
    // ...more components
  },
};

export default registry;
```

## Extraction Output Contract

The extractor writes to `src/catalog/<system-id>.json`, preserving existing fields (`props`, `previewUrl`) and updating only `html` (and optionally variant `html`).

## Style Filter Contract

Properties extracted per element:

**Always included if non-default**:
- Layout: `display`, `flex-direction`, `align-items`, `justify-content`, `gap`, `overflow`
- Box model: `width`, `height`, `min-width`, `min-height`, `max-width`, `max-height`, `padding-*`, `margin-*`
- Visual: `background-color`, `color`, `opacity`, `border-*`, `border-radius`, `box-shadow`
- Typography: `font-family`, `font-size`, `font-weight`, `line-height`, `letter-spacing`, `text-transform`, `text-align`, `text-decoration`, `white-space`

**Always excluded**:
- `cursor`, `transition`, `animation`, `pointer-events`, `user-select`, `-webkit-*` prefixed
