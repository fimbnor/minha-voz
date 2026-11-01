'use strict';
let originalLogo=null,logoHasCutout=false,logoFrame;
function resetLogoTools(image){
 originalLogo=image;logoHasCutout=false;
 $('#logo-bg-tolerance').value=12;$('#logo-bg-color').value='#ffffff';
 $('#logo-bg-status').textContent=image?'Para fundo branco ou de cor uniforme: escolha a cor e remova. Confira os detalhes da marca.':'';
 $('#restore-logo').hidden=true;
}
function removeConnectedLogoBackground(pixels,color,tolerance){
 const {width,height,data}=pixels,n=width*height,seen=new Uint8Array(n),queue=new Int32Array(n);
 const threshold=tolerance*441.673/100,soft=12;
 let head=0,tail=0,removed=0;
 function distance(i){const p=i*4;return Math.hypot(data[p]-color[0],data[p+1]-color[1],data[p+2]-color[2]);}
 function visit(i){if(seen[i])return;seen[i]=1;if(data[i*4+3]===0||distance(i)<=threshold+soft)queue[tail++]=i;}
 for(let x=0;x<width;x++){visit(x);visit((height-1)*width+x);}
 for(let y=0;y<height;y++){visit(y*width);visit(y*width+width-1);}
 while(head<tail){
  const i=queue[head++],a=i*4+3,alpha=data[a];
  if(alpha){const factor=Math.max(0,Math.min(1,(distance(i)-threshold)/soft));data[a]=Math.round(alpha*factor);if(data[a]<alpha)removed++;}
  const x=i%width;if(x)visit(i-1);if(x<width-1)visit(i+1);if(i>=width)visit(i-width);if(i<n-width)visit(i+width);
 }
 return removed;
}
function applyLogoCutout(){
 if(!originalLogo)return;
 const canvas=photoCanvas(originalLogo,1600),ctx=canvas.getContext('2d'),pixels=ctx.getImageData(0,0,canvas.width,canvas.height);
 const hex=$('#logo-bg-color').value,color=[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16));
 const removed=removeConnectedLogoBackground(pixels,color,Number($('#logo-bg-tolerance').value));
 if(!removed){state.logo=originalLogo;renderPreview();$('#logo-bg-status').textContent='Nenhum fundo dessa cor foi encontrado nas bordas. Escolha a cor do fundo ou ajuste a tolerância.';return;}
 ctx.putImageData(pixels,0,0);state.logo=canvas;logoHasCutout=true;$('#restore-logo').hidden=false;
 $('#logo-bg-status').textContent='Fundo removido. Confira letras e bordas; ajuste a tolerância ou restaure o original.';
 renderPreview();
}
$('#remove-logo-bg').onclick=async()=>{
 if(!originalLogo)return;
 const button=$('#remove-logo-bg'),revision=logoRevision;
 button.disabled=true;button.textContent='Removendo fundo…';
 try{await new Promise(r=>requestAnimationFrame(r));if(revision===logoRevision)applyLogoCutout();}
 catch{$('#logo-bg-status').textContent='Não foi possível remover o fundo. O logotipo original continua disponível.';}
 finally{button.disabled=false;button.textContent='Remover fundo do logotipo';}
};
for(const id of ['logo-bg-color','logo-bg-tolerance'])$('#'+id).addEventListener('input',()=>{
 if(!logoHasCutout)return;cancelAnimationFrame(logoFrame);
 const revision=logoRevision;logoFrame=requestAnimationFrame(()=>{if(revision===logoRevision)applyLogoCutout();});
});
$('#restore-logo').onclick=()=>{if(!originalLogo)return;state.logo=originalLogo;logoHasCutout=false;$('#restore-logo').hidden=true;$('#logo-bg-status').textContent='Logotipo original restaurado.';renderPreview();};
