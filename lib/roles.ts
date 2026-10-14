export const ROLES=['camera','director','presenter','editor'] as const;
export type Role=typeof ROLES[number];
export const roleNames:Record<Role,string>={camera:'摄影',director:'编导',presenter:'出镜',editor:'剪辑'};
export const levelNames=['尚未尝试','需要指导','能独立完成基础版','能独立完成并优化'];
export const collaborationNames=[['主动热场','照顾队友','先问清楚','安排顺序'],['先试一版','先理故事','先看画面','先看时间']];
export type RoleProfile={
 levels:Record<Role,number>; fit:Record<Role,number>;
 recent:Role|null; preferred:Role; backup:Role|null;
 collaboration:[number,number];
};
// These are self-reports, not verified professional qualifications.
// Role fit = 80% readiness + 20% interest. Group scoring applies its own 80/20 split.
export function scoreRoles(answers:number[]):RoleProfile{
 const recent=ROLES[answers[0]]??null,preferred=ROLES[answers[6]],backup=ROLES[answers[8]]??null;
 const levels=Object.fromEntries(ROLES.map((r,i)=>[r,3-answers[i+1]])) as Record<Role,number>;
 const fit=Object.fromEntries(ROLES.map((r,i)=>{
  const readiness=.65*levels[r]/3+.20*Number(recent===r)+.15*Number(backup===r);
  const interest=([5,7,9].reduce((n,q)=>n+Number(answers[q]===i),0)+2*Number(preferred===r))/5;
  return [r,Math.round((.8*readiness+.2*interest)*10000)/100];
 })) as Record<Role,number>;
 return {levels,fit,recent,preferred,backup,collaboration:[answers[10],answers[11]]};
}
export function rankedRoles(profile:RoleProfile){return [...ROLES].sort((a,b)=>profile.levels[b]-profile.levels[a]||profile.fit[b]-profile.fit[a]||ROLES.indexOf(a)-ROLES.indexOf(b));}
export function primaryRoleLabel(profile:RoleProfile){const r=rankedRoles(profile)[0];return profile.levels[r]>=2?roleNames[r]+'（自报可独立）':'待培养 · 想做'+roleNames[profile.preferred];}
