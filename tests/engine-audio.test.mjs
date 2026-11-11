import assert from 'node:assert/strict';
import {engineVoice,createEngineAudio} from '../dist/engine-audio.js';
const idle=engineVoice(),rev=engineVoice({throttle:1}),before=engineVoice({speed:43.9/3.6}),after=engineVoice({speed:44.1/3.6});
assert(rev.rpm>idle.rpm*2);assert(after.gear===before.gear+1&&after.rpm<before.rpm*.7,'upshift drops RPM');
assert(engineVoice({speed:10,rearWheelSpeed:50}).rpm>engineVoice({speed:10}).rpm,'wheelspin raises sound RPM');
for(const speed of [0,10,40,80,200]){const v=engineVoice({speed,throttle:1});assert(v.rpm>=3800&&v.rpm<=14000);}
const statuses=[];const audio=createEngineAudio({contextFactory:()=>{throw Error('Audio unavailable');},onStatus:s=>statuses.push(s)});
assert.equal(await audio.setEnabled(true),false);assert.equal(await audio.unlock(),false);audio.update({active:true});assert(audio.enabled);await audio.setEnabled(false);assert(!audio.enabled);
assert(statuses.length>0);console.log('Engine voice: free revs, RPM bounds, shift drop, wheelspin, unavailable audio and retry passed.');
