import test from 'node:test';
import assert from 'node:assert/strict';
import {frontend} from './frontend-harness.mjs';

test('text offsets and angle render across rectangular and circular formats without moving photo settings',async()=>{
 const e=await frontend();e.open();
 e.input('#text-x',10);e.input('#text-y',-20);e.input('#text-rotation',45);
 for(const format of ['feed','story','profile','photo','instagram-profile','carousel']){
  e.change('#format',format);const calls=e.drawCalls(),canvas=e.$('#preview-canvas');
  assert(calls.some(c=>c.op==='translate'&&c.args[0]===canvas.width*.1&&c.args[1]===-canvas.height*.2));
  assert(calls.some(c=>c.op==='rotate'&&c.args[0]===Math.PI/4));
 }
 assert.equal(e.state.x,0);assert.equal(e.state.y,0);assert.equal(e.state.rotation,0);
 assert.equal(e.$('#text-rotation-value').textContent,'45°');
});

test('text placement stays independent per carousel post and survives project restoration',async()=>{
 const e=await frontend();e.open();e.change('#format','carousel');
 e.input('#text-x',12);e.input('#text-y',20);e.input('#text-rotation',-35);
 e.context.setCurrentPage(1);assert.equal(e.state.textX,0);
 e.input('#text-x',-18);e.context.setCurrentPage(0);
 assert.equal(e.state.textX,12);assert.equal(e.state.textY,20);assert.equal(e.state.textRotation,-35);
 const saved=e.state.pages.map(e.context.projectPage);
 await e.context.restoreProject({version:1,id:'text',pages:saved,format:'carousel',step:3,slide:0,edits:[]});
 assert.equal(e.state.textX,12);assert.equal(e.$('#text-x').value,12);assert.equal(e.state.textRotation,-35);
});

test('reset clears only position and rotation and legacy projects get neutral placement',async()=>{
 const e=await frontend();e.open();e.input('#headline','Minha frase');e.input('#text-size',115);
 e.input('#text-x',25);e.input('#text-y',-15);e.input('#text-rotation',90);
 e.$('#reset-text-position').onclick();
 assert.equal(e.state.textX,0);assert.equal(e.state.textY,0);assert.equal(e.state.textRotation,0);
 assert.equal(e.state.textSize,115);assert.equal(e.state.text,'Minha frase');
 const saved=e.context.projectPage(e.context.activePage());delete saved.textX;delete saved.textY;delete saved.textRotation;
 await e.context.restoreProject({version:1,id:'legacy',pages:[saved],format:'feed',step:3,edits:[]});
 assert.equal(e.state.textX,0);assert.equal(e.state.textY,0);assert.equal(e.state.textRotation,0);
});

test('text placement invalidates approved AI composites and pending snapshots',async()=>{
 const e=await frontend();e.open();
 const before=e.context.aiSnapshot();
 e.context.carryAICardToFormat({width:1080,height:1350});e.context.renderPreview();assert(e.state.aiCard);
 e.input('#text-rotation',20);
 assert.equal(e.state.aiCard,null);assert.equal(e.context.sameAISnapshot(before,e.context.aiSnapshot()),false);
});
