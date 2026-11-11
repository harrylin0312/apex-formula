import * as THREE from './vendor/three.module.js';

// Saturation alone also occurs during normal cornering; require actual sliding.
export function tyreSmokeIntensity(car,wheel,radius=.36){
  if(!(wheel.fz>100)||!(wheel.utilization>.94))return 0;
  const s=Math.sin(car.a),c=Math.cos(car.a),u=car.vx*s+car.vz*c-car.yaw*wheel.x,v=car.vx*c-car.vz*s+car.yaw*wheel.l;
  const cs=Math.cos(wheel.steer),sn=Math.sin(wheel.steer);
  const slipSpeed=Math.hypot(wheel.omega*radius-(u*cs+v*sn),-u*sn+v*cs);
  return Math.max(0,Math.min(1,(slipSpeed-.8)/7))*Math.min(1,(wheel.utilization-.94)/.06);
}

export function createTyreSmoke(scene,{capacity=320,random=Math.random}={}){
  const canvas=document.createElement('canvas');canvas.width=canvas.height=64;
  const ctx=canvas.getContext('2d'),gradient=ctx.createRadialGradient(32,32,2,32,32,32);
  gradient.addColorStop(0,'rgba(235,239,242,.8)');gradient.addColorStop(.4,'rgba(221,228,233,.45)');gradient.addColorStop(1,'rgba(220,228,234,0)');
  ctx.fillStyle=gradient;ctx.fillRect(0,0,64,64);
  const texture=new THREE.CanvasTexture(canvas),particles=[];let cursor=0;
  const group=new THREE.Group();group.name='tyre-smoke';scene.add(group);
  for(let i=0;i<capacity;i++){
    const material=new THREE.SpriteMaterial({map:texture,transparent:true,depthWrite:false,opacity:0,color:0xe8edf0});
    const sprite=new THREE.Sprite(material);sprite.visible=false;group.add(sprite);
    particles.push({sprite,life:0,maxLife:1,vx:0,vz:0,rise:0,size:0});
  }
  function emit(car,wheel,intensity){
    const p=particles[cursor];cursor=(cursor+1)%capacity;
    const s=Math.sin(car.a),c=Math.cos(car.a);
    p.sprite.position.set(car.x+s*wheel.l+c*wheel.x,.1,car.z+c*wheel.l-s*wheel.x);
    p.life=p.maxLife=.65+random()*.55;p.size=.3+intensity*.35;
    p.vx=car.vx*.06+(random()-.5)*.65;p.vz=car.vz*.06+(random()-.5)*.65;p.rise=.45+random()*.5;
    p.sprite.material.rotation=random()*Math.PI*2;p.sprite.material.opacity=.2+intensity*.3;
    p.opacity=p.sprite.material.opacity;p.sprite.scale.setScalar(p.size);p.sprite.visible=true;
  }
  return {
    update(dt,cars,emitEnabled=true){
      for(const p of particles)if(p.life>0){
        p.life=Math.max(0,p.life-dt);const age=1-p.life/p.maxLife;
        p.sprite.visible=p.life>0;p.sprite.position.x+=p.vx*dt;p.sprite.position.z+=p.vz*dt;p.sprite.position.y+=p.rise*dt;
        p.sprite.scale.setScalar(p.size+age*1.8);p.sprite.material.opacity=p.opacity*(1-age)**1.5;
      }
      if(!emitEnabled)return;
      for(const car of cars)for(const wheel of car.wheels){
        const intensity=tyreSmokeIntensity(car,wheel);
        if(!intensity){wheel.smokeCredit=0;continue;}
        wheel.smokeCredit=(wheel.smokeCredit||0)+dt*(8+intensity*28);
        while(wheel.smokeCredit>=1){emit(car,wheel,intensity);wheel.smokeCredit--;}
      }
    },
    clear(){for(const p of particles){p.life=0;p.sprite.visible=false;}},
    get activeCount(){return particles.filter(p=>p.life>0).length;},
    dispose(){group.removeFromParent();for(const p of particles)p.sprite.material.dispose();texture.dispose();}
  };
}
