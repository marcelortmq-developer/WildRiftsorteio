import {readFile,writeFile} from 'node:fs/promises';
import {validate} from '../dist/core.js';
import {championId} from '../dist/shared-core.js';
const data=validate(JSON.parse(await readFile('dist/campeoes_wild_rift_141.json','utf8')));
const values=data.map(c=>`('${championId(c).replaceAll("'","''")}')`).join(',\n');
await writeFile('supabase/seed.sql',`-- Gerado pelo JSON original; não editar manualmente.\ninsert into public.wr_champion_catalog(champion_id) values\n${values}\non conflict do nothing;\n`);
