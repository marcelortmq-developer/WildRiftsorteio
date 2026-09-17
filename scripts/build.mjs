import { build } from 'esbuild';
import { writeFile } from 'node:fs/promises';
await build({entryPoints:['src/supabase-client.js'],outfile:'dist/vendor/supabase.js',bundle:true,format:'esm',platform:'browser',target:'es2022',minify:true,legalComments:'linked'});
const url=process.env.SUPABASE_URL, key=process.env.SUPABASE_PUBLISHABLE_KEY;
if (url || key) {
 if (!url || !key) throw new Error('Defina SUPABASE_URL e SUPABASE_PUBLISHABLE_KEY juntas.');
 if (!/^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/.test(url)) throw new Error('URL inválida.');
 if(key.startsWith('sb_secret_'))throw new Error('Use chave publicável, nunca secreta.');
 if(key.startsWith('eyJ') && JSON.parse(Buffer.from(key.split('.')[1],'base64url')).role!=='anon')throw new Error('Somente chave anon ou publicável.');
 if(!key.startsWith('eyJ') && !key.startsWith('sb_publishable_'))throw new Error('Chave publicável inválida.');
 await writeFile('dist/config.js',`export const config = ${JSON.stringify({supabaseUrl:url,supabasePublishableKey:key})};\n`);
}
