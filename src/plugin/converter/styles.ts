// CSS inline style parser and color utilities

export interface ParsedStyles {
  // Layout
  display?: string;
  flexDirection?: string;
  justifyContent?: string;
  alignItems?: string;
  gap?: number;
  padding?: { top: number; right: number; bottom: number; left: number };
  margin?: { top: number; right: number; bottom: number; left: number };
  flexGrow?: number;
  flexShrink?: number;
  position?: string;
  
  // Dimensions
  width?: number;
  height?: number;
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
  
  // Visual
  backgroundColor?: RGB;
  color?: RGB;
  opacity?: number;
  boxShadow?: BoxShadow[];
  overflow?: string;
  
  // Border
  borderRadius?: number;
  borderColor?: RGB;
  borderWidth?: number;
  
  // Typography
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: number | string;
  lineHeight?: number;
  lineHeightUnitless?: boolean;
  letterSpacing?: number;
  textAlign?: string;
  textTransform?: string;
  textDecoration?: string;
}

export interface RGB {
  r: number;  // 0-1
  g: number;  // 0-1
  b: number;  // 0-1
  a?: number; // 0-1
}

export interface BoxShadow {
  offsetX: number;
  offsetY: number;
  blur: number;
  spread: number;
  color: RGB;
  inset?: boolean;
}

// Parse inline style string into object
export function parseInlineStyles(styleStr: string): ParsedStyles {
  if (!styleStr) return {};
  
  const styles: ParsedStyles = {};
  const declarations = styleStr.split(';').filter(d => d.trim());
  
  for (const decl of declarations) {
    const [prop, value] = decl.split(':').map(s => s.trim());
    if (!prop || !value) continue;
    
    switch (prop) {
      case 'display':
        styles.display = value;
        break;
      case 'flex-direction':
        styles.flexDirection = value;
        break;
      case 'justify-content':
        styles.justifyContent = value;
        break;
      case 'align-items':
        styles.alignItems = value;
        break;
      case 'gap': {
        const gapVal = parseUnit(value);
        if (gapVal !== undefined) styles.gap = gapVal;
        break;
      }
      case 'margin':
        styles.margin = parseMargin(value);
        break;
      case 'padding':
        styles.padding = parsePadding(value);
        break;
      case 'padding-top':
        if (!styles.padding) styles.padding = { top: 0, right: 0, bottom: 0, left: 0 };
        styles.padding.top = parseUnit(value) ?? 0;
        break;
      case 'padding-right':
        if (!styles.padding) styles.padding = { top: 0, right: 0, bottom: 0, left: 0 };
        styles.padding.right = parseUnit(value) ?? 0;
        break;
      case 'padding-bottom':
        if (!styles.padding) styles.padding = { top: 0, right: 0, bottom: 0, left: 0 };
        styles.padding.bottom = parseUnit(value) ?? 0;
        break;
      case 'padding-left':
        if (!styles.padding) styles.padding = { top: 0, right: 0, bottom: 0, left: 0 };
        styles.padding.left = parseUnit(value) ?? 0;
        break;
      case 'background-color':
        styles.backgroundColor = parseColor(value);
        break;
      case 'background':
        if (value !== 'none') {
          styles.backgroundColor = parseColor(value);
        }
        break;
      case 'color':
        styles.color = parseColor(value);
        break;
      case 'opacity':
        styles.opacity = parseFloat(value);
        break;
      case 'box-shadow':
        styles.boxShadow = parseBoxShadow(value);
        break;
      case 'overflow':
        styles.overflow = value;
        break;
      case 'border-radius': {
        const brVal = parseUnit(value);
        if (brVal !== undefined) styles.borderRadius = brVal;
        break;
      }
      case 'border-color':
        styles.borderColor = parseColor(value);
        break;
      case 'border-width': {
        const bwVal = parseUnit(value);
        if (bwVal !== undefined) styles.borderWidth = bwVal;
        break;
      }
      case 'border':
        // Parse shorthand: "1px solid #000" or "none"
        if (value === 'none') {
          styles.borderWidth = 0;
          styles.borderColor = undefined;
        } else {
          const borderParts = value.split(' ');
          if (borderParts[0]) {
            const bwShort = parseUnit(borderParts[0]);
            if (bwShort !== undefined) styles.borderWidth = bwShort;
          }
          if (borderParts[2]) styles.borderColor = parseColor(borderParts[2]);
        }
        break;
      // Border longhand properties (from getComputedStyle)
      case 'border-top-width':
      case 'border-right-width':
      case 'border-bottom-width':
      case 'border-left-width': {
        const bLongVal = parseUnit(value);
        if (bLongVal !== undefined) {
          // Figma uses uniform stroke weight — take the max of all four sides
          styles.borderWidth = Math.max(styles.borderWidth ?? 0, bLongVal);
        }
        break;
      }
      case 'border-top-style':
      case 'border-right-style':
      case 'border-bottom-style':
      case 'border-left-style':
        // Track whether any border-*-style property was seen and if any is solid.
        (styles as Record<string, unknown>).__borderStyleSeen = true;
        if (value === 'solid') {
          (styles as Record<string, unknown>).__borderHasSolid = true;
        }
        break;
      case 'border-top-color':
      case 'border-right-color':
      case 'border-bottom-color':
      case 'border-left-color': {
        // Use first non-transparent color
        if (!styles.borderColor) {
          const bColor = parseColor(value);
          if (bColor) styles.borderColor = bColor;
        }
        break;
      }
      case 'width': {
        const wVal = parseUnit(value);
        if (wVal !== undefined) styles.width = wVal;
        break;
      }
      case 'height': {
        const hVal = parseUnit(value);
        if (hVal !== undefined) styles.height = hVal;
        break;
      }
      case 'min-width': {
        const mnwVal = parseUnit(value);
        if (mnwVal !== undefined) styles.minWidth = mnwVal;
        break;
      }
      case 'min-height': {
        const mnhVal = parseUnit(value);
        if (mnhVal !== undefined) styles.minHeight = mnhVal;
        break;
      }
      case 'max-width': {
        const mxwVal = parseUnit(value);
        if (mxwVal !== undefined) styles.maxWidth = mxwVal;
        break;
      }
      case 'max-height': {
        const mxhVal = parseUnit(value);
        if (mxhVal !== undefined) styles.maxHeight = mxhVal;
        break;
      }
      case 'font-family':
        styles.fontFamily = value.split(',')[0].replace(/['"]/g, '').trim();
        break;
      case 'font-size': {
        const fsVal = parseUnit(value);
        if (fsVal !== undefined) styles.fontSize = fsVal;
        break;
      }
      case 'font-weight':
        styles.fontWeight = isNaN(Number(value)) ? value : Number(value);
        break;
      case 'line-height': {
        const lineHeight = parseLineHeight(value);
        styles.lineHeight = lineHeight.value;
        styles.lineHeightUnitless = lineHeight.unitless;
        break;
      }
      case 'letter-spacing': {
        const lsVal = parseUnit(value);
        if (lsVal !== undefined) styles.letterSpacing = lsVal;
        break;
      }
      case 'text-align':
        styles.textAlign = value;
        break;
      case 'text-transform':
        styles.textTransform = value;
        break;
      case 'text-decoration':
        styles.textDecoration = value;
        break;
      case 'flex-grow':
        styles.flexGrow = parseFloat(value);
        break;
      case 'flex-shrink':
        styles.flexShrink = parseFloat(value);
        break;
      case 'flex':
        parseFlexShorthand(value, styles);
        break;
      case 'position':
        styles.position = value;
        break;
    }
  }

  // If border-*-style longhand properties were seen but none was 'solid', clear border
  const borderStyleSeen = (styles as Record<string, unknown>).__borderStyleSeen;
  const borderHasSolid = (styles as Record<string, unknown>).__borderHasSolid;
  if (borderStyleSeen && !borderHasSolid) {
    styles.borderWidth = undefined;
    styles.borderColor = undefined;
  }
  delete (styles as Record<string, unknown>).__borderStyleSeen;
  delete (styles as Record<string, unknown>).__borderHasSolid;

  if (styles.lineHeightUnitless && styles.fontSize && styles.lineHeight !== undefined) {
    styles.lineHeight = styles.lineHeight * styles.fontSize;
    styles.lineHeightUnitless = false;
  }
  
  return styles;
}

// Non-numeric CSS keywords that should not produce a numeric value
const CSS_KEYWORDS = new Set(['none', 'auto', 'normal', 'inherit', 'initial', 'unset']);

// Parse CSS unit to pixels. Returns undefined for non-numeric keywords.
function parseUnit(value: string): number | undefined {
  if (!value) return undefined;

  const trimmed = value.trim();
  if (CSS_KEYWORDS.has(trimmed)) return undefined;
  
  const num = parseFloat(trimmed);
  if (isNaN(num)) return undefined;
  
  // Handle different units
  if (trimmed.endsWith('rem')) return num * 16; // Assume 16px base
  if (trimmed.endsWith('em')) return num * 16;  // Simplified
  
  return num; // Assume px
}

// Parse padding shorthand
function parsePadding(value: string): { top: number; right: number; bottom: number; left: number } {
  const parts = value.split(' ').map(v => parseUnit(v) ?? 0);
  
  if (parts.length === 1) {
    return { top: parts[0], right: parts[0], bottom: parts[0], left: parts[0] };
  } else if (parts.length === 2) {
    return { top: parts[0], right: parts[1], bottom: parts[0], left: parts[1] };
  } else if (parts.length === 3) {
    return { top: parts[0], right: parts[1], bottom: parts[2], left: parts[1] };
  } else {
    return { top: parts[0] || 0, right: parts[1] || 0, bottom: parts[2] || 0, left: parts[3] || 0 };
  }
}

function parseMargin(value: string): { top: number; right: number; bottom: number; left: number } {
  const parts = value.split(' ').map(v => parseUnit(v) ?? 0);
  
  if (parts.length === 1) {
    return { top: parts[0], right: parts[0], bottom: parts[0], left: parts[0] };
  } else if (parts.length === 2) {
    return { top: parts[0], right: parts[1], bottom: parts[0], left: parts[1] };
  } else if (parts.length === 3) {
    return { top: parts[0], right: parts[1], bottom: parts[2], left: parts[1] };
  }
  
  return { top: parts[0] || 0, right: parts[1] || 0, bottom: parts[2] || 0, left: parts[3] || 0 };
}

function parseLineHeight(value: string): { value: number | undefined; unitless: boolean } {
  if (!value) return { value: undefined, unitless: false };

  const parsed = parseUnit(value);
  if (parsed === undefined) return { value: undefined, unitless: false };

  if (value.endsWith('px') || value.endsWith('rem') || value.endsWith('em')) {
    return { value: parsed, unitless: false };
  }

  return { value: parsed, unitless: true };
}

function parseFlexShorthand(value: string, styles: ParsedStyles) {
  const normalized = value.trim();
  if (normalized === 'none') {
    styles.flexGrow = 0;
    styles.flexShrink = 0;
    return;
  }

  if (normalized === 'auto') {
    styles.flexGrow = 1;
    styles.flexShrink = 1;
    return;
  }

  const parts = normalized.split(' ');
  if (parts[0]) styles.flexGrow = parseFloat(parts[0]);
  if (parts[1]) styles.flexShrink = parseFloat(parts[1]);
}

function splitOutsideParens(value: string): string[] {
  const parts: string[] = [];
  let current = '';
  let depth = 0;

  for (const char of value) {
    if (char === '(') depth += 1;
    if (char === ')') depth -= 1;

    if (char === ',' && depth === 0) {
      parts.push(current.trim());
      current = '';
      continue;
    }

    current += char;
  }

  if (current.trim()) parts.push(current.trim());
  return parts;
}

function parseBoxShadow(value: string): BoxShadow[] {
  const shadows: BoxShadow[] = [];
  const shadowParts = splitOutsideParens(value);

  for (const shadow of shadowParts) {
    const inset = shadow.includes('inset');
    const colorMatch = shadow.match(/rgba?\([^)]+\)|#[0-9a-fA-F]{3,8}|\b[a-zA-Z]+\b/);
    const colorToken = colorMatch ? colorMatch[0] : 'black';
    const color = parseColor(colorToken) || { r: 0, g: 0, b: 0 };

    const cleaned = shadow
      .replace('inset', '')
      .replace(colorToken, '')
      .trim();
    const numericParts = cleaned.split(/\s+/).filter(Boolean).map(v => parseUnit(v) ?? 0);

    if (numericParts.length < 2) continue;

    const [offsetX, offsetY, blur = 0, spread = 0] = numericParts;

    shadows.push({
      offsetX,
      offsetY,
      blur,
      spread,
      color,
      inset,
    });
  }

  return shadows;
}

// Parse CSS color to Figma RGB format (0-1 range)
export function parseColor(color: string): RGB | undefined {
  if (!color || color === 'transparent') return undefined;
  
  // Hex colors
  if (color.startsWith('#')) {
    const hex = color.slice(1);
    let r, g, b;
    
    if (hex.length === 3) {
      r = parseInt(hex[0] + hex[0], 16);
      g = parseInt(hex[1] + hex[1], 16);
      b = parseInt(hex[2] + hex[2], 16);
    } else if (hex.length === 6) {
      r = parseInt(hex.slice(0, 2), 16);
      g = parseInt(hex.slice(2, 4), 16);
      b = parseInt(hex.slice(4, 6), 16);
    } else {
      return undefined;
    }
    
    return { r: r / 255, g: g / 255, b: b / 255 };
  }
  
  // rgb() or rgba()
  const rgbMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
  if (rgbMatch) {
    return {
      r: parseInt(rgbMatch[1]) / 255,
      g: parseInt(rgbMatch[2]) / 255,
      b: parseInt(rgbMatch[3]) / 255,
      a: rgbMatch[4] ? parseFloat(rgbMatch[4]) : 1,
    };
  }
  
  // Named colors (subset)
  const namedColors: Record<string, RGB> = {
    white: { r: 1, g: 1, b: 1 },
    black: { r: 0, g: 0, b: 0 },
    red: { r: 1, g: 0, b: 0 },
    green: { r: 0, g: 1, b: 0 },
    blue: { r: 0, g: 0, b: 1 },
    gray: { r: 0.5, g: 0.5, b: 0.5 },
    grey: { r: 0.5, g: 0.5, b: 0.5 },
    orange: { r: 1, g: 0.65, b: 0 },
    yellow: { r: 1, g: 1, b: 0 },
    purple: { r: 0.5, g: 0, b: 0.5 },
    pink: { r: 1, g: 0.75, b: 0.8 },
  };
  
  return namedColors[color.toLowerCase()];
}
