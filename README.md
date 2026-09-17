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
