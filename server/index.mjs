import {createServer} from 'node:http';
import {createHash,timingSafeEqual} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {fileURLToPath,pathToFileURL} from 'node:url';
import path from 'node:path';

const ROOT=fileURLToPath(new URL('../dist/',import.meta.url));
const ENDPOINT='https://generativelanguage.googleapis.com/v1beta/interactions';
const MAX_BODY=8*1024*1024;
class ApiError extends Error {constructor(status,message){super(message);this.status=status;}}
const hash=s=>createHash('sha256').update(s).digest();
const equal=(a,b)=>timingSafeEqual(hash(a),hash(b));
function send(res,status,data){res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(data));}
function validImage(image){
 if(!image||!['image/png','image/jpeg','image/webp'].includes(image.mimeType)||typeof image.data!=='string'||image.data.length>7*1024*1024||(image.data.length%4!==0||!/^[A-Za-z0-9+/]*={0,2}$/.test(image.data)))throw new ApiError(400,'Envie uma imagem PNG, JPG ou WebP de até 5 MB.');
 const b=Buffer.from(image.data,'base64');if(b.length<12||b.length>5*1024*1024)throw new ApiError(400,'Imagem inválida ou muito grande.');
 const valid=image.mimeType==='image/png'?b.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])):image.mimeType==='image/jpeg'?b[0]===255&&b[1]===216&&b[2]===255:b.toString('ascii',0,4)==='RIFF'&&b.toString('ascii',8,12)==='WEBP';
 if(!valid)throw new ApiError(400,'O conteúdo não corresponde ao tipo da imagem.');return image;
}
export function validate(body){
 if(!body||typeof body.prompt!=='string'||!body.prompt.trim()||body.prompt.length>1500)throw new ApiError(400,'Descreva os detalhes em até 1.500 caracteres.');
 if(body.consent!==true)throw new ApiError(400,'Autorize o envio ao Google antes de gerar.');
 if(body.mode!=='card')throw new ApiError(400,'Use a edição do card atual.');
 if(!['4:5','9:16','1:1'].includes(body.aspectRatio))throw new ApiError(400,'Formato inválido.');
 validImage(body.image);
 return body;
}
export function providerBody(body,model){
 const policy='Edite o card completo anexado, que representa exatamente a composição atual do usuário. Use essa imagem como base e altere somente o que for solicitado. Preserve a composição, enquadramento, pessoas, objetos, textos, assinatura e logotipos que não forem alvo do pedido. Preserve a identidade, feições, idade aparente, tom de pele e proporções das pessoas. Mantenha textos legíveis e marcas fiéis, salvo alteração explícita. Retorne o card completo já editado, no mesmo formato; ele será exibido diretamente, sem adicionar novamente foto, fundo, texto ou logotipo.';
 const baby=typeof body.category==='string'&&/^(bebe|baby)(-|$)/.test(body.category)?' Em cards de bebê, limite as mudanças ao cenário e à decoração; preserve integralmente a aparência da criança.':'';
 const input=[{type:'text',text:policy+baby+' Detalhes do usuário: '+body.prompt},{type:'image',mime_type:body.image.mimeType,data:body.image.data}];
 return {model,input,store:false,response_format:{type:'image',mime_type:'image/jpeg',aspect_ratio:body.aspectRatio,image_size:'1K'}};
}
export function extractImage(data){
 if(data.status&&data.status!=='completed')throw new ApiError(422,'A geração não foi concluída. Confira as instruções antes de tentar novamente.');
 const blocks=(data.steps||[]).filter(s=>s.type==='model_output').flatMap(s=>s.content||[]);
 const out=blocks.find(b=>b.type==='image'&&b.data&&!b.thought);
 if(!out)throw new ApiError(422,'O Gemini não retornou uma imagem. Revise o pedido ou o modelo configurado.');
 return validImage({mimeType:out.mime_type,data:out.data});
}
async function jsonBody(req){let bytes=0,chunks=[];for await(const c of req){bytes+=c.length;if(bytes>MAX_BODY)throw new ApiError(413,'Arquivo muito grande.');chunks.push(c);}try{return JSON.parse(Buffer.concat(chunks));}catch{throw new ApiError(400,'Requisição inválida.');}}
function safeProviderMessage(message,payload,key,password){
 if(typeof message!=='string')return '';
 let text=message.slice(0,16000);
 const secrets=[key,password,...payload.input.flatMap(item=>item.type==='image'?[item.data]:item.type==='text'?[item.text,item.text.split('Detalhes do usuário: ')[1]]:[])].filter(Boolean).sort((a,b)=>b.length-a.length);
 for(const value of secrets)text=text.split(value).join('[removido]');
 return text.replace(/AIza[A-Za-z0-9_-]+/g,'[chave removida]').replace(/data:image\/[^;]+;base64,[A-Za-z0-9+/=]+/g,'[imagem removida]').replace(/[A-Za-z0-9+/=_-]{80,}/g,'[dados removidos]').replace(/[\r\n\t]+/g,' ').slice(0,600);
}
async function provider(fetchImpl,payload,key,timeoutMs,password){
 let r;try{r=await fetchImpl(ENDPOINT,{method:'POST',headers:{'x-goog-api-key':key,'Content-Type':'application/json'},body:JSON.stringify(payload),signal:AbortSignal.timeout(timeoutMs)});}catch(e){throw new ApiError(e.name==='TimeoutError'||e.name==='AbortError'?504:502,'O Google não respondeu. Nenhuma nova tentativa foi disparada automaticamente.');}
 if(!r.ok){
  let error;try{const raw=await r.text();if(raw.length<=65536)error=JSON.parse(raw).error;}catch{}
  const knownStatuses=['INVALID_ARGUMENT','FAILED_PRECONDITION','UNAUTHENTICATED','PERMISSION_DENIED','NOT_FOUND','RESOURCE_EXHAUSTED','INTERNAL','UNAVAILABLE','DEADLINE_EXCEEDED'];
  const status=knownStatuses.includes(error?.status)?error.status: ['invalid_request','permission_denied','unauthenticated','not_found','resource_exhausted','internal','unavailable'].includes(error?.code)?error.code:'UNKNOWN';
  const reasons={
   API_KEY_INVALID:'A chave da API é inválida. Confira GEMINI_API_KEY no Render.',
   API_KEY_EXPIRED:'A chave da API expirou. Atualize GEMINI_API_KEY no Render.',
   API_KEY_IP_ADDRESS_BLOCKED:'O Google bloqueou o IP de saída. Confira todas as faixas Outbound do serviço atual do Render nas restrições da chave.',
   API_KEY_SERVICE_BLOCKED:'A restrição da chave não permite esta API. Confira o acesso à Generative Language API.',
   API_KEY_HTTP_REFERRER_BLOCKED:'A chave está restrita por site. Para chamadas do servidor, confira a restrição por IP de saída.',
   SERVICE_DISABLED:'A Generative Language API está desativada no projeto Google.',
   BILLING_DISABLED:'O Google informou que o faturamento está desativado no projeto.',
   CONSUMER_INVALID:'O Google não reconheceu o projeto associado à chave.'
  };
  const details=Array.isArray(error?.details)?error.details:[];
  const reason=details.map(d=>d?.reason).find(v=>Object.hasOwn(reasons,v))||'';
  const hints={400:'O Google rejeitou os parâmetros ou a configuração do projeto.',401:'O Google não autenticou a chave.',402:'Confira o faturamento do projeto no Google.',403:'O Google negou o acesso. Confira as restrições da chave e as permissões do projeto.',404:'O modelo configurado não está disponível para este projeto.',429:'Cota ou limite de chamadas do Gemini atingido.',500:'Falha interna no Google. Tente mais tarde.',503:'O serviço do Google está temporariamente indisponível.',504:'O Google excedeu o tempo de processamento.'};
  console.error('Gemini request failed',{httpStatus:r.status,status,reason:reason||'UNKNOWN'});
  const msg='Gemini retornou HTTP '+r.status+(status==='UNKNOWN'?'':' ('+status+')')+(reason?' ['+reason+']':'')+'. '+(reasons[reason]||hints[r.status]||'O Google recusou o pedido. Confira o serviço e o modelo configurados.');
  const detail=safeProviderMessage(error?.message,payload,key,password);
  throw new ApiError(r.status===429?429:502,msg+(detail?' Detalhe do Google: '+detail:''));
 }
 const raw=await r.text();if(raw.length>14*1024*1024)throw new ApiError(502,'Imagem de resposta muito grande.');let data;try{data=JSON.parse(raw);}catch{throw new ApiError(502,'Resposta inválida do Gemini.');}return extractImage(data);
}
export function createApp({env=process.env,fetchImpl=fetch,now=Date.now,timeoutMs=120000}={}){
 const password=env.APP_PASSWORD||'',user=env.APP_USER||'minhavoz';if(password.length<12)throw Error('Configure APP_PASSWORD com pelo menos 12 caracteres no servidor.');
 const limit=Number(env.AI_DAILY_LIMIT||20);if(!Number.isInteger(limit)||limit<1||limit>1000)throw Error('AI_DAILY_LIMIT deve ser um inteiro entre 1 e 1000.');
 const model=env.GEMINI_IMAGE_MODEL||'gemini-nano-banana-2.1';if(!/^[a-z0-9.-]{1,100}$/.test(model))throw Error('GEMINI_IMAGE_MODEL inválido.');
 let day='',used=0,busy=false;const recent=new Map();let loginWindow=0,loginFailures=0;
 return createServer(async(req,res)=>{
  res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','no-referrer');res.setHeader('X-Frame-Options','DENY');res.setHeader('Cache-Control','no-store');
  res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self' 'wasm-unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' blob: data:; connect-src 'self'; worker-src 'self' blob:; frame-ancestors 'none'; object-src 'none'; base-uri 'self'");
  try{
   const url=new URL(req.url,'http://localhost');
   if(url.pathname==='/healthz'&&req.method==='GET')return send(res,200,{ok:true});
   if(now()-loginWindow>60000){loginWindow=now();loginFailures=0;}
   if(loginFailures>=30)throw new ApiError(429,'Muitas tentativas de acesso. Aguarde um minuto.');
   const expected='Basic '+Buffer.from(user+':'+password).toString('base64');
   if(!equal(req.headers.authorization||'',expected)){loginFailures++;res.setHeader('WWW-Authenticate','Basic realm="Minha Voz - testes privados", charset="UTF-8"');return send(res,401,{error:'Entre com o usuário e a senha de teste.'});}
   if(url.pathname==='/api/config'&&req.method==='GET'){const missingConfig=[];if(!env.GEMINI_API_KEY)missingConfig.push('GEMINI_API_KEY');if(env.AI_ENABLED!=='true')missingConfig.push('AI_ENABLED');return send(res,200,{available:missingConfig.length===0,model,missingConfig});}
   if(url.pathname==='/api/images/edit'){
    if(req.method!=='POST'){res.setHeader('Allow','POST');throw new ApiError(405,'Use POST.');}
    const origin=env.PUBLIC_ORIGIN||`http://${req.headers.host}`;
    if(req.headers.origin!==origin)throw new ApiError(403,'Origem não autorizada.');
    if(!req.headers['content-type']?.startsWith('application/json'))throw new ApiError(415,'Use application/json.');
    if(!env.GEMINI_API_KEY||env.AI_ENABLED!=='true')throw new ApiError(503,'Gemini ainda não configurado no servidor.');
    if(busy)throw new ApiError(429,'Já existe uma geração em andamento. Aguarde.');
    busy=true;try{
     const body=validate(await jsonBody(req)),id=req.headers['x-request-id'];
     if(typeof id!=='string'||!/^[a-zA-Z0-9-]{16,80}$/.test(id))throw new ApiError(400,'Identificador de requisição inválido.');
     for(const [k,t] of recent)if(now()-t>86400000)recent.delete(k);
     if(recent.has(id))throw new ApiError(409,'Este pedido já foi enviado. Confira o resultado antes de gerar novamente.');
     const today=new Date(now()).toISOString().slice(0,10);if(today!==day){day=today;used=0;}
     if(used>=limit)throw new ApiError(429,'Limite diário desta instância atingido.');
     recent.set(id,now());used++;
     const image=await provider(fetchImpl,providerBody(body,model),env.GEMINI_API_KEY,timeoutMs,password);
     return send(res,200,{image,model});
    }finally{busy=false;}
   }
   if(url.pathname.startsWith('/api/'))throw new ApiError(404,'Rota não encontrada.');
   if(!['GET','HEAD'].includes(req.method))throw new ApiError(405,'Método não permitido.');
   const pathname=decodeURIComponent(url.pathname),file=path.resolve(ROOT,'.'+(pathname==='/'?'/index.html':pathname));
   if(!file.startsWith(ROOT)||pathname.split('/').some(x=>x.startsWith('.')))throw new ApiError(404,'Arquivo não encontrado.');
   let contents;try{contents=await readFile(file);}catch{throw new ApiError(404,'Arquivo não encontrado.');}
   const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.woff':'font/woff','.png':'image/png','.jpg':'image/jpeg','.wasm':'application/wasm','.tflite':'application/octet-stream'}[path.extname(file)]||'application/octet-stream';
   res.writeHead(200,{'Content-Type':mime});res.end(req.method==='HEAD'?undefined:contents);
  }catch(e){if(!res.headersSent)send(res,e instanceof ApiError?e.status:500,{error:e instanceof ApiError?e.message:'Erro interno. Tente novamente mais tarde.'});else res.end();}
 });
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 if(process.env.NODE_ENV==='production'&&!process.env.PUBLIC_ORIGIN)throw Error('Configure PUBLIC_ORIGIN com a URL HTTPS do serviço.');
 const server=createApp();server.requestTimeout=150000;server.listen(Number(process.env.PORT||3000),'0.0.0.0',()=>console.log('Minha Voz iniciado.'));
 process.on('SIGTERM',()=>{server.close();setTimeout(()=>process.exit(0),10000).unref();});
}

