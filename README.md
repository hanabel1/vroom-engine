# Design System Catalog - Figma Plugin

A Figma plugin that provides a searchable catalog of UI components from multiple public design systems (Material UI, Adobe Spectrum, Tailwind UI). Search, browse, and place components directly onto your Figma canvas.

## Features

- **🔍 Fuzzy Search**: Search components by name, aliases, category, or props
- **📦 Multiple Design Systems**: Browse components from Material UI, Adobe Spectrum, and Tailwind UI
- **🎨 Direct Placement**: Convert HTML components to native Figma layers with one click
- **⚡️ Fast & Lightweight**: Under 200KB bundle size, search results in <100ms

## Installation

### For Development

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Build the plugin:
   ```bash
   npm run build
   ```
4. In Figma: **Plugins → Development → Import plugin from manifest**
5. Select the `manifest.json` file from this directory
6. Run the plugin from the Plugins menu

## Development

```bash
# Start development mode (watch both UI and plugin)
npm run dev

# Build for production
npm run build

# Validate catalog data
npm run validate-catalog

# Run tests
npm test

# Lint code
npm run lint
```

## Project Structure

```
src/
├── plugin/                 # Figma main thread (no DOM access)
│   ├── main.ts             # Plugin entry: message handler
│   └── converter/          # HTML-to-Figma conversion engine
│       ├── index.ts        # Converter entry point
│       ├── parser.ts       # HTML parsing
│       ├── mapper.ts       # Element → Figma node mapping
│       └── styles.ts       # CSS → Figma property conversion
│
├── ui/                     # React UI iframe
│   ├── App.tsx             # Root component
│   ├── components/         # UI components
│   ├── hooks/              # React hooks
│   └── types/              # TypeScript types
│
└── catalog/                # Catalog data
    ├── mui-v5.json
    ├── spectrum.json
    └── tailwind-ui.json
```

## Tech Stack

- **TypeScript 5.x** (strict mode)
- **React 18**
- **Fuse.js 7.x** (fuzzy search)
- **Vite 5.x** (build tooling)
- **Figma Plugin API**

## How It Works

1. **Search**: The UI uses Fuse.js to perform fuzzy search across all components from loaded design systems
2. **Browse**: Results are grouped by design system and displayed with preview placeholders
3. **Place**: When you click "Place", the plugin converts the component's pre-processed HTML into native Figma layers using Auto Layout

## Adding Design Systems

See the [Catalog Contribution Guide](./CONTRIBUTING-CATALOG.md) for instructions on adding new design systems to the catalog.

## License

MIT

## Built With SpecKit

This project was built using [SpecKit](https://github.com/example/speckit) - a specification-driven development workflow.
