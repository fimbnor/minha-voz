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
 $('#flow-next').textContent=['Escolher modelo →','Adicionar minha foto →','Editar texto →','Ajustar visual →','Editar com IA →','Conferir e baixar →',''][position];
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
