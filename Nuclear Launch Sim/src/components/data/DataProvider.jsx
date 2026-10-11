/**
 * Data Provider - local data access layer.
 *
 * Delegates to the robust local client (`src/api/base44-local-client.js`) so the
 * app talks to the Express/MSSQL backend via the Base44-compatible SDK surface.
 * The legacy helper members kept below are still referenced across the app and
 * are preserved for backwards compatibility.
 */

import { base44LocalClient } from '../../api/base44-local-client';

/**
 * Check if running in offline mode (always true for the local sim).
 */
export const isOffline = () => true;

/**
 * Set offline mode. Kept as a no-op: the local client handles connectivity.
 */
export const useOfflineMode = async (_offline) => {
  return true;
};

/**
 * Unified data provider: the local client plus the legacy extras the app uses.
 */
export const dataProvider = {
  ...base44LocalClient,

  // Legacy AI helper (superseded by integrations.Core.InvokeLLM)
  ai: {
    generateText: async (prompt) => {
      console.log('[Local AI] Text generation requested:', prompt);
      return "This is a local AI response (mocked).";
    },
    generateImage: async (prompt) => {
      console.log('[Local AI] Image generation requested:', prompt);
      return { url: 'https://via.placeholder.com/512?text=Local+AI+Image' };
    }
  },

  // Legacy storage helper
  storage: {
    upload: async (file) => {
      console.log('[Local Storage] File upload requested:', file.name);
      return { url: URL.createObjectURL(file) };
    },
    getDownloadUrl: async (path) => {
      return path;
    }
  },

  // Legacy cloud-functions helper
  functions: {
    invoke: async (name, data) => {
      console.log(`[Local Function] Invoke: ${name}`, data);
      return { success: true, message: 'Local function invoked' };
    }
  },

  // Legacy agents helper
  agents: {
    createConversation: async ({ agent_name, metadata }) => {
      console.log(`[Local Agents] Created conversation with agent: ${agent_name}`, metadata);
      return { id: 'local-conv-' + Date.now(), messages: [] };
    },
    subscribeToConversation: (conversationId, callback) => {
      console.log(`[Local Agents] Subscribed to conversation: ${conversationId}`);
      setTimeout(() => callback({ messages: [] }), 100);
      return () => console.log(`[Local Agents] Unsubscribed from: ${conversationId}`);
    },
    addMessage: async (conversation, { role, content }) => {
      console.log(`[Local Agents] Added message to ${conversation.id}:`, { role, content });
      return {
        success: true,
        message: { role, content, timestamp: new Date().toISOString() }
      };
    }
  },

  // Legacy analytics helper
  analytics: {
    track: (event) => {
      const localEvents = JSON.parse(localStorage.getItem('localAnalytics') || '[]');
      localEvents.push({ ...event, timestamp: new Date().toISOString() });
      localStorage.setItem('localAnalytics', JSON.stringify(localEvents));
      console.log('Local analytics event tracked:', event);
    }
  },

  // Mode utilities
  isOffline,
  useOfflineMode,
  autoDetectMode: () => true,
  syncOfflineData: async () => {
    console.log('No data to sync in local-only mode');
  }
};

export default dataProvider;
