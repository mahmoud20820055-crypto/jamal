// فحص الموقع الحي من متصفح حقيقي (يُشغَّل عبر GitHub Actions: Diagnose live site)
// قراءة فقط: يفتح الصفحات ويسجّل الأخطاء وردود الـ API. لا يسجّل دخول ولا ينشئ كلمة سر.
const { chromium } = require('playwright');
const BASE = (process.env.SITE_URL || 'http://hakol-lehakol.kesug.com').replace(/\/$/, '');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const log = (...a) => console.log(...a);

  page.on('console', m => log(`[console.${m.type()}]`, m.text()));
  page.on('pageerror', e => log('[pageerror]', e.message));
  page.on('requestfailed', r => log('[requestfailed]', r.url(), r.failure() && r.failure().errorText));
  page.on('response', async r => {
    const u = r.url();
    if (/\/api\/|\.js(\?|$)/.test(u)) {
      let body = '';
      try { if (/\/api\//.test(u)) body = (await r.text()).replace(/\s+/g, ' ').slice(0, 400); } catch (e) { body = '(no body)'; }
      log('[response]', r.status(), r.request().method(), u, body);
    }
  });

  for (const path of ['/api/health.php', '/', '/admin/']) {
    log('\n==== OPEN', BASE + path);
    try {
      const res = await page.goto(BASE + path, { waitUntil: 'load', timeout: 60000 });
      log('status', res && res.status(), 'final url', page.url());
      await page.waitForTimeout(path === '/admin/' ? 25000 : 4000);
      if (path === '/api/health.php') log('body', (await page.textContent('body')).replace(/\s+/g, ' ').slice(0, 800));
      else if (path === '/') log('home', JSON.stringify(await page.evaluate(() => ({ HLChat: !!window.HLChat, products: (window.PRODUCTS || []).length, Motion: !!window.Motion }))));
      else {
        const st = await page.evaluate(() => ({
          title: document.title,
          boot: document.getElementById('boot') && { hidden: document.getElementById('boot').hidden, text: document.getElementById('boot').textContent },
          authHidden: document.getElementById('auth') && document.getElementById('auth').hidden,
          appHidden: document.getElementById('app') && document.getElementById('app').hidden,
          authErr: document.getElementById('authErr') && document.getElementById('authErr').textContent,
          authTitle: document.getElementById('authTitle') && document.getElementById('authTitle').textContent,
          scripts: [...document.scripts].map(s => s.src || ('inline:' + s.textContent.slice(0, 80))),
          htmlStart: document.documentElement.outerHTML.slice(0, 600)
        }));
        log('state', JSON.stringify(st, null, 2));
        await page.screenshot({ path: 'diagnose-admin.png', fullPage: true });
        // read-only API probes from inside the page (same cookies as a real visitor)
        const probe = await page.evaluate(async () => {
          const call = async (url, body) => { try { const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }); return r.status + ' ' + (await r.text()).slice(0, 200); } catch (e) { return 'ERR ' + e.message; } };
          return { adminState: await call('../api/admin.php', { action: 'state' }), visitorList: await call('../api/visitor.php', { action: 'list', tokens: [] }) };
        });
        log('probe', JSON.stringify(probe, null, 2));
      }
    } catch (e) { log('ERROR', e.message); }
  }
  await browser.close();
})();
