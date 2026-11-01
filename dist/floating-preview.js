'use strict';
const floatingPreview=$('#floating-preview');
let floatingPreviewOpen=false,floatingPreviewDrag=null,floatingPreviewGeometry=null;
function floatingPreviewBounds(){
 const rect=$('.editor-shell').getBoundingClientRect();
 return {width:rect.width,height:rect.height};
}
function floatingPreviewRatio(){const c=$('#preview-canvas');return c.height/c.width;}
function fitFloatingPreview(width){
 const bounds=floatingPreviewBounds(),ratio=floatingPreviewRatio();
 const max=Math.min(bounds.width,bounds.height/ratio);
 const min=Math.min(80,max);
 const fitted=Math.max(min,Math.min(max,width));
 return {width:fitted,height:fitted*ratio,min,max};
}
function paintFloatingPreviewGeometry(){
 if(!floatingPreviewGeometry)return;
 const g=floatingPreviewGeometry;
 floatingPreview.style.left=g.left+'px';floatingPreview.style.top=g.top+'px';
 floatingPreview.style.setProperty('--floating-width',g.width+'px');
 floatingPreview.style.setProperty('--floating-height',g.height+'px');
 floatingPreview.classList.toggle('small-floating-preview',g.width<160||g.height<170);
}
function clampFloatingPreview(){
 if(!floatingPreviewOpen||!floatingPreviewGeometry)return;
 const bounds=floatingPreviewBounds(),g=floatingPreviewGeometry,size=fitFloatingPreview(g.width);
 Object.assign(g,{width:size.width,height:size.height,left:Math.max(0,Math.min(g.left,bounds.width-size.width)),top:Math.max(0,Math.min(g.top,bounds.height-size.height))});
 paintFloatingPreviewGeometry();
}
function syncFloatingPreview(){
 const original=$('#preview-canvas');
 for(const [selector,width] of [['#floating-preview-thumb',56],['#floating-preview-canvas',Math.min(original.width,780)]]){
  const canvas=$(selector),height=Math.round(width*original.height/original.width);
  if(canvas.width!==width)canvas.width=width;
  if(canvas.height!==height)canvas.height=height;
  const ctx=canvas.getContext('2d');ctx.clearRect(0,0,canvas.width,canvas.height);ctx.drawImage(original,0,0,canvas.width,canvas.height);
 }
 clampFloatingPreview();
}
function toggleFloatingPreview(open){
 floatingPreviewOpen=open;
 $('#floating-preview-toggle').setAttribute('aria-expanded',String(open));
 $('#floating-preview-panel').hidden=!open;
 if(open&&!floatingPreviewGeometry){
  const shell=$('.editor-shell').getBoundingClientRect(),button=$('#floating-preview-toggle').getBoundingClientRect(),size=fitFloatingPreview(220);
  floatingPreviewGeometry={left:button.right-shell.left-size.width,top:button.bottom-shell.top+8,width:size.width,height:size.height};
 }
 syncFloatingPreview();
 if(open)$('#floating-preview-close').focus({preventScroll:true});
 else $('#floating-preview-toggle').focus({preventScroll:true});
}
$('#floating-preview-toggle').onclick=()=>toggleFloatingPreview(!floatingPreviewOpen);
$('#floating-preview-close').onclick=()=>toggleFloatingPreview(false);
$('#floating-preview-full').onclick=()=>{
 const size=fitFloatingPreview(Infinity),bounds=floatingPreviewBounds();
 floatingPreviewGeometry={left:(bounds.width-size.width)/2,top:(bounds.height-size.height)/2,width:size.width,height:size.height};
 paintFloatingPreviewGeometry();
};
$('#floating-preview-opacity').oninput=e=>{
 $('#floating-preview-canvas').style.opacity=Number(e.target.value)/100;
 $('#floating-preview-opacity-value').textContent=e.target.value+'%';
};
function setFloatingPreviewPosition(left,top){
 if(!floatingPreviewGeometry){const size=fitFloatingPreview(220);floatingPreviewGeometry={...size,left,top};}
 floatingPreviewGeometry.left=left;floatingPreviewGeometry.top=top;clampFloatingPreview();
}
function resizeFloatingPreview(corner,dx,dy,start){
 const ratio=start.height/start.width,sx=corner.includes('w')?-1:1,sy=corner.includes('n')?-1:1;
 const delta=(sx*dx+ratio*sy*dy)/(1+ratio*ratio),size=fitFloatingPreview(start.width+delta);
 floatingPreviewGeometry={width:size.width,height:size.height,left:sx<0?start.left+start.width-size.width:start.left,top:sy<0?start.top+start.height-size.height:start.top};
 clampFloatingPreview();
}
function wireFloatingGesture(handle,corner){
 handle.addEventListener('pointerdown',e=>{
  if(e.button!==0||!e.isPrimary||!floatingPreviewGeometry)return;
  floatingPreviewDrag={id:e.pointerId,x:e.clientX,y:e.clientY,start:{...floatingPreviewGeometry}};
  handle.setPointerCapture(e.pointerId);e.preventDefault();
 });
 handle.addEventListener('pointermove',e=>{
  const drag=floatingPreviewDrag;if(!drag||drag.id!==e.pointerId)return;
  if(corner)resizeFloatingPreview(corner,e.clientX-drag.x,e.clientY-drag.y,drag.start);
  else setFloatingPreviewPosition(drag.start.left+e.clientX-drag.x,drag.start.top+e.clientY-drag.y);
 });
 for(const name of ['pointerup','pointercancel','lostpointercapture'])handle.addEventListener(name,e=>{
  if(floatingPreviewDrag?.id!==e.pointerId)return;
  if(name==='pointercancel'){floatingPreviewGeometry=floatingPreviewDrag.start;clampFloatingPreview();}
  floatingPreviewDrag=null;
  if(handle.hasPointerCapture(e.pointerId))handle.releasePointerCapture(e.pointerId);
 });
 handle.addEventListener('keydown',e=>{
  if(!floatingPreviewGeometry)return;
  const delta={ArrowLeft:[-20,0],ArrowRight:[20,0],ArrowUp:[0,-20],ArrowDown:[0,20]}[e.key];if(!delta)return;
  e.preventDefault();
  if(corner)resizeFloatingPreview(corner,...delta,{...floatingPreviewGeometry});
  else setFloatingPreviewPosition(floatingPreviewGeometry.left+delta[0],floatingPreviewGeometry.top+delta[1]);
 });
}
wireFloatingGesture($('#floating-preview-move'));
for(const corner of ['sw','se','nw','ne'])wireFloatingGesture($('[data-preview-corner="'+corner+'"]'),corner);
$('#editor').addEventListener('close',()=>{
 floatingPreviewDrag=null;floatingPreviewGeometry=null;floatingPreviewOpen=false;
 $('#floating-preview-toggle').setAttribute('aria-expanded','false');$('#floating-preview-panel').hidden=true;
});
syncFloatingPreview();
