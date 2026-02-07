# Data Model: Catalog Extraction Pipeline

**Date**: 2026-02-07

## Entities

### ComponentRegistry (per design system)

A mapping of component IDs to their React element renders. One file per design system.

| Field | Type | Description |
|---|---|---|
| `systemId` | `string` | Design system slug (e.g., `mui-v5`) |
| `systemName` | `string` | Display name |
| `version` | `string` | Design system version |
| `components` | `Record<string, ComponentEntry>` | Map of component ID to render config |

### ComponentEntry

| Field | Type | Description |
|---|---|---|
| `name` | `string` | Human-readable name |
| `aliases` | `string[]` | Search aliases |
| `category` | `Category` | Component category |
| `description` | `string` | Component description |
| `element` | `ReactElement` | Default render for extraction |
| `variants` | `Record<string, ReactElement>` | Optional variant renders |

### ExtractedComponent (output)

| Field | Type | Description |
|---|---|---|
| `id` | `string` | Component slug |
| `name` | `string` | Display name |
| `html` | `string` | Extracted HTML with inline styles |
| `variantHtml` | `Record<string, string>` | Optional per-variant HTML |

### StyleFilter configuration

| Field | Type | Description |
|---|---|---|
| `allowlist` | `string[]` | CSS properties to always include if they differ from bare element |
| `denylist` | `string[]` | Properties to always exclude (e.g., `cursor`, `transition`) |

## Relationships

```
ComponentRegistry 1──* ComponentEntry
ComponentEntry 1──1 ExtractedComponent (after extraction)
DesignSystem (existing catalog JSON) 1──* ExtractedComponent.html
```

## State Transitions

```
Registry file authored → Extraction script runs → HTML extracted → Catalog JSON updated → Plugin loads catalog
```
