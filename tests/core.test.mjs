import test from 'node:test';
import assert from 'node:assert/strict';
import {CODES,questions,scoreAnswers,normalizeName} from '../lib/quiz.ts';
test('题库为30题，28计分题，每维每个位置出现4次',()=>{assert.equal(questions.length,30);const counts=Object.fromEntries(CODES.map(c=>[c,[0,0,0,0]]));for(const q of questions){assert.equal(q.options.length,4);if(q.key)[...q.key].forEach((c,i)=>counts[c][i]++);}for(const c of CODES)assert.deepEqual(counts[c],[4,4,4,4]);});
test('七种主车型人格都可以独立生成',()=>{for(const c of CODES){const answers=questions.map(q=>q.key?.includes(c)?q.key.indexOf(c):0);const result=scoreAnswers(answers);assert.equal(result.kind,'single');assert.deepEqual(result.leaders,[c]);assert.equal(result.scores[c],16);assert.equal(Object.values(result.scores).reduce((a,b)=>a+b),28);}});
test('全选A是七维均衡的多面配置，不偷偷打破平局',()=>{const r=scoreAnswers(Array(30).fill(0));assert.equal(r.kind,'multi');assert.equal(r.leaders.length,7);assert.deepEqual(Object.values(r.scores),Array(7).fill(4));});
test('彩蛋答案不改变任何维度分数',()=>{const a=Array(30).fill(0),b=[...a];b[9]=2;b[19]=3;assert.deepEqual(scoreAnswers(a).scores,scoreAnswers(b).scores);assert.deepEqual(scoreAnswers(b).bonus,['表情包供应商','交卷即下班']);});
test('拒绝不完整或伪造答案',()=>{for(const a of [null,[],Array(29).fill(0),Array(31).fill(0),Array(30).fill(4),Array(30).fill(null),Array(30).fill('0')])assert.throws(()=>scoreAnswers(a));});
test('姓名归一化，并拒绝HTML、数字和表情',()=>{assert.equal(normalizeName('  张三  '),'张三');assert.equal(normalizeName('John   Smith'),'John Smith');for(const n of ['','张','测试123','<script>','张三😀'])assert.throws(()=>normalizeName(n));});
