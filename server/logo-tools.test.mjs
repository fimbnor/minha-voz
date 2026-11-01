import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../dist/logo-tools.js',import.meta.url),'utf8');
function remover(){const nodes=new Map();const context=vm.createContext({Uint8Array,Int32Array,$:id=>{if(!nodes.has(id))nodes.set(id,{addEventListener(){}});return nodes.get(id);}});vm.runInContext(source,context);return context.removeConnectedLogoBackground;}
function image(w,h,rgb){const data=new Uint8ClampedArray(w*h*4);for(let i=0;i<w*h;i++)data.set([...rgb,255],i*4);return {width:w,height:h,data};}
function pixel(im,x,y,rgba){im.data.set(rgba,(y*im.width+x)*4);}
test('logo background removal keeps enclosed white details and colored logo pixels',()=>{const im=image(5,5,[255,255,255]);for(let y=1;y<4;y++)for(let x=1;x<4;x++)pixel(im,x,y,[0,0,0,255]);pixel(im,2,2,[255,255,255,255]);const count=remover()(im,[255,255,255],12);assert.equal(count,16);assert.equal(im.data[3],0);assert.equal(im.data[(2*5+2)*4+3],255);assert.equal(im.data[(1*5+1)*4+3],255);});
test('logo removal supports chosen background color and preserves existing transparency',()=>{const im=image(3,3,[0,0,0]);pixel(im,1,1,[220,30,30,180]);pixel(im,0,0,[0,0,0,0]);remover()(im,[0,0,0],5);assert.equal(im.data[3],0);assert.equal(im.data[7],0);assert.equal(im.data[(1*3+1)*4+3],180);});
test('unmatched logo background leaves image unchanged',()=>{const im=image(3,3,[200,20,20]),before=im.data.slice();assert.equal(remover()(im,[255,255,255],0),0);assert.deepEqual(im.data,before);});
