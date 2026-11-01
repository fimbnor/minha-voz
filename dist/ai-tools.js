'use strict';
let aiReady=false,aiRunning=false,aiCandidate=null,aiPrevious=null;
async function checkAI(){try{const r=await fetch('/api/config',{cache:'no-store'});if(!r.ok)throw Error();const config=await r.json();aiReady=config.available===true;$('#prompt-status').textContent=aiReady?'Gemini conectado ao servidor. Uma geração por toque; confira o resultado antes de usar.':'Configure GEMINI_API_KEY e AI_ENABLED no servidor para ativar a geração.';}catch{$('#prompt-status').textContent='Geração disponível na versão com servidor. Esta prévia estática permite editar e baixar as instruções.';}$('#ai-generate').disabled=!aiReady;}
function aiSource(){const c=photoCanvas(originalPhoto,1600),url=c.toDataURL('image/jpeg',.9);return {mimeType:'image/jpeg',data:url.split(',')[1]};}
$('#ai-generate').onclick=async()=>{
 if(!aiReady||aiRunning)return;
 const mode=$('#ai-mode').value,prompt=state.aiPrompt.trim();
 if(!prompt){toast('Descreva os detalhes que deseja na imagem.');return;}
 if(!$('#ai-consent').checked){toast('Autorize o envio ao Google para continuar.');return;}
 if(mode!=='background'&&!originalPhoto){toast('Envie uma foto no passo Sua foto.');return;}
 if(mode!=='background'&&state.campaign.id==='bebe'){toast('Em Meu Bebê, escolha Criar cenário para preservar a foto original.');return;}
 aiRunning=true;aiCandidate=null;$('#ai-result').hidden=true;$('#ai-generate').disabled=true;$('#ai-generate').textContent='Gerando… aguarde';$('#prompt-status').textContent='Pedido enviado. Você pode aguardar até dois minutos. Não há repetição automática.';
 const revision=photoRevision,campaign=state.campaign.id;
 try{
  const payload={mode,prompt,consent:true,category:campaign,aspectRatio:state.format==='story'?'9:16':['square','profile'].includes(state.format)?'1:1':'4:5'};
  if(mode!=='background')payload.image=aiSource();
  const r=await fetch('/api/images/edit',{method:'POST',headers:{'Content-Type':'application/json','X-Request-ID':crypto.randomUUID()},body:JSON.stringify(payload),signal:AbortSignal.timeout(130000)});
  const data=await r.json();if(!r.ok)throw Error(data.error||'Não foi possível gerar.');
  if(revision!==photoRevision||campaign!==state.campaign.id)throw Error('A foto ou o modelo mudou. O resultado não foi aplicado.');
  const img=new Image();img.src=`data:${data.image.mimeType};base64,${data.image.data}`;await img.decode();
  aiCandidate={img,mode,revision,campaign};$('#ai-result-image').src=img.src;$('#ai-result').hidden=false;$('#prompt-status').textContent='Imagem recebida. Confira rostos, mãos e detalhes. Aplique somente se estiver de acordo.';
 }catch(e){$('#prompt-status').textContent=e.name==='TimeoutError'?'Tempo de espera encerrado. O provedor pode ter processado o pedido; não repetimos a chamada.':e.message||'Falha na conexão. A foto original permanece disponível.';}
 finally{aiRunning=false;$('#ai-generate').disabled=!aiReady;$('#ai-generate').textContent='Gerar com Gemini';}
};
$('#ai-discard').onclick=()=>{aiCandidate=null;$('#ai-result').hidden=true;$('#ai-result-image').removeAttribute('src');};
$('#ai-accept').onclick=()=>{
 if(!aiCandidate)return;if(aiCandidate.revision!==photoRevision||aiCandidate.campaign!==state.campaign.id){toast('A foto ou o modelo mudou. Gere outra opção.');return;}
 aiPrevious={background:state.background,aiArtwork:state.aiArtwork};
 if(aiCandidate.mode==='background'){state.background=aiCandidate.img;state.aiArtwork=null;$('#remove-background').hidden=false;}else state.aiArtwork=aiCandidate.img;
 $('#ai-result').hidden=true;$('#ai-result-image').removeAttribute('src');aiCandidate=null;$('#ai-undo').hidden=false;renderPreview();toast('Resultado aplicado. Texto e logotipo continuam editáveis.');
};
$('#ai-undo').onclick=()=>{if(!aiPrevious)return;Object.assign(state,aiPrevious);$('#remove-background').hidden=!state.background;aiPrevious=null;$('#ai-undo').hidden=true;renderPreview();};
// A new source photo invalidates any previously approved full-image transformation.
$('#photo-input').addEventListener('change',()=>{state.aiArtwork=null;aiCandidate=null;aiPrevious=null;$('#ai-result').hidden=true;$('#ai-undo').hidden=true;});
$('#remove-photo').addEventListener('click',()=>{state.aiArtwork=null;aiCandidate=null;renderPreview();});
checkAI();
