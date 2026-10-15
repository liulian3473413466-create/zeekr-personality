import test from 'node:test';
import assert from 'node:assert/strict';
import {request,loginErrorMessage,NETWORK_ERROR,TIMEOUT_ERROR} from '../lib/request.ts';

test('一次请求保留方法、正文、鉴权头、HTTP状态及响应正文',async t=>{
 const fetch=t.mock.method(globalThis,'fetch',async(input,init)=>{
  assert.equal(input,'https://proxy.example.test/koc-quiz-backend/functions/v1/quiz-api/results');
  assert.equal(init.method,'POST');assert.equal(init.body,'{"requestId":"same-id"}');assert.equal(init.headers['X-Quiz-Session'],'participant-token');
  return new Response('{"error":"已完成3次测评。"}',{status:409,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}});
 });
 const response=await request('https://proxy.example.test/koc-quiz-backend/functions/v1/quiz-api/results',{method:'POST',body:'{"requestId":"same-id"}',headers:{'X-Quiz-Session':'participant-token'}});
 assert.equal(response.status,409);assert.equal(response.headers.get('cache-control'),'no-store');assert.deepEqual(await response.json(),{error:'已完成3次测评。'});assert.equal(fetch.mock.callCount(),1);
});

test('Safari Load failed转成中文且不会自动重发写请求',async t=>{
 const fetch=t.mock.method(globalThis,'fetch',async()=>{throw new TypeError('Load failed');});
 await assert.rejects(request('https://proxy.example.test/session',{method:'POST',body:'{}'}),{message:NETWORK_ERROR});
 assert.equal(fetch.mock.callCount(),1);
});

test('连接超时会中止底层请求，且不会自动重发',async t=>{
 let aborted=false;
 const fetch=t.mock.method(globalThis,'fetch',(_input,init)=>new Promise((_resolve,reject)=>init.signal.addEventListener('abort',()=>{aborted=true;reject(new DOMException('Aborted','AbortError'));},{once:true})));
 await assert.rejects(request('https://proxy.example.test/session',{method:'POST'},10),{message:TIMEOUT_ERROR});
 assert(aborted);assert.equal(fetch.mock.callCount(),1);
});

test('响应头已返回但正文卡住也受同一超时限制',async t=>{
 t.mock.method(globalThis,'fetch',async(_input,init)=>new Response(new ReadableStream({start(controller){init.signal.addEventListener('abort',()=>controller.error(new DOMException('Aborted','AbortError')),{once:true});}})));
 await assert.rejects(request('https://proxy.example.test/results',{},10),{message:TIMEOUT_ERROR});
});

test('外部取消保留AbortError；已取消的请求不会发出',async t=>{
 const fetch=t.mock.method(globalThis,'fetch',(_input,init)=>new Promise((_resolve,reject)=>init.signal.addEventListener('abort',()=>reject(new DOMException('Aborted','AbortError')),{once:true})));
 const already=new AbortController();already.abort(new Error('navigation'));
 await assert.rejects(request('https://proxy.example.test/results',{signal:already.signal}),{name:'AbortError'});assert.equal(fetch.mock.callCount(),0);
 const active=new AbortController();const pending=request(new Request('https://proxy.example.test/results',{signal:active.signal}));active.abort();
 await assert.rejects(pending,{name:'AbortError'});assert.equal(fetch.mock.callCount(),1);
});

test('204响应保持无正文',async t=>{
 t.mock.method(globalThis,'fetch',async()=>new Response(null,{status:204}));
 const response=await request('https://proxy.example.test/auth/v1/logout',{method:'POST'});assert.equal(response.status,204);assert.equal(await response.text(),'');
});

test('后台区分密码错误、网络故障、超时和服务端故障',()=>{
 assert.match(loginErrorMessage({code:'invalid_credentials',status:400}),/邮箱或密码不正确/);
 assert.match(loginErrorMessage({message:'Invalid login credentials',status:400}),/邮箱或密码不正确/);
 assert.equal(loginErrorMessage({name:'AuthRetryableFetchError',status:0,message:NETWORK_ERROR}),NETWORK_ERROR);
 assert.equal(loginErrorMessage({name:'AuthRetryableFetchError',status:0,message:TIMEOUT_ERROR}),TIMEOUT_ERROR);
 assert.doesNotMatch(loginErrorMessage({status:503,message:'upstream failure'}),/密码/);
 assert.match(loginErrorMessage({status:429}),/频繁/);
});
