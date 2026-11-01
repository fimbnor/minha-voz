import test from 'node:test';
import assert from 'node:assert/strict';
import {createApp} from './index.mjs';
const web={apiKey:'public-api-key',projectId:'minhavoz-4ac40',authDomain:'minhavoz-4ac40.firebaseapp.com',appId:'web-id',storageBucket:'minhavoz-4ac40.firebasestorage.app',privateKey:'never-expose'};
const env={FIREBASE_AUTH_ENABLED:'true',FIREBASE_WEB_CONFIG:JSON.stringify(web),PUBLIC_ORIGIN:'https://minhavoz.test',GEMINI_API_KEY:'fake',AI_ENABLED:'true'};
async function app(t){const server=createApp({env,verifyFirebaseToken:async token=>{if(token!=='good-token')throw Error('invalid');return {uid:'user-a'};}});await new Promise(r=>server.listen(0,'127.0.0.1',r));t.after(()=>new Promise(r=>server.close(r)));return `http://127.0.0.1:${server.address().port}`;}
test('Firebase mode exposes only public configuration and the website',async t=>{const url=await app(t);let response=await fetch(url+'/api/firebase-config');assert.equal(response.status,200);const config=await response.json();assert.equal(config.enabled,true);assert.equal(config.firebase.projectId,web.projectId);assert.equal(config.firebase.privateKey,undefined);response=await fetch(url+'/');assert.equal(response.status,200);});
test('image editing requires a verified Firebase token',async t=>{const url=await app(t);const request=token=>fetch(url+'/api/images/edit',{method:'POST',headers:{Origin:env.PUBLIC_ORIGIN,'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},body:'{}'});assert.equal((await request()).status,401);assert.equal((await request('bad-token')).status,401);assert.equal((await request('good-token')).status,400);});
test('Firebase mode fails closed when web configuration is missing',()=>assert.throws(()=>createApp({env:{FIREBASE_AUTH_ENABLED:'true'}})));
