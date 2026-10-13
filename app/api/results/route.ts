import { apiError,submit } from '@/lib/server';
export async function POST(request:Request){try{return await submit(request);}catch(error){return apiError(error);}}
