/**
 * Verifies that every project's local Base44 client exposes the expected
 * contract (entity proxy, Base44 list/filter signatures, auth fallback,
 * backend LLM routing) against a mocked fetch. No database or network needed.
 *
 * Run from the workspace root:  node test-all-projects.mjs
 */
import path from 'path';
import { pathToFileURL } from 'url';

const projects = [
  'AstroSim Nexus',
  'HotelOps',
  'KwanPro',
  'Nuclear Launch Sim',
  'OmniPOS Core',
  'OpsGrid',
  'ProdIntel StageOps',
  'War Matrix',
];

// Projects whose backend serves /api/:entity instead of /api/entities/:entity.
const ROOT_PREFIX_PROJECTS = new Set(['AstroSim Nexus', 'HotelOps']);

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function testProject(project) {
  const file = path.resolve(process.cwd(), project, 'src/api/base44-local-client.js');
  const mod = await import(pathToFileURL(file).href);
  const sdk = mod.default;

  assert(sdk && sdk.entities && sdk.auth && sdk.integrations && sdk.appLogs, 'client surface incomplete');

  // Entity proxy + Base44 SDK signatures.
  const Widget = sdk.entities.Widget;
  for (const method of ['list', 'filter', 'get', 'create', 'update', 'delete', 'bulkCreate']) {
    assert(typeof Widget[method] === 'function', `entities.Widget.${method} missing`);
  }

  const calls = [];
  const originalFetch = global.fetch;
  global.fetch = async (url, options = {}) => {
    calls.push({ url: String(url), method: options.method || 'GET' });
    return { ok: true, status: 200, json: async () => [] };
  };

  try {
    await Widget.list('-created_date', 10);
    const listCall = calls.find((c) => c.url.includes('/Widget') && c.method === 'GET');
    assert(listCall, 'list() did not issue a GET for the entity');
    assert(listCall.url.includes('orderBy=-created_date'), 'list() did not send orderBy');
    assert(listCall.url.includes('limit=10'), 'list() did not send limit');

    await Widget.filter({ status: 'open' }, '-created_date', 5);
    const filterCall = calls.find((c) => c.url.includes('/Widget/filter'));
    assert(filterCall, 'filter() did not POST to /filter');
    assert(filterCall.method === 'POST', 'filter() must use POST');
    assert(filterCall.url.includes('sort=-created_date'), 'filter() did not send sort');
    assert(filterCall.url.includes('limit=5'), 'filter() did not send limit');

    // Offline dev auth fallback (no token in Node).
    const user = await sdk.auth.me();
    assert(user && user.role, 'auth.me() did not return a dev user offline');

    // LLM routes to the local backend when no Vite Gemini key is present.
    await sdk.integrations.Core.InvokeLLM({ prompt: 'hello' });
    const llmCall = calls.find((c) => c.url.includes('/integrations/Core/InvokeLLM'));
    assert(llmCall && llmCall.method === 'POST', 'InvokeLLM did not route to the backend');
  } finally {
    global.fetch = originalFetch;
  }

  const expectedBasePath = ROOT_PREFIX_PROJECTS.has(project) ? '/Widget' : '/entities/Widget';
  assert(Widget.basePath === expectedBasePath,
    `unexpected basePath ${Widget.basePath} (expected ${expectedBasePath})`);
}

async function run() {
  let passed = 0;
  const failures = [];

  for (const project of projects) {
    process.stdout.write(`\n--- ${project} --- `);
    try {
      await testProject(project);
      passed++;
      console.log('✅');
    } catch (err) {
      failures.push({ project, error: err.stack || err.message });
      console.log('❌');
    }
  }

  console.log(`\n🏁 ${passed}/${projects.length} passed.`);
  if (failures.length > 0) {
    for (const { project, error } of failures) {
      console.error(`\n❌ ${project}\n${error}`);
    }
    process.exitCode = 1;
  }
}

run();
