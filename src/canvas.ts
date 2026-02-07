// Figma plugin main thread entry point

// Import catalog data files
import muiCatalog from '@/catalog/mui-v5.json';
import spectrumCatalog from '@/catalog/spectrum.json';
import tailwindCatalog from '@/catalog/tailwind-ui.json';
import mockDs1Catalog from '@/catalog/mock-ds1.json';
import mockDs2Catalog from '@/catalog/mock-ds2.json';
import mockDs3Catalog from '@/catalog/mock-ds3.json';
import mockDs4Catalog from '@/catalog/mock-ds4.json';
import mockDs5Catalog from '@/catalog/mock-ds5.json';

import type { DesignSystem } from '@/ui/types/catalog';
import { mapElementToFigmaNode, type ConversionWarning } from '@/plugin/converter/mapper';

// Load catalog data files
function loadCatalogData(): DesignSystem[] {
  const catalogs: DesignSystem[] = [];

  try {
    catalogs.push(
      muiCatalog as DesignSystem,
      spectrumCatalog as DesignSystem,
      tailwindCatalog as DesignSystem,
      mockDs1Catalog as DesignSystem,
      mockDs2Catalog as DesignSystem,
      mockDs3Catalog as DesignSystem,
      mockDs4Catalog as DesignSystem,
      mockDs5Catalog as DesignSystem,
    );
  } catch (error) {
    console.error('Failed to load catalog data:', error);
  }

  return catalogs;
}

// Handle messages from UI
figma.ui.onmessage = async (msg) => {
  if (msg.type === 'PLUGIN_READY') {
    // Load catalog and send to UI
    const designSystems = loadCatalogData();
    figma.ui.postMessage({
      type: 'CATALOG_DATA',
      payload: { designSystems },
    });
  } else if (msg.type === 'PLACE_COMPONENT') {
    // Component placement
    figma.ui.postMessage({
      type: 'PLACEMENT_STARTED',
      requestId: msg.requestId,
    });

    try {
      const { designSystemId, componentId, variantName, parsedElement } = msg.payload;

      // Convert parsed element to Figma nodes
      const nodeName = variantName
        ? `${designSystemId}/${componentId}/${variantName}`
        : `${designSystemId}/${componentId}`;

      // Skip parseHTML - use parsedElement directly from UI
      if (!parsedElement || typeof parsedElement === 'string') {
        throw new Error('Invalid parsed element data');
      }

      console.log('parsedElement', parsedElement);

      // Convert to Figma node
      const warnings: ConversionWarning[] = [];
      const node = await mapElementToFigmaNode(parsedElement, warnings);

      if (!node) {
        throw new Error('Conversion resulted in no nodes');
      }

      // Set name
      node.name = nodeName;

      console.log('result', { node, warnings });

      // Add to current page or selected frame
      const parent =
        figma.currentPage.selection.length > 0 && figma.currentPage.selection[0].type === 'FRAME'
          ? (figma.currentPage.selection[0] as FrameNode)
          : figma.currentPage;

      parent.appendChild(node);

      // Select and scroll into view
      figma.currentPage.selection = [node];
      figma.viewport.scrollAndZoomIntoView([node]);

      figma.ui.postMessage({
        type: 'PLACEMENT_COMPLETE',
        requestId: msg.requestId,
        payload: {
          nodeName: node.name,
          warnings: warnings.map((w) => w.message),
        },
      });
    } catch (error) {
      figma.ui.postMessage({
        type: 'PLACEMENT_ERROR',
        requestId: msg.requestId,
        payload: {
          error: error instanceof Error ? error.message : 'Unknown error',
          fallbackUsed: false,
        },
      });
    }
  }
};

// Show UI
figma.showUI(__html__, {
  width: 400,
  height: 600,
  title: 'Design System Catalog',
  themeColors: true,
});
