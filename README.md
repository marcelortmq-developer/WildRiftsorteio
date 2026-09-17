# Sistema de Sorteio WR

Aplicação estática em português, sem banco de dados ou dependências de execução. O JSON anexado é preservado como fonte única: `dist/campeoes_wild_rift_141.json`. O aplicativo acrescenta `imagem: ""` em memória quando a propriedade não existe.

## Executar

Com Python 3 instalado: `python3 -m http.server 3000 --directory dist`. Acesse http://localhost:3000. Abrir o HTML diretamente via file:// não permite carregar o JSON.

Com Node.js instalado: `npm test` executa as verificações das regras de negócio.

## Imagens

Adicione arquivos em `dist/images/` e a propriedade `"imagem": "./images/aatrox.webp"` no registro correspondente do JSON, ou informe uma URL HTTPS. Não é necessário alterar o JavaScript. Sem imagem, ou quando uma imagem falha, o cartão mostra as iniciais do campeão. Nenhuma foto de campeão foi incluída nos anexos.

## Regras

O catálogo e o sorteio possuem filtros independentes. Campeões de várias rotas pertencem a cada pool correspondente, mas uma única vez em Todos. Cada sorteio é independente: repetições são permitidas. A seleção usa crypto.getRandomValues com rejeição de valores que causariam viés. Pesquisa ignora acentos, espaços e pontuação. Links abrem em nova aba com noopener noreferrer.

## Publicar na Vercel

Importe o repositório, selecione Other e use `dist` como Output Directory. Nenhum comando de build ou variável de ambiente é necessário. O arquivo vercel.json já define a pasta de saída. A mesma pasta pode ser publicada em qualquer hospedagem estática.

## Estrutura

- dist/index.html: estrutura acessível e responsiva.
- dist/style.css: tema e regras de adaptação.
- dist/app.js: interface, carregamento e tratamento de erros.
- dist/core.js: validação, filtros e sorteio.
- dist/campeoes_wild_rift_141.json: base original anexada.
- tests/core.test.js: regras de negócio.
- escopo_sistema_sorteio_wr_campeoes.md: escopo original.

A base é aquela fornecida pelo usuário; a aplicação não substitui rotas ou atualiza campeões automaticamente. Fonte tipográfica externa opcional, com fontes locais alternativas.
