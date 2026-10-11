/**
 * ProdIntel StageOps – Local API Client
 * Drop-in replacement for the base44 SDK client.
 * Talks to the Express backend in components/server/server.js
 *
 * Interface is identical to base44.entities / base44.auth so no
 * page or component imports need to change.
 */

const API_URL =
  // @ts-ignore
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) ||
  'http://localhost:3001';

// ─── Auth token storage ───────────────────────────────────────────────────────

function getToken() {
  return typeof localStorage !== 'undefined'
    ? localStorage.getItem('prodintel_token')
    : null;
}

function setToken(token) {
  if (typeof localStorage !== 'undefined') {
    if (token) localStorage.setItem('prodintel_token', token);
    else localStorage.removeItem('prodintel_token');
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

/**
 * @typedef {Object} EntityAPI
 * @property {function(Object=): Promise<Array>} list - List entities
 * @property {function(string): Promise<Object>} get - Get entity by ID
 * @property {function(Object): Promise<Object>} create - Create entity
 * @property {function(string, Object): Promise<Object>} update - Update entity
 * @property {function(string): Promise<Object>} delete - Delete entity
 * @property {function(Object, Object=): Promise<Array>} filter - Filter entities
 */

function createEntityAPI(entityName) {
  const base = `/api/entities/${entityName}`;

  return {
    /** List all records, optionally sorted/paginated */
    list(sort, limit, skip, _fields) {
      return apiFetch('GET', base, undefined, { sort, limit, skip });
    },

    /** Filter records by key-value pairs */
    filter(query, sort, limit, skip, _fields) {
      return apiFetch('POST', `${base}/filter`, query || {}, { sort, limit, skip });
    },

    /** Get single record by id */
    get(id) {
      return apiFetch('GET', `${base}/${id}`);
    },

    /** Create a new record */
    create(data) {
      return apiFetch('POST', base, data);
    },

    /** Update an existing record by id */
    update(id, data) {
      return apiFetch('PUT', `${base}/${id}`, data);
    },

    /** Delete a record by id */
    delete(id) {
      return apiFetch('DELETE', `${base}/${id}`);
    },

    /** Bulk create multiple records */
    bulkCreate(items) {
      return apiFetch('POST', `${base}/bulk`, items);
    },

    /** Delete records matching a query */
    deleteMany(query) {
      return apiFetch('DELETE', base, query);
    },

    /**
     * Subscribe to realtime changes.
     * Local mode: no-op stub (returns unsubscribe fn).
     * For realtime offline, wire up a WebSocket or polling here.
     */
    subscribe(_callback) {
      return () => {};
    },

    /** Return JSON schema stub (used by JsonSchemaForm) */
    schema() {
      return Promise.resolve({});
    },
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

const auth = {
  /** Get the currently authenticated user */
  async me() {
    return apiFetch('GET', '/api/auth/me');
  },

  /** Update the current user's profile */
  async updateMe(data) {
    return apiFetch('PUT', '/api/auth/me', data);
  },

  /** Login with email/password, stores token */
  async login(email, password) {
    const res = await apiFetch('POST', '/api/auth/login', { email, password });
    setToken(res.token);
    return res;
  },

  /** Register a new user */
  async register(email, password, fullName, role = 'user') {
    const res = await apiFetch('POST', '/api/auth/register', {
      email,
      password,
      full_name: fullName,
      role,
    });
    setToken(res.token);
    return res;
  },

  /** Logout: clears token and redirects */
  logout(redirectUrl) {
    setToken(null);
    if (typeof window !== 'undefined') {
      window.location.href = redirectUrl || '/';
    }
  },

  /** Check if user is currently authenticated */
  async isAuthenticated() {
    try {
      await auth.me();
      return true;
    } catch {
      return false;
    }
  },

  /** Redirect to login page */
  redirectToLogin(nextUrl) {
    if (typeof window !== 'undefined') {
      window.location.href = nextUrl || '/';
    }
  },
};

// ─── Integrations (offline stubs) ─────────────────────────────────────────────

const integrations = {
  Core: {
    InvokeLLM(_params) {
      console.warn('[LocalClient] InvokeLLM is not available in offline mode.');
      return Promise.resolve('Offline mode: AI features not available.');
    },
    SendEmail(_params) {
      console.warn('[LocalClient] SendEmail is not available in offline mode.');
      return Promise.resolve({ success: false, error: 'Offline mode' });
    },
    UploadFile(_params) {
      console.warn('[LocalClient] UploadFile is not available in offline mode.');
      return Promise.resolve({ file_url: '' });
    },
    GenerateImage(_params) {
      console.warn('[LocalClient] GenerateImage is not available in offline mode.');
      return Promise.resolve({ url: '' });
    },
    ExtractDataFromUploadedFile(_params) {
      console.warn('[LocalClient] ExtractDataFromUploadedFile is not available in offline mode.');
      return Promise.resolve({ status: 'error', output: null });
    },
  },
};

// ─── Analytics (stub) ─────────────────────────────────────────────────────────

const analytics = {
  track(_event) {
    // no-op in offline mode
  },
};

// ─── Users helper ─────────────────────────────────────────────────────────────

const users = {
  async inviteUser(email, role = 'user') {
    return auth.register(email, 'TempPassword123!', email.split('@')[0], role);
  },
};

// ─── Agents (stub) ────────────────────────────────────────────────────────────

const agents = {
  createConversation: () => Promise.resolve({}),
  listConversations: () => Promise.resolve([]),
  getConversation: () => Promise.resolve({}),
  addMessage: () => Promise.resolve({}),
  subscribeToConversation: () => () => {},
  getWhatsAppConnectURL: () => '',
};

// ─── Export ───────────────────────────────────────────────────────────────────

export const localClient = {
  entities,
  auth,
  integrations,
  analytics,
  users,
  agents,
};

export default localClient;