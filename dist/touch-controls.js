// Each control owns one pointer until that same pointer ends or is cancelled.
export function bindTouchControls({gas,brake,boost,steer,track,knob,onChange}){
  const state={gas:0,brake:0,boost:false,steer:0},owners=new Map(),bindings=[];
  const clamp=(v,lo,hi)=>Math.max(lo,Math.min(hi,v));
  function draw(){
    for(const [name,node] of [['gas',gas],['brake',brake]]){
      node.style.setProperty('--pedal',`${state[name]*100}%`);
      node.querySelector('small').textContent=`${Math.round(state[name]*100)}%`;
      node.classList.toggle('pressed',owners.has(name));
    }
    boost.classList.toggle('pressed',state.boost);knob.style.left=`${50+state.steer*46}%`;onChange({...state});
  }
  function value(name,node,e){
    if(name==='boost')state.boost=true;
    else if(name==='steer'){const r=track.getBoundingClientRect();state.steer=clamp((e.clientX-r.left-r.width/2)/(r.width*.47),-1,1);}
    else{const r=node.getBoundingClientRect();state[name]=clamp((r.bottom-8-e.clientY)/Math.max(1,r.height-16),0,1);}
  }
  for(const [name,node]of [['gas',gas],['brake',brake],['boost',boost],['steer',steer]]){
    const down=e=>{
      e.preventDefault();if(owners.has(name)||[...owners.values()].includes(e.pointerId))return;
      if(e.pointerType==='mouse'&&e.button!==0)return;
      owners.set(name,e.pointerId);
      try{node.setPointerCapture(e.pointerId);}catch{owners.delete(name);return;}
      value(name,node,e);draw();
    };
    const move=e=>{if(owners.get(name)!==e.pointerId)return;e.preventDefault();value(name,node,e);draw();};
    const end=e=>{
      if(owners.get(name)!==e.pointerId)return;
      owners.delete(name);state[name]=name==='boost'?false:0;
      if(node.hasPointerCapture(e.pointerId))node.releasePointerCapture(e.pointerId);
      draw();
    };
    const context=e=>e.preventDefault();
    for(const [type,fn]of [['pointerdown',down],['pointermove',move],['pointerup',end],['pointercancel',end],['lostpointercapture',end],['contextmenu',context]]){
      node.addEventListener(type,fn,{passive:false});bindings.push([node,type,fn]);
    }
  }
  function reset(){
    const held=[...owners];owners.clear();
    for(const [name,id]of held){const node={gas,brake,boost,steer}[name];if(node.hasPointerCapture(id))node.releasePointerCapture(id);}
    Object.assign(state,{gas:0,brake:0,boost:false,steer:0});draw();
  }
  draw();return{reset,get state(){return{...state};},dispose(){reset();for(const [node,type,fn]of bindings)node.removeEventListener(type,fn);}};
}
