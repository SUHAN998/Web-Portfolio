/* World-only optics. Reuses the existing renderer; DOM and Celestial never enter these targets. */
(() => {
  'use strict';
  const settings={enabled:new URLSearchParams(location.search).get('cinematic')!=='off',grade:.16,bloom:.12,haze:.045,vignette:.085,
    threshold:.50,key:3.4,rim:.050,environment:.10,bloomScale:.35,maxBloomSize:640};
  const direction={value:null}, rimDirection={value:null};
  const rimStrengths={satellite:.65*2/3,planet:.65/3};
  const planetRims=[];
  function finishPlanet(model,kind){
    const T=window.__ORBIT_3D_LIB,surfaces=[];
    model.traverse(node=>{if(node.isMesh)surfaces.push(node);});
    for(const source of surfaces){
      const direction={value:new T.Vector3(0,0,1)};
      const material=new T.ShaderMaterial({transparent:true,depthWrite:false,depthTest:true,
        blending:T.AdditiveBlending,uniforms:{uGalaxyDirection:direction,
          uStrength:{value:rimStrengths.planet},uOpacity:{value:0},
          uTint:{value:kind==='red'?{x:1,y:.92,z:.90}:{x:.90,y:.95,z:1}}},
        vertexShader:`varying vec3 vN,vV;
          void main(){vec4 p=modelViewMatrix*vec4(position+normal*.0003,1.);
            vN=normalize(normalMatrix*normal);vV=normalize(-p.xyz);gl_Position=projectionMatrix*p;}`,
        fragmentShader:`varying vec3 vN,vV;uniform vec3 uGalaxyDirection,uTint;
          uniform float uStrength,uOpacity;
          void main(){vec3 n=normalize(vN);
            float edge=pow(1.-abs(dot(n,normalize(vV))),2.2);
            float lit=smoothstep(-.20,.60,dot(n,normalize(uGalaxyDirection)));
            gl_FragColor=vec4(uTint,edge*lit*uStrength*uOpacity);}`});
      const baseMaterial=Array.isArray(source.material)?source.material[0]:source.material;
      const rim=new T.Mesh(source.geometry,material);rim.name='Planet galaxy rim light';
      rim.frustumCulled=false;rim.raycast=()=>{};
      rim.onBeforeRender=()=>{material.uniforms.uOpacity.value=baseMaterial.opacity;};
      source.add(rim);planetRims.push({source,material,direction});
    }
  }
  const beaconPosition={value:null},beaconPulse={value:0};
  const beaconScreen={value:{x:-10,y:-10}},beaconVisibility={value:0};
  const lensGhosts=Array.from({length:3},()=>({value:{x:-10,y:-10,z:0,w:0}}));
  const strokeOpacity={value:0},strokeViewport={value:{x:1440,y:1024}};
  let strokeGate=0,strokeLast=0,silhouetteScene=null;
  const silhouetteMeshes=[];let silhouetteMaterial=null;
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
      uniforms:{uGalaxyDirection:direction,uRimStrength:{value:rimStrengths.satellite}},
      vertexShader:`varying vec3 vN,vV;void main(){vec4 p=modelViewMatrix*vec4(position+normal*.001,1.);vN=normalize(normalMatrix*normal);vV=normalize(-p.xyz);gl_Position=projectionMatrix*p;}`,
      fragmentShader:`varying vec3 vN,vV;uniform vec3 uGalaxyDirection;uniform float uRimStrength;void main(){vec3 n=normalize(vN);float edge=pow(1.-abs(dot(n,normalize(vV))),2.2);float lit=smoothstep(-.20,.60,dot(n,normalize(uGalaxyDirection)));gl_FragColor=vec4(vec3(1.,.95,.86),edge*lit*uRimStrength);}`});
    surfaces.forEach(node=>{const veil=new T.Mesh(node.geometry,veilMaterial);veil.name='Satellite reflected halo';veil.frustumCulled=false;node.add(veil);});
    // Reference-matched glints on the approved model's frame junctions and rims.
    // Each anchor is snapped to a real vertex; back-facing anchors are depth-tested.
    const glintMaterial=new T.ShaderMaterial({transparent:true,depthWrite:false,depthTest:true,
      blending:T.AdditiveBlending,toneMapped:false,
      uniforms:{uGalaxyDirection:direction,uViewportHeight:{value:sceneApi.stage.renderer.domElement.height}},
      vertexShader:`uniform vec3 uGalaxyDirection;uniform float uViewportHeight;
        attribute float aStrength;varying float vGlint;
        void main(){vec3 n=normalize(normalMatrix*normal);
          vec4 p=modelViewMatrix*vec4(position+normal*.006,1.);
          vec3 v=normalize(-p.xyz),l=normalize(uGalaxyDirection),h=normalize(l+v);
          float lit=smoothstep(-.20,.65,dot(n,l));
          float alignment=max(0.,dot(n,h));
          // A polished bevel integrates a small range of normals, giving a
          // broad shoulder beneath the sharp specular peak, without a timer.
          float reflection=pow(alignment,28.)*.8+pow(alignment,4.)*.32;
          float rim=pow(1.-abs(dot(n,v)),3.)*.42;
          vGlint=aStrength*lit*(reflection+rim);
          gl_Position=projectionMatrix*p;
          float pixelsPerUnit=projectionMatrix[1][1]*length(modelViewMatrix[0].xyz)
            *uViewportHeight/(2.*max(1.,-p.z));
          gl_PointSize=clamp(pixelsPerUnit*.72,18.,88.)
            *mix(.64,1.15,aStrength)*(.72+.28*sqrt(clamp(vGlint,0.,1.)));
        }`,
      fragmentShader:`varying float vGlint;
        void main(){vec2 q=(gl_PointCoord-.5)*2.;float r=length(q);
          float core=exp(-r*r*260.);
          float halo=exp(-r*r*15.)*.12;
          float cross=(exp(-q.x*q.x*2200.)*exp(-abs(q.y)*4.5)+
            exp(-q.y*q.y*2200.)*exp(-abs(q.x)*4.5))*.95;
          vec2 d=vec2(q.x+q.y,q.y-q.x)*.70710678;
          float secondary=(exp(-d.x*d.x*3200.)*exp(-abs(d.y)*7.)+
            exp(-d.y*d.y*3200.)*exp(-abs(d.x)*7.))*.24;
          float a=(core+halo+cross+secondary)*pow(max(vGlint,0.),.65)
            *(1.-smoothstep(.65,1.,r));
          vec3 tint=mix(vec3(1.,.80,.53),vec3(1.,.98,.93),min(1.,core*3.));
          gl_FragColor=vec4(tint*15.,a);
        }`});
    surfaces.forEach(node=>{
      const a=node.geometry.attributes.position;
      const positions=[],normals=[],strengths=[],used=new Set();
      function anchor(x,y,z,nx,ny,nz,strength){
        let nearest=0,distance=Infinity;
        for(let i=0;i<a.count;i++){
          const d=(a.getX(i)-x)**2+(a.getY(i)-y)**2+(a.getZ(i)-z)**2;
          if(d<distance){distance=d;nearest=i;}
        }
        const key=[a.getX(nearest),a.getY(nearest),a.getZ(nearest)].map(v=>Math.round(v*10000)).join(',');
        if(used.has(key))return;used.add(key);
        positions.push(a.getX(nearest),a.getY(nearest),a.getZ(nearest));
        const n=new T.Vector3(nx,ny,nz).normalize();normals.push(...n.toArray());strengths.push(strength);
      }
      // Wing outer corners and the middle frame junctions (both glass faces).
      for(const side of [-1,1])for(const face of [-1,1]){
        for(const [x,strength] of [[1.513,1.],[.976,.42],[.439,.62]])
          for(const y of [-.346,.346])
            anchor(side*x,y,face*.015,side*(x>1.4?.55:.20),Math.sign(y)*.55,face*.80,strength);
        // The metal body's major corners and horizontal panel connectors.
        for(const x of [-.265,.265])for(const y of [-.355,.355])
          anchor(x,y,face*.230,Math.sign(x)*.55,Math.sign(y)*.55,face*.72,.90);
        anchor(side*.468,.020,face*.024,side*.60,.30,face*.70,.55);
        // The lower cylindrical hardware keeps a smaller, sharp reflection.
        anchor(side*.095,-.505,face*.054,side*.60,-.35,face*.70,.58);
      }
      // Dish rim highlights, rather than random glints across the dish surface.
      for(const angle of [45,135,225,315]){
        const t=angle*Math.PI/180;
        anchor(Math.cos(t)*.2312,.5372+Math.sin(t)*.2312,.112,
          Math.cos(t)*.65,Math.sin(t)*.65,.65,angle===135?1.:.55);
      }
      const geometry=new T.BufferGeometry();
      geometry.setAttribute('position',new T.BufferAttribute(new Float32Array(positions),3));
      geometry.setAttribute('normal',new T.BufferAttribute(new Float32Array(normals),3));
      geometry.setAttribute('aStrength',new T.BufferAttribute(new Float32Array(strengths),1));
      const glints=new T.Points(geometry,glintMaterial);glints.name='Satellite sharp edge sun glints';
      glints.frustumCulled=false;glints.userData.pointCount=positions.length/3;
      glints.raycast=()=>{}; // Decorative reflections retain the original model's click target.
      glints.onBeforeRender=()=>{glintMaterial.uniforms.uViewportHeight.value=sceneApi.stage.renderer.domElement.height;};
      node.add(glints);
    });
    // A filled mask of the complete model removes every internal seam.
    // This independent pass contains no materials, glints, rim or beacon light.
    silhouetteScene=new T.Group();
    silhouetteMaterial=new T.MeshBasicMaterial({color:0xffffff,side:2,toneMapped:false,
      depthTest:false,depthWrite:false});
    surfaces.forEach(source=>{
      const mask=new T.Mesh(source.geometry,silhouetteMaterial);
      mask.matrixAutoUpdate=false;mask.frustumCulled=false;mask.raycast=()=>{};
      silhouetteScene.add(mask);silhouetteMeshes.push({source,mask});
    });
    // Find the existing antenna's uppermost vertices, retaining model proportions.
    let top=-Infinity;const tip=new T.Vector3();let count=0;
    for(const node of surfaces){const a=node.geometry.attributes.position;for(let i=0;i<a.count;i++){
      const y=a.getY(i);if(y>top+.00001){top=y;tip.set(a.getX(i),y,a.getZ(i));count=1;}else if(Math.abs(y-top)<.00001){tip.x+=a.getX(i);tip.z+=a.getZ(i);count++;}
    }}
    tip.x/=count;tip.z/=count;
    const geo=new T.BufferGeometry();geo.setAttribute('position',new T.BufferAttribute(new Float32Array(tip.toArray()),3));
    const lamp=new T.ShaderMaterial({transparent:true,depthWrite:false,blending:T.AdditiveBlending,
      uniforms:{uPulse:beaconPulse,uHeight:{value:1},uPixelRatio:{value:1}},toneMapped:false,
      vertexShader:`uniform float uHeight,uPixelRatio;
        void main(){vec4 p=modelViewMatrix*vec4(position,1.);gl_Position=projectionMatrix*p;
          float pixelsPerUnit=projectionMatrix[1][1]*length(modelViewMatrix[0].xyz)*uHeight/(2.*max(1.,-p.z));
          gl_PointSize=clamp(pixelsPerUnit*1.35,20.*uPixelRatio,120.*uPixelRatio);}`,
      fragmentShader:`uniform float uPulse;
        void main(){vec2 q=(gl_PointCoord-.5)*2.;float r=length(q);
          float core=exp(-r*r*650.);
          float halo=exp(-r*r*18.)*.10;
          float cross=(exp(-q.x*q.x*1100.)*exp(-abs(q.y)*4.)+
            exp(-q.y*q.y*1100.)*exp(-abs(q.x)*4.))*.55;
          vec3 tint=mix(vec3(1.,.025,.012),vec3(1.,.72,.52),smoothstep(.15,.8,core));
          float alpha=(core+halo+cross)*uPulse*(1.-smoothstep(.7,1.,r));
          gl_FragColor=vec4(tint*5.,alpha);}`});
    beacon=new T.Points(geo,lamp);beacon.name='Satellite antenna beacon';beacon.frustumCulled=false;beacon.raycast=()=>{};
    beacon.onBeforeRender=()=>{lamp.uniforms.uHeight.value=sceneApi.stage.renderer.domElement.height;lamp.uniforms.uPixelRatio.value=sceneApi.stage.renderer.getPixelRatio();};
    surfaces[0].add(beacon);
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
    const uniforms={source:{value:null},bloomMap:{value:null},beaconScreen,beaconVisibility,beaconPulse,lensGhost0:lensGhosts[0],lensGhost1:lensGhosts[1],lensGhost2:lensGhosts[2],lensViewport:strokeViewport,silhouetteMap:{value:null},silhouetteOpacity:{value:0},silhouetteStep:{value:{x:1,y:1}},silhouetteBounds:{value:{x:0,y:0,z:0,w:0}},texel:{value:{x:1,y:1}},axis:{value:{x:1,y:0}},
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
      fragmentShader:`varying vec2 vUv;uniform sampler2D source,bloomMap,silhouetteMap;
        uniform vec4 lensGhost0,lensGhost1,lensGhost2;
        uniform vec2 beaconScreen,lensViewport;uniform float beaconVisibility,beaconPulse;
        bool nearGhost(vec2 uv,vec4 ghost){return ghost.w>.001 && all(lessThan(abs((uv-ghost.xy)*lensViewport),vec2(ghost.z*1.4)));}
        float lensGhost(vec2 uv,vec4 ghost){
          vec2 q=(uv-ghost.xy)*lensViewport/max(ghost.z,.01);float r=length(q);
          float ring=exp(-pow((r-.88)/.10,2.))*.70;
          float fill=exp(-r*r*3.)*.15;
          return (ring+fill)*ghost.w*(1.-smoothstep(1.2,1.4,r));
        }
        uniform vec4 silhouetteBounds;uniform vec2 texel,silhouetteStep;uniform float grade,bloom,haze,vignette,silhouetteOpacity;
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
          // Optical ghosts follow the projected emitter, never fixed screen coordinates.
          // A rendered red-source check suppresses ghosts when the lamp is hidden.
          if(beaconVisibility>.001 && beaconPulse>.001 && (nearGhost(vUv,lensGhost0)||nearGhost(vUv,lensGhost1)||nearGhost(vUv,lensGhost2))){
            float redSignal=0.;
            for(int i=0;i<5;i++){
              float a=float(i)*6.28318530718/5.;
              vec3 sampleColor=texture2D(source,beaconScreen+vec2(cos(a),sin(a))*3.2/lensViewport).rgb;
              redSignal=max(redSignal,smoothstep(.08,.35,sampleColor.r-max(sampleColor.g,sampleColor.b))*smoothstep(.4,.8,sampleColor.r));
            }
            vec3 ghosts=vec3(1.,.25,.12)*lensGhost(vUv,lensGhost0)+
              vec3(.85,.32,.18)*lensGhost(vUv,lensGhost1)+vec3(1.,.42,.20)*lensGhost(vUv,lensGhost2);
            c=1.-(1.-c)*exp(-ghosts*beaconVisibility*pow(beaconPulse,.75)*redSignal);
          }
          // Final display-only overlay, AFTER all bloom, grade and lighting.
          // Dilate the filled silhouette outward; never draw internal edges.
          if(silhouetteOpacity>.001 && vUv.x>=silhouetteBounds.x && vUv.y>=silhouetteBounds.y && vUv.x<=silhouetteBounds.z && vUv.y<=silhouetteBounds.w){
            float inside=texture2D(silhouetteMap,vUv).r;
            float dilated=inside;
            for(int i=0;i<16;i++){
              float angle=float(i)*6.28318530718/16.;
              vec2 offset=vec2(cos(angle),sin(angle))*silhouetteStep;
              dilated=max(dilated,texture2D(silhouetteMap,vUv+offset).r);
            }
            float outline=clamp(dilated-inside,0.,1.);
            c=mix(c,vec3(1.),outline*silhouetteOpacity);
          }
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
      resources={w,h,bw,bh,base:capture.texture,capture,emission:target(bw,bh,true),ping:target(bw,bh,false),pong:target(bw,bh,false),mask:new T.WebGLRenderTarget(w,h,{depthBuffer:false,stencilBuffer:false,samples:4})};
      resources.targets=[capture,resources.emission,resources.ping,resources.pong,resources.mask];
      uniforms.texel.value.x=1/bw;uniforms.texel.value.y=1/bh;
      uniforms.silhouetteMap.value=resources.mask.texture;
    }
    function pass(mat,source,target) {uniforms.source.value=source;quad.material=mat;renderer.setRenderTarget(target);originalRender(postScene,camera);}
    const maskCorner=new T.Vector3();
    function renderSilhouette(cam){
      const active=strokeOpacity.value>.001 && satellite?.visible && silhouetteScene;
      uniforms.silhouetteOpacity.value=active?strokeOpacity.value:0;
      if(!active)return;
      let minX=1,minY=1,maxX=0,maxY=0;
      for(const {source,mask} of silhouetteMeshes){
        mask.matrix.copy(source.matrixWorld);mask.visible=source.visible;
        if(!source.geometry.boundingBox)source.geometry.computeBoundingBox();
        const box=source.geometry.boundingBox;
        for(const x of [box.min.x,box.max.x])for(const y of [box.min.y,box.max.y])for(const z of [box.min.z,box.max.z]){
          maskCorner.set(x,y,z).applyMatrix4(source.matrixWorld).project(cam);
          const u=maskCorner.x*.5+.5,v=maskCorner.y*.5+.5;
          minX=Math.min(minX,u);minY=Math.min(minY,v);maxX=Math.max(maxX,u);maxY=Math.max(maxY,v);
        }
      }
      // Restrict the contour's texture taps to the projected satellite bounds.
      const bounds=uniforms.silhouetteBounds.value;
      bounds.x=minX-3/strokeViewport.value.x;bounds.y=minY-3/strokeViewport.value.y;
      bounds.z=maxX+3/strokeViewport.value.x;bounds.w=maxY+3/strokeViewport.value.y;
      uniforms.silhouetteStep.value.x=2.5/strokeViewport.value.x;
      uniforms.silhouetteStep.value.y=2.5/strokeViewport.value.y;
      const clear=renderer.getClearColor(api.light.starMat.color.clone()),alpha=renderer.getClearAlpha();
      try{
        renderer.setClearColor(0x000000,0);renderer.setRenderTarget(resources.mask);
        renderer.clear();originalRender(silhouetteScene,cam);
      }finally{renderer.setClearColor(clear,alpha);}
    }
    const projectedBeacon=new T.Vector3();
    const clamp01=x=>Math.max(0,Math.min(1,x));
    const smoothRange=(a,b,x)=>{const t=clamp01((x-a)/(b-a));return t*t*(3-2*t);};
    function updateBeaconLens(){
      beaconVisibility.value=0;
      if(!beacon)return;
      let visible=true;for(let node=beacon;node;node=node.parent)if(!node.visible){visible=false;break;}
      if(!visible || beaconPosition.value.z>=-1)return;
      projectedBeacon.copy(beaconPosition.value).applyMatrix4(api.stage.camera.projectionMatrix);
      const u=projectedBeacon.x*.5+.5,v=projectedBeacon.y*.5+.5;
      beaconScreen.value.x=u;beaconScreen.value.y=v;
      const edge=clamp01(Math.min(u,1-u,v,1-v)/.08);
      if(!edge || projectedBeacon.z<-1 || projectedBeacon.z>1)return;
      const W=strokeViewport.value.x,H=strokeViewport.value.y;
      const dx=(u-.5)*W,dy=(v-.5)*H,len=Math.max(1,Math.hypot(dx,dy));
      // A tilted internal-reflection axis gives small lower-side red ghosts.
      // Its direction and spacing change continuously with source/camera alignment.
      const cs=Math.cos(-Math.PI*.32),sn=Math.sin(-Math.PI*.32);
      const ax=(dx*cs-dy*sn)/len,ay=(dx*sn+dy*cs)/len;
      const radial=Math.hypot(u-.5,v-.5)*2;
      const e=beacon.matrixWorld.elements,scale=Math.hypot(e[0],e[1],e[2]);
      const pixelsPerUnit=api.stage.camera.projectionMatrix.elements[5]*scale*H/(-2*beaconPosition.value.z);
      const size=Math.max(.45,Math.min(1.4,pixelsPerUnit/65));
      const weights=[.055,.040*smoothRange(.15,.50,radial),.025*smoothRange(.05,.18,radial)*(1.-smoothRange(.25,.45,radial))];
      for(let i=0;i<3;i++){
        const distance=([34,78,108][i]+radial*[24,42,26][i])*size;
        const ghost=lensGhosts[i].value;
        ghost.x=u+ax*distance/W;ghost.y=v+ay*distance/H;
        ghost.z=([8,16,6][i]+radial*[5,9,4][i])*size;
        ghost.w=weights[i];
      }
      const alignment=-beaconPosition.value.z/beaconPosition.value.length();
      beaconVisibility.value=edge*Math.pow(Math.max(0,alignment),3)*Math.min(1,size);
    }
    function updateLighting() {
      const galaxy=api.stage.scene.getObjectByName('Orbit world galaxy');
      if(!galaxy)return;
      const spiral=galaxy.children[galaxy.children.length-1];
      galaxy.updateWorldMatrix(true,true);satellite?.updateWorldMatrix(true,false);api.stage.camera.updateWorldMatrix(true,false);
      if(beacon){beaconPosition.value.fromBufferAttribute(beacon.geometry.attributes.position,0);beacon.localToWorld(beaconPosition.value);beaconPosition.value.applyMatrix4(api.stage.camera.matrixWorldInverse);}
      // This is the actual nucleus used by buildSpiralGalaxy, in that group's space.
      core.set(-370,105,-2650);spiral.localToWorld(core);lastCore.copy(core);
      for(const rim of planetRims){
        rim.source.updateWorldMatrix(true,false);
        if(!rim.source.geometry.boundingSphere)rim.source.geometry.computeBoundingSphere();
        center.copy(rim.source.geometry.boundingSphere.center);rim.source.localToWorld(center);
        rim.direction.value.copy(core).sub(center).normalize().transformDirection(api.stage.camera.matrixWorldInverse);
      }
      if(!satellite)return;
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
      const now=performance.now(),reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
      const dt=Math.min(.1,Math.max(0,(now-(strokeLast||now))/1000));strokeLast=now;
      const phase=window.ClearOrbitSatellite?.state,waiting=phase==='waiting';
      strokeGate+=(Number(waiting)-strokeGate)*(1.-Math.exp(-dt/.13));
      if(['hidden','loading','approach','reverse'].includes(phase))strokeGate=0;
      strokeOpacity.value=strokeGate*(reduced?.70:(.35+.65*(.5-.5*Math.cos(now*Math.PI*2/1800))));
      const rect=renderer.domElement.getBoundingClientRect();
      strokeViewport.value.x=Math.max(1,rect.width);strokeViewport.value.y=Math.max(1,rect.height);
      if(beacon)beacon.material.uniforms.uPulse.value=matchMedia('(prefers-reduced-motion: reduce)').matches?.45:(.5-.5*Math.cos(performance.now()*Math.PI*2/800));
      updateLighting();updateBeaconLens();
      const galaxy=scene.getObjectByName('Orbit world galaxy');
      if((!settings.enabled && strokeOpacity.value<.001 && beaconVisibility.value<.001) || lost || !galaxy?.visible)return originalRender(scene,cam);
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
        for(const k of ['grade','bloom','haze','vignette'])uniforms[k].value=settings.enabled?settings[k]:0;
        renderSilhouette(cam);
        uniforms.bloomMap.value=resources.ping.texture;pass(composite,resources.base,oldTarget);frames++;
      } finally {restoreOccluders();scene.background=oldBackground;renderer.setRenderTarget(oldTarget);}
    };
    const onLost=()=>{lost=true;},onRestore=()=>{lost=false;};
    renderer.domElement.addEventListener('webglcontextlost',onLost);renderer.domElement.addEventListener('webglcontextrestored',onRestore);
    function dispose(event) {
      if(event.persisted)return;
      renderer.render=originalRender;planetRims.forEach(r=>r.material.dispose());resources?.targets.forEach(r=>r.dispose());[extract,blur,composite,occluder,quad.geometry,silhouetteMaterial].filter(Boolean).forEach(x=>x.dispose());
      renderer.domElement.removeEventListener('webglcontextlost',onLost);renderer.domElement.removeEventListener('webglcontextrestored',onRestore);
      window.removeEventListener('pagehide',dispose);
    }
    window.addEventListener('pagehide',dispose);
    window.ClearOrbitCinematic.inspect=()=>({frames,targets:resources?.targets.length||0,resolution:resources?[resources.w,resources.h,resources.bw,resources.bh]:null,
      nucleus:lastCore.toArray(),direction:direction.value.toArray(),satellite:!!satellite,
      rimStrengths:{...rimStrengths},planetRims:planetRims.length,
      beaconOptics:{source:{...beaconScreen.value},visibility:beaconVisibility.value,
        ghosts:lensGhosts.map(g=>({...g.value})),maxCssSize:120,pulseMs:800},
      silhouette:{opacity:strokeOpacity.value,cssWidth:2.5,postComposite:true,meshes:silhouetteMeshes.length}});
  }
  window.ClearOrbitCinematic={settings,finishSatellite,finishPlanet,setEnabled(value){settings.enabled=Boolean(value);return settings.enabled;}};
  window.addEventListener('orbit3dready',init);if(window.__ORBIT_3D_SCENE)init();
})();
