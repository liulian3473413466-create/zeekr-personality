import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {PGlite} from '@electric-sql/pglite';
import {scoreAnswers} from '../lib/quiz.ts';
test('数据库权限、三次上限、幂等、组队人数与并发编辑版本',async()=>{
 const db=new PGlite();
 try{
 await db.exec('create role anon; create role authenticated; create role service_role bypassrls; create schema auth; create table auth.users(id uuid primary key);');
 await db.exec(readFileSync('supabase/migrations/20261013125133_quiz_initial.sql','utf8'));
 const rights=await db.query("select has_table_privilege('anon','public.quiz_results','select') as can_read,has_function_privilege('authenticated','public.quiz_submit(text,uuid,jsonb,jsonb)','execute') as can_submit");
 assert.equal(rights.rows[0].can_read,false);assert.equal(rights.rows[0].can_submit,false);
 const start=async(key,token)=> (await db.query('select public.quiz_start($1,$2,$3) as data',[key,'测试参与者',token])).rows[0].data;
 const person=await start('namekey','tokenhash');assert.equal(person.remaining,3);
 const answers=Array(30).fill(0),result=scoreAnswers(answers),request=crypto.randomUUID();
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
