const clamp=(v,lo,hi)=>Math.max(lo,Math.min(hi,v));

// Sound-only RPM estimate: the driving model does not simulate a gearbox.
export function engineVoice({speed=0,throttle=0,rearWheelSpeed=0}={}){
  const kmh=Math.abs(speed)*3.6,gear=kmh<2?0:Math.min(8,Math.floor(kmh/44)+1);
  const roadRpm=gear?6500+clamp((kmh-(gear-1)*44)/44,0,1)*6200:3800;
  const spinRpm=3800+clamp(Math.max(0,rearWheelSpeed-Math.abs(speed))/30,0,1)*9000;
  return{gear,rpm:clamp(Math.max(roadRpm,spinRpm,gear?0:3800+throttle*8800),3800,14000),throttle:clamp(throttle,0,1)};
}

export function createEngineAudio({contextFactory=()=>new (globalThis.AudioContext||globalThis.webkitAudioContext)({latencyHint:'interactive'}),onStatus=()=>{}}={}){
  let ctx,master,engineGain,exhaust,mechanical,intake,intakeGain,filter,compressor,enabled=false,unlocked=false,resuming=null;
  let previousGear=0,previousThrottle=0,shiftUntil=0,nextCrackle=0,voice={gear:0,rpm:3800,throttle:0};
  function status(){onStatus({enabled,state:ctx?.state||'uninitialized'});}
  function build(){
    ctx=contextFactory();ctx.onstatechange=status;
    master=ctx.createGain();master.gain.value=0;
    compressor=ctx.createDynamicsCompressor();compressor.threshold.value=-16;compressor.knee.value=12;compressor.ratio.value=5;compressor.attack.value=.003;compressor.release.value=.12;
    master.connect(compressor);compressor.connect(ctx.destination);
    engineGain=ctx.createGain();engineGain.gain.value=0;engineGain.connect(master);
    filter=ctx.createBiquadFilter();filter.type='lowpass';filter.frequency.value=2800;filter.Q.value=.65;filter.connect(engineGain);
    // Two crank revolutions, six uneven exhaust impulses plus short turbulent tails.
    const length=Math.round(ctx.sampleRate*.04),buffer=ctx.createBuffer(1,length,ctx.sampleRate),data=buffer.getChannelData(0);
    let seed=19;const noise=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/2147483648-1;};
    for(let i=0;i<length;i++){
      let t=i/ctx.sampleRate,sum=0;
      for(let pulse=0;pulse<6;pulse++){
        const elapsed=(t-pulse*.04/6+.04)%.04;
        sum+=(1+(pulse%3-1)*.12)*Math.exp(-elapsed*1200)*(Math.sin(elapsed*2*Math.PI*1050)+noise()*.5);
      }
      data[i]=Math.tanh(sum*1.8)*.7;
    }
    exhaust=ctx.createBufferSource();exhaust.buffer=buffer;exhaust.loop=true;exhaust.connect(filter);exhaust.start();
    mechanical=ctx.createOscillator();mechanical.type='sawtooth';const mechanicalGain=ctx.createGain();mechanicalGain.gain.value=.055;mechanical.connect(mechanicalGain);mechanicalGain.connect(filter);mechanical.start();
    const air=ctx.createBuffer(1,ctx.sampleRate,ctx.sampleRate),airData=air.getChannelData(0);for(let i=0;i<airData.length;i++)airData[i]=noise();
    intake=ctx.createBufferSource();intake.buffer=air;intake.loop=true;const intakeFilter=ctx.createBiquadFilter();intakeFilter.type='bandpass';intakeFilter.frequency.value=1500;intakeFilter.Q.value=.7;
    intakeGain=ctx.createGain();intakeGain.gain.value=0;intake.connect(intakeFilter);intakeFilter.connect(intakeGain);intakeGain.connect(engineGain);intake.start();
  }
  function unlock(){
    if(!enabled)return Promise.resolve(false);
    try{
      if(!ctx||ctx.state==='closed')build();
      if(!unlocked){const prime=ctx.createBufferSource();prime.buffer=ctx.createBuffer(1,1,ctx.sampleRate);prime.connect(ctx.destination);prime.start();unlocked=true;}
      if(ctx.state==='running'){status();return Promise.resolve(true);}
      if(!resuming)resuming=Promise.resolve(ctx.resume()).then(()=>{status();return ctx.state==='running';}).catch(()=>{status();return false;}).finally(()=>{resuming=null;});
      return resuming;
    }catch{status();return Promise.resolve(false);}
  }
  function setEnabled(value){enabled=!!value;if(!enabled&&master)master.gain.setTargetAtTime(0,ctx.currentTime,.025);status();return enabled?unlock():Promise.resolve(false);}
  function pop(amount=.1){
    if(!ctx||!enabled||ctx.state!=='running')return;
    const burst=ctx.createBufferSource();burst.buffer=intake.buffer;const gain=ctx.createGain(),low=ctx.createBiquadFilter();low.type='lowpass';low.frequency.value=1600;
    gain.gain.setValueAtTime(amount,ctx.currentTime);gain.gain.exponentialRampToValueAtTime(.001,ctx.currentTime+.065);burst.connect(low);low.connect(gain);gain.connect(master);burst.start();burst.stop(ctx.currentTime+.07);burst.onended=()=>{burst.disconnect();low.disconnect();gain.disconnect();};
  }
  function update({active=false,garage=false,hidden=false,...telemetry}={}){
    if(!ctx)return;voice=engineVoice(telemetry);const now=ctx.currentTime;
    const audible=enabled&&!hidden&&(active||garage);
    master.gain.setTargetAtTime(audible?(garage?.3:.65):0,now,.035);
    if(!audible)return;
    if(active&&previousGear&&voice.gear>previousGear){shiftUntil=now+.075;pop(.09);}
    if(active&&previousThrottle>.6&&voice.throttle<.15&&voice.rpm>7000&&now>nextCrackle){pop(.12);nextCrackle=now+.3;}
    previousGear=voice.gear;previousThrottle=voice.throttle;
    const rpm=garage?3800:voice.rpm;
    exhaust.playbackRate.setTargetAtTime(rpm/3000,now,.045);
    mechanical.frequency.setTargetAtTime(rpm/60,now,.05);
    filter.frequency.setTargetAtTime(1700+voice.throttle*4300,now,.07);
    intakeGain.gain.setTargetAtTime(.015+voice.throttle*.12,now,.05);
    engineGain.gain.setTargetAtTime((.25+voice.throttle*.35)*(now<shiftUntil?.25:1),now,.018);
  }
  function beep(frequency,duration){
    if(!enabled||ctx?.state!=='running')return;
    const o=ctx.createOscillator(),g=ctx.createGain();o.frequency.value=frequency;g.gain.setValueAtTime(.12,ctx.currentTime);g.gain.exponentialRampToValueAtTime(.001,ctx.currentTime+duration);o.connect(g);g.connect(compressor);o.start();o.stop(ctx.currentTime+duration);o.onended=()=>{o.disconnect();g.disconnect();};
  }
  return{setEnabled,unlock,update,beep,get enabled(){return enabled;},get state(){return ctx?.state||'uninitialized';},get telemetry(){return{...voice};},async dispose(){enabled=false;if(ctx&&ctx.state!=='closed')await ctx.close();status();}};
}
