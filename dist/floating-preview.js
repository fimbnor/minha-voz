'use strict';
const floatingPreview=$('#floating-preview');
let floatingPreviewOpen=false,floatingPreviewDrag=null,floatingPreviewGeometry=null,floatingPreviewExpandedWidth=220;
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
 const small=g.width<160||g.height<170;
 floatingPreview.classList.toggle('small-floating-preview',small);
 if(!small)floatingPreviewExpandedWidth=g.width;

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
function ensureFloatingPreview(){
 if(floatingPreviewGeometry)return;
 const bounds=floatingPreviewBounds(),size=fitFloatingPreview(0);
 floatingPreviewGeometry={left:Math.max(0,bounds.width-size.width-12),top:Math.max(0,bounds.height-size.height-90),width:size.width,height:size.height};
 floatingPreviewOpen=true;$('#floating-preview-panel').hidden=false;clampFloatingPreview();
}
function restoreFloatingPreview(){
 if(!floatingPreviewGeometry)return;
 const right=floatingPreviewGeometry.left+floatingPreviewGeometry.width,size=fitFloatingPreview(floatingPreviewExpandedWidth);
 Object.assign(floatingPreviewGeometry,{left:right-size.width,width:size.width,height:size.height});clampFloatingPreview();
 $('#floating-preview-close').focus({preventScroll:true});
}
$('#floating-preview-close').onclick=()=>{
 if(!floatingPreviewGeometry)return;
 const right=floatingPreviewGeometry.left+floatingPreviewGeometry.width,size=fitFloatingPreview(0);
 Object.assign(floatingPreviewGeometry,{left:right-size.width,width:size.width,height:size.height});clampFloatingPreview();
 $('#floating-preview-move').focus({preventScroll:true});
};
$('#floating-preview-full').onclick=()=>{
 const size=fitFloatingPreview(Infinity),bounds=floatingPreviewBounds();
 floatingPreviewGeometry={left:(bounds.width-size.width)/2,top:(bounds.height-size.height)/2,width:size.width,height:size.height};
 paintFloatingPreviewGeometry();
};
$('#floating-preview-opacity').oninput=e=>{
 $('#floating-preview-canvas').style.opacity=Number(e.target.value)/100;
 $('#floating-preview-opacity-value').textContent=e.target.value+'%';
 $('#floating-preview-opacity').setAttribute('aria-valuetext',e.target.value+'%');
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
wireFloatingGesture($('[data-preview-corner="sw"]'),'sw');
$('#editor').addEventListener('close',()=>{
 floatingPreviewDrag=null;floatingPreviewGeometry=null;floatingPreviewOpen=false;floatingPreviewExpandedWidth=220;
 $('#floating-preview-panel').hidden=true;
});
syncFloatingPreview();
