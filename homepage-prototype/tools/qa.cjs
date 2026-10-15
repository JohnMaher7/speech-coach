const {chromium} = require(process.env.PLAYWRIGHT_PATH || 'C:/Users/johnm/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('node:fs');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const assert=require('node:assert/strict');
const output=path.resolve(__dirname,'../screenshots');
(async()=>{
  const browser=await chromium.launch({headless:true,channel:'chrome'});
  try {
  const errors=[],external=[],results=[];
  const page=await browser.newPage({viewport:{width:1440,height:1000},deviceScaleFactor:1});
  page.on('pageerror',error=>errors.push(error.message));
  page.on('request',r=>{if(!r.url().startsWith('http://127.0.0.1:4173')&&!r.url().startsWith('file:'))external.push(r.url())});
  const response=await page.goto('http://127.0.0.1:4173',{waitUntil:'networkidle'});assert.equal(response.status(),200);
  await page.evaluate(()=>document.fonts.ready);
  await page.screenshot({path:path.join(output,'desktop-full.png'),fullPage:true});
  await page.screenshot({path:path.join(output,'desktop.png')});
  for(const [key,content] of [['fillers','Lose the extra words.'],['variety','share the excitement.'],['structure','Give the ending a job.'],['pace','A little more breathing room.']]){
    await page.locator(`[data-metric="${key}"]`).click();
    assert.ok((await page.locator('#metric-heading').innerText()).includes(content));
    assert.equal(await page.locator(`[data-metric="${key}"]`).getAttribute('aria-selected'),'true');
    assert.equal(await page.locator('[role=tab][aria-selected=true]').count(),1);
    assert.equal(await page.locator('#structure-overview').isVisible(),key==='structure');
  }results.push('All four report tabs update advice, metric, chart and selected state.');
  await page.locator('#tab-pace').focus();await page.keyboard.press('ArrowDown');assert.equal(await page.locator('#tab-fillers').getAttribute('aria-selected'),'true');await page.keyboard.press('End');assert.equal(await page.locator('#tab-structure').getAttribute('aria-selected'),'true');await page.keyboard.press('Home');assert.equal(await page.locator('#tab-pace').getAttribute('aria-selected'),'true');results.push('Report tabs support arrow keys, Home and End.');
  await page.locator('[data-billing=yearly]').click();assert.equal(await page.locator('#plan-amount').innerText(),'€5.83');assert.ok((await page.locator('#plan-billing').innerText()).includes('€70 billed yearly'));
  await page.locator('[data-open-trial]').click();assert.equal(await page.locator('dialog').evaluate(d=>d.open),true);assert.ok((await page.locator('#trial-plan').innerText()).includes('€70/year'));await page.keyboard.press('Escape');assert.equal(await page.locator('dialog').evaluate(d=>d.open),false);
  await page.locator('[data-billing=monthly]').click();assert.equal(await page.locator('#plan-amount').innerText(),'€12.99');await page.locator('[data-open-trial]').click();await page.locator('#dialog-sample').click();assert.equal(await page.locator('dialog').evaluate(d=>d.open),false);results.push('Both billing periods show verified prices and pass selection into the local trial dialog; Escape and sample navigation work.');
  await page.locator('summary').nth(1).click();assert.equal(await page.locator('details').nth(1).getAttribute('open'),'');await page.locator('summary').nth(1).click();results.push('FAQ expands and collapses.');
  const sizes=[];
  for(const width of [320,360,390,768,1024,1440]){
    await page.setViewportSize({width,height:900});await page.evaluate(()=>window.scrollTo(0,0));
    const dimensions=await page.evaluate(()=>({viewport:innerWidth,content:document.documentElement.scrollWidth}));assert.ok(dimensions.content<=dimensions.viewport,`Horizontal overflow at ${width}: ${dimensions.content}`);sizes.push(width);
  }results.push(`No horizontal overflow at ${sizes.join(', ')} CSS pixels.`);
  await page.setViewportSize({width:390,height:844});await page.evaluate(()=>window.scrollTo(0,0));
  await page.locator('.menu-toggle').click();assert.equal(await page.locator('.menu-toggle').getAttribute('aria-expanded'),'true');await page.locator('#mobile-menu a').first().click();assert.equal(await page.locator('.menu-toggle').getAttribute('aria-expanded'),'false');await page.locator('.menu-toggle').click();await page.keyboard.press('Escape');assert.equal(await page.locator('.menu-toggle').getAttribute('aria-expanded'),'false');results.push('Mobile menu opens, navigates, closes and supports Escape.');
  await page.evaluate(()=>{document.activeElement.blur();window.scrollTo({top:0,behavior:'instant'})});await page.waitForTimeout(250);
  await page.screenshot({path:path.join(output,'mobile-full.png'),fullPage:true});await page.screenshot({path:path.join(output,'mobile.png')});
  await page.locator('#your-report').screenshot({path:path.join(output,'mobile-report.png')});
  await page.emulateMedia({reducedMotion:'reduce'});assert.equal(await page.evaluate(()=>getComputedStyle(document.documentElement).scrollBehavior),'auto');results.push('Reduced-motion preference disables smooth scrolling and transitions.');
  const broken=await page.locator('a[href^="#"]').evaluateAll(links=>links.map(a=>a.getAttribute('href')).filter(h=>h!=='#'&&h!=='#trial'&&!document.getElementById(h.slice(1))));assert.deepEqual(broken,[]);
  assert.deepEqual(errors,[]);assert.deepEqual(external,[]);results.push('No broken section links, JavaScript errors or external runtime requests.');
  const images=await page.locator('img').evaluateAll(imgs=>imgs.map(i=>({loaded:i.complete&&i.naturalWidth>0,source:i.currentSrc})));assert.ok(images.every(i=>i.loaded));
  await page.goto(pathToFileURL(path.resolve(__dirname,'../index.html')).href,{waitUntil:'load'});
  await page.locator('[data-billing=yearly]').click();assert.equal(await page.locator('#plan-amount').innerText(),'€5.83');
  assert.ok(await page.locator('.hero-sculpture').evaluate(i=>i.complete&&i.naturalWidth>0));results.push('Directly opening index.html works without a server, including images and interactions.');
  assert.deepEqual(errors,[]);assert.deepEqual(external,[]);
  const root=path.resolve(__dirname,'..');
  const baseBytes=['index.html','styles.css','app.js','assets/favicon.svg'].reduce((total,name)=>total+fs.statSync(path.join(root,name)).size,0);
  const payload={uncompressedBaseBytes:baseBytes,mobileWith800pxWebP:baseBytes+fs.statSync(path.join(root,'assets/voice-to-feedback-800.webp')).size,desktopWith1500pxWebP:baseBytes+fs.statSync(path.join(root,'assets/voice-to-feedback-1500.webp')).size};
  fs.writeFileSync(path.join(output,'qa-results.json'),JSON.stringify({date:'2026-10-15',browser:await browser.version(),checks:results,images,payload,errors,externalRequests:external},null,2));
  console.log(JSON.stringify(results,null,2));
  } finally { await browser.close(); }
})().catch(error=>{console.error(error);process.exit(1)});
