// Element to Figma node mapper

import { parseInlineStyles, type ParsedStyles, type RGB } from './styles';
import { classifyElement, type ParsedElement } from './parser';

export interface ConversionWarning {
  message: string;
  element?: string;
}

export async function mapElementToFigmaNode(
  element: ParsedElement,
  warnings: ConversionWarning[] = []
): Promise<SceneNode | null> {
  const elementType = classifyElement(element);
  
  if (elementType === 'skip') {
    return null;
  }
  
  const styles = parseInlineStyles(element.attributes.style || '');
  
  if (elementType === 'text') {
    return await createTextNode(element, styles, warnings);
  }
  
  // Create frame for containers
  return await createFrameNode(element, styles, warnings);
}

async function createTextNode(
  element: ParsedElement,
  styles: ParsedStyles,
  warnings: ConversionWarning[]
): Promise<TextNode | null> {
  const text = element.textContent?.trim() || '';
  if (!text) return null;
  
  const textNode = figma.createText();
  
  // Load font
  try {
    const fontFamily = styles.fontFamily || 'Inter';
    const fontWeight = mapFontWeight(styles.fontWeight);
    await figma.loadFontAsync({ family: fontFamily, style: fontWeight });
    textNode.fontName = { family: fontFamily, style: fontWeight };
  } catch (error) {
    // Fallback to Inter
    await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
    textNode.fontName = { family: 'Inter', style: 'Regular' };
    warnings.push({ message: `Font not available, using Inter`, element: element.tagName });
  }
  
  textNode.characters = text;
  
  // Apply text styles
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
  
  // Apply color
  if (styles.color) {
    textNode.fills = [{ type: 'SOLID', color: styles.color }];
  }
  
  // Apply opacity
  if (styles.opacity !== undefined) {
    textNode.opacity = styles.opacity;
  }
  
  return textNode;
}

async function createFrameNode(
  element: ParsedElement,
  styles: ParsedStyles,
  warnings: ConversionWarning[]
): Promise<FrameNode> {
  const frame = figma.createFrame();
  frame.name = element.tagName;
  
  // Apply background color
  if (styles.backgroundColor) {
    frame.fills = [{ type: 'SOLID', color: styles.backgroundColor }];
  } else {
    frame.fills = []; // Transparent
  }
  
  // Apply border
  if (styles.borderColor && styles.borderWidth) {
    frame.strokes = [{ type: 'SOLID', color: styles.borderColor }];
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
  
  // Check for flex layout
  if (styles.display === 'flex' || styles.display === 'inline-flex') {
    frame.layoutMode = styles.flexDirection === 'column' ? 'VERTICAL' : 'HORIZONTAL';
    
    // Alignment
    if (styles.justifyContent) {
      frame.primaryAxisAlignMode = mapJustifyContent(styles.justifyContent);
    }
    
    if (styles.alignItems) {
      frame.counterAxisAlignMode = mapAlignItems(styles.alignItems);
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
    
    // Auto sizing
    frame.primaryAxisSizingMode = 'AUTO';
    frame.counterAxisSizingMode = 'AUTO';
  } else {
    // Fixed sizing for non-flex elements
    if (styles.width) {
      frame.resize(styles.width, styles.height || 100);
    } else if (styles.minWidth || styles.maxWidth) {
      frame.resize(styles.minWidth || 200, styles.height || styles.minHeight || 100);
    }
  }
  
  // Process children
  for (const child of element.children) {
    if (typeof child === 'string') {
      // Create text node for string children
      const textNode = figma.createText();
      await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
      textNode.fontName = { family: 'Inter', style: 'Regular' };
      textNode.characters = child.trim();
      frame.appendChild(textNode);
    } else {
      const childNode = await mapElementToFigmaNode(child, warnings);
      if (childNode) {
        frame.appendChild(childNode);
      }
    }
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
    case 'center': return 'CENTER';
    case 'right': return 'RIGHT';
    default: return 'LEFT';
  }
}

function mapJustifyContent(value: string): 'MIN' | 'CENTER' | 'MAX' | 'SPACE_BETWEEN' {
  switch (value) {
    case 'flex-start': return 'MIN';
    case 'center': return 'CENTER';
    case 'flex-end': return 'MAX';
    case 'space-between': return 'SPACE_BETWEEN';
    default: return 'MIN';
  }
}

function mapAlignItems(value: string): 'MIN' | 'CENTER' | 'MAX' {
  switch (value) {
    case 'flex-start': return 'MIN';
    case 'center': return 'CENTER';
    case 'flex-end': return 'MAX';
    default: return 'MIN';
  }
}
