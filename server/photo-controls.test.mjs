import test from 'node:test';
import assert from 'node:assert/strict';
import {frontend} from './frontend-harness.mjs';

test('rotation starts straight, reaches the canvas and stays independent per carousel post',async()=>{
 const e=await frontend();e.open();const photo={width:20,height:20};e.context.setPagePhoto(e.state.pages[0],photo);e.context.syncEditorFields();
 assert.equal(e.state.rotation,0);e.input('#photo-rotation',25);
 assert(e.drawCalls().some(c=>c.op==='rotate'&&Math.abs(c.args[0]-25*Math.PI/180)<1e-8));
 e.change('#format','carousel');e.context.setCurrentPage(1);assert.equal(e.state.rotation,0);
 e.context.setCurrentPage(0);assert.equal(e.$('#photo-rotation').value,25);
 e.$('#reset-photo-rotation').onclick();assert.equal(e.state.rotation,0);
 for(const format of ['photo','instagram-profile']){e.change('#format',format);e.input('#photo-rotation',40);assert(e.drawCalls().some(c=>c.op==='rotate'&&Math.abs(c.args[0]-40*Math.PI/180)<1e-8));}
});
test('restoring requires confirmation and cancel preserves treatments',async()=>{
 const e=await frontend();e.open();const photo={width:20,height:20};e.context.setPagePhoto(e.state.pages[0],photo);e.context.syncEditorFields();
 e.$('#natural-photo').onclick();const edited=e.state.photo;e.input('#photo-rotation',15);
 e.$('#restore-photo').onclick();assert.equal(e.state.photo,edited);assert.equal(e.$('#restore-photo-confirm').hidden,false);
 e.$('#cancel-restore-photo').onclick();assert.equal(e.state.photo,edited);
 e.$('#restore-photo').onclick();e.$('#confirm-restore-photo').onclick();assert.equal(e.state.photo,photo);assert.equal(e.state.rotation,15);assert.equal(e.state.photoSettings.exposure,0);assert.equal(e.$('#restore-photo-confirm').hidden,true);
});
test('natural finish gives success feedback and switching posts clears transient UI',async()=>{
 const e=await frontend();e.open();e.context.setPagePhoto(e.state.pages[0],{width:20,height:20});e.context.syncEditorFields();e.$('#natural-photo').onclick();
 assert.equal(e.$('#natural-photo').textContent,'✓ Acabamento aplicado');assert.equal(e.state.photoSettings.exposure,8);
 e.$('#restore-photo').onclick();e.change('#format','carousel');e.context.setCurrentPage(1);
 assert.equal(e.$('#restore-photo-confirm').hidden,true);assert.equal(e.$('#natural-photo').disabled,true);assert.equal(e.$('#natural-photo').textContent,'Aplicar acabamento natural');
});
test('background removal reports success only after segmentation completes',async()=>{
 const e=await frontend();e.open();e.context.setPagePhoto(e.state.pages[0],{width:20,height:20});e.context.syncEditorFields();
 e.context.getSegmenter=async()=>({segment(input,cb){cb({confidenceMasks:[{width:2,height:2,getAsFloat32Array:()=>new Float32Array([1,1,1,1])}]});}});
 const pending=e.$('#remove-bg').onclick();assert.equal(e.$('#remove-bg').textContent,'Removendo fundo…');
 await new Promise(resolve=>setImmediate(resolve));e.frame();e.frame();await pending;
 assert.equal(e.$('#remove-bg').textContent,'✓ Fundo removido');assert.equal(e.state.cutout,true);assert.equal(e.$('#remove-bg').disabled,false);
});
