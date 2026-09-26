import {createClient} from 'npm:@supabase/supabase-js@2.116.0';
import {load} from 'npm:cheerio@1.1.2';
import {CORE,parseRoster,parseChampion} from './parser.mjs';
const hex=(b:ArrayBuffer)=>Array.from(new Uint8Array(b),v=>v.toString(16).padStart(2,'0')).join('');
async function source(url:string){const r=await fetch(url,{signal:AbortSignal.timeout(20000),redirect:'error'});if(!r.ok)throw Error('Source HTTP '+r.status);return r;}
Deno.serve(async req=>{
 if(req.method!=='POST')return new Response('Method not allowed',{status:405});
 const token=req.headers.get('x-wr-sync-token');if(!token)return new Response('Unauthorized',{status:401});
 const db=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,{auth:{persistSession:false}});
 const {data:config,error:configError}=await db.from('wr_champion_sync_config').select('token_hash').eq('id',1).single();
 if(configError||hex(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(token)))!==config.token_hash)return new Response('Unauthorized',{status:401});
 let discovered=0,added=0;
 try{
 const roster=parseRoster(await(await source(CORE+'/champions/')).text(),load);discovered=roster.length;
 const {data:known,error}=await db.from('wr_champion_catalog').select('champion_id');if(error)throw error;
 const ids=new Set(known.map(r=>r.champion_id.replaceAll('-',''))),pending=roster.filter(r=>!ids.has(r.champion_id.replaceAll('-','')));if(pending.length>10)throw Error('Unexpected roster growth; manual review required');
 for(const record of pending){
 const c=parseChampion(await(await source(record.link)).text(),record,load),bytes=new Uint8Array(await(await source(c.source_image_url)).arrayBuffer());
 if(bytes.length<12||bytes.length>5242880||new TextDecoder().decode(bytes.slice(0,4))!=='RIFF'||new TextDecoder().decode(bytes.slice(8,12))!=='WEBP')throw Error('Invalid WebP for '+c.champion_id);
 const image_path=c.champion_id+'/'+crypto.randomUUID()+'.webp';const {error:uploadError}=await db.storage.from('wr-champion-images').upload(image_path,bytes,{contentType:'image/webp',cacheControl:'31536000'});if(uploadError)throw uploadError;
 const {data:inserted,error:insertError}=await db.rpc('wr_add_discovered_champion',{record:{...c,image_path}});if(insertError)throw insertError;if(inserted)added++;
 }
 const {error:logError}=await db.from('wr_champion_sync_runs').insert({success:true,discovered,added});if(logError)throw logError;
 return Response.json({success:true,discovered,added});
 }catch(e){const message=String(e instanceof Error?e.message:e).slice(0,500);await db.from('wr_champion_sync_runs').insert({success:false,discovered,added,error:message});console.error(message);return Response.json({success:false,error:message},{status:500});}
});
