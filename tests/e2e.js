// يُشغَّل عبر tests/run-e2e.sh (يحتاج سيرفر PHP على 127.0.0.1:8099 و setup_key = test-key-123)
const { chromium } = require('playwright');
const B='http://127.0.0.1:8099/', OUT=process.argv[2];
(async () => {
  const b = await chromium.launch(); const errs=[];
  const vctx = await b.newContext({ viewport:{width:1366,height:900} });
  const v = await vctx.newPage(); v.on('pageerror',e=>errs.push('V '+e.message));
  await v.goto(B); await v.fill('#contactForm [name=name]','דני כהן'); await v.fill('#contactForm [name=phone]','050-1234567');
  await v.fill('#contactForm [name=business]','מינימרקט דני'); await v.selectOption('#catSelect','מדפים לעסק');
  await v.fill('#contactForm [name=message]','שלום, אני צריך 6 מדפי מתכת לחנות. כמה זה עולה?');
  await v.click('#contactForm [type=submit]'); await v.waitForSelector('#chat:not([hidden]) .msg--auto');
  await v.waitForTimeout(500); await v.screenshot({path:OUT+'/e1-visitor-autoreply.png'});
  console.log('status:', await v.textContent('#formStatus'));
  // admin
  const a = await (await b.newContext({ viewport:{width:1366,height:860} })).newPage(); a.on('pageerror',e=>errs.push('A '+e.message));
  await a.goto(B+'admin/'); await a.waitForSelector('#auth:not([hidden])');
  await a.fill('[name=setup_key]','test-key-123'); await a.fill('[name=password]','secret123'); await a.fill('[name=password2]','secret123');
  await a.click('#authBtn'); await a.waitForSelector('#app:not([hidden]) .kpi'); await a.waitForTimeout(600);
  await a.screenshot({path:OUT+'/e2-admin-dash.png'});
  await a.click('.side__nav [data-view=inbox]'); await a.click('#convs .crow >> nth=0'); await a.waitForSelector('#cMsgs .msg');
  await a.click('#quick [data-q="1"]'); await a.click('#cSend [type=submit]'); await a.waitForSelector('#cMsgs .msg >> nth=2');
  await a.waitForTimeout(400); await a.screenshot({path:OUT+'/e3-admin-inbox.png'});
  // visitor gets reply
  await v.waitForSelector('#chatMsgs .msg >> nth=2', {timeout:10000}); await v.screenshot({path:OUT+'/e4-visitor-reply.png'});
  await v.goto(B+'my.html'); await v.waitForSelector('#myMsgs .msg >> nth=2'); await v.waitForTimeout(300);
  await v.screenshot({path:OUT+'/e5-my.png'});
  await v.fill('#mySend textarea','מעולה, אגיע מחר בבוקר'); await v.press('#mySend textarea','Enter'); await v.waitForSelector('#myMsgs .msg >> nth=3');
  await a.waitForSelector('#cMsgs .msg >> nth=3',{timeout:12000}); console.log('admin got visitor followup');
  await a.click('[data-view=settings]'); await a.waitForTimeout(600); await a.screenshot({path:OUT+'/e6-settings.png'});
  // mobile
  const m = await (await b.newContext({ viewport:{width:390,height:844}, isMobile:true })).newPage();
  await m.goto(B+'admin/'); await m.fill('[name=password]','secret123'); await m.click('#authBtn'); await m.waitForSelector('.kpi'); await m.waitForTimeout(500);
  await m.screenshot({path:OUT+'/e7-admin-mobile.png'});
  console.log('mobile sw', await m.evaluate(()=>document.documentElement.scrollWidth));
  await m.click('[data-view=inbox]'); await m.click('#convs .crow >> nth=0'); await m.waitForSelector('#cMsgs .msg'); await m.waitForTimeout(300);
  await m.screenshot({path:OUT+'/e8-admin-mobile-thread.png'});
  const mv = await (await b.newContext({ viewport:{width:390,height:844}, isMobile:true })).newPage();
  await mv.goto(B); await mv.click('#chatFab'); await mv.waitForTimeout(300); await mv.screenshot({path:OUT+'/e9-chat-mobile.png'});
  console.log('errors', errs); await b.close();
})().catch(e=>{console.error(e); process.exit(1)});
