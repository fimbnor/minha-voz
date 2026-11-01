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
 assert.equal(e.$('#floating-preview-canvas').height,427);
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
 e.$('#floating-preview-close').onclick();assert.equal(e.$('#floating-preview-panel').hidden,true);
 assert.equal(e.$('#floating-preview-toggle').hidden,false);assert.equal(e.context.activePage(),page);
});
test('moving the preview keeps its controls within the editor and resets on close',async()=>{
 const e=await editor();e.open();e.context.setFloatingPreviewPosition(999,-50);
 assert.equal(e.$('#floating-preview').style.left,'142px');assert.equal(e.$('#floating-preview').style.top,'8px');
 e.$('#floating-preview-toggle').onclick();e.$('#editor').close();
 assert.equal(e.$('#floating-preview-panel').hidden,true);
 assert.equal(e.$('#floating-preview-toggle').attributes.get('aria-expanded'),'false');
});
