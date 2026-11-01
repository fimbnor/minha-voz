'use strict';
// Preserve panel IDs so projects saved with the original editor still resume correctly.
const CREATION_ORDER=[0,1,2,3,5,6,4];
const CREATION_STEPS=['Formato','Modelo','Sua foto','Texto e assinatura','Visual','Edição com IA','Baixar'];
function syncFlowUI(){
 const step=CREATION_ORDER.includes(Number(state.step))?Number(state.step):0;
 const position=CREATION_ORDER.indexOf(step);
 $('#flow-progress').textContent=`Etapa ${position+1} de 7 · ${CREATION_STEPS[position]}`;
 if(step===6)$('#ai-edit-options').open=true;
 $('#flow-back').hidden=step===0;
 $('#flow-next').hidden=step===4;
 $('#flow-next').textContent=['Escolher modelo','Adicionar minha foto','Editar texto','Ajustar visual','Editar com IA','Conferir e baixar',''][position];
 $('#editor').classList.toggle('choosing-format',step===0);
 const current=document.querySelector('.editor-navigation [data-step="'+step+'"]');
 current?.scrollIntoView({block:'nearest',inline:'nearest'});
 const formats={feed:'Post',story:'Story',profile:'Post quadrado',square:'Post quadrado','instagram-profile':'Foto de perfil',photo:'Foto em destaque',carousel:'Carrossel'};
 $('#model-format-note').textContent=`Formato: ${formats[state.format]}. Os modelos abaixo já mostram este formato.`;
 $('#export-summary').textContent=`${formats[state.format]} · ${state.format==='carousel'?state.pages.length+' posts · ':''}PNG em alta resolução`;
 $('#carousel-export-note').hidden=state.format!=='carousel';
}
function navigateCreation(step){
 setStep(step);
 const heading=$(`[data-panel="${step}"] h3`);
 heading?.focus({preventScroll:true});
}
$('#flow-back').onclick=()=>navigateCreation(CREATION_ORDER[Math.max(0,CREATION_ORDER.indexOf(state.step)-1)]);
$('#flow-next').onclick=()=>navigateCreation(CREATION_ORDER[Math.min(6,CREATION_ORDER.indexOf(state.step)+1)]);
$('#start-creation').onclick=()=>openEditor(campaigns.find(c=>c.id==='amor')||campaigns[0]);
$('#photo-to-ai').onclick=()=>{navigateCreation(6);$('#ai-edit-options').open=true;$('#ai-prompt').focus({preventScroll:true});};
$('#skip-photo').onclick=()=>navigateCreation(3);
syncFlowUI();

// Blank and solid bases use the existing per-page background fields, including projects.
function syncBaseOptions(){
 const solid=state.backgroundMode==='color',blank=solid&&state.backgroundColor.toLowerCase()==='#ffffff';
 $('#base-model').setAttribute('aria-pressed',String(!solid));
 $('#base-color').setAttribute('aria-pressed',String(solid&&!blank));
 $('#base-blank').setAttribute('aria-pressed',String(blank));
 $('#model-library').hidden=solid;
 $('#base-color-options').hidden=!solid;
 $('#base-color-input').value=state.backgroundColor;
 $('#base-choice-status').textContent=blank?'Sem modelo: uma base branca, sem imagem de fundo. Adicione sua foto e escreva sua mensagem nas próximas etapas.':solid?'Cor sólida selecionada. Sua foto e seus textos podem ser adicionados sobre essa cor.':'Escolha um fundo abaixo. Sua foto será combinada com ele na próxima etapa.';
}
function chooseBaseColor(color,{blank=false}={}){
 const pages=state.creationSetup&&state.step===1&&state.format==='carousel'?state.pages:[activePage()];
 for(const page of pages){
  page.backgroundUploadRevision++;page.background=null;page.backgroundMode='color';page.backgroundColor=color;
  if(blank&&[page.campaign.text,page.campaign.alt,page.campaign.third].includes(page.text))page.text='';
  const contrast=colorLuminance(color)>.5?'#213f33':'#fffefa';
  if(!page.textColorCustom)page.textColor=contrast;
  if(!page.signatureColorCustom)page.signatureColor=contrast;
 }
 syncEditorFields();renderOptions();renderPalette();renderPreview();
}
function renderBaseOptions(){
 syncBaseOptions();
 const palette=$('#base-palette');palette.innerHTML='';
 for(const p of palettes){const b=document.createElement('button');b.type='button';b.style.background=p.bg;b.setAttribute('aria-label','Usar fundo '+p.name);b.setAttribute('aria-pressed',String(state.backgroundMode==='color'&&state.backgroundColor===p.bg));b.onclick=()=>chooseBaseColor(p.bg);palette.append(b);}
 const list=$('#illustrated-template-list');list.innerHTML='';
 for(const c of campaigns.filter(c=>c.nativeScene)){
  const b=document.createElement('button');b.type='button';b.className='campaign-option';b.innerHTML='<canvas width="144" height="180" aria-hidden="true"></canvas><span>'+c.name+'</span>';
  b.setAttribute('aria-pressed',String(state.backgroundMode==='image'&&!state.background&&state.campaign.id===c.id));
  b.onclick=()=>selectCampaign(c);list.append(b);drawCard(b.querySelector('canvas'),c,{format:state.format});
 }
}
$('#base-model').onclick=()=>{selectCampaign(state.campaign);syncBaseOptions();};
$('#base-color').onclick=()=>chooseBaseColor(state.backgroundMode==='color'&&state.backgroundColor!=='#ffffff'?state.backgroundColor:palettes[state.palette].bg);
$('#base-blank').onclick=()=>chooseBaseColor('#ffffff',{blank:true});
$('#base-color-input').oninput=e=>chooseBaseColor(e.target.value);
renderBaseOptions();
