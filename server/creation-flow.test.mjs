import test from 'node:test';
import assert from 'node:assert/strict';
import {frontend} from './frontend-harness.mjs';

test('creation starts with format and advances through model, photo, customization and export',async()=>{
 const e=await frontend();e.$('#start-creation').onclick();
 assert.equal(e.state.step,0);assert.equal(e.$('#flow-back').hidden,true);
 e.change('#format','story');
 for(const step of [1,2,3,6,4]){
  e.$('#flow-next').onclick();assert.equal(e.state.step,step);
  const visible=e.selectors.get('[data-panel]').filter(p=>!p.hidden);
  assert.equal(visible.length,1);assert.equal(Number(visible[0].dataset.panel),step);
 }
 assert.equal(e.$('#flow-next').hidden,true);assert.match(e.$('#export-summary').textContent,/Story/);
 assert.equal(e.$('#preview-canvas').height,1920);
 for(const step of [6,3,2,1,0]){e.$('#flow-back').onclick();assert.equal(e.state.step,step);}
 assert.equal(e.state.format,'story');
});

test('back and next retain photo, text, signature, background and chosen template',async()=>{
 const e=await frontend();e.open();const photo={width:500,height:500};
 e.context.setPagePhoto(e.context.activePage(),photo);
 e.input('#headline','Minha mensagem');e.input('#signature','@meuperfil');e.change('#background-color','#123456');
 const before={photo:e.state.photo,text:e.state.text,signature:e.state.signature,background:e.state.backgroundColor,campaign:e.state.campaign.id};
 for(const step of [1,2,3,4,3,2,1,0,1,2,3])e.context.navigateCreation(step);
 e.context.selectCampaign(e.state.campaign);
 assert.equal(e.state.photo,before.photo);assert.equal(e.state.text,before.text);assert.equal(e.state.signature,before.signature);assert.equal(e.state.backgroundColor,before.background);assert.equal(e.state.campaign.id,before.campaign);
 e.context.selectCampaign(e.campaigns[1]);assert.equal(e.state.photo,photo);assert.equal(e.state.text,'Minha mensagem');
});

test('photo step exposes the AI editor without sending or accepting an edit',async()=>{
 const e=await frontend();e.open();e.context.navigateCreation(2);
 e.input('#headline','Texto preservado');
 e.$('#photo-to-ai').onclick();
 assert.equal(e.state.step,6);assert.equal(e.$('#ai-edit-options').open,true);
 assert.equal(e.state.text,'Texto preservado');assert.equal(e.state.aiCard,null);
 assert.equal(e.$('#ai-consent').checked,false);
});

test('carousel and circular profile retain independent pages across format and step changes',async()=>{
 const e=await frontend();e.open();e.change('#format','carousel');
 e.input('#headline','Primeiro post');e.context.setCurrentPage(1);e.input('#headline','Segundo post');
 const pages=e.state.pages,ids=pages.map(p=>p.id);
 for(const step of [2,3,4,3,2,1,0])e.context.navigateCreation(step);
 e.change('#format','instagram-profile');assert.equal(e.$('#preview-canvas').width,1080);assert.equal(e.$('#preview-canvas').height,1080);
 assert(e.$('#preview-canvas').classes.has('circular-profile'));
 e.change('#format','carousel');assert.equal(e.state.pages,pages);assert.deepEqual(e.state.pages.map(p=>p.id),ids);
 assert.equal(pages[0].text,'Primeiro post');assert.equal(pages[1].text,'Segundo post');
 e.context.navigateCreation(4);assert.equal(e.$('#carousel-export-note').hidden,false);
});

test('projects saved at format or at legacy customization resume their correct step',async()=>{
 const e=await frontend();e.open();const saved={...e.state.pages[0],campaignId:e.state.campaign.id};delete saved.campaign;
 for(const step of [0,3,4]){
  await e.context.restoreProject({version:1,id:'test',pages:[saved],format:'story',step,edits:[]});
  assert.equal(e.state.step,step);assert.equal(e.state.format,'story');assert.equal(e.$('#editor').open,true);
 }
});

test('initial carousel model choice applies to all starter posts, later choices only affect the current post',async()=>{
 const e=await frontend();e.open();e.change('#format','carousel');e.context.navigateCreation(1);
 e.context.selectCampaign(e.campaigns[1]);assert(e.state.pages.every(p=>p.campaign.id===e.campaigns[1].id));
 e.context.navigateCreation(2);e.context.navigateCreation(1);e.context.selectCampaign(e.campaigns[2]);
 assert.equal(e.state.pages[0].campaign.id,e.campaigns[2].id);assert.equal(e.state.pages[1].campaign.id,e.campaigns[1].id);
});

test('starting without a model replaces illustrated art with white and keeps user layers',async()=>{
 const e=await frontend();e.open();e.context.navigateCreation(1);
 const photo={width:500,height:500};e.context.setPagePhoto(e.context.activePage(),photo);
 e.input('#headline','Minha mensagem');e.input('#signature','Minha assinatura');
 e.$('#base-blank').onclick();
 assert.equal(e.state.backgroundMode,'color');assert.equal(e.state.backgroundColor,'#ffffff');
 assert.equal(e.state.background,null);assert.equal(e.state.photo,photo);
 assert.equal(e.state.text,'Minha mensagem');assert.equal(e.state.signature,'Minha assinatura');
 assert.equal(e.$('#base-blank').attributes.get('aria-pressed'),'true');
 assert.equal(e.$('#model-library').hidden,true);
 assert(e.drawCalls().some(c=>c.op==='fillRect'&&c.color==='#ffffff'));
});

test('blank starter drops suggested copy; solid starter chooses readable text and survives project restore',async()=>{
 const e=await frontend();e.open();e.context.navigateCreation(1);
 e.$('#base-blank').onclick();assert.equal(e.state.text,'');
 e.$('#background-color').oninput({target:{value:'#183f35'}});
 assert.equal(e.state.textColor,'#fffefa');assert.equal(e.state.backgroundColor,'#183f35');
 assert.equal(e.$('#base-color-options').hidden,false);
 const saved=e.context.projectPage(e.context.activePage());
 await e.context.restoreProject({version:1,id:'solid',pages:[saved],format:'story',step:1,edits:[]});
 assert.equal(e.state.backgroundMode,'color');assert.equal(e.state.backgroundColor,'#183f35');
 assert.equal(e.$('#model-library').hidden,true);
});

test('the original illustrated cards are selectable and the same template can replace a solid base',async()=>{
 const e=await frontend();e.open();e.context.navigateCreation(1);
 const illustrated=e.campaigns.filter(c=>c.nativeScene);
 assert.equal(e.$('#illustrated-template-list').children.length,illustrated.length);
 e.$('#illustrated-template-list').children[0].onclick();
 assert.equal(e.state.campaign.id,illustrated[0].id);
 e.$('#base-blank').onclick();e.change('#background-mode','image');
 assert.equal(e.state.backgroundMode,'image');assert.equal(e.state.campaign.id,illustrated[0].id);
 assert.equal(e.$('#model-library').hidden,false);
});

test('initial carousel bases apply to starter pages and later changes stay on the current page',async()=>{
 const e=await frontend();e.open();e.change('#format','carousel');e.context.navigateCreation(1);
 e.$('#base-blank').onclick();assert(e.state.pages.every(p=>p.backgroundColor==='#ffffff'&&p.backgroundMode==='color'&&p.text===''));
 e.context.navigateCreation(2);e.context.navigateCreation(1);
 e.context.chooseBaseColor('#e7c746');
 assert.equal(e.state.pages[0].backgroundColor,'#e7c746');assert.equal(e.state.pages[1].backgroundColor,'#ffffff');
});

test('solid backgrounds skip models in both directions and image selection restores that step',async()=>{
 const e=await frontend();e.open();e.change('#background-mode','color');
 assert.equal(e.$('#base-color-options').hidden,false);assert.equal(e.$('#model-navigation-step').hidden,true);
 assert.match(e.$('#flow-progress').textContent,/Etapa 1 de 5/);
 for(const step of [2,3,6,4]){e.$('#flow-next').onclick();assert.equal(e.state.step,step);}
 for(const step of [6,3,2,0]){e.$('#flow-back').onclick();assert.equal(e.state.step,step);}
 e.change('#background-mode','image');assert.equal(e.$('#model-navigation-step').hidden,false);
 assert.match(e.$('#flow-progress').textContent,/Etapa 1 de 6/);
 e.$('#flow-next').onclick();assert.equal(e.state.step,1);
});

test('initial solid colors and palette choices initialize carousel pages without overwriting later page edits',async()=>{
 const e=await frontend();e.open();e.change('#format','carousel');e.change('#background-mode','color');
 e.$('#palette').children[3].onclick();assert(e.state.pages.every(p=>p.backgroundColor==='#b96d5a'&&p.backgroundMode==='color'));
 e.$('#flow-next').onclick();assert.equal(e.state.step,2);
 e.context.navigateCreation(0);e.input('#background-color','#123456');
 assert.equal(e.state.pages[0].backgroundColor,'#123456');assert.equal(e.state.pages[1].backgroundColor,'#b96d5a');
});

test('legacy visual projects resume at format and background without losing their saved values',async()=>{
 const e=await frontend();e.open();e.input('#headline','Texto salvo');e.change('#font-style','bold');
 const saved=e.context.projectPage(e.context.activePage());
 await e.context.restoreProject({version:1,id:'legacy-visual',pages:[saved],format:'story',step:5,edits:[]});
 assert.equal(e.state.step,0);assert.equal(e.state.font,'bold');assert.equal(e.state.text,'Texto salvo');
});

test('starter background uploads initialize carousel pages, while later replacements affect only the current page',async()=>{
 const e=await frontend();e.open();e.change('#format','carousel');e.context.navigateCreation(1);
 const first={width:100,height:100},second={width:200,height:200};
 e.context.loadUpload=async()=>first;
 await e.$('#background-input').onchange({target:{files:[{}],value:'background.png'}});
 assert(e.state.pages.every(p=>p.background===first&&p.backgroundMode==='image'));
 e.context.navigateCreation(2);e.context.navigateCreation(1);e.context.loadUpload=async()=>second;
 await e.$('#background-input').onchange({target:{files:[{}],value:'another.png'}});
 assert.equal(e.state.pages[0].background,second);assert.equal(e.state.pages[1].background,first);
});

test('home solid-color entry starts without suggested copy and skips the model screen',async()=>{
 const e=await frontend();e.$('#start-solid').onclick();
 assert.equal(e.state.backgroundMode,'color');assert.equal(e.state.text,'');assert.equal(e.state.step,0);
 assert.equal(e.$('#base-color-options').hidden,false);
 e.change('#format','story');e.input('#background-color','#e7c746');
 e.$('#flow-next').onclick();assert.equal(e.state.step,2);assert.equal(e.state.backgroundColor,'#e7c746');
 e.$('#flow-back').onclick();assert.equal(e.state.backgroundMode,'color');
 e.$('#start-creation').onclick();assert.equal(e.state.backgroundMode,'image');
 e.$('#flow-next').onclick();assert.equal(e.state.step,1);
});
