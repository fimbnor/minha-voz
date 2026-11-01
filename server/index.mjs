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
 if(!['background','professional','transform'].includes(body.mode))throw new ApiError(400,'Operação inválida.');
 if(!['4:5','9:16','1:1'].includes(body.aspectRatio))throw new ApiError(400,'Formato inválido.');
 if(body.mode!=='background'&&body.category==='bebe')throw new ApiError(400,'Em Meu Bebê, gere apenas o cenário e mantenha a foto original.');
 if(body.mode!=='background')validImage(body.image);
 return body;
}
export function providerBody(body,model){
 const policies={background:'Crie somente um cenário fotográfico, sem pessoas, para compor depois com uma foto original. Reserve espaço para a pessoa e a mensagem.',professional:'Aprimore a foto com iluminação profissional natural e cores equilibradas. Preserve feições, idade aparente, tom de pele, proporções e textura natural. Não redesenhe a identidade.',transform:'Edite a foto de acordo com os detalhes, preservando a identidade e as proporções da pessoa e os detalhes do objeto principal.'};
 const input=[{type:'text',text:policies[body.mode]+' Não inclua texto, logotipos ou marcas: serão aplicados pelo editor. Detalhes do usuário: '+body.prompt}];
 if(body.mode!=='background')input.push({type:'image',mime_type:body.image.mimeType,data:body.image.data});
 return {model,input,store:false,response_format:{type:'image',mime_type:'image/png',aspect_ratio:body.aspectRatio,image_size:'1K'}};
}
export function extractImage(data){
 if(data.status&&data.status!=='completed')throw new ApiError(422,'A geração não foi concluída. Confira as instruções antes de tentar novamente.');
 const blocks=(data.steps||[]).filter(s=>s.type==='model_output').flatMap(s=>s.content||[]);
 const out=blocks.find(b=>b.type==='image'&&b.data&&!b.thought);
 if(!out)throw new ApiError(422,'O Gemini não retornou uma imagem. Revise o pedido ou o modelo configurado.');
 return validImage({mimeType:out.mime_type,data:out.data});
}
async function jsonBody(req){let bytes=0,chunks=[];for await(const c of req){bytes+=c.length;if(bytes>MAX_BODY)throw new ApiError(413,'Arquivo muito grande.');chunks.push(c);}try{return JSON.parse(Buffer.concat(chunks));}catch{throw new ApiError(400,'Requisição inválida.');}}
async function provider(fetchImpl,payload,key,timeoutMs){
 let r;try{r=await fetchImpl(ENDPOINT,{method:'POST',headers:{'x-goog-api-key':key,'Content-Type':'application/json'},body:JSON.stringify(payload),signal:AbortSignal.timeout(timeoutMs)});}catch(e){throw new ApiError(e.name==='TimeoutError'||e.name==='AbortError'?504:502,'O Google não respondeu. Nenhuma nova tentativa foi disparada automaticamente.');}
 if(!r.ok){const msg=r.status===429?'Cota do Gemini esgotada.':r.status===401||r.status===403?'A chave não tem acesso. Verifique a configuração no servidor.':r.status===404?'Modelo de imagens indisponível para este projeto.':'O Gemini recusou ou não conseguiu processar o pedido.';throw new ApiError(r.status===429?429:502,msg);}
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
     const image=await provider(fetchImpl,providerBody(body,model),env.GEMINI_API_KEY,timeoutMs);
     return send(res,200,{image,model});
    }finally{busy=false;}
   }
   if(url.pathname.startsWith('/api/'))throw new ApiError(404,'Rota não encontrada.');
   if(!['GET','HEAD'].includes(req.method))throw new ApiError(405,'Método não permitido.');
   const pathname=decodeURIComponent(url.pathname),file=path.resolve(ROOT,'.'+(pathname==='/'?'/index.html':pathname));
   if(!file.startsWith(ROOT)||pathname.split('/').some(x=>x.startsWith('.')))throw new ApiError(404,'Arquivo não encontrado.');
   let contents;try{contents=await readFile(file);}catch{throw new ApiError(404,'Arquivo não encontrado.');}
   const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.jpg':'image/jpeg','.wasm':'application/wasm','.tflite':'application/octet-stream'}[path.extname(file)]||'application/octet-stream';
   res.writeHead(200,{'Content-Type':mime});res.end(req.method==='HEAD'?undefined:contents);
  }catch(e){if(!res.headersSent)send(res,e instanceof ApiError?e.status:500,{error:e instanceof ApiError?e.message:'Erro interno. Tente novamente mais tarde.'});else res.end();}
 });
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 if(process.env.NODE_ENV==='production'&&!process.env.PUBLIC_ORIGIN)throw Error('Configure PUBLIC_ORIGIN com a URL HTTPS do serviço.');
 const server=createApp();server.requestTimeout=150000;server.listen(Number(process.env.PORT||3000),'0.0.0.0',()=>console.log('Minha Voz iniciado.'));
 process.on('SIGTERM',()=>{server.close();setTimeout(()=>process.exit(0),10000).unref();});
}
