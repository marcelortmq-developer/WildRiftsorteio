// Trusted Node.js only. Never import this file from dist/.
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createClient} from '@supabase/supabase-js';
import {parseItems,SOURCE} from './items-source.mjs';
const args=process.argv.slice(2),dry=args.includes('--dry-run');
const sourceFile=args.includes('--html')?args[args.indexOf('--html')+1]:null;
async function fetchSafe(url){const response=await fetch(url,{signal:AbortSignal.timeout(30000),redirect:'error'});if(!response.ok)throw Error(`HTTP ${response.status}: ${url}`);return response;}
const html=sourceFile?await readFile(sourceFile,'utf8'):await(await fetchSafe(SOURCE)).text();
const catalog=parseItems(html);
if(dry){console.log(JSON.stringify({count:catalog.items.length,categories:catalog.source_categories,pools:Object.fromEntries(['Físico','Mágico','Defesa','Suporte','Botas','Tier Médio','Tier Base'].map(c=>[c,catalog.items.filter(i=>i.categories.includes(c)&&(c==='Botas'||!i.is_boot)).length]))},null,2));process.exit(0);}
const url=process.env.SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;
if(!url||!key)throw Error('Configure SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no ambiente privado.');
const client=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}}),rows=[];
// Download every image successfully BEFORE changing any catalog row.
for(const item of catalog.items){
 const response=await fetchSafe(item.source_image_url),bytes=Buffer.from(await response.arrayBuffer());
 if(!bytes.length||bytes.length>5242880)throw Error('Tamanho inválido: '+item.name);
 const ext=bytes.subarray(0,4).equals(Buffer.from([137,80,78,71]))?'png':bytes.toString('ascii',0,4)==='RIFF'&&bytes.toString('ascii',8,12)==='WEBP'?'webp':bytes[0]===255&&bytes[1]===216&&bytes[2]===255?'jpg':null;
 if(!ext)throw Error('Imagem inválida: '+item.name);
 const image_path=`${item.id}/${createHash('sha256').update(bytes).digest('hex')}.${ext}`;
 const {error}=await client.storage.from('wr-item-images').upload(image_path,bytes,{contentType:`image/${ext==='jpg'?'jpeg':ext}`,cacheControl:'31536000',upsert:true});if(error)throw error;
 rows.push({...item,image_path});
}
const {data,error}=await client.rpc('wr_sync_items',{payload:rows});if(error)throw error;
console.log(`Sincronização concluída: ${data} itens. IDs preservados; itens ausentes desativados.`);
if(args.includes('--report'))await writeFile(args[args.indexOf('--report')+1],JSON.stringify({...catalog,items:rows},null,2));
