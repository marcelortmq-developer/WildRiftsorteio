export const ROUTES = ['TOP', 'JUNGLE', 'MID', 'ADC', 'SUPPORT'];
export const normalize = text => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/gi, '').toLowerCase();
export function validate(data) {
 if (!Array.isArray(data) || data.length !== 141) throw new Error('A base deve conter 141 campeões.');
 const seen = new Set();
 return data.map(c => {
  if (!c || typeof c.nome !== 'string' || !c.nome.trim() || seen.has(normalize(c.nome)) || !Array.isArray(c.rotas) || !c.rotas.length || c.rotas.some(r => !ROUTES.includes(r)) || new Set(c.rotas).size !== c.rotas.length) throw new Error('Cadastro de campeões inválido.');
  const url = new URL(c.link);
  if (url.protocol !== 'https:' || url.hostname !== 'wildriftcore.com') throw new Error('Link de campeão inválido.');
  if (c.imagem != null && typeof c.imagem !== 'string') throw new Error('Imagem inválida.');
  seen.add(normalize(c.nome)); return {...c, imagem: c.imagem || ''};
 });
}
export const poolFor = (data, route) => route === 'Todos' ? data : data.filter(c => c.rotas.includes(route));
export const searchChampions = (data, route, query) => poolFor(data, route).filter(c => normalize(c.nome).includes(normalize(query)));
export function randomChampion(pool, cryptoSource = globalThis.crypto) {
 if (!pool.length) throw new Error('Nenhum campeão disponível.');
 const values = new Uint32Array(1), limit = 2 ** 32 - (2 ** 32 % pool.length);
 do { cryptoSource.getRandomValues(values); } while (values[0] >= limit);
 return pool[values[0] % pool.length];
}
