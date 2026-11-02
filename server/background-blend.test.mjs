import test from 'node:test';
import assert from 'node:assert/strict';
import {frontend} from './frontend-harness.mjs';
const image=(name)=>({width:300,height:400,name});
async function upload(e,overlay){e.setUpload(async()=>overlay);await e.upload('#background-blend-input',[{}]);}

test('blend composes over the selected background at 0, 50 and 100 percent across formats',async()=>{
 const e=await frontend();e.open();const base=image('base'),overlay=image('overlay');e.state.background=base;
 await upload(e,overlay);assert.equal(e.state.background,base);
 for(const format of ['feed','story','profile','instagram-profile','photo']){
  e.change('#format',format);
  for(const weight of [0,50,100]){
   e.input('#background-blend',weight);const calls=e.drawCalls();
   assert(calls.some(c=>c.op==='drawImage'&&c.args[0]===base));
   const layer=calls.find(c=>c.op==='drawImage'&&c.args[0]===overlay);
   if(weight===0)assert.equal(layer,undefined);else assert.equal(layer.alpha,weight/100);
  }
 }
 e.$('#remove-background-blend').onclick();assert.equal(e.state.backgroundOverlay,null);assert.equal(e.state.background,base);
});

test('starter carousel inherits blend while later edits stay on the current page',async()=>{
 const e=await frontend();e.open();e.change('#format','carousel');const overlay=image('overlay');
 await upload(e,overlay);e.input('#background-blend',35);
 assert(e.state.pages.every(p=>p.backgroundOverlay===overlay&&p.backgroundBlend===35));
 e.context.navigateCreation(2);e.context.navigateCreation(0);e.input('#background-blend',75);
 assert.equal(e.state.pages[0].backgroundBlend,75);assert.equal(e.state.pages[1].backgroundBlend,35);
 e.context.setCurrentPage(1);assert.equal(e.$('#background-blend').value,35);
 e.$('#remove-background-blend').onclick();assert.equal(e.state.pages[1].backgroundOverlay,null);assert.equal(e.state.pages[0].backgroundOverlay,overlay);
});

test('projects serialize the second image and blend; legacy projects remain unblended',async()=>{
 const e=await frontend();e.open();await upload(e,image('overlay'));e.input('#background-blend',70);
 const saved=e.context.projectPage(e.context.activePage());assert.match(saved.backgroundOverlay,/^data:image\/png;base64,/);
 const restoring=e.context.restoreProject({version:1,id:'blend',pages:[saved],step:0,format:'feed',edits:[]});
 await new Promise(resolve=>setImmediate(resolve));for(const img of e.images)if(img.src?.startsWith('data:'))img.finish();await restoring;
 assert.equal(e.state.backgroundBlend,70);assert.equal(e.state.backgroundOverlay.src,saved.backgroundOverlay);
 delete saved.backgroundOverlay;delete saved.backgroundBlend;
 await e.context.restoreProject({version:1,id:'old',pages:[saved],step:0,format:'feed',edits:[]});
 assert.equal(e.state.backgroundOverlay,null);assert.equal(e.state.backgroundBlend,50);
});

test('late uploads cannot undo removal, replace newer images or affect a different post',async()=>{
 const e=await frontend();e.open();let finish;e.setUpload(()=>new Promise(resolve=>{finish=resolve;}));
 let pending=e.upload('#background-blend-input',[{}]);e.$('#remove-background-blend').onclick();finish(image('stale'));await pending;assert.equal(e.state.backgroundOverlay,null);
 e.setUpload(()=>new Promise(resolve=>{finish=resolve;}));pending=e.upload('#background-blend-input',[{}]);const newer=image('newer');await upload(e,newer);finish(image('old'));await pending;assert.equal(e.state.backgroundOverlay,newer);
 e.change('#format','carousel');e.setUpload(()=>new Promise(resolve=>{finish=resolve;}));pending=e.upload('#background-blend-input',[{}]);e.context.setCurrentPage(1);finish(image('other page'));await pending;assert.equal(e.state.pages[0].backgroundOverlay,newer);
});

test('changing the blend invalidates an approved AI composite and preserves photo and text',async()=>{
 const e=await frontend();e.open();await upload(e,image('overlay'));const photo=image('photo');e.state.photo=photo;e.input('#headline','Minha mensagem');
 e.context.carryAICardToFormat(image('AI'));e.context.renderPreview();assert(e.state.aiCard);
 e.input('#background-blend',80);assert.equal(e.state.aiCard,null);assert.equal(e.state.photo,photo);assert.equal(e.state.text,'Minha mensagem');
});
