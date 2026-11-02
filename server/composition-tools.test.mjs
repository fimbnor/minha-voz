import test from 'node:test';
import assert from 'node:assert/strict';
test('restored montages draw and export without loading an image, including circular profiles',async()=>{
 const e=await frontend(),originals=e.campaigns.filter(c=>c.nativeScene);
 assert.equal(originals.length,12);
 assert(originals.every(c=>c.imageStyle==='montage'));
 assert.equal(new Set(e.campaigns.map(c=>c.id)).size,e.campaigns.length);
 assert.equal(e.$('#all-count').textContent,e.campaigns.length);
 for(const c of originals){
  e.context.openEditor(c);
  assert(e.drawCalls().some(call=>call.op==='ellipse')); // Original illustrated background, rather than the image-loading placeholder.
  assert(!e.images.some(image=>image.src===undefined));
  await e.context.canvasBlob();
  e.change('#format','instagram-profile');
  assert(e.drawCalls().some(call=>call.op==='clip'));
  await e.context.canvasBlob();
 }
 e.input('#background-color','#123456');
 assert(e.drawCalls().some(call=>call.op==='fillRect'&&call.color==='#123456'));
});
import {frontend} from './frontend-harness.mjs';

test('category menus contain one entry per category and each entry has a real icon',async()=>{
 const e=await frontend();e.open();
 const categories=e.$('#editor-campaign-list').children;
 assert.equal(categories.length,new Set(e.campaigns.map(c=>c.category)).size);
 assert.equal(new Set(categories.map(c=>c.innerHTML)).size,categories.length);
 for(const category of categories)assert.match(category.innerHTML,/<svg/);
 assert.equal(e.$('#category-shortcuts').children.length,categories.length+1);
 assert(e.$('#editor-template-list').children.every(c=>e.campaigns.some(model=>c.innerHTML.includes(model.name))));
});
test('style filters use Fotos, Banners and Montagens and combine with unique categories',async()=>{
 const e=await frontend();const filters=e.selectors.get('[data-filter]');
 assert.deepEqual(filters.map(b=>b.dataset.filter),['all','photo','banner','montage']);
 for(const style of ['photo','banner','montage']){
  filters.find(b=>b.dataset.filter===style).onclick();
  const visible=e.$('#campaign-grid').children;assert.equal(visible.length,e.campaigns.filter(c=>c.imageStyle===style).length);assert(visible.length>0);
 }
 filters.find(b=>b.dataset.filter==='photo').onclick();
 e.$('#category-shortcuts').children.find(b=>b.dataset.topic==='Viagens').onclick();assert.equal(e.$('#campaign-grid').children.length,2);
 e.$('#reset-filters').onclick();assert.equal(e.$('#campaign-grid').children.length,e.campaigns.length);
});
test('palette and custom solid color replace image backgrounds without changing text or signature colors',async()=>{
 const e=await frontend();e.open(1);e.finishBackground(e.state.campaign);
 const textColor=e.state.textColor,signatureColor=e.state.signatureColor;
 e.context.chooseBaseColor('#b96d5a',{preserveColors:true});assert.equal(e.state.backgroundMode,'color');assert.equal(e.state.backgroundColor,'#b96d5a');
 assert.equal(e.state.textColor,textColor);assert.equal(e.state.signatureColor,signatureColor);
 assert(e.drawCalls().some(c=>c.op==='fillRect'&&c.color==='#b96d5a'));assert(!e.drawCalls().some(c=>c.op==='drawImage'));
 e.input('#background-color','#123456');assert(e.drawCalls().some(c=>c.op==='fillRect'&&c.color==='#123456'));
 e.$('#remove-background').onclick();assert.equal(e.state.backgroundMode,'image');assert(e.drawCalls().some(c=>c.op==='drawImage'));
});
test('photo format exposes the chosen solid background behind the uploaded photo',async()=>{
 const e=await frontend();e.open(0);e.change('#format','photo');const image={width:200,height:200};e.context.setPagePhoto(e.context.activePage(),image);e.context.chooseBaseColor('#e7c746',{preserveColors:true});
 const calls=e.drawCalls();assert(calls.some(c=>c.op==='fillRect'&&c.color==='#e7c746'));assert(calls.some(c=>c.op==='drawImage'&&c.args[0]===image));
 assert(calls.some(c=>c.op==='rotate')); // A framed photo leaves the selected background visible.
});
test('late catalog loads never replace the selected model or draw an old procedural scene',async()=>{
 const e=await frontend();e.open(0);const first=e.state.campaign;e.context.selectCampaign(e.campaigns[1]);const second=e.state.campaign;
 const count=e.$('#preview-canvas').calls.length;e.finishBackground(first);
 assert.equal(e.state.campaign,second);assert.equal(e.$('#preview-canvas').calls.length,count);
 assert(e.drawCalls().some(c=>c.op==='fillRect'&&c.color==='#edf0e5'));
 e.finishBackground(second);const selected=e.images.find(i=>i.src===second.backgroundUrl);
 assert(e.drawCalls().some(c=>c.op==='drawImage'&&c.args[0]===selected));
 assert(!e.drawCalls().some(c=>c.op==='drawImage'&&c.args[0].src===first.backgroundUrl));
});
test('signature color and contrast backing apply to both rectangular and circular exports',async()=>{
 const e=await frontend();e.open(1);e.input('#signature','@minhavoz');e.input('#signature-color','#ffffff');
 assert(e.drawCalls().some(c=>c.op==='fillText'&&c.args[0]==='@minhavoz'&&c.color==='#ffffff'));
 assert(e.drawCalls().some(c=>c.op==='fill'&&c.color==='#102c22e8'));
 e.input('#signature-color','#102030');e.change('#format','instagram-profile');
 assert(e.drawCalls().some(c=>c.op==='fillText'&&c.args[0]==='@minhavoz'&&c.color==='#102030'));assert(e.drawCalls().some(c=>c.op==='fill'&&c.color==='#fffefaed'));e.context.selectCampaign(e.campaigns[5]);assert.equal(e.state.signatureColor,'#102030');
});
test('circular profile uses the same selected catalog or uploaded background',async()=>{
 const e=await frontend();e.open(1);e.finishBackground(e.state.campaign);const image=e.images.find(i=>i.src===e.state.campaign.backgroundUrl);
 e.change('#format','instagram-profile');assert(e.drawCalls().some(c=>c.op==='drawImage'&&c.args[0]===image));
 const uploaded={width:400,height:400};e.state.background=uploaded;e.context.renderPreview();assert(e.drawCalls().some(c=>c.op==='drawImage'&&c.args[0]===uploaded));
 assert(!e.drawCalls().some(c=>c.op==='drawImage'&&c.args[0]===image));
});
test('switching to a circular format carries the current approved AI image instead of an older result',async()=>{
 const e=await frontend();e.open(1);const image={width:1080,height:1350};e.context.carryAICardToFormat(image);e.context.renderPreview();
 e.change('#format','instagram-profile');assert.equal(e.state.aiCard,image);assert(e.drawCalls().some(c=>c.op==='drawImage'&&c.args[0]===image));
});
test('carousel posts keep independent photos, source photos, masks, backgrounds, texts, colors and logos',async()=>{
 const e=await frontend();e.open(1);e.change('#format','carousel');
 e.context.navigateCreation(2);
 const photoA={width:2,height:2,name:'A'},photoB={width:2,height:2,name:'B'};
 e.context.setPagePhoto(e.context.activePage(),photoA);e.input('#signature','@post1');e.input('#signature-color','#ff0000');e.input('#background-color','#001122');e.state.photoMask={name:'mask A'};e.state.logo={name:'logo A'};e.state.photoSettings.exposure=15;e.state.text='Post A';
 e.context.setCurrentPage(1);e.context.setPagePhoto(e.context.activePage(),photoB);e.input('#signature','@post2');e.input('#background-color','#334455');e.state.text='Post B';
 e.context.setCurrentPage(0);assert.equal(e.state.photo,photoA);assert.equal(e.state.photoOriginal,photoA);assert.equal(e.state.photoMask.name,'mask A');assert.equal(e.state.signature,'@post1');assert.equal(e.state.signatureColor,'#ff0000');assert.equal(e.state.backgroundColor,'#001122');assert.equal(e.state.logo.name,'logo A');assert.equal(e.state.text,'Post A');assert.equal(e.$('#exposure').value,15);
 e.context.setCurrentPage(1);assert.equal(e.state.photo,photoB);assert.equal(e.state.photoOriginal,photoB);assert.equal(e.state.photoMask,null);assert.equal(e.state.signature,'@post2');assert.equal(e.state.backgroundColor,'#334455');assert.equal(e.state.logo,null);assert.equal(e.state.text,'Post B');
});
test('a carousel accepts multiple photos and lets each post choose a different catalog image',async()=>{
 const e=await frontend();e.open(1);e.change('#format','carousel');e.context.navigateCreation(2);e.setUpload(async file=>({width:2,height:2,name:file.name}));
 await e.upload('#carousel-photo-input',[{name:'one'},{name:'two'},{name:'three'},{name:'four'}]);
 assert.equal(e.state.pages.length,4);assert.deepEqual(Array.from(e.state.pages,p=>p.photo.name),['one','two','three','four']);
 e.context.setCurrentPage(2);e.change('#page-template',e.campaigns[8].id);assert.equal(e.state.pages[2].campaign,e.campaigns[8]);assert.equal(e.state.pages[0].campaign,e.campaigns[1]);
});
test('carousel insertion/removal keeps page identities stable and enforces the ten post limit',async()=>{
 const e=await frontend();e.open(1);e.change('#format','carousel');const first=e.state.pageId;
 for(let i=0;i<12;i++)e.context.addCarouselPage();assert.equal(e.state.pages.length,10);assert.equal(e.$('#add-slide').disabled,true);
 e.context.setCurrentPage(1);const last=e.state.pages.at(-1);e.context.removeCarouselPage();assert.equal(e.state.pages[0].id,first);assert.equal(e.state.pages.at(-1),last);
 while(e.state.pages.length>2)e.context.removeCarouselPage();e.change('#format','feed');e.change('#format','carousel');assert.equal(e.state.pages.length,2);
});
test('out-of-order photo uploads and page changes discard obsolete results',async()=>{
 const e=await frontend();e.open(1);let finishA,finishB;e.setUpload(file=>new Promise(resolve=>{if(file.name==='A')finishA=resolve;else finishB=resolve;}));
 const a=e.upload('#photo-input',[{name:'A'}]),b=e.upload('#photo-input',[{name:'B'}]);finishB({name:'B'});await b;finishA({name:'A'});await a;assert.equal(e.state.photo.name,'B');
 e.change('#format','carousel');const pending=e.upload('#photo-input',[{name:'A'}]);e.context.setCurrentPage(1);finishA({name:'stale'});await pending;assert.equal(e.state.photo,null);assert.equal(e.state.pages[0].photo.name,'B');
});
test('a late uploaded background cannot override a newer color or a different model',async()=>{
 const e=await frontend();e.open(1);let finish;e.setUpload(()=>new Promise(resolve=>finish=resolve));
 const pending=e.upload('#background-input',[{}]);e.input('#background-color','#aabbcc');finish({name:'obsolete'});await pending;assert.equal(e.state.background,null);assert.equal(e.state.backgroundColor,'#aabbcc');
 const again=e.upload('#background-input',[{}]);e.context.selectCampaign(e.campaigns[2]);finish({name:'obsolete'});await again;assert.equal(e.state.background,null);assert.equal(e.state.campaign,e.campaigns[2]);
});
test('export waits for the actual selected background and refuses a post change during loading',async()=>{
 const e=await frontend();e.open(1);const pending=e.context.canvasBlob();await Promise.resolve();let finished=false;pending.then(()=>finished=true);await new Promise(r=>setImmediate(r));assert.equal(finished,false);
 e.finishBackground(e.state.campaign);await pending;assert.equal(finished,true);
 e.open(2);const next=e.context.canvasBlob();await new Promise(r=>setImmediate(r));const previous=e.state.campaign;e.context.openEditor(e.campaigns[3]);e.finishBackground(previous);await assert.rejects(next,/post mudou/);
});

test('a personal photo composes over the selected model even in the photo format',async()=>{
 const e=await frontend();e.open(0);e.finishBackground(e.state.campaign);
 const photo={width:500,height:500};e.change('#format','photo');e.context.setPagePhoto(e.context.activePage(),photo);e.context.renderPreview();
 const photoDraw=e.drawCalls().find(c=>c.op==='drawImage'&&c.args[0]===photo);
 assert(photoDraw);assert(photoDraw.args.at(-2)<e.$('#preview-canvas').width);
 assert(e.drawCalls().some(c=>c.op==='drawImage'&&c.args[0]!==photo));
 assert.equal(e.state.backgroundMode,'image');
});
