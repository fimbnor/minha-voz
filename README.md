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

As versões são separadas por modelo, formato e página do carrossel. Mudanças no card durante o pedido ou antes da aprovação invalidam o resultado antigo. A captura aguarda as fontes e o fundo do modelo, para não enviar uma composição incompleta.

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

12 modelos em Minha Vida, Meu Mundo e Minhas Paixões. Fotos, fundos, texto, cores, fontes, logotipo com tamanho/posição/opacidade e exportação PNG 1080×1350, 1080×1920 e 1080×1080. Carrossel com três páginas baixadas separadamente. Favoritos locais.

Recorte experimental de pessoas com MediaPipe Tasks Vision 0.10.21 e Selfie Segmenter float16 v1, servidos na própria origem. Ajustes locais de exposição, contraste, temperatura e saturação, comparação/restauração do original e regulagem de bordas. Não há pincel de máscara nesta versão. Objetos e pets não são garantidos pelo modelo de retrato. Arquivos com licenças de terceiros ficam em `dist/vendor/mediapipe`.

## Validação desta entrega

41 testes automatizados com provedor simulado: captura da composição, edição sequencial, aplicação sem sobreposição de elementos, descarte, desfazer, invalidação de resultados antigos, isolamento de páginas/formatos/modelos, inicialização com o catálogo atual, consentimento, rejeição do fluxo antigo e validações da API, além dos testes de autenticação, privacidade, erros, cotas e recorte de logotipo. Sintaxe dos scripts do navegador verificada.

Não foi usada uma chave real, não houve chamada real ao Gemini e não houve teste completo no Render. A qualidade visual da geração, acesso ao modelo, faturamento e compatibilidade em aparelhos reais precisam ser confirmados depois. A inicialização dos scripts foi testada em DOM simulado. O teste visual em navegador não foi executado porque o Chromium não está instalado neste ambiente.

## Documentação da integração

- https://ai.google.dev/gemini-api/docs/image-generation
- https://ai.google.dev/api/interactions-api
- https://ai.google.dev/gemini-api/docs/api-key
- https://render.com/docs/web-services
- https://render.com/docs/configure-environment-variables
