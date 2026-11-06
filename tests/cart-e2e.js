// اختبار السلة: إضافة منتجات ← كميات ← פרטים ← שליחה ← קבלה + ההודעה للواتساب + نسخة بلوحة المدير
// يُشغَّل عبر tests/run-e2e.sh (سيرفر PHP على 127.0.0.1:8099، المدير معمول له setup من e2e.js)
const { chromium } = require('playwright');
const B = 'http://127.0.0.1:8099/', OUT = process.argv[2];
const assert = (c, m) => { if (!c) { console.error('ASSERT FAILED:', m); process.exitCode = 1; } else console.log('✓', m); };

(async () => {
  const b = await chromium.launch(); const errs = [];
  for (const [w, h, n] of [[1366, 900, 'desk'], [390, 844, 'mob']]) {
    const ctx = await b.newContext({ viewport: { width: w, height: h } });
    await ctx.addInitScript(() => { window.__opened = []; window.open = (u) => { window.__opened.push(u); return {}; }; });
    const p = await ctx.newPage(); p.on('pageerror', e => errs.push(n + ': ' + e.message));
    await p.goto(B); await p.waitForTimeout(500);

    // add: bags "דליה" twice, burger box once
    await p.click('[data-add="paper-bags-twisted-handle"][data-vi="1"]');
    await p.click('[data-add="paper-bags-twisted-handle"][data-vi="1"]');
    await p.click('[data-add="burger-box-double"][data-vi="0"]');
    assert(await p.textContent('#cartBadge') === '2', n + ' badge shows 2 lines');

    await p.click('#cartBtn'); await p.waitForTimeout(300);
    await p.fill('.ci >> nth=0 >> input', '500'); await p.press('.ci >> nth=0 >> input', 'Tab');
    await p.click('.ci >> nth=1 >> [data-q="+"]');
    await p.waitForTimeout(200);
    const sum = await p.textContent('#cartSum');
    assert(sum.trim() === '₪226.30', n + ' total 500×0.45 + 2×0.65 = ₪226.30 (got ' + sum + ')');
    await p.screenshot({ path: OUT + '/cart-' + n + '.png' });

    await p.click('#cartNext');
    await p.fill('#cartForm [name=name]', 'סמיר טסט');
    await p.fill('#cartForm [name=phone]', '052-7654321');
    await p.fill('#cartForm [name=business]', 'פלאפל סמיר');
    await p.check('#cartForm [name=delivery][value=delivery]');
    await p.fill('#cartForm [name=city]', 'ברטעה');
    await p.click('#cartForm [type=submit]');
    assert(await p.isVisible('#cartForm'), n + ' blocks submit without address for delivery');
    await p.fill('#cartForm [name=address]', 'רחוב הראשי 10');
    await p.fill('#cartForm [name=notes]', 'להגיע אחרי 16:00');
    await p.screenshot({ path: OUT + '/cartform-' + n + '.png' });
    await p.click('#cartForm [type=submit]');
    await p.waitForSelector('#cartDone:not([hidden])');
    const url = (await p.evaluate(() => window.__opened))[0] || '';
    const text = decodeURIComponent(url.split('?text=')[1] || '');
    assert(url.startsWith('https://wa.me/972545080288?text='), n + ' opens WhatsApp to the orders number');
    for (const s of ['מספר הזמנה: HL-', 'סמיר טסט', '052-7654321', 'פלאפל סמיר', 'ברטעה', 'רחוב הראשי 10', 'משלוח', 'דליה', 'כמות: 500 × ₪0.45 = ₪225.00', 'כמות: 2 × ₪0.65 = ₪1.30', 'סה״כ משוער: ₪226.30', 'להגיע אחרי 16:00'])
      assert(text.includes(s), n + ' receipt text contains "' + s + '"');
    assert(await p.textContent('#cartBadge').then(t => t) && await p.isHidden('#cartBadge'), n + ' cart emptied after order');
    await p.screenshot({ path: OUT + '/receipt-' + n + '.png', fullPage: false });
    await ctx.close();
  }

  // admin got a copy
  const a = await (await b.newContext()).newPage();
  await a.goto(B + 'admin/'); await a.fill('[name=password]', 'secret123'); await a.click('#authBtn');
  await a.waitForSelector('.kpi');
  await a.click('.side__nav [data-view=inbox]'); await a.waitForTimeout(500);
  const rows = await a.$$eval('#convs .crow', r => r.map(x => x.textContent));
  assert(rows.some(t => t.includes('סמיר טסט') && t.includes('הזמנה מהסל')), 'order copy appears in admin inbox');
  console.log('errors', errs); if (errs.length) process.exitCode = 1;
  await b.close();
})().catch(e => { console.error(e); process.exit(1); });
