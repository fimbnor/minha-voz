import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';

test('the shipped catalog and browser scripts initialize the editor and all banner choices',async()=>{
 const root=new URL('../dist/',import.meta.url),nodes=new Map();
 const html=readFileSync(new URL('index.html',root),'utf8');
 const drawing=new Proxy({}, {get:(_,key)=>key==='measureText'?text=>({width:text.length*10}):key==='createLinearGradient'||key==='createRadialGradient'?()=>({addColorStop(){}}):()=>{}});
 function element(){return {style:{setProperty(){},removeProperty(){}},dataset:{},classList:{toggle(){},add(){},remove(){}},width:720,height:900,value:'',children:[],getContext:()=>drawing,setAttribute(){},removeAttribute(){},addEventListener(){},querySelector:()=>element(),append(child){this.children.push(child);},showModal(){this.open=true;},scrollIntoView(){}};}
 const $=id=>{if(!nodes.has(id))nodes.set(id,element());return nodes.get(id);};
 const heroButtons=[...html.matchAll(/data-hero="([^"]+)"/g)].map(([,id])=>Object.assign(element(),{dataset:{hero:id}}));
 const context=vm.createContext({document:{querySelector:$,querySelectorAll:selector=>selector==='[data-hero]'?heroButtons:[],createElement:()=>element(),body:element()},window:{addEventListener(){}},localStorage:{getItem:()=>null},Image:class{complete=false;},matchMedia:()=>({matches:true}),setTimeout,clearTimeout,requestAnimationFrame:fn=>setTimeout(fn,0),cancelAnimationFrame:clearTimeout,fetch:async()=>({ok:true,json:async()=>({available:false,missingConfig:['GEMINI_API_KEY']})}),AbortSignal});
 for(const file of ['profile-tools.js','catalogo-minha-voz/catalogo.js','composition-tools.js','app.js','photo-tools.js','logo-tools.js','ai-tools.js','editor-tools.js'])vm.runInContext(readFileSync(new URL(file,root),'utf8'),context,{filename:file});
 await new Promise(resolve=>setImmediate(resolve));
 assert.equal($('#campaign-grid').children.length,context.window.MINHA_VOZ_CATALOG.templates.length+12);
 for(const button of heroButtons){
  assert(context.window.MINHA_VOZ_CATALOG.templates.some(c=>c.id===button.dataset.hero));
  button.onclick();$('#hero-cta').onclick();assert.equal($('#editor').open,true);
 }
 assert.equal(typeof $('#download-button').onclick,'function');assert.equal(typeof $('#ai-generate').onclick,'function');
});
