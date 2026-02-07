# Converter API Contract

The converter transforms parsed HTML elements (from catalog JSON) into Figma scene nodes. It runs in the Figma plugin sandbox thread.

## Entry Point

```typescript
// src/plugin/converter/mapper.ts
async function mapElementToFigmaNode(
  element: ParsedElement,
  warnings: ConversionWarning[]
): Promise<SceneNode | null>
```

**Input**: `ParsedElement` -- a serialized DOM tree parsed by `parseHTMLInUI()` in the UI thread and sent via `postMessage`.

**Output**: A Figma `SceneNode` (typically `FrameNode` or `TextNode`), or `null` if the element should be skipped.

## Supported CSS Properties

Properties the converter reads from inline `style` attributes and maps to Figma node properties.

### Layout

| CSS Property | Figma Property | Notes |
|---|---|---|
| `display` | `layoutMode` | `flex`/`inline-flex` → HORIZONTAL/VERTICAL based on flex-direction. Others → VERTICAL. |
| `flex-direction` | `layoutMode` | `column` → VERTICAL, `row` → HORIZONTAL |
| `justify-content` | `primaryAxisAlignItems` | flex-start→MIN, center→CENTER, flex-end→MAX, space-between→SPACE_BETWEEN |
| `align-items` | `counterAxisAlignItems` | flex-start→MIN, center→CENTER, flex-end→MAX |
| `gap` | `itemSpacing` | Numeric px value only |
| `overflow` | `clipsContent` | `hidden` → true |
| `flex-grow` | `layoutGrow` | On child nodes only |

### Box Model

| CSS Property | Figma Property | Notes |
|---|---|---|
| `width` | `resize()` width | Used with counterAxisSizingMode=FIXED |
| `height` | `resize()` height | Used with primaryAxisSizingMode=FIXED |
| `min-width` | `minWidth` | Must be > 0 or null. `0` and `none`/`auto` → null. |
| `min-height` | `minHeight` | Must be > 0 or null. |
| `max-width` | `maxWidth` | Must be > 0 or null. `none` → null. |
| `max-height` | `maxHeight` | Must be > 0 or null. |
| `padding-top` | `paddingTop` | Longhand form supported |
| `padding-right` | `paddingRight` | |
| `padding-bottom` | `paddingBottom` | |
| `padding-left` | `paddingLeft` | |
| `padding` | (shorthand) | 1-4 value shorthand supported |

### Visual

| CSS Property | Figma Property | Notes |
|---|---|---|
| `background-color` | `fills[0]` | SolidPaint. Transparent → empty fills. |
| `color` | TextNode `fills[0]` | Text color only |
| `opacity` | `opacity` | 0-1 float |
| `box-shadow` | `effects[]` | DROP_SHADOW or INNER_SHADOW. Multiple shadows supported. |

### Border

| CSS Property | Figma Property | Notes |
|---|---|---|
| `border` | `strokes[0]` + `strokeWeight` | Shorthand: "1px solid #000" |
| `border-width` | `strokeWeight` | Shorthand: uniform value |
| `border-color` | `strokes[0].color` | Shorthand |
| `border-top-width` | `strokeWeight` | Longhand: max of all four sides |
| `border-right-width` | (merged) | |
| `border-bottom-width` | (merged) | |
| `border-left-width` | (merged) | |
| `border-top-color` | `strokes[0].color` | First non-transparent color wins |
| `border-top-style` | (filter) | Only `solid` produces strokes |
| `border-radius` | `cornerRadius` | Uniform only (no per-corner) |

### Typography

| CSS Property | Figma Property | Notes |
|---|---|---|
| `font-family` | `fontName.family` | First family in comma list. Falls back to Inter. |
| `font-size` | `fontSize` | |
| `font-weight` | `fontName.style` | Mapped: >=700→Bold, >=600→Semi Bold, >=500→Medium, >=300→Light, else→Regular |
| `line-height` | `lineHeight` | PIXELS unit. Unitless values multiplied by fontSize. |
| `letter-spacing` | `letterSpacing` | PIXELS unit |
| `text-align` | `textAlignHorizontal` | left→LEFT, center→CENTER, right→RIGHT |
| `text-transform` | (applied to characters) | uppercase, lowercase, capitalize applied to text string |

## Unsupported Properties (Known Limitations)

| CSS Property | Reason |
|---|---|
| `margin-*` | Figma has no margin concept. Auto-layout uses padding and gap instead. |
| `position` (absolute/fixed) | Would require absolute positioning outside auto-layout. Not supported in v1. |
| `grid` / `inline-grid` | Figma GRID layout mode exists but requires row/column count. No CSS grid mapping yet. |
| `transform` | Not supported. |
| `transition`, `animation` | Not applicable to static representation. |
| `cursor`, `pointer-events`, `user-select` | Not applicable. |
| `-webkit-*` prefixed | Vendor-specific, excluded. |

## Skipped HTML Elements

Tags that produce `null` (no Figma node):

- Layout: `br`, `hr`
- Metadata: `script`, `style`, `meta`, `link`
- SVG: `svg`, `path`, `circle`, `rect`, `line`, `polyline`, `polygon`, `g`, `defs`, `clipPath`, `use`

## Error Handling

- Property setter failures (e.g., invalid values) are caught and logged as warnings, not thrown
- Font loading failures fall back to Inter Regular
- Unparseable color values are skipped (no fill/stroke applied)
- Unknown CSS properties are silently ignored
