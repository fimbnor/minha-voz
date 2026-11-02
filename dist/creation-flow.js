'use strict';
// Preserve panel IDs so projects saved with the original editor still resume correctly.
const CREATION_LABELS={0:'Formato',1:'Fundo',2:'Foto e logotipo',3:'Texto e assinatura',6:'Edição com IA',4:'Baixar'};
function creationOrder(){return [0,2,3,6,4];}
function syncFlowUI(){
 const order=creationOrder(),step=Number(state.step),position=order.indexOf(step);
 $('#format-step-title').textContent='Escolha o formato';
 $('#format-intro').textContent='Escolha onde vai usar seu card.';
 $('#chosen-base-name').textContent=state.backgroundMode==='color'?(palettes.find(p=>p.bg===state.backgroundColor)?.name||'Cor sólida'):state.background?'Minha imagem':state.campaign.name;
 $('#flow-progress').textContent=`Etapa ${position+1} de ${order.length} · ${CREATION_LABELS[step]}`;
 if(step===6)$('#ai-edit-options').open=true;
 $('#flow-back').hidden=step===0;
 $('#flow-next').hidden=step===4;
 const next=order[position+1];
 $('#flow-next').textContent={2:'Adicionar foto e logotipo',3:'Editar texto',6:'Editar com IA',4:'Conferir e baixar'}[next]||'';
 $('#editor').classList.toggle('choosing-format',step===0);
 document.querySelector('.editor-navigation [data-step="'+step+'"]')?.scrollIntoView({block:'nearest',inline:'nearest'});
 const formats={feed:'Post',story:'Story',profile:'Post quadrado',square:'Post quadrado','instagram-profile':'Foto de perfil',photo:'Foto em destaque',carousel:'Carrossel'};
 $('#model-format-note').textContent=`Formato: ${formats[state.format]}. Escolha um modelo ou envie sua própria imagem de fundo.`;
 $('#export-summary').textContent=`${formats[state.format]} · ${state.format==='carousel'?state.pages.length+' posts · ':''}PNG em alta resolução`;
 $('#carousel-export-note').hidden=state.format!=='carousel';
}
function navigateCreation(step){
 setStep(step);
 $(`[data-panel="${state.step}"] h3`)?.focus({preventScroll:true});
}
$('#flow-back').onclick=()=>{const order=creationOrder();navigateCreation(order[Math.max(0,order.indexOf(state.step)-1)]);};
$('#flow-next').onclick=()=>{const order=creationOrder();navigateCreation(order[Math.min(order.length-1,order.indexOf(state.step)+1)]);};
$('#start-creation').onclick=()=>{
 $('#campaigns').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});
 $('#catalog-title').focus({preventScroll:true});
};
$('#start-solid').onclick=()=>{filter='solid';onlySaved=false;$$('[data-filter]').forEach(b=>{b.classList.remove('active');b.setAttribute('aria-pressed','false');});$$('[data-nav]').forEach(b=>{b.classList.toggle('active',b.dataset.nav==='home');});renderCatalog();};
$('#skip-photo').onclick=()=>navigateCreation(3);
syncFlowUI();

// Blank and solid bases use the existing per-page background fields, including projects.
function syncBaseOptions(){
 const solid=state.backgroundMode==='color',blank=solid&&state.backgroundColor.toLowerCase()==='#ffffff';
 $('#model-library').hidden=solid;
 $('#base-choice-status').textContent=blank?'Base branca, sem modelo. Adicione sua foto e mensagem nas próximas etapas.':solid?'Sua foto e seus textos serão combinados com essa cor. A próxima etapa é Foto e logotipo.':'Base escolhida. Agora defina o formato do seu card.';
 syncFlowUI();
}
function chooseBaseColor(color,{blank=false,preserveColors=false}={}){
 const pages=state.creationSetup&&state.step<=1&&state.format==='carousel'?state.pages:[activePage()];
 for(const page of pages){
  page.backgroundUploadRevision++;page.background=null;page.backgroundMode='color';page.backgroundColor=color;
  const palette=palettes.findIndex(p=>p.bg===color);if(palette>=0)page.palette=palette;
  if(blank&&[page.campaign.text,page.campaign.alt,page.campaign.third].includes(page.text))page.text='';
  const contrast=colorLuminance(color)>.5?'#213f33':'#fffefa';
  if(!preserveColors&&!page.textColorCustom)page.textColor=contrast;
  if(!preserveColors&&!page.signatureColorCustom)page.signatureColor=contrast;
 }
 syncEditorFields();renderOptions();renderPreview();
}
function renderBaseOptions(){
 syncBaseOptions();
 const list=$('#illustrated-template-list');list.innerHTML='';
 for(const c of campaigns.filter(c=>c.nativeScene)){
  const b=document.createElement('button');b.type='button';b.className='campaign-option';b.innerHTML='<canvas width="144" height="180" aria-hidden="true"></canvas><span>'+c.name+'</span>';
  b.setAttribute('aria-pressed',String(state.backgroundMode==='image'&&!state.background&&state.campaign.id===c.id));
  b.onclick=()=>selectCampaign(c);list.append(b);drawCard(b.querySelector('canvas'),c,{format:state.format});
 }
}
renderBaseOptions();

// A layered thumbnail shows the chosen base underneath the user's photo.
function syncPhotoCompositionPreview(){
 const base=$('#photo-base-thumb'),ratio=$('#preview-canvas').height/$('#preview-canvas').width;
 base.height=Math.round(base.width*ratio);
 drawCardBackground(base.getContext('2d'),base.width,base.height,state.campaign,state);
 const photo=$('#photo-layer-thumb');photo.hidden=!state.photo;$('#photo-layer-camera').hidden=!!state.photo;
 if(state.photo){const ctx=photo.getContext('2d');ctx.clearRect(0,0,photo.width,photo.height);drawCover(ctx,state.photo,0,0,photo.width,photo.height);}
}
syncPhotoCompositionPreview();

$('#home-background-input').onchange=async e=>{
 const file=e.target.files[0];if(!file)return;
 const revision=++homeBackgroundUploadRevision,status=$('#home-background-status');
 status.hidden=false;status.textContent='Carregando sua imagem…';
 try{
  const image=await loadUpload(file);
  if(!image||revision!==homeBackgroundUploadRevision)return;
  openEditor(campaigns.find(c=>c.id==='amor')||campaigns[0],{background:image});
  status.hidden=true;status.textContent='';
 }catch(error){if(revision===homeBackgroundUploadRevision)status.textContent=error.message;}
 finally{e.target.value='';}
};

$('#change-home-base').onclick=()=>{closeEditor();$('#start-creation').onclick();};
