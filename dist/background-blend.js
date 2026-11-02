'use strict';
const backgroundBlendPending=new Map(),backgroundBlendMessages=new Map();
function syncBackgroundBlendUI(){
 const page=activePage(),amount=page.backgroundBlend??50;
 $('#background-blend-controls').hidden=!page.backgroundOverlay;
 $('#background-blend').value=amount;
 $('#blend-base-weight').textContent='Base '+(100-amount)+'%';
 $('#blend-overlay-weight').textContent='Nova imagem '+amount+'%';
 $('#background-blend').setAttribute('aria-valuetext','Base '+(100-amount)+'%, nova imagem '+amount+'%');
 $('#background-blend-upload-label').textContent=page.backgroundOverlay?'Trocar imagem mesclada':'Adicionar imagem para mesclar';
 $('#background-blend-status').textContent=backgroundBlendPending.has(page.id)?'Carregando imagem…':backgroundBlendMessages.get(page.id)||'';
 if(page.backgroundOverlay){
  const base=$('#blend-base-thumb'),overlay=$('#blend-overlay-thumb'),ratio=$('#preview-canvas').height/$('#preview-canvas').width;
  base.height=overlay.height=Math.round(96*ratio);
  drawCardBackground(base.getContext('2d'),base.width,base.height,page.campaign,{...page,backgroundOverlay:null});
  const ctx=overlay.getContext('2d');ctx.clearRect(0,0,overlay.width,overlay.height);drawCover(ctx,page.backgroundOverlay,0,0,overlay.width,overlay.height);
 }
}
$('#background-blend-input').onchange=async e=>{
 const file=e.target.files[0];if(!file)return;
 const page=activePage(),revision=++page.backgroundOverlayUploadRevision;
 const starters=state.creationSetup&&state.step===0&&state.format==='carousel'?state.pages.map(p=>({page:p,revision:p.backgroundOverlayUploadRevision})):[];
 backgroundBlendPending.set(page.id,revision);backgroundBlendMessages.delete(page.id);syncBackgroundBlendUI();
 try{
  const image=await loadUpload(file);
  if(!image||!$('#editor').open||activePage()!==page||page.backgroundOverlayUploadRevision!==revision)return;
  page.backgroundOverlay=image;page.backgroundBlend=50;
  for(const target of starters){if(target.page!==page&&state.pages.includes(target.page)&&target.page.backgroundOverlayUploadRevision===target.revision){target.page.backgroundOverlay=image;target.page.backgroundBlend=50;target.page.backgroundOverlayUploadRevision++;}}
  renderPreview();
 }catch(error){if(activePage()===page&&page.backgroundOverlayUploadRevision===revision)backgroundBlendMessages.set(page.id,error.message);}
 finally{
  if(backgroundBlendPending.get(page.id)===revision)backgroundBlendPending.delete(page.id);
  if(activePage()===page)syncBackgroundBlendUI();e.target.value='';
 }
};
$('#background-blend').oninput=e=>{
 const amount=Math.max(0,Math.min(100,Number(e.target.value)));
 const pages=state.creationSetup&&state.step===0&&state.format==='carousel'?state.pages:[activePage()];
 for(const page of pages)if(page.backgroundOverlay)page.backgroundBlend=amount;
 syncBackgroundBlendUI();renderPreview();
};
$('#remove-background-blend').onclick=()=>{
 const pages=state.creationSetup&&state.step===0&&state.format==='carousel'?state.pages:[activePage()];
 for(const page of pages){page.backgroundOverlayUploadRevision++;page.backgroundOverlay=null;page.backgroundBlend=50;backgroundBlendPending.delete(page.id);backgroundBlendMessages.delete(page.id);}
 syncBackgroundBlendUI();renderPreview();
};
syncBackgroundBlendUI();
