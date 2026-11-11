import fs from 'node:fs';
import assert from 'node:assert/strict';
import {sampleLabTelemetry} from '../dist/lab-telemetry.js';
const source=fs.readFileSync(new URL('../dist/core.js',import.meta.url),'utf8');
const result={source:'a003ca0',conditions:'LAB_ENVIRONMENT; 0.3 second steering pulse, then 2.7 second release; 15% throttle; no assists; 120Hz',runs:[],misleadingStableExample:null};
for(const factor of [2,4]){const code=source.replace('1+4*Math.abs(speed)/42',`1+${factor}*Math.abs(speed)/42`);const m=await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
for(const kmh of [100,200,250,300])for(const command of [.05,.1,.25,.5,1]){let c=m.createCar(0);m.setVelocity(c,kmh/3.6);let maxBeta=0,maxYaw=0,betaAt1=0,yawAt1=0,maxCapacityError=0;
for(let i=0;i<360;i++){m.drive(c,{steer:i<36?command:0,gas:.15},1/120,false,m.LAB_ENVIRONMENT);let u=c.vx*Math.sin(c.a)+c.vz*Math.cos(c.a),v=c.vx*Math.cos(c.a)-c.vz*Math.sin(c.a),beta=Math.abs(Math.atan2(v,u)*180/Math.PI);maxBeta=Math.max(maxBeta,beta);maxYaw=Math.max(maxYaw,Math.abs(c.yaw));assert(Number.isFinite(c.speed)&&Number.isFinite(c.yaw));
const telemetry=sampleLabTelemetry(c);if(factor===4&&!result.misleadingStableExample&&!telemetry.sliding&&!telemetry.nearLimit&&beta>5&&telemetry.wheels.some(w=>Math.abs(w.slipAngle)>5&&w.slipSpeed>5)){result.misleadingStableExample={kmh,command,time:(i+1)/120,speed:telemetry.speed,beta,yaw:telemetry.yaw,balance:telemetry.balance,wheels:telemetry.wheels.map(w=>({id:w.id,usage:w.usage,alpha:w.slipAngle,slipSpeed:w.slipSpeed,sliding:w.sliding}))};}if(i===119){betaAt1=beta;yawAt1=c.yaw;}for(const w of c.wheels)maxCapacityError=Math.max(maxCapacityError,Math.hypot(w.fx,w.fy)-w.capacity);}
result.runs.push({factor,kmh,command,maxBeta,maxYaw,betaAt1,yawAt1,finalYaw:c.yaw,finalSpeed:c.speed*3.6,maxCapacityError});}}
for(const kmh of [200,250,300]){const old=result.runs.find(r=>r.factor===2&&r.kmh===kmh&&r.command===.25),current=result.runs.find(r=>r.factor===4&&r.kmh===kmh&&r.command===.25);assert(current.maxBeta<old.maxBeta*.65);assert(current.betaAt1<.25);assert(Math.abs(current.finalYaw)<.001);}
assert(result.runs.every(r=>r.maxCapacityError<1e-6));
result.pass=true;console.log(JSON.stringify(result,null,2));
if(process.argv.includes('--save'))fs.writeFileSync(new URL('../research/steering-v4-validation.json',import.meta.url),JSON.stringify(result,null,2)+'\n');
