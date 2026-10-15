import {legacyQuestions,legacyBonusTags} from './quiz-v1.ts';
import {originalCreativeQuestions} from './quiz-v2.ts';
import {intuitiveQuestions} from './quiz-v2-intuitive.ts';
import {roleQuestions} from './quiz-v3.ts';
import {scoreRoles,type RoleProfile} from './roles.ts';
export const CODES = ["V", "R", "I", "N", "E", "C", "O"] as const;
export type Code = typeof CODES[number];
export type QuizVersion = 1|2|3;
export const QUIZ_VERSION:QuizVersion=3;
export type QuestionRevision=1|2;
export const QUESTION_REVISION:QuestionRevision=1;
export type Question = { title: string; options: string[]; key: string | null };
export const questions=roleQuestions;
export function questionsForVersion(version:QuizVersion,revision:QuestionRevision=QUESTION_REVISION):Question[]{return version===1?legacyQuestions:version===3?roleQuestions:revision===1?originalCreativeQuestions:intuitiveQuestions;}
export function quizVersionLabel(version:QuizVersion,revision:QuestionRevision=1){return version===1?'30题旧版':version===3?'12题岗位版':revision===1?'12题创作版':'12题直觉版';}
const legacyOpportunities=Object.fromEntries(CODES.map(c=>[c,intuitiveQuestions.filter(q=>q.key?.includes(c)).length])) as Record<Code,number>;
export const opportunities=Object.fromEntries(CODES.map(c=>[c,questions.filter(q=>q.key?.includes(c)).length])) as Record<Code,number>;
export const personas: Record<Code, {model:string;title:string;label:string;quote:string;description:string;tags:string[];contrast:string;partner:string;color:string}> = {
 V:{model:'001',title:'人间取景器',label:'视觉关注',quote:'生活可以随便过，照片不能随便拍。',description:'别人路过一面墙，你已经看到光、颜色和一个刚刚好的角度。你的“等一下”，往往意味着大家马上会多一张好照片。',tags:['眼睛先开机','这边光好','封面让我选'],contrast:'说好只拍一张，最后只是“只选一张”。',partner:'你可能会欣赏那个能告诉你：这个画面里，正在发生什么故事的人。',color:'#e66a37'},
 R:{model:'007',title:'人间说明书',label:'分析求证',quote:'可以被种草，但得先搞明白。',description:'别人的“听说很好”，到了你这里，通常还有下半场：好在哪、怎么用、是不是适合我。你愿意多弄清一点，也常把复杂的事讲具体。',tags:['容我研究一下','细节对得上','好用要说清楚'],contrast:'本来只想买一样东西，最后顺便做完了功课。',partner:'你可能会欣赏那个能把你的三分钟解释，变成一句让人想继续听的话的人。',color:'#668eb2'},
 I:{model:'007GT',title:'灵感制造机',label:'探索尝试',quote:'原计划很好，但旁边那条路也想看看。',description:'你很容易被“没试过”吸引。一个新角度、一条小岔路、一个突发奇想，都可能让普通的一天多出一点值得记住的内容。',tags:['要不试试','周末有支线','灵感不走直线'],contrast:'攻略收藏得很认真，真正出门以后又长出了新路线。',partner:'你可能会欣赏那个听完“要不试试”，会接着说“好，我来安排第一步”的人。',color:'#738659'},
 N:{model:'7X',title:'生活编剧',label:'叙事记忆',quote:'别人记得去了哪里，你记得那天发生了什么。',description:'你对日常里的小剧情很敏感。一句没接上的话、一次意外的绕路、回程时突然响起的歌，都可能成为你记住一天的理由。',tags:['小事也有戏','这段值得留下','回忆有后劲'],contrast:'相册里未必全是最好看的照片，但每张都能讲出点什么。',partner:'你可能会欣赏那个听完你的故事，就知道第一镜该怎么拍的人。',color:'#b28564'},
 E:{model:'8X',title:'镜头主角',label:'表达互动',quote:'大家还在酝酿，你已经进入状态。',description:'有些人需要很久才热起来，你更愿意先说一句、先试一遍。有人接话时，你的状态会更好；镜头开起来，你也愿意边试边找到感觉。',tags:['我先来一遍','有话接得住','现场有电'],contrast:'准备好的那句未必最好，临场接的一句可能更有意思。',partner:'你可能会欣赏那个能接住你的即兴，也能帮你把精彩部分留下来的人。',color:'#d15344'},
 C:{model:'009',title:'对话搭子',label:'关照他人',quote:'你一到场，大家就不用一直客气。',description:'有人没带伞、有人不好意思说累、有人不太想被拍——这些小信号，你常常会先注意到。和你在一起，人更容易放松下来。',tags:['细节里有照顾','不让人落单','有你就放松'],contrast:'别人的喜好记得清楚，轮到自己却容易说“我都行”。',partner:'你可能会欣赏那个也会停下来问你：“这次你想怎么拍？”的人。',color:'#957aab'},
 O:{model:'9X',title:'片场指挥家',label:'组织推进',quote:'你的“没事”，后面通常已经有了下一步。',description:'几个人的想法、时间和安排混在一起时，你习惯先抓住重点。什么时候出发、先做哪件事、临时变化怎么办——想清楚之后，你会更自在。',tags:['心里有张路线图','下一步已想好','变化也能接住'],contrast:'看着很从容，手机备忘录可能非常忙。',partner:'你可能会欣赏那个愿意带来新点子，也愿意和你一起把它做完的人。',color:'#7b888b'},
};
export const bonusTags=[['先给队友充个电','我来接你的话','真事比稿子好讲','换个机位找状态'],['故事还想看下去','本人感最重要','先让别人看得懂','新剪法想试试']];
export type QuizResult={version:QuizVersion;questionRevision?:QuestionRevision;scores:Record<Code,number>;leaders:Code[];secondary:Code[];kind:'single'|'dual'|'multi';bonus:string[];roleProfile?:RoleProfile};
export type SavedResult={id:string;createdAt:number;result:QuizResult};
export function signalRate(result:QuizResult,code:Code){return result.scores[code]/(result.version===1?16:result.version===2?legacyOpportunities[code]:opportunities[code]);}
export function scoreAnswers(answers:unknown,version:QuizVersion=QUIZ_VERSION,questionRevision:QuestionRevision=QUESTION_REVISION):QuizResult{
 if(version!==1&&version!==2&&version!==3)throw new Error('请刷新页面后重新开始测评。');
 if(questionRevision!==1&&questionRevision!==2)throw new Error('请刷新页面后重新开始测评。');
 if(version===3&&questionRevision!==1)throw new Error('请刷新页面后重新开始测评。');
 const bank=questionsForVersion(version,questionRevision);
 if(!Array.isArray(answers)||answers.length!==bank.length||answers.some((a,i)=>!Number.isInteger(a)||a<0||a>=bank[i].options.length))throw new Error('请完成全部'+bank.length+'道题后再提交。');
 const scores=Object.fromEntries(CODES.map(c=>[c,0])) as Record<Code,number>;
 bank.forEach((q,i)=>{if(q.key)scores[q.key[answers[i]] as Code]++;});
 const value=(c:Code)=>version===1?scores[c]:scores[c]/(version===2?legacyOpportunities[c]:opportunities[c]);
 const ranked=[...CODES].sort((a,b)=>value(b)-value(a));
 const threshold=version===1?1:version===2?1/7:0;
 const leaders=ranked.filter(c=>value(ranked[0])-value(c)<=threshold+1e-10);
 const secondary=leaders.length===1?ranked.filter(c=>c!==leaders[0]&&Math.abs(value(c)-value(ranked[1]))<1e-10):[];
 const bonus=version===3?[['镜头我来拿','故事我来想','出镜我来上','素材我来剪'][answers[6]],['先试一版再说','故事要有意思','画面先在脑中成形','心里有张时间表'][answers[11]]]:version===1?[legacyBonusTags[0][answers[9]],legacyBonusTags[1][answers[19]]]:[bonusTags[0][answers[3]],bonusTags[1][answers[9]]];
 return {version,...(version!==1?{questionRevision}:{}),...(version===3?{roleProfile:scoreRoles(answers)}:{}),scores,leaders,secondary,kind:leaders.length===1?'single':leaders.length===2?'dual':'multi',bonus};
}
export function resultTitle(result:QuizResult){return result.kind==='single'?personas[result.leaders[0]].title:result.kind==='dual'?'双重灵感配置':'多面创作配置';}
export function normalizeName(value:unknown){
 if(typeof value!=='string')throw new Error('请输入昵称。');
 if(/[<>\u0000-\u001f\u007f]/u.test(value))throw new Error('请输入1—40个字符的昵称，不含尖括号或控制字符。');
 const name=value.normalize('NFKC').trim().replace(/\s+/g,' ');
 if(name.length<1||name.length>40||/[<>]/u.test(name))throw new Error('请输入1—40个字符的昵称。');
 return name;
}
