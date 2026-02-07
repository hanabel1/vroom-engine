# Research: Design System Catalog Figma Plugin

**Branch**: `001-design-system-catalog` | **Date**: 2026-02-07

## R1: Fuse.js — Fuzzy Search Library

### Decision
Use **Fuse.js** (v7.x) as the client-side fuzzy search engine for the component catalog.

### Rationale
- Lightweight (~5KB minified + gzipped), zero dependencies — fits the constitution's "Minimal Dependencies" principle (Principle IV) and the <5MB bundle constraint.
- Client-side only — no server required; runs entirely in the Figma plugin iframe.
- Supports weighted multi-key search on nested objects — can search by `name` (high weight), `category` (medium), and `props[].name` (lower weight) simultaneously.
- Built-in fuzzy matching using a modified Bitap algorithm — handles typos, partial matches, and character transpositions.

### Alternatives Considered
- **Lunr.js**: Heavier (~8KB gzip), designed for full-text search rather than fuzzy matching. Better for document search than UI component names.
- **FlexSearch**: Faster for large datasets but less flexible fuzzy matching. Overkill for 500-item catalog.
- **Native Array.filter with custom fuzzy**: Minimal bundle but requires implementing fuzzy algorithm from scratch — contrary to Prototype-Fast (Principle II).

### Key Configuration

```typescript
const fuse = new Fuse(catalogItems, {
  keys: [
    { name: 'name', weight: 2.0 },           // Component name highest priority
    { name: 'aliases', weight: 1.5 },         // Alternative names (e.g., "btn" for "Button")
    { name: 'category', weight: 0.8 },        // Category (e.g., "input", "navigation")
    { name: 'designSystem', weight: 0.5 },    // Design system name
    { name: 'props.name', weight: 0.7 },      // Prop names (nested object search)
  ],
  threshold: 0.4,          // 0 = exact, 1 = anything matches. 0.4 balances typo tolerance vs noise
  distance: 100,           // How far a match can be from the expected location
  includeScore: true,      // Return match scores for ranking
  includeMatches: true,    // Return match details for highlighting
  minMatchCharLength: 2,   // Ignore single-character matches
  shouldSort: true,        // Sort by relevance score
});
```

### Performance Notes
- For 500 items with 5 keys: search completes in <10ms on modern hardware.
- Fuse.js creates an index on initialization; pre-indexing at plugin load time is recommended.
- The `Fuse.createIndex()` method can be used to pre-build the index for faster startup if catalog data is static.

### Synonym/Alias Handling
Fuse.js does not natively support synonyms. The solution is to add an `aliases` field to each component entry in the catalog data:
```json
{
  "name": "Button",
  "aliases": ["btn", "cta", "action"],
  ...
}
```

---

## R2: Figma Plugin Architecture

### Decision
Standard Figma plugin architecture with dual-context model: React UI in iframe + main thread for Figma API access, built with Vite using two entry points.

### Rationale
This is the only supported architecture for Figma plugins with UI. The constitution already mandates this separation (Principle I: Plugin-Architecture-Driven).

### Architecture Overview

**Dual-Context Model:**
1. **Main thread** (`src/plugin/main.ts`): Has access to Figma API (`figma.*`), runs in a sandboxed JavaScript environment (no DOM, no `window`). Creates/modifies Figma nodes.
2. **UI iframe** (`src/ui/index.html` + React app): Has access to DOM, `window`, `fetch`. Renders the search UI. Cannot access Figma API directly.
3. **Communication**: `postMessage` bridge between the two contexts.

**manifest.json:**
```json
{
  "name": "Design System Catalog",
  "id": "PLUGIN_ID",
  "api": "1.0.0",
  "main": "dist/plugin.js",
  "ui": "dist/ui.html",
  "editorType": ["figma"],
  "networkAccess": {
    "allowedDomains": ["none"]
  }
}
```
Note: `networkAccess` set to `none` since component HTML is pre-stored in catalog data — no runtime network requests needed.

**Vite Configuration (two builds):**
- **UI build**: Standard React build → `dist/ui.html` (HTML with inlined JS/CSS, since Figma requires a single HTML file).
- **Plugin build**: TypeScript → `dist/plugin.js` (IIFE format, no DOM APIs).
- Use `vite-plugin-singlefile` to inline all assets into `ui.html`.
- Use a separate Vite config or `build.lib` mode for the plugin main thread.

**postMessage Pattern:**
```typescript
// UI → Plugin
parent.postMessage({ pluginMessage: { type: 'PLACE_COMPONENT', data: {...} } }, '*');

// Plugin → UI
figma.ui.postMessage({ type: 'SEARCH_RESULTS', data: [...] });

// Listening in Plugin
figma.ui.on('message', (msg) => { ... });

// Listening in UI
window.onmessage = (event) => { ... };
```

### Node Creation API

| Method | Node Type | Use Case |
|--------|-----------|----------|
| `figma.createFrame()` | FrameNode | Containers, auto-layout groups |
| `figma.createRectangle()` | RectangleNode | Solid shapes, image containers |
| `figma.createText()` | TextNode | Text content |
| `figma.createComponent()` | ComponentNode | Reusable Figma components |
| `figma.group(nodes, parent)` | GroupNode | Logical grouping |
| `figma.createNodeFromSvg(svg)` | Group of vectors | SVG import |

### Auto Layout (Programmatic)
```typescript
const frame = figma.createFrame();
frame.layoutMode = 'HORIZONTAL';  // or 'VERTICAL'
frame.primaryAxisAlignMode = 'MIN';  // justify-content equivalent
frame.counterAxisAlignMode = 'CENTER';  // align-items equivalent
frame.itemSpacing = 8;
frame.paddingLeft = 16;
frame.paddingRight = 16;
frame.paddingTop = 12;
frame.paddingBottom = 12;
frame.primaryAxisSizingMode = 'AUTO';  // width: auto
frame.counterAxisSizingMode = 'AUTO';  // height: auto
```

### Font Loading
Fonts MUST be loaded before setting text content:
```typescript
await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
textNode.fontName = { family: 'Inter', style: 'Regular' };
textNode.characters = 'Hello';
```
Fallback strategy: Use `Inter` (Figma's default) when the target font is unavailable.

---

## R3: HTML-to-Figma Conversion

### Decision
Build a lightweight custom HTML-to-Figma converter focused on flex layout, basic styling, and text — targeting the subset of CSS used by MUI, Spectrum, and Tailwind components. Use a pre-processing pipeline to inline styles before storing in the catalog.

### Rationale
- **html-to-figma** (BuilderIO) is a potential reference but may be too heavy or have an API that doesn't fit the plugin's needs. Evaluating it as a starting point is recommended, but a custom solution is more aligned with Prototype-Fast (Principle II) — build only what we need.
- Pre-storing HTML with fully inlined computed styles eliminates the need for CSS resolution at runtime.
- The MVP targets "visually recognizable" (SC-003: 90%) rather than pixel-perfect.

### Alternatives Considered
- **Use html-to-figma directly**: Could work, but adds a dependency with uncertain Figma API compatibility and may include more than needed.
- **Screenshot-only approach**: Place component as a rasterized image instead of Figma layers. Simplest, but loses editability — defeats the purpose of the plugin.
- **Server-side rendering to Figma JSON**: Too complex for MVP; requires a backend service.

### Pre-Processing Pipeline (Build Tool, Outside Plugin)

Run during catalog data preparation:
1. Render component HTML in headless browser (Puppeteer/Playwright)
2. Extract computed styles for every element
3. Inline all styles as `style` attributes
4. Resolve CSS variables
5. Take screenshot for preview image
6. Store processed HTML + preview in catalog JSON

### CSS-to-Figma Mapping (MVP Scope)

**Included:**
| CSS | Figma | Notes |
|-----|-------|-------|
| `display: flex` | Auto Layout | `layoutMode`, `primaryAxisAlignMode`, `counterAxisAlignMode` |
| `flex-direction` | `layoutMode` | `HORIZONTAL` / `VERTICAL` |
| `justify-content` | `primaryAxisAlignMode` | MIN, CENTER, MAX, SPACE_BETWEEN |
| `align-items` | `counterAxisAlignMode` | MIN, CENTER, MAX |
| `gap` | `itemSpacing` | Pixels |
| `padding-*` | `padding*` | Auto Layout padding |
| `background-color` | `fills` (SOLID) | Convert to {r,g,b} 0-1 range |
| `color` | Text `fills` | Text color |
| `border` | `strokes` + `strokeWeight` | Solid borders only |
| `border-radius` | `cornerRadius` or individual corners | Pixels |
| `box-shadow` | `effects` (DROP_SHADOW) | Single shadow |
| `font-*` | Text properties | family, size, weight, style |
| `line-height` | `lineHeight` | Pixels or percent |
| `letter-spacing` | `letterSpacing` | Pixels |
| `text-align` | `textAlignHorizontal` | LEFT, CENTER, RIGHT |
| `width`, `height` | `resize()` | Fixed dimensions |
| `opacity` | `opacity` | 0-1 |

**Excluded from MVP:**
- CSS Grid
- Pseudo-elements (::before, ::after)
- Complex gradients
- Images/SVGs (placeholder frame instead)
- Animations, transitions
- Media queries
- Complex selectors, CSS cascade
- Transform other than rotation

### Fallback Strategy
1. If element conversion fails → create placeholder frame with element tag name
2. If font not available → fall back to `Inter`
3. If entire conversion fails → insert preview screenshot as image fill on a rectangle
4. Always notify user of conversion limitations

---

## R4: Catalog Data Schema Design

### Decision
Use a flat JSON-per-design-system structure where each design system is a single JSON file in a `catalog/` directory. Component HTML is pre-processed and stored inline.

### Rationale
- Simple file-based approach aligns with Prototype-Fast (Principle II) and the spec's "add a JSON file" requirement (FR-010).
- No database needed — catalog data is static and small enough to bundle or serve as static files.
- One file per design system keeps additions simple: add a file = add a system.

### Alternatives Considered
- **SQLite database**: Over-engineered for a read-only catalog of ~200 items.
- **Single monolithic JSON**: Hard to maintain; adding a design system requires editing shared file.
- **Remote API**: Adds network dependency and backend complexity.

### Schema (see data-model.md for full details)
- `catalog/{design-system-slug}.json` — one file per design system
- Each file contains design system metadata + array of components
- Each component has: name, aliases, category, props, variants, preview image URL, processed HTML
