// CSS inline style parser and color utilities

export interface ParsedStyles {
  // Layout
  display?: string;
  flexDirection?: string;
  justifyContent?: string;
  alignItems?: string;
  gap?: number;
  padding?: { top: number; right: number; bottom: number; left: number };
  
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
  
  // Border
  borderRadius?: number;
  borderColor?: RGB;
  borderWidth?: number;
  
  // Typography
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: number | string;
  lineHeight?: number;
  letterSpacing?: number;
  textAlign?: string;
}

export interface RGB {
  r: number;  // 0-1
  g: number;  // 0-1
  b: number;  // 0-1
  a?: number; // 0-1
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
      case 'gap':
        styles.gap = parseUnit(value);
        break;
      case 'padding':
        styles.padding = parsePadding(value);
        break;
      case 'padding-top':
        if (!styles.padding) styles.padding = { top: 0, right: 0, bottom: 0, left: 0 };
        styles.padding.top = parseUnit(value);
        break;
      case 'padding-right':
        if (!styles.padding) styles.padding = { top: 0, right: 0, bottom: 0, left: 0 };
        styles.padding.right = parseUnit(value);
        break;
      case 'padding-bottom':
        if (!styles.padding) styles.padding = { top: 0, right: 0, bottom: 0, left: 0 };
        styles.padding.bottom = parseUnit(value);
        break;
      case 'padding-left':
        if (!styles.padding) styles.padding = { top: 0, right: 0, bottom: 0, left: 0 };
        styles.padding.left = parseUnit(value);
        break;
      case 'background-color':
        styles.backgroundColor = parseColor(value);
        break;
      case 'color':
        styles.color = parseColor(value);
        break;
      case 'opacity':
        styles.opacity = parseFloat(value);
        break;
      case 'border-radius':
        styles.borderRadius = parseUnit(value);
        break;
      case 'border-color':
        styles.borderColor = parseColor(value);
        break;
      case 'border-width':
        styles.borderWidth = parseUnit(value);
        break;
      case 'border':
        // Parse shorthand: "1px solid #000"
        const borderParts = value.split(' ');
        if (borderParts[0]) styles.borderWidth = parseUnit(borderParts[0]);
        if (borderParts[2]) styles.borderColor = parseColor(borderParts[2]);
        break;
      case 'width':
        styles.width = parseUnit(value);
        break;
      case 'height':
        styles.height = parseUnit(value);
        break;
      case 'min-width':
        styles.minWidth = parseUnit(value);
        break;
      case 'min-height':
        styles.minHeight = parseUnit(value);
        break;
      case 'max-width':
        styles.maxWidth = parseUnit(value);
        break;
      case 'max-height':
        styles.maxHeight = parseUnit(value);
        break;
      case 'font-family':
        styles.fontFamily = value.split(',')[0].replace(/['"]/g, '').trim();
        break;
      case 'font-size':
        styles.fontSize = parseUnit(value);
        break;
      case 'font-weight':
        styles.fontWeight = isNaN(Number(value)) ? value : Number(value);
        break;
      case 'line-height':
        styles.lineHeight = parseUnit(value);
        break;
      case 'letter-spacing':
        styles.letterSpacing = parseUnit(value);
        break;
      case 'text-align':
        styles.textAlign = value;
        break;
    }
  }
  
  return styles;
}

// Parse CSS unit to pixels
function parseUnit(value: string): number {
  if (!value) return 0;
  
  const num = parseFloat(value);
  if (isNaN(num)) return 0;
  
  // Handle different units
  if (value.endsWith('rem')) return num * 16; // Assume 16px base
  if (value.endsWith('em')) return num * 16;  // Simplified
  
  return num; // Assume px
}

// Parse padding shorthand
function parsePadding(value: string): { top: number; right: number; bottom: number; left: number } {
  const parts = value.split(' ').map(parseUnit);
  
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
  };
  
  return namedColors[color.toLowerCase()];
}
