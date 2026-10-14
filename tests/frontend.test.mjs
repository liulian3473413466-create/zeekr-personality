// Browser integration against controlled API fixtures. Live Supabase checks are separate.
import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {readFileSync,mkdirSync} from 'node:fs';
import {questions,scoreAnswers,questionsForVersion} from '../lib/quiz.ts';
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe'});
const now=Date.now(), personId=crypto.randomUUID();let used=0, failOnce=true, savedResult, submissions=[];let version=0;
const participants=Array.from({length:15},(_,i)=>({id:crypto.randomUUID(),name:'演示参与者'+String.fromCharCode(65+i),team:null,note:'',selectedResultId:null,createdAt:now,lastSeen:now,progress:questions.length,results:[{id:crypto.randomUUID(),createdAt:now,result:scoreAnswers(questions.map(q=>q.key?.includes('VRINECO'[i%7])?q.key.indexOf('VRINECO'[i%7]):0)),answers:Array(questions.length).fill(0),source:'测试数据'}]}));
const own={id:personId,name:'测试同学007🚗',team:null,note:'',selectedResultId:null,createdAt:now,lastSeen:now,progress:0,results:[]};participants.push(own);
const legacyRecord={id:crypto.randomUUID(),createdAt:now-86400000,result:scoreAnswers(Array(30).fill(2),1),answers:Array(30).fill(2),source:'v1.2'};
participants[0].results.push(legacyRecord);
const context=await browser.newContext({viewport:{width:390,height:844},acceptDownloads:true});
const errors=[];context.on('page',p=>p.on('pageerror',e=>errors.push(e.message)));
await context.route('https://quiz-test.supabase.co/**',async route=>{
 const req=route.request(),path=new URL(req.url()).pathname.replace('/functions/v1/quiz-api','');const body=req.postDataJSON();let data,status=200;
 if(path==='/session'){data={identity:personId,used,remaining:3-used};if(req.method()==='POST')data.token='0'.repeat(72);}
 else if(path==='/progress'){own.progress=body.answered;data={ok:true};}
 else if(path==='/results'){
  assert.equal(body.quizVersion,2);assert.equal(body.answers.length,12);submissions.push(body);if(!savedResult||savedResult.requestId!==body.requestId){savedResult={id:crypto.randomUUID(),createdAt:now,result:scoreAnswers(body.answers),requestId:body.requestId};used++;own.results.unshift({...savedResult,answers:body.answers,source:'测试数据'});}
  if(failOnce){status=503;data={error:'模拟网络断开，请重新提交。'};failOnce=false;}else data={id:savedResult.id,used,remaining:3-used};
 }else if(path.startsWith('/results/')){data={id:savedResult.id,createdAt:now,result:savedResult.result};}
 else if(path.startsWith('/auth/v1/token')){const user={id:crypto.randomUUID(),email:'admin@example.test',aud:'authenticated',role:'authenticated'};data={access_token:'mock-access-token',refresh_token:'mock-refresh-token',token_type:'bearer',expires_in:3600,expires_at:Math.floor(Date.now()/1000)+3600,user};}
 else if(path.startsWith('/auth/v1/logout'))data={};
 else if(path==='/admin'){data={participants,version,adminEmail:'admin@example.test'};}
 else if(path==='/admin/teams'){assert.equal(body.version,version);for(const patch of body.assignments)Object.assign(participants.find(p=>p.id===patch.id),patch);data={version:++version};}
 else {status=404;data={error:'Unknown mock path '+path};}
 await route.fulfill({status,headers:{'Content-Type':'application/json','Access-Control-Allow-Origin':'*'},body:JSON.stringify(data)});
});
try{
 const page=await context.newPage();const base='http://127.0.0.1:5174/';await page.goto(base);
 assert.equal(await page.getByPlaceholder('请输入昵称').count(),1);assert.match(await page.locator('.meta-row').innerText(),/12/);assert.doesNotMatch(await page.locator('body').innerText(),/真实姓名/);
 await page.getByLabel('先认识一下，怎么称呼你？').fill('测试同学007🚗');await page.getByRole('button',{name:'开始探索我的人格'}).click();
 await page.getByRole('heading',{name:questions[0].title,exact:true}).waitFor();await page.getByRole('radio').nth(0).click();await page.getByRole('heading',{name:questions[1].title,exact:true}).waitFor();
 await page.getByRole('button',{name:'← 上一题',exact:true}).click();await page.getByRole('radio').nth(1).click();await page.getByRole('heading',{name:questions[1].title,exact:true}).waitFor();
 await page.reload();await page.getByRole('button',{name:/继续上次答题/}).click();await page.getByRole('heading',{name:questions[1].title,exact:true}).waitFor();
 for(let i=1;i<questions.length;i++){await page.getByRole('heading',{name:questions[i].title,exact:true}).waitFor();await page.getByRole('radio').nth(questions[i].key?.includes('V')?questions[i].key.indexOf('V'):0).click();}
 await page.getByRole('button',{name:'重新提交并查看结果'}).waitFor();await page.getByRole('button',{name:'重新提交并查看结果'}).click();
 await page.locator('.result-card').waitFor();assert.equal(savedResult.result.version,2);assert.equal(used,1);assert.equal(submissions[0].requestId,submissions[1].requestId);assert.equal(submissions[1].answers[0],1);assert(!await page.locator('body').innerText().then(s=>s.includes('测试同学')));
 await page.locator('.vehicle-photo').first().evaluate(img=>img.decode());assert.match(await page.locator('.vehicle-photo').first().getAttribute('src'),/001\.png/);
 await page.waitForTimeout(1300);mkdirSync('outputs',{recursive:true});await page.screenshot({path:'outputs/v1.2-result-mobile.png',fullPage:true});
 const downloadPromise=page.waitForEvent('download');await page.getByRole('button',{name:'保存结果长图'}).click();const download=await downloadPromise;await download.saveAs('outputs/v1.2-result-export.png');const png=readFileSync('outputs/v1.2-result-export.png');assert.equal(png.readUInt32BE(16),1074);assert(png.readUInt32BE(20)>3000);await page.getByRole('button',{name:'关闭长图预览'}).click();
 for(const width of [320,390,768,1440]){await page.setViewportSize({width,height:900});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Result overflow '+width);}
 const share=await context.newPage();await share.goto(page.url());await share.locator('.result-card').waitFor();assert(!await share.locator('body').innerText().then(s=>s.includes('测试同学')));await share.close();
 await page.getByRole('link',{name:/再测一次/}).click();await page.getByRole('heading',{name:questions[0].title,exact:true}).waitFor();
 await page.goto(base+'#/admin');await page.getByLabel('管理员邮箱').fill('admin@example.test');await page.getByLabel('密码',{exact:true}).fill('test-only-password');await page.getByRole('button',{name:'登录后台'}).click();await page.getByRole('heading',{name:'把不同的你，组在一起。'}).waitFor();
 await page.locator('.participant-row').first().getByRole('button',{name:'查看详情 ↗'}).click();
 await page.getByLabel('查看历次测评').selectOption(legacyRecord.id);assert.equal(await page.locator('.answer-row').count(),30);assert.match(await page.locator('.answer-row').first().innerText(),new RegExp(questionsForVersion(1)[0].title.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));
 await page.getByLabel('查看历次测评').selectOption(participants[0].results[0].id);assert.equal(await page.locator('.answer-row').count(),12);assert((await page.locator('.answer-row').first().innerText()).includes(questions[0].title));await page.getByLabel('关闭详情').click();
 await page.getByRole('button',{name:'四组分配',exact:true}).click();await page.getByRole('button',{name:'生成四组建议'}).click();for(let i=0;i<4;i++)assert.equal(await page.locator('.team-column').nth(i).locator('.team-person').count(),4);
 await page.getByRole('button',{name:'保存分组与备注'}).click();await page.getByText('分组和备注已保存。',{exact:true}).waitFor();assert.equal(version,1);
 await page.screenshot({path:'outputs/v1.3-admin-desktop.png',fullPage:true});await page.setViewportSize({width:390,height:844});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.screenshot({path:'outputs/v1.2-admin-mobile.png',fullPage:true});
 const exportPromise=page.waitForEvent('download');await page.getByRole('button',{name:'导出全部 CSV ↓'}).click();const csv=await exportPromise;await csv.saveAs('outputs/v1.2-admin-export.csv');assert(readFileSync('outputs/v1.2-admin-export.csv','utf8').includes('测试同学'));
 const csvText=readFileSync('outputs/v1.2-admin-export.csv','utf8');assert(csvText.includes('12题创作版'));assert(csvText.includes('30题旧版'));assert(csvText.includes(questionsForVersion(1)[29].options[2]));
 assert.deepEqual(errors,[]);console.log(JSON.stringify({nickname:true,twelveQuestions:true,legacyHistory:true,autoNext:true,backAndResume:true,retryIdempotent:true,cars:true,exportPng:[png.readUInt32BE(16),png.readUInt32BE(20)],anonymousShare:true,retest:true,adminFourTeams:true,adminSaveAndExport:true,responsive:[320,390,768,1440],errors}));
}finally{await browser.close();}
