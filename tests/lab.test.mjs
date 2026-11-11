import assert from 'node:assert/strict';
import {createCar,setVelocity,drive,PHYSICS,LAB_ENVIRONMENT} from '../dist/core.js';
import {sampleLabTelemetry,createLabObserver} from '../dist/lab-telemetry.js';
const dt=1/120,close=(a,b,t=1e-7)=>assert(Math.abs(a-b)<t,`${a} != ${b}`);
const race=createCar(100),lab=createCar(100);setVelocity(race,20);setVelocity(lab,20);
for(let i=0;i<30;i++){drive(race,{gas:.2,steer:.02},dt,true);drive(lab,{gas:.2,steer:.02},dt,true,LAB_ENVIRONMENT);for(const k of ['vx','vz','a','yaw','steer','ers'])close(lab[k],race[k]);for(let j=0;j<4;j++){close(lab.wheels[j].fx,race.wheels[j].fx);close(lab.wheels[j].fy,race.wheels[j].fy);}}
console.log('Lab and race use identical forces on the same asphalt.');
const far=createCar(0);far.x=50000;far.z=-40000;setVelocity(far,300/3.6);const begin={x:far.x,z:far.z};
for(let i=0;i<120;i++)drive(far,{gas:.25,steer:.08},dt,false,LAB_ENVIRONMENT);
assert(Math.hypot(far.x-begin.x,far.z-begin.z)>65);assert(!far.wallHit&&!far.invalid&&far.completed===0);assert(far.wheels.every(w=>w.surface==='asphalt'));
const t=sampleLabTelemetry(far);close(t.downforce+PHYSICS.mass*PHYSICS.gravity,t.front.load+t.rear.load,1e-6);close(t.downforce,PHYSICS.downforceCoefficient*far.telemetry.aero.speed**2);
close(t.dragLong,far.telemetry.aero.dragLong);close(t.front.load,t.wheels[0].load+t.wheels[1].load);close(t.ax,far.telemetry.aero.ax);
for(let i=0;i<4;i++){const w=far.wheels[i],v=t.wheels[i];close(v.slipRatio,w.slipRatio);close(v.slipAngle,w.slipAngle*180/Math.PI);close(v.effectiveMu*w.fz,w.capacity);assert(Math.hypot(v.fx,v.fy)<=v.capacity+1e-6);}
const saved=JSON.stringify(far);sampleLabTelemetry(far);assert.equal(JSON.stringify(far),saved,'sampling cannot mutate physics');
console.log('Unbounded motion, actual aero/load conservation, signed wheel slip and read-only telemetry passed.');
const brake=createCar(0);setVelocity(brake,30);let abs=false,lock=false;
for(let i=0;i<120;i++){drive(brake,{brake:1},dt,true,LAB_ENVIRONMENT);const q=sampleLabTelemetry(brake);abs ||=q.abs;for(const w of brake.wheels)assert.equal(w.absActive,w.brakeTorque<w.requestedBrakeTorque-1e-6);}
assert(abs);const noAbs=createCar(0);setVelocity(noAbs,30);for(let i=0;i<120;i++){drive(noAbs,{brake:1},dt,false,LAB_ENVIRONMENT);lock ||=sampleLabTelemetry(noAbs).wheels.some(w=>w.locked);}assert(lock);
const spin=createCar(0);let tcs=false,wheelspin=false;for(let i=0;i<120;i++){drive(spin,{gas:1},dt,true,LAB_ENVIRONMENT);tcs ||=sampleLabTelemetry(spin).tcs;}assert(tcs);
const raw=createCar(0);for(let i=0;i<60;i++){drive(raw,{gas:1},dt,false,LAB_ENVIRONMENT);wheelspin ||=sampleLabTelemetry(raw).wheels.some(w=>w.spin);}assert(wheelspin);
console.log('ABS, TCS, lockup and wheelspin come from actual solver torque and slip.');
const observer=createLabObserver(),c=createCar(0);drive(c,{},dt,false,LAB_ENVIRONMENT);assert.equal(observer.sample(c).onset,null);
// Isolated classifier checks with controlled wheel state, not a product preset or scenario.
setVelocity(c,20);c.steer=.1;c.telemetry.elapsed=1;
for(const w of c.wheels){w.slipRatio=0;w.slipAngle=w.front?.15:.01;w.slipSpeedLateral=w.front?3:.1;w.utilization=w.front?.99:.4;w.contactLong=20;}
let q=observer.sample(c);assert.equal(q.balance,'轉向不足傾向');assert.deepEqual(q.onset.wheels,['FL','FR']);
c.telemetry.elapsed=1.2;c.wheels[2].slipRatio=.3;q=observer.sample(c);assert.deepEqual(q.onset.wheels,['FL','FR'],'first axle should not be overwritten');
for(const w of c.wheels){w.slipAngle=w.front?.01:.15;w.slipSpeedLateral=w.front?.1:3;w.utilization=w.front?.4:.99;}assert.equal(sampleLabTelemetry(c).balance,'轉向過度傾向');
const steady=createCar(0);observer.reset();for(let i=0;i<1200;i++){drive(steady,{},dt,false,LAB_ENVIRONMENT);observer.sample(steady);}const h=observer.sample(steady).history;assert(h.length>60&&h.length<82);assert(h.at(-1).time-h[0].time<=8);observer.reset();assert.equal(observer.sample(createCar(0)).history.length,1);
console.log('Relative-slip status, first-slip detection and real eight-second history passed.');
