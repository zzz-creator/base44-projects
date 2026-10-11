/**
 * Local Repository Layer
 * 
 * Provides CRUD operations for all entities using browser localStorage.
 * This ensures the application is "full local only" without requiring
 * any background server processes.
 */

// Local configuration constants
const CONFIG = {
  LOCAL: {
    debugQueries: true,
    storagePrefix: 'ns_simulator_'
  }
};

/**
 * Initialize connection (no-op for local storage)
 */
export const initConnection = async () => {
  console.log('[LocalRepository] Initialized with API connection');
  return true;
};

/**
 * Close connection (no-op for local storage)
 */
export const closeConnection = async () => {
  return true;
};

// Helper to get data from localStorage
const getLocalData = (tableName) => {
  const key = `${CONFIG.LOCAL.storagePrefix}${tableName}`;
  const data = localStorage.getItem(key);
  try {
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error(`Failed to parse local data for ${tableName}`, e);
    return [];
  }
};

// Helper to save data to localStorage
const saveLocalData = (tableName, data) => {
  const key = `${CONFIG.LOCAL.storagePrefix}${tableName}`;
  localStorage.setItem(key, JSON.stringify(data));
};

/**
 * Execute a query (read from localStorage)
 */
const executeQuery = async (query, params = {}, tableName = null) => {
  if (CONFIG.LOCAL.debugQueries) {
    console.log('[Local Query]', query, params);
  }
  
  if (!tableName) return [];
  return getLocalData(tableName);
};

/**
 * Execute a command (write to localStorage)
 */
const executeCommand = async (query, params = {}, tableName = null, operation = null) => {
  if (CONFIG.LOCAL.debugQueries) {
    console.log('[Local Command]', operation, query, params);
  }
  
  if (!tableName) return { rowsAffected: [0] };
  
  const records = getLocalData(tableName);
  
  if (operation === 'insert') {
    const record = { 
      ...params, 
      created_date: new Date().toISOString(),
      updated_date: new Date().toISOString()
    };
    records.push(record);
    saveLocalData(tableName, records);
    return { rowsAffected: [1], record };
  }
  
  if (operation === 'update' && params.id) {
    const idx = records.findIndex(r => r.id === params.id);
    if (idx >= 0) {
      records[idx] = { 
        ...records[idx], 
        ...params,
        updated_date: new Date().toISOString()
      };
      saveLocalData(tableName, records);
      return { rowsAffected: [1] };
    }
  }
  
  if (operation === 'delete' && params.id) {
    const filtered = records.filter(r => r.id !== params.id);
    saveLocalData(tableName, filtered);
    return { rowsAffected: [1] };
  }
  
  return { rowsAffected: [0] };
};

/**
 * Build WHERE clause from filter object (simplified for memory filtering)
 */
const applyFilter = (records, filter) => {
  if (!filter || Object.keys(filter).length === 0) return records;
  
  return records.filter(record => {
    return Object.entries(filter).every(([key, value]) => {
      if (key === '$or' && Array.isArray(value)) {
        return value.some(subFilter => applyFilter([record], subFilter).length > 0);
      }
      if (key === '$and' && Array.isArray(value)) {
        return value.every(subFilter => applyFilter([record], subFilter).length > 0);
      }
      
      const recordValue = record[key];
      if (typeof value === 'object' && value !== null) {
        return Object.entries(value).every(([op, opValue]) => {
          switch (op) {
            case '$gte': return recordValue >= opValue;
            case '$gt': return recordValue > opValue;
            case '$lte': return recordValue <= opValue;
            case '$lt': return recordValue < opValue;
            case '$ne': return recordValue !== opValue;
            case '$in': return Array.isArray(opValue) && opValue.includes(recordValue);
            case '$like': {
              const regex = new RegExp(opValue.replace(/%/g, '.*'), 'i');
              return regex.test(recordValue);
            }
            default: return recordValue === opValue;
          }
        });
      }
      return recordValue === value;
    });
  });
};

/**
 * Apply sorting to records
 */
const applySort = (records, sort) => {
  if (!sort) sort = '-created_date';
  const direction = sort.startsWith('-') ? -1 : 1;
  const column = sort.replace(/^-/, '');
  
  return [...records].sort((a, b) => {
    if (a[column] < b[column]) return -1 * direction;
    if (a[column] > b[column]) return 1 * direction;
    return 0;
  });
};

/**
 * Create a repository for an entity
 */
const createEntityRepository = (tableName) => ({
  list: async (sort = '-created_date', limit = 100) => {
    try {
      const response = await fetch(`/api/entities/${tableName}`);
      if (!response.ok) throw new Error('API Error');
      let results = await response.json();
      results = applySort(results, sort);
      return results.slice(0, limit);
    } catch (e) {
      console.error(`Failed to list ${tableName}`, e);
      return [];
    }
  },

  filter: async (filterObj, sort = '-created_date', limit = 100) => {
    try {
      // For now, fetch all and filter client-side to maintain compatibility
      // In a production app, use query params
      const response = await fetch(`/api/entities/${tableName}`);
      if (!response.ok) throw new Error('API Error');
      let results = await response.json();
      results = applyFilter(results, filterObj);
      results = applySort(results, sort);
      return results.slice(0, limit);
    } catch (e) {
      console.error(`Failed to filter ${tableName}`, e);
      return [];
    }
  },

  get: async (id) => {
    try {
      const response = await fetch(`/api/entities/${tableName}/${id}`);
      if (!response.ok) return null;
      return await response.json();
    } catch (e) {
      return null;
    }
  },

  create: async (data) => {
    try {
      const response = await fetch(`/api/entities/${tableName}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Create failed');
      return await response.json();
    } catch (e) {
      console.error(`Failed to create ${tableName}`, e);
      throw e;
    }
  },

  bulkCreate: async (dataArray) => {
    const results = [];
    for (const data of dataArray) {
      // Sequential for simplicity/safety
      try {
        const result = await createEntityRepository(tableName).create(data);
        results.push(result);
      } catch (e) {
        console.error('Bulk create item failed', e);
      }
    }
    return results;
  },

  update: async (id, data) => {
    try {
      const response = await fetch(`/api/entities/${tableName}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Update failed');
      return await response.json();
    } catch (e) {
       console.error(`Failed to update ${tableName}`, e);
       throw e;
    }
  },

  delete: async (id) => {
    try {
      const response = await fetch(`/api/entities/${tableName}/${id}`, {
        method: 'DELETE'
      });
      return response.ok;
    } catch (e) {
      console.error(`Failed to delete ${tableName}`, e);
      return false;
    }
  },

  schema: async () => {
    return {};
  }
});

/**
 * Local entity repositories
 */
export const sqlServerEntities = {
  MissionScenario: createEntityRepository('MissionScenario'),
  MissionPerformance: createEntityRepository('MissionPerformance'),
  AdminAuditLog: createEntityRepository('AdminAuditLog'),
  AdminAccessControl: createEntityRepository('AdminAccessControl'),
  User: createEntityRepository('Users')
};

/**
 * Local auth utilities
 */
export const sqlServerAuth = {
  me: async () => {
    return { id: 'local-user-id', email: 'commander@local.sim', full_name: 'Strategic Commander', role: 'admin' };
  },
  
  updateMe: async (data) => {
    return sqlServerAuth.me();
  },
  
  isAuthenticated: async () => {
    return true;
  },
  
  logout: (redirectUrl) => {
    if (redirectUrl) {
      window.location.href = redirectUrl;
    } else {
      window.location.reload();
    }
  }
};

export default { 
  entities: sqlServerEntities, 
  auth: sqlServerAuth,
  initConnection,
  closeConnection
};
