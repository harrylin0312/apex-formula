import fs from 'node:fs';
import assert from 'node:assert/strict';
import * as current from '../dist/core.js';
const source=fs.readFileSync(new URL('../dist/core.js',import.meta.url),'utf8');
const baselineSource=source.slice(0,source.indexOf('export function steeringLimit'))+'export function steeringLimit(speed){return .58/(1+4*Math.abs(speed)/42);}\n'+source.slice(source.indexOf('function ackermann'));
const baseline=await import('data:text/javascript;base64,'+Buffer.from(baselineSource).toString('base64'));
const close=(a,b,t=1e-9)=>assert(Math.abs(a-b)<t);
let prior=Infinity;
for(let kmh=0;kmh<=400;kmh+=.1){const a=current.steeringLimit(kmh/3.6);assert(a>0&&a<=prior+1e-10,'maximum angle must not increase with speed');prior=a;close(a,current.steeringLimit(-kmh/3.6));if(kmh<=60||kmh>=250)close(a,baseline.steeringLimit(kmh/3.6));else assert(a<=baseline.steeringLimit(kmh/3.6)+1e-9);}
for(const kmh of [60,80,100,150,200,250])close(current.steeringLimit((kmh-1e-5)/3.6),current.steeringLimit((kmh+1e-5)/3.6),1e-6);
const runs=[];
for(const [version,m] of [['previous',baseline],['current',current]])for(const kmh of [50,60,70,80,100,150,200,250,300])for(const steer of [.25,.5,1])for(const brake of [0,.9]){
 const c=m.createCar(0);m.setVelocity(c,kmh/3.6);let beta=0,locks=0;
 for(let i=0;i<360;i++){m.drive(c,{steer:i<36?steer:0,gas:0,brake:i<120?brake:0,friendlyBrake:true},1/120,false,m.LAB_ENVIRONMENT);const u=c.vx*Math.sin(c.a)+c.vz*Math.cos(c.a),v=c.vx*Math.cos(c.a)-c.vz*Math.sin(c.a);if(c.speed>3)beta=Math.max(beta,Math.abs(Math.atan2(v,u))*180/Math.PI);locks+=c.wheels.filter(w=>w.locked).length;assert(Number.isFinite(c.yaw)&&Number.isFinite(c.speed));for(const w of c.wheels)assert(Math.hypot(w.fx,w.fy)<=w.capacity+1e-6);}
 runs.push({version,kmh,steer,brake,maximumBetaDegrees:beta,lockedWheelSamples:locks,finalYaw:c.yaw,finalSpeed:c.speed*3.6});
}
for(const kmh of [80,100,150,200]){const a=runs.find(r=>r.version==='previous'&&r.kmh===kmh&&r.steer===1&&r.brake===0),b=runs.find(r=>r.version==='current'&&r.kmh===kmh&&r.steer===1&&r.brake===0);assert(b.maximumBetaDegrees<a.maximumBetaDegrees);}
const angles=[0,40,50,60,70,80,100,150,200,250,300].map(kmh=>({kmh,previous:baseline.steeringLimit(kmh/3.6)*180/Math.PI,current:current.steeringLimit(kmh/3.6)*180/Math.PI}));
const result={pass:true,source:'steering-v5; baseline curve from 7754f35',conditions:'LAB_ENVIRONMENT; 0.3s steering pulse then 2.7s release; no throttle; brake if selected applied for first 1s; friendly brake on; ABS/TCS off; no forced speed or yaw after initialization',angles,runs};
console.log(JSON.stringify(result,null,2));
if(process.argv.includes('--save'))fs.writeFileSync(new URL('../research/steering-curve-v5.json',import.meta.url),JSON.stringify(result,null,2)+'\n');
