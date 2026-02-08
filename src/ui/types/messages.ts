// Message protocol types for UI ↔ Plugin communication

import type { DesignSystem } from './catalog';
import type { ParsedElement } from '../utils/parseHtml';

// UI → Plugin messages
export interface PluginReadyMessage {
  type: 'PLUGIN_READY';
}

export interface PlaceComponentMessage {
  type: 'PLACE_COMPONENT';
  payload: {
    designSystemId: string;
    componentId: string;
    variantName?: string;
    parsedElement: ParsedElement;
  };
  requestId: string;
}

export interface CancelPlacementMessage {
  type: 'CANCEL_PLACEMENT';
  requestId: string;
}

export type UIMessage = 
  | PluginReadyMessage
  | PlaceComponentMessage
  | CancelPlacementMessage;

// Plugin → UI messages
export interface CatalogDataMessage {
  type: 'CATALOG_DATA';
  payload: {
    designSystems: DesignSystem[];
  };
}

export interface PlacementStartedMessage {
  type: 'PLACEMENT_STARTED';
  requestId: string;
}

export interface PlacementCompleteMessage {
  type: 'PLACEMENT_COMPLETE';
  requestId: string;
  payload: {
    nodeName: string;
    warnings: string[];
  };
}

export interface PlacementErrorMessage {
  type: 'PLACEMENT_ERROR';
  requestId: string;
  payload: {
    error: string;
    fallbackUsed: boolean;
  };
}

export type PluginMessage =
  | CatalogDataMessage
  | PlacementStartedMessage
  | PlacementCompleteMessage
  | PlacementErrorMessage;
