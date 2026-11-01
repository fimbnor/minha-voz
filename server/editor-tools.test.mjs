import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';

const source=readFileSync(new URL('../dist/editor-tools.js',import.meta.url),'utf8');
function editor(){
 const nodes=new Map(),events=new Map(),viewportEvents=new Map(),frames=new Map(),copies=[],scrolled=[];
 let nextFrame=0;
 function node(id){
  const properties=new Map(),classes=new Set(),listeners=new Map();
  return {open:false,width:0,height:0,textContent:'',properties,classes,listeners,
   style:{setProperty:(key,value)=>properties.set(key,value),removeProperty:key=>properties.delete(key)},
   classList:{toggle(key,on){on?classes.add(key):classes.delete(key);},remove:key=>classes.delete(key)},
   setAttribute(){},addEventListener:(key,fn)=>listeners.set(key,fn),contains:target=>target?.control===true,
   getContext:()=>({drawImage:(...args)=>copies.push(args)}),
   showModal(){this.open=true;},close(){this.open=false;this.listeners.get('close')?.();},
   scrollIntoView:()=>scrolled.push(id)};
 }
 const $=id=>{if(!nodes.has(id))nodes.set(id,node(id));return nodes.get(id);};
 const mobile={matches:true},landscape={matches:false};
 const viewport={height:844,offsetTop:0,addEventListener:(event,fn)=>viewportEvents.set(event,fn)};
 const state={format:'feed'},document={activeElement:null},window={visualViewport:viewport,innerHeight:844,addEventListener:(event,fn)=>events.set(event,fn)};
 let renders=0;
 const context=vm.createContext({$,state,document,window,Math,matchMedia:query=>query==='(max-width:580px)'?mobile:landscape,
  requestAnimationFrame:fn=>{const id=++nextFrame;frames.set(id,fn);return id;},cancelAnimationFrame:id=>frames.delete(id),renderPreview:()=>renders++});
 vm.runInContext(source,context);
 function flush(){for(const [id,fn] of [...frames]){frames.delete(id);fn();}}
 return {$,mobile,landscape,viewport,viewportEvents,window,document,events,context,frames,copies,scrolled,state,flush,get renders(){return renders;}};
}
test('sizes the mobile editor to the visible viewport and compacts it when the keyboard takes space',()=>{
 const e=editor();e.$('#editor').open=true;e.context.syncEditorViewport();
 assert.equal(e.$('#editor').properties.get('--editor-height'),'844px');assert(!e.$('#editor').classes.has('compact-editor'));
 e.viewport.height=370.4;e.viewport.offsetTop=22.1;e.viewportEvents.get('resize')();e.flush();
 assert.equal(e.$('#editor').properties.get('--editor-height'),'370px');assert.equal(e.$('#editor').properties.get('--editor-top'),'22px');assert(e.$('#editor').classes.has('compact-editor'));
 e.viewport.height=844;e.viewport.offsetTop=0;e.viewportEvents.get('resize')();e.flush();assert(!e.$('#editor').classes.has('compact-editor'));
});
test('viewport resize keeps a focused control in its own scroll area and coalesces events',()=>{
 const e=editor();e.$('#editor').open=true;e.document.activeElement={control:true,scrollIntoView:options=>e.scrolled.push(options.block)};
 e.viewportEvents.get('resize')();e.events.get('resize')();assert.equal(e.frames.size,1);e.flush();
 assert.deepEqual(e.scrolled,['nearest']);
 e.document.activeElement=null;e.viewportEvents.get('scroll')();assert.deepEqual(e.scrolled,['nearest']);
});
test('cleans up mobile sizing for desktop or closed dialogs and falls back without VisualViewport',()=>{
 const e=editor();e.$('#editor').open=true;e.window.visualViewport=undefined;e.window.innerHeight=667;e.context.syncEditorViewport();
 assert.equal(e.$('#editor').properties.get('--editor-height'),'667px');
 e.mobile.matches=false;e.context.syncEditorViewport();assert.equal(e.$('#editor').properties.size,0);
 e.landscape.matches=true;e.context.syncEditorViewport();assert.equal(e.$('#editor').properties.get('--editor-height'),'667px');
 e.events.get('resize')();e.$('#preview-dialog').open=true;e.$('#editor').close();
 assert.equal(e.frames.size,0);assert.equal(e.$('#editor').properties.size,0);assert.equal(e.$('#preview-dialog').open,false);
});
test('expanded preview copies the current full resolution card without changing editor state',()=>{
 const e=editor(),original=e.$('#preview-canvas');original.width=1080;original.height=1920;e.$('#preview-label').textContent='Story · 1080 × 1920';
 e.$('#editor').open=true;e.$('#expand-preview').onclick();
 assert.equal(e.renders,1);assert.equal(e.$('#expanded-preview-canvas').width,1080);assert.equal(e.$('#expanded-preview-canvas').height,1920);
 assert.equal(e.copies[0][0],original);assert.equal(e.$('#preview-dialog').open,true);assert.equal(e.$('#expanded-preview-label').textContent,'Story · 1080 × 1920');
 e.$('#return-to-editor').onclick();assert.equal(e.$('#preview-dialog').open,false);assert.equal(e.$('#editor').open,true);assert.equal(e.state.format,'feed');
 e.state.format='instagram-profile';e.$('#expand-preview').onclick();assert(e.$('#expanded-preview-canvas').classes.has('circular-profile'));
 e.$('#close-preview').onclick();assert.equal(e.$('#preview-dialog').open,false);
});
test('switching editor steps scrolls only the settings, leaving the preview in place',()=>{
 const app=readFileSync(new URL('../dist/app.js',import.meta.url),'utf8');
 const code=app.slice(app.indexOf('function setStep('),app.indexOf('function selectCampaign('));
 const controls={scrollTop:900,scrollIntoView(){throw Error('must not scroll the editor or hide the canvas');}},state={step:1};
 const context=vm.createContext({state,$:()=>controls,$$:()=>[],matchMedia:()=>({matches:true})});vm.runInContext(code,context);
 context.setStep(3);assert.equal(state.step,3);assert.equal(controls.scrollTop,0);
});

test('mobile preview actions open the current card and return to the same task',()=>{
 const e=editor();e.state.step=5;e.$('#editor').open=true;
 e.$('#view-card').onclick();assert.equal(e.$('#preview-dialog').open,true);
 e.$('#return-to-editor').onclick();assert.equal(e.state.step,5);
 e.$('#review-card').onclick();assert.equal(e.$('#preview-dialog').open,true);
});
