import test from 'node:test';
import assert from 'node:assert/strict';
import {frontend} from './frontend-harness.mjs';

test('message aligns left, center and right across rectangular and circular cards',async()=>{
 const e=await frontend();e.open();e.input('#headline','Minha frase');
 for(const format of ['feed','story','photo','instagram-profile']){
  e.change('#format',format);const w=e.$('#preview-canvas').width;
  const left=format==='instagram-profile'?w*.24:w*55/720,right=w-left;
  for(const [alignment,x] of [['left',left],['center',w/2],['right',right]]){
   e.change('#text-align',alignment);
   const call=e.drawCalls().find(c=>c.op==='fillText'&&c.args[0]==='Minha frase');
   assert(call);assert(Math.abs(call.args[1]-x)<1e-8);
  }
 }
});

test('contrast plate renders under the message, follows rotation and only fades its own background',async()=>{
 const e=await frontend();e.open();e.input('#headline','Mensagem legível');
 e.$('#text-plate').checked=true;e.$('#text-plate').onchange({target:e.$('#text-plate')});
 e.input('#text-plate-color','#abc123');e.input('#text-plate-opacity',40);e.input('#text-rotation',30);
 const calls=e.drawCalls(),plate=calls.findIndex(c=>c.op==='fill'&&c.color==='#abc123'),text=calls.findIndex(c=>c.op==='fillText'&&c.args[0]==='Mensagem legível');
 assert(plate>=0&&plate<text);assert.equal(calls[plate].alpha,.4);assert.equal(calls[text].alpha,1);
 assert(calls.slice(0,plate).some(c=>c.op==='rotate'&&c.args[0]===Math.PI/6));
 e.$('#text-plate').checked=false;e.$('#text-plate').onchange({target:e.$('#text-plate')});
 assert(!e.drawCalls().some(c=>c.op==='fill'&&c.color==='#abc123'));
 assert.equal(e.state.textRotation,30);
});

test('automatic contrast tracks text color and blank messages get no plate',async()=>{
 const e=await frontend();e.open();e.$('#text-plate').checked=true;e.$('#text-plate').onchange({target:e.$('#text-plate')});
 e.input('#text-color','#ffffff');assert.equal(e.$('#text-plate-color').value,'#102c22');
 e.input('#text-color','#000000');assert.equal(e.$('#text-plate-color').value,'#fffefa');
 e.input('#text-plate-color','#123456');e.input('#headline','');
 assert(!e.drawCalls().some(c=>c.op==='fill'&&c.color==='#123456'));
});

test('text plate and alignment persist per post and in projects, with neutral legacy defaults',async()=>{
 const e=await frontend();e.open();e.change('#format','carousel');e.context.navigateCreation(3);
 e.change('#text-align','right');e.$('#text-plate').checked=true;e.$('#text-plate').onchange({target:e.$('#text-plate')});e.input('#text-plate-opacity',75);
 e.context.setCurrentPage(1);assert.equal(e.state.textPlate,false);assert.equal(e.state.textAlign,'auto');
 e.context.setCurrentPage(0);const saved=e.context.projectPage(e.context.activePage());
 await e.context.restoreProject({version:1,id:'styles',pages:[saved],format:'feed',step:3,edits:[]});
 assert.equal(e.state.textAlign,'right');assert.equal(e.state.textPlate,true);assert.equal(e.state.textPlateOpacity,75);
 for(const key of ['textAlign','textPlate','textPlateColor','textPlateOpacity'])delete saved[key];
 await e.context.restoreProject({version:1,id:'legacy',pages:[saved],format:'instagram-profile',step:3,edits:[]});
 assert.equal(e.state.textPlate,false);assert.equal(e.$('#text-align').value,'center');
});

test('alignment and plate changes invalidate AI composites',async()=>{
 const e=await frontend();e.open();
 for(const change of [()=>e.change('#text-align','center'),()=>{e.$('#text-plate').checked=true;e.$('#text-plate').onchange({target:e.$('#text-plate')});}]){
  e.context.carryAICardToFormat({width:1080,height:1350});e.context.renderPreview();assert(e.state.aiCard);
  change();assert.equal(e.state.aiCard,null);
 }
});
