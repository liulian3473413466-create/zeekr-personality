import {legacyQuestions,legacyBonusTags} from './quiz-v1.ts';
export const CODES = ["V", "R", "I", "N", "E", "C", "O"] as const;
export type Code = typeof CODES[number];
export type QuizVersion = 1|2;
export const QUIZ_VERSION:QuizVersion=2;
export type Question = { title: string; options: string[]; key: string | null };
export const questions:Question[] = [
 {title:'收到任务：“拍一条你的极氪日常。”你脑子里先冒出：',options:['傍晚那束光，落在车身上一定好看。','上周接朋友那一路，够讲一段了。','要不让后备厢里的东西当一次主角？','那个天天在用的功能，我想讲清楚。'],key:'VNIR'},
 {title:'第一次和组员碰面，大家客气了三分钟。你更可能：',options:['“咱们先定个小目标，今天拍成什么？”','“大家都想试哪一块？先聊聊。”','“我先来，拍砸了你们就当花絮。”','“你们有没有拍过什么特别离谱的现场？”'],key:'OCEN'},
 {title:'刷到一条很火的同款车视频，你顺手点了收藏。最可能是因为：',options:['它把一个功能讲得很明白。','这个玩法，我想换个角度试试。','这几个镜头，反复看还是觉得舒服。','这套拍法不复杂，下次真能用上。'],key:'RIVO'},
 {title:'朋友口播卡了五遍，开始说“我不行”。你会先：',options:['“先歇一下，刚才有一句其实挺自然。”','“你就跟我说，我接你的话。”','“别背稿了，从你上次真的遇到那件事讲。”','“换个位置试试，别让镜头贴这么近。”'],key:'CENV'},
 {title:'刚拍完一遍，发现根本没点录像。你的第一句更像：',options:['“没事，刚才算彩排，这遍更熟！”','“等一下，先确认声音也开了。”','“要不把这个翻车过程也拍进去？”','“先看看大家累不累，再来一遍。”'],key:'ERIC'},
 {title:'素材拍了一堆，剪到一半开始纠结。你最舍不得删的是：',options:['没在脚本里，但特别像当天的那一小段。','为了这个光，等了好久才拍到的镜头。','少了它，前后就接不起来的那一步。','能让人一下明白功能怎么用的那几秒。'],key:'NVOR'},
 {title:'想好的拍摄地点临时进不去。你更可能说：',options:['“旁边那条路挺有意思，换个拍法？”','“附近还有两处，先去离得近的。”','“人都在，先拍段聊天找找状态。”','“先找个能坐的地方，别让大家干等。”'],key:'IOEC'},
 {title:'视频发出去后，你最想收到哪条评论？',options:['“你这几个镜头，我来回看了好几遍。”','“终于有人把这个说清楚了。”','“看得很舒服，像朋友在跟我聊天。”','“这段我懂，我也有过一模一样的经历。”'],key:'VRCN'},
 {title:'组里说“这个点子有点冒险”。你通常会：',options:['“先试个十秒版本，看看有没有意思。”','“我来演一下，你们看完再判断。”','“我们还剩多久？能试就留点时间。”','“我找几张参考图，大家先看那个感觉。”'],key:'IEOV'},
 {title:'同一条片子有两个剪法，你更容易被什么说服？',options:['看完会想知道后面还发生了什么。','出镜的人说：“这版更像平时的我。”','找个没看过素材的人，看哪版更容易懂。','有个没见过的处理，第一眼就记住了。'],key:'NCRI'},
 {title:'离交片还有半小时，你最想再确认一遍：',options:['字幕、参数、功能名，有没有说错。','导出、链接、交付格式，能不能顺利交上。','封面和开头三秒，第一眼够不够好看。','把开场念一遍，听着像不像平时说话。'],key:'ROVE'},
 {title:'拍摄结束，哪句话最让你想和这群人再合作？',options:['“今天大家都挺自在，没有谁一直硬撑。”','“下次那个新点子，咱们真可以试试。”','“今天这些小插曲，我能记很久。”','“刚才你接的那句话，真的太好笑了。”'],key:'CINE'},
];
export function questionsForVersion(version:QuizVersion):Question[]{return version===1?legacyQuestions:questions;}
export function quizVersionLabel(version:QuizVersion){return version===1?'30题旧版':'12题创作版';}
export const opportunities=Object.fromEntries(CODES.map(c=>[c,questions.filter(q=>q.key?.includes(c)).length])) as Record<Code,number>;
export const personas: Record<Code, {model:string;title:string;label:string;quote:string;description:string;tags:string[];contrast:string;partner:string;color:string}> = {
 V:{model:'001',title:'人间取景器',label:'视觉关注',quote:'生活可以随便过，照片不能随便拍。',description:'别人路过一面墙，你已经看到光、颜色和一个刚刚好的角度。你的“等一下”，往往意味着大家马上会多一张好照片。',tags:['眼睛先开机','这边光好','封面让我选'],contrast:'说好只拍一张，最后只是“只选一张”。',partner:'你可能会欣赏那个能告诉你：这个画面里，正在发生什么故事的人。',color:'#e66a37'},
 R:{model:'007',title:'人间说明书',label:'分析求证',quote:'可以被种草，但得先搞明白。',description:'别人的“听说很好”，到了你这里，通常还有下半场：好在哪、怎么用、是不是适合我。你愿意多弄清一点，也常把复杂的事讲具体。',tags:['容我研究一下','细节对得上','好用要说清楚'],contrast:'本来只想买一样东西，最后顺便做完了功课。',partner:'你可能会欣赏那个能把你的三分钟解释，变成一句让人想继续听的话的人。',color:'#668eb2'},
 I:{model:'007GT',title:'周末支线玩家',label:'探索尝试',quote:'原计划很好，但旁边那条路也想看看。',description:'你很容易被“没试过”吸引。一个新角度、一条小岔路、一个突发奇想，都可能让普通的一天多出一点值得记住的内容。',tags:['要不试试','周末有支线','灵感不走直线'],contrast:'攻略收藏得很认真，真正出门以后又长出了新路线。',partner:'你可能会欣赏那个听完“要不试试”，会接着说“好，我来安排第一步”的人。',color:'#738659'},
 N:{model:'7X',title:'日常收藏家',label:'叙事记忆',quote:'别人记得去了哪里，你记得那天发生了什么。',description:'你对日常里的小剧情很敏感。一句没接上的话、一次意外的绕路、回程时突然响起的歌，都可能成为你记住一天的理由。',tags:['小事也有戏','这段值得留下','回忆有后劲'],contrast:'相册里未必全是最好看的照片，但每张都能讲出点什么。',partner:'你可能会欣赏那个听完你的故事，就知道第一镜该怎么拍的人。',color:'#b28564'},
 E:{model:'8X',title:'现场发动机',label:'表达互动',quote:'大家还在酝酿，你已经进入状态。',description:'有些人需要很久才热起来，你更愿意先说一句、先试一遍。有人接话时，你的状态会更好；镜头开起来，你也愿意边试边找到感觉。',tags:['我先来一遍','有话接得住','现场有电'],contrast:'准备好的那句未必最好，临场接的一句可能更有意思。',partner:'你可能会欣赏那个能接住你的即兴，也能帮你把精彩部分留下来的人。',color:'#d15344'},
 C:{model:'009',title:'全队舒适区',label:'关照他人',quote:'你一到场，大家就不用一直客气。',description:'有人没带伞、有人不好意思说累、有人不太想被拍——这些小信号，你常常会先注意到。和你在一起，人更容易放松下来。',tags:['细节里有照顾','不让人落单','有你就放松'],contrast:'别人的喜好记得清楚，轮到自己却容易说“我都行”。',partner:'你可能会欣赏那个也会停下来问你：“这次你想怎么拍？”的人。',color:'#957aab'},
 O:{model:'9X',title:'从容主理人',label:'组织推进',quote:'你的“没事”，后面通常已经有了下一步。',description:'几个人的想法、时间和安排混在一起时，你习惯先抓住重点。什么时候出发、先做哪件事、临时变化怎么办——想清楚之后，你会更自在。',tags:['心里有张路线图','下一步已想好','变化也能接住'],contrast:'看着很从容，手机备忘录可能非常忙。',partner:'你可能会欣赏那个愿意带来新点子，也愿意和你一起把它做完的人。',color:'#7b888b'},
};
export const bonusTags=[['先给队友充个电','我来接你的话','真事比稿子好讲','换个机位找状态'],['故事还想看下去','本人感最重要','先让别人看得懂','新剪法想试试']];
export type QuizResult={version:QuizVersion;scores:Record<Code,number>;leaders:Code[];secondary:Code[];kind:'single'|'dual'|'multi';bonus:string[]};
export type SavedResult={id:string;createdAt:number;result:QuizResult};
export function signalRate(result:QuizResult,code:Code){return result.scores[code]/(result.version===1?16:opportunities[code]);}
export function scoreAnswers(answers:unknown,version:QuizVersion=QUIZ_VERSION):QuizResult{
 if(version!==1&&version!==2)throw new Error('请刷新页面后重新开始测评。');
 const bank=questionsForVersion(version);
 if(!Array.isArray(answers)||answers.length!==bank.length||answers.some((a,i)=>!Number.isInteger(a)||a<0||a>=bank[i].options.length))throw new Error('请完成全部'+bank.length+'道题后再提交。');
 const scores=Object.fromEntries(CODES.map(c=>[c,0])) as Record<Code,number>;
 bank.forEach((q,i)=>{if(q.key)scores[q.key[answers[i]] as Code]++;});
 const value=(c:Code)=>version===1?scores[c]:scores[c]/opportunities[c];
 const ranked=[...CODES].sort((a,b)=>value(b)-value(a));
 const threshold=version===1?1:1/7;
 const leaders=ranked.filter(c=>value(ranked[0])-value(c)<=threshold+1e-10);
 const secondary=leaders.length===1?ranked.filter(c=>c!==leaders[0]&&Math.abs(value(c)-value(ranked[1]))<1e-10):[];
 const bonus=version===1?[legacyBonusTags[0][answers[9]],legacyBonusTags[1][answers[19]]]:[bonusTags[0][answers[3]],bonusTags[1][answers[9]]];
 return {version,scores,leaders,secondary,kind:leaders.length===1?'single':leaders.length===2?'dual':'multi',bonus};
}
export function resultTitle(result:QuizResult){return result.kind==='single'?personas[result.leaders[0]].title:result.kind==='dual'?'双重灵感配置':'多面创作配置';}
export function normalizeName(value:unknown){
 if(typeof value!=='string')throw new Error('请输入昵称。');
 if(/[<>\u0000-\u001f\u007f]/u.test(value))throw new Error('请输入1—40个字符的昵称，不含尖括号或控制字符。');
 const name=value.normalize('NFKC').trim().replace(/\s+/g,' ');
 if(name.length<1||name.length>40||/[<>]/u.test(name))throw new Error('请输入1—40个字符的昵称。');
 return name;
}
