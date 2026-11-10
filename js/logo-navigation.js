/* CLEAR ORBIT v1.47 — one actual SH 3D logo, fixed to the camera after
   PROFILE -> EXPLORE. No replica image, no duplicate WebGL renderer.
   CONTACT shortcut uses only approved PDF p.18 email/phone content.
*/
(() => {
  'use strict';
  const ui = document.getElementById('orbit-logo-ui');
  const personalMark = document.getElementById('orbit-personal-logo');
  const USE_2D_LOGO = !!personalMark; // Preserve the existing DOM-logo route for Celestial.
  // v1.50.100: a single shared intro-glow clock controls the logo reveal.
  // The first visible logo pixel coincides with the white wash entering its
  // logo area (70% of the accelerated glow); it finishes at the actual peak.
  // Keep the mark at full opacity in LOGO_REVEAL; never restart a second fade.
  const INTRO_GLOW_PEAK_SEC=1.90;
  // v1.50.105: half the previous fade (0.285s); start close to the peak, not at 70%.
  const INTRO_LOGO_FADE_START_SEC=INTRO_GLOW_PEAK_SEC-(INTRO_GLOW_PEAK_SEC*.3)/2;
  const INTRO_LOGO_FADE_END_SEC=INTRO_GLOW_PEAK_SEC;

  const toggle = document.getElementById('orbit-logo-toggle');
  const menu = document.getElementById('orbit-logo-menu');
  const toProfile = document.getElementById('orbit-logo-profile');
  const toContact = document.getElementById('orbit-logo-contact');
  const contact = document.getElementById('orbit-contact-direct');
  const profile = document.getElementById('profile');
  const explore = document.getElementById('explore');
  if(!ui || !toggle || !menu || !toProfile || !toContact || !contact || !profile || !explore)return;
  const PROFILE = {cx:720,cy:141,width:208};
  // v1.45: align the real GLB with the orange target area (original stage coordinates).
  // Preserve its v1.44 width and X position; adjust its vertical centering only.
  const EXPLORE = {cx:256,cy:66,width:132};
  let api=null, shader=null, cameraAttached=false;
  let mode='intro', isOpen=false, hovered=false;
  // The 2D/3D logo is a menu trigger ONLY after Explore has appeared and
  // its motion to the approved top-left corner has fully completed.
  let logoInteractive=false;
  let tween=null, cx=PROFILE.cx, cy=PROFILE.cy, width=PROFILE.width;
  let intensity=0;
  // Rotate the ORIGINAL SH GLB fit pivot; its existing camera placement/tilt is untouched.
  const introLogoHit=document.createElement('div');
  introLogoHit.className='orbit-intro-logo-drag-target';introLogoHit.hidden=true;
  introLogoHit.setAttribute('aria-label','3D 로고 드래그하여 회전');
  document.getElementById('stage')?.appendChild(introLogoHit);
  const logoDrag={id:null,lastX:0,lastY:0,startX:0,startY:0,moved:false,suppressUntil:0,base:null,returning:null};
  function bindLogoDrag(element){
    if (USE_2D_LOGO) return; // A flat symbol is not an interactive 3D object.
    element.addEventListener('pointerdown',e=>{
      if(e.button!==0 || !api?.logo?.isLoaded)return;
      logoDrag.id=e.pointerId;logoDrag.lastX=logoDrag.startX=e.clientX;
      logoDrag.lastY=logoDrag.startY=e.clientY;logoDrag.moved=false;
      logoDrag.returning=null;
      logoDrag.base=api.logo.fit ? {x:api.logo.fit.rotation.x,y:api.logo.fit.rotation.y,z:api.logo.fit.rotation.z}:null;
      try{element.setPointerCapture(e.pointerId);}catch(_err){}
    });
    element.addEventListener('pointermove',e=>{
      if(logoDrag.id!==e.pointerId)return;
      const dx=e.clientX-logoDrag.lastX,dy=e.clientY-logoDrag.lastY;
      if(Math.hypot(e.clientX-logoDrag.startX,e.clientY-logoDrag.startY)>5)logoDrag.moved=true;
      if(logoDrag.moved && api?.logo?.fit){
        const scale=Math.max(.1,parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--s'))||1);
        api.logo.fit.rotation.y+=dx/scale*.009;
        api.logo.fit.rotation.x=Math.max(-Math.PI*.45,Math.min(Math.PI*.45,api.logo.fit.rotation.x+dy/scale*.007));
        e.preventDefault();
      }
      logoDrag.lastX=e.clientX;logoDrag.lastY=e.clientY;
      // Continue rotating outside the visible logo while pointer capture
      // is held. Only an actual mouse-button release ends the drag.
    });
    function release(e){
      if(logoDrag.id!==e.pointerId)return;
      if(logoDrag.moved){logoDrag.suppressUntil=performance.now()+250;setMenu(false);}
      if(logoDrag.base && api?.logo?.fit){
        logoDrag.returning={fromX:api.logo.fit.rotation.x,fromY:api.logo.fit.rotation.y,
          fromZ:api.logo.fit.rotation.z,to:logoDrag.base,start:performance.now(),duration:650};
      }
      logoDrag.base=null;logoDrag.id=null;
      try{if(element.hasPointerCapture(e.pointerId))element.releasePointerCapture(e.pointerId);}catch(_err){}
    }
    element.addEventListener('pointerup',release);
    element.addEventListener('pointercancel',release);
    element.addEventListener('lostpointercapture',release);
  }
  bindLogoDrag(toggle);
  bindLogoDrag(introLogoHit);

  let satellite=null, loadingSatellite=false;
  let satellitePhase='hidden', satelliteStart=0, satelliteMotion=0;
  let satelliteProgress=0, satelliteReverseStart=1;
  let satelliteShiftProgress=0, satelliteShiftAtReturn=1;
  // v1.47.3: location/attitude beats digitized from the actual storyboard
  // 01_MAIN_FLOW.pdf pp.13–15 at design resolution 1440 x 1024.
  // p13: body cropped on the lower-right; dark back of solar array prominent.
  // p14: rear-side, rising along the right edge; p15: face/panels centered right.
  // The first waypoint sits fully outside the entire viewport (not a pop-in).
  const SAT_WAIT={x:265,y:42}, SAT_END={x:435,y:38};
  const SAT_FLIGHT_MS=2050; // v1.49.8: 39% shorter entry AND reverse; storyboard flight path unchanged
  const SAT_SHIFT_MS=1300;
  const CONTACT_PANEL_MS=660;
  const SAT_BASE_MODEL_YAW=-Math.PI/2;
  // The back must be seen at the FIRST VISIBLE frame, unlike v1.47.2's
  // wrong front/underside-facing entry. Turn toward approved p15 pose.
  const SAT_REAR_YAW=-Math.PI;
  const SAT_REAR_RELEASE_START=.28;
  const SAT_REAR_RELEASE_END=.97;
  const SAT_RECEIVED_YAW=.95;
  let satelliteFacing=null;
  const SAT_FRAMES=[
    {t:0.00,x:1100,y:-765,rx:-.035,ry:.16,rz:-.47}, // completely off right/bottom
    {t:0.28,x:650,y:-400,rx:-.055,ry:1.90,rz:-.44}, // p.13 rear/bottom-right (body ~1370,912)
    {t:0.64,x:575,y:-95,rx:-.09,ry:.80,rz:-.42},  // p.14 angled at (1295,607)
    {t:1.00,x:265,y:42,rx:-.12,ry:.32,rz:-.15}    // p.15 front at (985,470)
  ];
  function flightValue(t,key){
    const p=clamp01(t);
    let i=0;
    while(i<SAT_FRAMES.length-2 && p>SAT_FRAMES[i+1].t)i++;
    const a=SAT_FRAMES[i],b=SAT_FRAMES[i+1];
    const before=SAT_FRAMES[Math.max(0,i-1)],after=SAT_FRAMES[Math.min(SAT_FRAMES.length-1,i+2)];
    const span=b.t-a.t, u=(p-a.t)/span, u2=u*u, u3=u2*u;
    // Time-aware Hermite: continuous tangents without pauses at p.13/p.14.
    const v0=(b[key]-before[key])/(b.t-before.t);
    const v1=(after[key]-a[key])/(after.t-a.t);
    return (2*u3-3*u2+1)*a[key]+(u3-2*u2+u)*span*v0+
      (-2*u3+3*u2)*b[key]+(u3-u2)*span*v1;
  }
  function setSatelliteFacing(progress){
    if(!satelliteFacing)return;
    const u=clamp01((progress-SAT_REAR_RELEASE_START)/
      (SAT_REAR_RELEASE_END-SAT_REAR_RELEASE_START));
    // At entry: -90° -180° (rear visible). At CONTACT: original -90°.
    // Release with a continuous ease (no orientation jump at storyboard beats).
    satelliteFacing.rotation.y=SAT_BASE_MODEL_YAW+SAT_REAR_YAW*(1-satEase(u));
  }
  function flightPose(progress){
    if(!satellite)return;
    satelliteProgress=clamp01(progress);
    setSatelliteFacing(satelliteProgress);
    positionSatellite(flightValue(satelliteProgress,'x'),flightValue(satelliteProgress,'y'));
    satellite.rotation.set(flightValue(satelliteProgress,'rx'),flightValue(satelliteProgress,'ry'),flightValue(satelliteProgress,'rz'));
  }
  const stageNode=document.getElementById('stage');
  const satelliteUI=document.createElement('section');
  satelliteUI.className='orbit-satellite-ui';
  satelliteUI.hidden=true;
  satelliteUI.setAttribute('aria-label','CONTACT CHANNEL');
  satelliteUI.innerHTML=`
    <div class="orbit-satellite-channel" aria-live="polite">
      <strong>CONTACT CHANNEL</strong>
      <p>신호 대기 중<span class="orbit-wait-dots" aria-hidden="true"><i>.</i><i>.</i><i>.</i></span></p>
      <small>위성을 눌러 연락처를 확인해 보세요.</small>
    </div>
    <div class="orbit-satellite-beep" aria-hidden="true">Beep, Beep...</div>
    <button type="button" class="orbit-satellite-hit" aria-label="인공위성 클릭하여 연락처 확인"></button>`;
  stageNode?.appendChild(satelliteUI);
  const satelliteHit=satelliteUI.querySelector('.orbit-satellite-hit');
  const satEase=t=>t*t*(3-2*t);
  const reduceMotion=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const lerp=(a,b,t)=>a+(b-a)*t;
  const clamp01=x=>Math.max(0,Math.min(1,x));
  const smooth=t=>t*t*(3-2*t);

  function setMenu(open){
    if(open && !logoInteractive)return;
    isOpen=!!open;
    ui.classList.toggle('is-open',isOpen);
    toggle.setAttribute('aria-expanded',String(isOpen));
    toggle.setAttribute('aria-label',isOpen?'개인 로고 메뉴 닫기':'개인 로고 메뉴 열기');
    if(!isOpen && menu.contains(document.activeElement))toggle.focus();
  }
  function move(target,duration){
    tween={fromX:cx,fromY:cy,fromW:width,toX:target.cx,toY:target.cy,toW:target.width,
      begun:performance.now(),duration:reduceMotion?0:duration};
    // During motion only the GLB moves: hit area follows its actual projected center.
  }
  function cameraAnchor(){
    if(cameraAttached || !api?.logo || !api?.stage)return;
    const cam=api.stage.camera, scene=api.stage.scene;
    // In Three.js, the camera must be in the scene if it owns rendered children.
    if(cam.parent!==scene)scene.add(cam);
    cam.add(api.logo.root);
    cameraAttached=true;
    window.__CLEAR_ORBIT_LOGO_NAV_ACTIVE=true;
    api.logo.applyTransform();
    api.logo.root.position.z=-api.stage.metrics.camDistance;
    api.logo.root.visible=true;
  }
  function addGlow(){
    if(!api || shader || USE_2D_LOGO)return;
    const THREE=window.__ORBIT_3D_LIB;
    if(!THREE)return;
    const geometry=new THREE.BufferGeometry();
    // A real 3D plane BEHIND the centered GLB (negative camera-local z).
    geometry.setAttribute('position',new THREE.BufferAttribute(new Float32Array([
      -1.42,-1.12,-.80, 1.42,-1.12,-.80, 1.42,1.12,-.80,
      -1.42,-1.12,-.80, 1.42,1.12,-.80, -1.42,1.12,-.80
    ]),3));
    geometry.setAttribute('uv',new THREE.BufferAttribute(new Float32Array([
      0,0, 1,0, 1,1, 0,0, 1,1, 0,1
    ]),2));
    shader=new THREE.ShaderMaterial({
      uniforms:{uStrength:{value:0}},
      vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
      fragmentShader:`varying vec2 vUv;uniform float uStrength;
        void main(){vec2 p=(vUv-.5)*vec2(1.0,1.24);float r=length(p);
          float core=exp(-r*r*80.0)*.56;
          float outer=exp(-r*r*32.0)*.27;
          float halo=(core+outer)*uStrength;
          gl_FragColor=vec4(vec3(1.0),halo);
        }`,
      transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,depthTest:true
    });
    const mesh=new THREE.Mesh(geometry,shader);
    // The model masks the upper-left of the original glow, making the visible
    // light appear bottom-right. Compensate towards the SH mark's optical center.
    mesh.position.set(-.20,.22,0);
    mesh.name='SH-logo-behind-white-hover-glow';
    mesh.frustumCulled=false;
    mesh.renderOrder=-7;
    api.logo.root.add(mesh);
  }
  // v1.47.6 — no satellite background picture, JPG, PNG, plane or scene.background swap.
  // The same procedural 3D galaxy remains continuously rendered by explore.js
  // in Explore, satellite arrival, CONTACT and reverse-scrolling states.
  function setSatelliteBackground(visible){
    window.__CLEAR_ORBIT_SATELLITE_BG_ACTIVE=false;
    window.__CLEAR_ORBIT_SATELLITE_BG_READY=false;
    window.__CLEAR_ORBIT_SATELLITE_BG_BLEND=0;
  }
  // Three.js camera-facing broadcast, widening to the ~535px cyan sector.
  // Coordinates are native storyboard 1440x1024, not browser screenshot pixels.
  function updateSatelliteRadio(now){
    window.ClearOrbitVisuals?.updateRadio(now, satellite, satellitePhase,
      satelliteUI.classList.contains('is-transmitting'), api);
  }
  async function ensureSatellite(){
    if(satellite || loadingSatellite || !api)return;
    const b64=window.__ORBIT_SATELLITE_GLB_B64__;
    const THREE=window.__ORBIT_3D_LIB;
    if(!b64 || !THREE)return;
    loadingSatellite=true;
    try{
      const binary=atob(b64),bytes=new Uint8Array(binary.length);
      for(let i=0;i<binary.length;i++)bytes[i]=binary.charCodeAt(i);
      const loader=new THREE.GLTFLoader();
      loader.setMeshoptDecoder(THREE.MeshoptDecoder);
      const gltf=await loader.parseAsync(bytes.buffer,'');
      const model=gltf.scene;
      window.ClearOrbitVisuals?.finishSatellite(model, api);
      const box=new THREE.Box3().setFromObject(model);
      const bbox=box.getSize(new THREE.Vector3());
      const center=box.getCenter(new THREE.Vector3());
      model.position.sub(center);
      // v1.47.1: turn the real GLB 90 degrees LEFT around its own vertical
      // axis. Keep the flight/CONTACT rotation on the outer group untouched:
      // otherwise flightPose(), waiting and received would overwrite the fix.
      // A centered child pivot avoids shifting the satellite on-screen.
      const modelFacing=new THREE.Group();
      modelFacing.name='Satellite-model-left-yaw-90deg';
      modelFacing.rotation.y=SAT_BASE_MODEL_YAW;
      modelFacing.add(model);
      satelliteFacing=modelFacing;
      const group=new THREE.Group();
      group.name='Contact-approved-real-satellite-GLB';
      group.add(modelFacing);
      group.scale.setScalar(390/Math.max(bbox.x,bbox.y,bbox.z,0.001));
      group.rotation.set(-.12,.32,-.15);
      group.visible=(mode==='contact' || (satellitePhase!=='hidden' && satellitePhase!=='loading'));
      api.stage.camera.add(group);
      satellite=group;
      satellite.position.set(340,5,-api.stage.metrics.camDistance);
    }catch(err){console.error('[CONTACT] original satellite GLB load failed',err);}
    finally{loadingSatellite=false;}
  }
  function positionSatellite(x,y){
    if(!satellite || !api)return;
    satellite.position.set(x,y,-api.stage.metrics.camDistance);
    satelliteUI.style.setProperty('--satellite-screen-x',(720+x)+'px');
    satelliteUI.style.setProperty('--satellite-screen-y',(512-y)+'px');
    const focus=document.querySelector('.orbit-contact-focus-backdrop.is-story');
    if(focus){focus.style.setProperty('--focus-satellite-x',(720+x)+'px');focus.style.setProperty('--focus-satellite-y',(512-y)+'px');}
    // The real antenna tip is left and above the centered body (pink user markup).
    satelliteUI.style.setProperty('--satellite-emitter-x',(720+x-32)+'px');
    satelliteUI.style.setProperty('--satellite-emitter-y',(512-y-54)+'px');
  }
  function startWaiting(){
    satellitePhase='waiting';satelliteProgress=1;satelliteMotion=performance.now();
    setSatelliteFacing(1);
    satelliteUI.hidden=false;
    satelliteUI.classList.remove('is-waiting','is-shifting','is-received','is-reversing','is-transmitting');
    requestAnimationFrame(()=>requestAnimationFrame(()=>{
      if(satellitePhase==='waiting'){
        satelliteUI.classList.add('is-waiting');
        // Arrival transmission is immediate; the channel text keeps its original fade-in.
        satelliteUI.classList.add('is-transmitting');
      }
    }));
    satelliteUI.classList.add('is-transmitting');
    satelliteHit.disabled=false;
    positionSatellite(SAT_WAIT.x,SAT_WAIT.y);
    window.__CLEAR_ORBIT_STATE='CONTACT_WAIT';
  }
  async function startSatellite(){
    if(satellitePhase!=='hidden')return;
    satellitePhase='loading';
    await ensureSatellite();
    if(satellitePhase!=='loading')return;
    if(!satellite){
      satellitePhase='hidden';
      console.error('[CONTACT] satellite GLB is unavailable. Returning to Explore.');
      window.ClearOrbitExplore?.leaveSatellite?.();
      return;
    }
    setSatelliteBackground(true);
    satellitePhase='approach';satelliteProgress=0;satelliteStart=performance.now();
    satellite.visible=true;
    satelliteUI.hidden=true;
    satelliteUI.classList.remove('is-waiting','is-reversing');
    // Pre-mount the entire card *outside* the stage; it only moves after
    // the satellite's rightward turn has COMPLETELY finished.
    contact.classList.add('is-story');
    contact.classList.remove('is-visible');
    prepareContactText(contact); // blank BEFORE this card is mounted/painted
    contact.hidden=false;
    flightPose(0);
  }
  function stopSatellite(){
    pendingBackPhase=null;
    window.ClearOrbitVisuals?.cancelRadioFade();
    setSatelliteBackground(mode==='contact');
    satellitePhase='hidden';satelliteProgress=0;
    setSatelliteFacing(1);
    satelliteUI.hidden=true;
    satelliteUI.classList.remove('is-waiting','is-shifting','is-received','is-reversing','is-transmitting');
    satelliteHit.disabled=true;
    contact.classList.remove('is-visible','is-story');
    contact.hidden=true;
    if(satellite)satellite.visible=(mode==='contact');
  }
  function selectSatellite(){
    if(satellitePhase!=='waiting')return;
    satellitePhase='shift';satelliteMotion=performance.now();satelliteShiftProgress=0;
    satelliteHit.disabled=true;
    satelliteUI.classList.remove('is-transmitting');
    satelliteUI.classList.add('is-shifting');
    window.__CLEAR_ORBIT_STATE='CONTACT_TRANSITION';
  }
  function reverseFlight(){
    if(satellitePhase==='reverse'||satellitePhase==='radio-exit')return true;
    if(window.ClearOrbitVisuals?.radioIsClear())return beginReverseFlight();
    satellitePhase='radio-exit';satelliteUI.classList.remove('is-transmitting');satelliteHit.disabled=true;
    window.ClearOrbitVisuals?.beginRadioFade();
    return true;
  }
  function beginReverseFlight(){
    if(satellitePhase==='reverse')return true;
    satelliteReverseStart=satellitePhase==='waiting'?1:satelliteProgress;
    satellitePhase='reverse';satelliteStart=performance.now();
    // Let the CHANNEL and radio fade out during the first reverse frames.
    satelliteUI.classList.remove('is-waiting','is-shifting');
    satelliteUI.classList.add('is-reversing');
    setTimeout(()=>{if(satellitePhase==='reverse')satelliteUI.hidden=true;},780);
    satelliteHit.disabled=true;
    // Card is already offscreen by the time a flight reversal is allowed.
    contact.hidden=true;
    contact.classList.remove('is-visible','is-story');
    document.getElementById('explore')?.classList.add('is-satellite-reversing');
    window.__CLEAR_ORBIT_STATE='SATELLITE_RETURN';
    return true;
  }
  function satelliteBack(){
    cancelContactTyping();setContactFocus(false);
    if((satellitePhase==='received'||satellitePhase==='shift') && !window.ClearOrbitVisuals?.radioIsClear()){
      pendingBackPhase=satellitePhase;satellitePhase='radio-exit';satelliteUI.classList.remove('is-transmitting');satelliteHit.disabled=true;window.ClearOrbitVisuals?.beginRadioFade();return true;
    }
    if(satellitePhase==='received'||satellitePhase==='shift'){
      // When the panel is visible, do NOT hide it. Reverse the precise
      // upward spring motion all the way below the stage before unshifting.
      const panelWasShown=contact.classList.contains('is-visible');
      satelliteShiftAtReturn=satellitePhase==='shift'?satelliteShiftProgress:1;
      if(panelWasShown){
        satellitePhase='panel-exit';
        satelliteMotion=performance.now();
        contact.classList.remove('is-visible');
        window.__CLEAR_ORBIT_STATE='CONTACT_PANEL_EXIT';
      }else{
        satellitePhase='unshift';satelliteMotion=performance.now();
        contact.hidden=true;
        window.__CLEAR_ORBIT_STATE='CONTACT_RETURN';
      }
      satelliteUI.hidden=true;
      return true;
    }
    if(satellitePhase==='panel-exit'||satellitePhase==='unshift'||satellitePhase==='radio-exit')return true;
    if(satellitePhase==='approach'||satellitePhase==='waiting'||satellitePhase==='reverse')
      return reverseFlight();
    if(satellitePhase==='loading'){stopSatellite();return false;}
    return false;
  }
  function satelliteForward(){
    if(satellitePhase==='radio-exit' && pendingBackPhase){window.ClearOrbitVisuals?.cancelRadioFade();satellitePhase=pendingBackPhase;pendingBackPhase=null;return true;}
    if(satellitePhase==='radio-exit'){window.ClearOrbitVisuals?.cancelRadioFade();satellitePhase='reverse';}
    if(satellitePhase!=='reverse')return false;
    satellitePhase='approach';
    satelliteStart=performance.now()-satelliteProgress*(reduceMotion?1:SAT_FLIGHT_MS);
    document.getElementById('explore')?.classList.remove('is-satellite-reversing');
    window.__CLEAR_ORBIT_STATE='SATELLITE';
    return true;
  }
  satelliteHit.addEventListener('click',selectSatellite);
  window.addEventListener('orbit:satellite-enter',()=>{if(!api)onReady();void startSatellite();});
  window.addEventListener('orbit:satellite-exit',stopSatellite);
  window.ClearOrbitSatellite={back:satelliteBack,forward:satelliteForward,get state(){return satellitePhase;},get progress(){return satelliteProgress;}};
  let pendingBackPhase=null;
  function updateSatellite(now){
    if(satellitePhase==='radio-exit' && window.ClearOrbitVisuals?.radioIsClear()){
      if(pendingBackPhase){satellitePhase=pendingBackPhase;pendingBackPhase=null;satelliteBack();}else beginReverseFlight();
    }
    if(!satellite)return;
    if(satellitePhase==='hidden'||satellitePhase==='loading'){
      if(mode==='contact'){
        satellite.visible=true;positionSatellite(340,5);
        setSatelliteFacing(1);
        satellite.rotation.set(-.12,.32,-.15);
      }else satellite.visible=false;
      return;
    }
    satellite.visible=true;
    if(satellitePhase==='approach'){
      const t=clamp01((now-satelliteStart)/(reduceMotion?1:SAT_FLIGHT_MS));
      flightPose(satEase(t));
      if(t>=1)startWaiting();
    }else if(satellitePhase==='reverse'){
      const t=clamp01((now-satelliteStart)/(reduceMotion?1:SAT_FLIGHT_MS));
      flightPose(satelliteReverseStart*(1-satEase(t)));
      if(satelliteProgress<=0){
        // Restore the GTA-side camera, progress state and HUD only after the GLB
        // has completely left the viewport (no hard cut while still on screen).
        window.ClearOrbitExplore?.leaveSatellite?.();
      }
    }else if(satellitePhase==='waiting'){
      const t=(now-satelliteMotion)/1000;
      // v1.50.88: stable, quiet idle floating. Remove the transmission shake entirely.
      const bob=reduceMotion?0:Math.sin(t*1.15)*2.2;
      positionSatellite(SAT_WAIT.x,SAT_WAIT.y+bob);
      satellite.rotation.set(-.12,.32,-.15);
    }else if(satellitePhase==='shift'){
      const t=clamp01((now-satelliteMotion)/(reduceMotion?1:SAT_SHIFT_MS)),s=satEase(t);
      satelliteShiftProgress=t;
      positionSatellite(lerp(SAT_WAIT.x,SAT_END.x,s),lerp(SAT_WAIT.y,SAT_END.y,s));
      // Shift right while yawing the OTHER way: show more of the front/panels.
      satellite.rotation.set(lerp(-.12,0,s),lerp(.32,SAT_RECEIVED_YAW,s),lerp(-.15,0,s));
      if(t>=1){
        satellitePhase='received';
        satelliteUI.hidden=true;
        satelliteUI.classList.add('is-received');
        // Already mounted and sitting entirely below the viewport. Start the
        // spring-up ONLY after the final 3D yaw frame (never while rotating).
        contact.hidden=false;
        contact.classList.add('is-story');
        requestAnimationFrame(()=>requestAnimationFrame(()=>{
          if(satellitePhase==='received'){
            contact.classList.add('is-visible');
            setContactFocus(true,true);
            // The card has NO text during its entire rise; type after the
            // transform actually ends (plus two frames), with a safe fallback.
            typeWhenPanelSettled(contact,contact,
              ()=>satellitePhase==='received' && contact.classList.contains('is-visible'),
              reduceMotion?160:CONTACT_PANEL_MS+180);
          }
        }));
        window.__CLEAR_ORBIT_STATE='CONTACT';
      }
    }else if(satellitePhase==='panel-exit'){
      // Keep the card in the document (and its actual content intact) while
      // transform plays backwards. Hide it only after it has travelled below.
      positionSatellite(SAT_END.x,SAT_END.y);
      satellite.rotation.set(0,SAT_RECEIVED_YAW,0);
      if(now-satelliteMotion >= (reduceMotion?1:CONTACT_PANEL_MS)){
        contact.hidden=true;
        satelliteShiftAtReturn=1;
        satellitePhase='unshift';satelliteMotion=now;
        window.__CLEAR_ORBIT_STATE='CONTACT_RETURN';
      }
    }else if(satellitePhase==='unshift'){
      const t=clamp01((now-satelliteMotion)/(reduceMotion?1:SAT_SHIFT_MS));
      const s=satEase(satelliteShiftAtReturn*(1-t));
      positionSatellite(lerp(SAT_WAIT.x,SAT_END.x,s),lerp(SAT_WAIT.y,SAT_END.y,s));
      satellite.rotation.set(lerp(-.12,0,s),lerp(.32,SAT_RECEIVED_YAW,s),lerp(-.15,0,s));
      if(t>=1)startWaiting();
    }else if(satellitePhase==='received'){
      // The settled CONTACT pose also breathes gently; never add vibration.
      const bob=reduceMotion?0:Math.sin((now-satelliteMotion)/1000*1.15)*2.2;
      positionSatellite(SAT_END.x,SAT_END.y+bob);
      satellite.rotation.set(0,SAT_RECEIVED_YAW,0);
    }
  }
  function onReady(){
    if(api)return;
    api=window.__ORBIT_3D_SCENE;
    if(!api || !window.__ORBIT_3D_LIB)return;
    addGlow();
    api.stage.onUpdate((_,dt)=>{
      if(!api)return;
      const now=performance.now();
      if(logoDrag.returning && logoDrag.id===null && api.logo.fit){
        const r=logoDrag.returning;
        const t=clamp01((now-r.start)/r.duration),k=1-Math.pow(1-t,3);
        api.logo.fit.rotation.set(lerp(r.fromX,r.to.x,k),lerp(r.fromY,r.to.y,k),lerp(r.fromZ,r.to.z,k));
        if(t>=1)logoDrag.returning=null;
      }
      if(tween){
        const t=tween.duration?clamp01((now-tween.begun)/tween.duration):1;
        const v=smooth(t);cx=lerp(tween.fromX,tween.toX,v);cy=lerp(tween.fromY,tween.toY,v);
        width=lerp(tween.fromW,tween.toW,v);
        if(t>=1)tween=null;
      }else if(mode==='intro'||(!cameraAttached && mode==='profile')){
        cx=api.logo.state.cx;cy=api.logo.state.cy;width=api.logo.state.width;
      }
      if(cameraAttached){
        api.logo.state.cx=cx;api.logo.state.cy=cy;api.logo.state.width=width;
        api.logo.applyTransform();
        api.logo.root.position.z=-api.stage.metrics.camDistance;
        api.logo.root.visible=true;
      }
      // A single hover/click-lock controls the actual back-of-GLB shader.
      // No nav-hover glow before EXPLORE (or after returning to PROFILE).
      // The original GLB and its approved Profile movement remain unchanged.
      const arrivedInExplore=mode==='explore' && !tween && !explore.hidden
        && explore.classList.contains('is-visible')
        && Math.abs(cx-EXPLORE.cx)<.6 && Math.abs(cy-EXPLORE.cy)<.6;
      const canInteract=arrivedInExplore || (mode==='contact' && !tween);
      if(logoInteractive!==canInteract){
        logoInteractive=canInteract;
        toggle.disabled=!logoInteractive;
        ui.classList.toggle('is-interactive',logoInteractive);
        if(!logoInteractive){hovered=false;setMenu(false);}
        else if(toggle.matches(':hover'))hovered=true;
      }
      const glowEnabled=logoInteractive;
      const targetGlow=glowEnabled && (hovered || isOpen) ? .54 : 0;
      // A quicker but softer bloom than the earlier logo hover light.
      intensity=lerp(intensity,targetGlow,1-Math.exp(-Math.min(.1,dt||.016)/.12));
      if(shader)shader.uniforms.uStrength.value=intensity;
      updateSatellite(now);
      updateSatelliteRadio(now);
      const visible=mode==='explore'||mode==='contact'||(!profile.hidden && profile.classList.contains('is-visible'));
      ui.hidden=!visible;
      const starClick=document.getElementById('star-hit');
      const inReveal=!visible && starClick?.disabled && api.logo.root.visible
        && profile.hidden && explore.hidden && api.logo.isLoaded;
      introLogoHit.hidden=USE_2D_LOGO || !inReveal;
      if(inReveal){
        const w=api.logo.state.width;
        introLogoHit.style.left=api.logo.state.cx.toFixed(2)+'px';
        introLogoHit.style.top=api.logo.state.cy.toFixed(2)+'px';
        introLogoHit.style.width=Math.max(20,w).toFixed(2)+'px';
        introLogoHit.style.height=Math.max(20,w*.73).toFixed(2)+'px';
      }
      if (USE_2D_LOGO && api.logo && personalMark) {
        // INTRO follows the GSAP coordinates. PROFILE/EXPLORE use the
        // original camera-nav interpolated coordinates; no second timeline.
        const markX = cameraAttached ? cx : api.logo.state.cx;
        const markY = cameraAttached ? cy : api.logo.state.cy;
        const markWidth = cameraAttached ? width : api.logo.state.width;
        personalMark.style.left = markX.toFixed(2) + 'px';
        personalMark.style.top = markY.toFixed(2) + 'px';
        personalMark.style.width = markWidth.toFixed(2) + 'px';
        const introPhase = api.intro?.machine?.state;
        // Reveal begins exactly with the expanding white wash at 70% of
        // INTRO_STAR_GLOW, and completes at its 100% brightness/size peak.
        // LOGO_REVEAL, LOGO_DOCKED and subsequent modes never restart the fade.
        const inGlow=introPhase==='INTRO_STAR_GLOW' && !cameraAttached && !visible;
        const revealing=(inGlow || introPhase==='LOGO_REVEAL') && !cameraAttached && !visible;
        const speedFactor=reduceMotion ? .5 : 1;
        const fadeStart=INTRO_LOGO_FADE_START_SEC*speedFactor;
        const fadeEnd=INTRO_LOGO_FADE_END_SEC*speedFactor;
        const elapsed=inGlow ? Math.max(0,api.intro?.elapsedGlow?.()??0) : fadeEnd;
        const logoProgress=inGlow ? clamp01((elapsed-fadeStart)/(fadeEnd-fadeStart)) : 1;
        const logoAlpha=logoProgress*logoProgress; // no visible mark early in the flare
        const introLight=!cameraAttached && (introPhase==='INTRO_IDLE' || inGlow);
        const showMark=api.logo.isLoaded && (introLight || cameraAttached || visible || (revealing && logoAlpha>0) || introPhase==='LOGO_DOCKED');
        personalMark.style.setProperty('--orbit-logo-reveal-alpha', '1');
        personalMark.dataset.orbitReveal=introLight ? (inGlow ? logoAlpha : 0) : 1;
        personalMark.style.transform=introLight ? `translate(${-50+.76*(inGlow?logoAlpha:0)}%,${-50-3.8*(inGlow?logoAlpha:0)}%)` : '';
        personalMark.classList.toggle('is-revealing', revealing);
        personalMark.classList.toggle('is-visible', !!showMark);
        personalMark.classList.toggle('is-hovered', !!(logoInteractive && (hovered || isOpen)));
      }
      if(visible){
        ui.style.left=cx.toFixed(2)+'px';ui.style.top=cy.toFixed(2)+'px';
        // Hit region follows the actual 3D logo as its width changes.
        ui.style.width=width.toFixed(2)+'px';
        ui.style.height=(width*(USE_2D_LOGO?1199/1312:148/PROFILE.width)).toFixed(2)+'px';
        ui.classList.toggle('is-traveling',!!tween);
      }
      window.ClearOrbitVisuals?.updateLogo(now);
    });
  }
  window.addEventListener('orbit3dready',onReady);
  if(window.__ORBIT_3D_SCENE)onReady();
  window.addEventListener('orbit:explore-enter',()=>{
    if(shortcut)closeShortcut();
    if(!api)onReady();
    cameraAnchor();mode='explore';stopSatellite();contact.hidden=true;
    setMenu(false);hovered=false;move(EXPLORE,1150);
  });
  toggle.addEventListener('pointerenter',()=>{if(logoInteractive)hovered=true;});
  toggle.addEventListener('pointerleave',()=>{hovered=false;});
  toggle.addEventListener('focus',()=>{if(logoInteractive)hovered=true;});
  toggle.addEventListener('blur',()=>{hovered=false;});
  toggle.addEventListener('click',()=>{
    if(!logoInteractive)return;
    if(performance.now()>=logoDrag.suppressUntil)setMenu(!isOpen);
  });
  document.addEventListener('pointerdown',e=>{
    if(isOpen && !ui.contains(e.target))setMenu(false);
  },true);
  window.addEventListener('keydown',e=>{if(e.key==='Escape' && isOpen){e.stopPropagation();setMenu(false);}},true);

  // CONTACT focus layer lives ABOVE Explore but BELOW logo, GLB hit layer and cards.
  // For the ending mask the projected satellite footprint, so its true GLB remains sharp.
  const contactFocus=document.createElement('div');
  contactFocus.className='orbit-contact-focus-backdrop';
  contactFocus.setAttribute('aria-hidden','true');
  stageNode.appendChild(contactFocus);
  function setContactFocus(on,story=false){
    contactFocus.classList.toggle('is-story',!!story);
    contactFocus.classList.toggle('is-visible',!!on);
    if(story){
      contactFocus.style.setProperty('--focus-satellite-x',satelliteUI.style.getPropertyValue('--satellite-screen-x')||'985px');
      contactFocus.style.setProperty('--focus-satellite-y',satelliteUI.style.getPropertyValue('--satellite-screen-y')||'470px');
    }
  }
  const contactTextSource=new WeakMap();
  let contactTypeTimer=null, contactPendingSettle=null;
  const contactTypedNodes=panel=>panel===contact ?
    [...panel.querySelectorAll(':scope > h2, :scope > p, .orbit-contact-direct-info span, .orbit-contact-direct-info a')] :
    [...panel.querySelectorAll('.orbit-shortcut-contact-card h2, .orbit-shortcut-contact-field span, .orbit-shortcut-contact-field a')];
  function cancelContactTyping(){
    clearTimeout(contactTypeTimer);contactTypeTimer=null;
    if(contactPendingSettle){contactPendingSettle();contactPendingSettle=null;}
  }
  function prepareContactText(panel){
    // MUST be called while the card is still hidden/offscreen. Otherwise its
    // original hard-coded content is visible for the entire entrance animation.
    cancelContactTyping();
    if(!panel)return;
    for(const node of contactTypedNodes(panel)){
      if(!contactTextSource.has(node))contactTextSource.set(node,node.textContent);
      node.setAttribute('data-contact-type','');
      if(node.tagName==='A')node.setAttribute('aria-label',contactTextSource.get(node));
      node.textContent='';
    }
  }
  function typeContactText(panel){
    if(!panel)return;
    clearTimeout(contactTypeTimer);contactTypeTimer=null;
    const entries=contactTypedNodes(panel).map(node=>{
      const full=contactTextSource.get(node)??node.textContent;
      if(!contactTextSource.has(node))contactTextSource.set(node,full);
      node.textContent='';
      return {node,chars:Array.from(full)};
    });
    if(window.matchMedia('(prefers-reduced-motion: reduce)').matches){
      entries.forEach(e=>e.node.textContent=e.chars.join(''));return;
    }
    let line=0,character=0;
    const tick=()=>{
      if(line>=entries.length){contactTypeTimer=null;return;}
      const entry=entries[line];
      if(character<entry.chars.length){entry.node.textContent+=entry.chars[character++];}
      else{line++;character=0;}
      contactTypeTimer=setTimeout(tick,22);
    };
    tick();
  }
  function typeWhenPanelSettled(panel,movingElement,isCurrent,fallbackMs){
    cancelContactTyping();
    let done=false,timer;
    const cleanup=()=>{
      movingElement.removeEventListener('transitionend',onTransitionEnd);
      clearTimeout(timer);
      if(contactPendingSettle===cleanup)contactPendingSettle=null;
    };
    const finish=()=>{
      if(done)return;
      done=true;cleanup();
      // Keep the first typewriter character out of the final moving frame.
      requestAnimationFrame(()=>requestAnimationFrame(()=>{
        if(isCurrent())typeContactText(panel);
      }));
    };
    const onTransitionEnd=event=>{
      if(event.target===movingElement && event.propertyName==='transform')finish();
    };
    movingElement.addEventListener('transitionend',onTransitionEnd);
    timer=setTimeout(finish,fallbackMs); // fallback for non-transitioning contexts
    contactPendingSettle=cleanup;
  }
  // Top SH logo shortcuts are OVERLAYS, never scene navigation.
  // Do not touch Explore travel, its 6 planets, 3D camera, satellite phases,
  // background, intro/profile flow or the real satellite CONTACT card.
  const shortcutProfile=profile.cloneNode(true);
  shortcutProfile.id='orbit-shortcut-profile';
  shortcutProfile.className='profile orbit-shortcut-profile';
  shortcutProfile.hidden=true;
  shortcutProfile.setAttribute('role','dialog');
  shortcutProfile.setAttribute('aria-modal','true');
  shortcutProfile.setAttribute('aria-label','PROFILE');
  shortcutProfile.querySelectorAll('[id]').forEach(el=>{
    el.id='orbit-shortcut-'+el.id;
  });
  shortcutProfile.querySelectorAll('[aria-controls]').forEach(el=>{
    el.setAttribute('aria-controls','orbit-shortcut-'+el.getAttribute('aria-controls'));
  });
  const profileClose=document.createElement('button');
  profileClose.type='button';profileClose.className='orbit-shortcut-close';
  profileClose.setAttribute('aria-label','프로필 오버레이 닫기');
  profileClose.innerHTML='<img src="ASSET/04_HUD_ICONS/03_02_MODAL_CLOSE_Off.png" alt="">';
  shortcutProfile.appendChild(profileClose);
  stageNode.appendChild(shortcutProfile);

  // Standalone, landscape quick CONTACT card, not the ending's SIGNAL RECEIVED panel.
  const shortcutContact=document.createElement('section');
  shortcutContact.id='orbit-shortcut-contact';
  shortcutContact.className='orbit-shortcut-contact';
  shortcutContact.hidden=true;
  shortcutContact.setAttribute('role','dialog');
  shortcutContact.setAttribute('aria-modal','true');
  shortcutContact.setAttribute('aria-label','CONTACT');
  // Reuse the actual, approved e-mail and phone anchors instead of copying
  // the story panel's layout or changing any contact information.
  const existingLinks=[...contact.querySelectorAll('.orbit-contact-direct-info a')];
  shortcutContact.innerHTML=`<div class="orbit-shortcut-contact-card">
    <h2>CONTACT</h2>
    <div class="orbit-shortcut-contact-grid">
      <div class="orbit-shortcut-contact-field"><span>E-MAIL</span><a></a></div>
      <div class="orbit-shortcut-contact-field"><span>PHONE</span><a></a></div>
    </div>
  </div>`;
  shortcutContact.querySelectorAll('.orbit-shortcut-contact-field a').forEach((a,i)=>{
    a.href=existingLinks[i]?.getAttribute('href')||'#';
    a.textContent=existingLinks[i]?.textContent||'';
  });
  const contactClose=profileClose.cloneNode(true);
  contactClose.setAttribute('aria-label','연락처 모달 닫기');
  shortcutContact.querySelector('.orbit-shortcut-contact-card').appendChild(contactClose);
  stageNode.appendChild(shortcutContact);

  // The satellite's separate ENDING CONTACT card shares the same real X
  // artwork / 90-degree hover animation as the shortcut PROFILE & CONTACT.
  // Its existing backwards panel-and-satellite transition remains the close path.
  const storyContactClose=profileClose.cloneNode(true);
  storyContactClose.className='orbit-shortcut-close orbit-story-contact-close';
  storyContactClose.setAttribute('aria-label','엔딩 연락처 닫기');
  storyContactClose.addEventListener('click',()=>{satelliteBack();});
  contact.appendChild(storyContactClose);

  let shortcut=null, shortcutCloseTimer=null, shortcutVersion=0;
  const shortcutReason=shortcutProfile.querySelector('#orbit-shortcut-reason-text');
  const shortcutMore=shortcutProfile.querySelector('#orbit-shortcut-profile-more');
  const shortcutToggle=shortcutProfile.querySelector('#orbit-shortcut-profile-toggle');
  function prepareShortcutProfile(){
    shortcutProfile.classList.remove('is-expanded');
    shortcutReason?.classList.remove('reason-complete');
    shortcutProfile.classList.remove('is-reason-done');
    if(shortcutReason){
      shortcutReason.style.removeProperty('animation');
      shortcutReason.style.removeProperty('width');
      shortcutReason.style.setProperty('--reason-exact-width','0px');
    }
    shortcutToggle?.setAttribute('aria-expanded','false');
    const label=shortcutToggle?.querySelector('.toggle-label');
    if(label)label.textContent='Show Detail';
  }
  function measureShortcutProfile(){
    const mbtiSize=profile.querySelector(".profile-identity-right small")?.style.fontSize;
    if(mbtiSize)shortcutProfile.querySelector(".profile-identity-right small").style.fontSize=mbtiSize;
    if(shortcutProfile.hidden)return;
    const reasonInner=shortcutReason?.querySelector('.reason-inner');
    if(reasonInner && shortcutReason){
      const width=Math.ceil(reasonInner.offsetWidth || reasonInner.scrollWidth || 0);
      if(width>0 && !shortcutProfile.classList.contains('is-visible')){
        shortcutReason.style.setProperty('--reason-exact-width',width+'px');
      }
    }
    const inner=shortcutMore?.querySelector('.profile-more-inner');
    if(inner && shortcutMore){
      const range=document.createRange();range.selectNodeContents(inner);
      const height=Math.ceil(Math.max(inner.scrollHeight,inner.getBoundingClientRect().height,
        range.getBoundingClientRect().height,0)+24);
      if(height>0)shortcutMore.style.setProperty('--detail-exact-height',height+'px');
    }
  }
  shortcutReason?.addEventListener('animationend',e=>{
    if(e.animationName==='reasonOpen'){shortcutReason.classList.add('reason-complete');shortcutProfile.classList.add('is-reason-done');}
  });
  window.addEventListener('resize',()=>{if(shortcut==='profile')measureShortcutProfile();});
  shortcutToggle?.addEventListener('click',()=>{
    measureShortcutProfile();
    const expanded=shortcutProfile.classList.toggle('is-expanded');
    shortcutToggle.setAttribute('aria-expanded',String(expanded));
    const label=shortcutToggle.querySelector('.toggle-label');
    if(label)label.textContent=expanded?'Close Detail':'Show Detail';
  });
  function closeShortcut(){
    if(!shortcut)return;
    if(shortcut==='contact'){cancelContactTyping();setContactFocus(false);}
    const el=shortcut==='profile'?shortcutProfile:shortcutContact;
    const version=++shortcutVersion;
    shortcut=null;
    document.documentElement.classList.remove('orbit-shortcut-open');
    el.classList.remove('is-visible');
    if(shortcutCloseTimer)clearTimeout(shortcutCloseTimer);
    shortcutCloseTimer=setTimeout(()=>{
      if(version===shortcutVersion){el.hidden=true;shortcutCloseTimer=null;}
    },reduceMotion?30:730);
    // v1.50.136: focus restoration must not leave the logo in its
    // pressed/hover-highlighted state after PROFILE or CONTACT closes.
    // The focus listener sets `hovered=true`, so clear it AFTER focusing.
    toggle.focus({preventScroll:true});
    setMenu(false);
    hovered=false;
  }
  function openShortcut(where){
    if(where!=='profile' && where!=='contact')return false;
    if(shortcut)closeShortcut();
    ++shortcutVersion;
    if(shortcutCloseTimer){clearTimeout(shortcutCloseTimer);shortcutCloseTimer=null;}
    // The shortcut is on the *same* scene; do not reset or teleport camera.
    const el=where==='profile'?shortcutProfile:shortcutContact;
    if(where==='profile')prepareShortcutProfile();
    if(where==='contact')prepareContactText(el); // blank before first visible frame
    el.hidden=false;
    el.classList.remove('is-visible');
    if(where==='profile')measureShortcutProfile();
    shortcut=where;
    document.documentElement.classList.add('orbit-shortcut-open');
    setMenu(false);hovered=false;
    const token=shortcutVersion;
    requestAnimationFrame(()=>requestAnimationFrame(()=>{
      if(token!==shortcutVersion || shortcut!==where)return;
      if(where==='profile')measureShortcutProfile();
      el.classList.add('is-visible');
      if(where==='contact'){
        setContactFocus(true,false);
        // Shortcut CONTACT: do not display pre-rendered copy during slide-in.
        typeWhenPanelSettled(el,el.querySelector('.orbit-shortcut-contact-card'),
          ()=>shortcut==='contact' && token===shortcutVersion && el.classList.contains('is-visible'),
          reduceMotion?160:560);
      }
      if(where==='profile')document.fonts?.ready?.then(()=>{
        if(shortcut==='profile')measureShortcutProfile();
      });
      (where==='profile'?profileClose:contactClose).focus({preventScroll:true});
    }));
    return true;
  }
  profileClose.addEventListener('click',closeShortcut);
  contactClose.addEventListener('click',closeShortcut);
  // Block background wheel navigation while either overlay is open, and
  // keep the exact Explore position / satellite state for closing it.
  window.addEventListener('wheel',e=>{
    if(!shortcut)return;
    e.preventDefault();e.stopImmediatePropagation();
  },{capture:true,passive:false});
  window.addEventListener('keydown',e=>{
    if(!shortcut)return;
    if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();closeShortcut();return;}
    if(['ArrowUp','ArrowDown','PageUp','PageDown','Home','End',' '].includes(e.key)){
      e.preventDefault();e.stopImmediatePropagation();
    }
  },true);
  const navigate=openShortcut;
  toProfile.addEventListener('click',()=>{if(logoInteractive)openShortcut('profile');});
  toContact.addEventListener('click',()=>{if(logoInteractive)openShortcut('contact');});
  // When first profile appears, expose its top-docked actual 3D logo as a hit target.
  // No changes to the original PROFILE controller or its timing.
  const observe=new MutationObserver(()=>{
    if(!profile.hidden && explore.hidden && contact.hidden && mode==='intro'){
      mode='profile';cx=api?.logo.state.cx??PROFILE.cx;cy=api?.logo.state.cy??PROFILE.cy;
      width=api?.logo.state.width??PROFILE.width;hovered=false;
    }
  });
  observe.observe(profile,{attributes:true,attributeFilter:['hidden','class']});
  window.ClearOrbitLogoNavigation={
    navigate,closeShortcut,get state(){return {mode,open:isOpen,shortcut,hovered,cx,cy,width,attached:cameraAttached,interactive:logoInteractive,glow:intensity};}
  };
})();
