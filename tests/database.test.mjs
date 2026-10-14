import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {PGlite} from '@electric-sql/pglite';
import {scoreAnswers} from '../lib/quiz.ts';
test('数据库权限、三次上限、幂等、组队人数与并发编辑版本',async()=>{
 const db=new PGlite();
 try{
 await db.exec('create role anon; create role authenticated; create role service_role bypassrls; create schema auth; create table auth.users(id uuid primary key);');
 for(const file of readdirSync('supabase/migrations').filter(f=>f.endsWith('.sql')).sort())await db.exec(readFileSync('supabase/migrations/'+file,'utf8'));
 const rights=await db.query("select has_table_privilege('anon','public.quiz_results','select') as can_read,has_function_privilege('authenticated','public.quiz_submit(text,uuid,jsonb,jsonb)','execute') as can_submit");
 assert.equal(rights.rows[0].can_read,false);assert.equal(rights.rows[0].can_submit,false);
 const start=async(key,token)=> (await db.query('select public.quiz_start($1,$2,$3) as data',[key,'测试参与者',token])).rows[0].data;
 const person=await start('namekey','tokenhash');assert.equal(person.remaining,3);
 const answers=Array(12).fill(0),result=scoreAnswers(answers),request=crypto.randomUUID();
 const submit=async(id)=> (await db.query('select public.quiz_submit($1,$2,$3,$4) as data',['tokenhash',id,JSON.stringify(answers),JSON.stringify(result)])).rows[0].data;
 const first=await submit(request),retry=await submit(request);assert.equal(first.id,retry.id);assert.equal(retry.used,1);
 await submit(crypto.randomUUID());await submit(crypto.randomUUID());
 await assert.rejects(()=>submit(crypto.randomUUID()),/LIMIT_REACHED/);
 assert.equal((await start('namekey','secondtoken')).remaining,0);
 await assert.rejects(()=>db.query('select public.quiz_submit($1,$2,$3,$4)',['unknown',crypto.randomUUID(),JSON.stringify(answers),JSON.stringify(result)]),/SESSION_EXPIRED/);
 const participants=[person];for(let i=1;i<5;i++)participants.push(await start('key'+i,'token'+i));
 const assignments=participants.map(p=>({id:p.identity,team:1,note:'',selectedResultId:null}));
 await assert.rejects(()=>db.query('select public.quiz_save_teams($1,$2)',[0,JSON.stringify(assignments)]),/TEAM_FULL/);
 assert.equal((await db.query('select count(*)::int as n from public.quiz_participants where team is not null')).rows[0].n,0);
 assignments[4].team=2;
 assert.equal((await db.query('select public.quiz_save_teams($1,$2) as version',[0,JSON.stringify(assignments)])).rows[0].version,1);
 await assert.rejects(()=>db.query('select public.quiz_save_teams($1,$2)',[0,JSON.stringify(assignments)]),/VERSION_CONFLICT/);
 assignments[1].selectedResultId=first.id;
 await assert.rejects(()=>db.query('select public.quiz_save_teams($1,$2)',[1,JSON.stringify(assignments)]),/INVALID_RESULT/);
 }finally{await db.close();}
});

test('升级保留30题记录与次数，兼容12题、单字昵称并拒绝版本混用',async()=>{
 const db=new PGlite();
 try{
  await db.exec('create role anon; create role authenticated; create role service_role bypassrls; create schema auth; create table auth.users(id uuid primary key);');
  const migrations=readdirSync('supabase/migrations').filter(f=>f.endsWith('.sql')).sort();
  await db.exec(readFileSync('supabase/migrations/'+migrations[0],'utf8'));
  const start=async(key,name,token)=>(await db.query('select public.quiz_start($1,$2,$3) as data',[key,name,token])).rows[0].data;
  const old=await start('same-name','旧登记名','old-token');
  const submit=async(answers,result)=>(await db.query('select public.quiz_submit($1,$2,$3,$4) as data',['old-token',crypto.randomUUID(),JSON.stringify(answers),JSON.stringify(result)])).rows[0].data;
  const legacyAnswers=Array(30).fill(2),legacyResult=scoreAnswers(legacyAnswers,1);
  const first=await submit(legacyAnswers,legacyResult);
  const before=(await db.query('select * from public.quiz_results where id=$1',[first.id])).rows[0];
  for(const file of migrations.slice(1))await db.exec(readFileSync('supabase/migrations/'+file,'utf8'));
  assert.deepEqual((await db.query('select * from public.quiz_results where id=$1',[first.id])).rows[0],before);
  assert.equal((await start('same-name','旧登记名','new-token')).remaining,2);
  const shortAnswers=Array(12).fill(1),shortResult=scoreAnswers(shortAnswers);
  await assert.rejects(()=>submit(legacyAnswers,shortResult),/INVALID_ANSWERS/);
  await assert.rejects(()=>submit(shortAnswers,legacyResult),/INVALID_ANSWERS/);
  await assert.rejects(()=>submit(shortAnswers,{...shortResult,version:3}),/INVALID_QUIZ_VERSION/);
  assert.equal((await submit(shortAnswers,shortResult)).used,2);
  assert.equal((await submit(legacyAnswers,legacyResult)).used,3);
  await assert.rejects(()=>submit(shortAnswers,shortResult),/LIMIT_REACHED/);
  assert.equal((await start('single-name','鹿','single-token')).remaining,3);
  const rows=(await db.query('select result->>\'version\' as version,jsonb_array_length(answers) as n from public.quiz_results where participant_id=$1',[old.identity])).rows;
  assert.deepEqual(rows.map(r=>[r.version,r.n]).sort(),[['1',30],['1',30],['2',12]]);
 }finally{await db.close();}
});
