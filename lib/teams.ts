import {CODES,signalRate,type Code} from './quiz.ts';
import type {Participant} from './client';
export function chosenResult(p:Participant){return p.results.find(r=>r.id===p.selectedResultId)||p.results[0];}
// Deterministic greedy balancing of expressed tendencies, never a skills rating.
export function suggestTeams(people:Participant[]):Participant[]{
 const output:Participant[]=people.map(p=>({...p,team:null}));
 const eligible=output.filter(p=>chosenResult(p));if(eligible.length>16)throw new Error('智能建议一次最多支持16位已完成测评的参与者，请手动分配。');
 const totals=Array.from({length:4},()=>Object.fromEntries(CODES.map(c=>[c,0])) as Record<Code,number>);const counts=[0,0,0,0];
 eligible.sort((a,b)=>Math.max(...CODES.map(c=>signalRate(chosenResult(b)!.result,c)))-Math.max(...CODES.map(c=>signalRate(chosenResult(a)!.result,c)))||a.id.localeCompare(b.id));
 for(const person of eligible){const result=chosenResult(person)!.result;const scores=Object.fromEntries(CODES.map(c=>[c,signalRate(result,c)])) as Record<Code,number>;let winner=0;let best=Infinity;for(let t=0;t<4;t++){if(counts[t]>=4)continue;const cost=counts[t]*10000+CODES.reduce((sum,c)=>sum+totals[t][c]*scores[c],0);if(cost<best){best=cost;winner=t;}}person.team=winner+1;counts[winner]++;for(const c of CODES)totals[winner][c]+=scores[c];}
 return output;
}
export function csvCell(value:unknown){let str=String(value??'');if(/^[\s]*[=+@-]/.test(str))str="'"+str;return '"'+str.replaceAll('"','""')+'"';}
