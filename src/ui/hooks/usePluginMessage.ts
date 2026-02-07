import { useEffect, useCallback } from 'react';
import type { UIMessage, PluginMessage } from '../types/messages';

type MessageHandler = (message: PluginMessage) => void;

export function usePluginMessage(handler: MessageHandler) {
  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      const message = event.data.pluginMessage as PluginMessage;
      if (message) {
        handler(message);
      }
    };

    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [handler]);

  const sendMessage = useCallback((message: UIMessage) => {
    parent.postMessage({ pluginMessage: message }, '*');
  }, []);

  return { sendMessage };
}
