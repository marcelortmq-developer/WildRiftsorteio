import {config} from './config.js';
import {mergeOverrides, mergeCatalog, persistEdit, validateImageFile} from './shared-core.js';
export const configured=Boolean(config.supabaseUrl && config.supabasePublishableKey);
let clientPromise;
export async function getClient(){
 if(!configured)throw new Error('A administração ainda não foi configurada.');
 if(!clientPromise)clientPromise=import('./vendor/supabase.js').then(({createClient})=>createClient(config.supabaseUrl,config.supabasePublishableKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false,storageKey:'wr-admin-auth'}})).catch(error=>{clientPromise=null;throw error;});
 return clientPromise;
}
export async function loadShared(base){
 if(!configured)return mergeOverrides(base,[],()=> '');
 const client=await getClient();
 const [overrides,additions]=await Promise.all([client.from('wr_champion_overrides').select('champion_id,rotas,image_path,version'),client.from('wr_champion_additions').select('champion_id,nome,rotas,link,image_path')]);
 const {data,error}=overrides;
 if(error||additions.error)throw new Error('Não foi possível atualizar os campeões. Verifique sua conexão.');
 const imageUrl=path=>client.storage.from('wr-champion-images').getPublicUrl(path).data.publicUrl;
 return mergeOverrides(mergeCatalog(base,additions.data,imageUrl),data,imageUrl);
}
export async function isAdmin(){
 if(!configured)return false;
 const client=await getClient();
 const {data:{user},error}=await client.auth.getUser();
 if(error || !user)return false;
 const {data,error:adminError}=await client.from('wr_admins').select('user_id').eq('user_id',user.id).maybeSingle();
 if(adminError)throw new Error('Não foi possível verificar seu acesso de administrador.');
 return Boolean(data);
}
export async function signIn(email,password){
 const client=await getClient();
 const {error}=await client.auth.signInWithPassword({email,password});
 if(error)throw new Error('Não foi possível entrar. Confira seu e-mail e senha.');
 if(!await isAdmin()){await client.auth.signOut();throw new Error('Esta conta não está cadastrada como administradora.');}
}
export async function signOut(){const {error}=await (await getClient()).auth.signOut({scope:'local'});if(error)throw new Error('Não foi possível sair. Tente novamente.');}
export async function watchAuth(callback){const client=await getClient();return client.auth.onAuthStateChange(()=>setTimeout(callback,0));}
export async function prepareImage(file){
 validateImageFile(file);
 let bitmap;
 try{bitmap=await createImageBitmap(file);}catch{throw new Error('Não foi possível abrir essa imagem. Escolha outro arquivo.');}
 try{
  if(bitmap.width>8192 || bitmap.height>8192)throw new Error('A imagem deve ter no máximo 8192 pixels em cada lado.');
  const scale=Math.min(1,1200/Math.max(bitmap.width,bitmap.height));
  const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(bitmap.width*scale));canvas.height=Math.max(1,Math.round(bitmap.height*scale));
  canvas.getContext('2d').drawImage(bitmap,0,0,canvas.width,canvas.height);
  return await new Promise((resolve,reject)=>canvas.toBlob(blob=>blob && blob.type==='image/webp'?resolve(blob):reject(new Error('Este navegador não conseguiu preparar a imagem.')),'image/webp',0.85));
 }finally{bitmap.close();}
}
export async function saveChampion({champion,rotas,imageBlob,removeImage}){
 const client=await getClient();if(!await isAdmin())throw new Error('Entre com uma conta de administrador para salvar.');
 let imagePath=removeImage?'':champion.image_path,uploadedPath;
 if(imageBlob){
  uploadedPath=`${champion.id}/${crypto.randomUUID()}.webp`;
  const {error}=await client.storage.from('wr-champion-images').upload(uploadedPath,imageBlob,{contentType:'image/webp',cacheControl:'31536000',upsert:false});
  if(error)throw new Error('O upload falhou. Nenhuma alteração foi salva. Tente novamente.');
  imagePath=uploadedPath;
 }
 try{return await persistEdit(client,{id:champion.id,rotas,imagePath,version:champion.version});}
 catch(error){
  // Não exclua o upload em uma falha de rede: o banco pode ter confirmado a gravação.
  // Arquivos sem referência podem ser revisados no Storage depois.
  throw error;
 }
}
