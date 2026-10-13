import {personas,type SavedResult} from '@/lib/quiz';
import {Vehicle} from './Vehicle';

export default function ResultCard({saved,qr}:{saved:SavedResult;qr:string}){
 const r=saved.result;
 // Leaders are ranked by score; exact ties keep the existing stable code order.
 // Only presentation is reduced to one persona. Stored scores remain intact for operators.
 const primaryCode=r.leaders[0];
 const primary=personas[primaryCode];
 return <article className="result-card" id="result-card">
  <div className="result-card-top"><span className="brand-word">ZEEKR<span className="brand-dot">•</span></span><span>PERSONALITY / 01</span></div>
  <div className="result-hero" style={{'--persona-color':primary.color} as React.CSSProperties}>
   <div className="result-eyebrow">你的极氪人格 · 已解锁</div>
   <div className="result-models">{primary.model}</div>
   <Vehicle code={primaryCode} entrance/>
   <h1>{primary.title}</h1>
   <p className="result-quote">{primary.quote}</p>
   <div className="tags">{primary.tags.map(tag=><span key={tag}>#{tag}</span>)}</div>
  </div>
  <div className="result-body">
   <section className="analysis-block">
    <div className="section-kicker">01 / 生活里的你</div>
    <p>{primary.description}</p>
    <div className="contrast"><span>小小反差</span><p>{primary.contrast}</p></div>
   </section>
   <section className="analysis-block">
    <div className="section-kicker">日常彩蛋 / THAT'S SO YOU</div>
    <div className="bonus-tags">{r.bonus.map(t=><span key={t}>✳ #{t}</span>)}</div>
   </section>
   <section className="partner-block">
    <div className="section-kicker">搭档线索 / TO BE CONTINUED</div>
    <p>{primary.partner}</p>
    <div className="partner-foot">你的队伍，训练营见。<span>↗</span></div>
   </section>
   <div className="result-foot">
    <div><b>每一种你，都有自己的光。</b><p>极氪 KOC 创作训练营<br/>扫码查看这份人格结果</p></div>
    {qr?<img src={qr} alt="查看此结果的二维码" width="84" height="84"/>:<div className="qr-placeholder"/>}
   </div>
   <p className="result-disclaimer">本测评呈现本次作答的相对倾向，仅用于活动交流与组队参考。车型人格为创意设定，不是心理诊断或能力评级。分享结果不展示真实姓名。</p>
   <div className="result-serial"><span>CONFIGURATION / {saved.id.slice(0,8).toUpperCase()}</span><span>{new Date(saved.createdAt).toLocaleDateString('zh-CN',{timeZone:'Asia/Shanghai'})}</span></div>
  </div>
 </article>;
}
