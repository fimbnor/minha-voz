'use strict';
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const icons={grid:'<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',heart:'<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/>',leaf:'<path d="M20 3C7 2 2 8 5 16s17 5 15-13Z"/><path d="m3 21 12-12M8 16v-5m0 5h5"/>',sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1 1m12 12 1 1M5 19l1-1M18 6l1-1"/>',ball:'<circle cx="12" cy="12" r="9"/><path d="m12 7 5 4-2 6H9l-2-6 5-4Zm0 0V3M7 11l-4-1m6 7-2 3m8-3 2 3m0-9 4-1"/>',search:'<circle cx="10" cy="10" r="6"/><path d="m15 15 6 6"/>',arrow:'<path d="M5 19 19 5M5 5h14v14"/>',spark:'<path d="m12 2 2.5 7.5L22 12l-7.5 2.5L12 22l-2.5-7.5L2 12l7.5-2.5L12 2Z"/>',close:'<path d="m6 6 12 12M6 18 18 6"/>',camera:'<path d="M3 7h4l2-3h6l2 3h4v13H3V7Z"/><circle cx="12" cy="13" r="4"/>',download:'<path d="M12 3v12m-4-4 4 4 4-4M4 16v5h16v-5"/>',share:'<path d="M12 16V3M7 8l5-5 5 5M5 12v9h14v-9"/>'};
Object.assign(icons,{"family":"<circle cx=\"8\" cy=\"6\" r=\"2.5\"/><circle cx=\"17\" cy=\"7\" r=\"2\"/><path d=\"M2.5 19v-3a5.5 5.5 0 0 1 8-4.9M19 12a4 4 0 0 1 2.5 3.7V19\"/><circle cx=\"13\" cy=\"13\" r=\"2.2\"/><path d=\"M9 21v-1.5a4 4 0 0 1 8 0V21\"/>","baby":"<path d=\"M4 10a8.5 8.5 0 0 1 16 0M4 10a2 2 0 0 0 0 4 8.5 8.5 0 0 0 16 0 2 2 0 0 0 0-4\"/><path d=\"M12 3c3 0 3 4 0 4M8.5 11.5h.01m7 0h.01M9 15a3.5 3.5 0 0 0 6 0\"/>","community":"<circle cx=\"8\" cy=\"6\" r=\"2\"/><circle cx=\"16\" cy=\"6\" r=\"2\"/><path d=\"M3 13v-1a4 4 0 0 1 6-3.5M21 13v-1a4 4 0 0 0-6-3.5M12 22v-7M12 18c-4 0-6-2-6-5 4 0 6 2 6 5Zm0-2c4 0 6-2 6-5-4 0-6 2-6 5Z\"/>","paw":"<ellipse cx=\"5\" cy=\"9\" rx=\"2\" ry=\"2.7\" transform=\"rotate(-25 5 9)\"/><ellipse cx=\"10\" cy=\"5\" rx=\"2\" ry=\"2.7\"/><ellipse cx=\"16\" cy=\"5.5\" rx=\"2\" ry=\"2.7\" transform=\"rotate(15 16 5.5)\"/><ellipse cx=\"20\" cy=\"10\" rx=\"2\" ry=\"2.7\" transform=\"rotate(30 20 10)\"/><path d=\"M6.5 16c1.8-1 2-5 5.5-5s3.7 4 5.5 5c3 3-1 6-3.5 4.5a4 4 0 0 0-4 0C7.5 22 3.5 19 6.5 16Z\"/>","palette":"<path d=\"M12 3a9 9 0 1 0 0 18h1a2 2 0 0 0 1-3.7 1.5 1.5 0 0 1 1-2.8h2A4 4 0 0 0 21 11a9 9 0 0 0-9-8Z\"/><circle cx=\"7\" cy=\"10\" r=\"1\"/><circle cx=\"11\" cy=\"7\" r=\"1\"/><circle cx=\"16\" cy=\"8\" r=\"1\"/><circle cx=\"6.5\" cy=\"15\" r=\".8\"/>"});
Object.assign(icons,{
 cake:'<path d="M4 11h16v10H4zM4 15c3 3 5-3 8 0s5 0 8 0M8 11V7m8 4V7m-4 4V5M8 3v1m8-1v1m-4-3v1"/>',
 trophy:'<path d="M7 3h10v5a5 5 0 0 1-10 0V3Zm0 2H3v3a4 4 0 0 0 5 4m9-7h4v3a4 4 0 0 1-5 4M12 13v7m-5 1h10"/>',
 woman:'<circle cx="12" cy="8" r="5"/><path d="M12 13v9m-4-4h8"/>',
 flag:'<path d="M5 22V3c5-4 9 4 14 0v11c-5 4-9-4-14 0"/>',
 ribbon:'<path d="M8 3c-3 4 1 9 10 18l3-4C12 10 10 6 8 3Zm8 0c3 4-1 9-10 18l-3-4C12 10 14 6 16 3ZM8 3h8"/>',
 wellness:'<path d="M12 20C3 20 2 12 3 8c5 0 9 4 9 12Zm0 0c9 0 10-8 9-12-5 0-9 4-9 12Zm0-7c-4-4-4-7 0-11 4 4 4 7 0 11Z"/>',
 plane:'<path d="m3 12 7 2 5 8 2-1-2-8 6-7c2-3 0-5-3-3l-7 6-8-2-1 2 8 5"/>',
 banner:'<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M5 9h6m-6 4h9m3-4h2"/>',
 layers:'<path d="m12 2 10 6-10 6L2 8l10-6Zm-9 11 9 6 9-6M3 17l9 6 9-6"/>'
});
function icon(name){return `<svg viewBox="0 0 24 24" aria-hidden="true">${icons[name]||icons.spark}</svg>`;}function hydrate(){ $$('[data-icon]').forEach(e=>e.innerHTML=icon(e.dataset.icon)); }
const campaigns=window.MINHA_VOZ_CATALOG.templates.map((t,i)=>({id:t.id,name:t.nome,area:t.universo,category:t.categoria,scene:'sun',color:i%6,symbol:'✳',tag:t.categoria,text:t.frase_sugerida,alt:t.frases_alternativas[0],third:t.frases_alternativas[1],backgroundUrl:'/catalogo-minha-voz/'+t.arquivo_fundo,layout:t.layout,textColor:t.cor_texto,accentColor:t.cor_destaque,imageStyle:templateStyle(t.id)}));
const backgroundCache=new Map();let heroRenderer=null,heroBackgroundUrl=null;
function catalogBackground(c){
 if(c.nativeScene)return null;
 let image=backgroundCache.get(c.backgroundUrl);
 if(!image){
  image=new Image();backgroundCache.set(c.backgroundUrl,image);
  const url=c.backgroundUrl;
  const refresh=()=>{if(state.campaign.backgroundUrl===url&&state.backgroundMode!=='color'&&!state.background)renderPreview();if(heroBackgroundUrl===url&&heroRenderer)heroRenderer();};
  image.onload=refresh;image.onerror=()=>{image.loadFailed=true;refresh();};image.src=url;
 }
 return image.complete&&image.naturalWidth?image:null;
}
const palettes=[{bg:'#183f35',light:'#dae4b9',accent:'#e7b969',detail:'#638767',name:'Floresta'},{bg:'#78947a',light:'#f7f0d9',accent:'#e8ca7b',detail:'#365e4d',name:'Sálvia'},{bg:'#e7c746',light:'#173e30',accent:'#fff5cf',detail:'#539565',name:'Brasil'},{bg:'#b96d5a',light:'#fff0d3',accent:'#edc3a0',detail:'#8f473d',name:'Terracota'},{bg:'#d6dcc8',light:'#3c5a4c',accent:'#aab797',detail:'#f7f2dc',name:'Memórias'},{bg:'#e4d6b6',light:'#4c563a',accent:'#c88453',detail:'#b49f71',name:'Areia'}];
// Restored from the original illustrated catalog, before image backgrounds were added.
const originalMontages=[
{id:'indigenas',name:'Povos indígenas, vozes presentes',area:'Meu Mundo',category:'Povos Indígenas',scene:'forest',color:0,symbol:'✳',tag:'Respeito, direitos e futuro',text:'A floresta tem voz. E a minha está com ela.',alt:'Pelos povos originários. Pelo futuro de todos.',third:'Respeito se compartilha. Faça parte.'},
{id:'ambiente',name:'Um amanhã mais verde',area:'Meu Mundo',category:'Meio Ambiente',scene:'forest',color:1,symbol:'↗',tag:'Pequenos gestos, grandes mudanças',text:'O futuro começa com o que a gente cuida.',alt:'Mais floresta. Mais vida. Mais futuro.',third:'Cuidar do planeta é cuidar da gente.'},
{id:'brasil',name:'O coração veste verde e amarelo',area:'Minhas Paixões',category:'Esportes',scene:'sport',color:2,symbol:'⚽',tag:'Torcida que une',text:'Hoje a minha voz é Brasil!',alt:'Na alegria de torcer, somos um só.',third:'Vista sua paixão. Solte sua voz.'},
{id:'amor',name:'Nossa história, nosso jeito',area:'Minha Vida',category:'Amor',scene:'love',color:3,symbol:'♡',tag:'Memórias para guardar',text:'Meu lugar favorito é com você.',alt:'Os dias mais bonitos têm a gente.',third:'Que venham os próximos capítulos.'},
{id:'bebe',name:'Pequenos passos, imenso amor',area:'Minha Vida',category:'Meu Bebê',scene:'baby',color:4,symbol:'☾',tag:'Nascimento, mesversário e descobertas',text:'Você chegou e o mundo ficou maior.',alt:'Cada descoberta sua é um presente.',third:'Um álbum inteiro de amor.'},
{id:'vida',name:'A beleza dos dias comuns',area:'Meu Mundo',category:'Estilo de Vida',scene:'coffee',color:5,symbol:'☀',tag:'Casa, café e bem-estar',text:'Devagar também é um jeito de florescer.',alt:'Pequenos rituais. Grandes respiros.',third:'O extraordinário mora no cotidiano.'},
{id:'hobbies',name:'Feito por mim, com afeto',area:'Minhas Paixões',category:'Hobbies',scene:'craft',color:3,symbol:'✂',tag:'Seu trabalho em destaque',text:'Minhas mãos também contam histórias.',alt:'Feito à mão. Pensado com carinho.',third:'Um pouco de mim em cada detalhe.'},
{id:'pets',name:'Amor que vem de quatro patas',area:'Minhas Paixões',category:'Pets',scene:'pet',color:1,symbol:'♥',tag:'Adoção, cuidado e companhia',text:'Onde tem patinhas, tem amor.',alt:'Uma amizade que não precisa de palavras.',third:'Adotar é dar uma nova história.'},
{id:'viagens',name:'Colecionar caminhos',area:'Minhas Paixões',category:'Viagens',scene:'mountain',color:0,symbol:'↗',tag:'Destinos e boas memórias',text:'Levo saudade. Deixo pegadas.',alt:'O melhor destino é se permitir ir.',third:'Mais uma história para guardar.'},
{id:'familia',name:'Nosso melhor retrato',area:'Minha Vida',category:'Família',scene:'love',color:5,symbol:'♡',tag:'Aniversários e encontros',text:'A vida acontece melhor com a gente junto.',alt:'O nosso jeito de ser família.',third:'Memórias que atravessam gerações.'},
{id:'mulheres',name:'Toda mulher merece respeito',area:'Meu Mundo',category:'Cidadania e Direitos',scene:'sun',color:3,symbol:'✳',tag:'Voz, igualdade e acolhimento',text:'A minha voz também abre caminhos.',alt:'Respeito é o começo de tudo.',third:'Juntas, vamos mais longe.'},
{id:'datas',name:'Celebre o que faz sentido',area:'Meu Mundo',category:'Datas Especiais',scene:'sun',color:2,symbol:'☀',tag:'Novos ciclos, novas histórias',text:'Que a vida tenha mais motivos para celebrar.',alt:'O melhor presente é estar presente.',third:'Um novo ciclo. Muitas possibilidades.'}
];
const originalCategories={'Povos Indígenas':'Causas','Cidadania e Direitos':'Mulheres','Datas Especiais':'Celebrações'};
campaigns.push(...originalMontages.map(c=>({...c,category:originalCategories[c.category]||c.category,imageStyle:'montage',nativeScene:true,textColor:palettes[c.color].light,accentColor:palettes[c.color].accent})));
let saved;try{saved=new Set(JSON.parse(localStorage.getItem('minhavoz-favorites')||'[]').filter(x=>campaigns.some(c=>c.id===x)));}catch{saved=new Set();}
let filter='all',categoryFilter='all',onlySaved=false,query='',toastTimer;
try{const remembered=localStorage.getItem('minhavoz-category');if(catalogCategories(campaigns).some(c=>c.name===remembered))categoryFilter=remembered;}catch{}
const state=createEditorState(campaigns[0]);
function toast(t){$('#toast').textContent=t;$('#toast').classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').classList.remove('visible'),4500);}
function rounded(ctx,x,y,w,h,r){ctx.beginPath();ctx.roundRect(x,y,w,h,r);}
function ellipse(ctx,x,y,rx,ry,color,rotation=0){ctx.fillStyle=color;ctx.beginPath();ctx.ellipse(x,y,rx,ry,rotation,0,Math.PI*2);ctx.fill();}
function leaf(ctx,x,y,size,angle,color){ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.fillStyle=color;ctx.beginPath();ctx.moveTo(0,0);ctx.bezierCurveTo(-size*.8,-size*.3,-size*.4,-size,0,-size);ctx.bezierCurveTo(size*.5,-size*.8,size*.6,-size*.2,0,0);ctx.fill();ctx.restore();}
function drawPlant(ctx,x,y,height,color,lean=0){ctx.save();ctx.translate(x,y);ctx.rotate(lean);ctx.strokeStyle=color;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(0,0);ctx.quadraticCurveTo(-12,-height*.6,5,-height);ctx.stroke();for(let i=1;i<9;i++){let py=-height*i/10;leaf(ctx,0,py,height*.28,-1.1,color);leaf(ctx,0,py-12,height*.25,1.15,color);}ctx.restore();}
function heart(ctx,x,y,s,c){ctx.save();ctx.translate(x,y);ctx.scale(s/100,s/100);ctx.fillStyle=c;ctx.beginPath();ctx.moveTo(0,30);ctx.bezierCurveTo(-90,-25,-20,-80,0,-35);ctx.bezierCurveTo(20,-80,90,-25,0,30);ctx.fill();ctx.restore();}
function scene(ctx,w,h,c,p){ctx.fillStyle=p.bg;ctx.fillRect(0,0,w,h);let g=ctx.createLinearGradient(0,0,0,h);g.addColorStop(0,'#ffffff0a');g.addColorStop(1,'#00000018');ctx.fillStyle=g;ctx.fillRect(0,0,w,h);const k=w/720;ctx.save();ctx.scale(k,k);const H=h/k;
if(c.scene==='forest'){
ctx.globalAlpha=.2;ellipse(ctx,570,H*.48,145,145,p.accent);ctx.globalAlpha=1;
for(let layer=0;layer<3;layer++){ctx.fillStyle=[p.detail,'#284c3d','#123d32'][layer];ctx.globalAlpha=.4+layer*.18;ctx.beginPath();ctx.moveTo(0,H);for(let i=0;i<=20;i++){let x=i*36,y=H*(.68+layer*.095)+Math.sin(i*1.4+layer)*35;ctx.lineTo(x,y);}ctx.lineTo(720,H);ctx.fill();}ctx.globalAlpha=1;
for(let i=0;i<8;i++){let x=i*108-30;drawPlant(ctx,x,H+25,220+(i%3)*46,i%2?p.detail:p.light,(i-4)*.11);}drawPlant(ctx,710,H*.52,210,p.detail,-.7);drawPlant(ctx,-20,H*.6,190,p.detail,.6);
ctx.strokeStyle=p.accent;ctx.globalAlpha=.5;ctx.lineWidth=16;ctx.beginPath();ctx.moveTo(510,H*.66);ctx.bezierCurveTo(280,H*.77,640,H*.85,390,H);ctx.stroke();ctx.globalAlpha=1;
}else if(c.scene==='sport'){
ctx.save();ctx.translate(360,H*.76);ctx.rotate(-.32);ctx.fillStyle=p.detail;ctx.fillRect(-560,-125,1120,250);ctx.restore();ctx.strokeStyle=p.light;ctx.globalAlpha=.3;ctx.lineWidth=3;ctx.strokeRect(56,H*.63,608,H*.3);ctx.beginPath();ctx.ellipse(360,H*.78,95,95,0,0,Math.PI*2);ctx.stroke();ctx.globalAlpha=1;
ellipse(ctx,520,H*.77,108,108,'#faf2d8');ctx.save();ctx.translate(520,H*.77);ctx.fillStyle=p.light;for(let n=0;n<6;n++){ctx.beginPath();for(let j=0;j<5;j++){let a=j*Math.PI*2/5-Math.PI/2;let cx=n===0?0:Math.cos((n-1)*Math.PI*2/5)*85,cy=n===0?0:Math.sin((n-1)*Math.PI*2/5)*85;ctx.lineTo(cx+Math.cos(a)*29,cy+Math.sin(a)*29);}ctx.closePath();ctx.fill();}ctx.restore();
}else if(c.scene==='love'){
ellipse(ctx,600,H*.73,260,260,p.accent);heart(ctx,220,H*.78,230,p.detail);heart(ctx,500,H*.73,180,p.bg);ctx.strokeStyle=p.light;ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(0,H*.87);ctx.bezierCurveTo(180,H*.75,400,H*1.05,720,H*.84);ctx.stroke();
}else if(c.scene==='baby'){
ellipse(ctx,490,H*.73,150,150,p.accent);ellipse(ctx,553,H*.68,125,125,p.bg);for(let i=0;i<14;i++){ctx.save();ctx.translate(70+(i*97)%600,H*.52+(i*63)%(H*.4));ctx.rotate(i);ctx.fillStyle=i%2?p.detail:p.accent;ctx.beginPath();for(let j=0;j<10;j++){let a=j*Math.PI/5,r=j%2?6:14;ctx.lineTo(Math.cos(a)*r,Math.sin(a)*r);}ctx.closePath();ctx.fill();ctx.restore();}ctx.strokeStyle=p.light;ctx.globalAlpha=.2;ctx.lineWidth=2;for(let i=0;i<4;i++){ctx.beginPath();ctx.arc(360,H+70,180+i*38,Math.PI,Math.PI*2);ctx.stroke();}ctx.globalAlpha=1;
}else if(c.scene==='coffee'){
ctx.fillStyle=p.detail;ctx.beginPath();ctx.moveTo(0,H*.82);ctx.lineTo(720,H*.62);ctx.lineTo(720,H);ctx.lineTo(0,H);ctx.fill();ellipse(ctx,390,H*.83,210,65,p.accent);ctx.fillStyle=p.light;rounded(ctx,245,H*.58,255,210,45);ctx.fill();ctx.strokeStyle=p.light;ctx.lineWidth=25;ctx.beginPath();ctx.arc(510,H*.69,55,-Math.PI/2,Math.PI/2);ctx.stroke();ellipse(ctx,372,H*.59,112,30,p.accent);ctx.strokeStyle=p.detail;ctx.lineWidth=4;for(let i=0;i<3;i++){ctx.beginPath();ctx.moveTo(330+i*45,H*.53);ctx.bezierCurveTo(300+i*45,H*.47,370+i*45,H*.43,340+i*45,H*.39);ctx.stroke();}drawPlant(ctx,50,H,250,p.accent,.1);
}else if(c.scene==='craft'){
ellipse(ctx,470,H*.76,170,170,p.accent);ctx.strokeStyle=p.bg;ctx.lineWidth=4;for(let i=0;i<8;i++){ctx.beginPath();ctx.ellipse(470,H*.76,30+i*17,164,.3,0,Math.PI*2);ctx.stroke();}ctx.strokeStyle=p.light;ctx.lineWidth=13;ctx.beginPath();ctx.moveTo(170,H*.91);ctx.lineTo(570,H*.53);ctx.moveTo(220,H*.97);ctx.lineTo(610,H*.57);ctx.stroke();ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(455,H*.88);ctx.bezierCurveTo(440,H*1.01,200,H*.65,40,H*.94);ctx.stroke();
}else if(c.scene==='pet'){
for(let n=0;n<6;n++){let x=100+(n*173)%570,y=H*.61+(n*89)%(H*.29);ellipse(ctx,x,y,34,29,p.accent,-.2);for(let j=0;j<3;j++)ellipse(ctx,x+(j-1)*27,y-42-Math.sin(j)*10,12,18,p.accent,(j-1)*.4);}heart(ctx,420,H*.83,170,p.light);
}else if(c.scene==='mountain'){
ellipse(ctx,540,H*.58,85,85,p.accent);for(let n=0;n<3;n++){ctx.fillStyle=n===1?p.detail:p.light;ctx.globalAlpha=.3+n*.2;ctx.beginPath();ctx.moveTo(-100+n*220,H);ctx.lineTo(180+n*210,H*(.57+n*.06));ctx.lineTo(500+n*230,H);ctx.fill();}ctx.globalAlpha=1;
}else{for(let i=0;i<12;i++){ctx.save();ctx.translate(360,H*.76);ctx.rotate(i*Math.PI/6);ctx.fillStyle=p.accent;ctx.fillRect(110,-12,170,24);ctx.restore();}ellipse(ctx,360,H*.76,90,90,p.light);}
ctx.restore();
// A restrained paper texture, deterministic so exported cards match the preview.
ctx.fillStyle='#ffffff07';for(let i=0;i<350;i++){let x=((i*137)%997)/997*w,y=((i*239)%991)/991*h;ctx.fillRect(x,y,1.5,1.5);}}
function drawCover(ctx,img,x,y,w,h){let r=Math.max(w/img.width,h/img.height);ctx.drawImage(img,x+(w-img.width*r)/2,y+(h-img.height*r)/2,img.width*r,img.height*r);}
function wrap(ctx,text,max){const words=text.trim().split(/\s+/);let lines=[],line='';for(const word of words){if(ctx.measureText((line?line+' ':'')+word).width>max&&line){lines.push(line);line=word;}else line+=(line?' ':'')+word;}if(line)lines.push(line);return lines;}
function drawCard(canvas,c,opts={}){
if(opts.aiCard){
 const ctx=canvas.getContext('2d'),w=canvas.width,h=canvas.height;
 ctx.clearRect(0,0,w,h);ctx.save();
 if(opts.format==='instagram-profile'){ctx.beginPath();ctx.arc(w/2,h/2,Math.min(w,h)*.49,0,Math.PI*2);ctx.clip();}
 drawCover(ctx,opts.aiCard,0,0,w,h);ctx.restore();return;
}
if(opts.format==='instagram-profile'){drawInstagramProfile(canvas,c,opts);return;}
const ctx=canvas.getContext('2d'),w=canvas.width,h=canvas.height,k=w/720,p=palettes[opts.palette??c.color];ctx.clearRect(0,0,w,h);drawCardBackground(ctx,w,h,c,opts);
if(opts.photo){ctx.save();if(opts.format==='photo'&&!opts.cutout&&opts.backgroundMode!=='color'&&!opts.background){ctx.save();ctx.translate(w/2+w*(opts.x||0)/100,h/2+h*(opts.y||0)/100);ctx.rotate((opts.rotation||0)*Math.PI/180);const zoom=(opts.scale||100)/100;drawCover(ctx,opts.photo,-w*zoom/2,-h*zoom/2,w*zoom,h*zoom);ctx.restore();const shade=ctx.createLinearGradient(0,h*.55,0,h);shade.addColorStop(0,'#102c2200');shade.addColorStop(1,'#102c22d9');ctx.fillStyle=shade;ctx.fillRect(0,0,w,h);}else{let pw=w*.59*(opts.scale||100)/100,ph=pw*1.15,px=w*.54-pw/2+w*(opts.x||0)/100,py=h*.84-ph/2+h*(opts.y||0)/100;ctx.translate(px+pw/2,py+ph/2);ctx.rotate((opts.rotation||0)*Math.PI/180);ctx.shadowColor='#0e291f44';ctx.shadowBlur=20*k;ctx.fillStyle=p.light;if(!opts.cutout){rounded(ctx,-pw/2-9*k,-ph/2-9*k,pw+18*k,ph+18*k,8*k);ctx.fill();}ctx.shadowBlur=0;rounded(ctx,-pw/2,-ph/2,pw,ph,4*k);ctx.clip();if(opts.gray)ctx.filter='grayscale(1)';if(opts.cutout){const fit=Math.min(pw/opts.photo.width,ph/opts.photo.height);ctx.drawImage(opts.photo,-opts.photo.width*fit/2,-opts.photo.height*fit/2,opts.photo.width*fit,opts.photo.height*fit);}else drawCover(ctx,opts.photo,-pw/2,-ph/2,pw,ph);}ctx.restore();}
ctx.save();ctx.fillStyle=opts.textColor||c.textColor||p.light;const margin=55*k;
ctx.font=`${12*k}px Arial`;ctx.letterSpacing=`${2*k}px`;ctx.fillText('MINHA VOZ  /  '+c.category.toLocaleUpperCase('pt-BR'),margin,48*k);ctx.letterSpacing='0px';
let text=opts.text??c.text,maxWidth=w-margin*2,fontSize=(opts.font==='bold'?65:69)*k*(opts.textSize||100)/100;let lines;
do{ctx.font=cardFont(opts.font,fontSize);lines=wrap(ctx,text,maxWidth);if(lines.length*fontSize*1.02<h*.39)break;fontSize-=2*k;}while(fontSize>24*k);
let yy=opts.format==='photo'&&opts.photo?h*.71:135*k;if(h/w>1.5&&opts.format!=='photo')yy=h*.18;if(opts.format==='photo'&&opts.photo){fontSize*=.7;ctx.font=cardFont(opts.font,fontSize);lines=wrap(ctx,text,maxWidth);yy=h-fontSize*lines.length*1.1-100*k;}
ctx.textBaseline='alphabetic';for(let i=0;i<lines.length;i++)ctx.fillText(lines[i],margin,yy+i*fontSize*1.04);
if(!opts.photo){ctx.font=`${14*k}px Arial`;ctx.fillText('SUA VOZ FAZ PARTE.',margin,yy+lines.length*fontSize*1.04+25*k);ctx.fillStyle=p.accent;ctx.fillRect(margin,yy+lines.length*fontSize*1.04+40*k,60*k,3*k);}
drawSignature(ctx,w,h,opts);ctx.font=`${38*k}px Georgia`;ctx.textAlign='right';ctx.fillText('✳',w-margin,h-28*k);ctx.restore();drawLogo(ctx,w,h,opts);
}
function renderCatalog(){const list=visibleCampaigns(campaigns,{style:filter,category:categoryFilter,onlySaved,saved,query});$('#campaign-grid').innerHTML='';list.forEach(c=>{let e=document.createElement('article');e.className='campaign-card';e.innerHTML=`<button class="campaign-open" aria-label="Criar card: ${c.name}"><div class="campaign-art">${c.nativeScene?'<canvas width="480" height="600" role="img" aria-label="'+c.name+'"></canvas>':'<img src="'+c.backgroundUrl+'" alt="'+c.name+'" loading="lazy" width="480" height="600">'}</div><span class="campaign-category">${IMAGE_STYLES[c.imageStyle].label} · ${c.category}</span><h3>${c.name}</h3></button><button class="favorite ${saved.has(c.id)?'selected':''}" aria-label="${saved.has(c.id)?'Remover dos':'Adicionar aos'} favoritos: ${c.name}" aria-pressed="${saved.has(c.id)}">${icon('heart')}</button>`;$('#campaign-grid').append(e);if(c.nativeScene)drawCard(e.querySelector('canvas'),c);e.querySelector('.campaign-open').onclick=()=>openEditor(c);e.querySelector('.favorite').onclick=()=>{saved.has(c.id)?saved.delete(c.id):saved.add(c.id);try{localStorage.setItem('minhavoz-favorites',JSON.stringify([...saved]));}catch{toast('Favoritos disponíveis apenas nesta sessão.');}renderCatalog();};});$('#saved-count').textContent=saved.size;$('#catalog-count').textContent=`${list.length} ${list.length===1?'modelo':'modelos'}`;$('#empty-state').hidden=list.length>0;}
function setStep(n){state.step=n;$$('[data-panel]').forEach(e=>e.hidden=Number(e.dataset.panel)!==n);$$('[data-step]').forEach(e=>{e.classList.toggle('current',Number(e.dataset.step)===n);e.setAttribute('aria-current',Number(e.dataset.step)===n?'step':'false');});$('.editor-controls').scrollTop=0;}
function selectCampaign(c){
 state.campaign=c;state.palette=c.color;state.background=null;state.backgroundMode='image';state.backgroundUploadRevision++;
 state.text=c.text;if(!state.textColorCustom)state.textColor=c.textColor;if(!state.signatureColorCustom)state.signatureColor=c.textColor;
 syncEditorFields();renderOptions();renderPalette();renderPreview();
}
function openEditor(c){
 state.pages=[newPage(c)];state.slide=0;state.carouselInitialized=false;state.format='feed';
 if(typeof resetAIEdits==='function')resetAIEdits();
 syncEditorFields();renderOptions();renderPalette();setStep(1);renderPreview();
 $('#format').value=state.format;$('#editor').showModal();document.body.style.overflow='hidden';if(typeof syncEditorViewport==='function')syncEditorViewport();
}
function closeEditor(){$('#editor').close();document.body.style.overflow='';}
function renderOptions(){
 $('#editor-category-label').innerHTML=icon(CATEGORY_ICONS[state.campaign.category])+' '+state.campaign.category;
 const list=$('#editor-campaign-list');list.innerHTML='';
 catalogCategories(campaigns).forEach(category=>{const b=document.createElement('button');b.type='button';b.className='campaign-category-option'+(category.name===state.campaign.category?' active':'');b.innerHTML=icon(category.icon)+'<span>'+category.name+'</span>';b.setAttribute('aria-pressed',String(category.name===state.campaign.category));b.onclick=()=>{selectCampaign(campaigns.find(c=>c.category===category.name));$('#editor-categories').open=false;};list.append(b);});
 const templates=$('#editor-template-list');templates.innerHTML='';
 campaigns.filter(c=>c.category===state.campaign.category).forEach(c=>{const b=document.createElement('button');b.type='button';b.className='campaign-option'+(state.campaign.id===c.id?' active':'');b.innerHTML=(c.nativeScene?'<canvas width="96" height="120" aria-hidden="true"></canvas>':'<img src="'+c.backgroundUrl+'" alt="" width="48" height="60">')+'<span>'+c.name+'</span>';b.setAttribute('aria-pressed',String(c.id===state.campaign.id));b.onclick=()=>selectCampaign(c);templates.append(b);if(c.nativeScene)drawCard(b.querySelector('canvas'),c);});
}
function renderActiveCategory(){const box=$('#active-category');box.replaceChildren();box.hidden=categoryFilter==='all';if(box.hidden)return;const chip=document.createElement('span');chip.className='active-category-chip';chip.appendChild(document.createTextNode(categoryFilter));const clear=document.createElement('button');clear.type='button';clear.textContent='Mostrar todos';clear.onclick=()=>{categoryFilter='all';try{localStorage.removeItem('minhavoz-category');}catch{}renderCategoryShortcuts();renderCatalog();};box.append(chip,clear);}
let categoryGuideShown=false;
try{categoryGuideShown=localStorage.getItem('minhavoz-category-guide-shown')==='1';}catch{}
function showCategoryGuide(){
 if(categoryGuideShown)return;
 categoryGuideShown=true;
 try{localStorage.setItem('minhavoz-category-guide-shown','1');}catch{}
 const guide=document.createElement('div');guide.className='category-guide';guide.setAttribute('role','status');
 const message=document.createElement('span');message.textContent='Agora escolha um modelo para personalizar seu card.';
 const close=document.createElement('button');close.type='button';close.textContent='Entendi';close.setAttribute('aria-label','Fechar orientação');close.onclick=()=>guide.remove();
 guide.append(message,close);$('#campaign-grid').before(guide);
 guide.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'center'});
}
function renderCategoryShortcuts(){
 renderActiveCategory();
 $('#all-count').textContent=campaigns.length;
 const nav=$('#category-shortcuts');nav.innerHTML='';
 [{name:'all',icon:'grid'},...catalogCategories(campaigns)].forEach(category=>{const b=document.createElement('button');b.type='button';b.dataset.topic=category.name;b.innerHTML='<span class="topic-icon">'+icon(category.icon)+'</span>'+(category.name==='all'?'Todas as categorias':category.name);b.setAttribute('aria-pressed',String(categoryFilter===category.name));b.onclick=()=>{categoryFilter=category.name;try{localStorage.setItem('minhavoz-category',categoryFilter);}catch{}renderCategoryShortcuts();renderCatalog();if(category.name!=='all')showCategoryGuide();};nav.append(b);});
}
function renderPalette(){
 $('#palette').innerHTML='';palettes.forEach((p,n)=>{const b=document.createElement('button');b.type='button';b.style.background=p.bg;b.className=state.backgroundMode==='color'&&state.backgroundColor===p.bg?'selected':'';b.title=p.name;b.setAttribute('aria-label','Fundo '+p.name);b.setAttribute('aria-pressed',String(state.backgroundMode==='color'&&state.backgroundColor===p.bg));b.onclick=()=>{state.palette=n;state.backgroundColor=p.bg;state.backgroundMode='color';state.backgroundUploadRevision++;syncBackgroundControls();renderPalette();renderPreview();};$('#palette').append(b);});
}
function syncBackgroundControls(){if(typeof syncChoiceTiles==='function')syncChoiceTiles();$('#background-mode').value=state.backgroundMode;$('#background-color').value=state.backgroundColor;$('#remove-background').hidden=state.backgroundMode==='image'&&!state.background;}
function renderPreview(){if(typeof syncAICard==='function')syncAICard();let dims={feed:[1080,1350,'Feed'],story:[1080,1920,'Story / Reels'],square:[1080,1080,'Quadrado'],profile:[1080,1080,'Perfil'],'instagram-profile':[1080,1080,'Perfil circular · Instagram'],photo:[1080,1350,'Composição fotográfica'],carousel:[1080,1350,`Carrossel · post ${state.slide+1}/${state.pages.length}`]}[state.format];let c=$('#preview-canvas');if(c.width!==dims[0]||c.height!==dims[1]){c.width=dims[0];c.height=dims[1];}$('#preview-label').textContent=`${dims[2]} · ${dims[0]} × ${dims[1]}`;drawCard(c,state.campaign,state);c.classList.toggle('circular-profile',state.format==='instagram-profile');$('.preview-tip').textContent=state.format==='instagram-profile'?'Perfil circular: mantenha o rosto centralizado e prefira uma frase curta. PNG com cantos transparentes.':'A arte é atualizada enquanto você personaliza.';if($('#carousel-controls')){$('#carousel-controls').hidden=state.format!=='carousel';$('#slide-label').textContent=`Post ${state.slide+1} de ${state.pages.length}`;$('#previous-slide').disabled=state.slide===0;$('#next-slide').disabled=state.slide===state.pages.length-1;}renderCarouselPages();if(!state.campaign.nativeScene&&state.backgroundMode!=='color'&&!state.background&&!state.aiCard){const image=backgroundCache.get(state.campaign.backgroundUrl);$('#background-status').textContent=image?.loadFailed?'Não foi possível carregar o fundo. Escolha outro modelo, envie uma imagem ou use uma cor.':image&&!image.naturalWidth?'Carregando o fundo selecionado…':'';}else $('#background-status').textContent='';}
async function loadUpload(file){if(!file)return null;if(file.size>15*1024*1024)throw Error('Escolha uma imagem de até 15 MB.');if(!['image/jpeg','image/png','image/webp'].includes(file.type))throw Error('Use uma foto JPG, PNG ou WebP.');const url=URL.createObjectURL(file);try{let image=new Image();image.src=url;await image.decode();if(image.width*image.height>60000000)throw Error('Essa foto é muito grande. Envie uma versão menor.');return image;}finally{URL.revokeObjectURL(url);}}
async function uploadPhoto(e){
 const page=activePage(),revision=++page.photoUploadRevision,file=e.target.files[0];
 try{const image=await loadUpload(file);if(!image||activePage()!==page||page.photoUploadRevision!==revision)return;setPagePhoto(page,image);syncEditorFields();renderPreview();toast('Foto adicionada a este post.');}catch(error){toast(error.message);}finally{e.target.value='';}
}
async function canvasBlob(){const page=activePage(),format=state.format;await waitForCardAssets();if(activePage()!==page||state.format!==format)throw Error('O post mudou. Confira a prévia e baixe novamente.');renderPreview();return new Promise((resolve,reject)=>$('#preview-canvas').toBlob(b=>b?resolve(b):reject(Error('Não foi possível criar a imagem.')),'image/png'));}
function filename(){return `minha-voz-${state.campaign.id}-${state.format}${state.format==='carousel'?'-'+(state.slide+1):''}.png`;}
async function download(){try{const b=await canvasBlob(),url=URL.createObjectURL(b),a=document.createElement('a');a.href=url;a.download=filename();document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),10000);toast(state.format==='carousel'?`Página ${state.slide+1} baixada. Use as setas para baixar as outras páginas.`:'Card pronto! A imagem foi enviada para seus downloads.');}catch(e){toast(e.message);}}
function info(title,html){$('#info-title').textContent=title;$('#info-text').innerHTML=html;$('#info-dialog').showModal();}
hydrate();renderCategoryShortcuts();renderCatalog();initHero();
$$('[data-filter]').forEach(b=>b.onclick=()=>{filter=b.dataset.filter;$$('[data-filter]').forEach(e=>{e.classList.toggle('active',e===b);e.setAttribute('aria-pressed',String(e===b));});renderCatalog();});
$$('[data-nav]').forEach(b=>b.onclick=()=>{onlySaved=b.dataset.nav==='saved';$$('[data-nav]').forEach(e=>e.classList.toggle('active',e===b));$('#catalog-title').textContent=onlySaved?'Meus favoritos':'Modelos';renderCatalog();$('#campaigns').scrollIntoView({behavior:'smooth'});});
$('#search').oninput=e=>{query=e.target.value.toLocaleLowerCase('pt-BR');renderCatalog();};$('#reset-filters').onclick=()=>{filter='all';categoryFilter='all';try{localStorage.removeItem('minhavoz-category');}catch{}query='';onlySaved=false;renderCategoryShortcuts();$('#search').value='';$$('[data-filter]').forEach(b=>{b.classList.toggle('active',b.dataset.filter==='all');b.setAttribute('aria-pressed',String(b.dataset.filter==='all'));});$$('[data-nav]').forEach(b=>b.classList.toggle('active',b.dataset.nav==='home'));$('#catalog-title').textContent='Modelos';renderCatalog();};
$('#close-editor').onclick=closeEditor;$('#editor').addEventListener('close',()=>document.body.style.overflow='');$$('[data-step]').forEach(b=>b.onclick=()=>setStep(Number(b.dataset.step)));$('#to-photo').onclick=()=>setStep(2);$('#to-customize').onclick=()=>setStep(3);$('#skip-photo').onclick=()=>setStep(3);
$('#photo-input').onchange=uploadPhoto;$('#remove-photo').onclick=()=>{state.photoUploadRevision++;state.photo=null;resetPhotoTools(null);$('#upload-label').textContent='Escolher minha foto';$('#remove-photo').hidden=true;$('#photo-controls').hidden=true;renderPreview();};
[['photo-scale','scale'],['photo-x','x'],['photo-y','y'],['photo-rotation','rotation'],['text-size','textSize']].forEach(([id,key])=>$('#'+id).oninput=e=>{state[key]=Number(e.target.value);if(key==='rotation')$('#photo-angle').textContent=state.rotation+'°';renderPreview();});$('#photo-gray').onchange=e=>{state.gray=e.target.checked;renderPreview();};
$('#headline').oninput=e=>{state.text=e.target.value;$('#char-count').textContent=state.text.length+'/100';renderPreview();};$('#signature').oninput=e=>{state.signature=e.target.value;renderPreview();};$('#format').onchange=e=>{const image=state.aiCard;state.format=e.target.value;if(state.format==='carousel')ensureCarouselPages();if(typeof carryAICardToFormat==='function')carryAICardToFormat(image);renderPreview();};$('#font-style').onchange=e=>{state.font=e.target.value;renderPreview();};
function changeSlide(offset){setCurrentPage(state.slide+offset);}
$('#previous-slide').onclick=()=>changeSlide(-1);$('#next-slide').onclick=()=>changeSlide(1);
$('#add-slide').onclick=addCarouselPage;$('#remove-slide').onclick=removeCarouselPage;$('#carousel-photo-input').onchange=uploadCarouselPhotos;
$('#page-template').onchange=e=>selectCampaign(campaigns.find(c=>c.id===e.target.value));
$('#edit-page-photo').onclick=()=>setStep(2);
$('#text-color').oninput=e=>{state.textColor=e.target.value;state.textColorCustom=true;renderPreview();};$('#signature-color').oninput=e=>{state.signatureColor=e.target.value;state.signatureColorCustom=true;renderPreview();};$('#signature-plate').onchange=e=>{state.signaturePlate=e.target.checked;renderPreview();};
$('#background-mode').onchange=e=>{state.backgroundMode=e.target.value;state.backgroundUploadRevision++;syncBackgroundControls();renderPalette();renderPreview();};
$('#background-color').oninput=e=>{state.backgroundColor=e.target.value;state.backgroundMode='color';state.backgroundUploadRevision++;syncBackgroundControls();renderPalette();renderPreview();};
$('#background-input').onchange=async e=>{const page=activePage(),revision=++page.backgroundUploadRevision,file=e.target.files[0];try{const image=await loadUpload(file);if(!image||activePage()!==page||page.backgroundUploadRevision!==revision)return;state.background=image;state.backgroundMode='image';syncBackgroundControls();renderPalette();renderPreview();toast('Fundo adicionado a este post.');}catch(error){toast(error.message);}finally{e.target.value='';}};
$('#remove-background').onclick=()=>{state.backgroundUploadRevision++;state.background=null;state.backgroundMode='image';syncBackgroundControls();renderPalette();renderPreview();};$('#download-button').onclick=download;
$('#share-button').onclick=async()=>{try{const file=new File([await canvasBlob()],filename(),{type:'image/png'});if(navigator.canShare?.({files:[file]})){await navigator.share({files:[file],title:'Minha Voz',text:'Crie a sua versão com o Minha Voz.'});}else{await download();}}catch(e){if(e.name!=='AbortError')toast('O compartilhamento não está disponível. Use “Baixar meu card”.');}};
$('#help-button').onclick=()=>info('Sua ideia em três passos.','<p><b>1.</b> Filtre por Fotos, Banners ou Montagens e escolha uma categoria e um modelo.</p><p><b>2.</b> Envie sua foto e ajuste a moldura.</p><p><b>3.</b> Edite a mensagem, escolha o formato e baixe o PNG.</p><p>Este protótipo já exporta cards. Recorte de pessoas e acabamento natural estão disponíveis no passo Sua foto. A geração com Gemini depende do servidor configurado.</p>');
$('#about-button').onclick=()=>info('Sua voz, em cada momento.','<p>Explore Fotos, Banners e Montagens. As categorias reúnem temas como Família, Meu Bebê, causas, Esportes, Viagens e Pets.</p><p>Cards, stories e carrosséis ajudam você a contar o que importa. Você pode personalizar cada post e usar o Gemini para editar a composição atual.</p>');
$('#privacy-button').onclick=()=>info('Suas fotos ficam com você.','<p>O recorte e os ajustes locais processam imagens no navegador. Ao autorizar e tocar em Editar card com Gemini, suas instruções e o card completo da prévia, incluindo fotos, textos e logotipos, são enviados ao Google pelo servidor. O aplicativo não grava esses arquivos em disco; o provedor segue os termos do projeto Gemini configurado.</p><p>Só os identificadores dos modelos favoritos ficam salvos neste navegador. A exportação e o compartilhamento dependem do seu toque.</p><p>Em Meu Bebê, as instruções pedem que a IA preserve a aparência da criança e ajuste apenas cenário e decoração. Confira o resultado antes de usar. Compartilhe imagens de crianças apenas com a autorização dos responsáveis e evite nomes completos, localização e outros dados pessoais.</p>');$('#close-info').onclick=()=>$('#info-dialog').close();$('#info-ok').onclick=()=>$('#info-dialog').close();

function logoRect(w,h,imageWidth,imageHeight,size,position){
 const pad=Math.min(w,h)*.04,maxW=w*size/100,maxH=h*.2,ratio=Math.min(maxW/imageWidth,maxH/imageHeight),lw=imageWidth*ratio,lh=imageHeight*ratio;
 return {x:position.endsWith('right')?w-pad-lw:pad,y:position.startsWith('bottom')?h-pad-lh:pad,width:lw,height:lh,pad};
}
function drawLogo(ctx,w,h,opts){if(!opts.logo)return;const r=logoRect(w,h,opts.logo.width,opts.logo.height,opts.logoSize||20,opts.logoPosition||'bottom-right');ctx.save();ctx.globalAlpha=(opts.logoOpacity??100)/100;if(opts.logoPlate){ctx.fillStyle='#fff';rounded(ctx,r.x-r.pad*.2,r.y-r.pad*.2,r.width+r.pad*.4,r.height+r.pad*.4,r.pad*.15);ctx.fill();}ctx.drawImage(opts.logo,r.x,r.y,r.width,r.height);ctx.restore();}
let logoRevision=0;
$('#logo-input').onchange=async e=>{const page=activePage(),revision=++logoRevision;try{const img=await loadUpload(e.target.files[0]);if(!img||revision!==logoRevision||activePage()!==page)return;state.logo=img;resetLogoTools(img);$('#logo-controls').hidden=false;renderPreview();toast('Logotipo adicionado. Ajuste o tamanho e a posição.');}catch(err){toast(err.message);}finally{e.target.value='';}};
$('#remove-logo').onclick=()=>{logoRevision++;state.logo=null;resetLogoTools(null);$('#logo-controls').hidden=true;renderPreview();};
[['logo-size','logoSize'],['logo-opacity','logoOpacity']].forEach(([id,key])=>$('#'+id).oninput=e=>{state[key]=Number(e.target.value);if(key==='rotation')$('#photo-angle').textContent=state.rotation+'°';renderPreview();});
$('#logo-position').onchange=e=>{state.logoPosition=e.target.value;renderPreview();};$('#logo-plate').onchange=e=>{state.logoPlate=e.target.checked;renderPreview();};
$('#ai-prompt').oninput=e=>{state.aiPrompt=e.target.value;$('#prompt-count').textContent=state.aiPrompt.length+'/1500';};
$('#download-prompt').onclick=()=>{if(!state.aiPrompt.trim()){toast('Escreva as instruções antes de baixar.');return;}const content='MINHA VOZ — INSTRUÇÕES PARA IA\nModelo: '+state.campaign.name+'\nFormato: '+state.format+'\nTexto do card: '+state.text+'\nLogotipo: '+(state.logo?'preservar o logotipo presente no card, salvo alteração solicitada':'sem logotipo')+'\n\nInstruções adicionais:\n'+state.aiPrompt+'\n\nEste arquivo contém as instruções atuais; o card completo e estas instruções são enviados somente pelo botão Editar card com Gemini.';const url=URL.createObjectURL(new Blob([content],{type:'text/plain;charset=utf-8'})),a=document.createElement('a');a.href=url;a.download='minha-voz-instrucoes.txt';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),10000);toast('Instruções enviadas para seus downloads.');};


// The banner previews real templates and opens the matching editor.
function initHero(){
 const hero=$('.hero'),card=$('#hero-preview'),canvas=$('#hero-canvas');
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 // One model per category, taken from the current catalog rather than old IDs.
 const slides=[...new Map(campaigns.map(c=>[c.category,c])).values()];
 let index=Math.max(0,slides.findIndex(c=>c.category==='Amor')),current=slides[index];
 const examples={'Amor':'casal','Mulheres':'mulher','Conquistas':'homem'};
 const exampleImages={};
 Object.entries(examples).forEach(([category,name])=>{
  const img=new Image();exampleImages[category]=img;
  img.onload=()=>{if(current.category===category&&heroRenderer)heroRenderer();};
  img.src='/assets/hero-people/'+name+'.webp';
 });
 let timer,progress,transition,frame,paused=reduced.matches,hovered=false,focused=false,inView=true;
 const poses=[[-14,-8,-8],[18,4,7],[-8,12,-4],[14,-12,10]];
 const pauseButton=$('#hero-pause');
 icons.pause='<path d="M9 5v14M15 5v14"/>';
 icons.play='<path d="m9 5 10 7-10 7V5Z"/>';
 function select(next,animate=true){
  index=(next+slides.length)%slides.length;current=slides[index];
  const c=current,p=palettes[c.color],pose=poses[index%poses.length];
  heroBackgroundUrl=c.backgroundUrl;heroRenderer=()=>{const photo=exampleImages[current.category];drawCard(canvas,current,photo?.complete&&photo.naturalWidth?{photo,cutout:true}:{});};heroRenderer();
  canvas.setAttribute('aria-label','Prévia do modelo: '+c.name);
  card.setAttribute('aria-label','Personalizar modelo de '+c.category);
  $('#hero-theme').textContent=c.category;
  $('#hero-caption').textContent=String(index+1).padStart(2,'0')+' / '+String(slides.length).padStart(2,'0');
  hero.style.setProperty('--hero-accent',p.accent);
  hero.style.setProperty('--hero-x',pose[0]+'px');hero.style.setProperty('--hero-y',pose[1]+'px');
  hero.style.setProperty('--hero-angle',pose[2]+'deg');
  transition?.cancel();
  if(animate&&!reduced.matches)transition=canvas.animate([
   {opacity:0,transform:'translateY(36px) scale(.92) rotate(-5deg)'},
   {opacity:1,transform:'translateY(-5px) scale(1.015) rotate(1deg)',offset:.7},
   {opacity:1,transform:'translateY(0) scale(1) rotate(0)'}
  ],{duration:700,easing:'cubic-bezier(.2,.7,.2,1)'});
 }
 function sync(){
  clearTimeout(timer);progress?.cancel();
  const running=!paused&&!hovered&&!focused&&inView&&!document.hidden&&!$('#editor').open;
  hero.classList.toggle('hero-running',running&&!reduced.matches);
  pauseButton.setAttribute('aria-pressed',String(paused));
  pauseButton.setAttribute('aria-label',paused?'Retomar troca automática':'Pausar troca automática');
  pauseButton.innerHTML=icon(paused?'play':'pause');
  if(!running)return;
  if(!reduced.matches)progress=$('.hero-progress>span').animate([{transform:'scaleX(0)'},{transform:'scaleX(1)'}],{duration:3000,fill:'forwards'});
  timer=setTimeout(()=>{select(index+1);sync();},3000);
 }
 function navigate(offset){select(index+offset);sync();}
 $('#hero-previous').onclick=()=>navigate(-1);$('#hero-next').onclick=()=>navigate(1);
 pauseButton.onclick=()=>{paused=!paused;sync();};
 $('#hero-cta').onclick=card.onclick=()=>{openEditor(current);sync();};
 hero.addEventListener('pointerenter',e=>{if(e.pointerType==='mouse'){hovered=true;sync();}});
 hero.addEventListener('pointerleave',()=>{hovered=false;sync();});
 hero.addEventListener('focusin',()=>{focused=true;sync();});
 hero.addEventListener('focusout',e=>{if(!hero.contains(e.relatedTarget)){focused=false;sync();}});
 document.addEventListener('visibilitychange',sync);$('#editor').addEventListener('close',sync);
 reduced.addEventListener('change',e=>{paused=e.matches;transition?.cancel();sync();});
 if('IntersectionObserver' in window)new IntersectionObserver(entries=>{inView=entries[0].isIntersecting;sync();},{threshold:.15}).observe(hero);
 card.addEventListener('pointermove',e=>{
  if(reduced.matches||e.pointerType!=='mouse')return;
  const r=card.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;
  cancelAnimationFrame(frame);frame=requestAnimationFrame(()=>{card.style.setProperty('--tilt-x',(-y*13)+'deg');card.style.setProperty('--tilt-y',(x*13)+'deg');});
 });
 card.addEventListener('pointerleave',()=>{cancelAnimationFrame(frame);card.style.setProperty('--tilt-x','0deg');card.style.setProperty('--tilt-y','0deg');});
 select(index,false);sync();
}


$('#reset-photo-rotation').onclick=()=>{state.rotation=0;$('#photo-rotation').value=0;$('#photo-angle').textContent='0°';renderPreview();};
