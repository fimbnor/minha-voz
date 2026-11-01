'use strict';
// All processing is local. Models are served from this site's own origin.
let photoRevision=0,segmenterPromise=null;
function resetPhotoTools(photo){state.photoOriginal=photo;resetPhotoFeedback();state.photoMask=null;state.photoSettings={exposure:0,contrast:0,warmth:0,saturation:0,'cutout-edge':50,'cutout-soft':12,compare:false};photoRevision++;state.cutout=false;['exposure','contrast','warmth','saturation'].forEach(id=>$('#'+id).value=0);$('#compare-original').checked=false;$('#cutout-edge').value=50;$('#cutout-soft').value=12;$('#cutout-status').textContent=photo?'Foto original preservada.':'Envie uma foto para começar.';$('#mask-tuning').hidden=true;$('#remove-bg').disabled=!photo;}
async function getSegmenter(){if(!segmenterPromise){segmenterPromise=(async()=>{const {FilesetResolver,ImageSegmenter}=await import('./vendor/mediapipe/vision_bundle.mjs');const files=await FilesetResolver.forVisionTasks('./vendor/mediapipe/wasm');return ImageSegmenter.createFromOptions(files,{baseOptions:{modelAssetPath:'./vendor/mediapipe/selfie_segmenter.tflite',delegate:'CPU'},runningMode:'IMAGE',outputConfidenceMasks:true,outputCategoryMask:false});})().catch(e=>{segmenterPromise=null;throw e;});}return segmenterPromise;}
function photoCanvas(photo,max=1800){const c=document.createElement('canvas'),ratio=Math.min(1,max/Math.max(photo.width,photo.height));c.width=Math.round(photo.width*ratio);c.height=Math.round(photo.height*ratio);c.getContext('2d').drawImage(photo,0,0,c.width,c.height);return c;}
function applyPhotoTools(){if(!state.photoOriginal)return;savePhotoSettings();const compare=$('#compare-original').checked;if(compare){state.photo=state.photoOriginal;state.cutout=false;renderPreview();return;}const c=photoCanvas(state.photoOriginal),ctx=c.getContext('2d'),pixels=ctx.getImageData(0,0,c.width,c.height),d=pixels.data;
const exposure=2**(Number($('#exposure').value)/100),contrast=1+Number($('#contrast').value)/100,warmth=Number($('#warmth').value)*.55,saturation=1+Number($('#saturation').value)/100;
for(let i=0;i<d.length;i+=4){let r=(d[i]*exposure-128)*contrast+128+warmth,g=(d[i+1]*exposure-128)*contrast+128,b=(d[i+2]*exposure-128)*contrast+128-warmth;const l=.2126*r+.7152*g+.0722*b;d[i]=l+(r-l)*saturation;d[i+1]=l+(g-l)*saturation;d[i+2]=l+(b-l)*saturation;}
ctx.putImageData(pixels,0,0);
if(state.photoMask){const mask=document.createElement('canvas');mask.width=state.photoMask.width;mask.height=state.photoMask.height;const mctx=mask.getContext('2d'),im=mctx.createImageData(mask.width,mask.height),threshold=Number($('#cutout-edge').value)/100,soft=Number($('#cutout-soft').value)/100;for(let i=0;i<state.photoMask.data.length;i++){const t=Math.max(0,Math.min(1,(state.photoMask.data[i]-(threshold-soft))/Math.max(.005,soft*2)));im.data[i*4+3]=255*t*t*(3-2*t);}mctx.putImageData(im,0,0);ctx.globalCompositeOperation='destination-in';ctx.drawImage(mask,0,0,c.width,c.height);ctx.globalCompositeOperation='source-over';}
state.photo=c;state.cutout=!!state.photoMask;renderPreview();}
$('#remove-bg').onclick=async()=>{if(!state.photoOriginal)return;const source=state.photoOriginal,revision=photoRevision,button=$('#remove-bg');button.disabled=true;button.classList.add('photo-working');button.setAttribute('aria-busy','true');button.textContent='Removendo fundo…';$('#cutout-status').textContent='Carregando o recorte no seu aparelho…';try{const model=await getSegmenter();if(revision!==photoRevision)return;$('#cutout-status').textContent='Separando a pessoa do fundo…';await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));const input=photoCanvas(source,1024);let result;model.segment(input,r=>{const masks=r.confidenceMasks;const mask=masks?.length===1?masks[0]:masks?.[1];if(!mask)throw Error('Máscara indisponível');result={width:mask.width,height:mask.height,data:new Float32Array(mask.getAsFloat32Array())};});if(revision!==photoRevision)return;let count=0;for(const p of result.data)if(p>.5)count++;if(count<result.data.length*.005)throw Error('Pessoa não encontrada');state.photoMask=result;$('#compare-original').checked=false;$('#mask-tuning').hidden=false;applyPhotoTools();completePhotoAction('remove-bg','Fundo removido','Recorte aplicado.');$('#cutout-status').textContent='Recorte aplicado. Confira cabelos e bordas antes de baixar.';}catch(e){console.error('Falha no recorte local:',e);if(revision===photoRevision){$('#cutout-status').textContent=e.message==='Pessoa não encontrada'?'Não foi possível identificar a pessoa. Tente um retrato mais próximo; o original foi mantido.':'O recorte local falhou ao processar a imagem. Recarregue a página e tente novamente; o original foi mantido.';}}finally{if(revision===photoRevision){button.disabled=!state.photoOriginal;button.classList.remove('photo-working');button.removeAttribute('aria-busy');if(!state.photoMask)button.textContent=photoButtonLabels['remove-bg'];}}};
let photoFrame;['exposure','contrast','warmth','saturation','cutout-edge','cutout-soft'].forEach(id=>$('#'+id).addEventListener('input',()=>{cancelAnimationFrame(photoFrame);photoFrame=requestAnimationFrame(applyPhotoTools);}));
$('#compare-original').onchange=applyPhotoTools;
const photoButtonLabels={'remove-bg':'Remover fundo · experimental','natural-photo':'Aplicar acabamento natural'};
const photoAnimations=new Map();
function closeRestoreConfirmation(){
 $('#restore-photo-confirm').hidden=true;$('#restore-photo').setAttribute('aria-expanded','false');
}
function resetPhotoFeedback(){
 closeRestoreConfirmation();
 for(const id of Object.keys(photoButtonLabels)){
  photoAnimations.get(id)?.cancel();photoAnimations.delete(id);
  const b=$('#'+id);b.textContent=photoButtonLabels[id];b.classList.remove('photo-working');b.classList.remove('photo-complete');b.removeAttribute('aria-busy');
 }
 $('#photo-action-status').textContent='';
 $('#natural-photo').disabled=!state.photoOriginal;$('#restore-photo').disabled=!state.photoOriginal;
}
function completePhotoAction(id,label,message){
 const b=$('#'+id);b.textContent='✓ '+label;b.classList.add('photo-complete');
 photoAnimations.get(id)?.cancel();
 if(!matchMedia('(prefers-reduced-motion: reduce)').matches)photoAnimations.set(id,b.animate([
  {transform:'scale(1)',boxShadow:'0 0 0 0 #3f8c6655'},
  {transform:'scale(1.025)',boxShadow:'0 0 0 9px #3f8c6600',offset:.5},
  {transform:'scale(1)',boxShadow:'0 0 0 0 #3f8c6600'}
 ],{duration:650,easing:'ease-out'}));
 $('#photo-action-status').textContent=message;
}
$('#restore-photo').onclick=()=>{if(!state.photoOriginal)return;$('#restore-photo-confirm').hidden=false;$('#restore-photo').setAttribute('aria-expanded','true');$('#cancel-restore-photo').focus();};
$('#cancel-restore-photo').onclick=()=>{closeRestoreConfirmation();$('#restore-photo').focus();};
$('#confirm-restore-photo').onclick=()=>{if(!state.photoOriginal)return;state.photoUploadRevision++;state.photo=state.photoOriginal;state.gray=false;$('#photo-gray').checked=false;resetPhotoTools(state.photoOriginal);renderPreview();$('#photo-action-status').textContent='Foto original restaurada.';$('#restore-photo').focus();};
$('#natural-photo').onclick=()=>{if(!state.photoOriginal)return;$('#exposure').value=8;$('#contrast').value=5;$('#warmth').value=3;$('#saturation').value=3;$('#compare-original').checked=false;applyPhotoTools();completePhotoAction('natural-photo','Acabamento aplicado','Acabamento natural aplicado.');};


function savePhotoSettings(){for(const id of ['exposure','contrast','warmth','saturation','cutout-edge','cutout-soft'])state.photoSettings[id]=Number($('#'+id).value);state.photoSettings.compare=$('#compare-original').checked;}
function restorePhotoTools(){
 photoRevision++;cancelAnimationFrame(photoFrame);resetPhotoFeedback();
 const settings=state.photoSettings;
 for(const id of ['exposure','contrast','warmth','saturation','cutout-edge','cutout-soft'])$('#'+id).value=settings[id];
 $('#compare-original').checked=settings.compare;$('#mask-tuning').hidden=!state.photoMask;$('#remove-bg').disabled=!state.photoOriginal;
 $('#cutout-status').textContent=state.photoOriginal?'Foto deste post preservada.':'Envie uma foto para este post.';
}

