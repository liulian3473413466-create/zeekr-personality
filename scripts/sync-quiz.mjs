import {copyFileSync,mkdirSync} from 'node:fs';
mkdirSync('supabase/functions/_shared',{recursive:true});
copyFileSync('lib/quiz.ts','supabase/functions/_shared/quiz.ts');
