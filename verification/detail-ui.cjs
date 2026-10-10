const {chromium}=require('C:/Users/jilzu/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict');
const path=require('node:path');
const base=process.env.TEST_URL||'http://localhost:8766/';
const shot=n=>path.join(__dirname,n+'.png');
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 const context=await browser.newContext({viewport:{width:390,height:780},isMobile:true});
 const p=await context.newPage(); const errors=[];
 p.on('pageerror',e=>errors.push(e.message));
 await p.goto(base);
 await p.locator('#start').click();
 await p.locator('#name').fill('<img src=x onerror=alert(1)>');
 await p.locator('#birth').fill('1990-05-15');
 await p.locator('#time').fill('14:30');
 await p.locator('#profile-form button').click();
 await p.locator('#mbti').selectOption('INFJ');await p.locator('#gender').selectOption('남');
 await p.locator('#profile-form button').click();
 const annual=await p.evaluate(async()=>{const {currentAnnualPillar}=await import('./app.js');return ['2026-01-15T12:00:00Z','2026-02-15T12:00:00Z'].map(date=>{const a=currentAnnualPillar(new Date(date));return a.stemKo+a.branchKo;});});
 assert.deepEqual(annual,['을사','병오'],'Annual context changes at ipchun, not Jan 1 or fixed July');
 const docs=[];
 for(let i=0;i<10;i++){
  await p.locator(`[data-tab="${i}"]`).click();
  await p.locator('#read-more').click();
  await p.locator('#reading-dialog').waitFor({state:'visible'});
  const text=await p.locator('#reading-content').innerText();
  assert(text.length>600,`Detailed tab ${i} is too thin (${text.length})`);
  assert(await p.locator('.reader-section').count()>=4);
  assert.equal(await p.locator('#reading-dialog img').count(),0,'User text must be escaped');
  assert(!/undefined|\[object Object\]|NaN/.test(text));
  const scroller=p.locator('#reading-content');
  await scroller.evaluate(el=>el.scrollTop=el.scrollHeight);
  const scroll=await scroller.evaluate(el=>({height:el.scrollHeight,client:el.clientHeight,top:el.scrollTop}));
  assert(scroll.top>0,'Long reading can scroll');
  const close=await p.locator('#close-reading').boundingBox();
  assert(close.y>=0&&close.y+close.height<=780,'Close stays accessible');
  if(i===0)await p.screenshot({path:shot('detail-bottom-390')});
  await p.keyboard.press('Escape');
  assert(await p.locator('#reading-dialog').isHidden());
  assert(await p.locator('#read-more').evaluate(el=>el===document.activeElement),'Return focus to reading button');
  docs.push({tab:i,characters:text.length,sections:await p.locator('.reader-section').count()});
 }
 const fit=[];
 for(const [width,height] of [[320,568],[360,640],[390,780],[412,915]]){
  await p.setViewportSize({width,height});
  for(let i=0;i<10;i++){
   await p.locator(`[data-tab="${i}"]`).click();
   const box=await p.locator('#read-more').boundingBox();
   assert(box.y>=0&&box.y+box.height<=height,`Read button clipped at ${width}, tab${i}`);
   const dims=await p.evaluate(()=>({h:document.documentElement.scrollHeight,w:document.documentElement.scrollWidth}));
   assert(dims.h<=height+1&&dims.w<=width,`Main overflow at ${width}, tab${i}: ${JSON.stringify(dims)}`);
  }
  await p.locator('[data-tab="0"]').click();
  await p.screenshot({path:shot('detail-preview-'+width)});
  await p.locator('#read-more').click();
  assert.equal(await p.locator('#reading-content').evaluate(el=>el.scrollTop),0);
  await p.screenshot({path:shot('detail-reader-'+width)});
  await p.locator('#reading-nav [data-section]').last().click();
  assert(await p.locator('#reading-content').evaluate(el=>el.scrollTop)>0);
  await p.locator('#close-reading').click();
  fit.push([width,height]);
 }
 await p.locator('#home').click();await p.locator('#pair').click();
 await p.locator('[data-pair-profile="0"]').click();await p.locator('#pair-new').click();
 await p.locator('#name').fill('상대');await p.locator('#birth').fill('1992-11-03');
 await p.locator('#profile-form button').click();await p.locator('#profile-form button').click();await p.locator('#pair-relation').selectOption('동료');await p.locator('#pair-open').click();
 for(let i=0;i<3;i++){
  await p.locator(`[data-tab="${i}"]`).click();await p.locator('#read-more').click();
  const text=await p.locator('#reading-content').innerText();assert(text.length>600);assert(text.includes('동료'));
  await p.locator('#close-reading').click();
 }
 await p.evaluate(()=>navigator.serviceWorker.ready);await p.reload();await p.locator('.mission').waitFor();
 await context.setOffline(true);await p.reload();await p.locator('[data-tab="0"]').click();await p.locator('#read-more').click();
 assert((await p.locator('#reading-content').innerText()).length>600);await p.locator('#close-reading').click();
 await context.setOffline(false);assert.deepEqual(errors,[]);
 console.log(JSON.stringify({detailedPersonal:docs,fit,pairDocuments:3,escapeAndFocus:true,offlineDetail:true,errors},null,2));
 await browser.close();
})().catch(e=>{console.error(e);process.exitCode=1});
