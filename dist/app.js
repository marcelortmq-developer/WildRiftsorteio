import {ROUTES, validate, poolFor, searchChampions, randomChampion} from './core.js';
const $ = s => document.querySelector(s);
let champions = [], drawRoute = 'Todos', listRoute = 'Todos', busy = false;
const icons = {'Todos':'✦',TOP:'◩',JUNGLE:'♧',MID:'◇',ADC:'◎',SUPPORT:'♜'};
function el(tag, cls, text) { const node = document.createElement(tag); if(cls)node.className = cls; if(text)node.textContent = text; return node; }
function badges(c) {const box=el('div','badges');c.rotas.forEach(r=>box.append(el('span','badge',r)));return box;}
function portrait(c, cls) {
 const wrap=el('div',`portrait ${cls||''}`), fallback=el('span','initial',c.nome.slice(0,2).toUpperCase());wrap.append(fallback);
 if(c.imagem){const img=el('img');img.alt=c.nome;img.loading=cls==='large'?'eager':'lazy';img.addEventListener('load',()=>{fallback.hidden=true;});img.addEventListener('error',()=>{img.remove();fallback.hidden=false;});img.src=c.imagem;wrap.append(img);}
 return wrap;
}
function routes(target, selected, callback, counts) {
 const root=$(target);root.replaceChildren();['Todos',...ROUTES].forEach(r=>{const b=el('button',r===selected?'route active':'route');b.type='button';b.setAttribute('aria-pressed',String(r===selected));b.disabled=target==='#draw-routes'&&busy;
 if(counts)b.append(el('span','route-icon',icons[r]));b.append(el('span','',r));if(counts)b.append(el('small','',String(poolFor(champions,r).length)));b.onclick=()=>callback(r);root.append(b);});
}
function renderDrawRoutes(){routes('#draw-routes',drawRoute,r=>{drawRoute=r;renderDrawRoutes();},true);$('#pool-count').textContent=poolFor(champions,drawRoute).length;}
function renderList(){routes('#list-routes',listRoute,r=>{listRoute=r;renderList();},false);const matches=searchChampions(champions,listRoute,$('#search').value);$('#list-count').textContent=matches.length;const root=$('#champions');root.replaceChildren();matches.forEach(c=>{const a=el('a','champion');a.href=c.link;a.target='_blank';a.rel='noopener noreferrer';a.setAttribute('aria-label',`${c.nome}: ver no Wild Rift Core (nova aba)`);a.append(portrait(c));const info=el('div','champion-info');info.append(el('h3','',c.nome),badges(c));a.append(info,el('span','external','↗'));root.append(a);});if(!matches.length){const empty=el('div','no-results');empty.append(el('h3','','Nenhum campeão encontrado'),el('p','','Tente outro nome ou altere a rota.'));root.append(empty);}}
function showResult(c, route){const root=$('#result');root.replaceChildren();root.classList.add('revealed');const art=portrait(c,'large');root.append(art);const info=el('div','result-info');info.append(el('p','eyebrow',`SEU CAMPEÃO · ${route.toUpperCase()}`),el('h2','',c.nome),badges(c));const link=el('a','build-link','Ver counters e builds ↗');link.href=c.link;link.target='_blank';link.rel='noopener noreferrer';info.append(link);root.append(info);}
$('#draw').onclick=async()=>{if(busy||!champions.length)return;busy=true;const route=drawRoute,chosen=randomChampion(poolFor(champions,route));$('#draw').disabled=true;$('#draw').textContent='Sorteando…';renderDrawRoutes();await new Promise(r=>setTimeout(r,matchMedia('(prefers-reduced-motion: reduce)').matches?0:420));showResult(chosen,route);busy=false;$('#draw').disabled=false;$('#draw').textContent='⇄ Sortear novamente';renderDrawRoutes();};
$('#search').addEventListener('input',renderList);
async function load(){try{const response=await fetch('./campeoes_wild_rift_141.json');if(!response.ok)throw new Error('Falha no carregamento');champions=validate(await response.json());renderDrawRoutes();renderList();$('#draw').disabled=false;$('#status').replaceChildren();}catch(error){$('#status').textContent='Não foi possível carregar os campeões. ';const retry=el('button','','Tentar novamente');retry.onclick=load;$('#status').append(retry);$('#champions').replaceChildren(el('p','muted','Catálogo indisponível até o carregamento dos dados.'));console.error(error);}}
load();
