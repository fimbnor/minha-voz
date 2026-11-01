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

## Modos Gemini

- **Criar cenário:** envia somente o prompt, sem a foto. A imagem retorna para composição com a foto original. Use o recorte local para integrar a pessoa ao cenário.
- **Fotografia profissional natural:** envia a foto original reduzida e o prompt, pedindo ajustes naturais.
- **Transformar fotografia:** envia a foto original e pede as mudanças descritas.

O consentimento precisa ser marcado antes de gerar. O resultado aparece separado para conferência; Usar este resultado aplica a imagem, Descartar mantém o card, Desfazer restaura a aplicação anterior. Textos e logotipos são renderizados pelo Canvas depois, sem serem enviados ao Gemini.

Em Meu Bebê, o servidor e a interface limitam a operação a cenário. A preservação de identidade em modos generativos é um objetivo do prompt, não uma garantia do modelo. Confira rostos, mãos, proporções e objetos antes de usar.

## API

- `GET /healthz`: saúde do processo, sem autenticação; não testa o Google e não revela configuração.
- `GET /api/config`: configuração pública após autenticação, sem chave.
- `POST /api/images/edit`: autenticação HTTP Basic, origem exata, JSON e identificador único em `X-Request-ID`.

Corpo: `{mode,prompt,consent:true,category,aspectRatio,image?}`. `mode` aceita `background`, `professional` e `transform`; `aspectRatio` aceita `4:5`, `9:16` ou `1:1`; `image` é `{mimeType,data}` com bytes base64 PNG/JPG/WebP de até 5 MB. `category` é o ID do modelo do editor. Resposta: `{image:{mimeType,data},model}`.

O servidor chama a Gemini Interactions API por HTTPS, com chave no cabeçalho `x-goog-api-key`, `store:false` e formato de imagem 1K. O identificador do modelo é configurável no servidor, não pelo visitante. Se o modelo não estiver disponível na conta, a interface mostra erro; não troca automaticamente para outro modelo.

## Proteção para teste privado

HTTP Basic protege interface e API. Use HTTPS fora do computador local. Os segredos ficam somente no ambiente do servidor. Há validação de tamanho/tipo do arquivo, origem da chamada, limite global diário por instância, uma geração por vez e deduplicação de IDs por 24 horas. Tentativas ao provedor contam no limite; erros não geram repetição automática. Timeout: 120 segundos no servidor e 130 segundos na interface.

Fotos, prompts e resultados não são gravados pelo aplicativo em disco ou nos logs. Pedidos ao Google seguem os termos de tratamento de dados e faturamento do projeto Gemini; `store:false` não equivale a promessa de ausência de retenção operacional pelo provedor.

Esta autenticação é para testes privados com uma senha compartilhada. Contadores e deduplicação ficam em memória e reiniciam quando a instância reinicia; não são um teto financeiro garantido. Antes de abertura pública ou múltiplas instâncias, implementar contas individuais, cotas duráveis e controle de custos. Os filtros do provedor permanecem aplicáveis.

## Editor

12 modelos em Minha Vida, Meu Mundo e Minhas Paixões. Fotos, fundos, texto, cores, fontes, logotipo com tamanho/posição/opacidade e exportação PNG 1080×1350, 1080×1920 e 1080×1080. Carrossel com três páginas baixadas separadamente. Favoritos locais.

Recorte experimental de pessoas com MediaPipe Tasks Vision 0.10.21 e Selfie Segmenter float16 v1, servidos na própria origem. Ajustes locais de exposição, contraste, temperatura e saturação, comparação/restauração do original e regulagem de bordas. Não há pincel de máscara nesta versão. Objetos e pets não são garantidos pelo modelo de retrato. Arquivos com licenças de terceiros ficam em `dist/vendor/mediapipe`.

## Validação desta entrega

20 testes automatizados com provedor simulado: login, arquivos privados, configuração sem vazamento, geração/retorno de imagem, cenário sem foto, validações, origem, falhas, cota, timeout, falta de imagem, duplicação, concorrência e tamanho da requisição. Sintaxe dos scripts do navegador verificada.

Não foi usada uma chave real, não houve chamada real ao Gemini e não houve teste completo no Render. A qualidade visual da geração, acesso ao modelo, faturamento e compatibilidade em aparelhos reais precisam ser confirmados depois. O teste de upload no navegador foi anteriormente negado pelo controle de permissão e não foi contornado.

## Documentação da integração

- https://ai.google.dev/gemini-api/docs/image-generation
- https://ai.google.dev/api/interactions-api
- https://ai.google.dev/gemini-api/docs/api-key
- https://render.com/docs/web-services
- https://render.com/docs/configure-environment-variables
