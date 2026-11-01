import test from 'node:test';
import assert from 'node:assert/strict';
import {createApp} from './index.mjs';
const PNG='iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aF6sAAAAASUVORK5CYII=';
const secret='unit-test-password-only',key='fake-provider-key-test-only';
const env={APP_PASSWORD:secret,GEMINI_API_KEY:key,AI_ENABLED:'true',PUBLIC_ORIGIN:'https://minhavoz.test',AI_DAILY_LIMIT:'20'};
const body={mode:'professional',prompt:'Luz suave',consent:true,category:'vida',aspectRatio:'4:5',image:{mimeType:'image/png',data:PNG}};
function output(){return new Response(JSON.stringify({status:'completed',steps:[{type:'model_output',content:[{type:'image',mime_type:'image/png',data:PNG}]}]}));}
async function setup(t,opts={}){const server=createApp({env,...opts});await new Promise(r=>server.listen(0,'127.0.0.1',r));t.after(()=>new Promise(r=>server.close(r)));const url=`http://127.0.0.1:${server.address().port}`;const headers={Authorization:'Basic '+Buffer.from('minhavoz:'+secret).toString('base64'),Origin:env.PUBLIC_ORIGIN,'Content-Type':'application/json','X-Request-ID':crypto.randomUUID()};return {url,headers,post:(value=body,extra={})=>fetch(url+'/api/images/edit',{method:'POST',headers:{...headers,...extra},body:JSON.stringify(value)})};}
test('rejects insecure startup',()=>assert.throws(()=>createApp({env:{APP_PASSWORD:'short'}})));
test('health is public; application and config require password',async t=>{const a=await setup(t);assert.equal((await fetch(a.url+'/healthz')).status,200);assert.equal((await fetch(a.url+'/')).status,401);assert.equal((await fetch(a.url+'/api/config')).status,401);});
test('serves frontend and never exposes environment files',async t=>{const a=await setup(t);const r=await fetch(a.url+'/',{headers:a.headers});assert.match(await r.text(),/ai-generate/);assert.equal((await fetch(a.url+'/.env',{headers:a.headers})).status,404);assert.equal((await fetch(a.url+'/server/index.mjs',{headers:a.headers})).status,404);});
test('config reveals no key and disabled API makes no provider request',async t=>{const a=await setup(t,{env:{...env,GEMINI_API_KEY:''},fetchImpl:()=>{throw Error('must not call');}});const r=await fetch(a.url+'/api/config',{headers:a.headers});assert.deepEqual(await r.json(),{available:false,model:'gemini-nano-banana-2.1',missingConfig:['GEMINI_API_KEY']});assert.equal((await a.post()).status,503);});
test('authenticated image flow returns image and sends server-only credentials',async t=>{let sent;const a=await setup(t,{fetchImpl:async(url,options)=>{sent={url,options};return output();}});const r=await a.post();assert.equal(r.status,200);const result=await r.json();assert.equal(result.image.data,PNG);assert(!JSON.stringify(result).includes(key));assert.equal(sent.options.headers['x-goog-api-key'],key);const payload=JSON.parse(sent.options.body);assert.equal(payload.store,false);assert.equal(payload.input[1].data,PNG);assert.equal(payload.response_format.aspect_ratio,'4:5');});
test('background requests never forward an attached photo',async t=>{let sent;const a=await setup(t,{fetchImpl:async(_,o)=>{sent=JSON.parse(o.body);return output();}});assert.equal((await a.post({...body,mode:'background',category:'bebe'})).status,200);assert.equal(sent.input.length,1);});
for(const [name,changes,status] of [['consent',{consent:false},400],['prompt length',{prompt:'x'.repeat(1501)},400],['mode',{mode:'arbitrary'},400],['aspect',{aspectRatio:'13:7'},400],['baby transformation',{category:'bebe'},400],['spoofed image',{image:{mimeType:'image/png',data:Buffer.from('not an image at all').toString('base64')}},400]])test('validates '+name,async t=>{const a=await setup(t,{fetchImpl:()=>{throw Error('must not call');}});assert.equal((await a.post({...body,...changes})).status,status);});
test('rejects cross-origin paid requests',async t=>{const a=await setup(t);assert.equal((await a.post(body,{Origin:'https://other.test'})).status,403);});
test('does not automatically retry or echo provider errors',async t=>{let n=0;const a=await setup(t,{fetchImpl:async()=>{n++;return new Response(JSON.stringify({error:key}),{status:403});}});const r=await a.post();assert.equal(r.status,502);assert(!(await r.text()).includes(key));assert.equal(n,1);});
test('provider quota and timeout are explicit',async t=>{const a=await setup(t,{fetchImpl:async()=>new Response('{}',{status:429})});assert.equal((await a.post()).status,429);const b=await setup(t,{fetchImpl:async()=>{throw new DOMException('timeout','TimeoutError');}});assert.equal((await b.post()).status,504);});
test('rejects provider responses without an image',async t=>{const a=await setup(t,{fetchImpl:async()=>new Response(JSON.stringify({status:'completed',steps:[]}))});assert.equal((await a.post()).status,422);});
test('deduplicates identifiers without another paid request',async t=>{let n=0;const a=await setup(t,{fetchImpl:async()=>{n++;return output();}});assert.equal((await a.post()).status,200);assert.equal((await a.post()).status,409);assert.equal(n,1);});
test('enforces daily budget across different requests',async t=>{const a=await setup(t,{env:{...env,AI_DAILY_LIMIT:'1'},fetchImpl:async()=>output()});assert.equal((await a.post()).status,200);assert.equal((await a.post(body,{'X-Request-ID':crypto.randomUUID()})).status,429);});
test('rejects simultaneous generations',async t=>{let release,started;const didStart=new Promise(r=>started=r);const a=await setup(t,{fetchImpl:()=>{started();return new Promise(r=>release=()=>r(output()));}});const first=a.post();await didStart;assert.equal((await a.post(body,{'X-Request-ID':crypto.randomUUID()})).status,429);release();assert.equal((await first).status,200);});
test('malformed JSON and oversized bodies are rejected',async t=>{const a=await setup(t);const req=b=>fetch(a.url+'/api/images/edit',{method:'POST',headers:a.headers,body:b});assert.equal((await req('{')).status,400);assert.equal((await req('x'.repeat(8*1024*1024+1))).status,413);});

test('config identifies disabled generation without revealing credentials or calling provider',async t=>{for(const flag of ['', 'false', 'TRUE']){let calls=0;const a=await setup(t,{env:{...env,AI_ENABLED:flag},fetchImpl:()=>{calls++;throw Error('must not call');}});const r=await fetch(a.url+'/api/config',{headers:a.headers});const text=await r.text();assert(!text.includes(key));assert(!text.includes(secret));assert.deepEqual(JSON.parse(text).missingConfig,['AI_ENABLED']);assert.equal((await a.post()).status,503);assert.equal(calls,0);}});
test('config reports both missing settings and clears them when enabled',async t=>{const a=await setup(t,{env:{...env,GEMINI_API_KEY:'',AI_ENABLED:''}});const data=await (await fetch(a.url+'/api/config',{headers:a.headers})).json();assert.deepEqual(data.missingConfig,['GEMINI_API_KEY','AI_ENABLED']);assert.equal(data.available,false);const b=await setup(t);const ready=await (await fetch(b.url+'/api/config',{headers:b.headers})).json();assert.equal(ready.available,true);assert.deepEqual(ready.missingConfig,[]);});

test('reports provider validation status without leaking upstream messages or request data',async t=>{
 t.mock.method(console,'error',()=>{});
 let calls=0;
 const a=await setup(t,{fetchImpl:async()=>{calls++;return new Response(JSON.stringify({error:{status:'INVALID_ARGUMENT',message:key+' '+secret+' '+body.prompt,details:[{reason:key,metadata:{key}}]}}),{status:400});}});
 const r=await a.post();const text=await r.text();assert.equal(r.status,502);assert.match(text,/HTTP 400/);assert.match(text,/INVALID_ARGUMENT/);for(const sensitive of [key,secret,body.prompt,PNG])assert(!text.includes(sensitive));assert.equal(calls,1);
});
test('explains IP restriction errors and preserves secret-free diagnostic logs',async t=>{
 const logs=[];t.mock.method(console,'error',(...args)=>logs.push(args));
 const a=await setup(t,{fetchImpl:async()=>new Response(JSON.stringify({error:{status:'PERMISSION_DENIED',message:key,details:[{reason:'API_KEY_IP_ADDRESS_BLOCKED',metadata:{ip:'private',key}}]}}),{status:403})});
 const r=await a.post();const text=await r.text();assert.match(text,/API_KEY_IP_ADDRESS_BLOCKED/);assert.match(text,/Outbound/);const logged=JSON.stringify(logs);assert(!logged.includes(key));assert(!logged.includes('private'));assert(!text.includes(key));
});
test('handles non-JSON provider failures without retrying or exposing content',async t=>{
 t.mock.method(console,'error',()=>{});let calls=0;
 const a=await setup(t,{fetchImpl:async()=>{calls++;return new Response('<html>'+key+'</html>',{status:503});}});
 const r=await a.post();const text=await r.text();assert.equal(r.status,502);assert.match(text,/HTTP 503/);assert(!text.includes(key));assert.equal(calls,1);
});
