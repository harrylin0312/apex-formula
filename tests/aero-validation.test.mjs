import fs from 'node:fs';
import assert from 'node:assert/strict';
const source=fs.readFileSync(new URL('../dist/core.js',import.meta.url),'utf8');
const close=(a,b,tol=1e-6)=>assert(Math.abs(a-b)<tol,`${a} != ${b}`);
const variants={normal:source,noDownforce:source.replace('downforceCoefficient:2.6','downforceCoefficient:0'),noDrag:source.replace('dragCoefficient:.68','dragCoefficient:0')};
const out={testedSource:'5dc06bb',conditions:'120 Hz / 240 Hz; fixed asphalt; straight coast and ABS brake; turn: 200 km/h, 25% steering, no throttle, 0.3 s',variants:{}};
for(const [name,code] of Object.entries(variants)){
 const m=await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
 const car=(kmh)=>{let c=m.createCar(100);m.setVelocity(c,kmh/3.6);return c;};const step=(c,input,n=1,assist=false)=>{for(let i=0;i<n;i++)m.drive(c,input,1/120,assist,m.LAB_ENVIRONMENT);return c;};
 out.variants[name]={};
 for(const kmh of [100,200,300]){let loads=m.wheelLoads(kmh/3.6,0,0),df=m.PHYSICS.downforceCoefficient*(kmh/3.6)**2;close(loads.reduce((s,x)=>s+x,0),m.PHYSICS.mass*m.PHYSICS.gravity+df);close(loads[0]+loads[1],m.PHYSICS.mass*m.PHYSICS.gravity*m.PHYSICS.lr/(m.PHYSICS.lf+m.PHYSICS.lr)+df*.46);let c=step(car(kmh),{});close(c.telemetry.aero.downforce,m.PHYSICS.downforceCoefficient*c.telemetry.aero.speed**2);close(c.wheels.reduce((s,w)=>s+w.fz,0),m.PHYSICS.mass*m.PHYSICS.gravity+c.telemetry.aero.downforce);close(c.telemetry.aero.dragLong,-m.PHYSICS.dragCoefficient*c.telemetry.aero.speed**2);out.variants[name][kmh]={downforce:c.telemetry.aero.downforce,drag:c.telemetry.aero.dragLong,load:c.wheels.reduce((s,w)=>s+w.fz,0),capacity:c.wheels.reduce((s,w)=>s+w.capacity,0)};}
 let b=car(200),t=0;while(b.speed>.2&&t<15){step(b,{brake:1},1,true);t+=1/120;}out.variants[name].brake200={time:t,distance:Math.hypot(b.x-100,b.z)};
 let c=step(car(300),{},120);out.variants[name].coast300={speed:c.speed*3.6};
 c=step(car(200),{steer:.25},36);out.variants[name].turn200={ay:c.telemetry.aero.ay,yaw:c.yaw,speed:c.speed*3.6,beta:Math.atan2(c.vx*Math.cos(c.a)-c.vz*Math.sin(c.a),c.vx*Math.sin(c.a)+c.vz*Math.cos(c.a))*180/Math.PI};
}
const {normal,noDownforce,noDrag}=out.variants;
assert(normal[300].capacity>noDownforce[300].capacity*3);
assert(normal.brake200.distance<noDownforce.brake200.distance);
assert(normal.brake200.distance<noDrag.brake200.distance);
assert(normal.coast300.speed<noDrag.coast300.speed-15);
assert(Math.abs(normal.turn200.ay)>Math.abs(noDownforce.turn200.ay)*1.5);
assert(Number.isFinite(normal.turn200.yaw));
out.pass=true;
console.log(JSON.stringify(out,null,2));
if(process.argv.includes('--save'))fs.writeFileSync(new URL('../research/wind-tunnel-validation.json',import.meta.url),JSON.stringify(out,null,2)+'\n');
