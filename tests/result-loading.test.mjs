// Browser regression: the actual vehicle image must decode before reveal and animation.
import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {questions,scoreAnswers} from '../lib/quiz.ts';

const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe'});
const base=process.env.QUIZ_PREVIEW_URL||'http://127.0.0.1:5174/';
const result={id:crypto.randomUUID(),createdAt:Date.now(),result:scoreAnswers(questions.map(q=>q.key?.includes('V')?q.key.indexOf('V'):0))};
const car=readFileSync('public/cars/001.png');
async function fixture(){
 const context=await browser.newContext({viewport:{width:390,height:844}});
 await context.route('**/functions/v1/quiz-api/**',route=>route.fulfill({status:route.request().url().includes('/results/')?200:401,contentType:'application/json',body:JSON.stringify(route.request().url().includes('/results/')?result:{error:'no session'})}));
 return context;
}
try{
 const context=await fixture();
 await context.addInitScript(()=>{
  window.vehicleDecoded=false;window.vehicleAnimations=[];
  const gate=new Promise(resolve=>{window.releaseVehicleDecode=resolve;});
  const original=HTMLImageElement.prototype.decode;
  HTMLImageElement.prototype.decode=function(){
   const decoded=original.call(this);
   if(!this.classList.contains('vehicle-photo'))return decoded;
   return decoded.then(async()=>{window.vehicleDecodeStarted=true;await gate;window.vehicleDecoded=true;});
  };
  document.addEventListener('animationstart',event=>{
   if(event.animationName==='drive-in')window.vehicleAnimations.push({decoded:window.vehicleDecoded,complete:event.target.complete,width:event.target.naturalWidth});
  });
 });
 let releaseImage;const imageGate=new Promise(resolve=>{releaseImage=resolve;});
 await context.route('**/cars/001.png',async route=>{await imageGate;await route.fulfill({contentType:'image/png',body:car});});
 const page=await context.newPage();await page.goto(base+'#/r/'+result.id,{waitUntil:'domcontentloaded'});
 await page.locator('.vehicle-photo').waitFor({state:'attached'});
 assert(await page.locator('.loading-state').isVisible());assert(!await page.locator('.result-card').isVisible());
 assert.equal(await page.locator('.vehicle-entrance').count(),0);
 releaseImage();await page.waitForFunction(()=>window.vehicleDecodeStarted===true);
 assert(!await page.locator('.result-card').isVisible(),'Network completion alone must not reveal the card');
 assert.equal(await page.locator('.vehicle-entrance').count(),0);
 await page.evaluate(()=>window.releaseVehicleDecode());await page.locator('.result-card').waitFor();
 await page.waitForFunction(()=>window.vehicleAnimations.length===1);
 assert.deepEqual(await page.evaluate(()=>window.vehicleAnimations),[{decoded:true,complete:true,width:960}]);
 assert(!await page.locator('.loading-state').count());
 await page.waitForTimeout(1400);assert.equal(await page.evaluate(()=>window.vehicleAnimations.length),1);
 await context.close();

 const failureContext=await fixture();let fail=true;
 await failureContext.route('**/cars/001.png',route=>fail?route.abort('failed'):route.fulfill({contentType:'image/png',body:car}));
 const retryPage=await failureContext.newPage();await retryPage.goto(base+'#/r/'+result.id);
 await retryPage.getByRole('alert').filter({hasText:'车图暂时没能加载'}).waitFor();assert(!await retryPage.locator('.result-card').isVisible());
 fail=false;await retryPage.getByRole('button',{name:'重新加载',exact:true}).click();await retryPage.locator('.result-card').waitFor();
 assert.equal(await retryPage.locator('.vehicle-photo').evaluate(img=>img.complete&&img.naturalWidth===960),true);
 await failureContext.close();

 const navigationContext=await fixture();let releaseLate;const lateGate=new Promise(resolve=>{releaseLate=resolve;});
 await navigationContext.route('**/cars/001.png',async route=>{await lateGate;await route.fulfill({contentType:'image/png',body:car}).catch(()=>{});});
 const navigationPage=await navigationContext.newPage();await navigationPage.goto(base+'#/r/'+result.id,{waitUntil:'domcontentloaded'});
 await navigationPage.locator('.vehicle-photo').waitFor({state:'attached'});await navigationPage.getByRole('link',{name:'返回测评首页',exact:true}).click();await navigationPage.getByLabel('先认识一下，怎么称呼你？').waitFor();
 releaseLate();await navigationPage.waitForTimeout(200);assert.equal(await navigationPage.locator('.result-card').count(),0);await navigationContext.close();
 console.log(JSON.stringify({hiddenDuringDownload:true,hiddenUntilDecoded:true,animationStartsAfterDecode:true,animationPlaysOnce:true,imageFailureRetry:true,lateLoadCannotRestoreOldPage:true}));
}finally{await browser.close();}
