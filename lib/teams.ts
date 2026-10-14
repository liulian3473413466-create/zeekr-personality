import {ROLES,type Role} from './roles.ts';
import type {Participant} from './client';
export function chosenResult(p:Participant){return p.results.find(r=>r.id===p.selectedResultId)||p.results[0];}
export type TeamFit={assignments:{id:string;role:Role;independent:boolean}[];covered:number;roleFit:number;collaboration:number;weighted:number};
export function teamFit(people:Participant[]):TeamFit{
 const known=people.filter(p=>chosenResult(p)?.result.roleProfile);
 if(known.length>4)throw new Error('每组最多4人。');
 let best:{covered:number;sum:number;roles:Role[]}={covered:-1,sum:-1,roles:[]};
 function assign(i:number,used:Role[],covered:number,sum:number){
  if(i===known.length){if(covered>best.covered||covered===best.covered&&sum>best.sum)best={covered,sum,roles:[...used]};return;}
  const profile=chosenResult(known[i])!.result.roleProfile!;
  for(const role of ROLES)if(!used.includes(role))assign(i+1,[...used,role],covered+Number(profile.levels[role]>=2),sum+profile.fit[role]);
 }
 assign(0,[],0,0);
 // Bounded preference variety; this does not claim psychometric validity.
 const collaboration=known.length<2?0:[0,1].reduce((sum,q)=>sum+(new Set(known.map(p=>chosenResult(p)!.result.roleProfile!.collaboration[q])).size-1)/(known.length-1),0)*50;
 const roleFit=known.length?best.sum/known.length:0;
 return {assignments:known.map((p,i)=>({id:p.id,role:best.roles[i],independent:chosenResult(p)!.result.roleProfile!.levels[best.roles[i]]>=2})),covered:Math.max(0,best.covered),roleFit,collaboration,weighted:.8*roleFit+.2*collaboration};
}
// Exact search, <=16 people. Coverage comes first, then 80% roles + 20% styles.
export function suggestTeams(people:Participant[]):Participant[]{
 const completed=people.filter(p=>chosenResult(p));
 const missing=completed.filter(p=>!chosenResult(p)?.result.roleProfile);
 if(missing.length)throw new Error(`有${missing.length}位的参考结果没有岗位信息，请改选岗位版答卷，或手动分组。`);
 const eligible=[...completed].sort((a,b)=>a.id.localeCompare(b.id));
 if(eligible.length>16)throw new Error('智能建议一次最多支持16位已完成测评的参与者，请手动分配。');
 const n=eligible.length,low=Math.floor(n/4),high=Math.ceil(n/4);
 const groupCache=new Map<number,number>(),memo=new Map<string,{score:number;groups:number[]}>();
 const indices=(mask:number)=>Array.from({length:n},(_,i)=>i).filter(i=>mask&(1<<i));
 function groupValue(mask:number){let score=groupCache.get(mask);if(score===undefined){const fit=teamFit(indices(mask).map(i=>eligible[i]));score=fit.covered*1000+fit.weighted;groupCache.set(mask,score);}return score;}
 function solve(mask:number,left:number):{score:number;groups:number[]}{
  if(!mask)return {score:0,groups:Array(left).fill(0)};
  const key=`${mask}:${left}`,cached=memo.get(key);if(cached)return cached;
  const remaining=indices(mask),first=remaining[0];let best={score:-Infinity,groups:[] as number[]};
  for(let size=Math.max(1,low);size<=high;size++){
   if(remaining.length-size<(left-1)*low||remaining.length-size>(left-1)*high)continue;
   function pick(at:number,todo:number,group:number){
    if(!todo){const tail=solve(mask^group,left-1),score=groupValue(group)+tail.score;if(score>best.score+1e-8)best={score,groups:[group,...tail.groups]};return;}
    for(let k=at;k<=remaining.length-todo;k++)pick(k+1,todo-1,group|(1<<remaining[k]));
   }
   pick(1,size-1,1<<first);
  }
  memo.set(key,best);return best;
 }
 const groups=solve((1<<n)-1,4).groups,teamById=new Map<string,number>();
 groups.forEach((mask,t)=>indices(mask).forEach(i=>teamById.set(eligible[i].id,t+1)));
 return people.map(p=>({...p,team:teamById.get(p.id)??null}));
}
export function csvCell(value:unknown){let str=String(value??'');if(/^[\s]*[=+@-]/.test(str))str="'"+str;return '"'+str.replaceAll('"','""')+'"';}
