/* World-only optics. Reuses the existing renderer; DOM and Celestial never enter these targets. */
(() => {
  'use strict';
  const settings={enabled:new URLSearchParams(location.search).get('cinematic')!=='off',grade:.16,bloom:.12,haze:.045,vignette:.085,
    threshold:.50,key:3.4,rim:.075,environment:.10,bloomScale:.35,maxBloomSize:640};
  const direction={value:null}, rimDirection={value:null};
  const beaconPosition={value:null},beaconPulse={value:0};
  let satellite=null, api=null, resources=null, lost=false, frames=0, beacon=null;
  function finishSatellite(model, sceneApi) {
    const T=window.__ORBIT_3D_LIB;
    satellite=model;
    const surfaces=[];
    model.traverse(node=>{
      if(!node.isMesh)return;
      surfaces.push(node);
      const upgrade=original=>{
        const material=new T.MeshPhysicalMaterial({map:original.map,color:original.color,
          roughness:.48,metalness:.35,clearcoat:.12,clearcoatRoughness:.42,
          // Explicit envMap avoids the renderer replacing this intensity with scene.environmentIntensity.
          envMap:sceneApi.stage.scene.environment,envMapIntensity:settings.environment,side:original.side,
          transparent:original.transparent,opacity:original.opacity});
        material.name='Satellite: solar cells / foil / diffuse hardware';
        material.onBeforeCompile=shader=>{
          shader.uniforms.uGalaxyDirection=direction;shader.uniforms.uRimDirection=rimDirection;
          shader.uniforms.uBeaconPosition=beaconPosition;shader.uniforms.uBeaconPulse=beaconPulse;
          shader.uniforms.uGalaxyKey={value:settings.key};shader.uniforms.uSatelliteRim={value:settings.rim};
          material.userData.optics=shader.uniforms;
          shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vEquipmentPosition;')
            .replace('#include <begin_vertex>','#include <begin_vertex>\nvEquipmentPosition=position;');
          shader.fragmentShader=shader.fragmentShader.replace('#include <common>',`#include <common>
            varying vec3 vEquipmentPosition;
            uniform vec3 uGalaxyDirection,uRimDirection;
            uniform float uGalaxyKey,uSatelliteRim;
            uniform vec3 uBeaconPosition;uniform float uBeaconPulse;`)
            .replace('#include <roughnessmap_fragment>',`#include <roughnessmap_fragment>
              float solar=smoothstep(.012,.065,diffuseColor.b-diffuseColor.r);
              float foil=smoothstep(.025,.16,diffuseColor.r-diffuseColor.b);
              float cell=sin(vEquipmentPosition.x*170.)*sin(vEquipmentPosition.z*170.);
              float aa=1.-smoothstep(.3,1.4,length(fwidth(vEquipmentPosition*170.)));
              roughnessFactor=mix(.66,.065,solar);
              roughnessFactor=mix(roughnessFactor,.43,foil)+cell*aa*solar*.018;`)
            .replace('#include <metalnessmap_fragment>',`#include <metalnessmap_fragment>
              metalnessFactor=mix(.08,.30,solar);metalnessFactor=mix(metalnessFactor,.78,foil);`)
            .replace('#include <lights_physical_fragment>',`#include <lights_physical_fragment>
              material.clearcoat=mix(material.clearcoat,1.,solar);
              material.clearcoatRoughness=mix(material.clearcoatRoughness,.035,solar);`)
            .replace('#include <lights_fragment_begin>',`#include <lights_fragment_begin>
              IncidentLight galaxyLight;
              galaxyLight.direction=normalize(uGalaxyDirection);
              galaxyLight.color=vec3(1.,.87,.69)*uGalaxyKey;galaxyLight.visible=true;
              RE_Direct(galaxyLight,geometryPosition,geometryNormal,geometryViewDir,geometryClearcoatNormal,material,reflectedLight);
              IncidentLight edgeLight;
              edgeLight.direction=normalize(uRimDirection);
              edgeLight.color=vec3(.48,.68,1.)*uSatelliteRim;edgeLight.visible=true;
              RE_Direct(edgeLight,geometryPosition,geometryNormal,geometryViewDir,geometryClearcoatNormal,material,reflectedLight);
              vec3 toBeacon=uBeaconPosition-geometryPosition;
              float redFalloff=pow(1.-smoothstep(0.,125.,length(toBeacon)),2.);
              IncidentLight beaconLight;beaconLight.direction=normalize(toBeacon);
              beaconLight.color=vec3(1.,.008,.004)*6.5*uBeaconPulse*redFalloff;beaconLight.visible=true;
              RE_Direct(beaconLight,geometryPosition,geometryNormal,geometryViewDir,geometryClearcoatNormal,material,reflectedLight);
              // Approximate the galaxy's angular extent with a soft diffuse shoulder.
              // The GGX highlight still uses the real light direction and surface normal.
              float galaxyFacing=dot(geometryNormal,normalize(uGalaxyDirection));
              float broadDiffuse=max(0.,(galaxyFacing+.60)/1.60);
              float shoulder=max(0.,broadDiffuse-max(0.,galaxyFacing));
              reflectedLight.directDiffuse+=material.diffuseColor*vec3(1.,.87,.69)*uGalaxyKey*shoulder*.70/PI;
              float shadowSupport=mix(1.60,1.,smoothstep(-.75,.15,galaxyFacing));
              reflectedLight.indirectDiffuse+=diffuseColor.rgb*mix(vec3(.026,.034,.055),vec3(.090,.075,.060),foil)*shadowSupport;`)
            .replace('#include <lights_fragment_end>',`#include <lights_fragment_end>
              // Three times the previous panel reflection; diffuse shadows stay unchanged.
              // White reflection follows the galaxy / camera half vector as glass rotates.
              vec3 glassN=normalize(geometryNormal);
              vec3 glassL=normalize(uGalaxyDirection);
              vec3 glassV=normalize(geometryViewDir);
              vec3 glassH=normalize(glassL+glassV);
              float glassFacing=max(0.,dot(glassN,glassL));
              float glassAlignment=max(0.,dot(glassN,glassH));
              float glassGlint=(pow(glassAlignment,96.)*.75+pow(glassAlignment,384.)*1.75)
                *smoothstep(0.,.25,glassFacing)*solar;
              reflectedLight.directSpecular+=vec3(1.)*uGalaxyKey*glassGlint;
              reflectedLight.directSpecular*=mix(1.4,6.6,solar);
              reflectedLight.indirectSpecular*=mix(1.4,21.,solar);
              #ifdef USE_CLEARCOAT
                clearcoatSpecularIndirect*=mix(1.,15.,solar);
                clearcoatSpecularDirect*=mix(1.,3.,solar);
              #endif
            `);
        };
        material.customProgramCacheKey=()=> 'orbit-equipment-optics-v2';
        return material;
      };
      const old=Array.isArray(node.material)?node.material:[node.material];
      const replacement=old.map(upgrade);node.material=Array.isArray(node.material)?replacement:replacement[0];
      // The loader's materials are unique to this retained model; textures remain shared.
      old.forEach(m=>m.dispose());
    });
    // A separate, view-dependent reflected veil, restricted to the lit silhouette.
    const veilMaterial=new T.ShaderMaterial({transparent:true,depthWrite:false,depthTest:true,blending:T.AdditiveBlending,
      uniforms:{uGalaxyDirection:direction},
      vertexShader:`varying vec3 vN,vV;void main(){vec4 p=modelViewMatrix*vec4(position+normal*.001,1.);vN=normalize(normalMatrix*normal);vV=normalize(-p.xyz);gl_Position=projectionMatrix*p;}`,
      fragmentShader:`varying vec3 vN,vV;uniform vec3 uGalaxyDirection;void main(){vec3 n=normalize(vN);float edge=pow(1.-abs(dot(n,normalize(vV))),2.5);float lit=smoothstep(-.1,.65,dot(n,normalize(uGalaxyDirection)));gl_FragColor=vec4(vec3(.58,.72,1.),edge*lit*.10);}`});
    surfaces.forEach(node=>{const veil=new T.Mesh(node.geometry,veilMaterial);veil.name='Satellite reflected halo';veil.frustumCulled=false;node.add(veil);});
    // Find the existing antenna's uppermost vertices, retaining model proportions.
    let top=-Infinity;const tip=new T.Vector3();let count=0;
    for(const node of surfaces){const a=node.geometry.attributes.position;for(let i=0;i<a.count;i++){
      const y=a.getY(i);if(y>top+.00001){top=y;tip.set(a.getX(i),y,a.getZ(i));count=1;}else if(Math.abs(y-top)<.00001){tip.x+=a.getX(i);tip.z+=a.getZ(i);count++;}
    }}
    tip.x/=count;tip.z/=count;
    const geo=new T.BufferGeometry();geo.setAttribute('position',new T.BufferAttribute(new Float32Array(tip.toArray()),3));
    const lamp=new T.ShaderMaterial({transparent:true,depthWrite:false,blending:T.AdditiveBlending,
      uniforms:{uPulse:beaconPulse},
      vertexShader:`void main(){gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);gl_PointSize=12.;}`,
      fragmentShader:`uniform float uPulse;void main(){float r=length(gl_PointCoord-.5)*2.;float glow=exp(-r*r*5.)*(1.-smoothstep(.65,1.,r));gl_FragColor=vec4(3.5,.0875,.05,glow*uPulse);}`});
    beacon=new T.Points(geo,lamp);beacon.name='Satellite antenna beacon';beacon.frustumCulled=false;surfaces[0].add(beacon);
  }
  const vertex='varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}';
  function init() {
    if(api)return;
    api=window.__ORBIT_3D_SCENE;if(!api)return;
    const T=window.__ORBIT_3D_LIB,renderer=api.stage.renderer;
    direction.value=new T.Vector3(0,0,1);rimDirection.value=new T.Vector3(0,0,1);
    beaconPosition.value=new T.Vector3();
    const core=new T.Vector3(),center=new T.Vector3(),lastCore=new T.Vector3();
    const originalRender=renderer.render.bind(renderer);
    const postScene=new T.Group(),camera=new T.PerspectiveCamera();
    const quad=new T.Mesh(new T.PlaneGeometry(2,2),null);quad.frustumCulled=false;postScene.add(quad);
    const uniforms={source:{value:null},bloomMap:{value:null},texel:{value:{x:1,y:1}},axis:{value:{x:1,y:0}},
      threshold:{value:settings.threshold},grade:{value:settings.grade},bloom:{value:settings.bloom},
      haze:{value:settings.haze},vignette:{value:settings.vignette}};
    const material=fragment=>new T.ShaderMaterial({uniforms,vertexShader:vertex,fragmentShader:fragment,depthTest:false,depthWrite:false,toneMapped:false});
    const extract=material(`varying vec2 vUv;uniform sampler2D source;uniform float threshold;
      void main(){vec3 c=texture2D(source,vUv).rgb;float l=max(c.r,max(c.g,c.b));
        float knee=smoothstep(threshold*.65,threshold*1.4,l);gl_FragColor=vec4(c*knee,1.);}`);
    const blur=material(`varying vec2 vUv;uniform sampler2D source;uniform vec2 texel,axis;
      void main(){vec2 d=texel*axis;vec3 c=texture2D(source,vUv).rgb*.227027;
        c+=(texture2D(source,vUv+d*1.384615).rgb+texture2D(source,vUv-d*1.384615).rgb)*.316216;
        c+=(texture2D(source,vUv+d*3.230769).rgb+texture2D(source,vUv-d*3.230769).rgb)*.070270;
        gl_FragColor=vec4(c,1.);}`);
    const composite=new T.ShaderMaterial({uniforms,vertexShader:vertex,depthTest:false,depthWrite:false,toneMapped:false,
      fragmentShader:`varying vec2 vUv;uniform sampler2D source,bloomMap;
        uniform vec2 texel;uniform float grade,bloom,haze,vignette;
        void main(){vec3 c=texture2D(source,vUv).rgb;vec3 glow=texture2D(bloomMap,vUv).rgb;
          vec3 wide=(texture2D(bloomMap,vUv+vec2(texel.x*8.,0.)).rgb+texture2D(bloomMap,vUv-vec2(texel.x*8.,0.)).rgb+
            texture2D(bloomMap,vUv+vec2(0.,texel.y*8.)).rgb+texture2D(bloomMap,vUv-vec2(0.,texel.y*8.)).rgb)*.25;
          float l=dot(c,vec3(.2126,.7152,.0722));float mid=smoothstep(.015,.12,l)*(1.-smoothstep(.32,.85,l));
          c+=grade*mid*vec3(.08,-.01,.28)*min(l,.35);
          // The base is a copy of the already camera-mapped world framebuffer.
          // Soft screen composition preserves its warm highlights and black floor.
          vec3 scatter=(glow/(1.+glow))*bloom+(wide/(1.+wide))*haze;
          c=1.-(1.-c)*exp(-scatter);
          vec2 p=(vUv-.5)*2.;float edge=smoothstep(.28,1.8,dot(p,p));
          c*=1.-vignette*edge*smoothstep(.012,.10,l);
          gl_FragColor=vec4(c,1.);
        }`});
    const hidden=[];
    const savedMaterials=new WeakMap();
    const occluder=new T.MeshBasicMaterial({color:0x000000,toneMapped:false});
    function restoreOccluders(){for(const node of hidden)node.material=savedMaterials.get(node);hidden.length=0;}
    function allocate() {
      const w=renderer.domElement.width,h=renderer.domElement.height;
      const low=matchMedia('(pointer: coarse)').matches || w*h>5000000;
      const ratio=Math.min(low?.25:settings.bloomScale,settings.maxBloomSize/Math.max(w,h));
      const bw=Math.max(1,Math.round(w*ratio)),bh=Math.max(1,Math.round(h*ratio));
      if(resources && resources.w===w && resources.h===h && resources.bw===bw && resources.bh===bh)return;
      if(resources){for(const r of resources.targets)r.dispose();}
      const target=(x,y,depth)=>new T.WebGLRenderTarget(x,y,{type:renderer.extensions.has('EXT_color_buffer_float')?T.HalfFloatType:1009,depthBuffer:depth,stencilBuffer:false});
      const capture=new T.WebGLRenderTarget(w,h,{depthBuffer:false,stencilBuffer:false});
      renderer.initRenderTarget(capture);
      resources={w,h,bw,bh,base:capture.texture,capture,emission:target(bw,bh,true),ping:target(bw,bh,false),pong:target(bw,bh,false)};
      resources.targets=[capture,resources.emission,resources.ping,resources.pong];
      uniforms.texel.value.x=1/bw;uniforms.texel.value.y=1/bh;
    }
    function pass(mat,source,target) {uniforms.source.value=source;quad.material=mat;renderer.setRenderTarget(target);originalRender(postScene,camera);}
    function updateLighting() {
      const galaxy=api.stage.scene.getObjectByName('Orbit world galaxy');
      if(!satellite || !galaxy)return;
      const spiral=galaxy.children[galaxy.children.length-1];
      galaxy.updateWorldMatrix(true,true);satellite.updateWorldMatrix(true,false);api.stage.camera.updateWorldMatrix(true,false);
      if(beacon){beaconPosition.value.fromBufferAttribute(beacon.geometry.attributes.position,0);beacon.localToWorld(beaconPosition.value);beaconPosition.value.applyMatrix4(api.stage.camera.matrixWorldInverse);}
      // This is the actual nucleus used by buildSpiralGalaxy, in that group's space.
      core.set(-370,105,-2650);spiral.localToWorld(core);lastCore.copy(core);
      satellite.getWorldPosition(center);direction.value.copy(core).sub(center);
      const distance=direction.value.length();
      // A broad cool source beside the nucleus, defined in world space too.
      rimDirection.value.copy(direction.value);rimDirection.value.x+=distance*.25;rimDirection.value.y+=distance*.30;
      direction.value.normalize().transformDirection(api.stage.camera.matrixWorldInverse);
      rimDirection.value.normalize().transformDirection(api.stage.camera.matrixWorldInverse);
      satellite.traverse(n=>{if(!n.isMesh)return;for(const m of Array.isArray(n.material)?n.material:[n.material]){
        m.envMapIntensity=settings.environment;const u=m.userData.optics;if(u){u.uGalaxyKey.value=settings.key;u.uSatelliteRim.value=settings.rim;}
      }});
    }
    renderer.render=function(scene,cam) {
      if(scene!==api.stage.scene || cam!==api.stage.camera)return originalRender(scene,cam);
      if(beacon)beacon.material.uniforms.uPulse.value=matchMedia('(prefers-reduced-motion: reduce)').matches?.45:(.5-.5*Math.cos(performance.now()*Math.PI*2/800));
      updateLighting();
      const galaxy=scene.getObjectByName('Orbit world galaxy');
      if(!settings.enabled || lost || !galaxy?.visible)return originalRender(scene,cam);
      allocate();const oldTarget=renderer.getRenderTarget(),oldBackground=scene.background;
      try {
        // Preserve the original world's per-material tone mapping exactly once.
        renderer.setRenderTarget(oldTarget);originalRender(scene,cam);
        renderer.resetState();
        renderer.copyFramebufferToTexture(resources.base);
        // Semantic selection: reflective equipment and planets never feed bloom.
        scene.traverse(n=>{if(n.isMesh && n.visible){const reflective=Array.isArray(n.material)?n.material.some(m=>m.isMeshStandardMaterial):n.material.isMeshStandardMaterial;
          if(reflective){savedMaterials.set(n,n.material);hidden.push(n);n.material=occluder;}
        }});
        scene.background=null;renderer.setRenderTarget(resources.emission);originalRender(scene,cam);
        restoreOccluders();scene.background=oldBackground;
        uniforms.threshold.value=settings.threshold;
        pass(extract,resources.emission.texture,resources.ping);
        uniforms.axis.value.x=1;uniforms.axis.value.y=0;pass(blur,resources.ping.texture,resources.pong);
        uniforms.axis.value.x=0;uniforms.axis.value.y=1;pass(blur,resources.pong.texture,resources.ping);
        for(const k of ['grade','bloom','haze','vignette'])uniforms[k].value=settings[k];
        uniforms.bloomMap.value=resources.ping.texture;pass(composite,resources.base,oldTarget);frames++;
      } finally {restoreOccluders();scene.background=oldBackground;renderer.setRenderTarget(oldTarget);}
    };
    const onLost=()=>{lost=true;},onRestore=()=>{lost=false;};
    renderer.domElement.addEventListener('webglcontextlost',onLost);renderer.domElement.addEventListener('webglcontextrestored',onRestore);
    function dispose(event) {
      if(event.persisted)return;
      renderer.render=originalRender;resources?.targets.forEach(r=>r.dispose());[extract,blur,composite,occluder,quad.geometry].forEach(x=>x.dispose());
      renderer.domElement.removeEventListener('webglcontextlost',onLost);renderer.domElement.removeEventListener('webglcontextrestored',onRestore);
      window.removeEventListener('pagehide',dispose);
    }
    window.addEventListener('pagehide',dispose);
    window.ClearOrbitCinematic.inspect=()=>({frames,targets:resources?.targets.length||0,resolution:resources?[resources.w,resources.h,resources.bw,resources.bh]:null,
      nucleus:lastCore.toArray(),direction:direction.value.toArray(),satellite:!!satellite});
  }
  window.ClearOrbitCinematic={settings,finishSatellite,setEnabled(value){settings.enabled=Boolean(value);return settings.enabled;}};
  window.addEventListener('orbit3dready',init);if(window.__ORBIT_3D_SCENE)init();
})();
