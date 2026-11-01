'use strict';
// Separate circular composition; the existing square profile format is unchanged.
function instagramLogoRect(w,h,iw,ih,size,position){
 const maxW=w*Math.min(18,size)/100,maxH=h*.12,scale=Math.min(maxW/iw,maxH/ih);
 const width=iw*scale,height=ih*scale;
 return {x:position.endsWith('right')?w*.80-width:w*.20,y:position.startsWith('bottom')?h*.72-height:h*.20,width,height};
}
function drawInstagramProfile(canvas,c,opts){
 const ctx=canvas.getContext('2d'),w=canvas.width,h=canvas.height,p=palettes[opts.palette??c.color],r=Math.min(w,h)*.49;
 ctx.clearRect(0,0,w,h);ctx.save();ctx.beginPath();ctx.arc(w/2,h/2,r,0,Math.PI*2);ctx.clip();
 drawCardBackground(ctx,w,h,c,opts);
 if(opts.photo){
  const zoom=(opts.scale||100)/100,dx=w*(opts.x||0)/200,dy=h*(opts.y||0)/200;
  ctx.save();if(opts.gray)ctx.filter='grayscale(1)';
  if(opts.cutout){
   const fit=Math.min(w*.76/opts.photo.width,h*.72/opts.photo.height)*zoom;
   ctx.drawImage(opts.photo,(w-opts.photo.width*fit)/2+dx,h*.49-opts.photo.height*fit/2+dy,opts.photo.width*fit,opts.photo.height*fit);
  }else{
   ctx.beginPath();ctx.arc(w*.5,h*.45,w*.305,0,Math.PI*2);ctx.clip();
   drawCover(ctx,opts.photo,w*.195+dx-w*.61*(zoom-1)/2,h*.145+dy-h*.61*(zoom-1)/2,w*.61*zoom,h*.61*zoom);
  }
  ctx.restore();
 }
 const shadeColor=colorLuminance(opts.textColor||c.textColor||'#ffffff')>.5?'#102c22':'#fffefa';
 const shade=ctx.createLinearGradient(0,h*.66,0,h*.96);shade.addColorStop(0,shadeColor+'00');shade.addColorStop(.45,shadeColor+'dd');shade.addColorStop(1,shadeColor+'f5');ctx.fillStyle=shade;ctx.fillRect(0,h*.66,w,h*.34);
 const text=opts.text??c.text,maxWidth=w*.52;
 let fontSize=w*.052*(opts.textSize||100)/100,lines;
 do{ctx.font=(opts.font==='bold'?'700 ':'')+fontSize+'px '+(opts.font==='bold'?'Arial':'Georgia');lines=wrap(ctx,text,maxWidth);if(lines.length<=3)break;fontSize-=w*.002;}while(fontSize>w*.020);
 lines=lines.slice(0,3);ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle=opts.textColor||c.textColor||'#fff8e6';
 const top=h*.79;
 lines.forEach((line,i)=>ctx.fillText(line,w*.5,top+i*fontSize*1.08,maxWidth));
 if(opts.signature)drawSignature(ctx,w,h,opts,{x:w*.5,y:h*.936,center:true,maxWidth:w*.36,size:w*.021});
 if(opts.logo){
  const box=instagramLogoRect(w,h,opts.logo.width,opts.logo.height,opts.logoSize||20,opts.logoPosition||'bottom-right');
  ctx.save();ctx.globalAlpha=(opts.logoOpacity??100)/100;
  if(opts.logoPlate){ctx.fillStyle='#fff';const pad=w*.008;rounded(ctx,box.x-pad,box.y-pad,box.width+pad*2,box.height+pad*2,w*.01);ctx.fill();}
  ctx.drawImage(opts.logo,box.x,box.y,box.width,box.height);ctx.restore();
 }
 ctx.strokeStyle=p.accent;ctx.lineWidth=w*.018;ctx.beginPath();ctx.arc(w/2,h/2,r-w*.018,0,Math.PI*2);ctx.stroke();ctx.restore();
}
