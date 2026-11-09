/* CLEAR ORBIT 02 — EXPLORE.
   Uses exactly the active INTRO's Three.js scene/renderer: NO duplicate WebGL canvas.
   v42.8 voyage stops and inertia are retained, GLB files are ORIGINAL ASSET_V1 models.
   PROJECT DETAIL remains scheduled separately; the CONTACT satellite is a shared-scene chapter. */
(() => {
  'use strict';
  const PROJECTS = [
    { key:'bugs',   z:12, x:45, y:34, kind:'blue', category:'UX/UI DESIGN', name:'BUGS!\nREDESIGN\nPROJECT', hud:'BUGS! REDESIGN PROJECT' },
    { key:'naver',  z:23, x:67, y:61, kind:'blue', category:'UX/UI DESIGN', name:'NAVER 지식iN\nREDESIGN\nPROJECT', hud:'NAVER 지식iN REDESIGN PROJECT' },
    { key:'aladin', z:34, x:35, y:44, kind:'blue', category:'UX/UI DESIGN', name:'ALADIN APP\nREDESIGN\nPROJECT', hud:'ALADIN APP REDESIGN PROJECT' },
    { key:'seven',  z:45, x:69, y:31, kind:'red',  category:'VISUAL DESIGN', name:'7ELEVEN CI\nREDESIGN\nPROJECT', hud:'7ELEVEN CI REDESIGN PROJECT' },
    { key:'hwalok', z:56, x:32, y:66, kind:'red',  category:'VISUAL DESIGN', name:'충주 활옥동굴\nBROCHURE\nDESIGN', hud:'충주 활옥동굴 BROCHURE DESIGN' },
    { key:'gta',    z:67, x:62, y:52, kind:'blue', category:'UX/UI DESIGN', name:'GTA : ONLINE\nPROMOTION\nWEBSITE', hud:'GTA : ONLINE PROMOTION WEBSITE' },
  ];
  const V42 = Object.freeze({ start:-8, end:72, worldStep:620, inertiaMs:310, wheelGain:.032, voyageFocus:12.6 });
  // v1.31 — the viewer sees a luminous 2×2px point instead of a dark distant sphere.
  // Crossfade starts before atmospheric fog can make the GLB look like a black spot.
  const DISTANT_LIGHT = Object.freeze({ start:14500, end:26500 });
  // One full profile wheel turn (previous v1.30 threshold: 1050).
  const PROFILE_WHEEL_TRIGGER = 1;
  // First Explore view begins far enough away for even BUGS to be a luminous point.
  // World coordinates and all selected-project camera targets remain unchanged.
  const INITIAL_TRAVEL = -30;
  const profile = document.getElementById('profile');
  const root = document.getElementById('explore');
  const holder = document.getElementById('orbit-planet-labels');
  if (!root || !profile || !holder) return;
  const ui = {
    name: document.getElementById('orbit-hud-name'), signal: document.getElementById('orbit-signal'),
    count: document.getElementById('orbit-count'), reset: document.getElementById('orbit-reset'),
    options: document.getElementById('orbit-view-options'), tooltip: document.getElementById('orbit-view-tooltip'),
  };
  let active=false, entering=false, wheelThreshold=0, target=INITIAL_TRAVEL, travel=INITIAL_TRAVEL;
  let selected=null, focus=null, returning=null, cameraOrigin=0, cameraRef=null;
  // Only direct user selection is counted; revisits remain unique.
  const visited = new Set();
  const meshes = new Map();
  const hovered = new Set();
  const pending = new Map();
  let galaxy=null, sceneRef=null, api=null, enterTimestamp=0;
  let satelliteActive=false, contactBackdrop=false;
  let returnTravel=INITIAL_TRAVEL;
  let exploreFog=null;
  let hudCurrent='DISTANT SIGNALS AHEAD', hudTypeTimer=null;
  const hudMeasureCanvas=document.createElement('canvas');
  const hudMeasure=hudMeasureCanvas.getContext('2d');
  let countPulseTimer=null;
  function fitHudText(...titles){
    if(!ui.name||!hudMeasure)return;
    const style=getComputedStyle(ui.name);
    const typeFactor=Number(getComputedStyle(document.documentElement).getPropertyValue('--orbit-type-adjust'))||1;
    const available=Math.max(100,ui.name.clientWidth || 495)/typeFactor-3;
    const family=style.fontFamily || 'sans-serif';
    const weight=style.fontWeight || '600';
    let size=30;
    // Use the full upcoming title, not the truncated current typewriter text.
    for(const title of titles){
      hudMeasure.font=`${weight} 30px ${family}`;
      const fullWidth=hudMeasure.measureText(title).width+(Math.max(0,title.length-1)*30*.022);
      if(fullWidth>available)size=Math.min(size,30*available/fullWidth);
    }
    ui.name.style.fontSize=(Math.max(14,Math.min(30,size))*typeFactor).toFixed(2)+'px';
  }
  document.fonts?.ready?.then(()=>fitHudText(hudCurrent));
  window.addEventListener('resize',()=>fitHudText(hudCurrent));
  function pulseVisitCounter(){
    const counter=ui.count?.closest('.orbit-count');
    if(!counter)return;
    counter.classList.remove('is-count-bump');
    void counter.offsetWidth; // restart for each newly discovered unique planet
    counter.classList.add('is-count-bump');
    if(countPulseTimer)clearTimeout(countPulseTimer);
    countPulseTimer=setTimeout(()=>{counter.classList.remove('is-count-bump');countPulseTimer=null;},650);
  }
  let introPromptTimer=null;
  const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
  const ease=(from,to,dt,tau)=>from+(to-from)*(1-Math.exp(-dt/tau));
  function fromB64(text){
    const binary=atob(text); const u=new Uint8Array(binary.length);
    for(let k=0;k<binary.length;k++) u[k]=binary.charCodeAt(k);
    return u.buffer;
  }
  // Project preview uses only the original supplied overview artwork.
  // Mounted at document.body to avoid the scaled 1440x1024 stage clipping it.
  const PLANET_PREVIEW_IMAGES=Object.freeze({
    bugs:'ASSET/05_MODAL_01_BUGS/01_01B_OVERVIEW_BUGS.png',
    naver:'ASSET/05_MODAL_02_NAVER/01_02N_OVERVIEW_NAVER.png',
    aladin:'ASSET/05_MODAL_03_ALADIN/01_03A_OVERVIEW_ALADIN.png',
    seven:'ASSET/05_MODAL_04_7ELEVEN/01_04S_OVERVIEW_7ELEVEN.png',
    hwalok:'ASSET/05_MODAL_05_BROCHURE/01_05C_OVERVIEW_CAVE.png',
    gta:'ASSET/05_MODAL_06_GTA/01_05G_OVERVIEW_GTA.png',
  });
  const planetPreview=document.createElement('div');
  planetPreview.className='orbit-planet-preview';
  planetPreview.setAttribute('aria-hidden','true');
  const planetPreviewImage=document.createElement('img');
  planetPreviewImage.alt='';
  planetPreviewImage.decoding='async';
  planetPreview.appendChild(planetPreviewImage);
  document.body.appendChild(planetPreview);
  let previewKey=null;
  const previewWidth=226,previewHeight=142;
  function placePlanetPreview(clientX,clientY){
    const margin=14,offset=61;
    const right=clientX+offset;
    const left=right+previewWidth+margin<=innerWidth
      ?right:Math.max(margin,clientX-offset-previewWidth);
    const top=clamp(clientY-previewHeight/2,margin,
      Math.max(margin,innerHeight-previewHeight-margin));
    planetPreview.style.left=left.toFixed(1)+'px';
    planetPreview.style.top=top.toFixed(1)+'px';
  }
  function hidePlanetPreview(){
    previewKey=null;
    planetPreview.classList.remove('is-visible');
  }
  planetPreviewImage.addEventListener('load',()=>{
    if(previewKey && planetPreviewImage.naturalWidth>0)
      planetPreview.classList.add('is-visible');
  });
  planetPreviewImage.addEventListener('error',hidePlanetPreview);
  function showPlanetPreview(p,event){
    if(event.pointerType==='touch' || !active || satelliteActive || selected || root.hidden ||
      !pending.get(p.key)?.classList.contains('is-label-visible'))return;
    const path=PLANET_PREVIEW_IMAGES[p.key];
    if(!path)return;
    placePlanetPreview(event.clientX,event.clientY);
    if(previewKey!==p.key){
      planetPreview.classList.remove('is-visible');
      previewKey=p.key;
      planetPreviewImage.src=path;
    }
    if(planetPreviewImage.complete && planetPreviewImage.naturalWidth>0)
      planetPreview.classList.add('is-visible');
  }
  function makeLabel(p){
    const b=document.createElement('button'); b.type='button';
    b.className='orbit-planet '+(p.kind==='red'?'is-red':'');
    b.dataset.project=p.key; b.setAttribute('aria-label',p.hud+' 프로젝트 행성');
    const halo=document.createElement('span'); halo.className='orbit-planet-halo'; halo.setAttribute('aria-hidden','true');
    // Purely visual, non-interactive lens flare. The projected hit area is unchanged.
    // Distant planets get larger screen-space (+) diffraction spikes, like the
    // classic GTA headlight bloom; near planets keep a tighter halo.
    const glint=document.createElement('span'); glint.className='orbit-planet-glint'; glint.setAttribute('aria-hidden','true');
    // During the distance crossfade a 2×2px bright point replaces the GLB and flare.
    const pinpoint=document.createElement('span');pinpoint.className='orbit-planet-pinpoint';pinpoint.setAttribute('aria-hidden','true');
    const copy=document.createElement('span');copy.className='orbit-project-copy';
    const arrow=document.createElement('span');arrow.className='orbit-project-arrow'; arrow.textContent='↟';
    const cat=document.createElement('span');cat.className='orbit-project-category';cat.textContent=p.category;
    const name=document.createElement('span');name.className='orbit-project-name';name.textContent=p.name;
    copy.append(arrow,cat,name);b.append(halo,glint,pinpoint,copy); holder.appendChild(b);
    b.addEventListener('pointerenter',event=>{
      if(!b.classList.contains('is-frontmost'))return;
      hovered.add(p.key);
      showPlanetPreview(p,event);
    });
    b.addEventListener('pointermove',event=>{
      if(previewKey===p.key)placePlanetPreview(event.clientX,event.clientY);
      else if(!previewKey && !b.hasPointerCapture(event.pointerId))showPlanetPreview(p,event);
    });
    b.addEventListener('pointerleave',()=>{
      hovered.delete(p.key);
      if(previewKey===p.key)hidePlanetPreview();
    });
    b.addEventListener('focusin',()=>{if(b.classList.contains('is-frontmost'))hovered.add(p.key);});
    b.addEventListener('focusout',()=>hovered.delete(p.key));
    // Click remains project selection; an actual drag rotates only this GLB.
    const drag={pointerId:null,startX:0,startY:0,lastX:0,lastY:0,lastAt:0,vx:0,vy:0,moved:false,suppressUntil:0,base:null};
    b.addEventListener('pointerdown',event=>{
      if(event.button!==0 || !meshes.has(p.key) || satelliteActive || !b.classList.contains('is-frontmost'))return;
      hidePlanetPreview(); // keep the visual clear while the user rotates a GLB
      drag.pointerId=event.pointerId;drag.startX=drag.lastX=event.clientX;
      drag.lastAt=performance.now();drag.vx=0;drag.vy=0;
      drag.startY=drag.lastY=event.clientY;drag.moved=false;
      const m=meshes.get(p.key);m.dragging=true;m.pauseSpinUntil=Infinity;
      m.restoreRotation=null;m.inertia=null;
      drag.base={x:m.spin.rotation.x,y:m.spin.rotation.y,z:m.spin.rotation.z};
      try{b.setPointerCapture(event.pointerId);}catch(_err){}
    });
    b.addEventListener('pointermove',event=>{
      if(event.pointerId!==drag.pointerId)return;
      const dx=event.clientX-drag.lastX,dy=event.clientY-drag.lastY;
      if(Math.hypot(event.clientX-drag.startX,event.clientY-drag.startY)>5)drag.moved=true;
      if(drag.moved){
        const m=meshes.get(p.key);
        if(m){
          const scale=Math.max(.1,parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--s'))||1);
          const now=performance.now(),dt=clamp((now-drag.lastAt)/1000,.008,.1);
          const yDelta=dx/scale*.009,xDelta=dy/scale*.007;
          m.spin.rotation.y+=yDelta;
          m.spin.rotation.x=clamp(m.spin.rotation.x+xDelta,-Math.PI*.45,Math.PI*.45);
          const blend=.5;drag.vy=drag.vy*(1-blend)+clamp(yDelta/dt,-8,8)*blend;
          drag.vx=drag.vx*(1-blend)+clamp(xDelta/dt,-5,5)*blend;
          drag.lastAt=now;
        }
        event.preventDefault();
      }
      drag.lastX=event.clientX;drag.lastY=event.clientY;
      // Keep the GLB grabbed while the mouse button stays down, even
      // after the cursor leaves the projected planet. setPointerCapture
      // directs move/up events here until the physical release/cancel.
    });
    function releasePlanetDrag(event){
      if(event.pointerId!==drag.pointerId)return;
      const m=meshes.get(p.key);
      if(m){
        m.dragging=false;m.pauseSpinUntil=performance.now()+1200;
        // No return-to-base snap. Friction dissipates release velocity smoothly.
        if(drag.moved){
          m.inertia={vx:0,vy:drag.vy}; // preserve horizontal momentum, release vertical tilt
          m.restoreRotation=null;
        }
      }
      drag.base=null;
      if(drag.moved)drag.suppressUntil=performance.now()+250;
      drag.pointerId=null;
      try{if(b.hasPointerCapture(event.pointerId))b.releasePointerCapture(event.pointerId);}catch(_err){}
    }
    b.addEventListener('pointerup',releasePlanetDrag);
    b.addEventListener('pointercancel',releasePlanetDrag);
    b.addEventListener('lostpointercapture',releasePlanetDrag);
    b.addEventListener('click',()=>{
      if(performance.now()<drag.suppressUntil || !b.classList.contains('is-frontmost'))return;
      pick(p);
    });
    pending.set(p.key,b);
    return b;
  }
  // v1.37: constellation guide is a non-interactive, hairline SVG behind labels.
  // The paths track ONLY the projected distant light points, never a guessed location.
  const SVG_NS='http://www.w3.org/2000/svg';
  const constellation=document.createElementNS(SVG_NS,'svg');
  constellation.setAttribute('viewBox','0 0 1440 1024');
  constellation.setAttribute('preserveAspectRatio','none');
  constellation.setAttribute('aria-hidden','true');
  constellation.classList.add('orbit-constellation');
  const constellationLines=PROJECTS.slice(1).map(()=>{
    const line=document.createElementNS(SVG_NS,'line');
    line.classList.add('orbit-constellation-line');
    constellation.appendChild(line);
    return line;
  });
  holder.insertBefore(constellation,holder.firstChild);
  PROJECTS.forEach(makeLabel);
  const explorePrompt=document.createElement('div');
  explorePrompt.className='orbit-scroll-prompt';
  // The prompt is one reactive plane; its glyphs never move independently.
  const promptPlane=document.createElement('span');
  promptPlane.className='orbit-scroll-prompt-plane';
  promptPlane.textContent='스크롤로 탐색하기';
  explorePrompt.appendChild(promptPlane);
  explorePrompt.setAttribute('aria-live','polite');
  root.appendChild(explorePrompt);
  // Subtle whole-surface perspective response. Use the viewport-aligned stage
  // center, not individual glyph offsets; listeners do not steal clicks/scroll.
  window.addEventListener('pointermove',event=>{
    if(!active || !explorePrompt.classList.contains('is-showing') || event.pointerType==='touch')return;
    const rect=root.getBoundingClientRect();
    const nx=clamp((event.clientX-(rect.left+rect.width/2))/(rect.width*.5),-1,1);
    const ny=clamp((event.clientY-(rect.top+rect.height/2))/(rect.height*.5),-1,1);
    promptPlane.style.setProperty('--orbit-prompt-ry',(nx*8).toFixed(2)+'deg');
    promptPlane.style.setProperty('--orbit-prompt-rx',(-ny*7).toFixed(2)+'deg');
    promptPlane.style.setProperty('--orbit-prompt-tx',(nx*8).toFixed(2)+'px');
    promptPlane.style.setProperty('--orbit-prompt-ty',(ny*5).toFixed(2)+'px');
  },{passive:true});
  function clearPromptTilt(){
    for(const key of ['rx','ry'])promptPlane.style.setProperty('--orbit-prompt-'+key,'0deg');
    for(const key of ['tx','ty'])promptPlane.style.setProperty('--orbit-prompt-'+key,'0px');
  }
  window.addEventListener('blur',clearPromptTilt);
  // Global non-interactive custom cursor. Native pointer is suppressed only on
  // fine-pointer devices *after* a real mouse movement has been detected.
  const cursor=document.createElement('div');
  cursor.className='orbit-stroke-cursor';
  cursor.setAttribute('aria-hidden','true');
  document.body.appendChild(cursor);
  let cursorVisible=false;
  // Cross-origin iframe events cannot report pointer coordinates to the parent.
  // Start the fade *before* the pointer crosses the screen edge, so the circle
  // keeps tracking throughout the visible fade and never freezes over the site.
  const PROTOTYPE_FADE_GUTTER=44;
  const PROTOTYPE_FADE_TIME=220;
  let prototypeFadeActive=false;
  let lastPointerX=0,lastPointerY=0;
  function activePrototypeRect(){
    const screen=document.querySelector('.orbit-solution-prototype:popover-open .orbit-solution-prototype-screen.is-interactive')
      ||document.querySelector('.orbit-solution-prototype-screen.is-interactive');
    return screen&&screen.getBoundingClientRect().width>0?screen.getBoundingClientRect():null;
  }
  function prototypeOpacityAt(x,y){
    const r=activePrototypeRect();
    if(!r)return 1;
    // Closest distance to the actual interactive iframe window. A gradient
    // inside the outer 44px starts fading on approach, before crossing it.
    const dx=Math.max(r.left-x,0,x-r.right);
    const dy=Math.max(r.top-y,0,y-r.bottom);
    const d=Math.hypot(dx,dy);
    return Math.max(0,Math.min(1,d/PROTOTYPE_FADE_GUTTER));
  }
  function moveCursor(event){
    if(event.pointerType!=='mouse' && event.pointerType!=='pen')return;
    if(!cursorVisible){cursorVisible=true;document.documentElement.classList.add('orbit-cursor-enabled');}
    lastPointerX=event.clientX;lastPointerY=event.clientY;
    cursor.style.left=lastPointerX+'px';cursor.style.top=lastPointerY+'px';
    cursor.classList.add('is-visible');
    const opacity=prototypeOpacityAt(lastPointerX,lastPointerY);
    prototypeFadeActive=opacity<1;
    cursor.style.setProperty('--orbit-prototype-cursor-opacity',String(opacity));
  }
  document.addEventListener('pointermove',moveCursor,{passive:true});
  // Allow live device-zoom animation to refresh opacity as the screen moves
  // underneath a stationary pointer (cross-origin iframe does not report moves).
  window.ClearOrbitCursor=Object.freeze({refreshPrototypeFade(){
    if(!cursorVisible)return;
    const opacity=prototypeOpacityAt(lastPointerX,lastPointerY);
    prototypeFadeActive=opacity<1;
    cursor.style.setProperty('--orbit-prototype-cursor-opacity',String(opacity));
  }});
  // If the pointer enters the iframe at speed (skipping the nearby samples),
  // snap to the *last visible edge point*, then fade. No pinned opaque cursor.
  document.addEventListener('pointerover',event=>{
    if(event.target instanceof HTMLIFrameElement && event.target.closest('.orbit-solution-prototype-screen')){
      if(event.pointerType==='mouse'||event.pointerType==='pen'){
        cursor.style.left=event.clientX+'px';cursor.style.top=event.clientY+'px';
      }
      prototypeFadeActive=true;
      cursor.style.setProperty('--orbit-prototype-cursor-opacity','0');
      cursor.classList.remove('is-pressed');
    }
  },true);
  document.addEventListener('pointerout',event=>{
    if(event.target instanceof HTMLIFrameElement && event.target.closest('.orbit-solution-prototype-screen')){
      // The first pointermove outside repositions the ring before revealing it.
      cursor.style.setProperty('--orbit-prototype-cursor-opacity','0');
    }
  },true);
  let pressAt=0,pressReleaseTimer=null;
  document.addEventListener('pointerdown',event=>{
    if(event.pointerType==='mouse'||event.pointerType==='pen'){
      if(pressReleaseTimer){clearTimeout(pressReleaseTimer);pressReleaseTimer=null;}
      pressAt=performance.now();
      cursor.classList.add('is-pressed');
    }
  },true);
  // Even a quick click briefly reaches full 2× size; a held click stays large.
  const releaseCursor=()=>{
    if(!cursor.classList.contains('is-pressed'))return;
    const delay=Math.max(0,180-(performance.now()-pressAt));
    if(pressReleaseTimer)clearTimeout(pressReleaseTimer);
    pressReleaseTimer=setTimeout(()=>{cursor.classList.remove('is-pressed');pressReleaseTimer=null;},delay);
  };
  window.addEventListener('pointerup',releaseCursor,true);
  window.addEventListener('pointercancel',()=>cursor.classList.remove('is-pressed'),true);
  window.addEventListener('blur',()=>{if(pressReleaseTimer)clearTimeout(pressReleaseTimer);
    cursor.classList.remove('is-pressed','is-visible');
    cursor.style.removeProperty('--orbit-prototype-cursor-opacity');});
  document.addEventListener('pointerout',event=>{
    if(event.relatedTarget===null){releaseCursor();cursor.classList.remove('is-visible');}
  });
  // The sole EXPLORE indicator keeps its existing hover/focus tooltip.
  ui.options?.querySelectorAll('.orbit-view-button').forEach(button => {
    const name=button.dataset.mode.toUpperCase();
    const show=()=>{ui.tooltip.textContent=name;ui.tooltip.classList.add('is-visible');};
    button.addEventListener('pointerenter',show);
    button.addEventListener('pointermove',event=>{
      const rect=root.getBoundingClientRect(); const scale=rect.width/1440||1;
      ui.tooltip.style.left=((event.clientX-rect.left)/scale+18)+'px';
      ui.tooltip.style.top=((event.clientY-rect.top)/scale+16)+'px';
      ui.tooltip.style.right='auto';
    });
    button.addEventListener('pointerleave',()=>ui.tooltip.classList.remove('is-visible'));
    button.addEventListener('focus',show);
    button.addEventListener('blur',()=>ui.tooltip.classList.remove('is-visible'));
  });
  function buildGalaxy(THREE){
    // Star field inside the visible viewing frustum; camera-relative depth preserves
    // stars throughout the long (2x) voyage. Subtle 3D drift + twinkling, no CDN.
    const count=4400;
    const positions=new Float32Array(count*3), seeds=new Float32Array(count);
    const vFov=Math.tan(35*Math.PI/360);
    for(let i=0;i<count;i++){
      const depth=2800+Math.pow(Math.random(),.75)*24000;
      const halfHeight=depth*vFov;
      const k=i*3;
      // Keep the original density outside the center, but prevent a tiny
      // high-density knot of background stars from forming behind planets.
      // The exclusion is applied in normalized projected coordinates so it
      // remains stable across star depths and camera motion.
      let nx=Math.random()*2-1,ny=Math.random()*2-1;
      if(Math.hypot(nx/.39,ny/.34)<1.0){
        const theta=Math.atan2(ny,nx);
        const radius=1.14+Math.random()*.71;
        nx=Math.cos(theta)*.39*radius;
        ny=Math.sin(theta)*.34*radius;
      }
      positions[k]=nx*halfHeight*1.5*1.48;
      positions[k+1]=ny*halfHeight*1.45;
      positions[k+2]=-depth;
      seeds[i]=Math.random();
    }
    const geometry=new THREE.BufferGeometry();
    geometry.setAttribute('position',new THREE.BufferAttribute(positions,3));
    geometry.setAttribute('aSeed',new THREE.BufferAttribute(seeds,1));
    const material=new THREE.ShaderMaterial({
      uniforms:{uTime:{value:0},uOpacity:{value:0}},
      vertexShader:`attribute float aSeed;
      varying float vSeed; varying float vPulse;
      uniform float uTime;
      void main(){
        vSeed=aSeed;
        vec3 drift=position;
        drift.x+=sin(uTime*.31+aSeed*24.0)*48.0;
        drift.y+=cos(uTime*.24+aSeed*29.0)*38.0;
        vec4 view=modelViewMatrix*vec4(drift,1.0);
        gl_Position=projectionMatrix*view;
        gl_PointSize=clamp((1.8+aSeed*3.8)*(6000.0/max(3000.0,-view.z)),1.0,3.7);
        vPulse=.65+.35*sin(uTime*(.8+aSeed*1.4)+aSeed*50.0);
      }`,
      fragmentShader:`varying float vSeed; varying float vPulse;
      uniform float uOpacity;
      void main(){
        float r=length(gl_PointCoord-.5)*2.0;
        float core=pow(max(1.0-r,0.0),2.1);
        float glow=pow(max(1.0-r,0.0),.65)*.28;
        float soft=core+glow;
        vec3 col=mix(vec3(.47,.59,.87),vec3(.94,.96,1.0),vSeed);
        float alpha=soft*uOpacity*(.28+.44*vSeed)*vPulse;
        gl_FragColor=vec4(col,alpha);
      }`,
      transparent:true,depthTest:true,depthWrite:false,
      blending:THREE.AdditiveBlending
    });
    const pts=new THREE.Points(geometry,material);
    pts.frustumCulled=false;
    pts.renderOrder=-12;
    const group=new THREE.Group();
    group.add(pts);group.visible=false;
    return {group,material};
  }
  // A real, continuously animated, depth-layered spiral galaxy. No PNG or video
  // mapped to a plane. Its stars/dust are generated as 3D point geometry and
  // retain independent slow angular movement through a small GPU shader.
  function buildSpiralGalaxy(THREE){
    const count=26000;
    const coords=new Float32Array(count*3);
    const colors=new Float32Array(count*3);
    const sizes=new Float32Array(count);
    const alphas=new Float32Array(count);
    const arms=4;
    let seed=81931;
    const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
    const normal=()=>Math.sqrt(-2*Math.log(Math.max(.00001,random())))*Math.cos(6.2831853*random());
    const tilt=-.52,ct=Math.cos(tilt),st=Math.sin(tilt);
    for(let i=0;i<count;i++){
      const r=Math.pow(random(),.76)*1620;
      const arm=i%arms;
      const angle=arm*Math.PI*2/arms+r*.0078+normal()*(.08+r*.00026);
      const cross=normal()*(28+r*.095);
      const xx=Math.cos(angle)*r-Math.sin(angle)*cross;
      const yy=(Math.sin(angle)*r+Math.cos(angle)*cross)*.42;
      const x=xx*ct-yy*st;
      const y=xx*st+yy*ct;
      const j=i*3;
      coords[j]=-370+x;
      coords[j+1]=105+y;
      coords[j+2]=-2680+normal()*(35+r*.11);
      // Warmer dust near the bright galactic nucleus, blue/mauve outer arms.
      const warm=Math.max(0,1-r/670);
      const tone=random();
      colors[j]=.40+.58*warm+.19*(tone>.8);
      colors[j+1]=.43+.40*warm+.12*(tone>.68);
      colors[j+2]=.70-.36*warm+.18*(tone>.60);
      sizes[i]=r<420?3.8+random()*8.0:1.5+random()*4.7;
      alphas[i]=(r<430?.20:.075)*(0.45+random()*.65);
    }
    const geom=new THREE.BufferGeometry();
    geom.setAttribute('position',new THREE.BufferAttribute(coords,3));
    geom.setAttribute('aColor',new THREE.BufferAttribute(colors,3));
    geom.setAttribute('aSize',new THREE.BufferAttribute(sizes,1));
    geom.setAttribute('aAlpha',new THREE.BufferAttribute(alphas,1));
    const mat=new THREE.ShaderMaterial({
      uniforms:{uTime:{value:0},uOpacity:{value:0}},
      vertexShader:`attribute vec3 aColor; attribute float aSize; attribute float aAlpha;
      varying vec3 vColor; varying float vAlpha;
      uniform float uTime;
      void main(){
        vColor=aColor;vAlpha=aAlpha;
        vec3 p=position;
        vec2 offset=p.xy-vec2(-370.0,105.0);
        // FIXED ELLIPSE: undo the original -0.52 rad tilt and 0.42 height,
        // orbit in circular coordinates, then restore the same oval projection.
        // Never rotate the entire galaxy object or its elliptical silhouette.
        const float ct=0.86781918;
        const float st=-0.49688014;
        vec2 local=vec2(ct*offset.x+st*offset.y,
                        -st*offset.x+ct*offset.y);
        local.y/=0.42;
        float radius=length(local);
        float inner=1.0-smoothstep(200.0,1650.0,radius);
        float orbitalSpeed=mix(0.025,0.050,inner);
        float a=uTime*orbitalSpeed;
        float ca=cos(a),sa=sin(a);
        vec2 moved=vec2(local.x*ca-local.y*sa,
                        local.x*sa+local.y*ca);
        moved.y*=0.42;
        vec2 oval=vec2(ct*moved.x-st*moved.y,
                       st*moved.x+ct*moved.y);
        p.xy=vec2(-370.0,105.0)+oval;
        vec4 eye=modelViewMatrix*vec4(p,1.0);
        gl_Position=projectionMatrix*eye;
        gl_PointSize=clamp(aSize*59800.0/max(400.0,-eye.z),1.0,15.0);
      }`,
      fragmentShader:`uniform float uOpacity; varying vec3 vColor; varying float vAlpha;
      void main(){
        float d=length(gl_PointCoord-.5)*2.0;
        float haze=pow(max(1.0-d,0.0),1.85);
        gl_FragColor=vec4(vColor,haze*vAlpha*uOpacity);
      }`,
      transparent:true,depthTest:true,depthWrite:false,blending:THREE.AdditiveBlending
    });
    const dust=new THREE.Points(geom,mat);
    dust.frustumCulled=false;
    dust.renderOrder=-16;
    // An extra bright central cluster is 3D glowing particles, not a bitmap.
    const n=1400,corePos=new Float32Array(n*3),coreSizes=new Float32Array(n),coreColors=new Float32Array(n*3),coreOpacity=new Float32Array(n);
    for(let i=0;i<n;i++){
      const rx=normal()*150,ry=normal()*56;
      const j=3*i;
      corePos[j]=-370+rx*ct-ry*st;
      corePos[j+1]=105+rx*st+ry*ct;
      corePos[j+2]=-2650+normal()*36;
      coreSizes[i]=9+random()*18;
      coreColors[j]=1;coreColors[j+1]=.75+random()*.17;coreColors[j+2]=.42+random()*.27;
      coreOpacity[i]=.12+random()*.14;
    }
    const coreGeom=new THREE.BufferGeometry();
    coreGeom.setAttribute('position',new THREE.BufferAttribute(corePos,3));
    coreGeom.setAttribute('aColor',new THREE.BufferAttribute(coreColors,3));
    coreGeom.setAttribute('aSize',new THREE.BufferAttribute(coreSizes,1));
    coreGeom.setAttribute('aAlpha',new THREE.BufferAttribute(coreOpacity,1));
    const coreMat=mat.clone();coreMat.uniforms.uTime=mat.uniforms.uTime;coreMat.uniforms.uOpacity=mat.uniforms.uOpacity;
    const center=new THREE.Points(coreGeom,coreMat);center.frustumCulled=false;center.renderOrder=-15;
    // Procedural, animated gaseous glow, shaded on the GPU without a texture or
    // a background PNG. Placed behind separate 3D dust layers for parallax.
    const gasGeometry=new THREE.BufferGeometry();
    const cx=-370,cy=105,gw=3000,gh=1950,gz=-2780;
    gasGeometry.setAttribute('position',new THREE.BufferAttribute(new Float32Array([
      cx-gw/2,cy-gh/2,gz, cx+gw/2,cy-gh/2,gz, cx+gw/2,cy+gh/2,gz,
      cx-gw/2,cy-gh/2,gz, cx+gw/2,cy+gh/2,gz, cx-gw/2,cy+gh/2,gz
    ]),3));
    gasGeometry.setAttribute('uv',new THREE.BufferAttribute(new Float32Array([
      0,0,1,0,1,1,0,0,1,1,0,1
    ]),2));
    const gasMaterial=new THREE.ShaderMaterial({
      uniforms:{uTime:mat.uniforms.uTime,uOpacity:mat.uniforms.uOpacity},
      vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
      fragmentShader:`varying vec2 vUv;uniform float uTime;uniform float uOpacity;
      float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
      float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
        return mix(mix(h(i),h(i+vec2(1.,0.)),f.x),mix(h(i+vec2(0.,1.)),h(i+vec2(1.,1.)),f.x),f.y);}
      void main(){
        // The ellipse and edge alpha mask stay fixed. Animate ONLY internal
        // swirls/noise in normalized elliptical coordinates, never the quad.
        vec2 p=(vUv-.5)*vec2(3.1,2.05);
        mat2 tilt=mat2(.866,-.5,.5,.866);
        p=tilt*p;p.y*=1.58;
        float r=length(p); // time-independent silhouette
        float inner=1.0-smoothstep(.20,1.65,r);
        float orbit=uTime*mix(.023,.044,inner);
        float c=cos(orbit),sn=sin(orbit);
        vec2 swirl=vec2(p.x*c-p.y*sn,p.x*sn+p.y*c);
        float theta=atan(swirl.y,swirl.x);
        float flow=uTime*.048;
        float cloudy=n(swirl*4.0+vec2(flow*.38,-flow*.21));
        float wisps=n(swirl*9.0-vec2(flow*.30,flow*.24));
        float arm=sin(theta*3.0-r*10.0+cloudy*2.7-flow*.15);
        float arms=smoothstep(-.48,.77,arm)*exp(-r*1.35);
        float depth=(.29+.71*cloudy)*(.5+.5*wisps);
        float core=exp(-r*r*12.0);
        float halo=exp(-r*r*3.25);
        float mask=1.0-smoothstep(.35,1.7,r);
        float dust=(arms*depth*.88+halo*.18+core*.88)*mask;
        float aura=exp(-pow(max(r-.55,0.0),2.0)*5.2)*mask;
        aura*=.36+.22*n(swirl*2.15-vec2(flow*.18,flow*.12));
        float breathe=.94+.06*sin(uTime*.31);
        vec3 blue=vec3(.17,.24,.47),purple=vec3(.33,.16,.40);
        vec3 gold=vec3(.99,.70,.35);
        vec3 auraBlue=vec3(.18,.38,.82);
        vec3 tint=mix(blue,purple,clamp(n(swirl*2.4+3.0),0.0,1.0));
        tint=mix(tint,gold,clamp(core*.92+halo*.18,0.0,1.0));
        tint=mix(tint,auraBlue,clamp(aura*.9,0.0,0.58));
        float alpha=(dust*.69+aura*.34*breathe)*uOpacity;
        gl_FragColor=vec4(tint,alpha);
      }`,
      transparent:true,depthWrite:false,depthTest:true,blending:THREE.AdditiveBlending
    });
    const gas=new THREE.Mesh(gasGeometry,gasMaterial);
    gas.renderOrder=-19;gas.frustumCulled=false;
    const group=new THREE.Group();group.add(gas,dust,center);
    return {group,material:mat,gas,dust,center};
  }
  async function loadPlanets(THREE){
    const embedded=window.__ORBIT_PLANETS_B64__;
    if(!embedded || !embedded.blue || !embedded.red){console.error('[EXPLORE] offline GLBs not embedded');return;}
    const loader=new THREE.GLTFLoader();loader.setMeshoptDecoder(THREE.MeshoptDecoder);
    const models={};
    for(const kind of ['blue','red']){
      try{
        const gltf=await loader.parseAsync(fromB64(embedded[kind]),'');
        const bounding=new THREE.Box3().setFromObject(gltf.scene);
        const size=bounding.getSize(new THREE.Vector3());
        const center=bounding.getCenter(new THREE.Vector3());
        models[kind]={scene:gltf.scene,center,size};
      }catch(err){console.error('[EXPLORE] planet loading',kind,err);}
    }
    for(const [i,p] of PROJECTS.entries()){
      const original=models[p.kind];if(!original)continue;
      const group=new THREE.Group();
      const spin=new THREE.Group();
      const copy=original.scene.clone(true);
      // Scale the *centered pivot*, not the model.  The old model-space offset
      // was left unscaled and rotated around the wrong origin, making a visible
      // planet drift away from its projected HTML click target.
      copy.position.sub(original.center);
      const materials=[];
      copy.traverse(node=>{
        if(!node.isMesh)return;
        const originalMaterials=Array.isArray(node.material)?node.material:[node.material];
        const clonedMaterials=originalMaterials.filter(Boolean).map(material=>{
          const clone=material.clone();
          const baseOpacity=typeof clone.opacity==='number'?clone.opacity:1;
          materials.push({material:clone,baseOpacity,
            baseTransparent:!!clone.transparent,baseDepthWrite:clone.depthWrite});
          return clone;
        });
        node.material=Array.isArray(node.material)?clonedMaterials:clonedMaterials[0];
        node.frustumCulled=false;
      });
      const maxSize=Math.max(original.size.x,original.size.y,original.size.z,1e-5);
      spin.scale.setScalar(235/maxSize);
      spin.add(copy);
      group.add(spin);
      group.position.set((p.x-50)*40,(50-p.y)*32,cameraOrigin-(p.z-V42.start)*V42.worldStep);
      group.visible=false;
      sceneRef.add(group);
      meshes.set(p.key,{group,spin,copy,materials,p,index:i,revealed:active,dragging:false,pauseSpinUntil:0,inertia:null});
    }
    console.info('[EXPLORE] original 3D GLBs loaded',meshes.size,'project planets');
  }
  function onReady(){
    if(api)return;
    api=window.__ORBIT_3D_SCENE;const THREE=window.__ORBIT_3D_LIB;
    if(!api||!THREE)return;
    sceneRef=api.stage.scene;
    cameraRef=api.stage.camera;
    cameraOrigin=api.stage.metrics.camDistance;
    galaxy=buildGalaxy(THREE);
    galaxy.spiral=buildSpiralGalaxy(THREE);
    // Galaxy is farther than all six project planets; scaling preserves its
    // projected layout while letting the real z-buffer keep planets in front.
    galaxy.spiral.group.scale.setScalar(23);
    galaxy.group.add(galaxy.spiral.group);
    sceneRef.add(galaxy.group);
    // Distance atmosphere. It is activated ONLY on EXPLORE entry, never on INTRO/PROFILE.
    const fogColor=api.light.starMat.color.clone().set('#0B101C');
    exploreFog={name:'ExploreDistanceAtmosphere',isFogExp2:true,color:fogColor,density:.000043};
    void loadPlanets(THREE);
    api.stage.onUpdate(render);
    const qs=new URLSearchParams(location.search);
    if(qs.get('jump')==='explore'){
      const wait=()=>{ if(!meshes.size){requestAnimationFrame(wait);return;} enter(true);};
      // Explicit development jump, not a navigation UI.
      setTimeout(wait,700);
    }
  }
  window.addEventListener('orbit3dready',onReady);
  if(window.__ORBIT_3D_SCENE)onReady();
  function enter(skipMotion=false){
    if(active||entering||!api)return;
    entering=true;
    profile.classList.add('orbit-is-exiting');
    const delay=skipMotion?0:790;
    setTimeout(()=>{
      profile.hidden=true;profile.classList.remove('orbit-is-exiting');
      root.hidden=false;
      active=true;entering=false;enterTimestamp=performance.now();
      if(introPromptTimer)clearTimeout(introPromptTimer);
      explorePrompt.classList.remove('is-showing');
      clearPromptTilt();
      // Visible for two seconds after fade-in, then faded out (one-time on entry).
      requestAnimationFrame(()=>requestAnimationFrame(()=>explorePrompt.classList.add('is-showing')));
      introPromptTimer=setTimeout(()=>explorePrompt.classList.remove('is-showing'), 2550);
      window.__CLEAR_ORBIT_STATE='EXPLORE';
      window.dispatchEvent(new Event('orbit:explore-enter'));
      if(!window.__CLEAR_ORBIT_LOGO_NAV_ACTIVE)api.logo.root.visible=false;
      sceneRef.fog=exploreFog;
      if(galaxy)galaxy.group.visible=true;
      meshes.forEach(m=>{m.revealed=true;m.group.visible=false;});
      requestAnimationFrame(()=>root.classList.add('is-visible'));
    },delay);
  }
  // 01-1/01-2 -> 02-0: user-approved one wheel turn (v1.31).
  function wheel(event){
    if(event.ctrlKey||event.metaKey||event.target.closest?.('input,textarea,select'))return;
    if(satelliteActive){
      event.preventDefault();
      if(event.deltaY>0){window.ClearOrbitSatellite?.forward?.();return;}
      if(event.deltaY<0){
        const goBack=window.ClearOrbitSatellite?.back?.();
        if(goBack!==true)leaveSatellite();
      }
      return;
    }
    if(active){
      // A detail panel has its own native scroll. Prevent Explore from stealing its wheel.
      if(selected && event.target.closest?.('#orbit-detail-scroll'))return;
      event.preventDefault();
      if(selected)return; // Camera focus blocks double-selection and wheel conflicts.
      const unit=event.deltaMode===1?16:event.deltaMode===2?innerHeight:1;
      const delta=clamp(event.deltaY*unit,-250,250); // tame single-notch wheel spikes
      const nearest=Math.min(...PROJECTS.map(p=>Math.abs(p.z-target)));
      const slowdown=nearest<5.5?.58:nearest<10?.84:1.25;
      target=clamp(target+delta*V42.wheelGain*slowdown,INITIAL_TRAVEL,V42.end);
    }else if(!entering && !profile.hidden && profile.classList.contains('is-visible')){
      if(event.deltaY<=0){wheelThreshold=Math.max(0,wheelThreshold+event.deltaY);return;}
      wheelThreshold+=event.deltaY*(event.deltaMode===1?16:event.deltaMode===2?innerHeight:1);
      if(wheelThreshold>=PROFILE_WHEEL_TRIGGER){event.preventDefault();enter();}
    }
  }
  window.addEventListener('wheel',wheel,{passive:false});
  window.addEventListener('keydown',event=>{
    if(satelliteActive && !event.altKey && !event.ctrlKey && !event.metaKey){
      if(event.key==='ArrowUp'||event.key==='PageUp'){
        event.preventDefault();
        if(window.ClearOrbitSatellite?.back?.()!==true)leaveSatellite();
      }else if(event.key==='ArrowDown'||event.key==='PageDown'){
        event.preventDefault();window.ClearOrbitSatellite?.forward?.();
      }
      return;
    }
    if(!active||event.altKey||event.ctrlKey||event.metaKey)return;
    if(event.key==='Escape' && selected){
      if(window.ClearOrbitProjectDetail?.state?.visible){event.preventDefault();window.ClearOrbitProjectDetail.close();return;}
      releaseFocus();return;
    }
    if(selected)return;
    if(event.target.closest?.('button,input,textarea,select'))return;
    const move={ArrowDown:110,PageDown:250,ArrowUp:-110,PageUp:-250}[event.key];
    if(move){event.preventDefault();target=clamp(target+move*V42.wheelGain,INITIAL_TRAVEL,V42.end);}
    if(event.key==='Home'){event.preventDefault();reset();}
  });
  let touchY=null;
  root.addEventListener('touchstart',event=>{if(event.touches.length===1)touchY=event.touches[0].clientY;},{passive:true});
  root.addEventListener('touchend',event=>{
    if(touchY===null||!active||selected)return;
    const delta=touchY-event.changedTouches[0].clientY;touchY=null;
    if(Math.abs(delta)>15)target=clamp(target+delta*.09,INITIAL_TRAVEL,V42.end);
  },{passive:true});
  ui.reset.addEventListener('click',reset);
  function reset(){
    if(selected)beginReturn();
    selected=null;focus=null;target=INITIAL_TRAVEL;
    window.dispatchEvent(new Event('orbit:project-released'));
    hovered.clear();
    hidePlanetPreview();
    window.__CLEAR_ORBIT_STATE='EXPLORE';
    // Reset changes navigation only; never replace/remove the HUD divider.
    root.classList.remove('orbit-hud-divider-hidden');
  }
  function beginReturn(){
    if(!cameraRef)return;
    const THREE=window.__ORBIT_3D_LIB;
    returning={
      progress:0,
      startPosition:cameraRef.position.clone(),
      startLook:cameraRef.position.clone().add(cameraRef.getWorldDirection(new THREE.Vector3()).multiplyScalar(1600)),
    };
  }
  function releaseFocus(){
    if(selected)beginReturn();
    selected=null;focus=null;target=returnTravel;
    window.dispatchEvent(new Event('orbit:project-released'));
    window.__CLEAR_ORBIT_STATE='EXPLORE';
  }
  function makeFocus(p){
    const THREE=window.__ORBIT_3D_LIB;
    const cam=cameraRef, mesh=meshes.get(p.key);
    const center=mesh.group.getWorldPosition(new THREE.Vector3());
    const fromPosition=cam.position.clone();
    const fromLook=cam.position.clone().add(cam.getWorldDirection(new THREE.Vector3()).multiplyScalar(1600));
    // Vary the orbital approach direction by the planet's original lane.
    // Final framing is always the same: planet on the LEFT, space on the RIGHT.
    const yaw=(p.x<50?-1:1)*0.38;
    // v1.50.11: focused project only; pull back to fit a smaller planet in the
    // newly compact left information area. Exploration GLB scale stays 1:1.
    const distance=1870;
    const goalPosition=center.clone().add(new THREE.Vector3(Math.sin(yaw)*distance,75,Math.cos(yaw)*distance));
    const rootRect=root.getBoundingClientRect();
    // v1.50.3 — shift the selected planet and its attached project nameplate
    // left by ~0.105 stage widths, following the red annotated target circle.
    // The actual 3D camera target moves; DOM hitbox/label remain projected
    // from the same mesh, preserving selection and drag rotation alignment.
    const desiredX=(rootRect.left+rootRect.width*.096)/window.innerWidth;
    const desiredY=(rootRect.top+rootRect.height*.480)/window.innerHeight;
    const targetX=desiredX*2-1,targetY=1-desiredY*2;
    // Calculate a world-space gaze offset from actual camera aspect & FOV.
    // This keeps the finished planet center at the DESIGN target for all ratios.
    const right=new THREE.Vector3(Math.cos(yaw),0,-Math.sin(yaw));
    const up=new THREE.Vector3(0,1,0);
    const hh=distance*Math.tan(cam.fov*Math.PI/360), hw=hh*cam.aspect;
    const goalLook=center.clone().addScaledVector(right,-targetX*hw).addScaledVector(up,-targetY*hh);
    // Improve perspective accuracy after yaw + vertical framing by projection feedback.
    const originalPosition=cam.position.clone(), originalQuaternion=cam.quaternion.clone();
    cam.position.copy(goalPosition);
    for(let n=0;n<3;n++){
      cam.lookAt(goalLook);cam.updateMatrixWorld();
      const actual=center.clone().project(cam);
      const camRight=new THREE.Vector3().setFromMatrixColumn(cam.matrixWorld,0);
      const camUp=new THREE.Vector3().setFromMatrixColumn(cam.matrixWorld,1);
      goalLook.addScaledVector(camRight,(actual.x-targetX)*hw);
      goalLook.addScaledVector(camUp,(actual.y-targetY)*hh);
    }
    cam.position.copy(originalPosition);cam.quaternion.copy(originalQuaternion);cam.updateMatrixWorld();
    return {progress:0,notified:false,fromPosition,fromLook,goalPosition,goalLook,project:p.key};
  }
  function pick(p){
    if(!active||selected||!meshes.has(p.key)||!pending.get(p.key)?.classList.contains('is-frontmost'))return;
    returnTravel=target;
    returning=null;
    selected=p.key;
    hidePlanetPreview();
    const isNewVisit=!visited.has(p.key);
    visited.add(p.key);
    if(isNewVisit){ui.count.textContent=visited.size+'/6';pulseVisitCounter();}
    target=clamp(p.z-5.5,V42.start,V42.end);
    focus=makeFocus(p);
    window.__CLEAR_ORBIT_STATE='PROJECT_APPROACH';
    // The shared DETAIL controller waits for the actual camera approach to finish.
    window.dispatchEvent(new CustomEvent('orbit:project-selected',{detail:{project:p.key,index:PROJECTS.indexOf(p)}}));
  }
  function setHudTitle(next){
    if(next===hudCurrent)return;
    hudCurrent=next;
    fitHudText(ui.name.textContent||'',next);
    if(hudTypeTimer)clearInterval(hudTypeTimer);
    let old=ui.name.textContent||'', phase='out', index=old.length;
    hudTypeTimer=setInterval(()=>{
      if(phase==='out'){
        index=Math.max(0,index-1);
        ui.name.textContent=old.slice(0,index);
        if(index===0){phase='in';index=0;clearInterval(hudTypeTimer);
          hudTypeTimer=setInterval(()=>{
            index=Math.min(next.length,index+1);ui.name.textContent=next.slice(0,index);
            if(index===next.length){clearInterval(hudTypeTimer);hudTypeTimer=null;fitHudText(next);}
          },25);
        }
      }
    },6);
  }
  function render(time,dt){
    if((!active && !satelliteActive && !contactBackdrop)||!api)return;
    const dtime=clamp(dt||.016,.001,.1);
    if(active)travel=ease(travel,target,dtime,V42.inertiaMs/1000);
    // Reach the final destination without requiring a redundant extra wheel tick
    // after the travel inertia settles near the end of the approved 6-planet path.
    if(active && !selected && target>=V42.end-.03 && travel>70.4){
      enterSatellite();return;
    }
    const cam=cameraRef;
    const THREE=window.__ORBIT_3D_LIB;
    const cameraZ=cameraOrigin-(travel-V42.start)*V42.worldStep;
    // One shared camera. The project move changes BOTH position and look target:
    // a gentle sideways orbit, not only a horizontal translation.
    if(satelliteActive || contactBackdrop){
      cam.position.set(0,0,contactBackdrop?cameraOrigin:cameraZ);
      cam.lookAt(0,0,(contactBackdrop?cameraOrigin:cameraZ)-1600);
    }else if(selected && focus){
      focus.progress=clamp(focus.progress+dtime/1.45,0,1);
      const t=focus.progress, smooth=t*t*(3-2*t);
      cam.position.copy(focus.fromPosition).lerp(focus.goalPosition,smooth);
      const gaze=focus.fromLook.clone().lerp(focus.goalLook,smooth);
      cam.lookAt(gaze);
      if(t>=1 && !focus.notified){
        focus.notified=true;
        window.dispatchEvent(new CustomEvent('orbit:project-focus-complete',{detail:{project:focus.project}}));
      }
    }else if(returning){
      returning.progress=clamp(returning.progress+dtime/1.25,0,1);
      const t=returning.progress,smooth=t*t*(3-2*t);
      const destination=new THREE.Vector3(0,0,cameraZ);
      cam.position.copy(returning.startPosition).lerp(destination,smooth);
      const endLook=new THREE.Vector3(0,0,cameraZ-1600);
      cam.lookAt(returning.startLook.clone().lerp(endLook,smooth));
      if(t>=1)returning=null;
    }else{
      cam.position.set(ease(cam.position.x,0,dtime,.35),ease(cam.position.y,0,dtime,.35),cameraZ);
      cam.lookAt(cam.position.x,cam.position.y,cameraZ-1600);
    }
    if(cam.far<90000){cam.far=90000;cam.updateProjectionMatrix();}
    cam.updateMatrixWorld();
    if(!window.__CLEAR_ORBIT_LOGO_NAV_ACTIVE)api.logo.root.visible=false;
    if(galaxy){
      // v1.47.6: retain the genuine procedurally generated 3D spiral.
      // A previous update crossfaded it behind a photo texture and made it disappear.
      // No photograph, alternate bitmap, camera reset or visibility cut occurs here.
      galaxy.group.visible=true;
      galaxy.material.uniforms.uOpacity.value=ease(
        galaxy.material.uniforms.uOpacity.value,1,dtime,.38);
      galaxy.group.position.set(cam.position.x,cam.position.y,cam.position.z);
      // Background and the visible galactic ellipse never rotate as one object.
      galaxy.group.rotation.z=0;
      galaxy.material.uniforms.uTime.value=time;
      // Time from Stage3D is ALREADY in seconds. Feed it without the old
      // 1/1000 factor: dust, core, spiral light and blue gas move via shaders.
      // Orbital animation is GPU-driven around (-370, 105), without touching
      // Three.js mesh rotations (which would displace the nebula's pivot).
      galaxy.spiral.material.uniforms.uTime.value=time;
      const targetGalaxyStrength=(satelliteActive||contactBackdrop)
        ? .94 : clamp((travel-24)/43,0,.94);
      galaxy.spiral.material.uniforms.uOpacity.value=ease(
        galaxy.spiral.material.uniforms.uOpacity.value,targetGalaxyStrength,dtime,.9);
    }
    if(satelliteActive || contactBackdrop)return;
  
    const viewWidth=1440,viewHeight=1024;
    const stageRect=root.getBoundingClientRect();
    const scale=stageRect.width/viewWidth || 1;
    let nearest=null,nearestDistance=Infinity;
    let labelCandidate=null,labelScore=Infinity;
    const distantPoints=[];
    for(const p of PROJECTS){
      const m=meshes.get(p.key),button=pending.get(p.key);
      if(!m){button.style.display='none';continue;}
      
      const dist=p.z-travel;
      // All six planets enter together: one shared opacity animation, no stagger.
      const cameraDistance=Math.max(0,cam.position.z-m.group.position.z);
      // Approach sequence: distant 5px light -> progressively growing luminous disc
      // -> the real GLB silhouette gradually replaces the light at matched diameter.
      // Fade both layers together only at the final portion of the approach.
      const distanceToPlanet=cam.position.distanceTo(m.group.position);
      const progress=clamp((distanceToPlanet-DISTANT_LIGHT.start)/
                           (DISTANT_LIGHT.end-DISTANT_LIGHT.start),0,1);
      const smoothstep=(a,b,x)=>{const t=clamp((x-a)/(b-a),0,1);return t*t*(3-2*t);};
      // Slow crossfade. The globe becomes visible before the luminous layer
      // reaches a substantial size, avoiding the abrupt white flash.
      const meshFade=1-smoothstep(.32,.88,progress);
      // Keep a tiny residual glimmer even near the globe, except at close fly-by.
      const pointBlend=.065+.935*smoothstep(.035,.94,progress);
      // No hard binary 'pinpoint' appearance switch: that changed both the
      // 22px diffraction size and CSS masks at 26.5k and looked like a pop.
      // A single timestamp drives the entrance opacity for ALL planets at once.
      const entrance=smoothstep(0,1,(performance.now()-enterTimestamp)/1100);
      // The focused DETAIL planet remains its exact camera-framed size on hover.
      const hover=!selected && hovered.has(p.key);
      const targetScale=hover?1.3:1;
      const s=m.group.scale.x || 1;
      m.group.scale.setScalar(ease(s,targetScale,dtime,.17));
      if(m.restoreRotation && !m.dragging){
        const r=m.restoreRotation;
        const t=clamp((performance.now()-r.start)/r.duration,0,1);
        const k=1-Math.pow(1-t,3);
        m.spin.rotation.set(r.fromX+(r.to.x-r.fromX)*k,
          r.fromY+(r.to.y-r.fromY)*k,r.fromZ+(r.to.z-r.fromZ)*k);
        if(t>=1)m.restoreRotation=null;
      }
      if(!m.dragging && m.inertia){
        const friction=Math.exp(-Math.min(dtime,.05)*5.2);
        m.spin.rotation.y+=m.inertia.vy*dtime;
        m.spin.rotation.x=clamp(m.spin.rotation.x+m.inertia.vx*dtime,-Math.PI*.45,Math.PI*.45);
        m.inertia.vx*=friction;m.inertia.vy*=friction;
        if(Math.hypot(m.inertia.vx,m.inertia.vy)<.018)m.inertia=null;
      }
      // The model's world-up axis should remain upright after pointer release.
      // X (pitch) and Z (roll) magnetically return to neutral while Y keeps
      // the user's horizontal drag inertia. Frame-rate-independent easing.
      if(!m.dragging && !m.restoreRotation){
        m.spin.rotation.x=ease(m.spin.rotation.x,0,dtime,.24);
        m.spin.rotation.z=ease(m.spin.rotation.z,0,dtime,.24);
        if(Math.abs(m.spin.rotation.x)<.00015)m.spin.rotation.x=0;
        if(Math.abs(m.spin.rotation.z)<.00015)m.spin.rotation.z=0;
      }
      if(!m.dragging && !m.restoreRotation && !m.inertia && performance.now()>=m.pauseSpinUntil)
        m.spin.rotation.y+=dtime*.35*(hover?1.3:1); // resume 1.2s after release
      if(m.revealed){
        // The mesh becomes completely invisible before fog can leave a dark silhouette.
        // The bright point remains in DOM screen space and is not darkened by scene fog.
        m.group.visible=meshFade>.001;
        for(const entry of m.materials){
          const mat=entry.material;
          mat.opacity=entry.baseOpacity*meshFade*entrance;
          // Restore the ORIGINAL opaque depth/material properties at close range.
          const translucent=meshFade*entrance<.999 || entry.baseTransparent;
          if(mat.transparent!==translucent){mat.transparent=translucent;mat.needsUpdate=true;}
          mat.depthWrite=translucent?false:entry.baseDepthWrite;
        }
      }
      // The Three.js canvas occupies the ENTIRE viewport, while #stage is a
      // 1440×1024 design rectangle scaled and letterboxed in the center.
      // Convert projected viewport pixels back into local stage coordinates.
      // Mapping NDC directly to 1440×1024 misplaced clickable targets on 16:9.
      const position=m.group.getWorldPosition(new THREE.Vector3());
      const screen=position.clone().project(cam);
      const screenX=(screen.x*.5+.5)*window.innerWidth;
      const screenY=(-screen.y*.5+.5)*window.innerHeight;
      const originalX=(screenX-stageRect.left)/scale;
      const originalY=(screenY-stageRect.top)/scale;
      // Far lights may spread apart visually like a constellation; physical GLB
      // projections stay EXACTLY where they were. The spread eases to zero
      // before the actual sphere becomes visible, preserving click alignment.
      // v1.41: Projected x/y MUST follow one monotone, reversible curve.
      // Previously the spread was multiplied by (1-meshFade) TWICE and changed
      // over only 12k units. That sudden compensation could overcome normal
      // perspective growth, visually pulling a point INWARD while approaching
      // and then making it jump outward again (the small "bouncy" movement).
      // A much wider 18k–54k window makes spread a gently varying function of
      // actual 3D distance, with zero spread before the visible sphere reaches
      // its full size. Never interpolate from a previous-frame XY position.
      const farSpread=smoothstep(18000,54000,distanceToPlanet);
      const x=originalX+(originalX-720)*.46*farSpread;
      const y=originalY+(originalY-512)*.24*farSpread;
      // Project the physical planet radius around its corrected pivot; the DOM
      // hit circle stays on top of the actual mesh at any depth and resolution.
      const right=new THREE.Vector3().setFromMatrixColumn(cam.matrixWorld,0);
      const edge=position.clone().addScaledVector(right,117.5*m.group.scale.x).project(cam);
      const pixels=Math.abs(edge.x-screen.x)*window.innerWidth/scale;
      const cameraDist=distanceToPlanet;
      const visible=cameraDist>cameraRef.near+70 && cameraDist<78000 && x>-pixels && x<viewWidth+pixels && y>-pixels && y<viewHeight+pixels && m.revealed && screen.z>-1 && screen.z<1;
      distantPoints.push({x,y,visible,amount:farSpread*entrance});
      button.style.display=visible?'block':'none';
      if(!visible)button.classList.remove('is-pinpoint');
      if(visible){
        const size=clamp(pixels,26,800);
        button.style.left=x.toFixed(2)+'px';button.style.top=y.toFixed(2)+'px';
        button.style.width=size.toFixed(2)+'px';button.style.height=size.toFixed(2)+'px';
        // The 5px minimum light point is a DOM overlay unaffected by dark WebGL fog.
        // The existing DOM hit target stays the same size and exactly centered.
        button.style.opacity=entrance.toFixed(4);
        button.style.setProperty('--orbit-point-opacity',pointBlend.toFixed(4));
        // Point grows with approaching planet until their projected diameters meet.
        // Its final fade overlaps the appearance of the textured globe.
        // Match the REAL projected globe diameter (pixels is its radius).
        // The light NEVER exceeds 64% of the sphere silhouette. At close
        // range it contracts rather than swelling into a white "pop".
        const globeDiameter=Math.max(2, pixels*2);
        const growing=smoothstep(.06,.74,1-progress);
        const nearDamping=smoothstep(.02,.28,progress);
        const pointDiameter=Math.min(globeDiameter*.64, 5+Math.max(0,globeDiameter*.64-5)*growing*nearDamping);
        button.style.setProperty('--orbit-point-size',Math.max(5,pointDiameter).toFixed(2)+'px');
        button.style.setProperty('--orbit-point-softness',smoothstep(.1,.6,progress).toFixed(4));
        button.style.setProperty('--orbit-ray-fade',meshFade.toFixed(4));
        // Blend into the distant (+) diffraction seamlessly instead of
        // toggling the old .is-pinpoint class at an exact depth threshold.
        button.style.setProperty('--orbit-far-glint',(smoothstep(.55,.98,progress)*(1-meshFade)).toFixed(4));
        // Near planets keep the approved subtle halo and (+) diffraction.
        // The flare fades out with the mesh and leaves a bright point at distance.
        // A CSS silhouette mask keeps rays from covering the planet body.
        const distant=clamp((cameraDist-3000)/37000,0,1);
        const streakSize=clamp(38+80*Math.pow(distant,.85)+size*.17,46,152);
        const haloScale=1+.12*distant;
        const streakBlend=1-smoothstep(.65,.98,progress);
        const continuousStreak=22+(streakSize-22)*streakBlend;
        button.style.setProperty('--orbit-glint-size',continuousStreak.toFixed(2)+'px');
        button.style.setProperty('--orbit-halo-scale',haloScale.toFixed(3));
        button.style.setProperty('--orbit-mask-inner',(size*.43*meshFade).toFixed(1)+'px');
        button.style.setProperty('--orbit-mask-outer',(size*.52*meshFade).toFixed(1)+'px');
        button.style.setProperty('--orbit-halo-mask-inner',(size*.43*meshFade/haloScale).toFixed(1)+'px');
        button.style.setProperty('--orbit-halo-mask-outer',(size*.52*meshFade/haloScale).toFixed(1)+'px');
        // Keep the CSS and mesh appearance in one continuous state; no
        // is-pinpoint selector may abruptly replace backgrounds or masks.
        button.classList.remove('is-pinpoint');
        // Only ONE label for the foremost, currently navigable project.
        if(dist>-2.5 && dist<19 && (selected===p.key || selected===null)){
          const score=Math.abs(dist-3);
          if(score<labelScore){labelCandidate=p.key;labelScore=score;}
        }
      }
      if(dist>-3 && dist<11 && Math.abs(dist)<nearestDistance){nearest=p;nearestDistance=Math.abs(dist);}
      // Visiting by scroll/approach must NOT count: only pick(p) records clicks.
    }
    // Lines are visible only between distant points; they fade out before
    // mesh silhouettes emerge. Keep the 0.6px hairline, but make the
    // constellation just slightly easier to see (13% -> 16% peak alpha).
    for(let i=0;i<constellationLines.length;i++){
      const a=distantPoints[i],b=distantPoints[i+1],line=constellationLines[i];
      const opacity=a&&b&&a.visible&&b.visible ?
        Math.min(a.amount,b.amount)*.16 : 0;
      line.setAttribute('x1',a?.x||0);line.setAttribute('y1',a?.y||0);
      line.setAttribute('x2',b?.x||0);line.setAttribute('y2',b?.y||0);
      line.style.opacity=opacity.toFixed(4);
    }
    const activeLabel=selected||labelCandidate;
    // Only the foremost nearby project can receive hover, focus, click or drag.
    // Distant project buttons remain visible as celestial lights but never intercept input.
    for(const [key,button] of pending){
      const foreground=key===activeLabel && button.style.display==='block';
      button.classList.toggle('is-label-visible',foreground);
      button.classList.toggle('is-frontmost',foreground);
      button.classList.toggle('is-visited',visited.has(key));
      button.classList.toggle('is-unvisited',!visited.has(key));
      button.disabled=!foreground;
      if(!foreground){hovered.delete(key);if(previewKey===key)hidePlanetPreview();}
    }
    // A preview is valid only while this same nearby planet has its visible nameplate.
    // Hide it during distant-star exploration and as soon as label ownership changes.
    if(previewKey && (selected || previewKey!==activeLabel ||
      pending.get(previewKey)?.style.display!=='block'))hidePlanetPreview();
    // v1.42: The HUD location name follows the EXACT same visible planet
    // label state. Do not preannounce a project merely because scrolling has
    // brought its world position into the old, wider nearest-distance range.
    // Also avoid showing a name if its label button is outside the viewport.
    const visibleLabel=activeLabel && pending.get(activeLabel)?.style.display==='block'
      ? PROJECTS.find(p=>p.key===activeLabel) : null;
    const title=visibleLabel?visibleLabel.hud:'DISTANT SIGNALS AHEAD';
    setHudTitle(title);
    ui.count.textContent=visited.size+'/6';
    const next=PROJECTS.find(p=>p.z>=travel+2.5);
    const distance=next?next.z-travel:7;
    const bars=clamp(1+Math.floor((30-distance)/8),1,4);
    [...ui.signal.children].forEach((bar,i)=>bar.classList.toggle('is-lit',i>=4-bars));
  }
  function enterSatellite(){
    if(satelliteActive || selected || !active)return;
    hidePlanetPreview();
    satelliteActive=true;active=false;
    root.classList.remove('is-satellite-reversing');
    root.classList.add('is-satellite');
    if(introPromptTimer)clearTimeout(introPromptTimer);
    explorePrompt.classList.remove('is-showing');
    // v1.47.3: preserve an in-progress title typewriter throughout the
    // slow HUD withdrawal; the live letters continue until the word completes.
    // Do not replace the title with an invented CONTACT label.
    meshes.forEach(m=>{m.group.visible=false;});
    pending.forEach(button=>{button.style.display='none';});
    window.__CLEAR_ORBIT_STATE='SATELLITE';
    window.dispatchEvent(new Event('orbit:satellite-enter'));
  }
  function leaveSatellite(){
    if(!satelliteActive)return;
    satelliteActive=false;active=true;
    root.classList.remove('is-satellite','is-satellite-reversing');
    target=travel=68.5;
    window.__CLEAR_ORBIT_STATE='EXPLORE';
    window.dispatchEvent(new Event('orbit:satellite-exit'));
  }
  // Navigation from the SH 3D logo: suspend Explore without changing camera
  // focus math, visit count, or the intro/profile implementations.
  function navigateFromLogo(mode){
    if((!active && !satelliteActive) || (mode!=='profile' && mode!=='contact'))return false;
    hidePlanetPreview();
    active=false;satelliteActive=false;contactBackdrop=(mode==='contact');
    root.classList.remove('is-satellite','is-satellite-reversing');
    entering=false;selected=null;focus=null;returning=null;
    target=travel=INITIAL_TRAVEL;wheelThreshold=0;
    if(introPromptTimer)clearTimeout(introPromptTimer);
    explorePrompt.classList.remove('is-showing');clearPromptTilt();
    root.classList.remove('is-visible');root.hidden=true;
    profile.classList.remove('orbit-is-exiting');
    profile.hidden=(mode!=='profile');
    if(mode==='profile')profile.classList.add('is-visible');
    if(galaxy)galaxy.group.visible=contactBackdrop;
    meshes.forEach(m=>{m.group.visible=false;m.revealed=false;});
    if(sceneRef)sceneRef.fog=null;
    if(cameraRef){cameraRef.position.set(0,0,cameraOrigin);cameraRef.lookAt(0,0,0);}
    window.__CLEAR_ORBIT_STATE=mode.toUpperCase();
    window.dispatchEvent(new CustomEvent('orbit:logo-navigated',{detail:{mode}}));
    return true;
  }
  function setContactBackdrop(isContact){
    contactBackdrop=!!isContact;
    if(galaxy)galaxy.group.visible=contactBackdrop;
  }
  window.ClearOrbitExplore={navigateFromLogo,go:enter,reset,releaseFocus,leaveSatellite,setContactBackdrop,get state(){return {active,satelliteActive,travel,target,selected,visited:[...visited],planetsLoaded:meshes.size,worldStep:V42.worldStep,visibleLabels:[...pending].filter(([_,button])=>button.classList.contains('is-label-visible')).map(([key])=>key)};}};
})();
