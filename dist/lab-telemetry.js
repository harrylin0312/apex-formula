import {SURFACES} from './core.js?v=steering-4';
const degrees=180/Math.PI;
const sum=(items,key)=>items.reduce((total,item)=>total+item[key],0);

// A read-only snapshot of solver outputs. No forces or vehicle state are changed here.
export function sampleLabTelemetry(car){
  const wheels=car.wheels.map(w=>{
    const loaded=w.fz>100,moving=Math.abs(w.contactLong||0)>3;
    const longitudinal=loaded&&Math.abs(w.slipRatio)>.12&&(moving||Math.abs(w.slipSpeedLong||0)>.8);
    const lateral=loaded&&w.utilization>.9&&Math.abs(w.slipAngle)*degrees>5&&Math.abs(w.slipSpeedLateral||0)>.8;
    return{id:w.id,front:w.front,load:w.fz,mu:w.mu,effectiveMu:w.fz>0?(w.capacity||0)/w.fz:0,surface:SURFACES[w.surface]?.label||w.surface,
      usage:w.utilization,capacity:w.capacity||0,force:Math.hypot(w.fx,w.fy),fx:w.fx,fy:w.fy,demandRatio:w.demandRatio||0,
      slipRatio:w.slipRatio,slipAngle:w.slipAngle*degrees,slipSpeed:Math.hypot(w.slipSpeedLong||0,w.slipSpeedLateral||0),
      angle:-w.steer*degrees,abs:!!w.absActive,tcs:!!w.tcsActive,locked:!!w.locked,
      spin:loaded&&!w.front&&w.slipRatio>.12&&(w.slipSpeedLong||0)>.8,sliding:longitudinal||lateral,lateralSliding:lateral};
  });
  function axle(front){
    const items=wheels.filter(w=>w.front===front),load=sum(items,'load'),capacity=sum(items,'capacity');
    return{load,capacity,usage:capacity>0?sum(items,'force')/capacity:0,peakUsage:Math.max(...items.map(w=>w.usage)),
      slipRatio:Math.max(...items.map(w=>Math.abs(w.slipRatio))),slipAngle:items.reduce((s,w)=>s+Math.abs(w.slipAngle),0)/items.length,
      sliding:items.some(w=>w.sliding),lateralSliding:items.some(w=>w.lateralSliding)};
  }
  const front=axle(true),rear=axle(false),s=Math.sin(car.a),c=Math.cos(car.a),u=car.vx*s+car.vz*c,v=car.vx*c-car.vz*s;
  const beta=car.speed>.5?Math.atan2(v,u)*degrees:0,turning=u>5&&Math.abs(car.steer)*degrees>.5;
  let balance='穩定／未見明顯側偏差',balanceLevel='normal';
  if(turning&&front.lateralSliding&&front.slipAngle>rear.slipAngle+2){balance='轉向不足傾向';balanceLevel='warning';}
  else if(turning&&rear.lateralSliding&&rear.slipAngle>front.slipAngle+2){balance='轉向過度傾向';balanceLevel='danger';}
  else if(front.lateralSliding&&rear.lateralSliding){balance='前後軸同時側滑';balanceLevel='danger';}
  const sliding=wheels.filter(w=>w.sliding),near=wheels.filter(w=>w.usage>=.9),total=front.load+rear.load;
  return{time:car.telemetry.elapsed||0,speed:car.speed*3.6,gas:car.throttle,brake:car.brake,steering:car.steeringInput||0,
    steeringTarget:-(car.steeringTarget||0)*degrees,steeringActual:-car.steer*degrees,
    ers:car.ers,boost:!!car.telemetry.boost,assist:!!car.telemetry.assist,
    downforce:car.telemetry.aero?.downforce||0,dragLong:car.telemetry.aero?.dragLong||0,dragLateral:car.telemetry.aero?.dragLateral||0,
    ax:car.telemetry.aero?.ax||0,ay:car.telemetry.aero?.ay||0,yaw:car.yaw*degrees,beta,wheels,front,rear,
    frontLoadShare:total>0?front.load/total:0,frontGripShare:front.capacity+rear.capacity>0?front.capacity/(front.capacity+rear.capacity):0,
    sliding:sliding.length>0,nearLimit:near.length>0,slidingWheels:sliding.map(w=>w.id),nearWheels:near.map(w=>w.id),
    balance,balanceLevel,abs:wheels.some(w=>w.abs),tcs:wheels.some(w=>w.tcs)};
}

export function createLabObserver(){
  let history=[],onset=null,priorTime=-1,stableSince=0,lastSample=-1;
  return{
    reset(){history=[];onset=null;priorTime=-1;stableSince=0;lastSample=-1;},
    sample(car){
      const t=sampleLabTelemetry(car);
      if(t.time!==priorTime){
        if(t.sliding){if(!onset)onset={time:t.time,wheels:t.slidingWheels.slice()};stableSince=t.time;}
        else if(t.time-stableSince>.75)onset=null;
        if(t.time-lastSample>=.1||lastSample<0){history.push({time:t.time,frontLoad:t.frontLoadShare,frontUsage:t.front.usage,rearUsage:t.rear.usage});lastSample=t.time;}
        while(history.length&&history[0].time<t.time-8)history.shift();priorTime=t.time;
      }
      return{...t,onset,history:history.slice()};
    }
  };
}
