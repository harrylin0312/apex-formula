import fs from 'node:fs';
const source=fs.readFileSync(new URL('../dist/core.js',import.meta.url),'utf8');
const samplePattern='return{name,...SURFACES[name],near:n};';
const wallPattern='if(n.dist>HALF+14){';
if(!source.includes(samplePattern)||!source.includes(wallPattern))throw Error('Core geometry changed: update this isolation harness before using it.');
// Only remove surface boundaries and walls from the in-memory research module.
const uniform=source.replace(samplePattern,"return{name:'asphalt',...SURFACES.asphalt,near:n};").replace(wallPattern,'if(false){');
const {createCar,setVelocity,drive,PHYSICS,steeringLimit}=await import('data:text/javascript;base64,'+Buffer.from(uniform).toString('base64'));
const results={sourceCommit:'711fa086d8ffdde956d89069988e1c480a858f95',conditions:'Uniform asphalt; walls removed; no ABS/TCS; 15% throttle; 0.3-second steering pulse followed by 0.7-second release; 120 Hz chassis / 240 Hz tyre integration',runs:[],aero:[]};
for(const kph of[100,200,250,300])for(const command of[.05,.1,.25,1]){const c=createCar(100);setVelocity(c,kph/3.6);let maxSideslipDegrees=0,maxYawRate=0;for(let i=0;i<120;i++){drive(c,{steer:i<36?command:0,gas:.15},1/120,false);const u=c.vx*Math.sin(c.a)+c.vz*Math.cos(c.a),v=c.vx*Math.cos(c.a)-c.vz*Math.sin(c.a);maxSideslipDegrees=Math.max(maxSideslipDegrees,Math.abs(Math.atan2(v,u))*180/Math.PI);maxYawRate=Math.max(maxYawRate,Math.abs(c.yaw));}results.runs.push({kph,command,wheelAngleLimitDegrees:steeringLimit(kph/3.6)*command*180/Math.PI,maxSideslipDegrees,maxYawRate,finalYawRate:c.yaw});}
for(const kph of[100,200,300]){const v=kph/3.6;results.aero.push({kph,downforceN:PHYSICS.downforceCoefficient*v*v,weightN:PHYSICS.mass*PHYSICS.gravity});}
console.log(JSON.stringify(results,null,2));
