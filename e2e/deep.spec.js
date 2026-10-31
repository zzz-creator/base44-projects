import { test, expect } from '@playwright/test';

const BASE = process.env.BASE_URL || 'http://localhost:5173';

test('deep: every discovered route renders without fatal errors', async ({ page }) => {
  const errors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(`[console] ${msg.text()}`);
  });
  page.on('pageerror', (err) => errors.push(`[pageerror] ${err.message}`));

  // Collect internal routes from the landing page.
  await page.goto(BASE, { waitUntil: 'networkidle', timeout: 45000 });
  await page.waitForTimeout(2000);

  const hrefs = await page.evaluate(() => {
    const set = new Set();
    document.querySelectorAll('a[href]').forEach((a) => {
      const h = a.getAttribute('href');
      if (!h) return;
      // only same-origin relative paths
      if (h.startsWith('/') && !h.startsWith('//')) set.add(h.split('?')[0].split('#')[0]);
    });
    return Array.from(set);
  });

  // Always include root.
  const routes = Array.from(new Set(['/', ...hrefs]));
  console.log(`Discovered ${routes.length} routes: ${routes.join(', ')}`);

  for (const route of routes) {
    const beforeErrors = errors.length;
    const url = route.startsWith('http') ? route : `${BASE}${route}`;
    await page.goto(url, { waitUntil: 'networkidle', timeout: 45000 }).catch((e) => errors.push(`[goto] ${route}: ${e.message}`));
    await page.waitForTimeout(1500);

    const bodyText = await page.locator('body').innerText().catch(() => '');
    const hasContent = bodyText.trim().length > 30;
    const hasCrashText = /something went wrong|error boundary|cannot read|undefined is not/i.test(bodyText);

    const routeErrors = errors.slice(beforeErrors);
    const fatal = routeErrors.filter((e) => !/favicon|ResizeObserver|React DevTools|net::ERR|Failed to load resource|Download the/i.test(e));

    console.log(`ROUTE ${route}: content=${hasContent} fatalErrors=${fatal.length} ${fatal.length ? '\n  ' + fatal.join('\n  ') : ''}`);

    expect(hasContent, `Route ${route} rendered empty`).toBeTruthy();
    expect(hasCrashText, `Route ${route} shows crash text`).toBeFalsy();
    expect(fatal.length, `Route ${route} had fatal console errors`).toBe(0);
  }
});
