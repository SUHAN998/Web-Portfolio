/* Progressive tooltip enhancement; existing progress values and timelines remain intact. */
(() => {
 'use strict';
 const tooltip=document.createElement('div');tooltip.className='orbit-skill-tooltip';tooltip.id='orbit-skill-tooltip';tooltip.role='tooltip';document.body.appendChild(tooltip);
 let active=null;
 function hide(){active?.removeAttribute('aria-describedby');active=null;tooltip.classList.remove('is-visible');}
 function place(x,y){const rect=tooltip.getBoundingClientRect();let left=x+14,top=y+16;
   if(left+rect.width>innerWidth-8)left=x-rect.width-12;
   if(top+rect.height>innerHeight-8)top=y-rect.height-12;
   tooltip.style.left=Math.max(8,Math.min(innerWidth-rect.width-8,left))+'px';
   tooltip.style.top=Math.max(8,Math.min(innerHeight-rect.height-8,top))+'px';
 }
 function show(el,event){active?.removeAttribute('aria-describedby');active=el;tooltip.textContent=el.getAttribute('aria-label');el.setAttribute('aria-describedby',tooltip.id);
   tooltip.classList.add('is-visible');const r=el.getBoundingClientRect();place(event?.clientX??r.right,event?.clientY??r.top);
 }
 document.querySelectorAll('.profile-skill').forEach(el=>{
   const label=el.querySelector('.profile-skill-inner span');el.setAttribute('aria-label',label.textContent);label.remove();el.tabIndex=0;el.setAttribute('role','button');
   const progress=Number.parseFloat(getComputedStyle(el).getPropertyValue('--v'));
   if(Number.isFinite(progress)){
     const percent=document.createElement('span');percent.className='profile-skill-percent';percent.textContent=Math.round(progress*100)+'%';
     percent.setAttribute('aria-hidden','true');el.setAttribute('aria-description',percent.textContent);el.appendChild(percent);
   }
   el.addEventListener('pointerenter',e=>{if(e.pointerType!=='touch')show(el,e);});
   el.addEventListener('pointermove',e=>{if(active===el&&e.pointerType!=='touch')place(e.clientX,e.clientY);});
   el.addEventListener('pointerleave',()=>{if(!el.matches(':focus-visible'))hide();});
   el.addEventListener('focus',()=>show(el));el.addEventListener('blur',hide);
   el.addEventListener('click',e=>show(el,e.detail?e:undefined));
   el.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();show(el);}if(e.key==='Escape'){e.preventDefault();hide();}});
 });
 document.addEventListener('pointerdown',e=>{if(active&&!active.contains(e.target))hide();},{passive:true});
 window.addEventListener('resize',hide);window.addEventListener('blur',hide);
 // A modal can close while a touch tooltip is open, without changing focus first.
 const observer=new MutationObserver(()=>{if(active){const profile=active.closest('.profile');if(profile.hidden||!profile.classList.contains('is-visible'))hide();}});
 document.querySelectorAll('.profile').forEach(el=>observer.observe(el,{attributes:true,attributeFilter:['hidden','class']}));
 window.addEventListener('pagehide',event=>{hide();if(!event.persisted)observer.disconnect();});
})();
