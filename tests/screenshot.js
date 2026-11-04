// الاستخدام: node tests/screenshot.js <مسار مجلد الموقع> <مجلد الصور>
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const url = 'file://' + process.argv[2] + '/index.html';
  const out = process.argv[3];
  const p = await b.newPage({ viewport: { width: 1366, height: 900 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => m.type()==='error' && errs.push(m.text()));
  await p.goto(url); await p.waitForTimeout(1200);
  await p.screenshot({ path: out + '/desk.png', fullPage: true });
  await p.click('.cat >> nth=3'); await p.waitForTimeout(400);
  await p.screenshot({ path: out + '/modal.png' });
  await p.keyboard.press('Escape');
  await p.click('#modalForm').catch(()=>{});
  const m = await b.newPage({ viewport: { width: 390, height: 844 } });
  await m.goto(url); await m.waitForTimeout(1000);
  await m.screenshot({ path: out + '/mob.png', fullPage: true });
  const sw = await m.evaluate(() => document.documentElement.scrollWidth);
  console.log('mobile scrollWidth', sw, 'errors', errs);
  await b.close();
})();
