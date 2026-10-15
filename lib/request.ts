export const NETWORK_ERROR='暂时连接不上测评服务，请稍后重试。';
export const TIMEOUT_ERROR='连接超时，请稍后重试。';

// One attempt only: retrying a write belongs to the user and its existing requestId.
export async function request(input:RequestInfo|URL,init:RequestInit={},timeoutMs=15000):Promise<Response>{
 const external=init.signal??(input instanceof Request?input.signal:undefined);
 const cancelled=()=>new DOMException('请求已取消。','AbortError');
 if(external?.aborted)throw cancelled();
 const controller=new AbortController();let timedOut=false;
 const onAbort=()=>controller.abort();
 external?.addEventListener('abort',onAbort,{once:true});
 const timer=setTimeout(()=>{timedOut=true;controller.abort();},timeoutMs);
 try{
  const response=await fetch(input,{...init,signal:controller.signal});
  // Include the JSON body download in the deadline, not just the response headers.
  const body=await response.arrayBuffer();
  return new Response([204,205,304].includes(response.status)?null:body,{status:response.status,statusText:response.statusText,headers:response.headers});
 }catch(error){
  if(external?.aborted)throw cancelled();
  if(timedOut)throw new Error(TIMEOUT_ERROR);
  if(error instanceof Error&&error.name==='AbortError')throw error;
  throw new Error(NETWORK_ERROR);
 }finally{
  clearTimeout(timer);external?.removeEventListener('abort',onAbort);
 }
}

export function loginErrorMessage(error:{name?:string;message?:string;code?:string;status?:number}):string{
 if(error.code==='invalid_credentials'||error.message==='Invalid login credentials')return '邮箱或密码不正确，请重新输入。';
 if(error.message===TIMEOUT_ERROR)return TIMEOUT_ERROR;
 if(error.name==='AuthRetryableFetchError'||error.status===0||error.message===NETWORK_ERROR)return NETWORK_ERROR;
 if(error.status===429)return '登录尝试过于频繁，请稍后重试。';
 return '登录暂时失败，请稍后重试。';
}
