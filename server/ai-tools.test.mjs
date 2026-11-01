import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';

const source=readFileSync(new URL('../dist/ai-tools.js',import.meta.url),'utf8');
const encode=value=>Buffer.from(value).toString('base64');
const tick=()=>new Promise(resolve=>setImmediate(resolve));
async function editor(){
 const nodes=new Map(),requests=[],messages=[];
 const $=id=>{if(!nodes.has(id))nodes.set(id,{value:'',checked:false,hidden:true,disabled:false,textContent:'',classList:{add(){},remove(){}},animate(){},setAttribute(){},removeAttribute(name){delete this[name];},scrollIntoView(){},focus(){}});return nodes.get(id);};
 $('#ai-prompt').value='Troque apenas a cor do fundo';$('#ai-consent').checked=true;
 const state={campaign:{id:'amor-declaracao',backgroundUrl:'/amor.png'},format:'feed',slide:0,text:'Minha frase',signature:'@perfil',photo:{name:'foto com recorte e luz ajustada'},logo:{name:'marca'},background:{name:'fundo escolhido'},scale:110,x:5,y:10,cutout:true,palette:2};
 const preview=$('#preview-canvas');preview.width=1080;preview.height=1350;
 const backgrounds=new Map([['/amor.png',{decode:async()=>{}}]]);
 let context,respond=async()=>({image:{mimeType:'image/png',data:encode('card editado '+requests.length)}});
 const document={fonts:{ready:Promise.resolve()},createElement(tag){assert.equal(tag,'canvas');return {width:0,height:0,bytes:'',getContext(){return {drawImage:(image)=>{this.bytes=image.bytes;}};},toDataURL(){return 'data:image/png;base64,'+this.bytes;}};}};
 context=vm.createContext({$,state,document,matchMedia:()=>({matches:true}),window:{addEventListener(){}},backgroundCache:backgrounds,catalogBackground(){},waitForCardAssets:async()=>{await document.fonts.ready;},toast:message=>messages.push(message),crypto,AbortSignal,Image:class{async decode(){}},renderPreview(){context.syncAICard();preview.bytes=state.aiCard?state.aiCard.src.split(',')[1]:encode(JSON.stringify({text:state.text,signature:state.signature,photo:state.photo,logo:state.logo,background:state.background,scale:state.scale,x:state.x,y:state.y}));},fetch:async(url,options)=>{
  if(url==='/api/config')return {ok:true,json:async()=>({available:true})};
  assert.equal(url,'/api/images/edit');requests.push(JSON.parse(options.body));return {ok:true,json:async()=>respond()};
 }});
 vm.runInContext(source,context);await tick();
 return {$,state,requests,messages,context,document,preview,setResponse:fn=>{respond=fn;},generate:()=>$('#ai-generate').onclick(),accept:()=>$('#ai-accept').onclick(),undo:()=>$('#ai-undo').onclick(),discard:()=>$('#ai-discard').onclick()};
}

test('edits the current composed canvas including text, logo and adjusted photo',async()=>{
 const e=await editor();await e.generate();
 const [request]=e.requests;assert.equal(request.mode,'card');assert.equal(request.image.mimeType,'image/png');assert.equal(request.aspectRatio,'4:5');
 const sent=JSON.parse(Buffer.from(request.image.data,'base64'));
 assert.equal(sent.text,'Minha frase');assert.equal(sent.signature,'@perfil');assert.equal(sent.logo.name,'marca');assert.match(sent.photo.name,/recorte e luz/);assert.equal(sent.scale,110);assert.equal(sent.x,5);
 assert.equal(e.state.aiCard,null);assert.equal(e.$('#ai-result').hidden,false);
 e.accept();assert.match(e.state.aiCard.src,new RegExp(encode('card editado 1')));
});
test('sequential prompts edit the last accepted card and undo walks back to the original',async()=>{
 const e=await editor();await e.generate();e.accept();const first=e.state.aiCard;
 e.$('#ai-prompt').value='Agora altere a frase';await e.generate();
 assert.equal(e.requests[1].image.data,first.src.split(',')[1]);e.accept();assert.notEqual(e.state.aiCard,first);
 e.undo();assert.equal(e.state.aiCard,first);e.undo();assert.equal(e.state.aiCard,null);assert.equal(e.$('#ai-undo').hidden,true);
});
test('discard and a provider failure preserve the approved card without retries',async()=>{
 const e=await editor();await e.generate();e.accept();const first=e.state.aiCard;
 await e.generate();e.discard();assert.equal(e.state.aiCard,first);
 e.setResponse(async()=>{throw Error('Conexão encerrada');});await e.generate();
 assert.equal(e.requests.length,3);assert.equal(e.state.aiCard,first);assert.match(e.$('#prompt-status').textContent,/Conexão encerrada/);assert.equal(e.$('#ai-generate').disabled,false);
});
test('refuses to send without consent and edits cards without an uploaded photo',async()=>{
 const e=await editor();e.state.photo=null;e.$('#ai-consent').checked=false;await e.generate();assert.equal(e.requests.length,0);
 e.$('#ai-consent').checked=true;await e.generate();assert.equal(e.requests.length,1);assert.equal(JSON.parse(Buffer.from(e.requests[0].image.data,'base64')).photo,null);
});
test('a changed composition before sending does not spend a provider request',async()=>{
 const e=await editor();let release;e.document.fonts.ready=new Promise(resolve=>release=resolve);
 const pending=e.generate();e.state.text='Nova frase';release();await pending;
 assert.equal(e.requests.length,0);assert.match(e.$('#prompt-status').textContent,/card mudou/);
});
test('rejects stale results after composition changes while waiting for the provider',async()=>{
 for(const key of ['text','signature','logo','background','photo','format','campaign','scale','textColor','signatureColor','backgroundMode','backgroundColor','pageId']){
  const e=await editor();let release,started;
  const sent=new Promise(resolve=>started=resolve);
  e.setResponse(()=>{started();return new Promise(resolve=>release=()=>resolve({image:{mimeType:'image/png',data:encode('resultado antigo')}}));});
  const pending=e.generate();await sent;
  e.state[key]=key==='campaign'?{id:'outro'}:key==='format'?'story':key==='scale'?125:key==='text'||key==='signature'||key==='pageId'?'mudou':key.endsWith('Color')?'#abcdef':key==='backgroundMode'?'color':{};
  release();await pending;e.accept();assert.equal(e.state.aiCard,null);assert.equal(e.$('#ai-result').hidden,true);assert.match(e.$('#prompt-status').textContent,/card mudou durante a edição/i);
 }
});
test('manual edits invalidate an unaccepted candidate and resume editable base elements',async()=>{
 const e=await editor();await e.generate();e.state.text='Outra frase';e.context.renderPreview();e.accept();assert.equal(e.state.aiCard,null);
 await e.generate();e.accept();e.state.logo={name:'outra marca'};e.context.renderPreview();
 assert.equal(e.state.aiCard,null);assert.equal(e.$('#ai-undo').hidden,true);assert.match(e.messages.at(-1),/elementos originais/);
});
test('carousel pages, templates and formats keep distinct approved results',async()=>{
 const e=await editor();e.state.format='carousel';await e.generate();e.accept();const first=e.state.aiCard;
 e.state.slide=1;e.context.renderPreview();assert.equal(e.state.aiCard,null);await e.generate();e.accept();const second=e.state.aiCard;assert.notEqual(second,first);
 e.state.slide=0;e.context.renderPreview();assert.equal(e.state.aiCard,first);
 e.state.format='story';e.context.renderPreview();assert.equal(e.state.aiCard,null);await e.generate();assert.equal(e.requests.at(-1).aspectRatio,'9:16');e.discard();
 e.state.format='carousel';e.state.slide=1;e.context.renderPreview();assert.equal(e.state.aiCard,second);
 const original=e.state.campaign;e.state.campaign={id:'outro-modelo'};e.context.renderPreview();assert.equal(e.state.aiCard,null);
 e.state.campaign=original;e.context.renderPreview();assert.equal(e.state.aiCard,second);
});

const app=readFileSync(new URL('../dist/app.js',import.meta.url),'utf8');
const drawSource=app.slice(app.indexOf('function drawCard('),app.indexOf('function renderCatalog('));
test('approved full cards render once without duplicate text, photos, backgrounds or logos',()=>{
 for(const format of ['feed','story','square','profile','photo','carousel','instagram-profile']){
  const calls=[],ctx=new Proxy({}, {get:(_,method)=>(...args)=>calls.push([method,...args])});
  const context=vm.createContext({Math,drawCover:(ctx,image,...args)=>ctx.drawImage(image,...args),drawInstagramProfile(){throw Error('must not overlay profile elements');},scene(){throw Error('must not overlay scene');},drawLogo(){throw Error('must not overlay logo');}});
  vm.runInContext(drawSource,context);const image={};context.drawCard({width:1080,height:1350,getContext:()=>ctx},{},{aiCard:image,format,text:'old text',photo:{},logo:{},background:{}});
  assert.equal(calls.filter(([method])=>method==='drawImage').length,1);assert.equal(calls.find(([method])=>method==='drawImage')[1],image);
  assert.equal(calls.some(([method])=>method==='fillText'),false);assert.equal(calls.some(([method])=>method==='clip'),format==='instagram-profile');
 }
});

