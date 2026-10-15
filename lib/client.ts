import {createClient} from '@supabase/supabase-js';
import type {SavedResult} from './quiz';
import {request} from './request';
const url=import.meta.env.VITE_SUPABASE_URL||'';
const backendUrl=(import.meta.env.VITE_SUPABASE_PROXY_URL?.trim()||url).replace(/\/+$/,'');
const key=import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY||'';
export const configured=Boolean(url&&key);
export const authClient=createClient(backendUrl||'https://not-configured.supabase.co',key||'not-configured',{global:{fetch:request},auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false,storageKey:'zeekr-admin-auth'}});
const SESSION='zeekr-participant-token-v2';
let participantToken:string|undefined;
function sessionToken(){if(participantToken)return participantToken;try{return sessionStorage.getItem(SESSION)||undefined;}catch{return undefined;}}
export function homeUrl(){return window.location.pathname;}
export function resultUrl(id:string){return window.location.origin+window.location.pathname+'#/r/'+id;}
export function goResult(id:string){window.location.assign(homeUrl()+'#/r/'+id);}
export function goHome(again=false){window.location.assign(homeUrl()+(again?'?again=1':''));}
export async function api<T=SessionStatus>(path:string,body?:unknown,options:{signal?:AbortSignal;admin?:boolean}={}):Promise<T>{
 if(!configured)throw new Error('服务尚未配置，请联系活动运营。');
 const headers:Record<string,string>={'Content-Type':'application/json','apikey':key};
 if(options.admin){const {data}=await authClient.auth.getSession();if(data.session)headers.Authorization='Bearer '+data.session.access_token;}
 else {const token=sessionToken();if(token)headers['X-Quiz-Session']=token;}
 const response=await request(backendUrl+'/functions/v1/quiz-api'+path,{method:body===undefined?'GET':'POST',headers,body:body===undefined?undefined:JSON.stringify(body),signal:options.signal,cache:'no-store'});
 let data;try{data=await response.json();}catch{throw new Error('服务暂时没有正常响应，请稍后重试。');}
 if(!response.ok)throw Object.assign(new Error(data.error||'连接失败，请重试。'),{status:response.status});
 if(path==='/session'&&data.token){participantToken=data.token;try{sessionStorage.setItem(SESSION,data.token);}catch{}delete data.token;}
 return data;
}
export type SessionStatus={identity:string;remaining:number;used:number;id?:string};
export type AdminResult=SavedResult&{participantId:string;answers:number[];source:string};
export type Participant={id:string;name:string;createdAt:number;team:number|null;note:string;selectedResultId:string|null;progress:number;progressTotal?:number;lastSeen:number;results:AdminResult[]};
export type AdminData={participants:Participant[];version:number;adminEmail:string};
