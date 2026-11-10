/* One transparent Celestial mark; original camera-local 3D transmission. */
(() => {
  'use strict';
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const mark = document.getElementById('orbit-personal-logo');
  const logo = mark ? new window.CelestialLogo(mark.querySelector('canvas'), {
    active: false, padding: 1.35
  }) : null;
  let pointer = null;
  const onPointer = event => {
    if (event.pointerType !== 'touch') pointer = {x:event.clientX, y:event.clientY};
  };
  const clearPointer = () => { pointer = null; logo?.setHovered(false); };
  const onPointerOut = event => { if (!event.relatedTarget) clearPointer(); };
  document.addEventListener('pointermove', onPointer, {passive:true});
  document.addEventListener('pointerout', onPointerOut, {passive:true});
  document.addEventListener('pointercancel', clearPointer, {passive:true});
  window.addEventListener('blur', clearPointer);
  const onVisibility = () => { if (document.hidden) clearPointer(); };
  document.addEventListener('visibilitychange', onVisibility);
  function onPageHide(event) {
    clearPointer();
    if (event.persisted) return; // Keep the same instance for back/forward cache.
    logo?.destroy();
    document.removeEventListener('pointermove', onPointer);
    document.removeEventListener('pointerout', onPointerOut);
    document.removeEventListener('pointercancel', clearPointer);
    document.removeEventListener('visibilitychange', onVisibility);
    window.removeEventListener('blur', clearPointer);
    window.removeEventListener('pagehide', onPageHide);
  }
  window.addEventListener('pagehide', onPageHide);
  let radio = null, waves = [], wasRadioActive = false, nextEmission = 0;
  const RADIO_INTERVAL=1000, RADIO_LIFETIME=3600;
  let radioFadeAt=null;
  function radioIsClear(){return !radio || !waves.some(w=>w.visible && w.material.uniforms.uAlpha.value>0);}
  function beginRadioFade(){radioFadeAt=performance.now();waves.forEach(w=>{w.userData.fadeAlpha=w.material.uniforms.uAlpha.value;});}
  function cancelRadioFade(){radioFadeAt=null;}
  function finishSatellite(model, api) {
    window.ClearOrbitCinematic.finishSatellite(model, api);
  }
  function buildRadio(api) {
    const T = window.__ORBIT_3D_LIB;
    radio = new T.Group(); radio.name = 'Volumetric antenna wavefronts';
    api.stage.camera.add(radio);
    // A spherical cap, open toward the left. Each pulse has real Z depth.
    const positions = [], normals = [], uvs = [], indices = [];
    const rows = 18, columns = 64, aperture = .52;
    for (let y=0; y<=rows; y++) {
      const theta = .012 + y/rows*aperture;
      for (let x=0; x<=columns; x++) {
        const phi = x/columns*Math.PI*2;
        const nx=-Math.cos(theta), ny=Math.sin(theta)*Math.cos(phi), nz=Math.sin(theta)*Math.sin(phi);
        positions.push(nx,ny,nz); normals.push(nx,ny,nz); uvs.push(x/columns,y/rows);
        if(y<rows && x<columns){const a=y*(columns+1)+x,b=a+columns+1;indices.push(a,b,a+1,b,b+1,a+1);}
      }
    }
    const geometry = new T.BufferGeometry();
    geometry.setAttribute('position',new T.BufferAttribute(new Float32Array(positions),3));
    geometry.setAttribute('normal',new T.BufferAttribute(new Float32Array(normals),3));
    geometry.setAttribute('uv',new T.BufferAttribute(new Float32Array(uvs),2));
    geometry.setIndex(indices);
    for(let i=0;i<4;i++){
      const material=new T.ShaderMaterial({
        uniforms:{uAlpha:{value:0}}, transparent:true, depthWrite:false, depthTest:true,
        side:T.DoubleSide, blending:T.AdditiveBlending,
        vertexShader:`varying vec2 vUv;varying vec3 vNormal;varying vec3 vView;
          void main(){vUv=uv;vec4 p=modelViewMatrix*vec4(position,1.);vNormal=normalize(normalMatrix*normal);vView=-p.xyz;gl_Position=projectionMatrix*p;}`,
        fragmentShader:`uniform float uAlpha;varying vec2 vUv;varying vec3 vNormal;varying vec3 vView;
          void main(){float rim=pow(1.-abs(dot(normalize(vNormal),normalize(vView))),2.);
            float edge=exp(-pow((vUv.y-.94)*48.,2.));
            float soft=sin(vUv.y*3.14159265);
            float alpha=(soft*.045+rim*soft*.19+edge*.46)*uAlpha;
            gl_FragColor=vec4(mix(vec3(.26,.56,1.),vec3(.83,.95,1.),edge),alpha);}`
      });
      const mesh=new T.Mesh(geometry,material);mesh.frustumCulled=false;
      mesh.visible=false;mesh.userData.birth=null;
      radio.add(mesh);waves.push(mesh);
    }
  }
  function updateRadio(now, satellite, phase, transmitting, api) {
    if(!satellite || !api)return;
    if(!radio)buildRadio(api);
    const active=phase==='waiting' && transmitting && !document.hidden && radioFadeAt===null;
    if(!satellite.visible || phase==='hidden' || phase==='loading' || document.hidden){
      waves.forEach(wave=>{wave.visible=false;wave.userData.birth=null;});
      radio.visible=false;wasRadioActive=false;return;
    }
    for(const wave of waves)if(wave.userData.birth!==null && now-wave.userData.birth>=RADIO_LIFETIME){wave.userData.birth=null;wave.visible=false;}
    if(reduced){
      waves.forEach((wave,i)=>{wave.visible=active&&i===0;wave.scale.setScalar(220);wave.material.uniforms.uAlpha.value=.45;});
      radio.visible=active;
    }else{
      if(active){
        if(!wasRadioActive)nextEmission=now;
        if(now>=nextEmission){
          const wave=waves.find(wave=>wave.userData.birth===null);
          if(wave){wave.userData.birth=now;wave.visible=true;radio.userData.emitted=(radio.userData.emitted||0)+1;}
          nextEmission=now+RADIO_INTERVAL;
        }
      }
      waves.forEach(wave=>{
        if(wave.userData.birth===null)return;
        const age=Math.max(0,(now-wave.userData.birth)/RADIO_LIFETIME);
        wave.scale.setScalar(42+age*490);
        // One-way tail fade on expiry; no cyclical opacity or phase reset.
        wave.material.uniforms.uAlpha.value=.78*Math.min(1,(1-age)/.18);
      });
      radio.visible=waves.some(wave=>wave.visible);
    }
    if(radioFadeAt!==null){
      const t=Math.min(1,Math.max(0,(now-radioFadeAt)/700)),fade=1-t*t*(3-2*t);
      waves.forEach(w=>{w.material.uniforms.uAlpha.value=(w.userData.fadeAlpha||0)*fade;if(t===1){w.visible=false;w.userData.birth=null;}});
      if(t===1)radio.visible=false;
    }
    wasRadioActive=active;
    if(!radio.visible)return;
    // Attach to the craft rather than a DOM-screen coordinate. Inherit attitude.
    satellite.updateWorldMatrix(true,false);
    const T=window.__ORBIT_3D_LIB;
    const emitter=new T.Vector3(-32/satellite.scale.x,54/satellite.scale.y,0);
    satellite.localToWorld(emitter);api.stage.camera.worldToLocal(emitter);
    radio.position.copy(emitter);radio.quaternion.copy(satellite.quaternion);
    radio.rotateZ(-.13);radio.rotateY(.24);
  }
  function updateLogo() {
    if (!logo || logo.destroyed) return;
    const api=window.__ORBIT_3D_SCENE, intro=api?.intro;
    if(intro) {
      const previousCore=logo.coreScale, previousBoost=logo.introBoost, previousOrbit=logo.orbitVisibility;
      // Keep the original broad transition wash, replacing only its old star,
      // halo and glow with the same optical core used by the completed mark.
      api.light.starGroup.visible=false;
      api.light.group.children[1].visible=false;
      api.light.group.children[2].visible=false;
      const phase=intro.machine.state;
      const growing=phase==='INTRO_IDLE' || phase==='INTRO_STAR_GLOW';
      const growth=Math.max(0,Math.min(1,(intro.fx.starScale-1)/(248/60-1)));
      logo.coreScale=growing ? 60/(412*1199/1312)+(1-60/(412*1199/1312))*growth : 1;
      logo.introBoost=1+intro.fx.glow*intro.fx.lightOpacity*2;
      logo.orbitVisibility=Number(mark.dataset.orbitReveal ?? 1);
      if(previousCore!==logo.coreScale || previousBoost!==logo.introBoost || previousOrbit!==logo.orbitVisibility) logo.schedule();
    }
    const shown = mark.classList.contains('is-visible') &&
      Number(mark.style.getPropertyValue('--orbit-logo-reveal-alpha') || 1) > 0;
    logo.setActive(shown);
    if (!shown || document.hidden) return;
    // Observe the existing footprint without adding a hit layer or enabling clicks.
    // This also handles a logo moving underneath a stationary pointer.
    const rect = mark.getBoundingClientRect();
    const overMark = pointer && pointer.x >= rect.left && pointer.x <= rect.right &&
      pointer.y >= rect.top && pointer.y <= rect.bottom;
    logo.setHovered(Boolean(overMark || mark.classList.contains('is-hovered')));
  }
  window.ClearOrbitVisuals={finishSatellite,updateRadio,updateLogo,logo,beginRadioFade,cancelRadioFade,radioIsClear};
})();
