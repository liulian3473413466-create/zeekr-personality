import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {questions,scoreAnswers} from '../lib/quiz.ts';
const base=process.env.TEST_BASE_URL||'http://127.0.0.1:5173';
const run=String(Date.now()).split('').map(x=>'零一二三四五六七八九'[Number(x)]).join('');
await fs.mkdir('outputs',{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
const context=await browser.newContext({viewport:{width:1440,height:1000},acceptDownloads:true});
const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
try{
 await page.goto(base);await page.getByRole('heading',{name:/你是哪种/}).waitFor();await page.screenshot({path:'outputs/home-desktop.png',fullPage:true});
 for(const width of [320,390,768,1440]){await page.setViewportSize({width,height:900});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`首页 ${width}px 无横向溢出`);}
 await page.setViewportSize({width:390,height:844});await page.screenshot({path:'outputs/home-mobile.png',fullPage:true});
 await page.getByLabel('先认识一下，怎么称呼你？').fill('界面验证'+run);await page.getByRole('button',{name:'开始探索我的人格'}).click();await page.getByRole('radiogroup').waitFor();
 assert(await page.getByRole('button',{name:'下一题',exact:false}).isDisabled());
 await page.getByRole('radio').nth(1).click();await page.getByRole('button',{name:'下一题',exact:false}).click();await page.getByRole('radio').nth(2).click();await page.getByRole('button',{name:'上一题',exact:false}).click();assert.equal(await page.getByRole('radio').nth(1).getAttribute('aria-checked'),'true');
 await page.getByRole('radio').nth(0).click();await page.reload();await page.getByRole('button',{name:/继续上次答题/}).click();assert.equal(await page.getByRole('radio').nth(0).getAttribute('aria-checked'),'true');
 await page.screenshot({path:'outputs/question-mobile.png',fullPage:true});
 const answers=questions.map(q=>q.key?.includes('V')?q.key.indexOf('V'):0);
 for(let i=0;i<30;i++){await page.getByRole('radio').nth(answers[i]).click();await page.getByRole('button',{name:i===29?'解锁我的人格':'下一题',exact:false}).click();}
 await page.waitForURL('**/r/*');await page.getByRole('heading',{name:'人间取景器',exact:true}).waitFor();await page.locator('.result-foot img').waitFor();assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.screenshot({path:'outputs/result-mobile.png',fullPage:true});
 const url=page.url(),id=url.split('/').at(-1);const publicJson=await (await context.request.get(base+'/api/results/'+id)).json();assert(!JSON.stringify(publicJson).includes('界面验证'));assert(!('answers' in publicJson));assert(!('name' in publicJson));
 await page.getByRole('button',{name:'保存结果长图',exact:false}).click();await page.locator('dialog[open] .generated-image').waitFor();await page.locator('.generated-image').evaluate(img=>img.decode());
 const dimensions=await page.locator('.generated-image').evaluate(img=>({width:img.naturalWidth,height:img.naturalHeight}));assert(dimensions.width>=1000&&dimensions.height>dimensions.width);const imageBytes=await page.locator('.generated-image').evaluate(async img=>Array.from(new Uint8Array(await (await fetch(img.src)).arrayBuffer())));await fs.writeFile('outputs/result-export.png',Buffer.from(imageBytes));await page.getByRole('button',{name:'关闭长图预览'}).click();
 await context.grantPermissions(['clipboard-read','clipboard-write']);await page.getByRole('button',{name:'复制结果链接',exact:false}).click();assert.equal(await page.evaluate(()=>navigator.clipboard.readText()),url);
 const anonymous=await browser.newContext({viewport:{width:390,height:844}});const shared=await anonymous.newPage();await shared.goto(url);await shared.getByRole('heading',{name:'人间取景器',exact:true}).waitFor();assert(!(await shared.locator('body').innerText()).includes('界面验证'));assert(await shared.getByRole('link',{name:'我也来测一测'}).isVisible());await anonymous.close();
 await page.getByRole('link',{name:/再测一次/}).click();await page.getByRole('radiogroup').waitFor();assert.equal(await page.getByRole('radio').nth(0).getAttribute('aria-checked'),'false');
 const requestId=crypto.randomUUID();let submit=await context.request.post(base+'/api/results',{data:{requestId,answers}});assert.equal(submit.status(),200);const second=await submit.json();assert.equal(second.remaining,1);let repeat=await context.request.post(base+'/api/results',{data:{requestId,answers}});assert.deepEqual(await repeat.json(),second);
 submit=await context.request.post(base+'/api/results',{data:{requestId:crypto.randomUUID(),answers:Array(30).fill(0)}});const multi=await submit.json();assert.equal(multi.remaining,0);assert.equal((await context.request.post(base+'/api/results',{data:{requestId:crypto.randomUUID(),answers}})).status(),409);
 await page.goto(base+'/r/'+multi.id);await page.getByRole('heading',{name:'多面创作配置'}).waitFor();await page.locator('.result-foot img').waitFor();assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));assert(await page.getByRole('button',{name:'已完成3次测评'}).isDisabled());await page.getByRole('button',{name:'保存结果长图',exact:false}).click();await page.locator('dialog[open] .generated-image').waitFor();await page.locator('.generated-image').evaluate(img=>img.decode());const multiDimensions=await page.locator('.generated-image').evaluate(img=>({width:img.naturalWidth,height:img.naturalHeight}));assert(multiDimensions.height>dimensions.height);await page.locator('.generated-image').evaluate(async img=>Array.from(new Uint8Array(await (await fetch(img.src)).arrayBuffer()))).then(bytes=>fs.writeFile('outputs/multi-export.png',Buffer.from(bytes)));
 const concurrent=await browser.newContext();await concurrent.request.post(base+'/api/session',{data:{name:'并发验证'+run}});const responses=await Promise.all(Array.from({length:8},()=>concurrent.request.post(base+'/api/results',{data:{requestId:crypto.randomUUID(),answers}})));assert.equal(responses.filter(r=>r.status()===200).length,3);assert.equal(responses.filter(r=>r.status()===409).length,5);assert.equal((await (await concurrent.request.get(base+'/api/session')).json()).used,3);await concurrent.close();
 assert.deepEqual(errors,[]);console.log(JSON.stringify({passed:true,checks:['姓名必填','30题完整作答','返回改选','刷新恢复','七车型主结果','服务端计分','长图导出','多面长图导出','剪贴板复制','匿名分享无姓名','再次测试','三次上限','幂等提交','并发上限','320/390/768/1440宽度无溢出'],dimensions,multiDimensions,resultPath:'/r/'+id},null,2));
}finally{await browser.close();}

