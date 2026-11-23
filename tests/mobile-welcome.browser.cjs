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
  res.writeHead(200, { 'Content-Type': path.basename(target)==='apple-app-site-association'?'application/json':mime[path.extname(target)] ?? 'application/octet-stream', 'Cache-Control': 'no-store' });
  fs.createReadStream(target).pipe(res);
});

async function openCommunityMenu(page) {
  const menu=page.locator('details.admin-menu');await menu.waitFor();
  if(!await menu.evaluate(n=>n.open))await menu.locator('summary').click();
}
async function verifyMobileDesign(page) {
  if (!(await page.locator('app-mobile-shell').count())) return;
  assert.match(await page.locator('app-mobile-shell').evaluate(n=>getComputedStyle(n,'::before').backgroundImage),/virgen_maria.webp/,'Shared mobile background persists on internal pages');
  assert.equal(await page.locator('.mobile-topbar').evaluate(n => getComputedStyle(n).backgroundColor), 'rgb(31, 38, 75)');
  assert.equal(await page.locator('.mobile-topbar .brand').evaluate(n => getComputedStyle(n).color), 'rgb(255, 255, 255)');
  const contrasts = await page.locator('app-mobile-shell').evaluate(n => {
    const style=getComputedStyle(n), value=key=>style.getPropertyValue(key).trim();
    const luminance=hex=>{const c=hex.replace('#','');const v=(c.length===3?[...c].map(x=>x+x).join(''):c).match(/../g).map(x=>parseInt(x,16)/255).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4);return v[0]*.2126+v[1]*.7152+v[2]*.0722;};
    return [['--color-primary','--color-on-primary'],['--color-text-primary','--color-surface'],['--color-text-secondary','--color-background'],['--color-gold-text','--color-gold-tint']].map(([a,b])=>{const x=luminance(value(a)),y=luminance(value(b));return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);});
  });
  assert.ok(contrasts.every(ratio=>ratio>=4.5), 'Theme text contrast >=4.5:1');
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'Mobile theme must not overflow');
  assert.ok(await page.locator('.mobile-topbar .icon,.mobile-bottom a').evaluateAll(nodes => nodes.every(n => n.getBoundingClientRect().height >= 44)), 'Touch targets >=44px');
  if (await page.locator('.mobile-bottom').count()) {
    assert.equal(await page.locator('.mobile-bottom a').count(), 4);
    const active = page.locator('.mobile-bottom a.active,.mobile-bottom a.calendar-active').first();
    if (await active.count()) {
      assert.equal(await active.evaluate(n => getComputedStyle(n).color), 'rgb(31, 38, 75)');
      assert.equal(await active.evaluate(n => getComputedStyle(n, '::before').backgroundColor), 'rgb(183, 154, 70)');
    }
  }
  const primary = page.locator('.mobile-content .primary:visible').first();
  const memberName = page.locator('.member-copy strong').first();
  if (await memberName.count()) assert.match(await memberName.evaluate(n=>getComputedStyle(n).fontFamily), /Segoe UI/, 'Member names use UI font, never display serif');
  if (await primary.count()) {
    assert.equal(await primary.evaluate(n => getComputedStyle(n).backgroundColor), 'rgb(31, 38, 75)');
    assert.ok((await primary.boundingBox()).height >= 44);
  }
}

async function installNative(context, platform, cached = false, launchUrl = '', startFailure = null) {
  await context.addInitScript(({ platform, cached, launchUrl, startFailure }) => {
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
      nativeCallback: (plugin,method,options,callback) => { if(plugin==='App'&&method==='addListener'&&options.eventName==='appUrlOpen')window.__appUrlOpen=callback;if(plugin==='App'&&method==='addListener'&&options.eventName==='backButton')window.__androidBack=callback;return 'listener'; },
      nativePromise: async (plugin, method, options) => {
        window.__nativeCalls.push(`${plugin}.${method}`);
        if (plugin === 'EntraNativeAuth') {
          if (method === 'restore') return { step: cached ? 'unlock' : 'login' };
          if (method === 'unlock') return { step: cached ? 'authenticated' : 'login' };
          if (method === 'logout') {
            await new Promise(resolve => setTimeout(resolve, 40)); cached = false;
            return { step: 'login' };
          }
          if (method === 'getAccessToken') return { accessToken: 'sdk-api-test-token' };
          if (method === 'start') {
            if (startFailure) throw Object.assign(new Error('DO-NOT-EXPOSE-SDK-PAYLOAD'), { code:startFailure,
              data:{platform:'ios',phase:'start',serverCodes:[],email:'DO-NOT-EXPOSE-SDK-PAYLOAD'} });
            if (cached) throw Object.assign(new Error('An account is already signed in'), { code: 'ACCOUNT_ALREADY_SIGNED_IN' });
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
        if (plugin === 'App' && method === 'getLaunchUrl') return launchUrl ? {url:launchUrl} : undefined;
        if (plugin === 'CapacitorHttp' && options.url.includes('/api/')) {
          const response = await fetch(options.url, { method: options.method, headers: options.headers,
            ...(options.data === undefined ? {} : { body: JSON.stringify(options.data) }) });
          return { status: response.status, data: response.status===204?null:await response.json(), headers: {} };
        }
        if (plugin === 'CapacitorHttp') return { status: 200, data: {
          authorization_endpoint: 'https://eventidicomunita.ciamlogin.com/069bb457-b363-4340-8086-d7dd3b60a2b5/oauth2/v2.0/authorize',
          token_endpoint: 'https://eventidicomunita.ciamlogin.com/069bb457-b363-4340-8086-d7dd3b60a2b5/oauth2/v2.0/token'
        } };
        return {};
      }
    };
  }, { platform, cached, launchUrl, startFailure });
}

(async () => {
  let browser;
  try {
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    const base = `http://127.0.0.1:${server.address().port}`;
    browser = await chromium.launch({ headless: true,
      channel: process.env.PLAYWRIGHT_CHANNEL || (process.platform === 'win32' ? 'msedge' : undefined) });
    for (const platform of ['android', 'ios']) {
      for (const action of ['unlock', 'switch']) {
        const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
        await installNative(context, platform, true);
        await context.route('**/api/**', route => route.fulfill({ json: {
          authenticated: true, linkedToCommunity: true, communityId: 91, role: 'MEMBER',
          status: 'LINKED', permissions: [], communityName: 'Comunità test'
        } }));
        const page = await context.newPage(), errors = [];
        page.on('pageerror', error => errors.push(error.message));
        await page.goto(base);
        await page.getByRole('heading', { name: 'Bentornato', exact: true }).waitFor();
        if (action === 'unlock') {
          await page.getByRole('button', { name: 'Sblocca sessione', exact: true }).click();
          await page.waitForURL('**/mobile/home');
          assert.equal(await page.evaluate(() => window.__nativeCalls.includes('EntraNativeAuth.logout')), false);
          assert.equal(await page.getByRole('button',{name:'Indietro',exact:true}).count(),0);
          await page.locator('.retreat-card').click();await page.waitForURL('**/mobile/retreats');
          assert.equal(await page.getByRole('button',{name:'Indietro',exact:true}).count(),1);
          if(platform==='android') {
            await page.waitForFunction(()=>typeof window.__androidBack==='function');
            await page.evaluate(()=>window.__androidBack({canGoBack:true}));
          } else {
            await page.evaluate(()=>{const element=document.querySelector('app-mobile-shell');const start=new Touch({identifier:1,target:element,clientX:8,clientY:200});const end=new Touch({identifier:1,target:element,clientX:140,clientY:210});element.dispatchEvent(new TouchEvent('touchstart',{touches:[start],bubbles:true}));element.dispatchEvent(new TouchEvent('touchend',{changedTouches:[end],bubbles:true}));});
          }
          await page.waitForURL('**/mobile/home');
          await page.locator('.retreat-card').click();await page.getByRole('button',{name:'Indietro',exact:true}).click();await page.waitForURL('**/mobile/home');
          if(platform==='android'){await page.evaluate(()=>window.__androidBack({canGoBack:true}));assert.equal(new URL(page.url()).pathname,'/mobile/home');}
        } else {
          await page.getByRole('button', { name: 'Accedi con un altro account', exact: true }).click();
          await page.locator('#native-email').fill('b@example.test');
          if (await page.locator('#native-password').count())
            await page.getByRole('button', { name: 'Accedi con codice via email', exact: true }).click();
          await page.getByRole('button', { name: 'Accedi', exact: true }).click();
          await page.locator('#native-code').waitFor();
          assert.equal(new URL(page.url()).pathname, '/');
          const calls = await page.evaluate(() => window.__nativeCalls);
          assert.ok(calls.indexOf('EntraNativeAuth.logout') < calls.indexOf('EntraNativeAuth.start'));
        }
        assert.deepEqual(errors, []);
        console.log(`PASS cached ${platform}: ${action}`);
        await context.close();
      }
    }
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
      assert.equal(await page.locator('app-mobile-welcome button').count(),1,'One welcome CTA');
      assert.equal(await page.getByRole('button',{name:'Registrati',exact:true}).count(),0);
      assert.equal(await page.locator('app-mobile-welcome a,.welcome-mark').count(),0,'No secondary links or brand icon');
      assert.equal(await page.getByText('Accedi o registrati',{exact:true}).count(),0);
      await page.getByText('Accesso tramite codice inviato via email',{exact:true}).waitFor();
      await page.getByText('Un progetto PANTELEIA – APS',{exact:true}).waitFor();
      await page.getByText('Applicazione indipendente',{exact:true}).waitFor();
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
      const ctaContrast=await page.locator('.welcome-button').evaluate(n=>{
        const s=getComputedStyle(n);const lum=color=>{const v=color.match(/[\d.]+/g).slice(0,3).map(x=>Number(x)/255).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4);return v[0]*.2126+v[1]*.7152+v[2]*.0722;};
        const a=lum(s.color),b=lum(s.backgroundColor);return (Math.max(a,b)+.05)/(Math.min(a,b)+.05);
      });
      assert.ok(ctaContrast>=4.5,`${name}: CTA text contrast >=4.5:1`);
      if (height >= 568) {
        assert.ok(metrics.scroll <= height + 1, `${name}: unnecessary scroll (${metrics.scroll})`);
        assert.ok(metrics.footer.bottom <= height - bottom, `${name}: bottom safe area`);
      }
      await verifyMobileDesign(page); await page.screenshot({ path: path.join(output, `${name}.png`), fullPage: true });
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
      await verifyMobileDesign(page); await page.screenshot({ path: path.join(output, `web-${width}.png`), fullPage: true });
      console.log(`PASS browser ${width}: landing web preservata`);
      await context.close();
    }
    for (const [label, target] of [['Guarda la demo', '/demo'], ['FAQ', '/faq']]) {
      const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
      await installNative(context, 'ios');
      const page = await context.newPage(); await page.goto(base);
      assert.equal(await page.getByRole('link', { name: label, exact: true }).count(),0,'Secondary links removed from welcome');
      await page.goto(base+target);
      await page.waitForURL(url => url.pathname.startsWith(target));
      assert.equal(await page.locator('app-mobile-welcome').count(), 0);
      console.log(`PASS public route ${label}: removed from welcome`); await context.close();
    }
    for (const label of ['Accedi']) {
      const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
      await installNative(context, 'ios');
      const page = await context.newPage(); page.setDefaultTimeout(12000); await page.goto(base);
      await page.getByRole('button', { name: label, exact: true }).click();
      await page.locator('app-native-auth-panel h1').waitFor();
      assert.equal(await page.locator('app-native-auth-panel h1').textContent(), label);
      assert.equal(await page.locator('#native-password').count(),0,'Welcome uses existing OTP method');
      assert.equal(await page.evaluate(() => window.__nativeCalls.includes('Browser.open')), false);
      await verifyMobileDesign(page); await page.screenshot({ path: path.join(output, `native-${label}.png`), fullPage: true });
      console.log(`PASS ${label}: form in-app, nessuna apertura browser`);
      await context.close();
    }
    if(!process.env.MOBILE_TEST_FLOW||process.env.MOBILE_TEST_FLOW==='ios-diagnostics'){
      for(const code of ['AUTH_START_FAILED','AUTH_CONFIGURATION','AUTH_TRANSPORT']){
        const context=await browser.newContext({viewport:{width:390,height:844}});
        await installNative(context,'ios',false,'',code);
        let meCalls=0;
        await context.route('**/api/me',async route=>{meCalls++;await route.fulfill({status:401,json:{}});});
        const page=await context.newPage();const logs=[];page.on('console',msg=>logs.push(msg.text()));
        await page.goto(base);await page.getByRole('button',{name:'Accedi',exact:true}).click();
        await page.locator('#native-email').fill('fixture@example.test');
        await page.locator('app-native-auth-panel button[type="submit"]').click();
        await page.getByText(`Codice assistenza: IOS-start-${code}`,{exact:true}).waitFor();
        assert.equal(await page.locator('#native-code').count(),0);
        assert.equal(await page.locator('#native-password').count(),0);
        assert.equal(await page.locator('app-mobile-shell').count(),0);
        assert.equal(await page.evaluate(()=>window.__nativeCalls.includes('Browser.open')),false);
        assert.equal(meCalls,0);
        assert.equal((await page.locator('body').innerText()).includes('DO-NOT-EXPOSE'),false);
        assert.equal(logs.join('\n').includes('DO-NOT-EXPOSE'),false);
        await context.close();console.log(`PASS iOS pre-OTP diagnostic ${code}: no browser, token/profile or raw SDK payload`);
      }
    }
    for (const flow of ['password', 'otp', 'reset', 'linked', 'retry', 'profile-slow', 'profile-down', 'profile-denied', 'pending', 'rejected', 'bootstrap', 'calendar-manager', 'calendar-member', 'directory-manager', 'directory-member', 'invitation'].filter(flow=>!process.env.MOBILE_TEST_FLOW||flow===process.env.MOBILE_TEST_FLOW)) {
      const context = await browser.newContext({ viewport: { width: 390, height: 844 }, timezoneId: process.env.MOBILE_TEST_TIMEZONE || 'Europe/Rome' });
      await installNative(context, flow === 'directory-member' ? 'ios' : 'android');
      let meCalls = 0;
      let resubmitted = false;
      let bootstrapApproved = false;
      let communityManager = flow === 'calendar-manager' || flow === 'directory-manager';
      let directoryConfirmed = false;
      const inviteId='aaaaaaaa-1234-4321-8123-aaaaaaaaaaaa';let invitationAccepted=false;
      const savedInvitations=[];let emailDeliveryState='NOT_SENT';
      const preparedInvites=[];const accessRequests=[{id:202,firstName:'Emmanuel',lastName:'Baciarlini',email:'emmanuel@example.test',parishId:11,parishName:'Parrocchia di test',communityNumber:3,requestedRole:'MEMBER',requestedStage:'Precatecumenato',status:'IN_ATTESA_APPROVAZIONE',existingPeople:[{id:15,name:'Emmanuel Baciarini'}],candidates:[{id:15,name:'Emmanuel Baciarini',reasons:['FUZZY_NAME']}],canApprove:true,canReject:true},{id:203,firstName:'Nuova',lastName:'Persona',email:'new@example.test',parishId:11,parishName:'Parrocchia di test',communityNumber:3,requestedRole:'MEMBER',requestedStage:'Precatecumenato',status:'IN_ATTESA_APPROVAZIONE',existingPeople:[],candidates:[],canApprove:true,canReject:true}];
      const personalProfile={firstName:'Test',lastName:'Member',phone:'',email:'user@example.test',birthDate:null,photoUrl:null,photoUploadAvailable:false};
      let emmanuelCapability=true,emmanuelPending=null,emmanuelLinked=false,emmanuelEmail='emmanuel@example.test';
      const directoryPeople = [{id:12,firstName:'Anna',lastName:'Rossi',phone:'3331234567',email:'anna@example.test',role:'MEMBER',active:true,canEditBirthDate:true},{id:13,firstName:'Marco',lastName:'Verdi',phone:'',email:'',role:'RESPONSIBLE',active:true,canEditBirthDate:false}];
      const directoryDraft = {id:81,status:'DRAFT',sourceType:'TEXT',updatedAt:'2026-11-19T10:00:00Z',sheets:['Elenco','Da verificare'],roles:['MEMBER','CO_RESPONSIBLE'],people:directoryPeople,newPeopleCount:0,existingPeopleCount:0,ignoredCount:0,
        rows:Array.from({length:40},(_,i)=>({id:101+i,sourceSheet:i<30?'Elenco':'Da verificare',sourceLocator:`Elenco, riga ${i+2}`,sourceText:`Nome${i+1} Cognome`,sourceSelected:true,
          firstName:i===0?'Anna':i===1?'Mario':`Nuovo${i+1}`,lastName:i===0?'Rossi':i===1?'Rossi':'Censito',phone:i===0||i===1?'3331234567':'',email:'',birthDate:null,birthDateRaw:'',role:'MEMBER',roleRaw:'',stage:'',notes:'',
          spouseRaw:i===0?'Marco Verdi':'',needsReview:false,reviewed:false,action:i===0?'EXISTING':i===1?'REVIEW':'NEW',targetPersonId:i===0?12:null,updateExisting:false,updateRole:false,duplicateConfirmed:false,applySpouse:false,spousePersonId:null,spouseRowId:null,resultPersonId:null,
          state:i<2?'POSSIBILE_DUPLICATO':'PRONTO',classification:i===0?'MATCH_EXISTING':i===1?'POSSIBLE_DUPLICATE':'NEW_PERSON',issues:[],candidates:i<2?[{id:12,firstName:'Anna',lastName:'Rossi',active:true,reasons:[i===0?'NAME':'PHONE']}]:[],batchDuplicates:[],spouseMatches:i===0?[{personId:13,rowId:null,name:'Marco Verdi'}]:[]}))};
      let calendarPublished = false;
      for (const [index, firstName, lastName, phone, email] of [[3,'Cristiano','Giagnorio','3339474936','cristianogiagnorio@gmail.com'],[4,'Laura','Perrotti','3349950517','lauraperrotti@alice.it']]) {
        Object.assign(directoryDraft.rows[index], {firstName,lastName,phone,email,needsReview:true,state:'DA_VERIFICARE',
          evidence:{blockId:'couple-A',component:index-3,isCouple:true,fields:[{field:'lastName',value:lastName,confidence:'INFERITO',origin:"Cognome suggerito dall'email, non verificato"}],addresses:['Via dei Bonsignori, 32'],additionalContacts:[{kind:'FISSO_NUCLEO',value:'0645582581',origin:'Telefono fisso del nucleo'}]}});
      }
      const calendarEvent = { id: 501, date:'2026-11-20', startTime:'20:30:00', endTime:null, title:'Celebrazione della Parola', eventType:'Parola',
        description:'Incontro della comunità', location:'Sala parrocchiale', sourceLocator:'Testo, riga 1', sourceText:'20 novembre - Parola',
        reviewConfirmed:false, duplicateConfirmed:false, isIgnored:false, isCancelled:false, updatedAt:'2026-11-19T10:00:00Z',
        assignments:[{ personId:12, rawName:'Anna', displayName:'Anna Rossi', matchStatus:'MATCHED', label:'Preparazione della Parola', reminderDaysBefore:3, isMine:true }] };
      const calendarDraft = { id:71, status:'PARSED', sourceType:'TEXT', updatedAt:'2026-11-19T10:00:00Z', events:[structuredClone(calendarEvent)], people:[{id:12,firstName:'Anna',lastName:'Rossi'}] };
      calendarDraft.people.push({id:13,firstName:'Paolo',lastName:'Rossi'},{id:14,firstName:'Paolo',lastName:'Verdi'});
      calendarDraft.events[0].assignments.push({personId:null,rawName:'Paolo',matchStatus:'AMBIGUOUS',label:'Preparazione',reminderDaysBefore:null});
      let communityState = 'ready';
      let approvalCalls = 0;
      let spouseId = null;
      let censusCalls = 0;
      let memberUpdates = 0;
      let birthdayState = 'ready';
      const preferences = { showPhone:false, showEmail:true, showBirthday:false, showBirthDate:false, showPhoto:false, showFamily:false, receiveBirthdayNotifications:false, receiveCommunityNotifications:false };
      const birthdayItems = [
        {personId:12,displayName:'Anna Rossi',day:18,month:11,dateLabel:'18 novembre',isToday:true,daysUntilBirthday:0,section:'today'},
        {personId:13,displayName:'Marco Verdi',day:21,month:11,dateLabel:'21 novembre',isToday:false,daysUntilBirthday:3,section:'week'},
        {personId:15,displayName:'Emmanuel Baciarini',day:10,month:8,dateLabel:'10 agosto',isToday:false,daysUntilBirthday:265,section:'later'},
        {personId:17,displayName:'Elena Bianchi',day:30,month:11,dateLabel:'30 novembre',isToday:false,daysUntilBirthday:12,section:'month'},
        {personId:16,displayName:'Luca Neri',day:5,month:1,dateLabel:'5 gennaio',isToday:false,daysUntilBirthday:48,section:'later'}
      ];
      const communityMembers = [
        { personId: 12, firstName: 'Anna', lastName: 'Rossi', role: 'MEMBER', phoneNumber:'333 1234567', email:'anna@example.test', birthdayLabel:'6 maggio', accountLinked:false },
        { personId: 13, firstName: 'Marco', lastName: 'Verdi', role: 'RESPONSIBLE', stage: 'Rinnovate Promesse Battesimali', birthDate: '1985-05-03', birthdayLabel:'3 maggio', email: 'shared@example.test', phoneNumber: '+44 20 7946 0018' }
      ];
      await context.route('**/api/**', async route => {
        const headers = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': 'GET, POST, PUT, OPTIONS' };
        if (route.request().method() === 'OPTIONS') { await route.fulfill({ status: 204, headers }); return; }
        const apiPath = new URL(route.request().url()).pathname;
        if (apiPath.startsWith('/api/me/community/directory-imports')) {
          assert.equal(communityManager,true);
          assert.equal(route.request().headers().authorization,'Bearer sdk-api-test-token');
          if (apiPath.endsWith('/file')) {
            assert.ok(route.request().headers()['content-type'].includes('multipart/form-data'));
            await route.fulfill({status:503,headers,json:{message:'Archivio documenti non configurato.'}});
          } else if (apiPath.endsWith('/text')) {
            assert.ok(route.request().postDataJSON().text.includes('Mario Rossi'));
            await route.fulfill({status:201,headers,json:{id:81,existing:false}});
          } else if (apiPath.endsWith('/couple')) {
            const body=route.request().postDataJSON();assert.equal(body.firstRowId,104);assert.equal(body.secondRowId,105);
            Object.assign(directoryDraft.rows[3],{applySpouse:true,spouseRowId:105});Object.assign(directoryDraft.rows[4],{applySpouse:true,spouseRowId:104});
            await route.fulfill({headers,json:directoryDraft});
          } else if (/\/rows\/\d+$/.test(apiPath)) {
            const row=directoryDraft.rows.find(x=>x.id===Number(apiPath.split('/').pop()));
            const body=route.request().postDataJSON();assert.equal(body.reviewed,true);assert.equal(body.communityId,undefined);
            Object.assign(row,body);row.state=row.action==='IGNORE'?'IGNORATA':'PRONTO';
            if(row.id===101){assert.equal(body.updateExisting,false);assert.equal(body.spousePersonId,13);}
            if(row.id===102)assert.equal(body.duplicateConfirmed,true);
            await route.fulfill({headers,json:directoryDraft});
          } else if (apiPath.endsWith('/selection')) {
            const sheets=route.request().postDataJSON().sheets;
            for(const row of directoryDraft.rows){row.sourceSelected=sheets.includes(row.sourceSheet);if(!row.sourceSelected)row.state='IGNORATA';else row.state=row.action==='IGNORE'?'IGNORATA':row.reviewed?'PRONTO':row.needsReview?'DA_VERIFICARE':row.id>102?'PRONTO':'POSSIBILE_DUPLICATO';}
            await route.fulfill({headers,json:directoryDraft});
          } else if (apiPath.endsWith('/confirm')) {
            assert.equal(route.request().postDataJSON().reviewed,true);directoryConfirmed=true;directoryDraft.status='CONFIRMED';
            directoryDraft.newPeopleCount=directoryDraft.rows.filter(x=>x.action==='NEW').length;directoryDraft.existingPeopleCount=1;directoryDraft.ignoredCount=1;
            for(const row of directoryDraft.rows.filter(x=>x.action==='NEW'))communityMembers.push({personId:row.id,firstName:row.firstName,lastName:row.lastName,role:row.role,phoneNumber:row.phone,email:row.email,accountLinked:false});
            await route.fulfill({headers,json:directoryDraft});
          } else if (apiPath.endsWith('/81')) await route.fulfill({headers,json:directoryDraft});
          else await route.fulfill({headers,json:[]});
          return;
        }
        if (apiPath.startsWith('/api/mobile/calendar')) {
          if (!flow.startsWith('calendar-')) { await route.fulfill({headers,json:{today:'2026-11-19',canManage:false,events:[]}}); return; }
          assert.equal(route.request().headers().authorization, 'Bearer sdk-api-test-token');
          if (apiPath.endsWith('/imports/text')) {
            assert.ok(route.request().postDataJSON().text.includes('20 novembre'));
            await route.fulfill({status:201,headers,json:{id:71,existing:false}});
          } else if (apiPath.endsWith('/imports/excel')) {
            assert.ok(route.request().headers()['content-type'].includes('multipart/form-data'));
            await route.fulfill({status:503,headers,json:{message:'Archivio documenti non configurato.'}});
          } else if (apiPath.endsWith('/imports/71/approve')) {
            calendarPublished = true; calendarDraft.status = 'APPROVED'; await route.fulfill({headers,json:{id:71,status:'APPROVED'}});
          } else if (apiPath.endsWith('/imports/71')) {
            if (route.request().method() === 'PUT') {
              Object.assign(calendarDraft,route.request().postDataJSON());
              assert.equal(calendarDraft.events[0].reviewConfirmed,true);
            }
            await route.fulfill({headers,json:calendarDraft});
          } else if (apiPath.endsWith('/imports')) await route.fulfill({headers,json:[{id:71,status:calendarDraft.status,sourceType:'TEXT',count:1}]});
          else if (apiPath.endsWith('/people')) await route.fulfill({headers,json:calendarDraft.people});
          else if (apiPath.endsWith('/501')) await route.fulfill({headers,json:{event:calendarEvent,canManage:communityManager}});
          else await route.fulfill({headers,json:{today:'2026-11-19',canManage:communityManager,events:[calendarEvent]}});
          return;
        }
        if (apiPath === '/api/mobile/birthdays') {
          assert.equal(route.request().headers().authorization, 'Bearer sdk-api-test-token');
          assert.equal(new URL(route.request().url()).search, '');
          if (birthdayState === 'error') { await route.fulfill({status:503,headers,json:{}}); return; }
          if (birthdayState === 'loading') await new Promise(resolve => setTimeout(resolve,500));
          await route.fulfill({headers,json:{communityName:'3ª Comunità',parishName:'Parrocchia Martiri Canadesi',today:'2026-11-18',
            birthdays:birthdayState === 'empty' ? [] : birthdayItems}});
          return;
        }
        if(apiPath.startsWith('/api/onboarding/invitations')){
          assert.equal(route.request().headers().authorization,'Bearer sdk-api-test-token');
          if(apiPath.endsWith('/accept')){assert.equal(route.request().postDataJSON().privacyConsent,true);invitationAccepted=true;await route.fulfill({headers,json:{linkedToCommunity:true}});}
          else if(apiPath.endsWith(inviteId)){await route.fulfill({headers,json:{status:'PENDING',communityName:'3ª Comunità',parishName:'Parrocchia Martiri Canadesi',firstName:'Test',lastName:'Member'}});}
          else if(apiPath.endsWith('/cancel')){const item=savedInvitations.find(x=>x.id===Number(apiPath.split('/').at(-2)));if(item)item.status='CANCELLED';await route.fulfill({headers,json:{status:'CANCELLED'}});}
          else if(apiPath.endsWith('/delivery')||apiPath.endsWith('/resend')){
            const item=savedInvitations.find(x=>x.id===Number(apiPath.split('/').at(-2)));
            if(!item){await route.fulfill({status:404,headers,json:{message:'Invito non disponibile'}});return;}
            if(apiPath.endsWith('/resend'))item.emailStatus=emailDeliveryState;
            await route.fulfill({headers,json:item});
          }
          else if(route.request().method()==='POST'){
            const body=route.request().postDataJSON();assert.equal(body.communityId,91);assert.ok(body.email.includes('@'));
            preparedInvites.push(body);const member=communityMembers.find(x=>x.personId===body.personId);if(member)member.invitationStatus='PENDING';
            const item={id:501+savedInvitations.length,publicId:inviteId,personId:body.personId,status:'PENDING',expiresAt:'2026-12-01T12:00:00Z',invitationUrl:`https://test.eventidicomunita.it/?inviteId=${inviteId}`,emailStatus:emailDeliveryState,deliveryStatus:'PREPARED_NOT_SENT',mail:{to:body.email,subject:'Invito a Eventi di Comunità',body:'Accedi con Microsoft alla tua comunità.'}};
            savedInvitations.push(item);await route.fulfill({headers,json:item});
          }else await route.fulfill({headers,json:savedInvitations});return;
        }
        if(apiPath==='/api/me/community/profile'){
          if(route.request().method()==='PUT'){const body=route.request().postDataJSON();assert.equal(body.personId,undefined);assert.equal(body.role,undefined);Object.assign(personalProfile,body);await route.fulfill({status:204,headers});}
          else await route.fulfill({headers,json:personalProfile});return;
        }
        if (apiPath.startsWith('/api/me/community')) {
          assert.equal(route.request().headers().authorization, 'Bearer sdk-api-test-token');
          if (apiPath.endsWith('/community') && communityState === 'error') {
            await route.fulfill({ status: 503, headers, json: {} }); return;
          }
          if (apiPath.endsWith('/spouse-options')) {
            assert.equal(communityManager, true);
            const current = new URL(route.request().url()).searchParams.get('personId') === '14' ? spouseId : null;
            await route.fulfill({ headers, json: { currentSpouseId: current, currentMarriageId: current === null ? null : 51,
              candidates: communityMembers.filter(m => m.personId !== 14).map(({personId,firstName,lastName}) => ({personId,firstName,lastName})) } });
          } else if (apiPath.endsWith('/privacy')) {
            if (route.request().method() === 'PUT') {
              const payload = route.request().postDataJSON();
              assert.equal(payload.personId, undefined); assert.equal(payload.communityId, undefined);
              Object.assign(preferences,payload);
            }
            await route.fulfill({ headers, json: preferences });
          } else if (apiPath.endsWith('/members') && route.request().method() === 'POST') {
            const payload = route.request().postDataJSON();
            assert.equal(payload.firstName, 'Nuovo'); assert.equal(payload.role, 'MEMBER');
            assert.equal(payload.communityId, undefined);
            assert.equal(payload.birthDate, '1984-02-29'); assert.equal(payload.spouseId, 13); assert.equal(payload.updateSpouse, true);
            assert.equal(payload.expectedMarriageId, null); spouseId = payload.spouseId; censusCalls++;
            communityMembers.push({ personId: 14, firstName: payload.firstName, lastName: payload.lastName, role: payload.role });
            await route.fulfill({ status: 201, headers, json: { personId: 14 } });
          } else if (/\/members\/\d+$/.test(apiPath)) {
            const member = communityMembers.find(m => m.personId === Number(apiPath.split('/').pop())) ??
              {personId:15,firstName:'Emmanuel',lastName:'Baciarini',role:'MEMBER',birthdayLabel:'10 agosto',phoneNumber:'0039 02 12345678',email:'emmanuel@example.test'};
            if (route.request().method() === 'PUT') {
              memberUpdates++;
              const payload = route.request().postDataJSON();
              if (memberUpdates === 1) assert.equal(payload.updateSpouse, undefined, 'Coniuge invariato non riscritto');
              else { assert.equal(payload.spouseId, null); assert.equal(payload.expectedMarriageId, 51); spouseId = null; }
              await route.fulfill({ headers, json: {} }); return;
            }
            const checkEmmanuel=flow==='directory-manager'&&member.personId===15;
            await route.fulfill({ headers, json: { member:checkEmmanuel?{...member,email:emmanuelEmail,accountLinked:emmanuelLinked,invitationStatus:emmanuelPending}:member, stage: 'Precatecumenato', isSelf: member.personId === 12, canEdit: communityManager,
              canEditPhone: communityManager, canEditEmail: communityManager, canEditBirthDate: false, canManageRole: communityManager,
              accountLinked:checkEmmanuel?emmanuelLinked:member.personId>=101?false:![14,15].includes(member.personId), canManageMarriage: communityManager, canInvite:checkEmmanuel?emmanuelCapability:communityManager && (member.personId>=101 || [14,15].includes(member.personId)),
              ...(member.personId === 13 ? {spouse:{personId:12,firstName:'Anna',lastName:'Rossi'}} : {}),
              assignableRoles: communityManager ? ['MEMBER', 'CO_RESPONSIBLE'] : [member.role] } });
          } else await route.fulfill({ headers, json: { context: { personId: 12, communityNumber:3, communityName: '3ª Comunità', parishName: 'Parrocchia Martiri Canadesi',
              role: communityManager ? 'RESPONSIBLE' : 'MEMBER', permissions: communityManager ? ['EDIT_MEMBRI', 'APPROVE_REQUESTS'] : ['VIEW_MEMBRI'] },
            members: communityState === 'empty' ? [] : communityState === 'single' ? communityMembers.slice(0,1) : communityMembers,
            canAddMember: communityManager, canManageMarriage: communityManager, assignableRoles: ['MEMBER', 'CO_RESPONSIBLE'] } });
          return;
        }
        if (new URL(route.request().url()).pathname.endsWith('/me')) {
          assert.equal(route.request().headers().authorization, 'Bearer sdk-api-test-token');
          meCalls++;
          if(flow === 'profile-down' || flow === 'profile-denied') { await route.fulfill({status:flow==='profile-down'?503:403,headers,json:{}});return; }
          if(flow === 'profile-slow')await new Promise(r=>setTimeout(r,1200));
          if (flow === 'retry' && meCalls === 1) { await route.fulfill({ status: 503, headers, json: {} }); return; }
          const linked = invitationAccepted || ['linked','retry','profile-slow'].includes(flow) || flow.startsWith('calendar-') || flow.startsWith('directory-') || flow === 'pending' && meCalls > 1;
          await route.fulfill({ headers, json: { authenticated: true, linkedToCommunity: linked, isOnboardingAdmin: flow === 'bootstrap', status: linked ? 'LINKED' : flow === 'pending' || resubmitted ? 'IN_ATTESA_APPROVAZIONE' : flow === 'rejected' ? 'RESPINTA' : 'UNLINKED', permissions: linked ? ['VIEW_COMUNITA', 'VIEW_MEMBRI', 'VIEW_CONVIVENZE',...(communityManager?['EDIT_MEMBRI','MANAGE_RUOLI','APPROVE_REQUESTS','CREATE_CONVIVENZA']:[])] : [],
            ...(linked ? { userId:1,personId:12,communityId: 91, communityNumber: 3, communityName: '3ª Comunità', parishName: 'Parrocchia di test', displayName: 'Utente di test', role: communityManager ? 'RESPONSIBLE' : 'MEMBER', memberCount: 2 } : {}) } });
        } else if (route.request().url().endsWith('/onboarding/requests')) { approvalCalls++; await route.fulfill({ headers, json: flow === 'bootstrap' ? [{ id: 101, firstName: 'Primo', lastName: 'Responsabile', parishId: 11, parishName: 'Parrocchia di test', communityNumber: 3, requestedRole: 'RESPONSIBLE', requestedStage: 'Precatecumenato', status: bootstrapApproved ? 'APPROVATA' : 'IN_ATTESA_APPROVAZIONE', existingPeople: [], canApprove: true, canReject: true }] : flow==='directory-manager'?accessRequests:[] }); }
        else if (/\/onboarding\/requests\/20[23]\/approve$/.test(apiPath)){
          const id=Number(apiPath.split('/').at(-2));const body=route.request().postDataJSON();if(id===202)assert.equal(body.personId,15);else {assert.equal(body.firstName,'Nuova');assert.equal(body.role,'MEMBER');}accessRequests.find(x=>x.id===id).status='APPROVATA';await route.fulfill({headers,json:{status:'APPROVATA'}});
        }
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
      await page.goto(flow==='invitation'?base+'?inviteId='+inviteId:base);
      await page.getByRole('button', { name: flow === 'invitation' ? 'Continua' : 'Accedi', exact: true }).click();
      if (flow === 'password') await page.getByRole('button', { name: 'Accedi con password' }).click();
      if (flow === 'reset') await page.getByRole('button', { name: 'Hai dimenticato la password?' }).click();
      await page.getByLabel('Email', { exact: true }).fill('user@example.test');
      if (flow === 'password') await page.getByLabel('Password', { exact: true }).fill('test-only');
      await page.locator('app-native-auth-panel button[type="submit"]').click();
      let loginStartedAt = performance.now();
      await page.evaluate(()=>{window.__authErrorShown=false;new MutationObserver(()=>{if(document.querySelector('.auth-loading-card.error'))window.__authErrorShown=true;}).observe(document.body,{childList:true,subtree:true});});
      if (flow !== 'password') {
        await page.getByLabel('Codice di verifica').fill('000000');
        loginStartedAt = performance.now();
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
      if (flow === 'profile-down' || flow === 'profile-denied') {
        await page.getByRole('button',{name:'Riprova accesso',exact:true}).waitFor();
        assert.equal(meCalls,flow==='profile-down'?2:1);
        assert.equal(new URL(page.url()).pathname,'/');
        assert.equal(await page.locator('app-mobile-home').count(),0);
        assert.equal(await page.evaluate(()=>window.__nativeCalls.filter(x=>x==='EntraNativeAuth.start').length),1);
        console.log(`PASS ${flow}: bounded requests, real error visible, no dashboard or repeated login`);
        await context.close();continue;
      }
      if (flow === 'reset') {
        await page.getByRole('heading', { name: 'Accedi', exact: true }).waitFor();
        assert.equal(meCalls, 0);
      } else {
        await page.waitForURL(url => url.pathname === (flow==='invitation'?'/invite/'+inviteId:['linked','retry','profile-slow'].includes(flow) || flow.startsWith('calendar-') || flow.startsWith('directory-') ? '/mobile/home' : '/mobile/onboarding'));
        assert.equal(meCalls, flow === 'retry' ? 2 : 1);
        if(['retry','otp','profile-slow'].includes(flow)){
          console.log('[AUTH benchmark] OTP submit to route ms:',Math.round(performance.now()-loginStartedAt),'scenario:',flow);
          assert.equal(await page.evaluate(()=>window.__authErrorShown),false,'No transient error screen');
        }
      }
      if (flow === 'bootstrap') {
        await page.getByRole('link', { name: 'Appartenenze e approvazioni', exact: true }).click();
        await page.waitForURL(url => url.pathname === '/mobile/approvazioni');
        await page.getByRole('button', { name: 'Approva accesso', exact: true }).click();
        await page.getByText('Appartenenza approvata.', { exact: true }).waitFor();
        assert.equal(bootstrapApproved, true);
        assert.equal(await page.locator('.layout-container').count(), 0);
        await verifyMobileDesign(page); await page.screenshot({path:path.join(output,'bootstrap-admin.png'),fullPage:true});
      }
      if(flow==='invitation'){
        await page.getByRole('heading',{name:'Invito nella comunità',exact:true}).waitFor();
        await page.getByLabel("Ho letto l'informativa privacy per l'accesso alla comunità",{exact:true}).check();
        await page.getByRole('button',{name:'Accetta invito',exact:true}).click();await page.waitForURL(url=>url.pathname==='/mobile/community');
        await page.getByRole('link',{name:'Profilo',exact:true}).click();await page.getByRole('link',{name:'Il mio profilo',exact:true}).click();await page.getByRole('link',{name:'Completa il tuo profilo',exact:true}).click();
        await page.getByRole('heading',{name:'Completa il tuo profilo',exact:true}).waitFor();
        assert.equal(await page.locator('.avatar').count()>0,true);assert.equal(await page.getByLabel('URL foto personale (HTTPS)').count(),0);
        await page.getByLabel('Carica foto',{exact:true}).setInputFiles({name:'foto.png',mimeType:'image/png',buffer:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=','base64')});
        await page.getByText(/Anteprima locale: caricamento foto non ancora disponibile/).waitFor();
        for(const width of [320,390,412]){await page.setViewportSize({width,height:844});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await verifyMobileDesign(page); await page.screenshot({path:path.join(output,`personal-profile-${width}.png`),fullPage:true});}
        await page.getByLabel('Telefono opzionale',{exact:true}).fill('3331234567');await page.getByRole('button',{name:'Salva profilo',exact:true}).click();
        try{await page.waitForURL(url=>url.pathname==='/mobile/home');}catch(error){await verifyMobileDesign(page); await page.screenshot({path:path.join(output,'invitation-profile-error.png'),fullPage:true});console.log(await page.locator('app-mobile-personal-profile').innerText());throw error;}
        assert.equal(personalProfile.phone,'3331234567');assert.equal(invitationAccepted,true);
        await page.getByRole('link',{name:'Profilo',exact:true}).click();await page.getByRole('link',{name:'Il mio profilo',exact:true}).click();await page.getByRole('link',{name:'Completa il tuo profilo',exact:true}).click();
        await page.getByRole('button',{name:'Completa più tardi',exact:true}).click();await page.waitForURL(url=>url.pathname==='/mobile/home');
        assert.deepEqual(await page.locator('.mobile-bottom a span').allTextContents(),['Home','Calendario','Comunità','Profilo']);
      }
      if (flow.startsWith('calendar-')) {
        await page.getByText('Prossimo appuntamento',{exact:true}).waitFor();
        await page.getByText('Il tuo incarico',{exact:true}).waitFor();
        await page.locator('.mobile-bottom').getByRole('link',{name:'Calendario',exact:true}).click();
        await page.locator('app-mobile-calendar .event').filter({hasText:'Celebrazione della Parola'}).first().click();
        await page.getByRole('heading',{name:'Il tuo incarico',exact:true}).waitFor();
        await page.getByRole('heading',{name:'Celebrazione della Parola',exact:true}).waitFor();
        await page.getByRole('link',{name:'Calendario',exact:true}).first().click();
        if (communityManager) {
          await page.getByRole('link',{name:'Importa calendario',exact:true}).click();
          await page.getByRole('button',{name:'Excel .xlsx',exact:true}).click();
          await page.locator('input[type=file]').setInputFiles({name:'calendario.xlsx',mimeType:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',buffer:Buffer.from('fixture')});
          await page.getByRole('button',{name:'Analizza e crea bozza',exact:true}).click();
          await page.getByRole('alert').filter({hasText:'Archivio documenti non configurato'}).waitFor();
          await page.getByRole('button',{name:'Incolla testo',exact:true}).click();
          await page.getByLabel('Testo del calendario',{exact:true}).fill('20 novembre - Parola\nAnna');
          await page.getByRole('button',{name:'Analizza e crea bozza',exact:true}).click();
          await page.getByRole('heading',{name:'Revisione calendario',exact:true}).waitFor();
          await page.getByText('Da confermare',{exact:true}).waitFor();
          await page.getByLabel('Persona',{exact:true}).nth(1).selectOption({label:'Paolo Rossi'});
          for (const width of [320,390,412]) {
            await page.setViewportSize({width,height:844});
            assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
            await verifyMobileDesign(page); await page.screenshot({path:path.join(output,`calendar-editor-${width}.png`),fullPage:true});
          }
          await page.getByLabel('Ho verificato data, titolo e incarichi',{exact:true}).check();
          await page.getByRole('button',{name:'Approva e pubblica',exact:true}).click();
          await page.getByText('Calendario approvato e pubblicato nella comunità.',{exact:true}).waitFor();
          assert.equal(calendarPublished,true);
        } else assert.equal(await page.getByRole('link',{name:'Importa calendario',exact:true}).count(),0);
        for (const width of [320,390,412]) {
          await page.setViewportSize({width,height:844});
          assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
          assert.deepEqual(await page.locator('.mobile-bottom a span').allTextContents(),['Home','Calendario','Comunità','Profilo']);
          await verifyMobileDesign(page); await page.screenshot({path:path.join(output,`${flow}-${width}.png`),fullPage:true});
        }
        console.log(`PASS ${flow}: Home, incarico, calendario, revisione e permessi`);
      }
      if (flow.startsWith('directory-')) {
        await page.locator('.retreat-card').click();
        await page.locator('.area-link').first().waitFor();
        assert.equal(await page.locator('.area-link').count(),communityManager?2:1);
        if(communityManager)assert.equal(await page.locator('.area-link[href="/mobile/posti-convivenza"]').count(),1);
        await page.locator('.mobile-bottom').getByRole('link',{name:'Home',exact:true}).click();
        await page.locator('.mobile-bottom').getByRole('link',{name:'Comunità',exact:true}).click();
        if(communityManager)await page.getByLabel('Gestione comunità',{exact:true}).waitFor();
        else assert.equal(await page.getByLabel('Gestione comunità',{exact:true}).count(),0);
        await page.getByRole('searchbox',{name:'Cerca nella comunità'}).fill('333123');
        assert.equal(await page.locator('[data-section="Fratelli"] .member-row').count(),1);
        await page.getByRole('button',{name:'Cancella ricerca',exact:true}).click();
        if (communityManager) {
          await openCommunityMenu(page);await page.getByRole('link',{name:'Importa elenco',exact:true}).click();
          for(const format of ['Excel','CSV']) {
            await page.getByRole('button',{name:format,exact:true}).click();
            await page.locator('input[type=file]').setInputFiles({name:format==='Excel'?'rubrica.xlsx':'rubrica.csv',mimeType:'application/octet-stream',buffer:Buffer.from('fixture')});
            await page.getByRole('button',{name:'Analizza e crea bozza',exact:true}).click();
            await page.getByRole('alert').filter({hasText:'Archivio documenti non configurato'}).waitFor();
          }
          await page.getByRole('button',{name:'Testo',exact:true}).click();
          await page.getByLabel('Elenco da analizzare',{exact:true}).fill('Mario Rossi\nAnna Rossi');
          await page.getByRole('button',{name:'Analizza e crea bozza',exact:true}).click();
          await page.getByRole('heading',{name:'Abbiamo trovato 40 persone',exact:true}).waitFor();
          assert.equal(await page.locator('.rows .row-link').count(),40);
          assert.equal(await page.locator('app-mobile-directory-import fieldset, app-mobile-directory-import form').count(),0);
          await page.getByLabel('Da verificare',{exact:true}).uncheck();await page.getByLabel('Da verificare',{exact:true}).check();
          for(const width of [320,390,412]){await page.setViewportSize({width,height:844});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await verifyMobileDesign(page); await page.screenshot({path:path.join(output,`directory-list-${width}.png`)});}
          await page.locator('.rows .row-link').filter({hasText:'Anna Rossi'}).click();
          await page.getByRole('radio',{name:'Usa persona esistente',exact:true}).check();
          await page.getByRole('button',{name:'Usa proposta: Marco Verdi',exact:true}).click();
          for(const width of [320,390,412]){await page.setViewportSize({width,height:844});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await verifyMobileDesign(page); await page.screenshot({path:path.join(output,`directory-row-${width}.png`),fullPage:true});}
          await page.getByRole('button',{name:'Salva verifica',exact:true}).click();
          await page.locator('.rows .row-link').filter({hasText:'Mario Rossi'}).click();
          await page.getByRole('radio',{name:'Crea nuova persona',exact:true}).check();
          await page.getByLabel('Ho verificato che i contatti condivisi appartengano a persone distinte',{exact:true}).check();
          await page.getByRole('button',{name:'Salva verifica',exact:true}).click();
          await page.locator('.rows .row-link').filter({hasText:'Nuovo3 Censito'}).click();
          await page.getByRole('radio',{name:'Ignora riga',exact:true}).check();
          await page.getByRole('button',{name:'Salva verifica',exact:true}).click();
          await page.locator('.rows .couple').waitFor();
          assert.equal(await page.locator('.rows .couple').count(),1);
          await page.getByRole('button',{name:'Conferma coppia',exact:true}).click();
          await page.getByText('Coppia confermata nella bozza',{exact:true}).waitFor();
          for(const width of [320,390,412]){await page.setViewportSize({width,height:844});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await verifyMobileDesign(page); await page.screenshot({path:path.join(output,`directory-couple-${width}.png`),fullPage:true});}
          for(const name of ['Cristiano Giagnorio','Laura Perrotti']) {
            await page.locator('.rows .row-link').filter({hasText:name}).click();
            await page.getByRole('button',{name:'Salva verifica',exact:true}).waitFor();
            assert.equal(await page.getByRole('button',{name:'Salva verifica',exact:true}).isDisabled(),true);
            await page.locator('app-mobile-directory-import-row details p').filter({hasText:"Cognome suggerito dall'email, non verificato"}).waitFor();
            await page.getByLabel('Ho verificato o corretto i dati inferiti',{exact:true}).check();
            await page.getByRole('button',{name:'Salva verifica',exact:true}).click();
          }
          await page.getByLabel("Ho verificato l'elenco, i dati e le persone selezionate",{exact:true}).check();
          await page.getByRole('button',{name:'Conferma importazione',exact:true}).click();
          await page.getByRole('heading',{name:'Importazione completata',exact:true}).waitFor();assert.equal(directoryConfirmed,true);
          await page.getByRole('link',{name:'Torna alla rubrica',exact:true}).click();
          await page.locator('[data-section="Fratelli"] .member-row').first().waitFor();
          assert.ok(await page.locator('[data-section="Fratelli"] .member-row').count()>6,'Full directory is visible, not a preview');
          await page.getByRole('searchbox').fill('Mario 333123');assert.equal(await page.locator('[data-section="Fratelli"] .member-row').count(),1);
          assert.equal(await page.locator('.directory-account').count(),0,'Account status stays in member detail');
          await page.getByRole('button',{name:'Cancella ricerca',exact:true}).click();
          for(const [name,email,button] of [['Cristiano Giagnorio','cristianogiagnorio@gmail.com',"Invita nell'app"],['Nuovo6 Censito','nuovo@example.test','Aggiungi email e invita']]){
            await page.locator('[data-section="Fratelli"] .member-row').filter({hasText:name}).click();
            await page.getByRole('button',{name:button,exact:true}).click();
            await page.getByLabel("Email per l'invito",{exact:true}).fill(email);
            await page.getByRole('button',{name:'Crea invito',exact:true}).click();
            await page.getByRole('status').filter({hasText:'Email preparata, non inviata'}).waitFor();
            assert.ok((await page.getByLabel('Link invito',{exact:true}).inputValue()).includes('?inviteId='));
            if(email==='nuovo@example.test'){
              for(const [state,label] of [['FAILED','Invito creato, ma email non inviata'],['BLOCKED_BY_TEST_MODE','Invio email bloccato in ambiente TEST.'],['SENT','Invito inviato']]){
                emailDeliveryState=state;await page.getByRole('button',{name:'Reinvia email',exact:true}).click();
                await page.getByRole('status').filter({hasText:label}).waitFor();
                assert.equal(preparedInvites.length,2,'Retry never creates another invitation');
                for(const width of [320,390,412]){await page.setViewportSize({width,height:844});await verifyMobileDesign(page);await page.screenshot({path:path.join(output,`email-${state}-${width}.png`),fullPage:true});}
              }
              await context.grantPermissions(['clipboard-read','clipboard-write']);await page.getByRole('button',{name:'Copia link',exact:true}).click();await page.getByText('Link copiato.',{exact:true}).waitFor();
              await page.getByRole('link',{name:'Comunità',exact:true}).first().click();await page.locator('[data-section="Fratelli"] .member-row').filter({hasText:name}).click();
              await page.getByRole('status').filter({hasText:'Invito inviato'}).waitFor();
              await page.getByRole('button',{name:'Annulla invito',exact:true}).click();await page.getByText('Invito annullato.',{exact:true}).waitFor();
            }
            for(const width of [320,390,412]){await page.setViewportSize({width,height:844});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await verifyMobileDesign(page); await page.screenshot({path:path.join(output,`community-invite-${width}.png`),fullPage:true});}
            await page.getByRole('link',{name:'Comunità',exact:true}).first().click();
          }
          assert.equal(preparedInvites.length,2);await page.locator('[data-section="Fratelli"] .member-row').first().waitFor();
          await openCommunityMenu(page);await page.getByRole('link',{name:'Richieste accesso',exact:true}).click();
          const existing=page.locator('.access-approvals article').filter({hasText:'Emmanuel Baciarlini'});
          await existing.getByRole('combobox').click();await page.getByRole('option',{name:'Emmanuel Baciarini',exact:true}).click();
          await existing.getByRole('button',{name:'Approva accesso',exact:true}).click();await page.getByText('Appartenenza approvata.',{exact:true}).waitFor();
          const fresh=page.locator('.access-approvals article').filter({hasText:'Nuova Persona'});
          await fresh.getByRole('button',{name:'Crea nuova persona',exact:true}).click();await fresh.getByRole('button',{name:'Approva accesso',exact:true}).click();
          await page.getByText('Appartenenza approvata.',{exact:true}).waitFor();
          assert.ok(accessRequests.every(x=>x.status==='APPROVATA'));
          communityMembers.push({personId:15,firstName:'Emmanuel',lastName:'Baciarini',email:'emmanuel@example.test',role:'MEMBER',accountLinked:false});
          await page.locator('.mobile-bottom').getByRole('link',{name:'Comunità',exact:true}).click();

          for(const scenario of ['email','missing-capability','no-email','pending','linked','denied']){
            emmanuelCapability=scenario==='missing-capability'?undefined:scenario!=='denied';emmanuelEmail=scenario==='no-email'?'':'emmanuel@example.test';emmanuelPending=scenario==='pending'?'PENDING':null;emmanuelLinked=scenario==='linked';
            await page.locator('[data-section="Fratelli"] .member-row').filter({hasText:'Emmanuel Baciarini'}).click();
            await page.getByRole('heading',{name:'Emmanuel Baciarini',exact:true}).waitFor();
            if(['email','missing-capability'].includes(scenario))await page.getByRole('button',{name:"Invita nell'app",exact:true}).waitFor();
            else if(scenario==='no-email')await page.getByRole('button',{name:'Aggiungi email e invita',exact:true}).waitFor();
            else if(scenario==='pending'){await page.locator('app-community-member-invitation').getByText('Invito attivo',{exact:true}).waitFor();assert.equal(await page.getByRole('button',{name:"Invita nell'app",exact:true}).count(),0);}
            else {assert.equal(await page.locator('app-community-member-invitation').count(),0);if(scenario==='linked')await page.getByText('Account collegato',{exact:true}).waitFor();}
            await page.getByRole('link',{name:'Comunità',exact:true}).first().click();
          }
          console.log('PASS Emmanuel invite visibility: email, missing capability, missing email, pending, linked and explicit denial');
        } else assert.equal(await page.getByRole('link',{name:'Importa elenco',exact:true}).count(),0);
        assert.deepEqual(await page.locator('.mobile-bottom a span').allTextContents(),['Home','Calendario','Comunità','Profilo']);
        console.log(`PASS ${flow}: rubrica telefono, 40 righe, revisione, duplicati e conferma`);
      }
      if (flow === 'linked') {
        await page.locator('app-mobile-home h1').waitFor();
        await page.getByText('2 nei prossimi 7 giorni', {exact:true}).waitFor();
        await page.locator('.community-card').click();
        await page.getByRole('heading',{name:'La mia comunità',exact:true}).waitFor();
        await page.locator('.area-link').first().waitFor();
        assert.equal(await page.locator('.area-link').count(),5);
        assert.match(await page.locator('app-mobile-shell').evaluate(n=>getComputedStyle(n,'::before').backgroundImage),/virgen_maria.webp/);
        assert.deepEqual(await page.locator('.area-link strong').allTextContents(),['Fratelli','Calendario','Gruppi','Compleanni','Avvisi']);
        for(const width of [320,390,412]) { await page.setViewportSize({width,height:844});await verifyMobileDesign(page);assert.ok(await page.locator('.area-link').evaluateAll(nodes=>nodes.every(n=>n.getBoundingClientRect().height>=44)));await page.screenshot({path:path.join(output,`community-life-${width}.png`),fullPage:true}); }
        await page.locator('.area-link').filter({hasText:'Compleanni'}).click();
        await page.waitForURL(url => url.pathname === '/mobile/birthdays');
        for (const title of ['Oggi','Prossimi 7 giorni','Questo mese','Prossimamente'])
          await page.getByRole('heading',{name:title,exact:true}).waitFor();
        assert.equal(await page.locator('app-mobile-birthdays .member-row').count(), 5);
        assert.equal(await page.locator('app-mobile-birthdays table').count(), 0);
        assert.equal(new Set(await page.locator('app-mobile-birthdays .member-row').evaluateAll(nodes => nodes.map(n=>n.getAttribute('href')))).size,5);
        assert.ok(!(await page.locator('app-mobile-birthdays').textContent()).includes('1960'));
        for (const width of [320,390,393,412]) {
          await page.setViewportSize({width,height:844});
          assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth <= innerWidth));
          assert.deepEqual(await page.locator('.mobile-bottom a span').allTextContents(),['Home','Calendario','Comunità','Profilo']);
          await verifyMobileDesign(page); await page.screenshot({path:path.join(output,`birthdays-${width}.png`),fullPage:true});
        }
        await page.locator('app-mobile-birthdays .member-row').filter({hasText:'Emmanuel Baciarini'}).click();
        await page.getByRole('heading',{name:'Emmanuel Baciarini',exact:true}).waitFor();
        await page.getByText('Non ancora registrato',{exact:true}).waitFor();
        await page.getByText('10 agosto',{exact:true}).waitFor();
        assert.equal(await page.getByRole('link',{name:'Chiama',exact:true}).getAttribute('href'),'tel:+390212345678');
        assert.equal(await page.getByRole('link',{name:'WhatsApp',exact:true}).getAttribute('href'),'https://wa.me/390212345678');
        assert.equal(await page.getByRole('link',{name:'Email',exact:true}).getAttribute('href'),'mailto:emmanuel@example.test');
        await page.getByRole('link',{name:'Home',exact:true}).click();
        await page.locator('.community-card').click();await page.locator('.area-link').filter({hasText:'Compleanni'}).click();
        birthdayState = 'loading';
        await page.getByRole('button',{name:'Aggiorna compleanni'}).click();
        await page.getByRole('status',{name:'Caricamento compleanni'}).waitFor();
        await page.getByRole('heading',{name:'Oggi',exact:true}).waitFor();
        birthdayState = 'error';
        await page.getByRole('button',{name:'Aggiorna compleanni'}).click();
        await page.getByRole('heading',{name:'Compleanni non disponibili',exact:true}).waitFor();
        birthdayState = 'empty';
        await page.getByRole('button',{name:'Riprova',exact:true}).click();
        await page.getByRole('heading',{name:'Nessun compleanno disponibile',exact:true}).waitFor();
        await page.getByRole('link',{name:'Home',exact:true}).click();
        await page.locator('.macro-areas').waitFor();
        assert.equal(await page.locator('.home-overview a[href="/mobile/birthdays"]').count(),0,'No empty birthday summary');
        await page.getByRole('link',{name:'Profilo',exact:true}).click();
        await page.getByRole('link',{name:'Preferenze notifiche',exact:true}).click();
        await page.getByLabel('Ricevi notifiche sui compleanni',{exact:true}).waitFor();
        assert.equal(await page.locator('app-mobile-privacy input[type=checkbox]').count(),2);
        assert.equal(await page.getByLabel('URL foto personale (HTTPS)').count(),0);
        await page.getByLabel('Ricevi notifiche sui compleanni',{exact:true}).check();
        await page.getByRole('button',{name:'Salva preferenze',exact:true}).click();
        await page.getByText('Preferenze salvate.',{exact:true}).waitFor();
        assert.equal(preferences.showBirthday,false); assert.equal(preferences.showBirthDate,false); assert.equal(preferences.showEmail,true);
        await page.getByLabel('Ricevi notifiche sui compleanni',{exact:true}).uncheck();
        await page.getByRole('button',{name:'Salva preferenze',exact:true}).click();
        await page.getByText('Preferenze salvate.',{exact:true}).waitFor();
        assert.equal(preferences.receiveBirthdayNotifications,false);
        await verifyMobileDesign(page); await page.screenshot({path:path.join(output,'birthday-privacy.png'),fullPage:true});
        birthdayState = 'ready';
        await page.getByRole('link',{name:'Home',exact:true}).click();
        await page.getByText('2 nei prossimi 7 giorni',{exact:true}).waitFor();
        await page.locator('.community-card').click();await page.locator('.area-link').filter({hasText:'Avvisi'}).click();
        await page.waitForURL(url => url.pathname === '/mobile/avvisi');
        await page.locator('app-mobile-home h1').filter({hasText:'Avvisi'}).waitFor();
        assert.equal(preferences.receiveCommunityNotifications,false);
        await page.getByRole('link',{name:'Home',exact:true}).first().click();
        console.log('PASS birthdays: sezioni, scheda, riepilogo Home, privacy, loading/error/empty e viewport');
        assert.match(await page.locator('app-mobile-shell .brand').textContent(), /3ª Comunità/);
        assert.match(await page.locator('app-mobile-shell .brand').textContent(), /Parrocchia di test/);
        await page.getByRole('heading',{name:'Cosa riguarda me',exact:true}).waitFor();
        assert.equal(await page.locator('.macro-areas>a').count(),2);
        assert.equal(await page.locator('.app-grid,.app-tile,.home-photo').count(),0);
        assert.equal(await page.locator('.macro-areas img').count(),2);
        await page.waitForFunction(()=>Array.from(document.querySelectorAll('.macro-areas img')).every(img=>img.complete&&img.naturalWidth>0));
        assert.match(await page.locator('app-mobile-shell').evaluate(n=>getComputedStyle(n,'::before').backgroundImage),/Camino_Neocatecumenal_virgen_maria/);
        assert.equal(await page.getByText('La vita della comunità',{exact:true}).count(),0);
        assert.equal(await page.locator('.life-card').count(),0);
        assert.equal(await page.locator('.community-card').getAttribute('href'),'/mobile/community-life');
        await page.locator('.retreat-card').click();
        await page.getByRole('heading',{name:'Convivenze',exact:true}).waitFor();
        await page.locator('.area-link').first().waitFor();
        for(const width of [320,390,412]) { await page.setViewportSize({width,height:844});await verifyMobileDesign(page);await page.screenshot({path:path.join(output,`retreats-hub-${width}.png`),fullPage:true}); }
        assert.equal(await page.locator('.area-link').first().getAttribute('href'),'/mobile/convivenze');
        assert.equal(await page.locator('.area-link[href="/mobile/posti-convivenza"]').count(),0,'Places retain permission gating');
        await page.locator('.mobile-bottom').getByRole('link',{name:'Home',exact:true}).click();
        await page.locator('.mobile-bottom').getByRole('link',{name:'Profilo',exact:true}).click();
        const profileMenu=page.getByRole('navigation',{name:'Impostazioni personali',exact:true});
        assert.equal(await profileMenu.getByRole('link',{name:/Compleanni|Gruppi|Avvisi/}).count(),0);
        assert.equal(await page.locator('.mobile-bottom').getByText('Altro',{exact:true}).count(),0);
        await profileMenu.getByRole('link',{name:'Informazioni sull’app',exact:true}).click();
        await page.getByText(/Applicazione indipendente per le attività/).waitFor();
        await page.locator('.mobile-bottom').getByRole('link',{name:'Home',exact:true}).click();
        assert.equal(await page.locator('.mobile-bottom a').count(), 4);
        assert.equal(await page.locator('app-sidebar,.layout-container').count(), 0);
        assert.equal(await page.getByRole('link', { name: 'Posti di convivenza', exact: true }).count(), 0);
        for (const [width, height, name] of [[412,915,'pixel'],[390,844,'iphone'],[393,852,'island'],[320,568,'small']]) {
          await page.setViewportSize({width,height});
          assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
          assert.ok(await page.locator('.mobile-bottom a').evaluateAll(nodes => nodes.every(n => n.getBoundingClientRect().height >= 48)));
          await verifyMobileDesign(page); await page.screenshot({path:path.join(output,`home-${name}.png`),fullPage:true});
        }
        await page.evaluate(()=>document.body.style.fontSize='18px');
        await verifyMobileDesign(page);
        await page.screenshot({path:path.join(output,'home-scaled-text.png'),fullPage:true});
        await page.evaluate(()=>document.body.style.fontSize='');
        await page.locator('.community-card').click();
        await page.locator('.area-link').filter({hasText:'Fratelli'}).click();
        await page.waitForURL(url => url.pathname === '/mobile/community');
        await page.getByRole('heading',{name:'Responsabile',exact:true}).waitFor();
        await page.getByRole('heading',{name:'Fratelli',exact:true}).waitFor();
        assert.equal(await page.locator('.people-strip,.couples,app-community-overview,table').count(),0);
        assert.equal(await page.getByRole('heading',{name:'Presbitero',exact:true}).count(),0);
        assert.equal(await page.getByRole('heading',{name:'Corresponsabili',exact:true}).count(),0);
        const originalMembers=communityMembers.length;
        communityMembers.push({personId:90,firstName:'Giovanni',lastName:'Abate',role:'PRESBYTER'},{personId:91,firstName:'Paola',lastName:'Bianchi',role:'CO_RESPONSIBLE'},{personId:92,firstName:'Luigi',lastName:'Neri',role:'CO_RESPONSIBLE'},{...communityMembers[0]});
        await page.getByRole('button',{name:'Aggiorna membri',exact:true}).click();
        await page.getByRole('heading',{name:'Presbitero',exact:true}).waitFor();
        assert.deepEqual(await page.locator('.member-section h2').allTextContents(),['Presbitero','Responsabile','Corresponsabili','Fratelli']);
        assert.deepEqual(await page.locator('[data-section="Corresponsabili"] .member-copy strong').allTextContents(),['Paola Bianchi','Luigi Neri']);
        assert.equal(await page.locator('[data-section="Fratelli"] .member-row').count(),5);
        assert.equal(await page.locator('[data-section="Fratelli"] a[href="/mobile/community/member/12"]').count(),1);
        assert.equal(await page.getByLabel('Gestione comunità',{exact:true}).count(),0,'Ecclesial roles do not grant the viewer administrative permissions');
        for(const width of [320,390,412]){await page.setViewportSize({width,height:844});await verifyMobileDesign(page);await page.screenshot({path:path.join(output,`community-v5-roles-${width}.png`),fullPage:true});}
        communityMembers.splice(originalMembers);await page.getByRole('button',{name:'Aggiorna membri',exact:true}).click();
        await page.getByText('2 fratelli',{exact:true}).waitFor();
        await page.locator('[data-section="Fratelli"] .member-row').first().waitFor();
        assert.equal(await page.locator('[data-section="Fratelli"] .member-row').count(), 2);
        assert.match(await page.locator('.community-header').textContent(), /Parrocchia Martiri Canadesi/);
        await page.getByText('2 fratelli', { exact: true }).waitFor();
        assert.equal(await page.locator('app-mobile-community table, app-mobile-community app-member-editor').count(), 0);
        assert.equal(await page.locator('.member-list a[href^="tel:"],.member-list a[href^="mailto:"]').count(), 0);
        assert.ok(!(await page.locator('[data-section="Fratelli"] .member-list').textContent()).includes('shared@example.test'));
        assert.ok(!(await page.locator('[data-section="Fratelli"] .member-list').textContent()).includes('333 1234567'));
        assert.equal(await page.locator('app-mobile-community .stage,app-mobile-community .birthday').count(),0);
        assert.equal(await page.locator('app-mobile-community .stage,app-mobile-community .birthday').count(),0);
        assert.equal(await page.getByRole('link', { name: 'Richieste accesso' }).count(), 0);
        assert.equal(await page.getByRole('link', { name: 'Aggiungi fratello', exact: true }).count(), 0);
        assert.equal(await page.locator('.mobile-bottom a.active').textContent(), 'Comunità');
        await page.getByRole('searchbox', {name:'Cerca nella comunità'}).fill('rossi Anna');
        assert.equal(await page.locator('[data-section="Fratelli"] .member-row').count(), 1);
        assert.equal(await page.locator('[data-section="Fratelli"] .member-row').first().locator('.stage,img').count(), 0);
        assert.equal(await page.locator('[data-section="Fratelli"] .member-row').first().locator('.birthday').count(), 0);
        await page.getByRole('searchbox').fill('nessuno');
        await page.getByRole('heading', { name: 'Nessun risultato' }).waitFor();
        await page.getByRole('button', {name:'Cancella ricerca'}).click();
        await page.waitForFunction(() => document.querySelector('input[type="search"]')?.value === '');
        assert.equal(await page.getByRole('searchbox').inputValue(), '');
        for (const width of [320, 390, 412, 768]) {
          await page.setViewportSize({width,height:844});
          assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
          assert.ok(await page.locator('.member-copy').evaluateAll(nodes => nodes.every(n => n.scrollWidth <= n.clientWidth)));
          assert.deepEqual(await page.locator('.mobile-bottom a span').allTextContents(), ['Home','Calendario','Comunità','Profilo']);
          await verifyMobileDesign(page); await page.screenshot({path:path.join(output,`community-${width}.png`),fullPage:true});
        }
        await page.setViewportSize({width:390,height:844});
        await page.locator('[data-section="Fratelli"] .member-row').filter({hasText:'Marco Verdi'}).click();
        await page.getByRole('heading', {name:'Marco Verdi',exact:true}).waitFor();
        await page.getByText('3 maggio', {exact:true}).waitFor();
        assert.ok(!(await page.locator('app-mobile-community-member').textContent()).includes('1985'));
        assert.equal(await page.getByRole('link',{name:'Chiama',exact:true}).getAttribute('href'),'tel:+442079460018');
        assert.equal(await page.getByRole('link',{name:'WhatsApp',exact:true}).getAttribute('href'),'https://wa.me/442079460018');
        await page.getByRole('link', {name:'Anna Rossi',exact:true}).click();
        await page.waitForURL(url => url.pathname === '/mobile/community/member/12');
        await page.getByRole('heading', { name: 'Anna Rossi' }).waitFor();
        assert.equal(await page.getByRole('button', { name: 'Modifica scheda' }).count(), 0);
        await page.getByText('Account collegato', {exact:true}).waitFor();
        assert.equal(await page.getByLabel('Coniuge opzionale').count(), 0);
        assert.equal(await page.getByRole('link',{name:'Chiama',exact:true}).getAttribute('href'),'tel:+393331234567');
        assert.equal(await page.getByRole('link',{name:'WhatsApp',exact:true}).getAttribute('href'),'https://wa.me/393331234567');
        assert.ok(await page.locator('.contact-actions a').evaluateAll(nodes=>nodes.every(n=>n.getBoundingClientRect().height >= 48 && n.scrollWidth <= n.clientWidth)));
        assert.equal(await page.locator('app-mobile-community-member input[type=checkbox]').count(),0);
        assert.equal(await page.getByLabel('URL foto personale (HTTPS)').count(),0);
        await verifyMobileDesign(page); await page.screenshot({path:path.join(output,'community-detail.png'),fullPage:true});
        communityManager = true;
        await page.getByRole('link', { name: 'Comunità', exact: true }).first().click();

        await openCommunityMenu(page);await page.getByRole('link', {name:'Richieste accesso'}).waitFor();
        assert.equal(await page.getByRole('link', {name:'Richieste accesso'}).getAttribute('href'), '/mobile/approvazioni');
        assert.equal(approvalCalls,0,'Community directory does not fetch approval history');
        assert.equal(await page.locator('app-mobile-community table, app-mobile-community app-member-editor').count(), 0);
        await openCommunityMenu(page);await page.getByRole('link', { name: 'Aggiungi fratello', exact: true }).click();
        await page.waitForURL(url => url.pathname === '/mobile/community/add');
        await page.locator('app-member-editor').waitFor();
        assert.equal(await page.locator('app-mobile-community').count(), 0);
        assert.equal(await page.locator('app-member-editor').count(), 1);
        await page.getByLabel('Nome', { exact: true }).fill('Nuovo');
        await page.getByLabel('Cognome', { exact: true }).fill('Fratello');
        const roles = await page.getByLabel('Ruolo nella comunità').locator('option').allTextContents();
        assert.ok(roles.every(role => !role.includes('Catechista') && role !== 'Responsabile'));
        const birth = page.getByLabel('Data di nascita opzionale', {exact:true});
        assert.equal(await birth.getAttribute('type'), 'date'); assert.equal(await birth.inputValue(), '');
        assert.equal(await birth.getAttribute('lang'), 'it-IT');
        assert.match(await birth.getAttribute('max'), /^\d{4}-\d{2}-\d{2}$/);
        await birth.fill('2999-01-01');
        await page.getByRole('button', {name:'Salva fratello',exact:true}).click();
        await page.getByText('Inserisci una data di nascita valida, non futura.', {exact:true}).waitFor();
        assert.equal(censusCalls, 0);
        await birth.fill('1984-02-29');
        await page.waitForFunction(() => !document.querySelector('app-member-editor [role="alert"]'));
        try { await page.locator('#birth-summary').filter({hasText:'29/02/1984'}).waitFor({timeout:5000}); }
        catch (error) {
          console.log('Birth UI diagnostic:', await birth.inputValue(), await page.locator('#birth-summary').textContent());
          await verifyMobileDesign(page); await page.screenshot({path:path.join(output,'birth-error.png'),fullPage:true}); throw error;
        }
        await page.getByLabel('Coniuge opzionale').selectOption({label:'Marco Verdi'});
        assert.deepEqual(await page.getByLabel('Coniuge opzionale').locator('option').allTextContents(), ['Nessun collegamento','Anna Rossi','Marco Verdi']);
        await verifyMobileDesign(page); await page.screenshot({path:path.join(output,'community-add.png'),fullPage:true});
        await page.getByRole('button', { name: 'Salva fratello', exact: true }).click();
        await page.waitForURL(url => url.pathname === '/mobile/community');

        await page.locator('[data-section="Fratelli"] .member-row').filter({hasText:'Nuovo Fratello'}).click();
        await page.getByRole('heading', {name:'Nuovo Fratello',exact:true}).waitFor();
        await page.getByText('Non ancora registrato', {exact:true}).waitFor();
        await page.getByRole('button', {name:'Modifica scheda'}).click();
        await page.getByLabel('Coniuge opzionale').waitFor();
        assert.equal(await page.getByLabel('Coniuge opzionale').locator('option:checked').textContent(), 'Marco Verdi');
        assert.equal(await page.getByLabel('Data di nascita opzionale').count(), 0, 'Nascita privata non editabile da terzi');
        for (const width of [320,390,393,412]) {
          await page.setViewportSize({width,height:844});
          assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
          await verifyMobileDesign(page); await page.screenshot({path:path.join(output,`member-edit-${width}.png`),fullPage:true});
        }
        await page.getByRole('button', {name:'Salva fratello',exact:true}).click();
        await page.getByText('Scheda aggiornata.', {exact:true}).waitFor();
        await page.getByRole('button', {name:'Modifica scheda'}).click();
        await page.getByLabel('Coniuge opzionale').selectOption({label:'Nessun collegamento'});
        await page.getByRole('button', {name:'Salva fratello',exact:true}).click();
        await page.getByText('Scheda aggiornata.', {exact:true}).waitFor();
        assert.equal(censusCalls, 1); assert.equal(memberUpdates, 2); assert.equal(spouseId, null);
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
        await page.locator('[data-section="Fratelli"] .member-row').filter({hasText:'Nuovo Fratello'}).waitFor();
        await verifyMobileDesign(page); await page.screenshot({path:path.join(output,'community-created.png'),fullPage:true});
        communityState = 'single';
        await page.getByRole('button', { name: 'Aggiorna membri' }).click();
        await page.getByText('1 fratello', {exact:true}).waitFor();
        for (const width of [320,390,393,412]) {
          await page.setViewportSize({width,height:844});
          assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
          await openCommunityMenu(page);const add = page.getByRole('link', {name:'Aggiungi fratello',exact:true});
          assert.ok(await add.evaluate(n => n.getBoundingClientRect().height >= 48 && n.scrollWidth <= n.clientWidth));
          await verifyMobileDesign(page); await page.screenshot({path:path.join(output,`community-manager-${width}.png`),fullPage:true});
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
        const calls = await page.evaluate(() => window.__nativeCalls);
        assert.equal(calls.slice(calls.indexOf('EntraNativeAuth.start') + 1).includes('EntraNativeAuth.logout'), false);
      }
      assert.equal(await page.evaluate(() => Object.values(localStorage).some(value => value.includes('sdk-api-test-token'))), false);
      assert.deepEqual(errors, []);
      console.log(`PASS native ${flow}: SDK mock, bearer /api/me e routing`);
      await context.close();
    }
    if(!process.env.MOBILE_TEST_FLOW||process.env.MOBILE_TEST_FLOW==='deep-links'){
      const first='aaaaaaaa-1234-4321-8123-aaaaaaaaaaaa',next='bbbbbbbb-1234-4321-8123-bbbbbbbbbbbb';
      for(const platform of ['android','ios']){
        const context=await browser.newContext({viewport:{width:390,height:844}});
        await installNative(context,platform,false,`https://test.eventidicomunita.it/invite/${first}`);
        let linked=false,state='PENDING',reads=0,accepts=0;
        await context.route('**/api/**',async route=>{
          const api=new URL(route.request().url()).pathname;
          if(api==='/api/me'){await route.fulfill({json:{authenticated:true,linkedToCommunity:linked,status:linked?'LINKED':'UNLINKED',userId:1,personId:linked?12:null,communityId:linked?91:null,communityName:'3ª Comunità',permissions:[],role:'MEMBER'}});return;}
          if(api.includes('/api/onboarding/invitations/')){
            assert.equal(route.request().headers().authorization,'Bearer sdk-api-test-token');
            if(api.endsWith('/accept')){assert.equal(route.request().postDataJSON().privacyConsent,true);accepts++;linked=true;await route.fulfill({json:{authenticated:true,linkedToCommunity:true}});return;}
            reads++;if(state==='MISMATCH'){await route.fulfill({status:403,json:{message:'not for this account'}});return;}
            await route.fulfill({json:{status:state,communityName:'3ª Comunità',parishName:'Parrocchia test',firstName:'Invitato',lastName:'Test'}});return;
          }
          if(api.endsWith('/community')){await route.fulfill({json:{context:{communityName:'3ª Comunità',parishName:'Parrocchia test',role:'MEMBER'},members:[],canAddMember:false}});return;}
          await route.fulfill({json:[]});
        });
        const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
        await page.goto(base);await page.getByRole('button',{name:'Continua',exact:true}).waitFor();
        await page.locator('.welcome-invitation').getByText('Hai ricevuto un invito',{exact:false}).waitFor();
        assert.equal(await page.locator('app-mobile-welcome button').count(),1);
        assert.equal(await page.getByRole('button',{name:'Accedi',exact:true}).count(),0);
        assert.equal(reads,0,'No invitation metadata on dedicated welcome');
        for(const [width,height] of [[320,568],[390,844],[412,915]]){
          await page.setViewportSize({width,height});await page.locator('app-mobile-welcome').evaluate((n,ios)=>{n.style.setProperty('--mobile-safe-top',ios?'47px':'24px');n.style.setProperty('--mobile-safe-bottom',ios?'34px':'24px');},platform==='ios');
          assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
          assert.ok(await page.locator('.welcome-footer').evaluate((n,bottom)=>n.getBoundingClientRect().bottom<=innerHeight-bottom,platform==='ios'?34:24),'Invitation footer remains in safe area');
          await page.screenshot({path:path.join(output,`welcome-invitation-${platform}-${width}.png`),fullPage:true});
        }
        await page.getByRole('button',{name:'Continua',exact:true}).click();await page.locator('#native-email').waitFor();
        assert.equal(reads,0,'No Person metadata before authentication');assert.equal(await page.locator('#native-password').count(),0,'Invite selects existing OTP UI');
        await page.locator('#native-email').fill('invite-test@example.test');await page.locator('app-native-auth-panel button[type=submit]').click();
        await page.locator('#native-code').fill('000000');await page.locator('app-native-auth-panel button[type=submit]').click();
        await page.waitForURL(url=>url.pathname===`/invite/${first}`);await page.getByRole('button',{name:'Accetta invito',exact:true}).waitFor();
        assert.equal(await page.locator('app-mobile-home').count(),0,'No Home flash before acceptance');
        await page.getByLabel("Ho letto l'informativa privacy per l'accesso alla comunità",{exact:true}).check();await page.getByRole('button',{name:'Accetta invito',exact:true}).click();
        await page.waitForURL(url=>url.pathname==='/mobile/community');assert.equal(accepts,1);assert.equal(await page.evaluate(()=>sessionStorage.getItem('community.access-invite')),null);
        for(const [status,label] of [['EXPIRED','Invito scaduto'],['CANCELLED','Invito annullato'],['ACCEPTED','Invito già utilizzato'],['MISMATCH','Email non corrispondente. Accedi con l’email che ha ricevuto l’invito.']]){
          state=status;
          if(new URL(page.url()).pathname.startsWith('/invite/'))await page.getByRole('button',{name:'Continua senza invito',exact:true}).click();
          await page.evaluate(url=>window.__appUrlOpen({url}),`https://test.eventidicomunita.it/invite/${next}`);
          await page.getByText(status==='MISMATCH'?label:'Stato: '+label,{exact:true}).waitFor();assert.equal(await page.getByRole('button',{name:'Accetta invito',exact:true}).count(),0);
          await page.screenshot({path:path.join(output,`deep-link-${platform}-${status}.png`),fullPage:true});
        }
        const before=page.url();await page.evaluate(url=>window.__appUrlOpen({url}),`https://evil.example/invite/${next}`);assert.equal(page.url(),before);assert.deepEqual(errors,[]);
        console.log(`PASS deep links ${platform}: cold start, OTP, resume, accept, warm events, expired/cancelled/used/mismatch`);await context.close();
      }
      const web=await browser.newContext({viewport:{width:390,height:844}}),page=await web.newPage();let apiReads=0;
      await web.route('**/api/**',r=>{apiReads++;return r.fulfill({status:401,json:{}});});
      await page.goto(`${base}/invite/${first}`);await page.getByRole('heading',{name:'Invito a Eventi di Comunità',exact:true}).waitFor();
      await page.getByRole('button',{name:'Accedi a Eventi di Comunità',exact:true}).waitFor();assert.equal(apiReads,0);assert.equal(new URL(page.url()).pathname,`/invite/${first}`);
      for(const path of ['/.well-known/assetlinks.json','/.well-known/apple-app-site-association']){const response=await page.request.get(base+path);assert.equal(response.status(),200);assert.match(response.headers()['content-type'],/application\/json/);await response.json();}
      await page.screenshot({path:path.join(output,'deep-link-web-fallback.png'),fullPage:true});await web.close();console.log('PASS invite fallback web: public route, no Person metadata before login, association files JSON');
    }
  } finally {
    if (browser) await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
