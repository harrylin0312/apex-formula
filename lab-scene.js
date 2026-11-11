import * as THREE from './vendor/three.module.js';

export function createLabScene(scene){
  const group=new THREE.Group();group.name='wind-tunnel-cell';group.visible=false;scene.add(group);
  const surface=new THREE.MeshStandardMaterial({color:'#14242e',roughness:.72,metalness:.25});
  const wallMat=new THREE.MeshStandardMaterial({color:'#172a36',roughness:.8,side:THREE.DoubleSide});
  const lightMat=new THREE.MeshBasicMaterial({color:'#65dce4'}),dimMat=new THREE.MeshBasicMaterial({color:'#294d61'});
  function box(x,y,z,w,h,d,material){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);m.position.set(x,y,z);group.add(m);return m;}
  const canvas=document.createElement('canvas');canvas.width=canvas.height=128;const c=canvas.getContext('2d');c.fillStyle='#11232d';c.fillRect(0,0,128,128);c.strokeStyle='#274755';c.lineWidth=1;
  for(let x=0;x<=128;x+=16){c.beginPath();c.moveTo(x,0);c.lineTo(x,128);c.moveTo(0,x);c.lineTo(128,x);c.stroke();}c.strokeStyle='#447785';c.strokeRect(0,0,128,128);
  const grid=new THREE.CanvasTexture(canvas);grid.wrapS=grid.wrapT=THREE.RepeatWrapping;grid.repeat.set(12,12);surface.map=grid;
  const floor=box(0,-.08,0,96,.12,96,surface);floor.receiveShadow=true;
  for(const side of [-1,1]){
    box(side*36,5,0,.3,10,76,wallMat);box(0,5,side*36,72,10,.3,wallMat);
    for(let i=-30;i<=30;i+=10){box(side*35.6,4,i,.08,7,.08,dimMat);box(i,4,side*35.6,.08,7,.08,dimMat);}
    box(side*35,1,0,.08,.08,70,lightMat);box(0,1,side*35,70,.08,.08,lightMat);
    box(side*6,.01,0,.04,.02,50,dimMat);
  }
  // A lightweight ceiling frame suggests a closed chamber; the observation camera is inside.
  for(let z=-30;z<=30;z+=10){box(0,10,z,72,.12,.12,dimMat);box(0,9.85,z,18,.035,.06,lightMat);}
  group.add(new THREE.HemisphereLight('#c2edff','#344752',2.5));
  const key=new THREE.DirectionalLight('#c5edff',3);key.position.set(7,12,4);group.add(key,key.target);
  const fill=new THREE.PointLight('#65e6ee',35,35);fill.position.set(-6,5,-4);group.add(fill);
  const lines=new THREE.Group();group.add(lines);const flowMat=new THREE.LineBasicMaterial({color:'#5fc9de',transparent:true,opacity:.25});
  for(let i=0;i<18;i++){const x=(i%6-2.5)*2.6,y=.4+Math.floor(i/6)*.9;const g=new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(x,y,-8),new THREE.Vector3(x,y,-5.8)]);const line=new THREE.Line(g,flowMat);line.userData.phase=i/18;lines.add(line);}
  const contacts=[];
  const ringGeometry=new THREE.RingGeometry(.23,.3,24);
  for(let i=0;i<4;i++){
    const material=new THREE.MeshBasicMaterial({color:'#72e6dc',transparent:true,opacity:.9,side:THREE.DoubleSide});
    const ring=new THREE.Mesh(ringGeometry,material);ring.rotation.x=-Math.PI/2;group.add(ring);
    const arrow=new THREE.ArrowHelper(new THREE.Vector3(1,0,0),new THREE.Vector3(),1,0x72e6dc,.18,.09);group.add(arrow);contacts.push({ring,arrow});
  }
  return{group,setVisible(value){group.visible=value;},update(car,camera,view,stage,viewport){
    group.position.set(car.x,0,car.z);grid.offset.set(car.x/8,-car.z/8);
    // Flow lines visualise only vehicle-relative speed. They do not feed the physics.
    lines.rotation.y=car.a;for(const line of lines.children)line.position.z=(((car.distance/20+line.userData.phase)%1)+1)%1*20-2;
    flowMat.opacity=Math.min(.38,car.speed/200);
    car.wheels.forEach((w,i)=>{
      const contact=contacts[i],s=Math.sin(car.a),c=Math.cos(car.a),x=s*w.l+c*w.x,z=c*w.l-s*w.x;
      const color=w.utilization>=.97?0xff8d83:w.utilization>=.9?0xffcd79:0x72e6dc;
      contact.ring.position.set(x,.035,z);contact.ring.material.color.setHex(color);contact.ring.visible=w.fz>100;
      const a=car.a+w.steer,fx=Math.sin(a)*w.fx+Math.cos(a)*w.fy,fz=Math.cos(a)*w.fx-Math.sin(a)*w.fy,magnitude=Math.hypot(fx,fz);
      contact.arrow.visible=magnitude>50;contact.arrow.position.set(x,.08,z);if(magnitude>50){contact.arrow.setDirection(new THREE.Vector3(fx,0,fz).normalize());contact.arrow.setLength(Math.min(2.5,magnitude/5000),.15,.08);contact.arrow.setColor(color);}
    });
    camera.clearViewOffset();camera.up.set(0,1,0);const distance=Math.max(18,viewport.height/Math.max(90,stage.height)*5);
    const offset=new THREE.Vector3(...(view===1?[14,5,1]:view===2?[.01,20,.01]:[10,8,14])).normalize().multiplyScalar(distance);
    if(view===1)offset.applyAxisAngle(new THREE.Vector3(0,1,0),car.a);if(view===2)camera.up.set(0,0,1);
    camera.position.set(car.x+offset.x,offset.y,car.z+offset.z);camera.lookAt(car.x,.6,car.z);camera.fov=52;
    camera.setViewOffset(viewport.width,viewport.height,0,viewport.height/2-(stage.top+stage.height/2),viewport.width,viewport.height);camera.updateProjectionMatrix();
  }};
}
