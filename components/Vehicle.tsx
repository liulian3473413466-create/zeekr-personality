import {useEffect,useRef,useState} from 'react';
import {personas,type Code} from '@/lib/quiz';

export function Vehicle({code,entrance=false,onReady,onError}:{code:Code;entrance?:boolean;onReady?:()=>void;onError?:()=>void}){
 const model=personas[code].model;
 const src=`${import.meta.env.BASE_URL}cars/${model.toLowerCase()}.png`;
 const photo=useRef<HTMLImageElement>(null);
 const [ready,setReady]=useState(false);
 useEffect(()=>{
  let active=true;
  setReady(false);
  const fail=()=>{if(active){active=false;onError?.();}};
  const timeout=setTimeout(fail,20000);
  // Decode the actual displayed image before making the card visible or starting its animation.
  photo.current!.decode().then(()=>{
   if(!active)return;
   setReady(true);
   onReady?.();
  }).catch(fail).finally(()=>clearTimeout(timeout));
  return()=>{active=false;clearTimeout(timeout);};
 },[src,onReady,onError]);
 return <figure className={`vehicle-stage ${entrance&&ready?'vehicle-entrance':''}`}><div className="vehicle-ground"/><img ref={photo} className="vehicle-photo" src={src} alt={`极氪 ${model} 实车图`} width="960" height="640" decoding="async" fetchPriority="high"/></figure>;
}
