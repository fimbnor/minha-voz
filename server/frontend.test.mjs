import test from 'node:test';
import assert from 'node:assert/strict';
import {frontend} from './frontend-harness.mjs';

test('the shipped catalog initializes the editor and every banner choice',async()=>{
 const e=await frontend(), count=Number(e.$('#hero-caption').textContent.split('/')[1]);
 assert.equal(e.$('#campaign-grid').children.length,e.campaigns.length);
 for(let i=0;i<count;i++){
  e.$('#hero-cta').onclick();assert.equal(e.$('#editor').open,true);assert.equal(e.state.step,0);
  assert(e.campaigns.some(c=>c.id===e.state.campaign.id));
  e.context.closeEditor();e.$('#hero-next').onclick();
 }
 assert.equal(typeof e.$('#download-button').onclick,'function');assert.equal(typeof e.$('#ai-generate').onclick,'function');
});

test('banner supports pause, navigation, wraparound and reduced motion',async()=>{
 const app=await frontend({reducedMotion:false}),{$,timers,media}=app;
 const initial=$('#hero-theme').textContent;
 $('#hero-pause').onclick();assert.equal(timers.size,0);assert.equal($('#hero-pause').attributes.get('aria-pressed'),'true');
 $('#hero-pause').onclick();assert.equal(timers.size,1);
 const count=Number($('#hero-caption').textContent.split('/')[1]);
 for(let i=0;i<count;i++)app.tick();assert.equal($('#hero-theme').textContent,initial);
 $('#hero-next').onclick();assert.notEqual($('#hero-theme').textContent,initial);$('#hero-previous').onclick();assert.equal($('#hero-theme').textContent,initial);
 media.matches=true;media.onchange({matches:true});assert.equal(timers.size,0);
 $('#hero-next').onclick();assert.notEqual($('#hero-theme').textContent,initial);assert.equal(timers.size,0);
});
