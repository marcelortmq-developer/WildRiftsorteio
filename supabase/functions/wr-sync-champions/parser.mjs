export const CORE='https://wildriftcore.com';
const routes={top:'TOP',baron:'TOP',jungle:'JUNGLE',mid:'MID',adc:'ADC',dragon:'ADC',support:'SUPPORT'};
export function parseRoster(html,load){
 const $=load(html),seen=new Set(),rows=[];
 $('.chub-card').each((_,el)=>{const a=$(el),url=new URL(a.attr('href'),CORE),id=url.pathname.split('/').filter(Boolean)[1],nome=a.find('.chub-card__name').text().trim();
 if(url.origin!==CORE||!/^\/champions\/[a-z0-9-]+\/$/.test(url.pathname)||!nome||seen.has(id))throw Error('Invalid roster record');seen.add(id);rows.push({champion_id:id,nome,link:url.href});});
 if(rows.length<141)throw Error('Incomplete source roster');return rows;
}
export function parseChampion(html,record,load){const $=load(html),main=$('main[data-champion]');if(main.attr('data-champion')!==record.champion_id)throw Error('Champion identity mismatch');
 const values=(main.attr('data-roles')||main.attr('data-role')||'').split(',').map(x=>x.trim());if(!values.length||values.some(r=>!routes[r]))throw Error('Unknown champion role');
 const image=new URL($('.cover__bg').attr('src'),CORE);if(image.origin!==CORE||!image.pathname.startsWith('/assets/')||!image.pathname.endsWith('.webp'))throw Error('Invalid champion image origin');
 return {...record,rotas:[...new Set(values.map(r=>routes[r]))],source_image_url:image.href};
}
