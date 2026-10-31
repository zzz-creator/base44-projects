/**
 * Robust Local API Client
 * Mimics the Base44 SDK surface against a local Express/MSSQL backend.
 *
 * Signatures match the Base44 SDK:
 *   entities.X.list(orderBy?, limit?)
 *   entities.X.filter(query?, orderBy?, limit?)
 *   entities.X.get(id) / create(data) / update(id, data) / delete(id) / bulkCreate(items)
 *   auth.me() / login(email, password) / register(data) / updateMe(data) / logout() / isAuthenticated()
 *   integrations.Core.InvokeLLM({ prompt, response_json_schema }) / UploadFile(data)
 *   appLogs.logUserInApp(pageName)
 */

// @ts-ignore
const API_BASE_URL = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) || 'http://localhost:3001';

const SDK_CONFIG = {
  apiPrefix: '/api',
  entityPathPrefix: '/entities',
  tokenKey: 'auth_token',
  // Offline dev fallback: these apps have no login route (they used Base44's
  // hosted auth), so boot as a local admin instead of hard-failing.
  devFallback: true,
};

const DEV_USER = {
  id: 'local-dev-user',
  email: 'dev@localhost.com',
  full_name: 'Local Developer',
  role: 'admin',
};

// ─── Utilities ───────────────────────────────────────────────────────────────

function getToken() {
  return typeof localStorage !== 'undefined' ? localStorage.getItem(SDK_CONFIG.tokenKey) : null;
}

function setToken(token) {
  if (typeof localStorage !== 'undefined') {
    if (token) localStorage.setItem(SDK_CONFIG.tokenKey, token);
    else localStorage.removeItem(SDK_CONFIG.tokenKey);
  }
}

// ─── API Helper ──────────────────────────────────────────────────────────────

async function apiFetch(method, path, body, queryParams) {
  const url = new URL(`${API_BASE_URL}${SDK_CONFIG.apiPrefix}${path}`);
  if (queryParams) {
    Object.entries(queryParams).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, String(v));
    });
  }

  const token = getToken();
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(url.toString(), {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    const error = new Error(err.error || `Request failed: ${res.status}`);
    // @ts-ignore
    error.status = res.status;
    throw error;
  }

  return res.json();
}

// ─── Custom Entity Class ─────────────────────────────────────────────────────

export class CustomEntity {
  constructor(entityName) {
    this.entityName = entityName;
  }

  get basePath() {
    return `${SDK_CONFIG.entityPathPrefix}/${this.entityName}`;
  }

  async list(orderBy = null, limit = null) {
    const params = {};
    if (orderBy && typeof orderBy === 'object') {
      Object.assign(params, orderBy);
    } else {
      if (orderBy) params.orderBy = orderBy;
      if (limit != null) params.limit = limit;
    }
    return apiFetch('GET', this.basePath, undefined, params);
  }

  async get(id) {
    return apiFetch('GET', `${this.basePath}/${id}`);
  }

  async create(data) {
    return apiFetch('POST', this.basePath, data);
  }

  async update(id, data) {
    return apiFetch('PUT', `${this.basePath}/${id}`, data);
  }

  async delete(id) {
    return apiFetch('DELETE', `${this.basePath}/${id}`);
  }

  async filter(query = {}, orderBy = null, limit = null) {
    const params = {};
    if (orderBy && typeof orderBy === 'object') {
      Object.assign(params, orderBy);
    } else {
      if (orderBy) params.sort = orderBy;
      if (limit != null) params.limit = limit;
    }
    return apiFetch('POST', `${this.basePath}/filter`, query, params);
  }

  async bulkCreate(items) {
    return apiFetch('POST', `${this.basePath}/bulk`, items);
  }

  // Base44 SDK supports realtime subscriptions; the local client has no realtime
  // transport, so this is a no-op that returns an unsubscribe function. Callers
  // still get their initial data from list()/filter() and never crash.
  subscribe(_callback) {
    return () => {};
  }
}

// ─── User Entity (Auth) ──────────────────────────────────────────────────────

export class UserEntity extends CustomEntity {
  constructor() {
    super('User');
  }

  async me() {
    if (!getToken() && SDK_CONFIG.devFallback) return { ...DEV_USER };
    return apiFetch('GET', '/auth/me');
  }

  async login(email, password) {
    const data = await apiFetch('POST', '/auth/login', { email, password });
    if (data.token) setToken(data.token);
    return data;
  }

  // Alias kept for Base44 SDK compatibility.
  async loginViaEmailPassword(email, password) {
    return this.login(email, password);
  }

  async register(userData) {
    const data = await apiFetch('POST', '/auth/register', userData);
    if (data.token) setToken(data.token);
    return data;
  }

  async updateMe(data) {
    if (!getToken() && SDK_CONFIG.devFallback) return { ...DEV_USER, ...data };
    return apiFetch('PUT', '/auth/me', data);
  }

  async logout() {
    setToken(null);
    return { success: true };
  }

  async isAuthenticated() {
    if (SDK_CONFIG.devFallback && !getToken()) return true;
    return !!getToken();
  }

  // The offline build has no hosted login page; keep this a no-op so callers
  // (e.g. "Sign in again" buttons) do not navigate to a missing /login route.
  redirectToLogin() {
    // eslint-disable-next-line no-console
    console.info('[local] redirectToLogin() is a no-op offline; using local dev session.');
  }
}

// ─── Integrations ────────────────────────────────────────────────────────────

import { GoogleGenAI } from '@google/genai';

const integrations = {
  Core: {
    InvokeLLM: async (data) => {
      // @ts-ignore
      const geminiKey = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GEMINI_API_KEY) || undefined;
      if (geminiKey) {
        const ai = new GoogleGenAI({ apiKey: geminiKey });
        const config = {};
        if (data.response_json_schema) {
          config.responseMimeType = 'application/json';
          config.responseSchema = data.response_json_schema;
        }
        const response = await ai.models.generateContent({
          model: data.model || 'gemini-3-flash-preview',
          contents: data.prompt,
          config: Object.keys(config).length > 0 ? config : undefined,
        });
        const textResponse = response.text || '';
        if (data.response_json_schema) {
          try {
            return { data: JSON.parse(textResponse) };
          } catch {
            return { data: textResponse };
          }
        }
        return { response: textResponse };
      }
      return apiFetch('POST', '/integrations/Core/InvokeLLM', data);
    },
    UploadFile: async (data) => {
      if (data && (data.file_url || data.data_url)) {
        return { file_url: data.file_url || data.data_url };
      }
      return apiFetch('POST', '/integrations/Core/UploadFile', data);
    },
  },
};

// ─── App Logs ────────────────────────────────────────────────────────────────

const appLogs = {
  logUserInApp: async (pageName) => {
    try {
      return await apiFetch('POST', '/logs/user-app-logs', { page_name: pageName });
    } catch {
      return { success: false };
    }
  },
};

// ─── Factory & Proxy ─────────────────────────────────────────────────────────

function createEntitiesProxy() {
  const cache = {};
  return new Proxy({}, {
    get(target, name) {
      if (typeof name !== 'string') return target[name];
      if (!cache[name]) cache[name] = new CustomEntity(name);
      return cache[name];
    },
    has() {
      return true;
    },
  });
}

export function configureSDK(config) {
  Object.assign(SDK_CONFIG, config);
}

// ─── Agents (Base44 AI agents — stubbed for local dev) ───────────────────────
// OpsGrid's WorkspaceControl / IncidentResolution pages use Base44's agent
// conversation API. The local client has no realtime agent backend, so these
// return empty/no-op results to keep the pages rendering without crashing.
const agents = {
  async listConversations() {
    return [];
  },
  async createConversation(params) {
    return { id: `local-conv-${Date.now()}`, agent_name: params?.agent_name, metadata: params?.metadata, messages: [] };
  },
  async getConversation(id) {
    return { id, messages: [] };
  },
  async addMessage() {
    return { success: true };
  },
  subscribeToConversation() {
    return () => {};
  },
};

// ─── Export Client ───────────────────────────────────────────────────────────

export const base44LocalClient = {
  entities: createEntitiesProxy(),
  auth: new UserEntity(),
  integrations,
  appLogs,
  agents,
  configure: configureSDK,
};

export default base44LocalClient;
