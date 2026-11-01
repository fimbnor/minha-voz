'use strict';
let logoFrame;
function resetLogoTools(image){
 state.logoOriginal=image;state.logoHasCutout=false;state.logoSettings={color:'#ffffff',tolerance:12};
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
 if(!state.logoOriginal)return;
 const canvas=photoCanvas(state.logoOriginal,1600),ctx=canvas.getContext('2d'),pixels=ctx.getImageData(0,0,canvas.width,canvas.height);
 state.logoSettings={color:$('#logo-bg-color').value,tolerance:Number($('#logo-bg-tolerance').value)};
 const hex=state.logoSettings.color,color=[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16));
 const removed=removeConnectedLogoBackground(pixels,color,Number($('#logo-bg-tolerance').value));
 if(!removed){state.logo=state.logoOriginal;renderPreview();$('#logo-bg-status').textContent='Nenhum fundo dessa cor foi encontrado nas bordas. Escolha a cor do fundo ou ajuste a tolerância.';return;}
 ctx.putImageData(pixels,0,0);state.logo=canvas;state.logoHasCutout=true;$('#restore-logo').hidden=false;
 $('#logo-bg-status').textContent='Fundo removido. Confira letras e bordas; ajuste a tolerância ou restaure o original.';
 renderPreview();
}
$('#remove-logo-bg').onclick=async()=>{
 if(!state.logoOriginal)return;
 const button=$('#remove-logo-bg'),revision=logoRevision;
 button.disabled=true;button.textContent='Removendo fundo…';
 try{await new Promise(r=>requestAnimationFrame(r));if(revision===logoRevision)applyLogoCutout();}
 catch{$('#logo-bg-status').textContent='Não foi possível remover o fundo. O logotipo original continua disponível.';}
 finally{button.disabled=false;button.textContent='Remover fundo do logotipo';}
};
for(const id of ['logo-bg-color','logo-bg-tolerance'])$('#'+id).addEventListener('input',()=>{
 if(!state.logoHasCutout)return;cancelAnimationFrame(logoFrame);
 const revision=logoRevision;logoFrame=requestAnimationFrame(()=>{if(revision===logoRevision)applyLogoCutout();});
});
$('#restore-logo').onclick=()=>{if(!state.logoOriginal)return;logoRevision++;state.logo=state.logoOriginal;state.logoHasCutout=false;$('#restore-logo').hidden=true;$('#logo-bg-status').textContent='Logotipo original restaurado.';renderPreview();};

function restoreLogoTools(){
 logoRevision++;cancelAnimationFrame(logoFrame);
 $('#logo-bg-color').value=state.logoSettings.color;$('#logo-bg-tolerance').value=state.logoSettings.tolerance;
 $('#restore-logo').hidden=!state.logoHasCutout;$('#logo-bg-status').textContent=state.logoOriginal?'Logotipo deste post. Confira as bordas.':'';
}
