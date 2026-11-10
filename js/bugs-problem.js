/* CLEAR ORBIT / BUGS PROBLEM storyboard — no other project is modified.
   01: annotated thumb/dead zones; 02: playlist slides from bottom,
   indicator zoom + red ring; 03: return player and show controls highlight.
   The loop resets after the original player reappears.
 */
(()=>{'use strict';
  const PLAYER='ASSET/05_MODAL_01_BUGS/BUGS_PROBLEM_PLAYER.png';
  const PLAYLIST='ASSET/05_MODAL_01_BUGS/BUGS_PROBLEM_PLAYLIST.png';
  const FRAME='ASSET/06_PROTOTYPE_PC_MOBILE/01_MOBILE_IPHONE_PROTO.png';
  const SPEED=.8; // v1.50.14: 80% of original playback speed, not a 20% shorter timeline.
  const sequence=[
    ['zone',2400,0],
    ['playlist-in',760,0],
    ['zoom',2350,1],
    ['unzoom',940,1],
    ['playlist-out',780,1],
    ['controls',2300,2],
    ['original',1350,-1]
  ];
  const getRoot=()=>document.querySelector('#orbit-project-detail');
  const getSection=()=>document.querySelector('#orbit-detail-problem')||
    document.querySelector('#orbit-project-detail [data-section="problem"]');
  let current=null,job=null,stepIndex=0,visible=false;
  function labelUp(index){
    const sec=current?.section;
    if(!sec)return;
    const articles=sec.querySelectorAll('.orbit-detail-issues article');
    articles.forEach((a,i)=>a.classList.toggle('bugs-issue-active',i===index));
  }
  function setStage(stage,issue=-1){
    if(!current)return;
    current.phone.dataset.bugsStage=stage;
    labelUp(issue);
  }
  function stop(reset=true){
    clearTimeout(job);job=null;visible=false;
    if(reset){stepIndex=0;setStage('original');}
  }
  function next(){
    if(!current||!visible)return;
    const [stage,ms,issue]=sequence[stepIndex];
    setStage(stage,issue);
    stepIndex=(stepIndex+1)%sequence.length;
    job=setTimeout(next,ms/SPEED);
  }
  function start(){
    if(!current||visible)return;
    visible=true;stepIndex=0;
    // Show supplied, unmarked screenshot briefly before annotations draw.
    setStage('original');job=setTimeout(next,550/SPEED);
  }
  function makePhone(){
    const el=document.createElement('div');
    el.className='orbit-bugs-problem-animated';
    el.dataset.bugsStage='original';
    el.setAttribute('role','img');
    el.setAttribute('aria-label','벅스 기존 앱 문제점 분석: 엄지 도달 범위, 현재 재생곡 표시, 재생 컨트롤 강조');
    el.innerHTML=`<div class="orbit-bugs-problem-screen">
      <div class="orbit-bugs-problem-player"><img src="${PLAYER}" alt="" draggable="false">
        <svg class="orbit-bugs-problem-annotation orbit-bugs-problem-zone" viewBox="0 0 100 200" preserveAspectRatio="none" aria-hidden="true">
          <path class="dead-outline" d="M3 96 V14 Q3 4 13 4 H87 Q97 4 97 14 V96 Z"/>
          <path class="thumb-outline" d="M3 195 V164 Q9 123 42 110 Q77 94 97 104 V195 Z"/>
          <text class="zone-dead-label" x="50" y="93" text-anchor="middle">Dead Zone</text>
          <text class="zone-thumb-label" x="71" y="112" text-anchor="middle">Thumb Zone</text>
        </svg>
        <svg class="orbit-bugs-problem-annotation orbit-bugs-problem-control" viewBox="0 0 100 200" preserveAspectRatio="none" aria-hidden="true">
          <rect x="4" y="156" width="92" height="25" rx="5"/>
        </svg>
        <svg class="orbit-bugs-problem-annotation" viewBox="0 0 100 200" preserveAspectRatio="none" aria-hidden="true">
          <g class="issue-01"><circle class="issue-bg" cx="88" cy="97" r="5.25"/><text class="issue-num" x="88" y="97">01</text></g>
          <g class="issue-03"><circle class="issue-bg" cx="88" cy="164" r="5.25"/><text class="issue-num" x="88" y="164">03</text></g>
        </svg>
      </div>
      <div class="orbit-bugs-problem-playlist"><div class="orbit-bugs-problem-playlist-content">
        <img src="${PLAYLIST}" alt="" draggable="false">
        <svg class="orbit-bugs-problem-annotation orbit-bugs-problem-playlist-mark" viewBox="0 0 100 200" preserveAspectRatio="none" aria-hidden="true">
          <circle class="ring" cx="82" cy="44" r="7"/>
          <circle cx="88" cy="37" r="5.25" fill="#ff575f"/>
          <text class="issue-num" x="88" y="37">02</text>
        </svg>
      </div></div>
      <span class="orbit-problem-uniform-badge orbit-bugs-badge--1" aria-hidden="true">01</span>
      <span class="orbit-problem-uniform-badge orbit-bugs-badge--2" aria-hidden="true">02</span>
      <span class="orbit-problem-uniform-badge orbit-bugs-badge--3" aria-hidden="true">03</span>
    </div><img class="orbit-bugs-problem-frame" src="${FRAME}" alt="" draggable="false">`;
    // v1.50.74: compact, NAVER-style in-screen captions; never alter the issue text.
    el.querySelector('.orbit-bugs-problem-screen').insertAdjacentHTML('beforeend',
      `<div class="orbit-problem-film-caption orbit-bugs-film-caption" aria-hidden="true"><span class="cap-1">01 · 한 손 조작의 불편함</span><span class="cap-2">02 · 현재 재생곡 식별성 부족</span><span class="cap-3">03 · 시각적 위계의 불명확성</span></div>`);
    // Full-resolution originals are retained only for PROBLEM enlarged mode.
    // The animated phone on the DETAIL page uses small WebP previews.
    el.querySelectorAll('.orbit-bugs-problem-player img,.orbit-bugs-problem-playlist-content img').forEach(img=>{
      const original=img.getAttribute('src');
      if(!original || !original.startsWith('ASSET/05_MODAL_01_BUGS/'))return;
      img.setAttribute('data-orbit-original',original);
      const preview=original.replace(/^ASSET\//,'ASSET/_PREVIEW/').replace(/\.png$/i,'.webp');
      // v1.50.141: an absent preview must never leave the animated phone blank.
      img.addEventListener('error',function restoreBugsOriginal(){
        if(img.getAttribute('src')===preview)img.setAttribute('src',original);
      },{once:true});
      img.setAttribute('src',preview);
    });
    return el;
  }
  function getGrid(section){
    const explicit=section.querySelector('.orbit-detail-problem-grid,.orbit-detail-problem-layout,.orbit-detail-problem-content,.orbit-detail-challenge-grid');
    if(explicit)return explicit;
    const imgs=[...section.querySelectorAll('img')].filter(img=>/02_01B_PROBLEM_0[12]\.png/i.test(img.getAttribute('src')||''));
    if(imgs.length>=2){
      let common=imgs[0].parentElement;
      while(common&&!imgs.every(img=>common.contains(img)))common=common.parentElement;
      return common?.parentElement||null;
    }
    return null;
  }
  function mountIfNeeded(){
    const root=getRoot(),section=getSection();
    if(!root||!section||root.dataset.project!=='bugs')return;
    if(current?.section===section&&current.phone.isConnected)return;
    stop();
    const grid=getGrid(section);
    if(!grid || !grid.classList.contains('orbit-detail-split'))return; // Different source structure: never destructively guess.
    const legacyImages=[...section.querySelectorAll('img')].filter(img=>
      /02_01B_PROBLEM_0[12]\.png/i.test(img.getAttribute('src')||''));
    const target=[...grid.children].find(el=>el.classList.contains('orbit-detail-media--problem') && legacyImages.some(img=>el.contains(img)));
    if(!target)return;
    const phone=makePhone();
    // This is the former two-image slot only. Keep original ISSUE explanation DOM.
    target.replaceChildren(phone);
    // Some old revisions laid the 2 images out as separate siblings.
    for(const img of legacyImages){
      if(!img.isConnected)continue;
      const box=img.parentElement;
      if(box?.parentElement===grid && !box.textContent.trim())box.remove();
      else img.remove();
    }
    target.classList.add('orbit-bugs-problem-host');
    section.classList.add('has-bugs-problem-animation');
    current={root,section,phone};
  }
  function problemIsActive(){
    const root=current?.root,section=current?.section;
    if(!root||!section||!current.phone.isConnected||document.hidden)return false;
    if(root.dataset.project!=='bugs'||root.getAttribute('aria-hidden')==='true')return false;
    if(!root.classList.contains('is-visible')&&!root.classList.contains('is-open'))return false;
    if(section.classList.contains('is-current'))return true;
    // Five-step HUD selection is a reliable alternate signal.
    const nav=root.querySelector('[data-detail-nav="1"]');
    if(nav&&(nav.classList.contains('is-active')||nav.getAttribute('aria-current')==='true'))return true;
    // Fallback for continuously translated DETAIL panels.
    const r=section.getBoundingClientRect(),view=(root.querySelector('.orbit-detail-viewport')||root).getBoundingClientRect();
    const y=Math.max(0,Math.min(r.bottom,view.bottom)-Math.max(r.top,view.top));
    return y>Math.min(180,r.height*.55)&&y/Math.max(1,Math.min(r.height,view.height))>.45;
  }
  function sync(){
    mountIfNeeded();
    if(current&&(!current.phone.isConnected||current.root.dataset.project!=='bugs')){stop();current=null;return;}
    if(!current)return;
    const active=problemIsActive();
    if(active&&!visible)start();else if(!active&&visible)stop();
  }
  document.addEventListener('visibilitychange',sync);
  // Rendering and the camera are owned by the existing v1.50 app.
  // Poll only for section state; no app internals, scroll handlers or 3D objects changed.
  setInterval(sync,220);
  window.ClearOrbitBugsProblem=Object.freeze({replay(){if(current){stop();start();}},getStage(){return current?.phone.dataset.bugsStage||null}});
})();
