'use strict';
// Projects remain in this browser. Images and masks are stored with the editable layers.
let currentProjectId=null;
const projectImageKeys=['photo','photoOriginal','background','logo','logoOriginal'];
function projectDB(){return new Promise((resolve,reject)=>{const request=indexedDB.open('minha-voz-projects',1);request.onupgradeneeded=()=>request.result.createObjectStore('projects',{keyPath:'id'});request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);});}
async function projectTransaction(mode,operation){const db=await projectDB();return new Promise((resolve,reject)=>{const tx=db.transaction('projects',mode);let request;try{request=operation(tx.objectStore('projects'));}catch(error){db.close();reject(error);return;}tx.oncomplete=()=>{db.close();resolve(request.result);};tx.onerror=()=>{db.close();reject(tx.error);};tx.onabort=()=>{db.close();reject(tx.error||Error('Operação cancelada'));};});}
function imageData(image){if(!image)return null;const canvas=document.createElement('canvas');canvas.width=image.naturalWidth||image.width;canvas.height=image.naturalHeight||image.height;if(!canvas.width||!canvas.height)throw Error('Uma imagem ainda não terminou de carregar.');canvas.getContext('2d').drawImage(image,0,0);return canvas.toDataURL('image/png');}
async function projectImage(data){if(!data)return null;const image=new Image();image.src=data;await image.decode();return image;}
function projectPage(page){const copy={...page,campaignId:page.campaign.id};delete copy.campaign;for(const key of projectImageKeys)copy[key]=imageData(page[key]);return copy;}
async function restoreProjectPage(saved){const campaign=campaigns.find(c=>c.id===saved.campaignId);if(!campaign)throw Error('Um modelo deste projeto não está mais disponível.');const page={...newPage(campaign),...saved,campaign,id:'project-'+crypto.randomUUID()};delete page.campaignId;for(const key of projectImageKeys)page[key]=await projectImage(saved[key]);return page;}
async function saveProject(){
 if(typeof aiRunning!=='undefined'&&aiRunning){toast('Aguarde a edição com Gemini terminar antes de salvar.');return;}
 const existing=currentProjectId?await projectTransaction('readonly',s=>s.get(currentProjectId)):null;
 const title=prompt('Nome do projeto:',existing?.title||state.campaign.name);if(title===null)return;
 const name=title.trim();if(!name){toast('Digite um nome para o projeto.');return;}
 const button=$('#save-project');button.disabled=true;
 try{
  syncAICard();
  const edits=[];for(const [scope,entry] of aiEdits){const [pageId,format]=JSON.parse(scope);const index=state.pages.findIndex(p=>p.id===pageId);if(index>=0)edits.push({index,format,image:imageData(entry.image)});}
  const project={id:currentProjectId||crypto.randomUUID(),title:name,updatedAt:Date.now(),version:1,pages:state.pages.map(projectPage),slide:state.slide,format:state.format,step:state.step,carouselInitialized:state.carouselInitialized,edits};
  await projectTransaction('readwrite',s=>s.put(project));currentProjectId=project.id;toast('Projeto salvo neste aparelho.');
 }catch(error){console.error(error);toast('Não foi possível salvar. Verifique o espaço disponível no navegador e tente novamente.');}
 finally{button.disabled=false;}
}
async function restoreProject(project){
 if(!project||project.version!==1||!Array.isArray(project.pages)||!project.pages.length)throw Error('Projeto inválido ou versão não suportada.');
 const pages=await Promise.all(project.pages.map(restoreProjectPage));
 const edits=await Promise.all((project.edits||[]).map(async e=>({...e,image:await projectImage(e.image)})));
 resetAIEdits();state.creationSetup=false;state.pages=pages;state.carouselInitialized=!!project.carouselInitialized;
 for(const edit of edits){if(!pages[edit.index])continue;state.slide=edit.index;state.format=edit.format;aiEdits.set(aiScope(),{image:edit.image,layers:aiLayers(),previous:null});}
 state.slide=Math.max(0,Math.min(project.slide||0,pages.length-1));state.format=project.format||'feed';currentProjectId=project.id;
 syncEditorFields();renderOptions();renderPalette();setStep(project.step??1);$('#format').value=state.format;renderPreview();
 $('#projects-dialog').close();$('#editor').showModal();document.body.style.overflow='hidden';if(typeof syncEditorViewport==='function')syncEditorViewport();
}
async function renderProjects(){
 const list=$('#projects-list');list.textContent='Carregando…';
 try{
  const projects=await projectTransaction('readonly',s=>s.getAll());list.replaceChildren();projects.sort((a,b)=>b.updatedAt-a.updatedAt);
  if(!projects.length){list.textContent='Nenhum projeto salvo ainda.';return;}
  for(const project of projects){
   const row=document.createElement('div');row.className='project-row';
   const info=document.createElement('div'),name=document.createElement('strong'),date=document.createElement('small');
   name.textContent=project.title;date.textContent='Salvo em '+new Date(project.updatedAt).toLocaleString('pt-BR');info.append(name,date);
   const open=document.createElement('button');open.type='button';open.className='secondary-button';open.textContent='Continuar';open.onclick=async()=>{open.disabled=true;try{await restoreProject(project);}catch(error){console.error(error);toast(error.message||'Não foi possível abrir o projeto.');}finally{open.disabled=false;}};
   const remove=document.createElement('button');remove.type='button';remove.className='text-button';remove.textContent='Excluir';remove.setAttribute('aria-label','Excluir projeto '+project.title);remove.onclick=async()=>{if(!confirm('Excluir o projeto “'+project.title+'”?'))return;try{await projectTransaction('readwrite',s=>s.delete(project.id));if(currentProjectId===project.id)currentProjectId=null;await renderProjects();}catch(error){toast('Não foi possível excluir o projeto.');}};
   row.append(info,open,remove);list.append(row);
  }
 }catch(error){console.error(error);list.textContent='Não foi possível acessar os projetos neste navegador.';}
}
$('#save-project').onclick=()=>saveProject().catch(error=>{console.error(error);toast('Não foi possível acessar os projetos neste navegador.');});
$('#open-projects').onclick=()=>{renderProjects();$('#projects-dialog').showModal();};
$('#close-projects').onclick=()=>$('#projects-dialog').close();
