import vm from 'node:vm';
import {readFileSync} from 'node:fs';
export async function frontend({reducedMotion=true}={}){
 const root=new URL('../dist/',import.meta.url),html=readFileSync(new URL('index.html',root),'utf8');
 const nodes=new Map(),images=[],frames=new Map();let frameId=0,timerId=0;const timers=new Map(),media={matches:reducedMotion,addEventListener(event,fn){this.onchange=fn;}};
 function element(){
  let markup='';const attributes=new Map(),events=new Map(),classes=new Set(),styles=new Map(),calls=[],stack=[];
  const ctx=new Proxy({fillStyle:'#000',globalAlpha:1,save(){stack.push({fillStyle:this.fillStyle,globalAlpha:this.globalAlpha});calls.push({op:'save'});},restore(){Object.assign(this,stack.pop());calls.push({op:'restore'});},measureText:text=>({width:text.length*12}),createLinearGradient:()=>({addColorStop(){}}),createRadialGradient:()=>({addColorStop(){}}),getImageData:(x,y,w,h)=>({width:w,height:h,data:new Uint8ClampedArray(w*h*4)}),createImageData:(w,h)=>({width:w,height:h,data:new Uint8ClampedArray(w*h*4)})},{get(target,key){if(key in target)return target[key];return (...args)=>calls.push({op:key,args,color:target.fillStyle,alpha:target.globalAlpha});}});
  return {attributes,events,classes,styles,calls,dataset:{},width:1080,height:1350,value:'',checked:false,hidden:false,open:false,children:[],files:[],
   set innerHTML(value){markup=value;this.children=[];},get innerHTML(){return markup;},
   style:{setProperty:(key,value)=>styles.set(key,value),removeProperty:key=>styles.delete(key)},
   classList:{toggle(key,on){on?classes.add(key):classes.delete(key);},add:key=>classes.add(key),remove:key=>classes.delete(key)},
   getContext:()=>ctx,toBlob:fn=>fn({type:'image/png'}),toDataURL:()=>('data:image/png;base64,'+Buffer.from('canvas').toString('base64')),
   setAttribute:(key,value)=>attributes.set(key,value),removeAttribute:key=>attributes.delete(key),addEventListener:(event,fn)=>events.set(event,fn),
   querySelector:()=>element(),append(child){this.children.push(child);},showModal(){this.open=true;},close(){this.open=false;events.get('close')?.();},scrollIntoView(){},contains(){return false;},focus(){},animate(){return {cancel(){}};}};
 }
 const $=id=>{if(!nodes.has(id))nodes.set(id,element());return nodes.get(id);};
 const list=(attribute)=>[...html.matchAll(new RegExp(attribute+'="([^\"]+)"','g'))].map(([,value])=>Object.assign(element(),{dataset:{[attribute.slice(5)]:value}}));
 const selectors=new Map([['[data-hero]',list('data-hero')],['[data-filter]',list('data-filter')],['[data-step]',list('data-step')],['[data-panel]',list('data-panel')],['[data-nav]',list('data-nav')]]);
 class Image{
  constructor(){this.width=1080;this.height=1350;this.complete=false;this.naturalWidth=0;this.pending=[];images.push(this);}
  decode(){return this.complete?this.naturalWidth?Promise.resolve():Promise.reject(Error('Image failed')):new Promise((resolve,reject)=>this.pending.push({resolve,reject}));}
  finish(){this.complete=true;this.naturalWidth=this.width;this.onload?.();this.pending.forEach(p=>p.resolve());this.pending=[];}
  fail(){this.complete=true;this.onerror?.();this.pending.forEach(p=>p.reject(Error('Image failed')));this.pending=[];}
 }
 const window={innerHeight:844,addEventListener(){}};
 const context=vm.createContext({document:{addEventListener(){},querySelector:$,querySelectorAll:selector=>selectors.get(selector)||[],createElement:element,body:element(),fonts:{ready:Promise.resolve()}},window,Image,localStorage:{getItem:()=>null,setItem(){}},matchMedia:()=>media,setTimeout:(fn,delay)=>{timers.set(++timerId,{fn,delay});return timerId;},clearTimeout:id=>timers.delete(id),requestAnimationFrame:fn=>{frames.set(++frameId,fn);return frameId;},cancelAnimationFrame:id=>frames.delete(id),fetch:async()=>({ok:true,json:async()=>({available:false,missingConfig:['GEMINI_API_KEY']})}),AbortSignal,crypto});
 for(const [,src] of html.matchAll(/<script src="([^"]+)"/g))vm.runInContext(readFileSync(new URL(src.replace(/^\//,''),root),'utf8'),context,{filename:src});
 await new Promise(resolve=>setImmediate(resolve));
 return {$,context,images,selectors,timers,media,tick(){const [id,timer]=[...timers][0];timers.delete(id);timer.fn();},state:vm.runInContext('state',context),campaigns:vm.runInContext('campaigns',context),element,
  open(index=0){context.openEditor(this.campaigns[index]);},
  frame(){for(const [id,fn] of [...frames]){frames.delete(id);fn();}},
  input(id,value){const node=$(id);node.value=value;node.oninput?.({target:node});node.events.get('input')?.({target:node});},
  change(id,value){const node=$(id);node.value=value;return node.onchange?.({target:node});},
  finishBackground(c){images.find(i=>i.src===c.backgroundUrl)?.finish();},
  drawCalls(){const calls=$('#preview-canvas').calls;const start=calls.findLastIndex(call=>call.op==='clearRect');return calls.slice(start);},
  setUpload(fn){context.loadUpload=fn;},
  upload(id,files){const node=$(id);node.files=files;return node.onchange({target:node});}};
}

