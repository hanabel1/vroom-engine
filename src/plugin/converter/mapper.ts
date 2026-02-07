// Element to Figma node mapper

import { parseInlineStyles, type ParsedStyles, type RGB } from './styles';
import { classifyElement, type ParsedElement } from './parser';

export interface ConversionWarning {
  message: string;
  element?: string;
}

export async function mapElementToFigmaNode(
  element: ParsedElement,
  warnings: ConversionWarning[] = [],
): Promise<SceneNode | null> {
  const elementType = classifyElement(element);

  if (elementType === 'skip') {
    return null;
  }

  const styles = parseInlineStyles(element.attributes.style || '');

  if (elementType === 'input') {
    return await createInputNode(element, styles, warnings);
  }

  if (elementType === 'text' && !shouldRenderAsFrame(styles)) {
    return await createTextNode(element, styles, warnings);
  }

  // Create frame for containers or styled text elements
  return await createFrameNode(element, styles, warnings);
}

async function createTextNode(
  element: ParsedElement,
  styles: ParsedStyles,
  warnings: ConversionWarning[],
): Promise<TextNode | null> {
  const text = element.textContent?.trim() || '';
  if (!text) return null;

  return await createTextNodeFromText(text, styles, warnings, element.tagName);
}

async function createFrameNode(
  element: ParsedElement,
  styles: ParsedStyles,
  warnings: ConversionWarning[],
): Promise<FrameNode> {
  const frame = figma.createFrame();
  frame.name = element.tagName;

  // Apply background color
  if (styles.backgroundColor) {
    frame.fills = [buildSolidPaint(styles.backgroundColor)];
  } else {
    frame.fills = []; // Transparent
  }

  // Apply border
  if (styles.borderColor && styles.borderWidth) {
    frame.strokes = [buildSolidPaint(styles.borderColor)];
    frame.strokeWeight = styles.borderWidth;
  }

  // Apply corner radius
  if (styles.borderRadius) {
    frame.cornerRadius = styles.borderRadius;
  }

  // Apply opacity
  if (styles.opacity !== undefined) {
    frame.opacity = styles.opacity;
  }

  if (styles.boxShadow && styles.boxShadow.length > 0) {
    frame.effects = styles.boxShadow.map((shadow) => ({
      type: shadow.inset ? 'INNER_SHADOW' : 'DROP_SHADOW',
      color: { ...shadow.color, a: shadow.color.a ?? 1 },
      offset: { x: shadow.offsetX, y: shadow.offsetY },
      radius: shadow.blur,
      spread: shadow.spread,
      visible: true,
      blendMode: 'NORMAL',
    }));
  }

  if (styles.overflow === 'hidden') {
    frame.clipsContent = true;
  }

  // Auto layout: default to vertical for non-flex containers
  const isFlex = styles.display === 'flex' || styles.display === 'inline-flex';
  frame.layoutMode = isFlex ? (styles.flexDirection === 'column' ? 'VERTICAL' : 'HORIZONTAL') : 'VERTICAL';

  // Alignment (flex only)
  if (isFlex && styles.justifyContent) {
    frame.primaryAxisAlignItems = mapJustifyContent(styles.justifyContent);
  }

  if (isFlex && styles.alignItems) {
    frame.counterAxisAlignItems = mapAlignItems(styles.alignItems);
  }

  // Spacing
  if (styles.gap !== undefined) {
    frame.itemSpacing = styles.gap;
  }

  // Padding
  if (styles.padding) {
    frame.paddingTop = styles.padding.top;
    frame.paddingRight = styles.padding.right;
    frame.paddingBottom = styles.padding.bottom;
    frame.paddingLeft = styles.padding.left;
  }

  try {
    applyAutoLayoutSizing(frame, styles);
  } catch (err) {
    warnings.push({
      message: `Auto-layout sizing failed: ${err instanceof Error ? err.message : String(err)}`,
      element: element.tagName,
    });
  }

  // Process children
  for (const child of element.children) {
    if (typeof child === 'string') {
      const textNode = await createTextNodeFromText(child.trim(), styles, warnings, element.tagName);
      if (textNode) frame.appendChild(textNode);
    } else {
      const childNode = await mapElementToFigmaNode(child, warnings);
      if (childNode) {
        const childStyles = parseInlineStyles(child.attributes.style || '');
        applyChildLayoutProps(childNode, childStyles);
        frame.appendChild(childNode);
      }
    }
  }

  return frame;
}

async function createInputNode(
  element: ParsedElement,
  styles: ParsedStyles,
  warnings: ConversionWarning[],
): Promise<FrameNode> {
  const frame = await createFrameNode(element, styles, warnings);
  const placeholder = element.attributes.placeholder || '';
  if (placeholder) {
    const textNode = await createTextNodeFromText(placeholder, styles, warnings, element.tagName);
    if (textNode) frame.appendChild(textNode);
  }

  return frame;
}

// Helper functions for mapping CSS values to Figma enums
function mapFontWeight(weight?: number | string): string {
  if (!weight) return 'Regular';

  const numWeight = typeof weight === 'string' ? parseInt(weight) : weight;

  if (numWeight >= 700) return 'Bold';
  if (numWeight >= 600) return 'Semi Bold';
  if (numWeight >= 500) return 'Medium';
  if (numWeight >= 300) return 'Light';

  return 'Regular';
}

function mapTextAlign(align: string): 'LEFT' | 'CENTER' | 'RIGHT' {
  switch (align) {
    case 'center':
      return 'CENTER';
    case 'right':
      return 'RIGHT';
    default:
      return 'LEFT';
  }
}

function mapJustifyContent(value: string): 'MIN' | 'CENTER' | 'MAX' | 'SPACE_BETWEEN' {
  switch (value) {
    case 'flex-start':
      return 'MIN';
    case 'center':
      return 'CENTER';
    case 'flex-end':
      return 'MAX';
    case 'space-between':
      return 'SPACE_BETWEEN';
    default:
      return 'MIN';
  }
}

function mapAlignItems(value: string): 'MIN' | 'CENTER' | 'MAX' {
  switch (value) {
    case 'flex-start':
      return 'MIN';
    case 'center':
      return 'CENTER';
    case 'flex-end':
      return 'MAX';
    default:
      return 'MIN';
  }
}

function shouldRenderAsFrame(styles: ParsedStyles): boolean {
  return (
    styles.backgroundColor !== undefined ||
    styles.borderColor !== undefined ||
    styles.borderWidth !== undefined ||
    styles.borderRadius !== undefined ||
    styles.padding !== undefined ||
    styles.boxShadow !== undefined ||
    styles.display !== undefined ||
    styles.minWidth !== undefined ||
    styles.minHeight !== undefined ||
    styles.maxWidth !== undefined ||
    styles.maxHeight !== undefined ||
    styles.gap !== undefined
  );
}

function applyChildLayoutProps(node: SceneNode, styles: ParsedStyles) {
  if ('layoutGrow' in node && typeof styles.flexGrow === 'number') {
    node.layoutGrow = styles.flexGrow;
  }
}

function applyAutoLayoutSizing(frame: FrameNode, styles: ParsedStyles) {
  if (frame.layoutMode === 'HORIZONTAL') {
    frame.primaryAxisSizingMode = styles.width ? 'FIXED' : 'AUTO';
    frame.counterAxisSizingMode = styles.height ? 'FIXED' : 'AUTO';
  } else {
    frame.primaryAxisSizingMode = styles.height ? 'FIXED' : 'AUTO';
    frame.counterAxisSizingMode = styles.width ? 'FIXED' : 'AUTO';
  }

  if (styles.width || styles.height) {
    const width = styles.width ?? 100;
    const height = styles.height ?? 100;
    frame.resize(width, height);
  }

  if ('minWidth' in frame && styles.minWidth !== undefined) {
    frame.minWidth = styles.minWidth > 0 ? styles.minWidth : null;
  }

  if ('minHeight' in frame && styles.minHeight !== undefined) {
    frame.minHeight = styles.minHeight > 0 ? styles.minHeight : null;
  }

  if ('maxWidth' in frame && styles.maxWidth !== undefined) {
    frame.maxWidth = styles.maxWidth > 0 ? styles.maxWidth : null;
  }

  if ('maxHeight' in frame && styles.maxHeight !== undefined) {
    frame.maxHeight = styles.maxHeight > 0 ? styles.maxHeight : null;
  }
}

function buildSolidPaint(color: RGB): SolidPaint {
  const paint: SolidPaint = { type: 'SOLID', color: { r: color.r, g: color.g, b: color.b } };
  if (color.a !== undefined) {
    paint.opacity = color.a;
  }
  return paint;
}

function applyTextTransform(text: string, transform?: string): string {
  if (!transform) return text;
  if (transform === 'uppercase') return text.toUpperCase();
  if (transform === 'lowercase') return text.toLowerCase();
  if (transform === 'capitalize') {
    return text.replace(/\b\w/g, (char) => char.toUpperCase());
  }
  return text;
}

async function createTextNodeFromText(
  text: string,
  styles: ParsedStyles,
  warnings: ConversionWarning[],
  elementName: string,
): Promise<TextNode | null> {
  const normalizedText = text.trim();
  if (!normalizedText) return null;

  const textNode = figma.createText();

  try {
    const fontFamily = styles.fontFamily || 'Inter';
    const fontWeight = mapFontWeight(styles.fontWeight);
    await figma.loadFontAsync({ family: fontFamily, style: fontWeight });
    textNode.fontName = { family: fontFamily, style: fontWeight };
  } catch (error) {
    await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
    textNode.fontName = { family: 'Inter', style: 'Regular' };
    warnings.push({ message: `Font not available, using Inter`, element: elementName });
  }

  textNode.characters = applyTextTransform(normalizedText, styles.textTransform);

  if (styles.fontSize) {
    textNode.fontSize = styles.fontSize;
  }

  if (styles.lineHeight) {
    textNode.lineHeight = { value: styles.lineHeight, unit: 'PIXELS' };
  }

  if (styles.letterSpacing) {
    textNode.letterSpacing = { value: styles.letterSpacing, unit: 'PIXELS' };
  }

  if (styles.textAlign) {
    textNode.textAlignHorizontal = mapTextAlign(styles.textAlign);
  }

  if (styles.color) {
    textNode.fills = [buildSolidPaint(styles.color)];
  }

  if (styles.opacity !== undefined) {
    textNode.opacity = styles.opacity;
  }

  return textNode;
}
