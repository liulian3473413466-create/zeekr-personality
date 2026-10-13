import {createRoot} from 'react-dom/client';
import {useEffect,useState,lazy,Suspense} from 'react';
import QuizApp from '../components/QuizApp';
import ResultView from '../components/ResultView';
import '../app/styles.css';
import './admin.css';
const AdminApp=lazy(()=>import('../components/AdminApp'));
function App(){
 const [hash,setHash]=useState(()=>window.location.hash.slice(1));
 useEffect(()=>{const update=()=>{setHash(window.location.hash.slice(1));window.scrollTo(0,0);};window.addEventListener('hashchange',update);return()=>window.removeEventListener('hashchange',update);},[]);
 const result=hash.match(/^\/r\/([a-f0-9-]{36})$/);
 return <Suspense fallback={<div className="loading-state">正在打开…</div>}>{hash.startsWith('/admin')?<AdminApp/>:result?<ResultView key={result[1]} id={result[1]}/>:<QuizApp/>}</Suspense>;
}
createRoot(document.getElementById('root')!).render(<App/>);
