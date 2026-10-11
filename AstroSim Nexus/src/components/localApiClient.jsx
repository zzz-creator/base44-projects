/**
 * LOCAL API CLIENT
 * Drop-in replacement for @/api/base44Client — for fully offline operation.
 *
 * BACKEND SETUP (one-time):
 *   1. Copy components/backend/ → a new top-level server/ directory
 *   2. cd server && npm install
 *   3. node server.js
 *
 * FRONTEND SETUP:
 *   Create a .env file at the project root:
 *     VITE_API_URL=http://localhost:3001
 *
 *   Then run the frontend normally:  npm install && npm run dev
 */

const API_BASE =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) ||
  'http://localhost:3001';
console.log('--- API CLIENT (COMPONENTS/LOCAL) LOADED --- URL:', API_BASE);



const req = async (url, options = {}) => {
  const response = await fetch(`${API_BASE}${url}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`API Error ${response.status}: ${text}`);
  }
  if (response.status === 204) return null;
  return response.json();
};

const makeEntity = (entityName) => ({
  list: (sort = '-created_date', limit = 200) =>
    req(`/api/${entityName}?sort=${encodeURIComponent(sort)}&limit=${limit}`),

  filter: (query = {}, sort = '-created_date', limit = 200) =>
    req(
      `/api/${entityName}/filter?sort=${encodeURIComponent(sort)}&limit=${limit}`,
      { method: 'POST', body: JSON.stringify(query) }
    ),

  create: (data) =>
    req(`/api/${entityName}`, { method: 'POST', body: JSON.stringify(data) }),

  bulkCreate: (items) =>
    req(`/api/${entityName}/bulk`, { method: 'POST', body: JSON.stringify(items) }),

  update: (id, data) =>
    req(`/api/${entityName}/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  delete: (id) =>
    req(`/api/${entityName}/${id}`, { method: 'DELETE' }),

  schema: () => Promise.resolve({}),

  // Real-time subscriptions (no-op in offline mode — use polling instead)
  subscribe: (_callback) => () => {},
});

const ENTITIES = [
  'Colony', 'Ship', 'Faction', 'Resource', 'TradeRoute', 'Inventory',
  'CargoManifest', 'MarketData', 'MarketEvent', 'MarketTransaction',
  'CombatEncounter', 'CombatParticipant', 'CombatLog', 'EventLog',
  'Threat', 'Fleet', 'FleetAssignment', 'DiplomacyAgreement', 'TradeAgreement',
  'EconomicPolicy', 'InfrastructureModule', 'ResearchProject',
  'FactionStrategyProfile', 'FactionStrategicMemory',
  'ShipHull', 'ShipComponent', 'ShipLoadout', 'ShipConstructionOrder',
  'CustomShipClass', 'AuditTrail', 'User',
];

export const base44 = {
  entities: Object.fromEntries(ENTITIES.map((name) => [name, makeEntity(name)])),

  auth: {
    me: async () => ({
      id: 'local-admin',
      email: 'admin@local.dev',
      full_name: 'Local Admin',
      role: 'admin',
    }),
    logout: (redirectUrl) => {
      if (redirectUrl) window.location.href = redirectUrl;
    },
    isAuthenticated: async () => true,
    updateMe: async (data) => ({ id: 'local-admin', email: 'admin@local.dev', ...data }),
    redirectToLogin: () => {},
  },

  integrations: {
    Core: {
      InvokeLLM: async () => { throw new Error('LLM not available in offline mode'); },
      SendEmail: async () => { throw new Error('Email not available in offline mode'); },
      UploadFile: async () => { throw new Error('File upload not available in offline mode'); },
      GenerateImage: async () => { throw new Error('Image generation not available in offline mode'); },
      ExtractDataFromUploadedFile: async () => { throw new Error('Not available in offline mode'); },
    },
  },

  analytics: { track: () => {} },

  agents: {
    createConversation: async () => ({ id: 'local', messages: [] }),
    listConversations: async () => [],
    getConversation: async () => ({ id: 'local', messages: [] }),
    updateConversation: async () => {},
    addMessage: async () => {},
    subscribeToConversation: () => () => {},
    getWhatsAppConnectURL: () => '#',
  },

  users: { inviteUser: async () => {} },
};