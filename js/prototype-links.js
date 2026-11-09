/* CLEAR ORBIT v1.49.4 — external PC prototypes, independently deployed.
 * These project URLs always show the latest successful GitHub Pages deployment.
 * To use frozen/stable versions later, update only the URL values below.
 * This file does not modify NAVER or GTA source repositories.
 */
(() => {
  'use strict';
  const sites = Object.freeze({
    // v1.50.19 — Use a phone-sized native iframe VIEWPORT, not the entire
    // 402x3000 tall Figma flow canvas. Keep the original Figma file untouched.
    // The old 3000px-height iframe showed the ~phone-sized UI at its top and
    // left a large black area in the outer device screen (user video 19:43).
    bugs: {url: 'https://embed.figma.com/proto/aGpQe85aeaOTtzYQfSHmjD?node-id=826-29410&starting-point-node-id=826%3A29410&embed-host=clear-orbit-portfolio&scaling=fit-width&content-scaling=fixed&device-frame=false&footer=false&viewport-controls=false&show-proto-sidebar=false&hotspot-hints=false&hide-ui=1', title: 'BUGS!', viewport: 402, kind: 'mobile'},
    // v1.50.22 — ALADIN mobile Figma prototype (user-provided Flow start).
    // The 402px virtual phone viewport and 1.474x crop are a matching initial
    // fit to BUGS, not a claim about the Aladin source frame's dimensions.
    aladin: {url: 'https://embed.figma.com/proto/LnG0IdwfQVEsiIgxdOKZKU?node-id=382-1326&starting-point-node-id=382%3A1326&page-id=260%3A2048&embed-host=clear-orbit-portfolio&scaling=fit-width&content-scaling=fixed&device-frame=false&footer=false&viewport-controls=false&show-proto-sidebar=false&hotspot-hints=false&hide-ui=1', title: 'ALADIN', viewport: 402, kind: 'mobile', displayZoom: 1.474},
    naver: {url: 'https://suhan998.github.io/NAVER_IN/01main.html', title: 'NAVER 지식iN', viewport: 1920},
    gta: {url: 'https://suhan998.github.io/GTA_PROMOTION_SITE_1102/', title: 'GTA ONLINE', viewport: 1920}
  });
  // v1.50.20: The Figma embed itself adds ~30% black presentation padding
  // around the rendered 402px app (verified in the user's 19:58 recording).
  // Increase VISUAL magnification only; keep the iframe's native 402px
  // viewport so Figma's internal layout, clicks and navigation remain intact.
  const BUGS_DISPLAY_ZOOM = 1.474;
  // ALADIN uses its own site.displayZoom so BUGS calibration never shifts.
  let observed = null;
  let observer = null;
  function disconnect(){
    if(observer){ observer.disconnect();observer=null; }
    observed=null;
  }
  function fit(site, screen, frame){
    if(!screen.isConnected || !frame.isConnected) return;
    const w=screen.clientWidth,h=screen.clientHeight;
    if(w<1||h<1)return;
    // Figma's flow canvas is 402x3000, but the actual app viewport fills
    // roughly its first phone-height segment. Rendering all 3000px leaves an
    // empty/black lower half even when width fits. Give Figma a normal phone
    // viewport (402 wide x screen aspect ratio), and let its own prototype
    // handle interactions, rather than scrolling a 3000px host spacer.
    if(site.kind==='mobile'){
      screen.classList.remove('orbit-figma-native-scroll');
      screen.classList.add('orbit-figma-phone-viewport');
      screen.querySelector('.orbit-figma-scroll-length')?.remove();
      const ratio=w/site.viewport;
      // Preserve v1.50.19's *native* iframe width and height; if we reduce
      // that height, Figma may shrink its tall flow again.  Instead zoom the
      // whole live iframe around its CENTER and crop only its black margins.
      const figmaViewportHeight=Math.ceil(h/ratio);
      const displayZoom=site.displayZoom ?? BUGS_DISPLAY_ZOOM;
      const displayRatio=ratio*displayZoom;
      frame.style.width=site.viewport+'px';
      frame.style.height=figmaViewportHeight+'px';
      frame.style.left=((w-site.viewport*displayRatio)/2)+'px';
      frame.style.top=((h-figmaViewportHeight*displayRatio)/2)+'px';
      frame.style.transform='scale('+displayRatio+')';
      frame.style.transformOrigin='0 0';
      frame.dataset.displayZoom=String(displayZoom);
      // Outer wrapper should not scroll down into the 3000px black canvas.
      // Wheel/touch events inside the iframe remain owned by Figma.
      frame.dataset.viewportWidth=String(site.viewport);
      frame.dataset.viewportHeight=String(figmaViewportHeight);
      delete screen.dataset.figmaNativeScale;
      screen.scrollTop=0;
      return;
    }
    // Existing live PC demos keep their original 1920px desktop viewport.
    const ratio=w/site.viewport;
    frame.style.width=site.viewport+'px';
    frame.style.height=Math.ceil(h/ratio)+'px';
    frame.style.transform='scale('+ratio+')';
    frame.dataset.viewportWidth=String(site.viewport);
  }
  function mount(project,screen){
    const site=sites[project];
    if(!site || !screen || !window.ClearOrbitSolutionPrototype)return;
    disconnect();
    const iframe=document.createElement('iframe');
    iframe.className='orbit-prototype-live-iframe';
    iframe.title=site.title+(site.kind==='mobile'?' Figma 인터랙티브 프로토타입':' 실제 웹 프로토타입');
    iframe.src=site.url;
    iframe.loading='eager';
    iframe.referrerPolicy='strict-origin-when-cross-origin';
    iframe.setAttribute('allowfullscreen','');
    iframe.setAttribute('data-live-project',project);
    iframe.style.width=site.viewport+'px';
    if(!window.ClearOrbitSolutionPrototype.mount(project,iframe))return;
    observed=screen;
    const update=()=>{if(observed===screen)fit(site,screen,iframe);};
    update();
    if(typeof ResizeObserver!=='undefined'){
      observer=new ResizeObserver(update);
      observer.observe(screen);
    }else{
      window.addEventListener('resize',update,{passive:true});
    }
  }
  window.addEventListener('orbit:solution-prototype-ready',event=>{
    const {project,slot}=event.detail||{};
    if(sites[project])mount(project,slot);
    else disconnect();
  });
  // Read-only status for future upgrades and simple console verification.
  window.ClearOrbitPrototypeLinks=Object.freeze({
    urls:Object.freeze({bugs:sites.bugs.url,aladin:sites.aladin.url,naver:sites.naver.url,gta:sites.gta.url}),
    current(){const el=document.querySelector('.orbit-prototype-live-iframe');
      return el?Object.freeze({project:el.dataset.liveProject,url:el.src,viewport:el.dataset.viewportWidth}):null;}
  });
})();
