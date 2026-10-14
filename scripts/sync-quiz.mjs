import {copyFileSync,mkdirSync} from 'node:fs';
mkdirSync('supabase/functions/_shared',{recursive:true});
copyFileSync('lib/quiz.ts','supabase/functions/_shared/quiz.ts');
copyFileSync('lib/quiz-v1.ts','supabase/functions/_shared/quiz-v1.ts');

copyFileSync('lib/quiz-v2.ts','supabase/functions/_shared/quiz-v2.ts');

copyFileSync('lib/quiz-v2-intuitive.ts','supabase/functions/_shared/quiz-v2-intuitive.ts');
copyFileSync('lib/quiz-v3.ts','supabase/functions/_shared/quiz-v3.ts');
copyFileSync('lib/roles.ts','supabase/functions/_shared/roles.ts');