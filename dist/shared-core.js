import { ROUTES, validate } from './core.js';
export const championId = c => new URL(c.link).pathname.split('/').filter(Boolean).at(-1);
export function validRoutes(routes) {
 return Array.isArray(routes) && routes.length > 0 && routes.length <= 5 && new Set(routes).size === routes.length && routes.every(r => ROUTES.includes(r));
}
export function validateImageFile(file) {
 if(!file || !['image/jpeg','image/png','image/webp'].includes(file.type))throw new Error('Escolha uma imagem JPG, PNG ou WebP.');
 if(file.size === 0 || file.size > 5 * 1024 * 1024)throw new Error('A imagem deve ter no máximo 5 MB e não pode estar vazia.');
}
export function mergeOverrides(base, rows, publicImageUrl) {
 const overrides = new Map(rows.map(row => [row.champion_id, row]));
 return validate(base.map(c => {
  const id=championId(c), row=overrides.get(id);
  if(!row)return {...c,id,version:0,image_path:null};
  if(!validRoutes(row.rotas))throw new Error('Rotas salvas inválidas.');
  if(!Number.isInteger(row.version) || row.version<1)throw new Error('Versão de campeão inválida.');
  const path=row.image_path;
  if(path!=null && path!=='' && !new RegExp(`^${id}/[a-f0-9-]{36}\\.webp$`).test(path))throw new Error('Caminho da imagem inválido.');
  return {...c,id,rotas:row.rotas,version:row.version,image_path:path,imagem:path===null?c.imagem:path===''?'':publicImageUrl(path)};
 }));
}
export async function persistEdit(client, {id,rotas,imagePath,version}) {
 if(!validRoutes(rotas))throw new Error('Selecione pelo menos uma rota.');
 const payload={rotas,image_path:imagePath};
 const query=version===0
  ?client.from('wr_champion_overrides').insert({champion_id:id,...payload})
  :client.from('wr_champion_overrides').update(payload).eq('champion_id',id).eq('version',version);
 const {data,error}=await query.select().maybeSingle();
 if(error?.code==='23505' || (!error && !data))throw new Error('Este campeão foi alterado em outra sessão. Feche e abra a ficha para carregar a versão atual antes de salvar.');
 if(error)throw new Error(error.code==='42501'?'Sua conta não tem permissão de administrador.':'Não foi possível salvar. Verifique a conexão e tente novamente.');
 return data;
}
