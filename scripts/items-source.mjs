import {load} from 'cheerio';
export const SOURCE='https://wildlegends.net/itens';
export function parseItems(html){
 const $=load(html), raw=JSON.parse($('#__NUXT_DATA__').text()), cache=new Map();
 function unpack(i){if(i<0)return null;if(cache.has(i))return cache.get(i);const x=raw[i];if(x===null||typeof x!=='object')return x;const out=Array.isArray(x)?[]:{};cache.set(i,out);if(Array.isArray(x)){if(typeof x[0]==='string'){if(!['Reactive','ShallowReactive','Ref','ShallowRef'].includes(x[0]))throw Error('Tipo Nuxt desconhecido');return unpack(x[1]);}x.forEach(v=>out.push(unpack(v)));}else for(const [k,v] of Object.entries(x))out[k]=unpack(v);return out;}
 const root=raw[1], sections=unpack(root.state)['$sitems-page-layout'].sections, records=unpack(root.pinia).item.items;
 const visible=new Map();
 for(const section of sections){const heading=$('h2').filter((_,h)=>$(h).text().trim()===section.title);if(heading.length!==1)throw Error('Seção ausente: '+section.title);
 for(const img of heading.parent().parent().find('img')){const name=$(img).attr('alt')?.trim();if(!name)continue;const entry=visible.get(name)||{categories:[],image:$(img).attr('src')};entry.categories.push(section.title);visible.set(name,entry);}}
 const seen=new Set();const items=records.filter(r=>visible.has(r.name.trim())).map(r=>{
 const id=String(r.id);if(seen.has(id))throw Error('ID duplicado');seen.add(id);const v=visible.get(r.name.trim());
 const original=v.categories, categories=[...new Set(original.map(c=>c==='Magico'?'Mágico':c))];if(original.some(c=>['Físico','Lutador','Assassino','Atirador'].includes(c)))categories.push('Físico');
 const image=new URL(r.imageUrl||v.image,SOURCE);if(image.protocol!=='https:'||!['wildlegends.net','cdn-guide.wildlegends.net'].includes(image.hostname))throw Error('Origem de imagem inesperada');
 const description=load(r.description||'').text().replace(/\s+/g,' ').trim();
 return {id,name:r.name.trim(),price:r.price==null?null:Number(r.price),categories:[...new Set(categories)],source_categories:original,source_category_ids:r.category_multiples,source_url:SOURCE,source_image_url:image.href,description,recipe:r.recipe?JSON.parse(r.recipe):[],source_updated_at:r.updated_at?new Date(r.updated_at*1000).toISOString():null,is_boot:r.category_multiples.includes(1)||categories.includes('Botas'),active:true};
 });
 if(items.length!==visible.size||items.length<100)throw Error('Extração incompleta; importação cancelada');
 for(const c of ['Físico','Mágico','Defesa','Suporte','Botas','Tier Médio','Tier Base'])if(items.filter(i=>i.categories.includes(c)&&(c==='Botas'||!i.is_boot)).length<(c==='Botas'?1:5))throw Error('Pool insuficiente: '+c);
 return {source:SOURCE,collected_at:new Date().toISOString(),source_categories:sections.map(s=>s.title),items};
}
