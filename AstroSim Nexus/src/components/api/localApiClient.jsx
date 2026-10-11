/**
 * AstroSim Nexus – Local API Client
 */

const API_URL =
  // @ts-ignore
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) ||
  'http://localhost:3001';
console.log('--- API CLIENT (API/LOCAL) LOADED --- URL:', API_URL);



// ─── Auth token storage ───────────────────────────────────────────────────────

function getToken() {
  return typeof localStorage !== 'undefined'
    ? localStorage.getItem('auth_token')
    : null;
}

function setToken(token) {
  if (typeof localStorage !== 'undefined') {
    if (token) localStorage.setItem('auth_token', token);
    else localStorage.removeItem('auth_token');
  }
}

// ─── Core fetch helper ────────────────────────────────────────────────────────

async function apiFetch(method, path, body, queryParams) {
  const url = new URL(`${API_URL}${path}`);

  if (queryParams) {
    Object.entries(queryParams).forEach(([k, v]) => {
      if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
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
    throw new Error(err.error || `Request failed: ${res.status}`);
  }

  return res.json();
}

// ─── Entity API factory ───────────────────────────────────────────────────────

/**
 * @typedef {Object} EntityAPI
 * @property {function(Object=): Promise<Array>} list - List entities
 * @property {function(string): Promise<Object>} get - Get entity by ID
 * @property {function(Object): Promise<Object>} create - Create entity
 * @property {function(string, Object): Promise<Object>} update - Update entity
 * @property {function(string): Promise<Object>} delete - Delete entity
 * @property {function(Object, Object=): Promise<Array>} filter - Filter entities
 * @property {function(Array): Promise<Array>} bulkCreate - Bulk create entities
 */

function createEntityAPI(entityName) {
  const base = `/api/${entityName}`;
  return {
    list: (params) => apiFetch('GET', base, undefined, params),
    get: (id) => apiFetch('GET', `${base}/${id}`),
    create: (data) => apiFetch('POST', base, data),
    update: (id, data) => apiFetch('PUT', `${base}/${id}`, data),
    delete: (id) => apiFetch('DELETE', `${base}/${id}`),
    filter: (query, params) => apiFetch('POST', `${base}/filter`, query, params),
    bulkCreate: (items) => apiFetch('POST', `${base}/bulk`, items),
  };
}

/**
 * @type {Object.<string, EntityAPI>}
 */
export const entities = new Proxy({}, {
  get(target, entityName) {
    if (typeof entityName !== 'string') return target[entityName];
    if (!target[entityName]) {
      target[entityName] = createEntityAPI(entityName);
    }
    return target[entityName];
  },
});

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const auth = {
  login: async (email, password) => {
    const data = await apiFetch('POST', '/api/auth/login', { email, password });
    if (data.token) setToken(data.token);
    return data;
  },
  register: async (userData) => {
    const data = await apiFetch('POST', '/api/auth/register', userData);
    if (data.token) setToken(data.token);
    return data;
  },
  logout: async () => {
    setToken(null);
    return { success: true };
  },
  me: () => apiFetch('GET', '/api/auth/me'),
};

export const localClient = { entities, auth };
