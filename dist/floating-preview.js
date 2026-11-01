'use strict';
const floatingPreview=$('#floating-preview');
let floatingPreviewOpen=false,floatingPreviewDrag=null,floatingPreviewMoved=false;
function syncFloatingPreview(){
 const original=$('#preview-canvas');
 for(const [selector,width] of [['#floating-preview-thumb',56],['#floating-preview-canvas',240]]){
  const canvas=$(selector),height=Math.round(width*original.height/original.width);
  if(canvas.width!==width)canvas.width=width;
  if(canvas.height!==height)canvas.height=height;
  const ctx=canvas.getContext('2d');ctx.clearRect(0,0,canvas.width,canvas.height);ctx.drawImage(original,0,0,canvas.width,canvas.height);
 }
}
function clampFloatingPreview(){
 if(!floatingPreviewMoved)return;
 const shell=$('.editor-shell').getBoundingClientRect(),rect=floatingPreview.getBoundingClientRect();
 floatingPreview.style.left=Math.max(8,Math.min(rect.left-shell.left,shell.width-rect.width-8))+'px';
 floatingPreview.style.top=Math.max(8,Math.min(rect.top-shell.top,shell.height-rect.height-8))+'px';
}
function toggleFloatingPreview(open){
 floatingPreviewOpen=open;
 $('#floating-preview-toggle').hidden=open;
 $('#floating-preview-toggle').setAttribute('aria-expanded',String(open));
 $('#floating-preview-panel').hidden=!open;
 syncFloatingPreview();clampFloatingPreview();
 if(open)$('#floating-preview-close').focus({preventScroll:true});
 else $('#floating-preview-toggle').focus({preventScroll:true});
}
$('#floating-preview-toggle').onclick=()=>toggleFloatingPreview(true);
$('#floating-preview-close').onclick=()=>toggleFloatingPreview(false);
$('#floating-preview-full').onclick=()=>$('#expand-preview').onclick();
$('#floating-preview-opacity').oninput=e=>{
 $('#floating-preview-canvas').style.opacity=Number(e.target.value)/100;
 $('#floating-preview-opacity-value').textContent=e.target.value+'%';
};
function setFloatingPreviewPosition(left,top){
 floatingPreviewMoved=true;floatingPreview.style.right='auto';floatingPreview.style.bottom='auto';
 floatingPreview.style.left=left+'px';floatingPreview.style.top=top+'px';clampFloatingPreview();
}
const floatingPreviewHandle=$('#floating-preview-move');
floatingPreviewHandle.addEventListener('pointerdown',e=>{
 if(e.button!==0||!e.isPrimary)return;
 const rect=floatingPreview.getBoundingClientRect(),shell=$('.editor-shell').getBoundingClientRect();
 floatingPreviewDrag={id:e.pointerId,x:e.clientX,y:e.clientY,left:rect.left-shell.left,top:rect.top-shell.top};
 floatingPreviewHandle.setPointerCapture(e.pointerId);e.preventDefault();
});
floatingPreviewHandle.addEventListener('pointermove',e=>{
 const drag=floatingPreviewDrag;if(!drag||drag.id!==e.pointerId)return;
 setFloatingPreviewPosition(drag.left+e.clientX-drag.x,drag.top+e.clientY-drag.y);
});
for(const name of ['pointerup','pointercancel','lostpointercapture'])floatingPreviewHandle.addEventListener(name,e=>{
 if(floatingPreviewDrag?.id!==e.pointerId)return;
 floatingPreviewDrag=null;
 if(floatingPreviewHandle.hasPointerCapture(e.pointerId))floatingPreviewHandle.releasePointerCapture(e.pointerId);
});
floatingPreviewHandle.addEventListener('keydown',e=>{
 const delta={ArrowLeft:[-20,0],ArrowRight:[20,0],ArrowUp:[0,-20],ArrowDown:[0,20]}[e.key];if(!delta)return;
 e.preventDefault();const rect=floatingPreview.getBoundingClientRect(),shell=$('.editor-shell').getBoundingClientRect();
 setFloatingPreviewPosition(rect.left-shell.left+delta[0],rect.top-shell.top+delta[1]);
});
$('#editor').addEventListener('close',()=>{
 floatingPreviewMoved=false;floatingPreviewDrag=null;
 for(const property of ['left','top','right','bottom'])floatingPreview.style.removeProperty(property);
 floatingPreviewOpen=false;$('#floating-preview-toggle').hidden=false;$('#floating-preview-toggle').setAttribute('aria-expanded','false');$('#floating-preview-panel').hidden=true;
});
syncFloatingPreview();
