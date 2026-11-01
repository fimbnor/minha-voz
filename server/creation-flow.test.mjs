import test from 'node:test';
import assert from 'node:assert/strict';
import {frontend} from './frontend-harness.mjs';

test('creation starts with format and advances through model, photo, customization and export',async()=>{
 const e=await frontend();e.$('#start-creation').onclick();
 assert.equal(e.state.step,0);assert.equal(e.$('#flow-back').hidden,true);
 e.change('#format','story');
 for(let step=1;step<=4;step++){
  e.$('#flow-next').onclick();assert.equal(e.state.step,step);
  const visible=e.selectors.get('[data-panel]').filter(p=>!p.hidden);
  assert.equal(visible.length,1);assert.equal(Number(visible[0].dataset.panel),step);
 }
 assert.equal(e.$('#flow-next').hidden,true);assert.match(e.$('#export-summary').textContent,/Story/);
 assert.equal(e.$('#preview-canvas').height,1920);
 for(let step=3;step>=0;step--){e.$('#flow-back').onclick();assert.equal(e.state.step,step);}
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
 assert.equal(e.state.step,3);assert.equal(e.$('#ai-edit-options').open,true);
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
