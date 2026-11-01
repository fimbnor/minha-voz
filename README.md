# Minha Voz

Aplicativo web de criação de cards com editor Canvas e servidor Node.js para Gemini. Esta entrega prepara a hospedagem futura no Render; não cria nem publica serviços no Render. A prévia estática anterior continua no ChatGPT Sites.

## Executar localmente

Requer Node.js 22.9 ou superior (testado com 24.22). Sem dependências de terceiros no servidor.

1. Copie `.env.example` para `.env`.
2. Preencha `APP_PASSWORD` com uma senha de teste de pelo menos 12 caracteres.
3. Preencha `GEMINI_API_KEY` somente nesse arquivo local, nunca no Git ou no chat.
4. Execute `npm test` e depois `npm start`.
5. Abra `http://localhost:3000`. Usuário padrão: `minhavoz`; senha: o valor de `APP_PASSWORD`.

Sem a chave, o editor funciona e informa que o Gemini não está configurado. `AI_ENABLED=true` e uma chave preenchida habilitam o botão; isso não confirma validade, faturamento ou acesso ao modelo, que só podem ser verificados numa geração real.

## Publicar no Render depois

Suba o conteúdo deste projeto em um repositório GitHub próprio e conecte-o a um **Web Service Node** no Render. Não escolha Static Site: ele não executa o servidor.

- Build command: `npm test`
- Start command: `npm start`
- Health check: `/healthz`
- `NODE_ENV=production`
- `APP_USER=minhavoz`
- `APP_PASSWORD`: senha privada de teste, cadastrada em Environment.
- `GEMINI_API_KEY`: chave cadastrada em Environment.
- `GEMINI_IMAGE_MODEL=gemini-nano-banana-2.1`
- `AI_ENABLED=true`
- `AI_DAILY_LIMIT=20` (máximo de chamadas por dia UTC, nesta instância).
- `PUBLIC_ORIGIN`: origem HTTPS exata do serviço, sem barra final, por exemplo a URL que o Render fornecer. Não use esse exemplo como URL real.

O servidor usa `PORT` fornecido pelo Render e escuta em `0.0.0.0`. Cadastre `PUBLIC_ORIGIN` antes de ativar a produção; uma origem diferente causa erro 403 em geração. Não altere a origem do navegador nem acrescente CORS aberto. Interface e API são servidas pelo mesmo serviço.

Após a implantação, abra o endereço HTTPS e entre com o usuário/senha de teste. A chave Gemini nunca será solicitada na tela do aplicativo. Não há serviço Render ou repositório GitHub novo criado por esta entrega.

## Editar o card atual com Gemini

O botão **Editar card com Gemini** envia uma imagem PNG da composição completa da prévia: modelo, fundo escolhido, foto com os ajustes locais, frase, assinatura e logotipo. O prompt descreve as alterações sobre essa composição. A imagem é reduzida apenas se necessário para respeitar o limite de 5 MB. O servidor exige `mode: "card"` e uma imagem; pedidos antigos de geração sem composição são rejeitados.

O resultado aparece separado para conferência. **Usar este resultado** substitui a imagem completa da prévia e da exportação, sem reaplicar por cima os elementos originais. **Descartar** mantém o card atual. O próximo pedido usa a última versão aprovada como base; **Desfazer** retorna à edição aprovada anterior e, depois, à composição original.

As versões usam a identidade estável de cada post e o formato. Ao trocar de formato, a imagem aprovada atual é mantida e reenquadrada; o perfil circular não retoma uma imagem antiga. Mudanças no card durante o pedido ou antes da aprovação invalidam o resultado antigo. A captura aguarda as fontes e o fundo do modelo, para não enviar uma composição incompleta.

O resultado do Gemini é uma imagem única: suas alterações não são convertidas em camadas editáveis. Continue modificando essa versão por novos prompts, ou desfaça para editar os elementos originais. Um ajuste manual retoma esses elementos e substitui as versões da IA daquela composição; essa transição é explicada na interface.

O consentimento autoriza enviar o card completo, incluindo texto e logotipo, ao Google. Confira texto, marcas, rostos, mãos e proporções antes de aplicar. Em Meu Bebê, o prompt do servidor pede ajustes apenas de cenário e decoração e preservação da aparência da criança. A fidelidade à imagem de entrada depende do modelo; as instruções não são uma garantia de identidade ou de reprodução exata.

## API

- `GET /healthz`: saúde do processo, sem autenticação; não testa o Google e não revela configuração.
- `GET /api/config`: configuração pública após autenticação, sem chave.
- `POST /api/images/edit`: autenticação HTTP Basic, origem exata, JSON e identificador único em `X-Request-ID`.

Corpo: `{mode:"card",prompt,consent:true,category,aspectRatio,image}`. `aspectRatio` aceita `4:5`, `9:16` ou `1:1`; `image` é obrigatório e contém a composição atual em `{mimeType,data}`, com bytes base64 PNG/JPG/WebP de até 5 MB. `category` é o ID do modelo do editor. Resposta: `{image:{mimeType,data},model}`.

O servidor chama a Gemini Interactions API por HTTPS, com chave no cabeçalho `x-goog-api-key`, `store:false` e formato de imagem 1K. O identificador do modelo é configurável no servidor, não pelo visitante. Se o modelo não estiver disponível na conta, a interface mostra erro; não troca automaticamente para outro modelo.

## Proteção para teste privado

HTTP Basic protege interface e API. Use HTTPS fora do computador local. Os segredos ficam somente no ambiente do servidor. Há validação de tamanho/tipo do arquivo, origem da chamada, limite global diário por instância, uma geração por vez e deduplicação de IDs por 24 horas. Tentativas ao provedor contam no limite; erros não geram repetição automática. Timeout: 120 segundos no servidor e 130 segundos na interface.

Fotos, prompts e resultados não são gravados pelo aplicativo em disco ou nos logs. Pedidos ao Google seguem os termos de tratamento de dados e faturamento do projeto Gemini; `store:false` não equivale a promessa de ausência de retenção operacional pelo provedor.

Esta autenticação é para testes privados com uma senha compartilhada. Contadores e deduplicação ficam em memória e reiniciam quando a instância reinicia; não são um teto financeiro garantido. Antes de abertura pública ou múltiplas instâncias, implementar contas individuais, cotas duráveis e controle de custos. Os filtros do provedor permanecem aplicáveis.

## Editor

24 modelos filtrados por **Fotos**, **Banners** e **Montagens**, com categorias temáticas independentes. A classificação dos modelos está explícita em `dist/composition-tools.js`. As categorias aparecem uma vez, com ícones, e os modelos da categoria são apresentados pelos nomes e miniaturas.

O fundo pode ser a imagem do modelo, uma imagem enviada ou uma cor sólida. A paleta e o seletor de cor substituem o fundo e não mudam a cor do texto. Mensagem e assinatura têm seletores de cor independentes; a assinatura inclui uma placa de contraste opcional, ativada inicialmente. As cores recomendadas pelo catálogo são usadas no primeiro carregamento; escolhas de cor do usuário são preservadas ao trocar de modelo.

Os fundos retangulares e circulares usam o mesmo renderizador. Durante o carregamento, há apenas um fundo neutro; as antigas cenas procedurais foram removidas. A conclusão de um carregamento antigo não muda o modelo ativo. A exportação e o envio à IA aguardam o fundo selecionado; uploads antigos ou de uma página abandonada não substituem a escolha atual.

Carrosséis começam com três posts e aceitam de dois a dez. Cada post tem sua própria foto, original, máscara, ajustes, fundo, modelo, frase, assinatura, cores e logotipo. É possível enviar várias fotos a partir do post atual, escolher outra imagem do catálogo para cada post e adicionar ou remover posts. As páginas são baixadas individualmente em PNG. Os formatos continuam em 1080×1350, 1080×1920 e 1080×1080. Favoritos locais.

Recorte experimental de pessoas com MediaPipe Tasks Vision 0.10.21 e Selfie Segmenter float16 v1, servidos na própria origem. Ajustes locais de exposição, contraste, temperatura e saturação, comparação/restauração do original e regulagem de bordas. Não há pincel de máscara nesta versão. Objetos e pets não são garantidos pelo modelo de retrato. Arquivos com licenças de terceiros ficam em `dist/vendor/mediapipe`.

## Editor no celular

O fluxo tem sete telas: Formato, Modelo, Foto, Texto, Visual, IA e Baixar. A navegação permite voltar aos ajustes sem perder o trabalho. Tratamento de foto fica em um painel recolhido, aberto quando necessário.

No celular, um botão flutuante com miniatura ao vivo dá acesso à prévia sem reservar espaço no layout. A prévia aberta pode ser movida e tem opacidade ajustável de 20% a 100%. A imagem deixa os toques passarem para os controles atrás dela; apenas sua barra de movimento e seus controles interceptam toques. É possível recolher a prévia ou abrir a versão em tela cheia. O widget acompanha a área visível do navegador, inclusive com teclado. No computador, a prévia continua ao lado dos controles. A exportação mantém a resolução e a opacidade originais: a transparência do widget serve apenas para editar.


Validação desta revisão: Chromium em 390 × 740 e área reduzida a 390 × 370, navegação pelas sete telas, campo de IA visível, ampliação da prévia e ausência de exceções JavaScript. Teclado de aparelho real e comportamento do Safari ainda precisam de conferência. A integração com a main inclui as correções dos testes anteriores.

## Validação desta entrega

60 testes automatizados com provedor simulado: captura da composição, edição sequencial, aplicação sem sobreposição de elementos, descarte, desfazer, invalidação de resultados antigos, isolamento de páginas/formatos/modelos, inicialização com o catálogo atual, ajuste de viewport/teclado simulado, ampliação da prévia, navegação entre etapas sem deslocar a imagem, categorias únicas com ícones, filtros por estilo, cores independentes, fundos circulares, dados separados por post, envio de várias fotos, carregamentos fora de ordem, espera do fundo na exportação, consentimento, rejeição do fluxo antigo e validações da API, além dos testes de autenticação, privacidade, erros, cotas e recorte de logotipo. Sintaxe dos scripts do navegador verificada.

Não foi usada uma chave real, não houve chamada real ao Gemini e não houve teste completo no Render. A qualidade visual da geração, acesso ao modelo, faturamento e compatibilidade em aparelhos reais precisam ser confirmados depois. A inicialização dos scripts foi testada em DOM simulado. O teste visual em navegador ficou pendente porque o navegador de validação não conseguiu acessar os arquivos locais do ambiente de desenvolvimento. O comportamento do teclado ainda precisa ser conferido em aparelhos reais.

## Documentação da integração

- https://ai.google.dev/gemini-api/docs/image-generation
- https://ai.google.dev/api/interactions-api
- https://ai.google.dev/gemini-api/docs/api-key
- https://render.com/docs/web-services
- https://render.com/docs/configure-environment-variables

### Como começar o cartão

Na escolha de modelo, o usuário pode começar com um fundo pronto, escolher uma cor sólida ou usar uma base branca sem modelo. Os 12 cartões ilustrados originais ficam em uma seção própria, com prévias no formato escolhido. A tela explica que o modelo é o fundo do cartão e pode ser combinado com fotos depois. As bases usam os campos existentes de cada post e são preservadas nos projetos. Não há setas decorativas nos botões; os detalhes usam sinais de mais e menos em vez dos marcadores nativos que podem virar emoji no iPhone.
