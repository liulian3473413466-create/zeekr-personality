import {createClient} from '@supabase/supabase-js';
import type {SavedResult} from './quiz';
const url=import.meta.env.VITE_SUPABASE_URL||'';
const key=import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY||'';
export const configured=Boolean(url&&key);
export const authClient=createClient(url||'https://not-configured.supabase.co',key||'not-configured',{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false,storageKey:'zeekr-admin-auth'}});
const SESSION='zeekr-participant-token-v2';
export function homeUrl(){return window.location.pathname;}
export function resultUrl(id:string){return window.location.origin+window.location.pathname+'#/r/'+id;}
export function goResult(id:string){window.location.assign(homeUrl()+'#/r/'+id);}
export function goHome(again=false){window.location.assign(homeUrl()+(again?'?again=1':''));}
export async function api<T=SessionStatus>(path:string,body?:unknown,options:{signal?:AbortSignal;admin?:boolean}={}):Promise<T>{
 if(!configured)throw new Error('服务尚未配置，请联系活动运营。');
 const headers:Record<string,string>={'Content-Type':'application/json','apikey':key};
 if(options.admin){const {data}=await authClient.auth.getSession();if(data.session)headers.Authorization='Bearer '+data.session.access_token;}
 else {const token=sessionStorage.getItem(SESSION);if(token)headers['X-Quiz-Session']=token;}
 const response=await fetch(url+'/functions/v1/quiz-api'+path,{method:body===undefined?'GET':'POST',headers,body:body===undefined?undefined:JSON.stringify(body),signal:options.signal,cache:'no-store'});
 const data=await response.json();
 if(!response.ok)throw Object.assign(new Error(data.error||'连接失败，请重试。'),{status:response.status});
 if(path==='/session'&&data.token){sessionStorage.setItem(SESSION,data.token);delete data.token;}
 return data;
}
export type SessionStatus={identity:string;remaining:number;used:number;id?:string};
export type AdminResult=SavedResult&{participantId:string;answers:number[];source:string};
export type Participant={id:string;name:string;createdAt:number;team:number|null;note:string;selectedResultId:string|null;progress:number;lastSeen:number;results:AdminResult[]};
export type AdminData={participants:Participant[];version:number;adminEmail:string};
