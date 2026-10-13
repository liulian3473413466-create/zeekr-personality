import { apiError,getResult,json } from '@/lib/server';
export async function GET(_request:Request,{params}:{params:Promise<{id:string}>}){try{const {id}=await params;const result=await getResult(id);return result?json(result):json({error:'没有找到这份结果，请确认链接完整。'},404);}catch(error){return apiError(error);}}
