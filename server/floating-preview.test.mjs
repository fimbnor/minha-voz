import vm from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';
import {frontend} from './frontend-harness.mjs';
async function editor(){
 const e=await frontend();
 e.$('.editor-shell').getBoundingClientRect=()=>({left:0,top:0,width:390,height:740});
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
 e.context.restoreFloatingPreview();assert.equal(e.$('#floating-preview-panel').hidden,false);
 e.$('#floating-preview-opacity').oninput({target:{value:'35'}});
 assert.equal(e.$('#floating-preview-canvas').style.opacity,.35);
 assert.equal(e.$('#floating-preview-opacity-value').textContent,'35%');
 assert.equal(e.$('#floating-preview-panel').style.opacity,undefined);
 e.$('#floating-preview-close').onclick();assert.equal(e.$('#floating-preview-panel').hidden,false);
 assert(e.$('#floating-preview').classes.has('small-floating-preview'));
 assert.equal(e.context.activePage(),page);
});
test('moving the preview keeps its controls within the editor and resets on close',async()=>{
 const e=await editor();e.open();e.context.restoreFloatingPreview();e.context.setFloatingPreviewPosition(999,-50);
 assert.equal(e.$('#floating-preview').style.left,'170px');assert.equal(e.$('#floating-preview').style.top,'0px');
 e.context.restoreFloatingPreview();e.$('#editor').close();
 assert.equal(e.$('#floating-preview-panel').hidden,true);
 assert.equal(e.$('#floating-preview-panel').hidden,true);
});

test('lower-left resize shrinks upward to button size and grows to screen bounds',async()=>{
 const e=await editor();e.open();e.context.restoreFloatingPreview();
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
 const e=await editor();e.open();e.change('#format','story');e.context.restoreFloatingPreview();
 e.$('#floating-preview-full').onclick();
 let g=JSON.parse(vm.runInContext('JSON.stringify(floatingPreviewGeometry)',e.context));
 assert(g.width<=390&&g.height<=740);
 e.$('.editor-shell').getBoundingClientRect=()=>({left:0,top:0,width:390,height:370});e.context.clampFloatingPreview();
 g=JSON.parse(vm.runInContext('JSON.stringify(floatingPreviewGeometry)',e.context));assert(g.height<=370);
 e.$('#floating-preview-close').onclick();e.context.restoreFloatingPreview();
 const again=JSON.parse(vm.runInContext('JSON.stringify(floatingPreviewGeometry)',e.context));assert.equal(again.width,g.width);
});

test('opacity changes only the preview and full screen adapts to keyboard bounds',async()=>{
 const e=await editor();e.open();e.context.restoreFloatingPreview();const page=e.context.activePage();
 e.$('#floating-preview-opacity').oninput({target:{value:'20'}});
 assert.equal(e.$('#floating-preview-canvas').style.opacity,.2);
 assert.equal(e.$('#floating-preview-opacity').attributes.get('aria-valuetext'),'20%');
 e.$('.editor-shell').getBoundingClientRect=()=>({width:390,height:370});
 e.$('#floating-preview-full').onclick();
 const g=JSON.parse(vm.runInContext('JSON.stringify(floatingPreviewGeometry)',e.context));
 assert.equal(g.height,370);assert.equal(e.context.activePage(),page);assert.equal(page.backgroundMode,'image');
});

test('collapsed card can move and expand at its new position without losing opacity or chosen size',async()=>{
 const e=await editor();e.open();e.context.restoreFloatingPreview();
 const geometry=()=>JSON.parse(vm.runInContext('JSON.stringify(floatingPreviewGeometry)',e.context));
 const width=geometry().width;
 e.$('#floating-preview-opacity').oninput({target:{value:'55'}});
 e.$('#floating-preview-close').onclick();assert.equal(geometry().width,80);
 e.context.setFloatingPreviewPosition(240,320);
 const miniature=geometry();assert.equal(miniature.left,240);assert.equal(miniature.top,320);
 e.context.restoreFloatingPreview();
 assert.equal(geometry().width,width);assert.equal(geometry().top,320);
 assert.equal(geometry().left+geometry().width,miniature.left+miniature.width);
 assert.equal(e.$('#floating-preview-canvas').style.opacity,.55);
});

test('mobile editor opens with a live movable miniature without an extra preview button',async()=>{
 const e=await editor();e.open();
 const g=JSON.parse(vm.runInContext('JSON.stringify(floatingPreviewGeometry)',e.context));
 assert.equal(g.width,80);assert.equal(e.$('#floating-preview-panel').hidden,false);
 assert(e.$('#floating-preview').classes.has('small-floating-preview'));
 e.context.setFloatingPreviewPosition(20,120);
 e.context.renderPreview();
 const moved=JSON.parse(vm.runInContext('JSON.stringify(floatingPreviewGeometry)',e.context));
 assert.equal(moved.left,20);assert.equal(moved.top,120);
});

test('miniature expands in one explicit full-screen action and the lower-left handle remains available',async()=>{
 const e=await editor();e.open();
 e.$('#floating-preview-full').onclick();
 let g=JSON.parse(vm.runInContext('JSON.stringify(floatingPreviewGeometry)',e.context));assert.equal(g.width,390);
 e.context.resizeFloatingPreview('sw',10000,-10000,g);
 g=JSON.parse(vm.runInContext('JSON.stringify(floatingPreviewGeometry)',e.context));assert.equal(g.width,80);
 e.$('#floating-preview-full').onclick();
 g=JSON.parse(vm.runInContext('JSON.stringify(floatingPreviewGeometry)',e.context));assert.equal(g.width,390);
 assert(e.$('[data-preview-corner="sw"]').events.has('pointerdown'));
});
