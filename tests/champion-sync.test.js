import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {load} from 'cheerio';
import {parseRoster,parseChampion} from '../supabase/functions/wr-sync-champions/parser.mjs';
import {mergeCatalog,mergeOverrides} from '../dist/shared-core.js';
import {poolFor} from '../dist/core.js';
const base=JSON.parse(readFileSync(new URL('../dist/campeoes_wild_rift_141.json',import.meta.url)));
const next={champion_id:'hwei',nome:'Hwei',rotas:['MID','SUPPORT'],link:'https://wildriftcore.com/champions/hwei/',image_path:'hwei/12345678-1234-1234-1234-123456789012.webp'};
test('New champion expands original JSON without duplicates and preserves manual overrides',()=>{
 const catalog=mergeCatalog(base,[next,next],p=>'https://images.test/'+p);assert.equal(catalog.length,142);
 assert.equal(poolFor(catalog,'MID').filter(c=>c.nome==='Hwei').length,1);assert.equal(poolFor(catalog,'SUPPORT').filter(c=>c.nome==='Hwei').length,1);
 const merged=mergeOverrides(catalog,[{champion_id:'hwei',rotas:['TOP'],version:1,image_path:''}],p=>p);
 assert.deepEqual(merged.find(c=>c.id==='hwei').rotas,['TOP']);assert.equal(merged.find(c=>c.id==='hwei').imagem,'');assert.equal(base.length,141);
});
test('Source detail uses all declared roles and validates identity and image origin',()=>{
 const html='<main data-champion="hwei" data-roles="mid,support"><img class="cover__bg" src="/assets/champions/splash/hwei.webp"></main>';
 assert.deepEqual(parseChampion(html,next,load).rotas,['MID','SUPPORT']);
 assert.throws(()=>parseChampion(html.replace('mid,support','unknown'),next,load));assert.throws(()=>parseChampion(html.replace('/assets/champions/splash/hwei.webp','https://other.test/hwei.webp'),next,load));assert.throws(()=>parseChampion(html,{...next,champion_id:'other'},load));assert.throws(()=>parseRoster('<html>Unavailable</html>',load));
});

test('Source slug changes do not duplicate an existing champion',()=>{const alias={...next,champion_id:'kai-sa',nome:"Kai'Sa",link:'https://wildriftcore.com/champions/kai-sa/',image_path:'kai-sa/12345678-1234-1234-1234-123456789012.webp'};assert.equal(mergeCatalog(base,[alias,next],p=>p).length,142);});
