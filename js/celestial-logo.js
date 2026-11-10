/* CelestialLogo — dependency-free WebGL light renderer, with a Canvas fallback. */
(function (global) {
  'use strict';
  const defaults = Object.freeze({ glow: 1, bloom: 1, orbitSpeed: 0.035, trailLength: 0.68, trailOpacity: 0.8, rayVariation: 0.12, flareRotation: 0, exposure: 1.15, pixelRatio: 1.75, padding: 1 });
  const transition = duration => ({ from: 0, to: 0, value: 0, elapsed: duration, duration });
  const smoothstep = t => t*t*(3-2*t);
  const easeIntegral = t => t*t*t-.5*t*t*t*t;
  // Integrate the eased velocity exactly so orbital positions do not depend on FPS.
  function advanceTransition(state, dt) {
    const start=state.elapsed, end=Math.min(state.duration,start+dt);
    const moving=end-start, delta=state.to-state.from;
    const area=state.from*moving+delta*state.duration*(easeIntegral(end/state.duration)-easeIntegral(start/state.duration));
    state.elapsed=end;
    state.value=state.from+delta*smoothstep(end/state.duration);
    return area+state.to*(dt-moving);
  }
  function retarget(state, to) { state.from=state.value;state.to=to;state.elapsed=0; }
  // Angle (degrees), optical decay length, width multiplier, light energy.
  // Shared geometry keeps the fallback's silhouette consistent with WebGL.
  const dominantRays = [[0,.137,.88,1.85],[90,.167,1.02,1.95],[180,.150,.81,1.72],[270,.183,.94,2.02]];
  const secondaryRays = [[31,.078,.46,.44],[57,.095,.38,.36],[119,.087,.51,.40],[153,.066,.36,.30],
    [211,.084,.43,.41],[237,.103,.40,.35],[299,.091,.49,.42],[333,.071,.35,.31]];
  const fineRays = [[12,.099,.12,.095],[22,.065,.16,.070],[43,.112,.10,.085],[72,.082,.14,.065],
    [101,.076,.13,.080],[132,.105,.11,.065],[165,.085,.16,.070],[176,.123,.10,.060],
    [192,.104,.12,.090],[222,.073,.15,.065],[253,.096,.11,.080],[282,.086,.14,.070],
    [312,.117,.10,.080],[323,.068,.16,.060],[345,.091,.12,.075],[355,.128,.10,.055]];
  const raySet = (rays, offset) => rays.map(([angle, length, width, energy], i) =>
    `ray(p,uRotation+${(angle*Math.PI/180).toFixed(8)},${(offset+i*1.731).toFixed(4)},${length.toFixed(4)},${width.toFixed(4)})*${energy.toFixed(4)}`).join('+');
  const vertex = `attribute vec2 aPosition; varying vec2 vUv;
    void main(){ vUv=aPosition*.5+.5; gl_Position=vec4(aPosition,0.,1.); }`;
  const fragment = `precision highp float;
    varying vec2 vUv;
    uniform vec2 uResolution;
    uniform float uTime,uPhase,uGlow,uBloom,uTrail,uOpacity,uVariation,uRotation,uExposure,uIntensity,uHalo,uPadding,uCoreScale,uIntroBoost,uOrbitVisibility;
    const float TAU=6.28318530718;
    mat2 rot(float a){float c=cos(a),s=sin(a);return mat2(c,s,-s,c);}
    float organic(float t,float seed){return .52*sin(t*.47+seed)+.31*sin(t*.283+seed*2.13)+.17*sin(t*.719+seed*.73);}
    vec3 pointLight(vec2 p,float size,float power){
      float d=length(p)/size;
      float core=exp(-d*d*2.8)*power;
      float halo=exp(-d*.7)*.13*uGlow;
      return vec3(1.,.955,.86)*core+vec3(.57,.72,1.)*halo;
    }
    float ray(vec2 p,float angle,float seed,float extent,float widthScale){
      vec2 q=rot(-angle)*p;
      float motion=organic(uTime*.62,seed)*uVariation;
      float len=extent*(1.+motion*.48);
      float width=.0027*widthScale*(1.+organic(uTime*.51,seed+4.)*uVariation*.42);
      float x=max(q.x,0.);
      float taper=width*(.30+.70*exp(-x*17.));
      float softness=1.36+organic(uTime*.39,seed+7.)*uVariation*.30;
      float spine=exp(-pow(abs(q.y)/taper,softness))*exp(-pow(x/len,1.12));
      float skirt=exp(-abs(q.y)/(width*4.8))*exp(-x/(len*.60))*.18;
      return (spine+skirt)*smoothstep(-.006,.004,q.x)*(1.+motion*.25);
    }
    void main(){
      vec2 p=(vUv-.5)*uResolution/min(uResolution.x,uResolution.y)*uPadding;
      vec2 scenePoint=p;
      p/=uCoreScale;
      // Linear light accumulates before the exposure / camera response below.
      vec3 light=vec3(0.);
      float r=length(p);
      float haloRadius=r/uHalo;
      light+=vec3(.38,.51,.75)*exp(-haloRadius*haloRadius/.024)*.055*uBloom*uGlow;
      light+=vec3(.69,.77,1.)*exp(-haloRadius/.048)*.17*uBloom*uGlow;
      // A broad oblique scatter and a smaller warm halation merge into the core.
      vec2 optical=rot(-uRotation)*p/uHalo;
      light+=vec3(.57,.70,1.)*exp(-optical.x*optical.x/.014-optical.y*optical.y/.00048)*.042*uBloom*uGlow;
      light+=vec3(1.,.86,.64)*exp(-r*r/.00082)*.70*uBloom;
      float corona=exp(-pow((haloRadius-.035)/.021,2.))*.013;
      light+=vec3(.66,.77,1.)*corona*uBloom*uGlow;
      // Fixed diffraction directions; only their optical envelopes breathe.
      // Skip expensive multi-ray evaluation outside the visible central flare.
      if(r<.52){
        float dominant=${raySet(dominantRays,1.2)};
        float secondary=${raySet(secondaryRays,12.4)};
        float filaments=${raySet(fineRays,31.7)};
        float edge=1.-smoothstep(.40,.52,r);
        light+=(vec3(.84,.90,1.)*dominant+vec3(.76,.85,1.)*secondary+vec3(.94,.91,.85)*filaments)*edge;
      }
      light+=vec3(1.,.97,.91)*exp(-r*r/.000043)*10.;
      light+=vec3(1.,.93,.79)*exp(-r*r/.00016)*1.2;
      // Boost only central radiance, before the camera's highlight shoulder.
      light*=uIntensity*uIntroBoost;
      p=scenePoint;
      vec3 centralLight=light;
      light=vec3(0.);
      // An ellipse viewed obliquely. Distance uses the implicit curve gradient.
      vec2 axes=vec2(.337,.136);
      vec2 q=rot(.49)*p;
      vec2 e=q/axes;
      float er=max(length(e),.00001);
      float theta=atan(e.y,e.x);
      float distanceToOrbit=abs(er-1.)/max(length(e/(axes*er)),.0001);
      float trailEnvelope=0.;
      for(int i=0;i<2;i++){
        float head=.65-float(i)*3.14159265-uPhase;
        vec2 pos=rot(-.49)*(axes*vec2(cos(head),sin(head)));
        float behind=mod(theta-head+TAU,TAU);
        float span=max(.02,uTrail)*TAU;
        float fade=pow(max(0.,1.-behind/span),2.25)*uOpacity;
        // Overlapping tails share an envelope instead of doubling brightness.
        trailEnvelope=max(trailEnvelope,fade);
        vec2 s=p-pos;
        light+=pointLight(s,.0055,3.2);
        vec2 sq=rot(.10)*s;
        float cross=exp(-abs(sq.x)/.010-abs(sq.y)/.0008)+exp(-abs(sq.y)/.012-abs(sq.x)/.0008);
        light+=vec3(.84,.9,1.)*cross*.32;
      }
      float line=exp(-pow(distanceToOrbit/.00095,2.))*trailEnvelope;
      float haze=exp(-distanceToOrbit/.0042)*trailEnvelope*.13*uGlow;
      light+=vec3(.53,.69,.94)*(line+haze)*.64;
      light+=pointLight(p-vec2(-.205,-.172),.0033,.70)*.56;
      light=centralLight+light*uOrbitVisibility;
      vec3 color=1.-exp(-light*uExposure);
      color=pow(color,vec3(.454545));
      // Premultiplied light: RGB <= alpha, with no opaque background floor.
      // Fade only the expanded canvas boundary, outside the original artwork.
      vec2 edge=abs(vUv-.5)*2.;
      color*=1.-smoothstep(.88,1.,max(edge.x,edge.y));
      float alpha=max(color.r,max(color.g,color.b));
      gl_FragColor=vec4(color,alpha);
    }`;

  class CelestialLogo {
    constructor(canvas, options = {}) {
      if (!(canvas instanceof HTMLCanvasElement)) throw new TypeError('Pass a canvas element.');
      this.canvas = canvas;
      this.options = { ...defaults };
      this.setOptions(options);
      this.time = 0; this.phase = 0; this.last = null; this.frame = 0; this.visible = true; this.paused = false; this.destroyed = false;
      this.active = options.active !== false;
      this.coreScale=1; this.introBoost=1; this.orbitVisibility=1;
      this.hovered=false;
      this.lightTransition=transition(.5);
      this.speedTransition=transition(1);
      this.motion = matchMedia('(prefers-reduced-motion: reduce)');
      try { this.gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: true, antialias: false, depth: false, powerPreference: 'low-power' }); } catch (_) {}
      if (this.gl) {
        try { this.initGL(); } catch (error) {
          console.warn('[CelestialLogo] WebGL initialization failed; using Canvas 2D.', error);
          this.gl.deleteBuffer(this.buffer); this.gl.deleteProgram(this.program);
          // A canvas with a WebGL context cannot acquire a 2D context.
          const replacement = canvas.cloneNode(false);
          canvas.replaceWith(replacement); this.canvas = canvas = replacement; this.gl = null;
        }
      }
      if (!this.gl) { this.ctx = canvas.getContext('2d'); if (!this.ctx) throw new Error('No canvas renderer available.'); }
      this.onMotion = () => { if(this.motion.matches) this.settleHover();this.last = null; this.schedule(); };
      this.onVisibility = () => { this.last = null;if(document.hidden) this.setHovered(false);this.schedule(); };
      this.onEnter = event => { if(event.pointerType !== 'touch') this.setHovered(true); };
      this.onLeave = () => this.setHovered(false);
      this.onLost = event => { event.preventDefault(); cancelAnimationFrame(this.frame); this.frame = 0; this.lost = true; };
      this.onRestored = () => { this.lost = false; this.initGL(); this.resize(); this.last = null; this.schedule(); };
      canvas.addEventListener('webglcontextlost', this.onLost);
      canvas.addEventListener('webglcontextrestored', this.onRestored);
      canvas.addEventListener('pointerenter', this.onEnter);
      canvas.addEventListener('pointerleave', this.onLeave);
      canvas.addEventListener('pointercancel', this.onLeave);
      this.motion.addEventListener('change', this.onMotion);
      document.addEventListener('visibilitychange', this.onVisibility);
      this.resizeObserver = new ResizeObserver(() => { this.resize(); });
      this.resizeObserver.observe(canvas);
      // The portfolio scales its entire fixed stage with a CSS transform.
      // That changes screen density without changing the observed layout box.
      this.onResize = () => { this.resize(); this.schedule(); };
      global.addEventListener('resize', this.onResize);
      this.intersectionObserver = new IntersectionObserver(entries => { this.visible = entries[0].isIntersecting; this.last = null; this.schedule(); });
      this.intersectionObserver.observe(canvas);
      this.resize(); this.schedule();
    }
    initGL() {
      const gl = this.gl;
      const compile = (type, source) => {
        const shader = gl.createShader(type); gl.shaderSource(shader, source); gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) { const error = gl.getShaderInfoLog(shader); gl.deleteShader(shader); throw new Error(error); }
        return shader;
      };
      const vs = compile(gl.VERTEX_SHADER, vertex), fs = compile(gl.FRAGMENT_SHADER, fragment);
      this.program = gl.createProgram(); gl.attachShader(this.program, vs); gl.attachShader(this.program, fs); gl.linkProgram(this.program);
      gl.deleteShader(vs); gl.deleteShader(fs);
      if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(this.program));
      gl.useProgram(this.program);
      this.buffer = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]), gl.STATIC_DRAW);
      const position = gl.getAttribLocation(this.program, 'aPosition'); gl.enableVertexAttribArray(position); gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
      this.uniforms = {};
      gl.disable(gl.BLEND); // The full-screen pass already writes premultiplied pixels.
      gl.clearColor(0,0,0,0);
      for (const name of ['Resolution','Time','Phase','Glow','Bloom','Trail','Opacity','Variation','Rotation','Exposure','Intensity','Halo','Padding','CoreScale','IntroBoost','OrbitVisibility']) this.uniforms[name] = gl.getUniformLocation(this.program, 'u'+name);
    }
    setOptions(options) {
      const limits = { glow:[0,3], bloom:[0,3], orbitSpeed:[0,.2], trailLength:[.02,1], trailOpacity:[0,1], rayVariation:[0,.5], flareRotation:[-180,180], exposure:[.1,3], pixelRatio:[.5,2], padding:[1,2] };
      for (const [key, value] of Object.entries(options)) if (key in limits && Number.isFinite(value)) this.options[key] = Math.min(limits[key][1], Math.max(limits[key][0], value));
      if (this.resizeObserver && 'pixelRatio' in options) this.resize();
      if (this.resizeObserver) this.schedule();
    }
    resize() {
      const rect = this.canvas.getBoundingClientRect(), ratio = Math.min(devicePixelRatio || 1, this.options.pixelRatio);
      // Retain the highest required density across dock flights. CSS alone scales
      // the surface down; changing width/height here would clear the drawing buffer.
      const requestedWidth=Math.max(1,Math.round(rect.width*ratio)), requestedHeight=Math.max(1,Math.round(rect.height*ratio));
      const width = this.bufferSized ? Math.max(this.canvas.width,requestedWidth) : requestedWidth;
      const height = this.bufferSized ? Math.max(this.canvas.height,requestedHeight) : requestedHeight;
      this.bufferSized=true;
      const changed=this.canvas.width!==width || this.canvas.height!==height;
      if (changed) { this.canvas.width=width; this.canvas.height=height; }
      if (this.gl && !this.lost) this.gl.viewport(0,0,width,height);
      // ResizeObserver runs after RAF, before paint: redraw in this same task.
      if(changed && this.active && this.visible && !this.lost && !this.destroyed && !document.hidden) {
        cancelAnimationFrame(this.frame);this.frame=0;this.render(performance.now());
      } else this.schedule();
    }
    schedule() { if (!this.destroyed && !this.lost && this.active && this.visible && !document.hidden && !this.frame) this.frame = requestAnimationFrame(now => this.render(now)); }
    setActive(active) {
      active=Boolean(active);
      if(this.destroyed || this.active===active) return;
      this.active=active; this.last=null;
      if(!active) {
        cancelAnimationFrame(this.frame); this.frame=0; this.setHovered(false);
      } else { this.resize(); this.schedule(); }
    }
    settleHover() {
      for(const state of [this.lightTransition,this.speedTransition]) {
        state.value=state.from=state.to=this.hovered?1:0;state.elapsed=state.duration;
      }
    }
    setHovered(hovered) {
      if(this.destroyed || this.hovered===Boolean(hovered)) return;
      // Sample the old curve at the event time before interrupting its target.
      if(this.active && this.visible && !document.hidden && !this.lost) this.advance(performance.now());
      this.hovered=Boolean(hovered);
      retarget(this.lightTransition,this.hovered?1:0);
      retarget(this.speedTransition,this.hovered?1:0);
      if(this.motion.matches) this.settleHover();
      this.schedule();
    }
    advance(now) {
      // A RAF timestamp can predate a pointer event processed within that frame.
      const sample=this.last===null?now:Math.max(now,this.last);
      const dt=this.last===null?0:(sample-this.last)/1000;
      this.last=sample;
      const speedArea=advanceTransition(this.speedTransition,dt);
      advanceTransition(this.lightTransition,dt);
      if(!this.paused && !this.motion.matches) {
        this.time+=dt;
        this.phase=(this.phase+this.options.orbitSpeed*Math.PI*2*(dt+speedArea))%(Math.PI*2);
      }
    }
    appearance() {
      const light=this.lightTransition.value, speed=this.speedTransition.value;
      // Absolute radiance relative to the original baseline, not stacked multipliers.
      return { intensity:1.5+.50*light, bloom:this.options.bloom*(1.06+.12*light), halo:1+.08*light,
        trail:Math.min(1,this.options.trailLength*(1+.30*speed)) };
    }
    render(now) {
      this.frame = 0;
      if (this.destroyed || this.lost || !this.active || !this.visible || document.hidden) { this.last=null; return; }
      const animated = !this.paused && !this.motion.matches;
      this.advance(now);
      const o = this.options, gl = this.gl;
      const look=this.appearance();
      if (gl) {
        gl.useProgram(this.program);
        gl.uniform2f(this.uniforms.Resolution,this.canvas.width,this.canvas.height);
        const values={Time:this.time,Phase:this.phase,Glow:o.glow,Bloom:look.bloom,Trail:look.trail,Opacity:o.trailOpacity,Variation:o.rayVariation,Rotation:-o.flareRotation*Math.PI/180,Exposure:o.exposure,Intensity:look.intensity,Halo:look.halo,Padding:o.padding,CoreScale:this.coreScale,IntroBoost:this.introBoost,OrbitVisibility:this.orbitVisibility};
        for (const [key,value] of Object.entries(values)) gl.uniform1f(this.uniforms[key],value);
        gl.drawArrays(gl.TRIANGLES,0,6);
      } else this.drawCanvas();
      const transitioning=this.lightTransition.elapsed<this.lightTransition.duration || this.speedTransition.elapsed<this.speedTransition.duration;
      if (animated || transitioning) this.schedule();
      else this.last=null;
    }
    drawCanvas() {
      const c=this.ctx, w=this.canvas.width, h=this.canvas.height, scale=Math.min(w,h)/this.options.padding, o=this.options, t=this.time;
      const look=this.appearance();
      c.setTransform(1,0,0,1,0,0); c.clearRect(0,0,w,h);
      c.translate(w/2,h/2); c.scale(scale,-scale); c.globalCompositeOperation='screen';
      c.save();c.scale(this.coreScale,this.coreScale);
      const glow=(x,y,r,strength)=>{ const g=c.createRadialGradient(x,y,0,x,y,r); g.addColorStop(0,`rgba(255,246,224,${Math.min(1,strength)})`);g.addColorStop(.12,`rgba(202,221,255,${Math.min(1,strength*.5)})`);g.addColorStop(1,'rgba(130,170,255,0)');c.fillStyle=g;c.fillRect(x-r,y-r,r*2,r*2); };
      glow(0,0,.23*look.halo,.14*look.bloom*o.glow*look.intensity);
      c.save();c.rotate(-o.flareRotation*Math.PI/180);c.scale(2.6,.55);glow(0,0,.075*look.halo,.13*look.bloom*o.glow*look.intensity);c.restore();
      c.restore();
      const pos=a=>[.337*Math.cos(a)*Math.cos(-.49)-.136*Math.sin(a)*Math.sin(-.49),.337*Math.cos(a)*Math.sin(-.49)+.136*Math.sin(a)*Math.cos(-.49)];
      c.globalAlpha=this.orbitVisibility;
      // Sample one curved envelope so overlapping tails stay below peak opacity.
      const tau=Math.PI*2, span=look.trail*tau;
      for(let k=0;k<180;k++) {
        const angle=k/180*tau, p=pos(angle), q=pos((k+1)/180*tau);
        let fade=0;
        for(let j=0;j<2;j++) {
          const head=.65-j*Math.PI-this.phase;
          const behind=((angle-head)%tau+tau)%tau;
          fade=Math.max(fade,Math.pow(Math.max(0,1-behind/span),2.25)*o.trailOpacity);
        }
        c.beginPath();c.moveTo(...p);c.lineTo(...q);c.lineWidth=.0012;c.strokeStyle=`rgba(157,192,240,${fade})`;c.stroke();
      }
      for(let j=0;j<2;j++){
        const head=.65-j*Math.PI-this.phase;
        const p=pos(head);glow(...p,.027,.65*o.glow);glow(...p,.007,1);
      }
      for(const [i,ray] of [...dominantRays,...secondaryRays,...fineRays].entries()){
        if(i===0){c.globalAlpha=1;c.save();c.scale(this.coreScale,this.coreScale);}
        const [angle,extent,width,energy]=ray;
        c.save();c.rotate((angle-o.flareRotation)*Math.PI/180);
        const variation=1+o.rayVariation*Math.sin(t*.29+i*2.3)*.48;
        c.scale(variation,1+o.rayVariation*.3*Math.sin(t*.41+i));
        const length=extent*2.7, alpha=Math.min(.96,energy*.52*look.intensity);
        // Nested translucent streaks soften the fallback edges without shadow blur.
        for(const [spread,gain] of [[4.8,.10],[1.9,.17],[1,1]]){
          const halfWidth=.0038*width*spread, gradient=c.createLinearGradient(0,0,length,0);
          gradient.addColorStop(0,`rgba(245,246,255,${alpha*gain})`);gradient.addColorStop(.25,`rgba(186,209,255,${alpha*gain*.33})`);gradient.addColorStop(1,'rgba(160,195,255,0)');
          c.fillStyle=gradient;c.beginPath();c.moveTo(0,-halfWidth);c.quadraticCurveTo(.025,-halfWidth*.17,length,0);c.quadraticCurveTo(.025,halfWidth*.17,0,halfWidth);c.fill();
        }
        c.restore();
      }
      glow(0,0,.065*look.halo,.75*look.bloom*look.intensity*this.introBoost);glow(0,0,.026,.9*look.intensity*this.introBoost);glow(0,0,.010,1);c.restore();c.globalAlpha=this.orbitVisibility;glow(-.205,-.172,.012,.43*o.glow);glow(-.205,-.172,.003,.6);c.globalAlpha=1;
      c.globalCompositeOperation='source-over';
    }
    pause() { this.paused=true; this.last=null; this.schedule(); }
    play() { this.paused=false; this.last=null; this.schedule(); }
    destroy() {
      this.destroyed=true;cancelAnimationFrame(this.frame);this.frame=0;this.last=null;
      this.resizeObserver?.disconnect();this.intersectionObserver?.disconnect();
      global.removeEventListener('resize',this.onResize);
      this.motion?.removeEventListener('change',this.onMotion);document.removeEventListener('visibilitychange',this.onVisibility);
      this.canvas.removeEventListener('webglcontextlost',this.onLost);this.canvas.removeEventListener('webglcontextrestored',this.onRestored);
      this.canvas.removeEventListener('pointerenter',this.onEnter);
      this.canvas.removeEventListener('pointerleave',this.onLeave);
      this.canvas.removeEventListener('pointercancel',this.onLeave);
      if(this.gl){this.gl.deleteBuffer(this.buffer);this.gl.deleteProgram(this.program);}
    }
  }
  CelestialLogo.defaults=defaults;
  global.CelestialLogo=CelestialLogo;
})(window);
