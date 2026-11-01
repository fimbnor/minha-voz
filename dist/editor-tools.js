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


// Resize only the displayed canvas; export always keeps the selected resolution.
const previewSize=$('#preview-size');
previewSize.value=mobileEditor.matches||landscapeEditor.matches?25:55;
function syncPreviewSize(){
 const height=Math.round(window.visualViewport?.height||window.innerHeight);
 const mobile=mobileEditor.matches||landscapeEditor.matches;
 const requested=height*Number($('#preview-size').value||25)/100;
 const pixels=Math.max(56,Math.round(Math.min(requested,height-(mobile?260:190))));
 $('#preview-canvas').style.setProperty('--preview-size',pixels+'px');
 $('#preview-size-value').textContent=pixels+' px';
}
previewSize.oninput=syncPreviewSize;
syncPreviewSize();

function syncExpandButtonOverlap(){
 const button=$('#expand-preview'),canvas=$('#preview-canvas');
 if(!mobileEditor.matches||!$('#editor').open){button.style.removeProperty('opacity');return;}
 const a=button.getBoundingClientRect(),b=canvas.getBoundingClientRect();
 const width=Math.max(0,Math.min(a.right,b.right)-Math.max(a.left,b.left));
 const height=Math.max(0,Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top));
 const overlap=(width*height)/(a.width*a.height||1);
 button.style.opacity=String(1-.65*Math.min(1,overlap));
}
previewSize.addEventListener('input',()=>requestAnimationFrame(syncExpandButtonOverlap));
window.addEventListener('resize',()=>requestAnimationFrame(syncExpandButtonOverlap));
if(window.ResizeObserver)new ResizeObserver(syncExpandButtonOverlap).observe($('#preview-canvas'));
$('#editor').addEventListener('close',syncExpandButtonOverlap);
