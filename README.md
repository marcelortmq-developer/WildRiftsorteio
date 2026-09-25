# Sistema de Sorteio WR — edição compartilhada

Aplicação em português para sortear 141 campeões e editar suas rotas e imagens. A base original em `dist/campeoes_wild_rift_141.json` continua sendo a fonte dos nomes, links e rotas iniciais. O Supabase armazena apenas as alterações; não há cadastro manual duplicado no JavaScript.

## Como usar

- Clique em um campeão da lista para abrir sua ficha.
- O botão de builds abre o Wild Rift Core em nova aba.
- Clique em **Administrar**, entre com sua conta de administrador e abra a ficha.
- Marque uma ou mais rotas; selecione uma imagem JPG, PNG ou WebP de até 5 MB.
- Confira a prévia e clique em **Salvar alterações**. É possível remover uma imagem pelo mesmo painel.
- Visitantes recebem as alterações ao abrir o site, voltar à aba ou em até 30 segundos com a aba visível. Salvar atualiza imediatamente a sessão do administrador.
- Uma rota pode ficar sem campeões; nesse caso o sorteio dessa rota fica desabilitado.
- Edições simultâneas usam controle de versão para evitar sobrescritas silenciosas.

## Estado desta entrega

O projeto Supabase **WildRiftsorteio** foi configurado com as tabelas, políticas e bucket. `dist/config.js` já contém a URL e a chave publicável desse projeto. Essa chave pode estar no navegador: permissões reais são aplicadas no banco e no Storage. Nenhuma chave secreta ou service_role deve ser colocada no código.

Ainda é necessário criar o usuário administrador (instruções abaixo) e publicar estes arquivos no GitHub/Vercel. Nenhuma conta recebe acesso de administrador automaticamente.

## Criar o administrador

1. No painel Supabase do projeto WildRiftsorteio, abra **Authentication → Users → Add user → Create new user**.
2. Cadastre seu e-mail e uma senha própria. Se houver a opção, confirme o e-mail na criação (Auto Confirm User).
3. Copie o **User UID** desse usuário.
4. No **SQL Editor**, execute o comando abaixo substituindo o UUID:

```sql
insert into public.wr_admins(user_id)
values ('COLE_O_USER_UID_AQUI'::uuid)
on conflict do nothing;
```

5. No site atualizado, clique em **Administrar** e use as credenciais criadas.

Se preferir, informe ao responsável pela configuração somente o e-mail/UUID do usuário já criado para que ele libere a conta. Nunca envie sua senha por chat, nem a coloque no repositório.

## Atualizar GitHub e Vercel

Substitua os arquivos do repositório pelo conteúdo extraído do ZIP, incluindo as pastas `dist`, `src`, `scripts`, `supabase` e `tests`, além de `package.json`, `package-lock.json` e `vercel.json`.

Na Vercel: Framework **Other**, Root Directory na raiz, Output Directory **dist**, Build Command **npm run build**. O vercel.json já contém essas opções. O bundle do cliente também está em `dist/vendor`, permitindo hospedagem estática sem build.

Não é necessário configurar variáveis na Vercel para este projeto: a configuração pública está em `dist/config.js`. Opcionalmente, o build aceita `SUPABASE_URL` e `SUPABASE_PUBLISHABLE_KEY` juntas, substituindo o arquivo. Nunca use uma chave secreta.

## Desenvolvimento e testes

```sh
npm ci
npm run build
npm test
npm start
```

Abra http://localhost:3000. Node.js 22 ou mais recente é recomendado para desenvolvimento. `npm start` precisa de Python 3. Abrir o HTML por file:// não permite carregar o JSON.

Testes cobrem os pools e campeões flex, merge de alterações, rejeição de arquivos inválidos, conflitos de versão e as políticas SQL em PostgreSQL via PGlite. A verificação de SQL usa schemas de Auth/Storage simulados localmente; o ambiente Supabase também precisa de validação da configuração e de um administrador real para o teste completo de login/upload.

## Instalar em outro Supabase

Somente em um projeto NOVO: execute `supabase/schema.sql`, depois `supabase/seed.sql`, configure a URL e a chave publicável em `dist/config.js` e crie o administrador. Não execute novamente o schema no projeto já configurado. `node scripts/seed-sql.mjs` regenera os IDs válidos diretamente do JSON original.

## Segurança e imagens

Todos podem ler os campeões e as imagens públicas. Apenas contas na tabela `wr_admins` podem gravar; usuários comuns não podem se promover a administrador. Nem mesmo o administrador pode alterar nomes/links originais ou os campos internos de versão via navegador.

As imagens são decodificadas, redimensionadas para até 1200 pixels e convertidas em WebP no navegador. O bucket aceita apenas WebP de até 5 MB. Cada upload recebe um nome único; imagens antigas não são excluídas automaticamente para preservar leitores e evitar exclusões em falhas de rede. O administrador do Supabase pode limpar arquivos sem referência posteriormente.

Se uma gravação perder a resposta da rede, confirme o estado reabrindo a ficha antes de tentar novamente. Em indisponibilidade do banco, o site informa que está mostrando a lista já carregada (ou a base original no primeiro acesso).

## Sorteio de Build

A área **Sorteio de Build** lê o catálogo compartilhado `wr_items` no Supabase. Cada sorteio gera cinco IDs distintos de itens e uma opção da categoria Botas. Todos usa a união dos pools, sem ponderar itens com várias categorias. Qualquer bota (inclusive a Bota da Velocidade, listada pela fonte em Tier Base) fica fora dos cinco itens. Sorteio livre, sem restrições adicionais de receitas/passivas.

Fonte: https://wildlegends.net/itens. Em 25/09/2026 foram extraídos automaticamente 179 itens visíveis e 14 opções na categoria Botas. Os 11 registros internos do site que não aparecem nas categorias da página não são importados. Físico reúne Lutador, Assassino e Atirador; os rótulos originais também são preservados. Preços ausentes ficam nulos. Descrições são armazenadas como texto, nunca HTML executável.

### Sincronização futura (ambiente privado)

- Schema: `supabase/items.sql` (aplicado pela migration `wr_build_items`). RLS permite apenas leitura pública de itens ativos; importação apenas pelo papel `service_role`.
- Configure `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` no ambiente do servidor/terminal seguro. Nunca coloque a segunda variável em `dist`, `config.js` ou no GitHub.
- `npm run sync:items -- --dry-run` valida a fonte e mostra contagens sem gravar.
- `npm run sync:items` extrai o estado estruturado da página, cruza com os itens realmente exibidos, baixa e verifica imagens, salva arquivos imutáveis por hash no bucket público `wr-item-images` e chama `wr_sync_items`.
- A atualização do catálogo é transacional: preserva IDs da fonte, atualiza categorias/preços/imagens e desativa itens removidos sem apagar histórico. Uma falha na extração ou em uma imagem interrompe a importação antes de alterar o catálogo. Imagens antigas permanecem para evitar links quebrados.
- `--html arquivo.html` permite reproduzir uma extração; `--report arquivo.json` salva o relatório de uma sincronização concluída (sem credenciais).
- Alterações incompatíveis na estrutura da fonte interrompem o importador para revisão. Não há agendamento automático.

Testes: `npm test` inclui 2.100 sorteios cobrindo Todos e as seis categorias, exclusão de botas dos cinco slots, deduplicação, pesquisa e restrições RLS. `npm run build` mantém o fluxo de publicação existente.
