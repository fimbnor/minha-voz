import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {IDBFactory} from 'fake-indexeddb';
import {webcrypto} from 'node:crypto';

const source=readFileSync(new URL('../dist/projects.js',import.meta.url),'utf8');
function setup(){
 let user={uid:'alice'};const events=new Map(),nodes=new Map(),messages=[];
 const node=()=>({children:[],disabled:false,open:false,append(...items){this.children.push(...items)},replaceChildren(...items){this.children=items},setAttribute(){},showModal(){this.open=true},close(){this.open=false}});
 const $=key=>{if(!nodes.has(key))nodes.set(key,node());return nodes.get(key)};
 const cloud={status:()=> 'ready',currentUser:()=>user};
 const context=vm.createContext({indexedDB:new IDBFactory(),window:{minhaVozCloud:cloud},document:{addEventListener:(n,fn)=>events.set(n,fn),createElement:tag=>tag==='canvas'?{width:0,height:0,getContext:()=>({drawImage(){}}),toDataURL:()=> 'data:image/png;base64,cGhvdG8='}:node(),body:{style:{}}},$,console,crypto:webcrypto,Date,Map,JSON,Array,Promise,Error,Image:class{},prompt:()=> 'Meu projeto',confirm:()=>true,toast:x=>messages.push(x),state:{campaign:{id:'modelo',name:'Modelo'},pages:[{id:'page-1',campaign:{id:'modelo'},photo:{width:2,height:2}}],slide:0,format:'feed',step:1,carouselInitialized:false},aiEdits:new Map(),syncAICard(){}});
 vm.runInContext(source,context);
 const all=()=>context.projectTransaction('readonly',s=>s.getAll());
 return {context,$,all,events,messages,setUser(uid){user=uid?{uid}:null;events.get('minhavoz-auth-changed')();}};
}
test('saves an editable project and image locally for the signed-in user',async()=>{
 const a=setup();await a.context.saveProject();const projects=await a.all();assert.equal(projects.length,1);assert.equal(projects[0].ownerId,'alice');assert.equal(projects[0].pages[0].photo,'data:image/png;base64,cGhvdG8=');assert.equal(a.messages.at(-1),'Projeto salvo neste aparelho.');
 await a.context.saveProject();assert.equal((await a.all()).length,1);
});
test('filters other accounts and keeps legacy local drafts accessible',async()=>{
 const a=setup();await a.context.saveProject();
 await a.context.projectTransaction('readwrite',s=>s.put({id:'old',title:'Rascunho antigo',updatedAt:1,version:1,pages:[]}));
 a.setUser('bob');await a.context.renderProjects();let list=a.$('#projects-list');assert.equal(list.children.length,1);assert.equal(list.children[0].children[0].children[0].textContent,'Rascunho antigo');
 a.setUser('alice');await a.context.renderProjects();list=a.$('#projects-list');assert.equal(list.children.length,2);
});
test('a different account cannot reopen or delete an account-owned project through the UI',async()=>{
 const a=setup();await a.context.saveProject();await a.context.renderProjects();const row=a.$('#projects-list').children[0];const project=(await a.all())[0];
 a.setUser('bob');await assert.rejects(a.context.restoreProject(project),/outra conta/);await row.children[2].onclick();assert.equal((await a.all()).length,1);
});
