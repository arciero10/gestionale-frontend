// Run against a production build. Playwright is test tooling, not an app dependency.
const { chromium } = require('playwright');
const { createServer } = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');

const root = path.resolve('dist/avalon-ng/browser');
assert.ok(fs.existsSync(path.join(root, 'index.html')), 'Eseguire npm run build prima del test UI');
const output = path.resolve('dist/mobile-welcome-check');
fs.mkdirSync(output, { recursive: true });
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.jpg': 'image/jpeg', '.png': 'image/png', '.woff2': 'font/woff2', '.ttf': 'font/ttf' };
const server = createServer((req, res) => {
  const file = path.resolve(root, '.' + new URL(req.url, 'http://localhost').pathname);
  if (!file.startsWith(root + path.sep) && file !== root) { res.writeHead(403).end(); return; }
  const target = fs.existsSync(file) && fs.statSync(file).isFile() ? file : path.join(root, 'index.html');
  res.writeHead(200, { 'Content-Type': mime[path.extname(target)] ?? 'application/octet-stream', 'Cache-Control': 'no-store' });
  fs.createReadStream(target).pipe(res);
});

async function installNative(context, platform) {
  await context.addInitScript(platform => {
    window.CapacitorCustomPlatform = { name: platform };
    window.__nativeCalls = [];
    const methods = {
      App: ['getLaunchUrl', 'addListener', 'removeListener'],
      Browser: ['open', 'close', 'addListener', 'removeListener'],
      CapacitorHttp: ['request']
    };
    window.Capacitor = {
      PluginHeaders: Object.entries(methods).map(([name, names]) => ({ name, methods: names.map(name => ({ name, rtype: name === 'addListener' ? 'callback' : 'promise' })) })),
      nativeCallback: () => 'listener',
      nativePromise: async (plugin, method) => {
        window.__nativeCalls.push(`${plugin}.${method}`);
        if (plugin === 'App' && method === 'getLaunchUrl') return undefined;
        if (plugin === 'CapacitorHttp') return { status: 200, data: {
          authorization_endpoint: 'https://eventidicomunita.ciamlogin.com/069bb457-b363-4340-8086-d7dd3b60a2b5/oauth2/v2.0/authorize',
          token_endpoint: 'https://eventidicomunita.ciamlogin.com/069bb457-b363-4340-8086-d7dd3b60a2b5/oauth2/v2.0/token'
        } };
        return {};
      }
    };
  }, platform);
}

(async () => {
  let browser;
  try {
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    const base = `http://127.0.0.1:${server.address().port}`;
    browser = await chromium.launch({ headless: true,
      channel: process.env.PLAYWRIGHT_CHANNEL || (process.platform === 'win32' ? 'msedge' : undefined) });
    const cases = [
      ['pixel-9', 412, 915, 'android', 24, 24],
      ['android-medium', 360, 800, 'android', 24, 20],
      ['iphone-standard', 390, 844, 'ios', 47, 34],
      ['iphone-island', 393, 852, 'ios', 59, 34],
      ['narrow', 320, 568, 'ios', 20, 0],
      ['tablet', 768, 1024, 'ios', 24, 20],
      ['landscape', 740, 360, 'android', 0, 0]
    ];
    for (const [name, width, height, platform, top, bottom] of cases) {
      const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1 });
      await installNative(context, platform);
      const page = await context.newPage(), errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.goto(base);
      await page.locator('app-mobile-welcome h1').waitFor();
      await page.locator('app-mobile-welcome').evaluate((element, insets) => {
        element.style.setProperty('--mobile-safe-top', `${insets.top}px`);
        element.style.setProperty('--mobile-safe-bottom', `${insets.bottom}px`);
      }, { top, bottom });
      await page.locator('.welcome-photo').evaluate(image => image.decode());
      await page.evaluate(() => document.fonts.ready);
      const metrics = await page.locator('.mobile-welcome').evaluate(element => {
        const box = selector => { const r = element.querySelector(selector).getBoundingClientRect(); return { top: r.top, bottom: r.bottom, left: r.left, right: r.right, height: r.height }; };
        return { scroll: document.documentElement.scrollHeight, width: document.documentElement.scrollWidth,
          brand: box('.welcome-brand'), card: box('.welcome-access'), footer: box('.welcome-footer'),
          buttons: [...element.querySelectorAll('button')].map(e => e.getBoundingClientRect().height) };
      });
      assert.ok(metrics.width <= width + 1, `${name}: horizontal overflow`);
      assert.ok(metrics.brand.top >= top, `${name}: top safe area`);
      assert.ok(metrics.brand.bottom <= metrics.card.top, `${name}: brand/card overlap`);
      assert.ok(metrics.card.bottom <= metrics.footer.top, `${name}: card/footer overlap`);
      assert.ok(metrics.buttons.every(h => h >= 48), `${name}: touch targets`);
      if (height >= 568) {
        assert.ok(metrics.scroll <= height + 1, `${name}: unnecessary scroll (${metrics.scroll})`);
        assert.ok(metrics.footer.bottom <= height - bottom, `${name}: bottom safe area`);
      }
      await page.screenshot({ path: path.join(output, `${name}.png`), fullPage: true });
      await page.getByRole('button', { name: 'Accedi', exact: true }).focus();
      assert.notEqual(await page.getByRole('button', { name: 'Accedi', exact: true }).evaluate(e => getComputedStyle(e).outlineStyle), 'none');
      assert.deepEqual(errors, [], `${name}: runtime errors`);
      console.log(`PASS ${name} ${width}x${height}`);
      await context.close();
    }
    for (const width of [1280, 390]) {
      const context = await browser.newContext({ viewport: { width, height: 900 } });
      const page = await context.newPage();
      await page.goto(base);
      await page.locator('.login-page h1').waitFor();
      assert.match(await page.locator('.login-page h1').textContent(), /Gestionale per le comunità/);
      assert.equal(await page.locator('app-mobile-welcome').count(), 0);
      assert.ok(!(await page.locator('meta[name="viewport"]').getAttribute('content')).includes('viewport-fit'));
      assert.ok(!(await page.locator('meta[name="viewport"]').getAttribute('content')).includes('viewport-fit'));
      await page.screenshot({ path: path.join(output, `web-${width}.png`), fullPage: true });
      console.log(`PASS browser ${width}: landing web preservata`);
      await context.close();
    }
    for (const [label, target] of [['Guarda la demo', '/demo'], ['FAQ', '/faq']]) {
      const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
      await installNative(context, 'ios');
      const page = await context.newPage(); await page.goto(base);
      await page.getByRole('link', { name: label, exact: true }).click();
      await page.waitForURL(url => url.pathname.startsWith(target));
      assert.equal(await page.locator('app-mobile-welcome').count(), 0);
      console.log(`PASS link ${label}`); await context.close();
    }
    for (const label of ['Accedi', 'Registrati']) {
      const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
      await installNative(context, 'ios');
      const page = await context.newPage(); page.setDefaultTimeout(12000); await page.goto(base);
      await page.getByRole('button', { name: label, exact: true }).click();
      try { await page.waitForFunction(() => window.__nativeCalls.includes('Browser.open')); }
      catch (error) { console.error('Native mock diagnostics:', await page.evaluate(() => ({ calls: window.__nativeCalls, text: document.body.innerText }))); throw error; }
      assert.match(await page.locator('main h2').textContent(), /Accesso in corso/);
      console.log(`PASS ${label}: stesso flusso auth nativo (browser simulato, nessun OTP reale)`);
      await context.close();
    }
  } finally {
    if (browser) await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
