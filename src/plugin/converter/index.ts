// HTML to Figma converter entry point

import { parseHTML } from './parser';
import { mapElementToFigmaNode, type ConversionWarning } from './mapper';

export interface ConversionResult {
  node: SceneNode | null;
  warnings: ConversionWarning[];
}

export async function htmlToFigma(html: string, name?: string): Promise<ConversionResult> {
  const warnings: ConversionWarning[] = [];
  
  try {
    // Parse HTML
    const parsed = parseHTML(html);
    if (!parsed || typeof parsed === 'string') {
      warnings.push({ message: 'Failed to parse HTML' });
      return { node: null, warnings };
    }
    
    // Convert to Figma node
    const node = await mapElementToFigmaNode(parsed, warnings);
    
    if (!node) {
      warnings.push({ message: 'Conversion resulted in no nodes' });
      return { node: null, warnings };
    }
    
    // Set name if provided
    if (name) {
      node.name = name;
    }
    
    return { node, warnings };
  } catch (error) {
    warnings.push({
      message: `Conversion error: ${error instanceof Error ? error.message : 'Unknown error'}`,
    });
    return { node: null, warnings };
  }
}
