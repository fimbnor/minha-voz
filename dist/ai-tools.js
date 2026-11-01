'use strict';
let aiReady=false,aiRunning=false,aiCandidate=null,aiPrevious=null;
async function checkAI(){
 if(aiRunning)return;
 const button=$('#ai-generate');
 button.disabled=true;button.textContent='Verificando Gemini…';button.removeAttribute('title');
 try{
  const r=await fetch('/api/config',{cache:'no-store',signal:AbortSignal.timeout(15000)});
  if(!r.ok)throw Error(r.status===401?'Sua sessão expirou. Recarregue a página e entre novamente.':'Não foi possível verificar o Gemini. Recarregue a página para tentar novamente.');
  const config=await r.json();aiReady=config.available===true;
  if(aiReady){$('#prompt-status').textContent='Geração habilitada no servidor. Autorize o envio ao Google e confira o resultado antes de usar.';}
  else{
   const missing=Array.isArray(config.missingConfig)?config.missingConfig:[];
   const details=[];
   if(missing.includes('GEMINI_API_KEY'))details.push('Cadastre GEMINI_API_KEY com sua chave');
   if(missing.includes('AI_ENABLED'))details.push('defina AI_ENABLED como true');
   $('#prompt-status').textContent=details.length?'Gemini indisponível: '+details.join('; ')+'. Faça isso em Environment do serviço no Render, salve e faça o deploy.':'Gemini indisponível. Confira GEMINI_API_KEY e AI_ENABLED=true no serviço do Render e faça o deploy.';
  }
 }catch(e){aiReady=false;$('#prompt-status').textContent=e.name==='TimeoutError'?'O servidor demorou para responder. Recarregue a página para verificar novamente.':e.message||'Não foi possível verificar a configuração do Gemini.';}
 button.disabled=!aiReady;button.textContent=aiReady?'Gerar com Gemini':'Gemini indisponível';
 if(!aiReady)button.title=$('#prompt-status').textContent;
}
window.addEventListener('focus',()=>{if(!aiReady&&!aiRunning)checkAI();});
function aiNotice(message,field){const status=$('#prompt-status');status.textContent=message;status.scrollIntoView({block:'nearest'});if(field)$(field).focus();}
function aiSource(){const c=photoCanvas(originalPhoto,1600),url=c.toDataURL('image/jpeg',.9);return {mimeType:'image/jpeg',data:url.split(',')[1]};}
$('#ai-generate').onclick=async()=>{
 if(!aiReady||aiRunning)return;
 const mode=$('#ai-mode').value,prompt=$('#ai-prompt').value.trim();
 if(!prompt){aiNotice("Descreva os detalhes que deseja na imagem.","#ai-prompt");return;}
 if(!$('#ai-consent').checked){aiNotice("Autorize o envio ao Google para continuar.","#ai-consent");return;}
 if(mode!=='background'&&!originalPhoto){aiNotice("Envie uma foto no passo Sua foto.",null);return;}
 if(mode!=='background'&&state.campaign.id==='bebe'){aiNotice("Em Meu Bebê, escolha Criar cenário para preservar a foto original.","#ai-mode");return;}
 aiRunning=true;$('#ai-generate').setAttribute('aria-busy','true');aiCandidate=null;$('#ai-result').hidden=true;$('#ai-generate').disabled=true;$('#ai-generate').textContent='Gerando… aguarde';$('#prompt-status').textContent='Pedido enviado. Você pode aguardar até dois minutos. Não há repetição automática.';
 const revision=photoRevision,campaign=state.campaign.id;
 try{
  const payload={mode,prompt,consent:true,category:campaign,aspectRatio:state.format==='story'?'9:16':['square','profile','instagram-profile'].includes(state.format)?'1:1':'4:5'};
  if(mode!=='background')payload.image=aiSource();
  const r=await fetch('/api/images/edit',{method:'POST',headers:{'Content-Type':'application/json','X-Request-ID':crypto.randomUUID()},body:JSON.stringify(payload),signal:AbortSignal.timeout(130000)});
  const data=await r.json();if(!r.ok)throw Error(data.error||'Não foi possível gerar.');
  if(revision!==photoRevision||campaign!==state.campaign.id)throw Error('A foto ou o modelo mudou. O resultado não foi aplicado.');
  const img=new Image();img.src=`data:${data.image.mimeType};base64,${data.image.data}`;await img.decode();
  aiCandidate={img,mode,revision,campaign};$('#ai-result-image').src=img.src;$('#ai-result').hidden=false;$('#prompt-status').textContent='Imagem recebida. Confira rostos, mãos e detalhes. Aplique somente se estiver de acordo.';
 }catch(e){$('#prompt-status').textContent=e.name==='TimeoutError'?'Tempo de espera encerrado. O provedor pode ter processado o pedido; não repetimos a chamada.':e.message||'Falha na conexão. A foto original permanece disponível.';}
 finally{$('#ai-generate').removeAttribute('aria-busy');aiRunning=false;$('#ai-generate').disabled=!aiReady;$('#ai-generate').textContent='Gerar com Gemini';}
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
