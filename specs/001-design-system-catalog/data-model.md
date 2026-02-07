# Data Model: Design System Catalog

**Branch**: `001-design-system-catalog` | **Date**: 2026-02-07

## Entities

### DesignSystem

Represents one design system (e.g., "Material UI v5").

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | yes | URL-safe slug, e.g., `"mui-v5"` |
| `name` | string | yes | Display name, e.g., `"Material UI"` |
| `version` | string | yes | Version string, e.g., `"5.15"` |
| `description` | string | no | Short description of the design system |
| `sourceUrl` | string | no | URL to the design system's documentation |
| `logoUrl` | string | no | Path to logo image (relative to catalog dir) |
| `components` | Component[] | yes | Array of components in this system |

**Identity**: `id` must be unique across all design systems in the catalog.

### Component

A single UI component within a design system.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | yes | Unique within design system, e.g., `"button"` |
| `name` | string | yes | Display name, e.g., `"Button"` |
| `aliases` | string[] | no | Alternative names for search, e.g., `["btn", "cta"]` |
| `description` | string | no | Short component description |
| `category` | string | yes | Component category (see Categories enum) |
| `previewUrl` | string | yes | Path to preview image (relative to catalog dir) |
| `html` | string | yes | Pre-processed HTML with inlined styles |
| `props` | ComponentProp[] | no | Array of configurable props |
| `variants` | ComponentVariant[] | no | Array of named variant configurations |

**Identity**: `{designSystemId}.{id}` must be globally unique.

### ComponentProp

A configurable property of a component.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | yes | Prop name, e.g., `"variant"`, `"size"`, `"disabled"` |
| `type` | PropType | yes | One of: `"boolean"`, `"enum"`, `"string"`, `"number"` |
| `description` | string | no | What this prop controls |
| `defaultValue` | string | no | Default value |
| `values` | PropValue[] | no | Enumerated values (required when `type` is `"enum"`) |

### PropValue

An individual value option for an enum-type prop.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `value` | string | yes | The prop value, e.g., `"small"`, `"contained"` |
| `label` | string | no | Display label if different from value |
| `previewUrl` | string | no | Path to preview image showing this value |

### ComponentVariant

A named combination of prop values representing a common usage.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | yes | Variant name, e.g., `"Primary Large"` |
| `props` | Record<string, string> | yes | Prop name → value mapping |
| `previewUrl` | string | no | Preview image for this variant |
| `html` | string | no | Pre-processed HTML for this specific variant (overrides component default) |

## Enums

### Category

Standardized component categories for filtering and grouping:

| Value | Description | Examples |
|-------|-------------|----------|
| `"input"` | Form and input elements | Button, TextField, Checkbox, Select |
| `"display"` | Data display components | Card, Avatar, Badge, Chip, List |
| `"navigation"` | Navigation elements | Tabs, Breadcrumb, Menu, Link |
| `"feedback"` | User feedback | Alert, Snackbar, Dialog, Progress |
| `"layout"` | Layout containers | Container, Grid, Stack, Divider |
| `"surface"` | Surface/wrapper elements | Paper, Accordion, AppBar |

### PropType

| Value | JSON Type of `defaultValue` / `values[].value` |
|-------|-------------------------------------------------|
| `"boolean"` | `"true"` or `"false"` |
| `"enum"` | One of the values in `values[]` |
| `"string"` | Any string |
| `"number"` | Numeric string, e.g., `"16"` |

## File Structure

```
catalog/
├── mui-v5.json              # Material UI design system
├── spectrum.json             # Adobe Spectrum design system
├── tailwind-ui.json          # Tailwind UI design system
└── previews/
    ├── mui-v5/
    │   ├── button.png
    │   ├── button-primary-large.png
    │   └── ...
    ├── spectrum/
    │   └── ...
    └── tailwind-ui/
        └── ...
```

## Example: Catalog Entry

```json
{
  "id": "mui-v5",
  "name": "Material UI",
  "version": "5.15",
  "description": "React UI component library based on Google's Material Design",
  "sourceUrl": "https://mui.com/material-ui/",
  "components": [
    {
      "id": "button",
      "name": "Button",
      "aliases": ["btn", "cta", "action-button"],
      "description": "Buttons allow users to take actions and make choices with a single tap.",
      "category": "input",
      "previewUrl": "previews/mui-v5/button.png",
      "html": "<button style=\"display: inline-flex; align-items: center; justify-content: center; padding: 6px 16px; font-family: Roboto, sans-serif; font-size: 14px; font-weight: 500; line-height: 24px; letter-spacing: 0.4px; color: #ffffff; background-color: #1976d2; border: none; border-radius: 4px; text-transform: uppercase; cursor: pointer;\">Button</button>",
      "props": [
        {
          "name": "variant",
          "type": "enum",
          "description": "The visual style variant",
          "defaultValue": "contained",
          "values": [
            { "value": "contained", "previewUrl": "previews/mui-v5/button-contained.png" },
            { "value": "outlined", "previewUrl": "previews/mui-v5/button-outlined.png" },
            { "value": "text", "previewUrl": "previews/mui-v5/button-text.png" }
          ]
        },
        {
          "name": "size",
          "type": "enum",
          "description": "The button size",
          "defaultValue": "medium",
          "values": [
            { "value": "small" },
            { "value": "medium" },
            { "value": "large" }
          ]
        },
        {
          "name": "disabled",
          "type": "boolean",
          "description": "If true, the button is disabled",
          "defaultValue": "false"
        }
      ],
      "variants": [
        {
          "name": "Primary Contained",
          "props": { "variant": "contained", "size": "medium" },
          "previewUrl": "previews/mui-v5/button-contained.png",
          "html": "<button style=\"display: inline-flex; align-items: center; justify-content: center; padding: 6px 16px; font-family: Roboto, sans-serif; font-size: 14px; font-weight: 500; color: #ffffff; background-color: #1976d2; border: none; border-radius: 4px;\">Button</button>"
        },
        {
          "name": "Outlined",
          "props": { "variant": "outlined", "size": "medium" },
          "previewUrl": "previews/mui-v5/button-outlined.png",
          "html": "<button style=\"display: inline-flex; align-items: center; justify-content: center; padding: 5px 15px; font-family: Roboto, sans-serif; font-size: 14px; font-weight: 500; color: #1976d2; background-color: transparent; border: 1px solid rgba(25, 118, 210, 0.5); border-radius: 4px;\">Button</button>"
        }
      ]
    }
  ]
}
```

## Validation Rules

1. **Design system `id`**: Must be a non-empty URL-safe slug (lowercase, hyphens, no spaces).
2. **Component `id`**: Must be unique within a design system.
3. **Component `name`**: Must be non-empty.
4. **Component `category`**: Must be one of the defined Category enum values.
5. **Component `html`**: Must be non-empty (pre-processed HTML with inline styles).
6. **Component `previewUrl`**: Must point to an existing file in the catalog previews directory.
7. **Prop `name`**: Must be unique within a component's props array.
8. **Prop `type`**: Must be one of the defined PropType enum values.
9. **Enum props**: Must have at least one entry in `values[]`.
10. **Variant `props`**: Keys must reference existing prop names; values must be valid for the prop type.

## Relationships

```
Catalog (directory of JSON files)
 └── DesignSystem (one per JSON file)
      └── Component (array within design system)
           ├── ComponentProp (array within component)
           │    └── PropValue (array within enum-type prop)
           └── ComponentVariant (array within component)
```

All relationships are parent-child containment (no cross-references between design systems).
