// HTML to Figma converter entry point
// Note: HTML parsing is now done in the UI thread
// This module just re-exports the mapper and types

export { mapElementToFigmaNode, type ConversionWarning } from './mapper';
export type { ParsedElement } from './parser';
