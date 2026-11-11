const pct=x=>`${(x*100).toFixed(0)}%`,num=(x,d=1)=>Number.isFinite(x)?x.toFixed(d):'—';
const meter=(id,label)=>`<label class="lab-meter"><span>${label}</span><b data-lab="${id}">0%</b><i><em data-meter="${id}"></em></i></label>`;
const metric=(id,label,unit='')=>`<div class="lab-metric"><span>${label}</span><b data-lab="${id}">—</b><small>${unit}</small></div>`;
export function createLabPanel(root){
  // Native scrolling cannot reliably begin with a second finger while a captured
  // driving pointer is held. Keep panel dragging independent of the controls.
  let scrollPointer=null,startY=0,startScroll=0;
  root.addEventListener('pointerdown',e=>{
    if(e.pointerType==='mouse'||scrollPointer!==null||e.target.closest('input,button,summary,a,.lab-assist'))return;
    e.preventDefault();scrollPointer=e.pointerId;startY=e.clientY;startScroll=root.scrollTop;root.setPointerCapture(e.pointerId);
  });
  root.addEventListener('pointermove',e=>{if(e.pointerId!==scrollPointer)return;e.preventDefault();root.scrollTop=startScroll+startY-e.clientY;});
  function cancelScroll(){const id=scrollPointer;scrollPointer=null;if(id!==null&&root.hasPointerCapture(id))root.releasePointerCapture(id);}
  const endScroll=e=>{if(e.pointerId===scrollPointer)cancelScroll();};
  for(const name of ['pointerup','pointercancel','lostpointercapture'])root.addEventListener(name,endScroll);

  root.innerHTML=`<div class="lab-heading"><div><span class="lab-eyebrow">APEX / VEHICLE DYNAMICS</span><h2>風洞實驗室 <small>WIND TUNNEL LAB</small></h2></div><span class="lab-live" data-lab="live">手動觀測</span></div>
  <div class="lab-summary"><div class="lab-speed"><b data-lab="speed">0</b><span>km/h</span></div><div class="lab-status-stack"><strong data-lab="status">等待物理取樣</strong><span data-lab="onset">從靜止開始 · 手動操作</span></div><div class="lab-quick-slip"><span>前 |κ| / |α| <b data-lab="quickFront">0%</b></span><span>後 |κ| / |α| <b data-lab="quickRear">0%</b></span><span>下壓力 <b data-lab="quickAero">0 kN</b></span></div><label class="lab-assist"><input type="checkbox" id="labFriendly" checked>友善煞車</label><label class="lab-assist"><input type="checkbox" id="labAssist">ABS / TCS</label></div>
  <p class="lab-scroll-hint">面板可上下滑動 · 操作 / 空力 / 車身動態 ↓</p><div class="lab-grid">
    <article class="lab-card lab-inputs"><h3>01 / 操作與動力</h3>${meter('gas','油門')}${meter('brake','煞車')}${meter('steering','方向 · 右＋')}${meter('ers','ERS 電量')}<div class="lab-inline"><span data-lab="boost">ERS 待命</span><span data-lab="intervention">ABS / TCS 關閉</span></div></article>
    <article class="lab-card lab-aero"><h3>02 / 空力與載重</h3><div class="lab-metrics">${metric('downforce','下壓力','kN')}${metric('drag','縱向風阻','kN')}${metric('frontLoad','前軸載重','kN')}${metric('rearLoad','後軸載重','kN')}</div><div class="lab-load-split"><span data-lab="loadSplit">前 — / 後 —</span><i><em data-meter="frontLoad"></em></i></div><canvas id="labTrend" aria-label="最近八秒前軸載重比例趨勢"></canvas><small class="lab-caption">前軸載重占比 · 最近 8 秒 · 0–100%</small></article>
    <article class="lab-card lab-axles"><h3>03 / 前後軸滑移</h3><div class="lab-axle-row"><span>前輪</span><b data-lab="frontSlip">0%</b><small>最大 |κ|</small><strong data-lab="frontState">正常</strong></div><div class="lab-axle-row"><span>後輪</span><b data-lab="rearSlip">0%</b><small>最大 |κ|</small><strong data-lab="rearState">正常</strong></div><div class="lab-inline"><span>前 |α| <b data-lab="frontAlpha">0°</b></span><span>後 |α| <b data-lab="rearAlpha">0°</b></span></div><strong class="lab-balance" data-lab="balance">穩定</strong><small class="lab-caption">相對側偏判讀，非實車校準</small></article>
    <article class="lab-card lab-wheels"><h3>04 / 四輪接地 · 實際力容量使用率</h3><div class="lab-wheel-grid">${['FL','FR','RL','RR'].map(id=>`<section class="lab-wheel" data-wheel="${id}"><div class="lab-wheel-top"><strong>${id}</strong><b data-value="load">— kN</b><span data-value="state">正常</span></div><div class="lab-wheel-usage"><b data-value="usage">0%</b><small data-value="demand">需求 0%</small><i><em></em></i></div><dl><div><dt>κ</dt><dd data-value="ratio">—</dd></div><div><dt>α 左＋</dt><dd data-value="angle">—</dd></div><div><dt>滑速</dt><dd data-value="slipSpeed">—</dd></div><div><dt>有效 μ</dt><dd data-value="mu">—</dd></div></dl><small data-value="surface">測試柏油</small></section>`).join('')}</div></article>
    <article class="lab-card lab-dynamics"><h3>05 / 車身動態</h3><div class="lab-metrics">${metric('ax','縱向加速度','g · 前＋')}${metric('ay','橫向加速度','g · 左＋')}${metric('yaw','偏航角速度','°/s · 左＋')}${metric('beta','車身側滑角 β','° · 左＋')}${metric('actualSteer','實際前輪中央轉角','° · 右＋')}${metric('steerError','目標 − 實際轉角','° · 右＋')}</div><div class="lab-inline"><span data-lab="gripBalance">前後抓地容量 —</span></div></article>
  </div><details class="lab-notes"><summary>資料與判讀依據 / 讀取更多輪胎力</summary><p>120 Hz 車體、240 Hz 輪胎求解；面板約 12 Hz 更新。固定乾柏油、無護欄、無自動復位，與比賽共用輪胎與空力模型。流線僅為視覺示意，沒有 CFD。</p><p>κ 是有正負號的縱向滑移率；α 是側偏角。前後軸大數字為最大 |κ|，|α| 為兩輪絕對值平均。使用率 ≥90% 標記接近極限。打滑：有載重且縱向 |κ| >12% 並有接地／滑動速度，或使用率 >90%、|α| >5°、橫滑速 >0.8 m/s。轉向不足／過度傾向需轉彎且前／後軸側滑、平均 |α| 比另一軸高逾 2°；只提供當下傾向，不是經過校準的車輛穩定性判定。</p><p>下壓力、阻力與載重取自同一次輪胎子步進。ABS／TCS 依實際扭矩削減判定。κ 在低於 3 m/s 使用正則化分母；低速比值須搭配滑速閱讀。抓地平衡是前後軸可用合成力容量占比。</p><div class="lab-force-details" data-lab="forces"></div></details>`;
  const nodes=Object.fromEntries([...root.querySelectorAll('[data-lab]')].map(n=>[n.dataset.lab,n]));
  const meters=Object.fromEntries([...root.querySelectorAll('[data-meter]')].map(n=>[n.dataset.meter,n]));
  const wheelNodes=[...root.querySelectorAll('[data-wheel]')].map(n=>({node:n,values:Object.fromEntries([...n.querySelectorAll('[data-value]')].map(e=>[e.dataset.value,e])),bar:n.querySelector('.lab-wheel-usage em')}));
  const set=(id,value)=>{nodes[id].textContent=value;};
  function state(node,text,level){node.textContent=text;node.dataset.level=level;}
  return{cancelScroll,friendly:root.querySelector('#labFriendly'),assist:root.querySelector('#labAssist'),update(t,{paused=false,view='觀測'}={}){
    set('speed',num(t.speed,0));state(nodes.quickFront,pct(t.front.slipRatio)+' / '+num(t.front.slipAngle)+'°',t.front.sliding?'danger':t.front.peakUsage>=.9?'warning':'normal');state(nodes.quickRear,pct(t.rear.slipRatio)+' / '+num(t.rear.slipAngle)+'°',t.rear.sliding?'danger':t.rear.peakUsage>=.9?'warning':'normal');set('quickAero',num(t.downforce/1000,2)+' kN');set('live',paused?'已暫停 · 數據凍結':`模擬 ${num(t.time,1)} s · ${view}`);
    state(nodes.status,t.sliding?`打滑 / ${t.slidingWheels.join(' · ')}`:t.nearLimit?`接近極限 / ${t.nearWheels.join(' · ')}`:'抓地穩定',t.sliding?'danger':t.nearLimit?'warning':'normal');
    set('onset',t.onset?`本次最先滑移 ${t.onset.wheels.join(' / ')} · ${num(t.onset.time,2)} s`:'手動操控 · 固定柏油測試表面');
    for(const [key,value]of [['gas',t.gas],['brake',t.brake],['steering',t.steering],['ers',t.ers/100]]){set(key,pct(value));meters[key].style.width=pct(Math.min(1,Math.abs(value)));}
    set('boost',t.boost?'ERS 釋放中':'ERS 待命');state(nodes.intervention,t.brakeAid?'友善煞車調節中':!t.assist?'ABS / TCS 關閉':`${t.abs?'ABS 介入':'ABS 待命'} / ${t.tcs?'TCS 介入':'TCS 待命'}`,t.abs||t.tcs?'warning':'normal');
    for(const [key,value]of [['downforce',t.downforce/1000],['drag',Math.abs(t.dragLong)/1000],['frontLoad',t.front.load/1000],['rearLoad',t.rear.load/1000]])set(key,num(value,2));
    set('loadSplit',`前 ${pct(t.frontLoadShare)} / 後 ${pct(1-t.frontLoadShare)}`);meters.frontLoad.style.width=pct(t.frontLoadShare);
    for(const [name,a]of [['front',t.front],['rear',t.rear]]){set(name+'Slip',pct(a.slipRatio));set(name+'Alpha',num(a.slipAngle)+'°');state(nodes[name+'State'],a.sliding?'滑移':a.peakUsage>=.9?'近極限':'正常',a.sliding?'danger':a.peakUsage>=.9?'warning':'normal');}
    state(nodes.balance,t.balance,t.balanceLevel);
    for(let i=0;i<t.wheels.length;i++){
      const w=t.wheels[i],n=wheelNodes[i],v=n.values;v.load.textContent=num(w.load/1000,2)+' kN';v.usage.textContent=pct(w.usage);v.demand.textContent='需求 '+pct(w.demandRatio);n.bar.style.width=pct(Math.min(1,w.usage));
      const flags=[w.locked?'鎖死':'',w.spin?'空轉':'',w.brakeAid?'友善煞車':'',w.abs?'ABS':'',w.tcs?'TCS':'',w.sliding?'滑移':''].filter(Boolean);
      state(v.state,w.load<=100?'卸載':flags.length?flags.join(' / '):w.usage>=.9?'近極限':'正常',w.sliding||w.locked?'danger':w.load<=100||w.usage>=.9?'warning':'normal');n.node.dataset.level=v.state.dataset.level;
      v.ratio.textContent=pct(w.slipRatio);v.angle.textContent=num(w.slipAngle)+'°';v.slipSpeed.textContent=num(w.slipSpeed)+' m/s';v.mu.textContent=num(w.effectiveMu,2);v.surface.textContent=`測試${w.surface} · 載重 μ${num(w.mu,2)}`;
    }
    for(const [key,value]of [['ax',t.ax/9.81],['ay',t.ay/9.81],['yaw',t.yaw],['beta',t.beta],['actualSteer',t.steeringActual],['steerError',t.steeringTarget-t.steeringActual]])set(key,num(value,2));
    set('gripBalance',`抓地容量 前 ${pct(t.frontGripShare)} / 後 ${pct(1-t.frontGripShare)}`);
    set('forces',t.wheels.map(w=>`${w.id}：Fx ${num(w.fx,0)} N / Fy ${num(w.fy,0)} N / 容量 ${num(w.capacity,0)} N / 需求 ${pct(w.demandRatio)} / 原始踏板保守門檻 ${w.brakeHeadroom>=1?'≥100%':pct(w.brakeHeadroom)} / 輪角 ${num(w.angle)}° / 滑速 ${num(w.slipSpeed)} m/s / κ ${pct(w.slipRatio)} / α ${num(w.slipAngle)}° / 有效 μ ${num(w.effectiveMu,2)}`).join('\n'));
    const canvas=root.querySelector('#labTrend'),ctx=canvas.getContext('2d');canvas.width=300;canvas.height=26;ctx.clearRect(0,0,300,26);ctx.strokeStyle='#ffffff20';ctx.beginPath();ctx.moveTo(0,13);ctx.lineTo(300,13);ctx.stroke();
    if(t.history.length>1){ctx.strokeStyle='#7be5e9';ctx.lineWidth=2;ctx.beginPath();t.history.forEach((p,i)=>{const x=300*(1-(t.time-p.time)/8),y=25-p.frontLoad*24;i?ctx.lineTo(x,y):ctx.moveTo(x,y);});ctx.stroke();}
  }};
}
