import {test} from 'node:test';
import assert from 'node:assert/strict';
import {PGlite} from '@electric-sql/pglite';
import {readFileSync} from 'node:fs';
test('Items: public read only, server-only atomic and idempotent sync',async()=>{
 const db=new PGlite();await db.exec(`create role anon;create role authenticated;create role service_role bypassrls;create schema storage;create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);grant usage on schema public to anon,authenticated,service_role;`);
 await db.exec(readFileSync('supabase/items.sql','utf8'));
 const rows=JSON.parse(readFileSync('tests/fixtures/items.json')).map(i=>({...i,source_categories:i.categories,source_category_ids:[],source_url:'https://wildlegends.net/itens',source_image_url:'https://wildlegends.net/items/'+i.id+'.png',description:'',recipe:[]}));
 await db.exec('set role service_role');assert.equal((await db.query('select public.wr_sync_items($1::jsonb) as total',[JSON.stringify(rows)])).rows[0].total,179);
 await db.query('select public.wr_sync_items($1::jsonb)',[JSON.stringify(rows)]);assert.equal((await db.query('select count(*)::int as total from wr_items')).rows[0].total,179);
 await assert.rejects(db.query('select public.wr_sync_items($1::jsonb)',[JSON.stringify(rows.slice(0,2))]));
 await db.exec('reset role;set role anon');assert.equal((await db.query('select count(*)::int as total from wr_items')).rows[0].total,179);
 await assert.rejects(db.exec(`update wr_items set name='alterado'`));await assert.rejects(db.query('select public.wr_sync_items($1::jsonb)',[JSON.stringify(rows)]));
 await db.exec('reset role;set role authenticated');await assert.rejects(db.exec('delete from wr_items'));await db.close();
});
