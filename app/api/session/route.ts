import { apiError,createSession,json,participant,status } from '@/lib/server';
export async function POST(request:Request){try{return await createSession(request);}catch(error){return apiError(error);}}
export async function GET(request:Request){try{const person=await participant(request);return person?json({identity:person.participant_key,...await status(person.participant_key)}):json({error:'尚未登记姓名。'},401);}catch(error){return apiError(error);}}
