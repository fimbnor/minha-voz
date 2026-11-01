import vm from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';
import {frontend} from './frontend-harness.mjs';
async function editor(){
 const e=await frontend();
 e.$('.editor-shell').getBoundingClientRect=()=>({left:0,top:0,width:390,height:740});
 e.$('#floating-preview-toggle').getBoundingClientRect=()=>({left:280,right:370,top:120,bottom:160,width:90,height:40});
 const widget=e.$('#floating-preview');
 widget.getBoundingClientRect=()=>({left:parseFloat(widget.style.left)||138,top:parseFloat(widget.style.top)||200,width:240,height:350});
 return e;
}
test('floating copies keep the current export aspect ratio and update with manual edits',async()=>{
 const e=await editor();e.open();e.change('#format','story');
 assert.equal(e.$('#floating-preview-canvas').height,1387);
 assert.equal(e.$('#floating-preview-thumb').height,100);
 const canvas=e.$('#floating-preview-canvas'),count=canvas.calls.filter(c=>c.op==='drawImage').length;
 e.input('#headline','Uma nova mensagem');
 assert(canvas.calls.filter(c=>c.op==='drawImage').length>count);
 assert.equal(e.$('#preview-canvas').width,1080);assert.equal(e.$('#preview-canvas').height,1920);
});
test('floating controls open, adjust image opacity only, and collapse without changing the card',async()=>{
 const e=await editor();e.open();const page=e.context.activePage();
 e.$('#floating-preview-toggle').onclick();assert.equal(e.$('#floating-preview-panel').hidden,false);
 e.$('#floating-preview-opacity').oninput({target:{value:'35'}});
 assert.equal(e.$('#floating-preview-canvas').style.opacity,.35);
 assert.equal(e.$('#floating-preview-opacity-value').textContent,'35%');
 assert.equal(e.$('#floating-preview-panel').style.opacity,undefined);
 e.$('#floating-preview-close').onclick();assert.equal(e.$('#floating-preview-panel').hidden,false);
 assert(e.$('#floating-preview').classes.has('small-floating-preview'));
 assert.equal(e.$('#floating-preview-toggle').hidden,false);assert.equal(e.context.activePage(),page);
});
test('moving the preview keeps its controls within the editor and resets on close',async()=>{
 const e=await editor();e.open();e.$('#floating-preview-toggle').onclick();e.context.setFloatingPreviewPosition(999,-50);
 assert.equal(e.$('#floating-preview').style.left,'170px');assert.equal(e.$('#floating-preview').style.top,'0px');
 e.$('#floating-preview-toggle').onclick();e.$('#editor').close();
 assert.equal(e.$('#floating-preview-panel').hidden,true);
 assert.equal(e.$('#floating-preview-toggle').attributes.get('aria-expanded'),'false');
});

test('lower-left resize shrinks upward to button size and grows to screen bounds',async()=>{
 const e=await editor();e.open();e.$('#floating-preview-toggle').onclick();
 const start=()=>JSON.parse(vm.runInContext('JSON.stringify(floatingPreviewGeometry)',e.context));
 const before=start();e.context.resizeFloatingPreview('sw',0,-100,before);
 assert(start().width<before.width);assert.equal(start().top,before.top);
 assert.equal(start().left+start().width,before.left+before.width);
 e.context.resizeFloatingPreview('sw',10000,-10000,before);assert.equal(start().width,80);
 e.context.resizeFloatingPreview('sw',-10000,10000,before);
 assert.equal(start().width,390);assert.equal(start().height,487.5);assert(start().left>=0);assert(start().top>=0);
 assert.equal(e.$('#preview-canvas').width,1080);assert.equal(e.$('#preview-canvas').height,1350);
});
test('resize fits story and keyboard viewports and keeps the selected size after reopening',async()=>{
 const e=await editor();e.open();e.change('#format','story');e.$('#floating-preview-toggle').onclick();
 e.$('#floating-preview-full').onclick();
 let g=JSON.parse(vm.runInContext('JSON.stringify(floatingPreviewGeometry)',e.context));
 assert(g.width<=390&&g.height<=740);
 e.$('.editor-shell').getBoundingClientRect=()=>({left:0,top:0,width:390,height:370});e.context.clampFloatingPreview();
 g=JSON.parse(vm.runInContext('JSON.stringify(floatingPreviewGeometry)',e.context));assert(g.height<=370);
 e.$('#floating-preview-close').onclick();e.$('#floating-preview-toggle').onclick();
 const again=JSON.parse(vm.runInContext('JSON.stringify(floatingPreviewGeometry)',e.context));assert.equal(again.width,g.width);
});

test('size rail ranges from button-sized to viewport-sized and stays synchronized with corners and full screen',async()=>{
 const e=await editor();e.open();e.$('#floating-preview-toggle').onclick();
 const geometry=()=>JSON.parse(vm.runInContext('JSON.stringify(floatingPreviewGeometry)',e.context));
 const original=e.$('#preview-canvas');
 e.$('#floating-preview-size').oninput({target:{value:'0'}});assert.equal(geometry().width,80);
 e.$('#floating-preview-size').oninput({target:{value:'100'}});assert.equal(geometry().width,390);
 e.$('#floating-preview-size').oninput({target:{value:'50'}});assert.equal(geometry().width,235);
 e.context.resizeFloatingPreview('sw',10000,-10000,geometry());assert.equal(e.$('#floating-preview-size').value,0);
 e.$('#floating-preview-full').onclick();assert.equal(e.$('#floating-preview-size').value,100);
 assert.equal(original.width,1080);assert.equal(original.height,1350);
});

test('vertical opacity and size rails change only the preview and adapt to keyboard bounds',async()=>{
 const e=await editor();e.open();e.$('#floating-preview-toggle').onclick();const page=e.context.activePage();
 e.$('#floating-preview-opacity').oninput({target:{value:'20'}});
 assert.equal(e.$('#floating-preview-canvas').style.opacity,.2);
 assert.equal(e.$('#floating-preview-opacity').attributes.get('aria-valuetext'),'20%');
 e.$('.editor-shell').getBoundingClientRect=()=>({width:390,height:370});
 e.$('#floating-preview-size').oninput({target:{value:'100'}});
 const g=JSON.parse(vm.runInContext('JSON.stringify(floatingPreviewGeometry)',e.context));
 assert.equal(g.height,370);assert.equal(e.context.activePage(),page);assert.equal(page.backgroundMode,'image');
});

test('collapsed card can move and expand at its new position without losing opacity or chosen size',async()=>{
 const e=await editor();e.open();e.$('#floating-preview-toggle').onclick();
 const geometry=()=>JSON.parse(vm.runInContext('JSON.stringify(floatingPreviewGeometry)',e.context));
 const width=geometry().width;
 e.$('#floating-preview-opacity').oninput({target:{value:'55'}});
 e.$('#floating-preview-close').onclick();assert.equal(geometry().width,80);
 e.context.setFloatingPreviewPosition(240,320);
 const miniature=geometry();assert.equal(miniature.left,240);assert.equal(miniature.top,320);
 e.$('#floating-preview-restore').onclick();
 assert.equal(geometry().width,width);assert.equal(geometry().top,320);
 assert.equal(geometry().left+geometry().width,miniature.left+miniature.width);
 assert.equal(e.$('#floating-preview-canvas').style.opacity,.55);
});
