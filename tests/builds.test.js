import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {BUILD_CATEGORIES,validateItems,itemPool,drawBuild,searchItems} from '../dist/build-core.js';
const items=JSON.parse(readFileSync(new URL('./fixtures/items.json',import.meta.url)));
test('Catalog validation and duplicate detection',()=>{assert.equal(validateItems(items).length,179);assert.throws(()=>validateItems([...items,items[0]]));});
for(const category of ['Todos',...BUILD_CATEGORIES])test(`${category}: 300 builds always have five distinct eligible items and one boot`,()=>{
 for(let n=0;n<300;n++){const build=drawBuild(items,category);assert.equal(build.length,6);assert.equal(new Set(build.map(i=>i.id)).size,6);assert.ok(build[5].categories.includes('Botas'));assert.ok(build.slice(0,5).every(i=>!i.is_boot&&!i.categories.includes('Botas')&&(category==='Todos'||i.categories.includes(category))));}
});
test('Multi-category membership never weights or duplicates general pool',()=>{const pool=itemPool([...items,...items]);assert.equal(new Set(pool.map(i=>i.id)).size,pool.length);assert.deepEqual(pool,itemPool(items));});
test('Base boots excluded from item slots; only category Botas used for boot slot',()=>{assert.ok(items.find(i=>i.name==='Botas da Velocidade').is_boot);assert.ok(!itemPool(items,'Tier Base').some(i=>i.name==='Botas da Velocidade'));});
test('Accent-insensitive search and multi-category filters',()=>{assert.ok(searchItems(items,'Todos','anjo guardiao').some(i=>i.name==='Anjo Guardião'));const shared=items.find(i=>i.categories.includes('Físico')&&i.categories.includes('Defesa'));assert.ok(searchItems(items,'Físico',shared.name).length);assert.ok(searchItems(items,'Defesa',shared.name).length);});
test('Insufficient pools and invalid categories fail without partial builds',()=>{assert.throws(()=>drawBuild(items,'Botas'));assert.throws(()=>drawBuild(items.filter(i=>!i.categories.includes('Botas'))));assert.throws(()=>drawBuild(items.slice(0,4)));});
