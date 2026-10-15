import {personas,type SavedResult} from '@/lib/quiz';
export default function ResultCard({saved,qr}:{saved:SavedResult;qr:string}){
 const primary=personas[saved.result.leaders[0]];
 return <article className="result-card" id="result-card">
 <div className="result-card-top"><span className="brand-word">ZEEKR</span><span>你的创作人设</span></div>
 <div className="result-hero" style={{'--persona-color':primary.color} as React.CSSProperties}><div className="result-eyebrow">你的创作人设 · 已解锁</div><h1>{primary.title}</h1></div>
 <div className="result-body"><section className="partner-block" aria-label="好友匹配提示"><h2 style={{fontSize:'clamp(22px,5vw,30px)',lineHeight:1.6,margin:'0 0 16px'}}>我们正在根据您的创作人设帮您匹配您的好友...</h2><p>活动运营团队将结合测评结果安排分组，请留意活动大群通知。</p></section>
 <div className="result-foot"><div><b>北京见，创作搭子！</b><p>极氪 KOC 创作活动<br/>扫码查看这份人设结果</p></div>{qr?<img src={qr} alt="查看此结果的二维码" width="84" height="84"/>:null}</div><p className="result-disclaimer">测评仅供活动交流与组队参考，不是能力评级。分享结果不展示昵称或姓名。</p></div></article>;
}
