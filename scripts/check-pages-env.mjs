const url=process.env.VITE_SUPABASE_URL||'';
const key=process.env.VITE_SUPABASE_PUBLISHABLE_KEY||'';
if(!/^https:\/\/[a-z0-9]+\.supabase\.co$/.test(url)||url.includes('quiz-test')||!key.startsWith('sb_publishable_'))throw new Error('Production Supabase URL / publishable key must be configured before publishing.');
const proxy=new URL(process.env.VITE_SUPABASE_PROXY_URL||'https://missing.invalid');
if(proxy.protocol!=='https:'||proxy.username||proxy.password||proxy.search||proxy.hash||proxy.pathname.replace(/\/$/,'')!=='/koc-quiz-backend')throw new Error('The mobile-accessible HTTPS quiz relay must be configured before publishing.');
