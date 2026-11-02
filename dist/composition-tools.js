'use strict';
const CATEGORY_ICONS={'Família':'family','Meu Bebê':'baby','Amor':'heart','Celebrações':'cake','Conquistas':'trophy','Causas':'community','Meio Ambiente':'leaf','Proteção Animal':'paw','Mulheres':'woman','Cidadania':'flag','Conscientização':'ribbon','Estilo de Vida':'camera','Bem-estar':'wellness','Esportes':'ball','Viagens':'plane','Pets':'paw','Hobbies':'palette'};
const IMAGE_STYLES={photo:{label:'Fotos',icon:'camera'},banner:{label:'Banners',icon:'banner'},montage:{label:'Montagens',icon:'layers'}};
const PHOTO_TEMPLATES=new Set(['familia-afeto','cotidiano-cafe','bem-estar','corrida','viagem-praia','viagem-montanha','pets-companhia']);
const BANNER_TEMPLATES=new Set(['aniversario-celebrar','conquista-pessoal','povos-indigenas','meio-ambiente','protecao-animal','mulheres-respeito','cidadania','outubro-rosa','futebol-brasil','futebol-meu-time']);
function templateStyle(id){return PHOTO_TEMPLATES.has(id)?'photo':BANNER_TEMPLATES.has(id)?'banner':'montage';}
function catalogCategories(list){return [...new Set(list.map(c=>c.category))].map(name=>({name,icon:CATEGORY_ICONS[name]||'grid'}));}
function visibleCampaigns(list,{style='all',category='all',query='',onlySaved=false,saved=new Set()}={}){
 const term=query.toLocaleLowerCase('pt-BR');
 return list.filter(c=>(style==='all'||c.imageStyle===style)&&(category==='all'||(category instanceof Set?(category.size===0||category.has(c.category)):Array.isArray(category)?(!category.length||category.includes(c.category)):c.category===category))&&(!onlySaved||saved.has(c.id))&&[c.name,c.category,c.text,IMAGE_STYLES[c.imageStyle]?.label].join(' ').toLocaleLowerCase('pt-BR').includes(term));
}
let nextPageId=0;
const MAX_CAROUSEL_PAGES=10;
function newPage(c){return {id:'post-'+(++nextPageId),campaign:c,palette:c.color||0,backgroundMode:'image',backgroundColor:'#183f35',background:null,text:c.text,textColor:c.textColor||'#213f33',signature:'',signatureColor:c.textColor||'#213f33',signaturePlate:true,textColorCustom:false,signatureColorCustom:false,photo:null,photoOriginal:null,photoMask:null,photoSettings:{exposure:0,contrast:0,warmth:0,saturation:0,'cutout-edge':50,'cutout-soft':12,compare:false},scale:100,x:0,y:0,rotation:0,gray:false,cutout:false,font:'editorial',textSize:100,textX:0,textY:0,textRotation:0,logo:null,logoOriginal:null,logoHasCutout:false,logoSettings:{color:'#ffffff',tolerance:12},logoSize:20,logoPosition:'bottom-right',logoOpacity:100,logoPlate:false,aiPrompt:'',photoUploadRevision:0,backgroundUploadRevision:0,logoUploadRevision:0};}
function createEditorState(c){
 const s={pages:[newPage(c)],slide:0,format:'feed',step:1,aiCard:null,carouselInitialized:false};
 for(const key of Object.keys(s.pages[0]).filter(k=>k!=='id'))Object.defineProperty(s,key,{enumerable:true,get(){return s.pages[s.slide][key];},set(value){s.pages[s.slide][key]=value;}});
 Object.defineProperty(s,'pageId',{get(){return s.pages[s.slide].id;}});return s;
}
function activePage(){return state.pages[state.slide];}
function carouselPage(source,text){const page=newPage(source.campaign);for(const key of ['palette','backgroundMode','backgroundColor','background','textColor','textColorCustom','signature','signatureColor','signatureColorCustom','signaturePlate','font','textSize','textX','textY','textRotation','logo','logoOriginal','logoHasCutout','logoSize','logoPosition','logoOpacity','logoPlate'])page[key]=source[key];page.logoSettings={...source.logoSettings};page.text=text||source.campaign.text;return page;}
function ensureCarouselPages(){if(state.carouselInitialized)return;state.carouselInitialized=true;const first=state.pages[0];while(state.pages.length<3)state.pages.push(carouselPage(first,state.pages.length===1?first.campaign.alt:first.campaign.third));}
function setCurrentPage(index){if(index<0||index>=state.pages.length)return;state.slide=index;syncEditorFields();renderOptions();renderPreview();}
function addCarouselPage(){if(state.pages.length>=MAX_CAROUSEL_PAGES)return;state.pages.push(carouselPage(activePage()));setCurrentPage(state.pages.length-1);}
function removeCarouselPage(){if(state.pages.length<=2)return;state.pages.splice(state.slide,1);setCurrentPage(Math.min(state.slide,state.pages.length-1));}
function syncEditorFields(){
 for(const [id,key] of [['headline','text'],['signature','signature'],['text-color','textColor'],['signature-color','signatureColor'],['background-color','backgroundColor'],['background-mode','backgroundMode'],['font-style','font'],['text-size','textSize'],['text-x','textX'],['text-y','textY'],['text-rotation','textRotation'],['photo-scale','scale'],['photo-x','x'],['photo-y','y'],['photo-rotation','rotation'],['logo-size','logoSize'],['logo-position','logoPosition'],['logo-opacity','logoOpacity'],['ai-prompt','aiPrompt']])$('#'+id).value=state[key];
 syncTextPositionFields();
 $('#photo-angle').textContent=(state.rotation||0)+'°';
 if(typeof syncChoiceTiles==='function')syncChoiceTiles();
 $('#signature-plate').checked=state.signaturePlate;$('#photo-gray').checked=state.gray;$('#logo-plate').checked=state.logoPlate;
 $('#char-count').textContent=state.text.length+'/100';$('#prompt-count').textContent=state.aiPrompt.length+'/1500';
 $('#upload-label').textContent=state.photo?'Trocar minha foto no card':'Adicionar minha foto ao card';$('#remove-photo').hidden=!state.photo;$('#photo-controls').hidden=!state.photo;
 $('#remove-background').hidden=state.backgroundMode==='image'&&!state.background;$('#logo-controls').hidden=!state.logo;
 if(typeof restorePhotoTools==='function')restorePhotoTools();if(typeof restoreLogoTools==='function')restoreLogoTools();
}
function renderCarouselPages(){
 $('#carousel-pages').hidden=state.format!=='carousel';if(state.format!=='carousel')return;
 const list=$('#carousel-page-list');list.innerHTML='';
 state.pages.forEach((page,index)=>{const b=document.createElement('button');b.type='button';b.className='carousel-page'+(index===state.slide?' active':'');b.setAttribute('aria-label','Editar post '+(index+1));b.setAttribute('aria-current',index===state.slide?'page':'false');b.innerHTML='<b>'+(index+1)+'</b><span>'+(page.photo?'Foto adicionada':'Escolher foto')+'</span>';b.onclick=()=>setCurrentPage(index);list.append(b);});
 $('#add-slide').disabled=state.pages.length>=MAX_CAROUSEL_PAGES;$('#remove-slide').disabled=state.pages.length<=2;
 $('#page-template').innerHTML=campaigns.map(c=>'<option value="'+c.id+'">'+c.category+' · '+c.name+'</option>').join('');$('#page-template').value=state.campaign.id;
}
function setPagePhoto(page,image){page.photo=image;page.photoOriginal=image;page.photoMask=null;page.cutout=false;page.scale=100;page.x=0;page.y=0;page.rotation=0;page.gray=false;page.photoSettings={exposure:0,contrast:0,warmth:0,saturation:0,'cutout-edge':50,'cutout-soft':12,compare:false};}
async function uploadCarouselPhotos(e){
 const files=[...e.target.files],pages=state.pages,start=state.slide,source=activePage();
 if(!files.length)return;
 const targets=files.slice(0,MAX_CAROUSEL_PAGES-start).map((file,i)=>{while(pages.length<=start+i)pages.push(carouselPage(source));const page=pages[start+i];return {file,page,revision:++page.photoUploadRevision};});
 let count=0;
 try{for(const {file,page,revision} of targets){const image=await loadUpload(file);if(state.pages!==pages||!pages.includes(page)||page.photoUploadRevision!==revision)continue;setPagePhoto(page,image);count++;if(activePage()===page){syncEditorFields();renderPreview();}}
  if(state.pages===pages){renderCarouselPages();toast(count+' foto(s) adicionada(s) aos posts.');}
 }catch(error){toast(error.message);}finally{e.target.value='';}
}
function drawCardBackground(ctx,w,h,c,opts={}){
 if(opts.backgroundMode==='color'){ctx.fillStyle=opts.backgroundColor||palettes[opts.palette??c.color].bg;ctx.fillRect(0,0,w,h);return;}
 if(c.nativeScene&&!opts.background){scene(ctx,w,h,c,palettes[opts.palette??c.color]);return;}
 const image=opts.background||catalogBackground(c);
 if(image){drawCover(ctx,image,0,0,w,h);return;}
 ctx.fillStyle='#edf0e5';ctx.fillRect(0,0,w,h);
}
function colorLuminance(hex){const rgb=[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255);return rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722;}
function drawSignature(ctx,w,h,opts,{x=w*.0764,y=h-w*.0486,center=false,maxWidth=w*.8,size=w*.018}={}){
 const text=opts.signature||'Crie a sua · Minha Voz',color=opts.signatureColor||opts.textColor||'#213f33';
 ctx.save();ctx.font=size+'px Arial';ctx.textAlign=center?'center':'left';ctx.textBaseline='alphabetic';
 const textWidth=Math.min(ctx.measureText(text).width,maxWidth),pad=size*.55;
 if(opts.signaturePlate!==false){ctx.fillStyle=colorLuminance(color)>.5?'#102c22e8':'#fffefaed';rounded(ctx,x-(center?textWidth/2:0)-pad,y-size-pad*.55,textWidth+pad*2,size+pad*1.4,pad*.5);ctx.fill();}
 ctx.fillStyle=color;ctx.fillText(text,x,y,maxWidth);ctx.restore();
}
async function waitForCardAssets(){
 if(CARD_FONTS[state.font])await document.fonts.load(cardFont(state.font,32));
 await document.fonts.ready;
 if(state.aiCard||state.campaign.nativeScene||state.backgroundMode==='color'||state.background)return;
 catalogBackground(state.campaign);const image=backgroundCache.get(state.campaign.backgroundUrl);
 if(image)await image.decode();
}


const CARD_FONTS={"lmroman10-regular": "LM Roman", "lmsans10-regular": "LM Sans", "lmmono10-regular": "LM Mono", "lmromancaps10-regular": "LM Roman Caps", "lmromandunh10-regular": "LM Dunhill", "lmromanslant10-regular": "LM Roman Slanted", "lmsansquot8-regular": "LM Sans Quotation"};
function cardFont(font,size){return font==='bold'?'700 '+size+'px Arial':size+'px '+(CARD_FONTS[font]?'"'+CARD_FONTS[font]+'"':'Georgia');}

function syncTextPositionFields(){
 for(const [id,key,suffix] of [['text-x','textX','%'],['text-y','textY','%'],['text-rotation','textRotation','°']]){
  $('#'+id).value=state[key]||0;$('#'+id+'-value').textContent=(state[key]||0)+suffix;
 }
}
function transformCardText(ctx,w,h,opts,x,y){
 ctx.translate(w*(opts.textX||0)/100,h*(opts.textY||0)/100);
 ctx.translate(x,y);ctx.rotate((opts.textRotation||0)*Math.PI/180);ctx.translate(-x,-y);
}
