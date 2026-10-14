import {createClient} from 'npm:@supabase/supabase-js@2.117.3';
import {normalizeName,scoreAnswers,questionsForVersion,type QuizVersion} from '../_shared/quiz.ts';
const db=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,{auth:{persistSession:false,autoRefreshToken:false}});
const cors={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'authorization,apikey,content-type,x-quiz-session,x-client-info','Access-Control-Allow-Methods':'GET,POST,OPTIONS','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};
const json=(data:unknown,status=200)=>new Response(JSON.stringify(data),{status,headers:{...cors,'Content-Type':'application/json; charset=utf-8'}});
const uuid=(x:unknown):x is string=>typeof x==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(x);
const hash=async(s:string)=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s))),v=>v.toString(16).padStart(2,'0')).join('');
class ApiError extends Error{constructor(message:string,public status=400){super(message);}}
function bankVersion(input:any):QuizVersion{const v=input.quizVersion??1;if(v!==1&&v!==2&&v!==3)throw new ApiError('请刷新页面后重新开始测评。');return v;}
function checked<T>({data,error}:{data:T;error:unknown}):T{if(error)throw error;return data;}
async function body(req:Request){if(!req.headers.get('content-type')?.includes('application/json'))throw new ApiError('请求格式不正确。');const raw=await req.text();if(raw.length>64000)throw new ApiError('提交内容过长。');try{return JSON.parse(raw);}catch{throw new ApiError('请求格式不正确。');}}
async function session(req:Request){const token=req.headers.get('x-quiz-session');if(!token||token.length!==72)throw new ApiError('请先输入昵称，再开始测评。',401);const tokenHash=await hash(token);const row=checked(await db.from('quiz_sessions').select('*').eq('token_hash',tokenHash).gt('expires_at',new Date().toISOString()).maybeSingle());if(!row)throw new ApiError('答题会话已过期，请重新输入昵称。',401);return row;}
async function status(id:string){const {count,error}=await db.from('quiz_results').select('id',{head:true,count:'exact'}).eq('participant_id',id);if(error)throw error;return {identity:id,used:count||0,remaining:Math.max(0,3-(count||0))};}
async function requireAdmin(req:Request){const token=req.headers.get('authorization')?.replace(/^Bearer /i,'');if(!token)throw new ApiError('请先登录管理后台。',401);const {data,error}=await db.auth.getUser(token);if(error||!data.user)throw new ApiError('登录已失效，请重新登录。',401);const admin=checked(await db.from('quiz_admins').select('user_id').eq('user_id',data.user.id).eq('active',true).maybeSingle());if(!admin)throw new ApiError('此账号没有管理权限。',403);return data.user;}
const saved=(r:any)=>({id:r.id,createdAt:Date.parse(r.created_at),result:r.result});
async function allRows(table:string,columns:string){const rows:any[]=[];for(let offset=0;;offset+=1000){const page=checked(await db.from(table).select(columns).order(table==='quiz_sessions'?'token_hash':'id').range(offset,offset+999));rows.push(...page);if(page.length<1000)break;}return rows;}

Deno.serve(async(req:Request)=>{
 if(req.method==='OPTIONS')return new Response(null,{status:204,headers:cors});
 try{
  const path=new URL(req.url).pathname.replace(/^.*\/quiz-api/,'')||'/';
  if(path==='/health'&&req.method==='GET')return json({ok:true,version:'1.4.0',quizVersion:3,questionRevision:1});
  if(path==='/session'&&req.method==='POST'){
   const input=await body(req);const name=normalizeName(input.name);const version=bankVersion(input);const nameKey=await hash(name.toLocaleLowerCase('zh-CN').replace(/\s/g,''));const token=crypto.randomUUID()+crypto.randomUUID();
   const data=checked(await db.rpc('quiz_start',{p_name_key:nameKey,p_name:name,p_token_hash:await hash(token)}));if(version!==1)checked(await db.from('quiz_sessions').update({quiz_version:version}).eq('token_hash',await hash(token)));return json({...data,token});
  }
  if(path==='/session'&&req.method==='GET')return json(await status((await session(req)).participant_id));
  if(path==='/progress'&&req.method==='POST'){
   const s=await session(req);const input=await body(req);if(input.identity!==s.participant_id)throw new ApiError('答题身份已变化，请返回首页。',409);
   const version=bankVersion(input);if(!Number.isInteger(input.answered)||input.answered<0||input.answered>questionsForVersion(version).length)throw new ApiError('答题进度不正确。');
   checked(await db.from('quiz_sessions').update({answered_count:input.answered,quiz_version:version,last_seen:new Date().toISOString()}).eq('token_hash',s.token_hash));return json({ok:true});
  }
  if(path==='/results'&&req.method==='POST'){
   const s=await session(req);const input=await body(req);if(input.identity!==s.participant_id)throw new ApiError('答题身份已变化，请返回首页。',409);if(!uuid(input.requestId))throw new ApiError('本次答题标识已失效，请重新开始。');
   const revision=input.questionRevision??1;if(revision!==1&&revision!==2)throw new ApiError('请刷新页面后重新开始测评。');
   const result=scoreAnswers(input.answers,bankVersion(input),revision);const {data,error}=await db.rpc('quiz_submit',{p_token_hash:s.token_hash,p_request_id:input.requestId,p_answers:input.answers,p_result:result});
   if(error?.message.includes('LIMIT_REACHED'))throw new ApiError('这个昵称已完成3次测评，不能继续提交。',409);
   if(error?.message.includes('SESSION_EXPIRED'))throw new ApiError('答题会话已过期，请重新输入昵称。',401);
   if(error)throw error;return json(data);
  }
  if(path.startsWith('/results/')&&req.method==='GET'){
   const id=path.slice(9);if(!uuid(id))throw new ApiError('找不到这份结果。',404);
   const row=checked(await db.from('quiz_results').select('id,result,created_at').eq('id',id).maybeSingle());if(!row)throw new ApiError('找不到这份结果。',404);const publicResult=saved(row);const {roleProfile:_,...persona}=publicResult.result;return json({...publicResult,result:persona});
  }
  if(path==='/bootstrap'&&req.method==='POST'){
   const input=await body(req);if(typeof input.token!=='string'||input.token.length!==64||typeof input.password!=='string'||input.password.length<12||input.password.length>128)throw new ApiError('请设置12—128位的后台密码。');
   const tokenHash=await hash(input.token);const setup=checked(await db.from('quiz_setup').select('email').eq('token_hash',tokenHash).gt('expires_at',new Date().toISOString()).maybeSingle());if(!setup)throw new ApiError('初始化链接已过期或已使用，请联系网站维护人员。',403);
   const {data,error}=await db.auth.admin.createUser({email:setup.email,password:input.password,email_confirm:true});if(error||!data.user)throw new ApiError('管理员账户未能创建，请检查是否已有同邮箱账户。',409);
   const granted=await db.from('quiz_admins').insert({user_id:data.user.id});if(granted.error)throw granted.error;
   checked(await db.from('quiz_setup').delete().eq('token_hash',tokenHash));return json({email:setup.email});
  }
  if(path.startsWith('/admin')){
   const admin=await requireAdmin(req);
   if(path==='/admin'&&req.method==='GET'){
    const [people,results,sessions,state]=await Promise.all([allRows('quiz_participants','*'),allRows('quiz_results','*'),allRows('quiz_sessions','token_hash,participant_id,answered_count,quiz_version,last_seen'),db.from('quiz_team_state').select('version').eq('id',true).single()]);
    return json({adminEmail:admin.email,version:checked(state).version,participants:people.map(p=>{const recent=sessions.filter(s=>s.participant_id===p.id).sort((a,b)=>Date.parse(b.last_seen)-Date.parse(a.last_seen))[0];return {id:p.id,name:p.name,createdAt:Date.parse(p.created_at),team:p.team,note:p.note,selectedResultId:p.selected_result_id,progress:recent?.answered_count||0,progressTotal:recent?.quiz_version===1?30:12,lastSeen:Date.parse(recent?.last_seen||p.created_at),results:results.filter(r=>r.participant_id===p.id).sort((a,b)=>Date.parse(b.created_at)-Date.parse(a.created_at)).map(r=>({...saved(r),answers:r.answers,source:r.source,participantId:p.id}))};})});
   }
   if(path==='/admin/teams'&&req.method==='POST'){
    const input=await body(req);if(!Number.isInteger(input.version)||!Array.isArray(input.assignments)||input.assignments.length>500)throw new ApiError('分组数据格式不正确。');
    for(const p of input.assignments){if(!uuid(p.id)||(p.team!==null&&![1,2,3,4].includes(p.team))||typeof p.note!=='string'||p.note.length>1000||(p.selectedResultId!==null&&!uuid(p.selectedResultId)))throw new ApiError('分组数据格式不正确。');}
    const {data,error}=await db.rpc('quiz_save_teams',{p_version:input.version,p_assignments:input.assignments});
    if(error?.message.includes('VERSION_CONFLICT'))throw new ApiError('其他管理员已更新分组，请先刷新后重新调整。',409);
    if(error?.message.includes('TEAM_FULL'))throw new ApiError('每组最多4人，请调整后保存。',409);
    if(error)throw error;return json({version:data});
   }
  }
  throw new ApiError('接口不存在。',404);
 }catch(error){
  if(error instanceof ApiError)return json({error:error.message},error.status);
  if(error instanceof Error&&/^(请输入|请完成|请刷新)/.test(error.message))return json({error:error.message},400);
  console.error('quiz-api request failed',error instanceof Error?error.message:'database failure');
  return json({error:'暂时没能连接数据服务，请稍后重试。'},503);
 }
});
