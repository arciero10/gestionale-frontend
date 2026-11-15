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
      CapacitorHttp: ['request'],
      EntraNativeAuth: ['configure', 'start', 'submit', 'resend', 'restore', 'unlock', 'lock', 'cancel', 'logout', 'getAccessToken']
    };
    window.Capacitor = {
      PluginHeaders: Object.entries(methods).map(([name, names]) => ({ name, methods: names.map(name => ({ name, rtype: name === 'addListener' ? 'callback' : 'promise' })) })),
      nativeCallback: () => 'listener',
      nativePromise: async (plugin, method, options) => {
        window.__nativeCalls.push(`${plugin}.${method}`);
        if (plugin === 'EntraNativeAuth') {
          if (method === 'getAccessToken') return { accessToken: 'sdk-api-test-token' };
          if (method === 'start') {
            window.__nativeFlow = options.flow;
            window.__nativeSubmits = 0;
            return { step: options.flow === 'signin' && options.method === 'password' ? 'authenticated' : 'code' };
          }
          if (method === 'submit') {
            window.__nativeSubmits++;
            if (window.__nativeFlow === 'reset') return { step: window.__nativeSubmits === 1 ? 'password' : 'complete' };
            if (window.__nativeFlow === 'signup') return window.__nativeSubmits === 1 ? { step: 'password' }
              : window.__nativeSubmits === 2 ? { step: 'attributes', attributes: [{ name: 'givenName', required: true }] } : { step: 'authenticated' };
            return { step: 'authenticated' };
          }
          return { step: method === 'resend' ? 'code' : 'login' };
        }
        if (plugin === 'App' && method === 'getLaunchUrl') return undefined;
        if (plugin === 'CapacitorHttp' && options.url.includes('/api/')) {
          const response = await fetch(options.url, { method: options.method, headers: options.headers,
            ...(options.data === undefined ? {} : { body: JSON.stringify(options.data) }) });
          return { status: response.status, data: await response.json(), headers: {} };
        }
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
      await page.locator('app-native-auth-panel h1').waitFor();
      assert.equal(await page.locator('app-native-auth-panel h1').textContent(), label);
      assert.equal(await page.evaluate(() => window.__nativeCalls.includes('Browser.open')), false);
      await page.screenshot({ path: path.join(output, `native-${label}.png`), fullPage: true });
      console.log(`PASS ${label}: form in-app, nessuna apertura browser`);
      await context.close();
    }
    for (const flow of ['password', 'otp', 'signup', 'reset', 'linked', 'retry', 'pending', 'rejected', 'bootstrap']) {
      const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
      await installNative(context, 'android');
      let meCalls = 0;
      let resubmitted = false;
      let bootstrapApproved = false;
      let communityManager = false;
      let privacySaved = false;
      let communityState = 'ready';
      let approvalCalls = 0;
      const communityMembers = [
        { personId: 12, firstName: 'Anna', lastName: 'Rossi', role: 'MEMBER' },
        { personId: 13, firstName: 'Marco', lastName: 'Verdi', role: 'RESPONSIBLE', stage: 'Rinnovate Promesse Battesimali', birthDate: '1985-05-03', email: 'shared@example.test', phoneNumber: '3331234567' }
      ];
      await context.route('**/api/**', async route => {
        const headers = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': 'GET, POST, PUT, OPTIONS' };
        if (route.request().method() === 'OPTIONS') { await route.fulfill({ status: 204, headers }); return; }
        const apiPath = new URL(route.request().url()).pathname;
        if (apiPath.startsWith('/api/me/community')) {
          assert.equal(route.request().headers().authorization, 'Bearer sdk-api-test-token');
          if (apiPath.endsWith('/community') && communityState === 'error') {
            await route.fulfill({ status: 503, headers, json: {} }); return;
          }
          if (apiPath.endsWith('/privacy')) {
            if (route.request().method() === 'PUT') { assert.equal(route.request().postDataJSON().showPhone, true); privacySaved = true; }
            await route.fulfill({ headers, json: { showPhone: privacySaved, showEmail: false, showBirthDate: false, showPhoto: false, showFamily: false, receiveBirthdayNotifications: false, receiveCommunityNotifications: false } });
          } else if (apiPath.endsWith('/members') && route.request().method() === 'POST') {
            const payload = route.request().postDataJSON();
            assert.equal(payload.firstName, 'Nuovo'); assert.equal(payload.role, 'MEMBER');
            assert.equal(payload.communityId, undefined);
            communityMembers.push({ personId: 14, firstName: payload.firstName, lastName: payload.lastName, role: payload.role });
            await route.fulfill({ status: 201, headers, json: { personId: 14 } });
          } else if (/\/members\/\d+$/.test(apiPath)) {
            const member = communityMembers.find(m => m.personId === Number(apiPath.split('/').pop()));
            await route.fulfill({ headers, json: { member, stage: 'Precatecumenato', isSelf: member.personId === 12, canEdit: communityManager,
              canEditPhone: false, canEditEmail: false, canEditBirthDate: false, canManageRole: communityManager,
              assignableRoles: communityManager ? ['MEMBER', 'CO_RESPONSIBLE'] : [member.role] } });
          } else await route.fulfill({ headers, json: { context: { personId: 12, communityName: '3ª Comunità', parishName: 'Parrocchia Martiri Canadesi',
              role: communityManager ? 'RESPONSIBLE' : 'MEMBER', permissions: communityManager ? ['EDIT_MEMBRI', 'APPROVE_REQUESTS'] : ['VIEW_MEMBRI'] },
            members: communityState === 'empty' ? [] : communityState === 'single' ? communityMembers.slice(0,1) : communityMembers,
            canAddMember: communityManager, assignableRoles: ['MEMBER', 'CO_RESPONSIBLE'] } });
          return;
        }
        if (new URL(route.request().url()).pathname.endsWith('/me')) {
          assert.equal(route.request().headers().authorization, 'Bearer sdk-api-test-token');
          meCalls++;
          if (flow === 'retry' && meCalls === 1) { await route.fulfill({ status: 503, headers, json: {} }); return; }
          const linked = flow === 'linked' || flow === 'pending' && meCalls > 1;
          await route.fulfill({ headers, json: { authenticated: true, linkedToCommunity: linked, isOnboardingAdmin: flow === 'bootstrap', status: linked ? 'LINKED' : flow === 'pending' || resubmitted ? 'IN_ATTESA_APPROVAZIONE' : flow === 'rejected' ? 'RESPINTA' : 'UNLINKED', permissions: linked ? ['VIEW_COMUNITA', 'VIEW_MEMBRI', 'VIEW_CONVIVENZE'] : [],
            ...(linked ? { communityId: 91, communityNumber: 3, communityName: '3ª Comunità', parishName: 'Parrocchia di test', displayName: 'Utente di test', role: 'MEMBER', memberCount: 2 } : {}) } });
        } else if (route.request().url().endsWith('/onboarding/requests')) { approvalCalls++; await route.fulfill({ headers, json: flow === 'bootstrap' ? [{ id: 101, firstName: 'Primo', lastName: 'Responsabile', parishId: 11, parishName: 'Parrocchia di test', communityNumber: 3, requestedRole: 'RESPONSIBLE', requestedStage: 'Precatecumenato', status: bootstrapApproved ? 'APPROVATA' : 'IN_ATTESA_APPROVAZIONE', existingPeople: [], canApprove: true, canReject: true }] : [] }); }
        else if (route.request().url().endsWith('/onboarding/requests/101/approve')) {
          assert.equal(route.request().method(), 'POST'); bootstrapApproved = true;
          await route.fulfill({ headers, json: { status: 'APPROVATA' } });
        } else if (route.request().url().endsWith('/onboarding/parishes')) await route.fulfill({ headers, json: [{ id: 11, name: 'Parrocchia di test', address: '' }] });
        else if (route.request().url().endsWith('/communities')) await route.fulfill({ headers, json: [{ id: 91, number: 3 }] });
        else if (route.request().url().endsWith('/onboarding/current')) await route.fulfill({ headers, json: ['pending', 'rejected'].includes(flow) ? { firstName: 'Test', lastName: 'Member', phone: '', parishId: 11, parishName: 'Parrocchia di test', communityNumber: 3, requestedRole: 'MEMBER', requestedStage: 'Precatecumenato', status: flow === 'pending' || resubmitted ? 'IN_ATTESA_APPROVAZIONE' : 'RESPINTA' } : null });
        else if (route.request().url().endsWith('/onboarding/complete')) {
          assert.equal(route.request().postDataJSON().role, 'MEMBER'); resubmitted = true;
          await route.fulfill({ headers, json: { status: 'IN_ATTESA_APPROVAZIONE', requestId: 1, context: {} } });
        } else await route.fulfill({ headers, json: [] });
      });
      const page = await context.newPage(), errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.goto(base);
      await page.getByRole('button', { name: flow === 'signup' ? 'Registrati' : 'Accedi', exact: true }).click();
      if (flow === 'otp') await page.getByRole('button', { name: 'Accedi con codice via email' }).click();
      if (flow === 'reset') await page.getByRole('button', { name: 'Hai dimenticato la password?' }).click();
      await page.getByLabel('Email', { exact: true }).fill('user@example.test');
      if (['password', 'linked', 'retry', 'pending', 'rejected', 'bootstrap'].includes(flow)) await page.getByLabel('Password', { exact: true }).fill('test-only');
      await page.locator('app-native-auth-panel button[type="submit"]').click();
      if (!['password', 'linked', 'retry', 'pending', 'rejected', 'bootstrap'].includes(flow)) {
        await page.getByLabel('Codice di verifica').fill('000000');
        await page.locator('app-native-auth-panel button[type="submit"]').click();
      }
      if (flow === 'signup' || flow === 'reset') {
        await page.getByLabel('Nuova password', { exact: true }).fill('test-only');
        await page.locator('app-native-auth-panel button[type="submit"]').click();
      }
      if (flow === 'signup') {
        await page.getByLabel('Nome', { exact: true }).fill('Test');
        await page.locator('app-native-auth-panel button[type="submit"]').click();
      }
      if (flow === 'retry') await page.getByRole('button', { name: 'Riprova accesso', exact: true }).click();
      if (flow === 'reset') {
        await page.getByRole('heading', { name: 'Accedi', exact: true }).waitFor();
        assert.equal(meCalls, 0);
      } else {
        await page.waitForURL(url => url.pathname === (flow === 'linked' ? '/mobile/home' : '/mobile/onboarding'));
        assert.equal(meCalls, flow === 'retry' ? 2 : 1);
      }
      if (flow === 'bootstrap') {
        await page.getByRole('link', { name: 'Appartenenze e approvazioni', exact: true }).click();
        await page.waitForURL(url => url.pathname === '/mobile/approvazioni');
        await page.getByRole('button', { name: 'Approva', exact: true }).click();
        await page.getByText('Appartenenza approvata.', { exact: true }).waitFor();
        assert.equal(bootstrapApproved, true);
        assert.equal(await page.locator('.layout-container').count(), 0);
        await page.screenshot({path:path.join(output,'bootstrap-admin.png'),fullPage:true});
      }
      if (flow === 'linked') {
        await page.locator('app-mobile-home h1').waitFor();
        assert.match(await page.locator('app-mobile-shell .brand').textContent(), /3ª Comunità/);
        assert.equal(await page.locator('.mobile-bottom a').count(), 4);
        assert.equal(await page.locator('app-sidebar,.layout-container').count(), 0);
        assert.equal(await page.getByRole('link', { name: 'Posti di convivenza', exact: true }).count(), 0);
        for (const [width, height, name] of [[412,915,'pixel'],[390,844,'iphone'],[393,852,'island']]) {
          await page.setViewportSize({width,height});
          assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
          assert.ok(await page.locator('.mobile-bottom a').evaluateAll(nodes => nodes.every(n => n.getBoundingClientRect().height >= 48)));
          await page.screenshot({path:path.join(output,`home-${name}.png`),fullPage:true});
        }
        await page.locator('.community-card').click();
        await page.waitForURL(url => url.pathname === '/mobile/community');
        await page.locator('.member-row').first().waitFor();
        assert.equal(await page.locator('.member-row').count(), 2);
        assert.match(await page.locator('.community-header').textContent(), /3ª Comunità · Parrocchia Martiri Canadesi/);
        await page.getByText('2 fratelli', { exact: true }).waitFor();
        assert.equal(await page.locator('app-mobile-community table, app-mobile-community app-member-editor').count(), 0);
        assert.equal(await page.locator('.member-list a[href^="tel:"],.member-list a[href^="mailto:"]').count(), 0);
        assert.ok(!(await page.locator('.member-list').textContent()).includes('shared@example.test'));
        assert.ok(!(await page.locator('.member-list').textContent()).includes('3331234567'));
        await page.locator('.member-row').filter({hasText:'Marco Verdi'}).getByText('Rinnovate Promesse Battesimali', {exact:true}).waitFor();
        assert.equal(await page.getByRole('link', { name: 'Richieste e storico' }).count(), 0);
        assert.equal(await page.getByRole('link', { name: 'Aggiungi fratello', exact: true }).count(), 0);
        assert.equal(await page.locator('.mobile-bottom a.active').textContent(), 'Comunità');
        await page.getByRole('searchbox', {name:'Cerca nella comunità'}).fill('rossi Anna');
        assert.equal(await page.locator('.member-row').count(), 1);
        assert.equal(await page.locator('.member-row').first().locator('.birthday,.stage,img').count(), 0);
        await page.getByRole('searchbox').fill('nessuno');
        await page.getByRole('heading', { name: 'Nessun risultato' }).waitFor();
        await page.getByRole('button', {name:'Cancella ricerca'}).click();
        await page.waitForFunction(() => document.querySelector('input[type="search"]')?.value === '');
        assert.equal(await page.getByRole('searchbox').inputValue(), '');
        for (const width of [320, 390, 412, 768]) {
          await page.setViewportSize({width,height:844});
          assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
          assert.ok(await page.locator('.member-copy').evaluateAll(nodes => nodes.every(n => n.scrollWidth <= n.clientWidth)));
          assert.deepEqual(await page.locator('.mobile-bottom a span').allTextContents(), ['Home','Calendario','Comunità','Altro']);
          await page.screenshot({path:path.join(output,`community-${width}.png`),fullPage:true});
        }
        await page.setViewportSize({width:390,height:844});
        await page.locator('.member-row').filter({hasText:'Anna Rossi'}).click();
        await page.waitForURL(url => url.pathname === '/mobile/community/member/12');
        await page.getByRole('heading', { name: 'Anna Rossi' }).waitFor();
        assert.equal(await page.getByRole('button', { name: 'Modifica scheda' }).count(), 0);
        await page.getByLabel('Mostra telefono alla comunità').check();
        await page.getByRole('button', { name: 'Salva preferenze' }).click();
        await page.getByText('Preferenze privacy salvate.', { exact: true }).waitFor();
        assert.equal(privacySaved, true);
        await page.screenshot({path:path.join(output,'community-detail.png'),fullPage:true});
        communityManager = true;
        await page.getByRole('link', { name: 'Comunità', exact: true }).first().click();
        await page.getByRole('link', {name:'Richieste e storico'}).waitFor();
        assert.equal(await page.getByRole('link', {name:'Richieste e storico'}).getAttribute('href'), '/mobile/approvazioni');
        assert.equal(approvalCalls, 0, 'La pagina comunita non carica richieste approvate');
        assert.equal(await page.locator('app-mobile-community table, app-mobile-community app-member-editor').count(), 0);
        await page.getByRole('link', { name: 'Aggiungi fratello', exact: true }).click();
        await page.waitForURL(url => url.pathname === '/mobile/community/add');
        await page.locator('app-member-editor').waitFor();
        assert.equal(await page.locator('app-mobile-community').count(), 0);
        assert.equal(await page.locator('app-member-editor').count(), 1);
        await page.getByLabel('Nome', { exact: true }).fill('Nuovo');
        await page.getByLabel('Cognome', { exact: true }).fill('Fratello');
        const roles = await page.getByLabel('Ruolo nella comunità').locator('option').allTextContents();
        assert.ok(roles.every(role => !role.includes('Catechista') && role !== 'Responsabile'));
        await page.screenshot({path:path.join(output,'community-add.png'),fullPage:true});
        await page.getByRole('button', { name: 'Salva fratello', exact: true }).click();
        await page.waitForURL(url => url.pathname === '/mobile/community/member/14');
        await page.getByRole('heading', { name: 'Nuovo Fratello', exact: true }).waitFor();
        assert.equal(await page.locator('app-sidebar,.layout-container').count(), 0);
        await page.getByRole('link', { name: 'Comunità', exact: true }).first().click();
        communityState = 'error';
        await page.getByRole('button', { name: 'Aggiorna membri' }).click();
        await page.getByRole('heading', { name: 'Comunità non disponibile' }).waitFor();
        communityState = 'empty';
        await page.getByRole('button', { name: 'Riprova', exact: true }).click();
        await page.getByRole('heading', { name: 'Nessun fratello censito' }).waitFor();
        communityState = 'ready';
        await page.getByRole('button', { name: 'Aggiorna membri' }).click();
        await page.locator('.member-row').filter({hasText:'Nuovo Fratello'}).waitFor();
        await page.screenshot({path:path.join(output,'community-created.png'),fullPage:true});
        communityState = 'single';
        await page.getByRole('button', { name: 'Aggiorna membri' }).click();
        await page.getByText('1 fratello', {exact:true}).waitFor();
        for (const width of [320,390,393,412]) {
          await page.setViewportSize({width,height:844});
          assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
          const add = page.getByRole('link', {name:'Aggiungi fratello',exact:true});
          assert.ok(await add.evaluate(n => n.getBoundingClientRect().height >= 48 && n.scrollWidth <= n.clientWidth));
          await page.screenshot({path:path.join(output,`community-manager-${width}.png`),fullPage:true});
        }
        console.log('PASS mobile community: scoped API, ricerca, privacy personale, creazione, route e viewport');
      }
      if (flow === 'pending' || flow === 'rejected') {
        await page.locator('#backendFirstName').waitFor();
        await page.locator('#backendRole').click();
        const options = await page.getByRole('option').allTextContents();
        assert.ok(options.some(text => text.includes('Fratello')));
        assert.ok(options.some(text => text.includes('Corresponsabile')));
        assert.ok(options.every(text => !text.includes('Catechista')));
        await page.keyboard.press('Escape');
        if (flow === 'pending') {
          await page.getByRole('heading', { name: 'In attesa di approvazione', exact: true }).waitFor();
          assert.match(await page.locator('section[role="status"]').textContent(), /3ª Comunità.*Parrocchia di test/s);
          await page.getByRole('button', { name: 'Verifica approvazione', exact: true }).click();
          await page.waitForURL(url => url.pathname === '/mobile/home');
        } else {
          await page.getByRole('alert').filter({hasText:'rifiutata'}).waitFor();
          await page.locator('input[name="backendPrivacy"]').check();
          await page.getByRole('button', { name: 'Conferma comunità', exact: true }).click();
          await page.getByRole('heading', { name: 'In attesa di approvazione', exact: true }).waitFor();
          assert.ok(resubmitted);
          assert.equal(new URL(page.url()).pathname, '/mobile/onboarding');
        }
      }
      assert.equal(await page.evaluate(() => window.__nativeCalls.includes('Browser.open')), false);
      if (flow === 'retry') {
        assert.equal(await page.evaluate(() => window.__nativeCalls.filter(c => c === 'EntraNativeAuth.start').length), 1);
        assert.equal(await page.evaluate(() => window.__nativeCalls.includes('EntraNativeAuth.logout')), false);
      }
      assert.equal(await page.evaluate(() => Object.values(localStorage).some(value => value.includes('sdk-api-test-token'))), false);
      assert.deepEqual(errors, []);
      console.log(`PASS native ${flow}: SDK mock, bearer /api/me e routing`);
      await context.close();
    }
  } finally {
    if (browser) await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
