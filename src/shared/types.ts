// Shared types between plugin and UI

export interface MessageEnvelope<T = unknown> {
  type: string;
  payload?: T;
  requestId?: string;
}
