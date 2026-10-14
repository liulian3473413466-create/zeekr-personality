import test from 'node:test';
import assert from 'node:assert/strict';
import {suggestTeams,chosenResult,csvCell} from '../lib/teams.ts';
import {scoreAnswers} from '../lib/quiz.ts';
const people=Array.from({length:16},(_,i)=>({id:String(i),name:'参与者'+i,team:null,note:'',selectedResultId:null,results:[{id:'r'+i,result:scoreAnswers(Array(12).fill(i%4))}]}));
test('16人分成4组，各4人，每人恰好出现一次',()=>{const result=suggestTeams(people);for(const t of [1,2,3,4])assert.equal(result.filter(p=>p.team===t).length,4);assert.equal(new Set(result.map(p=>p.id)).size,16);assert(people.every(p=>p.team===null));});
test('没有结果的人保持待分组；可选特定一次结果',()=>{const p={...people[0],results:[],id:'waiting'};assert.equal(suggestTeams([p,...people.slice(0,3)]).find(x=>x.id==='waiting').team,null);const person={...people[0],selectedResultId:'older',results:[...people[0].results,{id:'older'}]};assert.equal(chosenResult(person).id,'older');});
test('CSV中禁止公式注入，同时保留换行及引号',()=>{assert.equal(csvCell('=1+1'),'"\'=1+1"');assert.equal(csvCell('甲"乙\n丙'),'"甲""乙\n丙"');});
