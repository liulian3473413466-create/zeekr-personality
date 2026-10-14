import test from 'node:test';
import assert from 'node:assert/strict';
import {CODES,questions as currentQuestions,scoreAnswers,normalizeName,questionsForVersion,opportunities as currentOpportunities,signalRate} from '../lib/quiz.ts';
const questions=questionsForVersion(2,2);const opportunities=Object.fromEntries(CODES.map(c=>[c,questions.filter(q=>q.key?.includes(c)).length]));
const oldScore=(answers)=>scoreAnswers(answers,2,2);
test('旧题库冻结：30题、28计分题，七维位置配平',()=>{const questions=questionsForVersion(1);assert.equal(questions.length,30);const counts=Object.fromEntries(CODES.map(c=>[c,[0,0,0,0]]));for(const q of questions){assert.equal(q.options.length,4);if(q.key)[...q.key].forEach((c,i)=>counts[c][i]++);}for(const c of CODES)assert.deepEqual(counts[c],[4,4,4,4]);});
test('七种主车型人格都可以独立生成',()=>{for(const c of CODES){const answers=questions.map(q=>q.key?.includes(c)?q.key.indexOf(c):0);const result=oldScore(answers);assert.equal(result.kind,'single');assert.deepEqual(result.leaders,[c]);assert.equal(result.scores[c],opportunities[c]);assert.equal(Object.values(result.scores).reduce((a,b)=>a+b),12);}});
test('全选A是七维均衡的多面配置，不偷偷打破平局',()=>{const r=scoreAnswers(Array(30).fill(0),1);assert.equal(r.kind,'multi');assert.equal(r.leaders.length,7);assert.deepEqual(Object.values(r.scores),Array(7).fill(4));});
test('彩蛋答案不改变任何维度分数',()=>{const a=Array(30).fill(0),b=[...a];b[9]=2;b[19]=3;assert.deepEqual(scoreAnswers(a,1).scores,scoreAnswers(b,1).scores);assert.deepEqual(scoreAnswers(b,1).bonus,['表情包供应商','交卷即下班']);});
test('拒绝不完整或伪造答案',()=>{for(const a of [null,[],Array(11).fill(0),Array(13).fill(0),Array(12).fill(4),Array(12).fill(null),Array(12).fill('0')])assert.throws(()=>oldScore(a));});
test('昵称可含数字、表情或单字，拒绝空白、HTML和控制字符',()=>{assert.equal(normalizeName('  小王007🚗  '),'小王007🚗');assert.equal(normalizeName('John   Smith'),'John Smith');assert.equal(normalizeName('氪'),'氪');for(const n of ['','   ','<script>','＜script＞','a\nb','a'.repeat(41)])assert.throws(()=>normalizeName(n));});

test('12道创作题均计分；每维有6—7次机会，单一位置不过度集中',()=>{assert.equal(questions.length,12);for(const c of CODES){const positions=[0,0,0,0];for(const q of questions){assert.equal(q.options.length,4);assert.equal(new Set(q.key).size,4);const p=q.key.indexOf(c);if(p>=0)positions[p]++;}assert(opportunities[c]>=6&&opportunities[c]<=7);assert(Math.max(...positions)<=2);}});
test('新版本按出题机会校正排序，旧版仍按原始次数排序',()=>{for(let n=0;n<256;n++){const a=questions.map((_,i)=>(n>>((i%4)*2))&3);const r=oldScore(a);assert.equal(r.version,2);assert.equal(signalRate(r,r.leaders[0]),Math.max(...CODES.map(c=>signalRate(r,c))));}assert.throws(()=>scoreAnswers(Array(30).fill(0),2));assert.throws(()=>scoreAnswers(Array(12).fill(0),1));});

test('表述修订保留历史题目和计分，结果携带准确的文案版本',()=>{
 const old=questionsForVersion(2,1);assert.notEqual(old[0].title,questions[0].title);
 assert.deepEqual(old.map(q=>q.key),questions.map(q=>q.key));
 for(let n=0;n<256;n++){
  const answers=questions.map((_,i)=>(n>>((i%4)*2))&3),before=scoreAnswers(answers,2,1),after=oldScore(answers);
  assert.equal(before.questionRevision,1);assert.equal(after.questionRevision,2);
  const {questionRevision:_,...a}=before,{questionRevision:__,...b}=after;assert.deepEqual(a,b);
 }
 assert.throws(()=>scoreAnswers(Array(12).fill(0),2,3));
});

test('岗位版12题、10题岗位信息＋2题协作，未尝试选项不强迫编造经验',()=>{
 assert.equal(currentQuestions.length,12);assert.equal(currentQuestions[0].options.length,5);assert.equal(currentQuestions[8].options.length,5);
 const a=[4,3,3,3,3,0,0,0,4,0,0,0],r=scoreAnswers(a);
 assert.equal(r.version,3);assert.equal(r.questionRevision,1);assert.deepEqual(Object.values(r.roleProfile.levels),[0,0,0,0]);assert.equal(r.roleProfile.recent,null);assert.equal(r.roleProfile.backup,null);assert.equal(r.roleProfile.preferred,'camera');
 assert(r.roleProfile.fit.camera<=20);assert.throws(()=>scoreAnswers(a,3,2));
 const bad=[...a];bad[1]=4;assert.throws(()=>scoreAnswers(bad));
});
test('协作答案不改变岗位分；改熟练度不改变趣味人格',()=>{
 const a=[0,0,3,3,3,0,0,0,4,0,0,0],b=[...a];b[10]=3;b[11]=3;
 assert.deepEqual(scoreAnswers(a).roleProfile.fit,scoreAnswers(b).roleProfile.fit);
 b[1]=3;b[10]=a[10];b[11]=a[11];assert.deepEqual(scoreAnswers(a).scores,scoreAnswers(b).scores);
});
test('岗位版七款车均可成为唯一首位，不把技能自评算成人格',()=>{
 for(const c of CODES){const a=currentQuestions.map(q=>q.key?.includes(c)?q.key.indexOf(c):0),r=scoreAnswers(a);assert.equal(r.leaders[0],c);assert.equal(r.scores[c],currentOpportunities[c]);assert.equal(Object.values(r.scores).reduce((a,b)=>a+b),6);}
});
