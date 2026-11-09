/* v1.50.2 — live screen-only fly-out expansion.
 * The screen element itself is a popover. No iframe recreation/reparenting:
 * the website stays navigable with its scroll, input and navigation state.
 * The device PNG stays fixed in the SOLUTION chapter below the dimmer.
 */
(()=>{'use strict';
 const labels={bugs:'BUGS!',aladin:'ALADIN',naver:'NAVER 지식iN',gta:'GTA ONLINE'};
 const overlay=document.createElement('div');
 overlay.className='orbit-prototype-overlay';
 overlay.hidden=true;
 overlay.setAttribute('role','dialog');
 overlay.setAttribute('aria-modal','true');
 overlay.setAttribute('aria-label','프로토타입 크게 보기');
 overlay.innerHTML=`<div class="orbit-prototype-overlay-head">
   <div><strong class="orbit-prototype-overlay-title">PROTOTYPE</strong><small> · INTERACTIVE PREVIEW</small></div>
 </div><div class="orbit-prototype-overlay-stage"></div>
 <p class="orbit-prototype-overlay-hint">닫기 버튼 · 바깥 영역 클릭 · ESC(프로토타입 밖) &nbsp; | &nbsp; 내부 클릭 및 스크롤</p>
 <div class="orbit-lightbox-tools orbit-viewer-close-tools">
   <button type="button" class="orbit-lightbox-close orbit-prototype-overlay-close" aria-label="크게 보기 닫기">×</button>
 </div>`;
 document.body.append(overlay);
 const stage=overlay.querySelector('.orbit-prototype-overlay-stage');
 const title=overlay.querySelector('.orbit-prototype-overlay-title');
 const closeButton=overlay.querySelector('.orbit-prototype-overlay-close');
 const DURATION=880, EASE='cubic-bezier(.37,0,.19,1)';
 const reduced=()=>window.matchMedia('(prefers-reduced-motion: reduce)').matches;
 let current=null, transition=null, closeToken=0;
 function rect(el){const r=el.getBoundingClientRect();return {left:r.left,top:r.top,width:r.width,height:r.height};}
 function active(){return current!==null;}
 function layout(screen,source){
   // Orange markup: ~73% viewport width and most of the available height,
   // centered with margin for the controls on all desktop resolutions.
   const ratio=Math.max(.2,source.width/Math.max(source.height,1));
   const mobile=screen.closest('.orbit-solution-prototype')?.dataset.prototypeKind==='mobile';
   const maxW=Math.min(innerWidth-56,mobile?Math.min(innerWidth*.50,630):innerWidth*.73);
   const maxH=Math.max(130,innerHeight-115);
   const width=Math.min(maxW,maxH*ratio);
   const height=width/ratio;
   return {left:(innerWidth-width)/2,top:(innerHeight-height)/2,width,height};
 }
 function applyLayout(el,b){for(const k of ['left','top','width','height'])el.style.setProperty('--orbit-screen-zoom-'+k,b[k]+'px');}
 function transform(from,to){return `translate3d(${from.left-to.left}px,${from.top-to.top}px,0) scale(${from.width/to.width},${from.height/to.height})`;}
 function stop(){if(transition){transition.cancel();transition=null;}}
 function cursorTick(a){const run=()=>{window.ClearOrbitCursor?.refreshPrototypeFade?.();if(a.playState==='running')requestAnimationFrame(run);};requestAnimationFrame(run);}
 function animate(el,frames,duration,complete){
   stop();if(duration===0){complete?.();return;}
   const a=el.animate(frames,{duration,easing:EASE,fill:'both'});
   transition=a;cursorTick(a);
   a.onfinish=()=>{if(transition!==a)return;transition=null;a.cancel();complete?.();};
 }
 function cleanup(){
   if(!current)return;
   const {screen,button}=current;
   stop();
   if(screen.matches(':popover-open'))screen.hidePopover();
   screen.removeAttribute('popover');
   screen.classList.remove('orbit-prototype-screen-zoom');
   for(const k of ['left','top','width','height'])screen.style.removeProperty('--orbit-screen-zoom-'+k);
   overlay.classList.remove('is-visible','is-closing');overlay.hidden=true;
   document.documentElement.classList.remove('orbit-prototype-overlay-open');
   current=null;window.ClearOrbitCursor?.refreshPrototypeFade?.();
   if(button?.isConnected)button.focus({preventScroll:true});
 }
 function open(project,button){
   if(!labels[project])return;
   if(current){if(current.button===button)return;cleanup();}
   const shell=button.closest('.orbit-solution-prototype');
   const screen=shell?.querySelector('.orbit-solution-prototype-screen');
   if(!screen)return;
   const start=rect(screen);
   if(start.width<1||start.height<1)return;
   const target=layout(screen,start);
   current={project,screen,button,start,target};
   title.textContent=labels[project]+' · PROTOTYPE';
   overlay.hidden=false;overlay.classList.remove('is-closing');
   document.documentElement.classList.add('orbit-prototype-overlay-open');
   applyLayout(screen,target);
   screen.classList.add('orbit-prototype-screen-zoom');
   screen.setAttribute('popover','manual');
   screen.showPopover(); // SAME live iframe; only the screen enters top-layer.
   requestAnimationFrame(()=>{if(current?.screen===screen)overlay.classList.add('is-visible');});
   animate(screen,[{transform:transform(start,target)},{transform:'none'}],reduced()?0:DURATION);
   closeButton.focus({preventScroll:true});
 }
 function close({immediate=false}={}){
   if(!current)return;
   if(immediate||reduced()){cleanup();return;}
   const {screen,start}=current;
   const now=rect(screen);
   const base={left:parseFloat(screen.style.getPropertyValue('--orbit-screen-zoom-left')),
     top:parseFloat(screen.style.getPropertyValue('--orbit-screen-zoom-top')),
     width:parseFloat(screen.style.getPropertyValue('--orbit-screen-zoom-width')),
     height:parseFloat(screen.style.getPropertyValue('--orbit-screen-zoom-height'))};
   overlay.classList.remove('is-visible');overlay.classList.add('is-closing');
   animate(screen,[{transform:transform(now,base)},{transform:transform(start,base)}],Math.round(DURATION*.84),cleanup);
 }
 document.addEventListener('click',e=>{
   const button=e.target.closest?.('[data-prototype-expand]');
   if(!button)return;
   e.preventDefault();e.stopPropagation();open(button.dataset.prototypeExpand,button);
 },true);
 closeButton.addEventListener('click',()=>close());
 overlay.addEventListener('pointerdown',e=>{
   if(e.target===overlay||e.target===stage)close();
 });
 window.addEventListener('resize',()=>{
   if(!current)return;
   const {screen,start}=current;
   stop();applyLayout(screen,layout(screen,start));
 },{passive:true});
 window.addEventListener('keydown',e=>{
   if(!active())return;
   if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();close();}
   else if(['ArrowDown','ArrowUp','PageDown','PageUp','Home','End',' '].includes(e.key)
      && !e.target.closest?.('input,textarea,select,iframe'))e.stopImmediatePropagation();
 },true);
 window.addEventListener('wheel',e=>{
   if(!active())return;
   if(e.target.closest?.('.orbit-prototype-screen-zoom'))return;
   e.preventDefault();e.stopImmediatePropagation();
 },{capture:true,passive:false});
 overlay.addEventListener('touchmove',e=>{e.preventDefault();e.stopPropagation();},{passive:false,capture:true});
 window.addEventListener('orbit:project-released',()=>close({immediate:true}));
 window.ClearOrbitPrototypeViewer=Object.freeze({open,close,isOpen:active});
})();
