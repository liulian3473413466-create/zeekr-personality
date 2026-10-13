const url=process.env.VITE_SUPABASE_URL||'';
const key=process.env.VITE_SUPABASE_PUBLISHABLE_KEY||'';
if(!/^https:\/\/[a-z0-9]+\.supabase\.co$/.test(url)||url.includes('quiz-test')||!key.startsWith('sb_publishable_'))throw new Error('Production Supabase URL / publishable key must be configured before publishing.');
