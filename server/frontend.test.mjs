import test from 'node:test';
import assert from 'node:assert/strict';
import {frontend} from './frontend-harness.mjs';

test('banner rotates categories every three seconds, changes pose and opens the displayed model',async()=>{
 const app=await frontend({reducedMotion:false}),{$,timers}=app;
 assert.equal($('#campaign-grid').children.length,app.campaigns.length);
 const category=$('#hero-theme').textContent,pose=$('.hero').styles.get('--hero-angle');
 assert.equal(timers.size,1);assert.equal([...timers.values()][0].delay,3000);
 app.tick();assert.notEqual($('#hero-theme').textContent,category);assert.notEqual($('.hero').styles.get('--hero-angle'),pose);
 const selectedCategory=$('#hero-theme').textContent;
 $('#hero-cta').onclick();assert.equal($('#editor').open,true);assert.equal(app.state.campaign.category,selectedCategory);assert.equal(timers.size,0);
 assert.equal(typeof $('#download-button').onclick,'function');assert.equal(typeof $('#ai-generate').onclick,'function');
});

test('banner supports pause, navigation, wraparound and reduced motion',async()=>{
 const app=await frontend({reducedMotion:false}),{$,timers,media}=app;
 const initial=$('#hero-theme').textContent;
 $('#hero-pause').onclick();assert.equal(timers.size,0);assert.equal($('#hero-pause').attributes.get('aria-pressed'),'true');
 $('#hero-pause').onclick();assert.equal(timers.size,1);
 const count=new Set(app.campaigns.map(c=>c.category)).size;
 for(let i=0;i<count;i++)app.tick();assert.equal($('#hero-theme').textContent,initial);
 $('#hero-next').onclick();assert.notEqual($('#hero-theme').textContent,initial);$('#hero-previous').onclick();assert.equal($('#hero-theme').textContent,initial);
 media.matches=true;media.onchange({matches:true});assert.equal(timers.size,0);
 $('#hero-next').onclick();assert.notEqual($('#hero-theme').textContent,initial);assert.equal(timers.size,0);
});
