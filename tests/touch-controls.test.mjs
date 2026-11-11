import assert from 'node:assert/strict';
import {bindTouchControls} from '../dist/touch-controls.js';
class Node{
  constructor(){this.events={};this.capture=new Set();this.style={setProperty(){}};this.classList={toggle(){}};this.small={textContent:''};}
  addEventListener(type,fn){this.events[type]=fn;}removeEventListener(type){delete this.events[type];}
  getBoundingClientRect(){return{left:0,top:0,right:100,bottom:180,width:100,height:180};}
  querySelector(){return this.small;}
  setPointerCapture(id){this.capture.add(id);}hasPointerCapture(id){return this.capture.has(id);}releasePointerCapture(id){this.capture.delete(id);this.fire('lostpointercapture',id);}
  fire(type,id,x=50,y=8){this.events[type]?.({pointerId:id,clientX:x,clientY:y,pointerType:'touch',button:0,preventDefault(){}});}
}
const gas=new Node(),brake=new Node(),boost=new Node(),steer=new Node(),track=new Node(),knob=new Node();
let latest;const controls=bindTouchControls({gas,brake,boost,steer,track,knob,onChange:s=>latest=s});
gas.fire('pointerdown',1);steer.fire('pointerdown',2,90);brake.fire('pointerdown',3,50,90);boost.fire('pointerdown',4);
assert.equal(latest.gas,1);assert(latest.steer>.8);assert.equal(latest.brake,.5);assert(latest.boost);
gas.fire('pointerdown',5,50,172);gas.fire('pointerup',5);gas.fire('pointercancel',5);gas.fire('lostpointercapture',5);
assert.equal(latest.gas,1,'extra finger must neither steal nor release held pedal');
steer.fire('pointerup',2);assert.equal(latest.steer,0);assert.equal(latest.gas,1);assert.equal(latest.brake,.5);assert(latest.boost);
gas.fire('pointermove',1,250,90);assert.equal(latest.gas,.5,'captured finger remains independent outside pedal bounds');
gas.fire('pointermove',1,250,-50);assert.equal(latest.gas,1);gas.fire('pointermove',1,250,300);assert.equal(latest.gas,0);
gas.fire('pointercancel',1);assert.equal(latest.brake,.5);assert(latest.boost);
controls.reset();assert.deepEqual(latest,{gas:0,brake:0,boost:false,steer:0});assert(!boost.capture.size&&!brake.capture.size);
// A late cancellation from the previous gesture cannot clear the new one.
gas.fire('pointerdown',7);gas.fire('lostpointercapture',1);assert.equal(latest.gas,1);
controls.dispose();assert.equal(Object.keys(gas.events).length,0);
console.log('Touch controls: simultaneous four controls, pointer ownership, extra fingers, captured dragging, cancellation and reset passed.');
