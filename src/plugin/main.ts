// Figma plugin main thread entry point

// Import catalog data files
import muiCatalog from '../catalog/mui-v5.json';
import spectrumCatalog from '../catalog/spectrum.json';
import tailwindCatalog from '../catalog/tailwind-ui.json';

import type { DesignSystem } from '../ui/types/catalog';
import { htmlToFigma } from './converter';

// Load catalog data files
function loadCatalogData(): DesignSystem[] {
  const catalogs: DesignSystem[] = [];
  
  try {
    catalogs.push(
      muiCatalog as DesignSystem,
      spectrumCatalog as DesignSystem,
      tailwindCatalog as DesignSystem
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
      const { designSystemId, componentId, variantName, html } = msg.payload;
      
      // Convert HTML to Figma nodes
      const nodeName = variantName 
        ? `${designSystemId}/${componentId}/${variantName}`
        : `${designSystemId}/${componentId}`;
      
      const result = await htmlToFigma(html, nodeName);
      
      if (!result.node) {
        throw new Error('Conversion failed to create node');
      }
      
      // Add to current page or selected frame
      const parent = figma.currentPage.selection.length > 0 && figma.currentPage.selection[0].type === 'FRAME'
        ? figma.currentPage.selection[0] as FrameNode
        : figma.currentPage;
      
      parent.appendChild(result.node);
      
      // Select and scroll into view
      figma.currentPage.selection = [result.node];
      figma.viewport.scrollAndZoomIntoView([result.node]);
      
      figma.ui.postMessage({
        type: 'PLACEMENT_COMPLETE',
        requestId: msg.requestId,
        payload: {
          nodeName: result.node.name,
          warnings: result.warnings.map(w => w.message),
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
});
