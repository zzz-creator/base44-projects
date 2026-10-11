import { base44LocalClient } from './src/api/base44-local-client.js';

// Mock fetch
global.fetch = async (url, options) => {
  console.log(`FETCH: ${options.method} ${url}`);
  if (options.body) console.log(`BODY: ${options.body}`);
  return {
    ok: true,
    json: async () => ({ success: true, mocked: true })
  };
};

// Mock localStorage
global.localStorage = {
  getItem: () => 'fake-token',
  setItem: () => {},
  removeItem: () => {},
};

async function test() {
  console.log('Testing Robust Local SDK...');
  
  try {
    // 1. Dynamic Entity Proxy
    const fleet = base44LocalClient.entities.Fleet;
    console.log('Entity created:', fleet.entityName);
    
    // 2. List operation
    await fleet.list({ status: 'active' });
    
    // 3. Filter operation
    await fleet.filter({ name: 'Alpha' });
    
    // 4. Auth
    const user = await base44LocalClient.auth.me();
    console.log('Auth me result:', user);
    
    console.log('✅ SDK verification scratch script completed');
  } catch (err) {
    console.error('❌ SDK verification failed:', err);
  }
}

test();
