import {normalize,randomChampion} from './core.js';
export const BUILD_CATEGORIES=['Físico','Mágico','Defesa','Suporte'];
export const ITEM_CATEGORIES=['Todos',...BUILD_CATEGORIES,'Tier Médio','Tier Base','Botas','Lutador','Assassino','Atirador'];
export function validateItems(rows){
 if(!Array.isArray(rows)||!rows.length)throw Error('O catálogo de itens está vazio.');
 const ids=new Set();return rows.map(item=>{
 if(!item||typeof item.id!=='string'||ids.has(item.id)||!item.name?.trim()||!Array.isArray(item.categories)||!item.categories.length||typeof item.is_boot!=='boolean'||!/^\d+\/[a-f0-9]{64}\.(png|webp|jpg)$/.test(item.image_path)||item.price!==null&&(!Number.isInteger(item.price)||item.price<0))throw Error('Catálogo de itens inválido.');
 ids.add(item.id);return item;
 });
}
export function itemPool(items,category='Todos'){
 if(category!=='Todos'&&!BUILD_CATEGORIES.includes(category))throw Error('Categoria de sorteio inválida.');
 return [...new Map(items.filter(i=>i.active!==false&&!i.is_boot&&!i.categories.includes('Botas')&&!i.categories.some(c=>['Tier Médio','Tier Base'].includes(c))&&(category==='Todos'?i.categories.some(c=>BUILD_CATEGORIES.includes(c)):i.categories.includes(category))).map(i=>[i.id,i])).values()];
}
export function drawBuild(items,category='Todos',cryptoSource=globalThis.crypto){
 const pool=itemPool(items,category),boots=[...new Map(items.filter(i=>i.active!==false&&i.categories.includes('Botas')).map(i=>[i.id,i])).values()];
 if(pool.length<5||!boots.length)throw Error('São necessários 5 itens diferentes e pelo menos uma bota.');
 const selected=[];for(let i=0;i<5;i++){const item=randomChampion(pool,cryptoSource);selected.push(item);pool.splice(pool.indexOf(item),1);}
 return [...selected,randomChampion(boots,cryptoSource)];
}
export const searchItems=(items,category,query)=>items.filter(i=>(category==='Todos'||i.categories.includes(category))&&normalize(i.name).includes(normalize(query)));
