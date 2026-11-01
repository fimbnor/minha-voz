'use strict';
const mobileEditor=matchMedia('(max-width:580px)');
const landscapeEditor=matchMedia('(max-width:900px) and (max-height:500px)');
function syncEditorViewport(){
 const editor=$('#editor');
 syncPreviewSize();
 if(!editor.open||!(mobileEditor.matches||landscapeEditor.matches)){
  editor.style.removeProperty('--editor-height');editor.style.removeProperty('--editor-top');editor.classList.remove('compact-editor');return;
 }
 const viewport=window.visualViewport;
 const height=Math.round(viewport?.height||window.innerHeight);
 editor.style.setProperty('--editor-height',height+'px');
 editor.style.setProperty('--editor-top',Math.round(viewport?.offsetTop||0)+'px');
 editor.classList.toggle('compact-editor',height<500);
}
let editorViewportFrame;
function scheduleEditorViewport(){
 cancelAnimationFrame(editorViewportFrame);
 editorViewportFrame=requestAnimationFrame(()=>{
  syncEditorViewport();
  const active=document.activeElement;
  if($('#editor').open&&(mobileEditor.matches||landscapeEditor.matches)&&$('.editor-controls').contains(active))active.scrollIntoView({block:'nearest'});
 });
}
window.addEventListener('resize',scheduleEditorViewport);
window.visualViewport?.addEventListener('resize',scheduleEditorViewport);
window.visualViewport?.addEventListener('scroll',syncEditorViewport);
$('#editor').addEventListener('close',()=>{
 cancelAnimationFrame(editorViewportFrame);syncEditorViewport();
 if($('#preview-dialog').open)$('#preview-dialog').close();
});
$('#expand-preview').onclick=()=>{
 renderPreview();
 const original=$('#preview-canvas'),expanded=$('#expanded-preview-canvas');
 expanded.width=original.width;expanded.height=original.height;
 expanded.getContext('2d').drawImage(original,0,0);
 expanded.classList.toggle('circular-profile',state.format==='instagram-profile');
 $('#expanded-preview-label').textContent=$('#preview-label').textContent;
 $('#preview-dialog').showModal();
};
$('#close-preview').onclick=()=>$('#preview-dialog').close();
$('#return-to-editor').onclick=()=>$('#preview-dialog').close();


// Resize only the displayed canvas; intrinsic dimensions remain the export resolution.
let previewHeight=null;
const previewHandle=$('#preview-resize-handle');
function previewLimits(){
 const height=Math.round(window.visualViewport?.height||window.innerHeight);
 return {min:64,max:Math.max(64,height-(mobileEditor.matches||landscapeEditor.matches?240:190))};
}
function syncPreviewSize(){
 const height=Math.round(window.visualViewport?.height||window.innerHeight);
 const limits=previewLimits();
 if(previewHeight===null)previewHeight=Math.round(height*((mobileEditor.matches||landscapeEditor.matches)?0.25:0.55));
 const pixels=Math.max(limits.min,Math.min(limits.max,previewHeight));
 $('#preview-canvas').style.setProperty('--preview-size',pixels+'px');
 previewHandle.setAttribute('aria-valuemin',String(limits.min));
 previewHandle.setAttribute('aria-valuemax',String(limits.max));
 previewHandle.setAttribute('aria-valuenow',String(Math.round(pixels)));
 previewHandle.setAttribute('aria-valuetext',Math.round(pixels)+' pixels de prévia; resolução da arte final preservada');
}
let previewDrag=null;
previewHandle.addEventListener('pointerdown',event=>{
 if(event.button!==0||!event.isPrimary)return;
 event.preventDefault();
 previewDrag={id:event.pointerId,y:event.clientY,height:$('#preview-canvas').getBoundingClientRect().height,requested:previewHeight};
 previewHandle.setPointerCapture(event.pointerId);
 previewHandle.classList.add('is-dragging');
});
previewHandle.addEventListener('pointermove',event=>{
 if(!previewDrag||event.pointerId!==previewDrag.id)return;
 const limits=previewLimits();
 previewHeight=Math.round(Math.max(limits.min,Math.min(limits.max,previewDrag.height+event.clientY-previewDrag.y)));
 syncPreviewSize();
});
function endPreviewDrag(event){
 if(!previewDrag||event.pointerId!==previewDrag.id)return;
 if(event.type==='pointercancel'){previewHeight=previewDrag.requested;syncPreviewSize();}
 previewDrag=null;previewHandle.classList.remove('is-dragging');
 if(previewHandle.hasPointerCapture(event.pointerId))previewHandle.releasePointerCapture(event.pointerId);
}
previewHandle.addEventListener('pointerup',endPreviewDrag);
previewHandle.addEventListener('pointercancel',endPreviewDrag);
previewHandle.addEventListener('lostpointercapture',endPreviewDrag);
previewHandle.addEventListener('keydown',event=>{
 const limits=previewLimits(),current=$('#preview-canvas').getBoundingClientRect().height;
 const sizes={ArrowUp:current-16,ArrowDown:current+16,ArrowLeft:current-16,ArrowRight:current+16,Home:limits.min,End:limits.max};
 if(!(event.key in sizes))return;
 event.preventDefault();previewHeight=Math.max(limits.min,Math.min(limits.max,sizes[event.key]));syncPreviewSize();
});
syncPreviewSize();

// Each task has its own screen. On phones the artwork is available on demand.
function syncEditorStep(n){
 const names=['Modelo','Sua foto','Texto e assinatura','Visual','Edição com IA','Conferir e baixar'];
 $('#editor-step-label').textContent=n+' de 6 · '+names[n-1];
 const current=document.querySelector('.editor-navigation [data-step="'+n+'"]');
 current?.scrollIntoView({block:'nearest',inline:'nearest'});
}
$('#view-card').onclick=()=>$('#expand-preview').onclick();
$('#review-card').onclick=()=>$('#expand-preview').onclick();
$('#editor').addEventListener('focusin',scheduleEditorViewport);
$('#editor').addEventListener('focusout',scheduleEditorViewport);
