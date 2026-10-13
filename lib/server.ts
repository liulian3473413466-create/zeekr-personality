import { env } from 'cloudflare:workers';
import { normalizeName, scoreAnswers, type SavedResult } from './quiz';
const COOKIE='zeekr_session';
const TTL=60*60*24*30;
export function database(){if(!env.DB) throw new Error('测评数据服务暂未就绪，请稍后再试。');return env.DB;}
export async function hash(value:string){const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value));return Array.from(new Uint8Array(digest),n=>n.toString(16).padStart(2,'0')).join('');}
export function json(value:unknown,status=200,headers:Record<string,string>={}){return Response.json(value,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff',...headers}});}
export function sameOrigin(request:Request){const origin=request.headers.get('origin');if(origin&&origin!==new URL(request.url).origin)throw new Error('请求来源无效，请在测评页面重试。');}
export async function parseBody(request:Request){if(!request.headers.get('content-type')?.includes('application/json')) throw new Error('请求格式不正确。');const text=await request.text();if(text.length>8192)throw new Error('提交内容过长。');try{return JSON.parse(text);}catch{throw new Error('请求格式不正确。');}}
export async function participant(request:Request){const token=request.headers.get('cookie')?.split(';').map(x=>x.trim()).find(x=>x.startsWith(COOKIE+'='))?.slice(COOKIE.length+1);if(!token||token.length>100)return null;return database().prepare('SELECT participant_key FROM sessions WHERE token_hash = ? AND expires_at > ?').bind(await hash(token),Date.now()).first<{participant_key:string}>();}
export async function status(key:string){const count=await database().prepare('SELECT COUNT(*) AS count FROM results WHERE participant_key = ?').bind(key).first<{count:number}>();return {used:count?.count??0,remaining:Math.max(0,3-(count?.count??0))};}
export async function createSession(request:Request){sameOrigin(request);const body=await parseBody(request);const name=normalizeName(body.name);const key=await hash(name.toLocaleLowerCase('zh-CN').replace(/\s/g,''));const token=crypto.randomUUID()+crypto.randomUUID();const db=database();await db.batch([
 db.prepare('INSERT INTO participants (key,name,created_at) VALUES (?,?,?) ON CONFLICT(key) DO NOTHING').bind(key,name,Date.now()),
 db.prepare('INSERT INTO sessions (token_hash,participant_key,expires_at) VALUES (?,?,?)').bind(await hash(token),key,Date.now()+TTL*1000),
]);return json({...(await status(key)),name,identity:key},200,{'Set-Cookie':`${COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${TTL}${new URL(request.url).protocol==='https:'?'; Secure':''}`});}
export async function getResult(id:string):Promise<SavedResult|null>{if(!/^[a-f0-9-]{36}$/.test(id))return null;const row=await database().prepare('SELECT id,result,created_at FROM results WHERE id = ?').bind(id).first<{id:string;result:string;created_at:number}>();return row?{id:row.id,createdAt:row.created_at,result:JSON.parse(row.result)}:null;}
export async function submit(request:Request){sameOrigin(request);const person=await participant(request);if(!person)return json({error:'请先输入真实姓名，再开始测评。'},401);const body=await parseBody(request);const result=scoreAnswers(body.answers);if(typeof body.requestId!=='string'||! /^[a-f0-9-]{36}$/.test(body.requestId))return json({error:'本次答题标识已失效，请重新开始。'},400);
 const db=database();const existing=await db.prepare('SELECT id FROM results WHERE request_id = ? AND participant_key = ?').bind(body.requestId,person.participant_key).first<{id:string}>();
 if(existing)return json({id:existing.id,...await status(person.participant_key)});
 const id=crypto.randomUUID();
 // One conditional INSERT makes the per-name limit atomic, including concurrent tabs.
 await db.prepare('INSERT INTO results (id,request_id,participant_key,answers,result,created_at) SELECT ?,?,?,?,?,? WHERE (SELECT COUNT(*) FROM results WHERE participant_key = ?) < 3 ON CONFLICT(request_id) DO NOTHING').bind(id,body.requestId,person.participant_key,JSON.stringify(body.answers),JSON.stringify(result),Date.now(),person.participant_key).run();
 const saved=await db.prepare('SELECT id FROM results WHERE request_id = ? AND participant_key = ?').bind(body.requestId,person.participant_key).first<{id:string}>();
 if(!saved)return json({error:'这个姓名已完成3次测评，不能继续提交。',...await status(person.participant_key)},409);
 return json({id:saved.id,...await status(person.participant_key)});
}
export function apiError(error:unknown){const message=error instanceof Error?error.message:'';const safe=/^(请输入|请完成|请求|提交内容|测评数据)/.test(message);return json({error:safe?message:'暂时没能连接数据服务，请稍后重试。'},safe?400:503);}
