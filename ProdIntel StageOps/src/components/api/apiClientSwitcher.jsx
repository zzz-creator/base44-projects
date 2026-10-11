/**
 * ProdIntel StageOps – API Client Switcher
 *
 * Automatically uses the local backend when VITE_OFFLINE_MODE=true,
 * otherwise falls back to the base44 cloud client.
 *
 * Usage in any page/component – replace:
 *   import { base44 } from '../../api/base44Client';
 * with:
 *   import { base44 } from '../../components/api/apiClientSwitcher';
 *   (adjust relative path as needed)
 *
 * Or for zero-change migration: update vite.config to alias
 *   '../../api/base44Client' → './components/api/apiClientSwitcher.js'
 */

import { localClient } from './localApiClient.js';

const isOffline =
  typeof import.meta !== 'undefined' &&
  import.meta.env?.VITE_OFFLINE_MODE === 'true';

let base44;

if (isOffline) {
  // Use local Express backend
  base44 = localClient;
  console.info('[apiClient] 🔌 Offline mode – using local backend at', import.meta.env?.VITE_API_URL || 'http://localhost:3001');
} else {
  // Use base44 cloud (dynamic import so tree-shaking works in offline builds)
  const cloudModule = await import('/src/api/base44Client.js').catch(() => null);
  base44 = cloudModule?.base44 || localClient;
}

export { base44 };
export default base44;