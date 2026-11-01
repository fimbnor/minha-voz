import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {frontend} from './frontend-harness.mjs';

test('format tiles retain selection and home selects the background path',async()=>{
 const e=await frontend();e.open();const groups=e.selectors.get('[data-choice-group]');assert.equal(groups.length,1);
 const [formats]=groups.map(g=>g.querySelectorAll());assert.equal(formats.length,6);
 formats.find(b=>b.dataset.choice==='story').onclick();assert.equal(e.state.format,'story');assert.equal(e.$('#preview-canvas').height,1920);
 assert.equal(formats.find(b=>b.dataset.choice==='story').attributes.get('aria-checked'),'true');
 e.$('#start-solid').onclick();e.$('#campaign-grid').children[0].onclick();assert.equal(e.state.backgroundMode,'color');
 e.open();assert.equal(formats[0].attributes.get('aria-checked'),'true');assert.equal(e.state.backgroundMode,'image');
 let prevented=false;formats[0].events.get('keydown')({key:'End',preventDefault(){prevented=true;}});assert(prevented);assert.equal(e.state.format,'carousel');
});
test('all seven embedded fonts are selectable for rectangular and circular cards',async()=>{
 const e=await frontend();e.open();const fonts=vm.runInContext('Object.keys(CARD_FONTS)',e.context);assert.equal(fonts.length,7);
 for(const font of fonts){await e.change('#font-style',font);assert.equal(e.state.font,font);assert.match(e.context.cardFont(font,32),/^32px "LM /);e.change('#format','instagram-profile');e.context.renderPreview();e.change('#format','feed');}
});
test('missing Gemini consent reveals a persistent alert and marking it clears the warning',async()=>{
 const e=await frontend();e.open();e.context.highlightAIConsent();
 assert.equal(e.$('#ai-consent-alert').hidden,false);assert(e.$('#ai-consent-panel').classes.has('consent-required'));assert.equal(e.$('#ai-consent').attributes.get('aria-invalid'),'true');
 e.$('#ai-consent').checked=true;e.$('#ai-consent').events.get('change')();
 assert.equal(e.$('#ai-consent-alert').hidden,true);assert(!e.$('#ai-consent-panel').classes.has('consent-required'));
});
