'use strict';
// Preserve panel IDs so projects saved with the original editor still resume correctly.
const CREATION_STEPS=['Formato','Modelo','Sua foto','Seu toque','Baixar'];
function syncFlowUI(){
 const step=Math.max(0,Math.min(4,Number(state.step)||0));
 $('#flow-progress').textContent=`Etapa ${step+1} de 5 · ${CREATION_STEPS[step]}`;
 $('#flow-back').hidden=step===0;
 $('#flow-next').hidden=step===4;
 $('#flow-next').textContent=['Escolher modelo →','Adicionar minha foto →','Personalizar card →','Conferir e baixar →',''][step];
 $('#editor').classList.toggle('choosing-format',step===0);
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
$('#flow-back').onclick=()=>navigateCreation(Math.max(0,state.step-1));
$('#flow-next').onclick=()=>navigateCreation(Math.min(4,state.step+1));
$('#start-creation').onclick=()=>openEditor(campaigns.find(c=>c.id==='amor')||campaigns[0]);
$('#photo-to-ai').onclick=()=>{navigateCreation(3);$('#ai-edit-options').open=true;$('#ai-prompt').focus({preventScroll:true});};
$('#skip-photo').onclick=()=>navigateCreation(3);
syncFlowUI();
