# Message Protocol: UI ↔ Plugin Communication

**Branch**: `001-design-system-catalog` | **Date**: 2026-02-07

This defines the `postMessage` contract between the UI iframe (React) and the plugin main thread (Figma API).

## Message Envelope

All messages follow this shape:

```typescript
interface PluginMessage {
  type: string;       // Message type identifier
  payload?: unknown;  // Type-specific data
  requestId?: string; // Optional correlation ID for request/response pairs
}
```

## UI → Plugin Messages

### `PLUGIN_READY`
Sent once when the UI iframe has loaded and is ready to receive data.

```typescript
{ type: 'PLUGIN_READY' }
```

### `PLACE_COMPONENT`
Request to convert HTML and place a component on the artboard.

```typescript
{
  type: 'PLACE_COMPONENT',
  payload: {
    designSystemId: string;  // e.g., "mui-v5"
    componentId: string;     // e.g., "button"
    variantName?: string;    // Optional specific variant
    html: string;            // Pre-processed HTML to convert
  },
  requestId: string;
}
```

### `CANCEL_PLACEMENT`
Cancel an in-progress placement operation.

```typescript
{
  type: 'CANCEL_PLACEMENT',
  requestId: string;
}
```

## Plugin → UI Messages

### `CATALOG_DATA`
Sent in response to `PLUGIN_READY`. Delivers the full catalog to the UI for search indexing.

```typescript
{
  type: 'CATALOG_DATA',
  payload: {
    designSystems: DesignSystem[];  // Full catalog data
  }
}
```

### `PLACEMENT_STARTED`
Acknowledges that placement conversion has begun.

```typescript
{
  type: 'PLACEMENT_STARTED',
  requestId: string;
}
```

### `PLACEMENT_COMPLETE`
Component successfully placed on artboard.

```typescript
{
  type: 'PLACEMENT_COMPLETE',
  requestId: string,
  payload: {
    nodeName: string;       // Name of the created Figma node
    warnings: string[];     // Any conversion limitations encountered
  }
}
```

### `PLACEMENT_ERROR`
Placement failed.

```typescript
{
  type: 'PLACEMENT_ERROR',
  requestId: string,
  payload: {
    error: string;          // Error message
    fallbackUsed: boolean;  // Whether a screenshot fallback was placed instead
  }
}
```

## Message Flow Diagrams

### Plugin Startup
```
UI                          Plugin
 |                            |
 |---  PLUGIN_READY  -------->|
 |                            | (load catalog JSON files)
 |<--  CATALOG_DATA  ---------|
 |                            |
 | (build Fuse.js index)      |
```

### Component Placement
```
UI                          Plugin
 |                            |
 |---  PLACE_COMPONENT  ----->|
 |<--  PLACEMENT_STARTED  ----|
 |                            | (parse HTML, create nodes)
 |<--  PLACEMENT_COMPLETE  ---|
 |                            |
```

### Placement with Error + Fallback
```
UI                          Plugin
 |                            |
 |---  PLACE_COMPONENT  ----->|
 |<--  PLACEMENT_STARTED  ----|
 |                            | (conversion fails)
 |                            | (place screenshot fallback)
 |<--  PLACEMENT_ERROR  ------|
 |    { fallbackUsed: true }  |
```

## Notes

- Search happens entirely in the UI iframe using Fuse.js — no messages needed for search queries.
- Preview images are embedded in the catalog data (base64 or bundled as assets).
- The `requestId` field enables the UI to correlate responses when multiple placements are queued.
