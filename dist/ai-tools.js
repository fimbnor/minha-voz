'use strict';
let aiReady=false,aiRunning=false,aiCandidate=null;
const aiEdits=new Map();
const aiLayerKeys=['pageId','campaign','palette','photo','background','backgroundOverlay','backgroundBlend','backgroundMode','backgroundColor','textColor','signatureColor','signaturePlate','format','text','signature','scale','x','y','rotation','gray','font','textSize','textAlign','textPlate','textPlateColor','textPlateOpacity','textX','textY','textRotation','cutout','logo','logoSize','logoPosition','logoOpacity','logoPlate'];
function aiScope(){return JSON.stringify([state.pageId||state.campaign.id,state.format,state.pageId?0:state.format==='carousel'?state.slide:0]);}
function resetAIEdits(){aiEdits.clear();clearAICandidate();state.aiCard=null;}
function carryAICardToFormat(image){const scope=aiScope();if(image)aiEdits.set(scope,{image,layers:aiLayers(),previous:aiEdits.get(scope)||null});else aiEdits.delete(scope);state.aiCard=image||null;}
function aiLayers(){return aiLayerKeys.map(key=>state[key]);}
function sameAILayers(a,b){return a.length===b.length&&a.every((value,i)=>value===b[i]);}
function aiSnapshot(){return {scope:aiScope(),layers:aiLayers(),image:state.aiCard};}
function sameAISnapshot(a,b){return a.scope===b.scope&&a.image===b.image&&sameAILayers(a.layers,b.layers);}
function clearAICandidate(){aiCandidate=null;$('#ai-result').hidden=true;$('#ai-result-image').removeAttribute('src');}
// Each format/page owns its approved edits. Manual layer changes resume the base composition.
function syncAICard(){
 const scope=aiScope();let edit=aiEdits.get(scope);
 if(edit&&!sameAILayers(edit.layers,aiLayers())){
  aiEdits.delete(scope);edit=null;
  toast('Ajuste manual aplicado aos elementos originais do card.');
 }
 state.aiCard=edit?.image||null;
 $('#ai-undo').hidden=!edit;
 if(aiCandidate&&!sameAISnapshot(aiCandidate.snapshot,aiSnapshot()))clearAICandidate();
}
async function checkAI(){
 if(aiRunning)return;
 const button=$('#ai-generate');
 button.disabled=true;button.textContent='Verificando Gemini…';button.removeAttribute('title');
 try{
  const r=await fetch('/api/config',{cache:'no-store',signal:AbortSignal.timeout(15000)});
  if(!r.ok)throw Error(r.status===401?'Sua sessão expirou. Recarregue a página e entre novamente.':'Não foi possível verificar o Gemini. Recarregue a página para tentar novamente.');
  const config=await r.json();aiReady=config.available===true;
  if(aiReady){$('#prompt-status').textContent='Gemini pronto para editar o card da prévia. Autorize o envio e descreva o que deseja mudar.';}
  else{
   $('#prompt-status').textContent='A edição com IA está indisponível no momento. Você pode continuar com texto, cores e ajustes da foto.';
  }
 }catch(e){aiReady=false;$('#prompt-status').textContent=e.name==='TimeoutError'?'O servidor demorou para responder. Recarregue a página para verificar novamente.':e.message||'Não foi possível verificar a configuração do Gemini.';}
 button.disabled=!aiReady;button.textContent=aiReady?'Editar este card com IA':'IA indisponível no momento';
 if(!aiReady)button.title=$('#prompt-status').textContent;
}
window.addEventListener('focus',()=>{if(!aiReady&&!aiRunning)checkAI();});
function aiNotice(message,field){const status=$('#prompt-status');status.textContent=message;status.scrollIntoView({block:'nearest'});if(field)$(field).focus();}
async function aiSource(snapshot){
 await document.fonts.ready;
 if(!state.aiCard)await waitForCardAssets();
 renderPreview();
 if(!sameAISnapshot(snapshot,aiSnapshot()))throw Error('O card mudou. Confira a prévia e envie o pedido novamente.');
 const preview=$('#preview-canvas'),canvas=document.createElement('canvas');
 canvas.width=preview.width;canvas.height=preview.height;
 canvas.getContext('2d').drawImage(preview,0,0);
 let data=canvas.toDataURL('image/png').split(',')[1];
 while(data.length>Math.floor(5*1024*1024/3)*4){
  const smaller=document.createElement('canvas');smaller.width=Math.round(canvas.width*.8);smaller.height=Math.round(canvas.height*.8);
  smaller.getContext('2d').drawImage(canvas,0,0,smaller.width,smaller.height);
  canvas.width=smaller.width;canvas.height=smaller.height;canvas.getContext('2d').drawImage(smaller,0,0);
  data=canvas.toDataURL('image/png').split(',')[1];
 }
 return {mimeType:'image/png',data};
}
$('#ai-generate').onclick=async()=>{
 if(!aiReady||aiRunning)return;
 const prompt=$('#ai-prompt').value.trim();
 if(!$('#ai-consent').checked){highlightAIConsent();return;}
 if(!prompt){aiNotice('Descreva o que deseja mudar no card atual.','#ai-prompt');return;}
 renderPreview();const snapshot=aiSnapshot();
 aiRunning=true;$('#ai-generate').setAttribute('aria-busy','true');clearAICandidate();$('#ai-generate').disabled=true;$('#ai-generate').textContent='Editando… aguarde';$('#prompt-status').textContent='Preparando o card atual. A edição pode levar até dois minutos.';
 try{
  const image=await aiSource(snapshot);
  const payload={mode:'card',prompt,consent:true,category:state.campaign.id,aspectRatio:state.format==='story'?'9:16':['square','profile','instagram-profile'].includes(state.format)?'1:1':'4:5',image};
  $('#prompt-status').textContent='Card enviado para edição. Aguarde até dois minutos. Não há repetição automática.';
  const r=await fetch('/api/images/edit',{method:'POST',headers:{'Content-Type':'application/json','X-Request-ID':crypto.randomUUID()},body:JSON.stringify(payload),signal:AbortSignal.timeout(130000)});
  const data=await r.json();if(!r.ok)throw Error(data.error||'Não foi possível editar o card.');
  const img=new Image();img.src=`data:${data.image.mimeType};base64,${data.image.data}`;await img.decode();
  renderPreview();
  if(!sameAISnapshot(snapshot,aiSnapshot()))throw Error('O card mudou durante a edição. O resultado não foi aplicado. Envie um novo pedido a partir da prévia atual.');
  aiCandidate={img,snapshot};$('#ai-result-image').src=img.src;$('#ai-result').hidden=false;$('#prompt-status').textContent='Confira o card editado, incluindo textos, logotipos e rostos. Aplique somente se estiver de acordo.';
 }catch(e){$('#prompt-status').textContent=e.name==='TimeoutError'?'Tempo de espera encerrado. O provedor pode ter processado o pedido; não repetimos a chamada.':e.message||'Falha na conexão. Seu card foi mantido.';}
 finally{$('#ai-generate').removeAttribute('aria-busy');aiRunning=false;$('#ai-generate').disabled=!aiReady;$('#ai-generate').textContent='Editar este card com IA';}
};
$('#ai-discard').onclick=clearAICandidate;
$('#ai-accept').onclick=()=>{
 if(!aiCandidate)return;
 if(!sameAISnapshot(aiCandidate.snapshot,aiSnapshot())){clearAICandidate();toast('O card mudou. Gere outra edição a partir da prévia atual.');return;}
 const {img,snapshot}=aiCandidate;
 aiEdits.set(snapshot.scope,{image:img,layers:snapshot.layers,previous:aiEdits.get(snapshot.scope)||null});
 clearAICandidate();renderPreview();toast('Card editado aplicado. O próximo pedido usará esta versão.');
};
$('#ai-undo').onclick=()=>{
 const scope=aiScope(),edit=aiEdits.get(scope);if(!edit)return;
 if(edit.previous)aiEdits.set(scope,edit.previous);else aiEdits.delete(scope);
 clearAICandidate();renderPreview();toast('Edição por IA desfeita.');
};
syncAICard();checkAI();


function highlightAIConsent(){
 const panel=$('#ai-consent-panel'),checkbox=$('#ai-consent');
 $('#ai-consent-alert').hidden=false;panel.classList.add('consent-required');checkbox.setAttribute('aria-invalid','true');
 panel.scrollIntoView({block:'center',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});checkbox.focus({preventScroll:true});
 if(!matchMedia('(prefers-reduced-motion: reduce)').matches)checkbox.animate([{transform:'scale(1)'},{transform:'scale(1.35)',offset:.5},{transform:'scale(1)'}],{duration:450,iterations:2});
}
