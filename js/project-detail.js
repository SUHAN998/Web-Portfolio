/* CLEAR ORBIT v1.48.1 — full-height moving project-detail panel.
 * Existing Three.js planet, approach camera, Explore state, satellite and CONTACT are not recreated.
 * Layouts are drawn from 02_PROJECT_DETAIL_MODAL_TYPES.pdf; source copy/images from the six project PDFs/ASSET_V1.
 */
(() => {
  'use strict';
  const root = document.getElementById('orbit-project-detail');
  const scroll = document.getElementById('orbit-detail-scroll');
  const panel = root?.querySelector('.orbit-detail-viewport');
  const nav = document.getElementById('orbit-detail-nav');
  const close = document.getElementById('orbit-detail-close');
  const explore = document.getElementById('explore');
  const stage = document.getElementById('stage');
  const ITEMS = new Map((window.__ORBIT_DETAIL_DATA__ || []).map(item => [item.key, item]));
  if (!root || !panel || !scroll || !nav || !close || !explore) return;
  const names = ['OVERVIEW', 'PROBLEM', 'INSIGHT', 'SOLUTION', 'FINAL DESIGN'];
  // FINAL DESIGN captions are taken verbatim from the six supplied reference screenshots.
  // Only the preview thumbnails use these captions; the full-screen viewer remains image-only.
  const finalCaptions = Object.freeze({
    bugs: ['MUSIC PLAYER', 'ESSENTIAL', 'MUSIC CHARTS', 'FULL SHOWCASE'],
    naver: ['MAIN HOME', 'QNA', 'ACCEPTED QUESTION', 'FULL SHOWCASE'],
    aladin: ['MAIN HOME', 'CATEGORY', 'BOOK DETAIL', 'FULL SHOWCASE'],
    seven: ['UNIFORM', 'DISPOSABLE CUPS', 'PACKAGE APPLICATION', 'STORE APPLICATION'],
    hwalok: ['FAN OUT', 'MAP', 'INFOMATION PAGE', 'DIELINE'],
    gta: ['MAIN HOME', 'PROPERTY MAP', 'ACCEPTED QUESTION', 'FULL SHOWCASE']
  });
  const escape = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  // v1.50.8: Copy is maintained in project-detail-data.js only. Original
  // project title/category stay in data for accessible alt text, and the
  // planet nameplate remains the visual project identifier.
  let pending = null, current = null, active = 0, closeTimeout = null;
  // The entire, naturally tall panel travels vertically; no nested scroll viewport.
  // The camera, planet and section-navigation HUD remain fixed in the 1440x1024 stage.
  const VIEW_HEIGHT = 754;
  // Panel-only uniform zoom: typography, images and spacing retain their PDF ratios.
  const DETAIL_PANEL_SCALE = 1.12;
  let openingToken = 0, position = 0, targetPosition = 0;
  let scrollFrame = 0, navLock = null, touchStartY = null, navTween = null;
  let sevenLogoInterval = null;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const stageScale = () => Math.max(.1, parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--s')) || 1);
  // v1.50.117: The RESULT landing position is a SCROLL position, not a
  // padding adjustment.  Its heading aligns with the fixed CLOSE MODAL top.
  // Previously the last chapter was clamped at (scrollHeight - VIEW_HEIGHT),
  // which cancelled every attempt to raise it by changing CSS padding.
  // Allow the exact additional scroll needed to reach that alignment; this
  // also reveals the bottom border/tail instead of clipping it below view.
  function resultLandingPosition(){
    if(!current)return 0;
    const heading=scroll.querySelector('.orbit-detail-section[data-section="final"] > .orbit-detail-kicker');
    if(!heading || !heading.getClientRects().length)return 0;
    const pixelsPerUnit=DETAIL_PANEL_SCALE*stageScale();
    return position+(heading.getBoundingClientRect().top-close.getBoundingClientRect().top)/pixelsPerUnit;
  }
  const maxPosition = () => Math.max(0, scroll.scrollHeight - VIEW_HEIGHT, resultLandingPosition());

  // v1.50.114 — Equal clear space between the five continuous DETAIL chapters.
  // Several legacy chapters use absolutely positioned content and fixed minimum
  // heights, so padding alone does not produce equal gaps when a chapter grows.
  // Measure the actual last content block and the NEXT chapter heading, then
  // adjust the PREVIOUS section's minimum height only. All interior artwork,
  // Figma phone/PC controls, and the five-section scroll mechanism stay intact.
  let chapterGapObserver=null,chapterGapMutationObserver=null,chapterGapFrame=0;
  function chapterGapTail(chapter){
    switch(chapter?.dataset.section){
      case 'overview':return chapter.querySelector('.orbit-detail-overview-grid');
      case 'problem':return chapter.querySelector('.orbit-cave-problem-horizontal')||chapter.querySelector('.orbit-detail-key-insight');
      case 'insight':return chapter.querySelector('.orbit-detail-insight-grid');
      case 'solution':return chapter.querySelector('.orbit-detail-solution-grid');
      default:return null;
    }
  }
  function syncChapterClearances(){
    if(root.hidden||!current)return;
    const chapters=[...scroll.querySelectorAll('.orbit-detail-section[data-section]')];
    if(chapters.length!==5)return;
    // Preserve the currently viewed chapter when a late image/font or window
    // resize changes the height of preceding chapters.
    const anchor=chapters[Math.min(4,Math.max(0,active))];
    const oldAnchorTop=anchor?.offsetTop||0;
    // Remove previous computed minimums before remeasuring: this also handles
    // viewport, font and media changes without cumulative layout inflation.
    chapters.slice(0,-1).forEach(chapter=>chapter.style.removeProperty('min-height'));
    const desired=parseFloat(getComputedStyle(root).getPropertyValue('--orbit-detail-chapter-gap'))||180;
    chapters.slice(0,-1).forEach((chapter,i)=>{
      const tail=chapterGapTail(chapter);
      const nextHeading=chapters[i+1].querySelector('.orbit-detail-kicker');
      if(!tail||!nextHeading)return;
      const ratio=chapter.offsetHeight>0?chapter.getBoundingClientRect().height/chapter.offsetHeight:0;
      if(ratio<.01)return;
      const gap=(nextHeading.getBoundingClientRect().top-tail.getBoundingClientRect().bottom)/ratio;
      const nextHeight=chapter.offsetHeight+desired-gap;
      // Explicit min-height never collapses the content box, and it naturally
      // expands if an image/description becomes taller than the baseline.
      chapter.style.minHeight=Math.max(0,nextHeight).toFixed(2)+'px';
    });
    const offsetShift=(anchor?.offsetTop||0)-oldAnchorTop;
    if(active>0 && Math.abs(offsetShift)>.01){
      position+=offsetShift;targetPosition+=offsetShift;
      if(navTween){navTween.from+=offsetShift;navTween.to+=offsetShift;}
    }
    targetPosition=clamp(targetPosition,0,maxPosition());
    position=clamp(position,0,maxPosition());
    paintPosition();
  }
  function queueChapterClearances(){
    if(chapterGapFrame)cancelAnimationFrame(chapterGapFrame);
    chapterGapFrame=requestAnimationFrame(()=>{chapterGapFrame=0;syncChapterClearances();});
  }
  function watchChapterClearances(){
    if(chapterGapObserver){chapterGapObserver.disconnect();chapterGapObserver=null;}
    if(chapterGapMutationObserver){chapterGapMutationObserver.disconnect();chapterGapMutationObserver=null;}
    if(typeof ResizeObserver!=='undefined')chapterGapObserver=new ResizeObserver(queueChapterClearances);
    if(typeof MutationObserver!=='undefined')chapterGapMutationObserver=new MutationObserver(queueChapterClearances);
    [...scroll.querySelectorAll('.orbit-detail-section[data-section]')].slice(0,-1).forEach(chapter=>{
      const tail=chapterGapTail(chapter);
      if(tail){
        if(chapterGapObserver){
          try{chapterGapObserver.observe(tail,{box:'border-box'});}
          catch(_err){chapterGapObserver.observe(tail);}
        }
        // ResizeObserver's content-box may not detect a pure padding change;
        // observe only the tail itself, not animated PROBLEM descendants.
        chapterGapMutationObserver?.observe(tail,{attributes:true,attributeFilter:['style','class']});
      }
    });
  }
  function stopChapterClearances(){
    if(chapterGapObserver){chapterGapObserver.disconnect();chapterGapObserver=null;}
    if(chapterGapMutationObserver){chapterGapMutationObserver.disconnect();chapterGapMutationObserver=null;}
    if(chapterGapFrame){cancelAnimationFrame(chapterGapFrame);chapterGapFrame=0;}
  }
  window.addEventListener('resize',queueChapterClearances);
  scroll.addEventListener('load',queueChapterClearances,true);

  function paintPosition() {
    panel.style.transform = `translate3d(0, ${-position*DETAIL_PANEL_SCALE}px, 0) scale(${DETAIL_PANEL_SCALE})`;
  }
  function resetPosition() {
    if(scrollFrame){cancelAnimationFrame(scrollFrame); scrollFrame=0;}
    position=targetPosition=0; navLock=null;navTween=null;
    scroll.scrollTop=0; // A safe reset for any legacy scroll state.
    paintPosition();
    syncActive(0);
  }
  function currentIndex() {
    const sections=[...scroll.querySelectorAll('[data-section]')];
    let index=0;
    const threshold=position+VIEW_HEIGHT*.38;
    sections.forEach((section,i)=>{if(section.offsetTop<=threshold+2)index=i;});
    if(maxPosition()-position<=2)index=4;
    return index;
  }
  function animateScroll(timestamp) {
    scrollFrame=0;
    if(!current || !root.classList.contains('is-visible'))return;
    targetPosition=clamp(targetPosition,0,maxPosition());
    if(navTween){
      const elapsed=Math.max(0,timestamp-navTween.start);
      const t=clamp(elapsed/navTween.duration,0,1);
      const smooth=t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;
      position=navTween.from+(navTween.to-navTween.from)*smooth;
      if(t>=1){position=navTween.to;navTween=null;}
    }else{
      const delta=targetPosition-position;
      position=Math.abs(delta)<.5?targetPosition:position+delta*.24;
    }
    paintPosition();
    if(navLock===null)syncActive(currentIndex());
    if(navTween || Math.abs(targetPosition-position)>.5){
      scrollFrame=requestAnimationFrame(animateScroll);
    }else if(navLock!==null){
      syncActive(navLock);navLock=null;
    }
  }
  function requestScroll(next, lockedIndex=null){
    targetPosition=clamp(next,0,maxPosition());
    navLock=lockedIndex;
    if(lockedIndex!==null){
      const distance=Math.abs(targetPosition-position);
      navTween={from:position,to:targetPosition,start:performance.now(),
        duration:window.matchMedia('(prefers-reduced-motion: reduce)').matches?1:Math.min(1150,800+distance*.035)};
      syncActive(lockedIndex);
    }else navTween=null;
    if(!scrollFrame)scrollFrame=requestAnimationFrame(animateScroll);
  }
  function userScroll(amount){
    if(!current)return;
    // Wheel/key increments accumulate on targetPosition for smooth repeated input.
    requestScroll(targetPosition+amount);
  }
  const assetImg = (src, alt, className='') => `<img class="${className}" src="${escape(src)}" alt="${escape(alt)}" loading="lazy" decoding="async">`;
  // Missing source artwork must not collapse a PDF-defined mockup frame.
  // Placeholder shapes remain empty; no invented project imagery or UI is added.
  const missingSlot = (kind, i=0) => `<figure class="orbit-detail-empty-media orbit-detail-empty-media--${kind} orbit-detail-slot-${i+1}" aria-label="이미지 미제공"><div aria-hidden="true"></div></figure>`;
  function media(srcs, alt, kind, itemKey) {
    if(!srcs?.length && kind!=='problem' && kind!=='solution')return '';
    if (kind === 'final') {
      const captions = finalCaptions[itemKey] || [];
      // Some ALADIN mockups are explicitly blank in the reference and have no supplied asset.
      // Keep their captioned slots rather than inventing or replacing project images.
      const count = Math.max(srcs.length, captions.length);
      const thumbnails = Array.from({length: count}, (_, i) => {
        const src = srcs[i];
        const label = escape(captions[i] || '');
        if (!src) {
          return `<figure class="orbit-detail-thumb--placeholder" aria-label="${label} — 이미지 미제공"><div class="orbit-detail-thumb-placeholder-media" aria-hidden="true"></div><span class="orbit-detail-thumb-caption">${label}</span></figure>`;
        }
        return `<figure class="${itemKey === 'seven' && i < 2 ? 'orbit-detail-seven-new-mockup' : ''}"><button class="orbit-detail-image-button" type="button" aria-label="${escape(alt+' '+(i+1))} 전체보기">${assetImg(src,alt+' '+(i+1))}<span class="orbit-detail-thumb-caption" aria-hidden="true">${label}</span></button></figure>`;
      }).join('');
      return `<div class="orbit-detail-media orbit-detail-media--final">${thumbnails}</div>`;
    }
    // The problem column has two image blocks in the supplied PDFs.
    // The SOLUTION column has one full mockup slot even where its asset is missing.
    const count = kind==='problem'?2:kind==='solution'?1:(srcs?.length||0);
    const slots=Array.from({length:count},(_,i)=>{
      const src=srcs?.[i];
      return src?`<figure>${assetImg(src,alt+' '+(i+1))}</figure>`:missingSlot(kind,i);
    }).join('');
    return `<div class="orbit-detail-media orbit-detail-media--${kind}">${slots}</div>`;
  }
  // v1.50.49 — NAVER-only analysis animation. Each chapter corresponds to
  // the 3 factual ISSUE headings. Screenshot art comes from the user uploads.
  // Camera/edit overlays are documentary annotations, not reconstructed UI.
  function naverProblemFilm() {
    const base='ASSET/05_MODAL_02_NAVER/';
    return `<div class="orbit-naver-problem-film" role="img"
      aria-label="네이버 지식iN 문제 분석. 01 복잡한 정보 구성, 02 일반 답변과 채택 답변의 구분 부족, 03 스크롤 시 탐색 메뉴 고정 부재를 순서대로 보여줍니다.">
      <div class="orbit-naver-film-scene orbit-naver-film-home" aria-hidden="true">
        <img src="${base}02_02N_PROBLEM_FILM_HOME.png" alt="" decoding="async" loading="eager">
        <span class="orbit-naver-home-focus orbit-naver-home-focus--promo"></span>
        <span class="orbit-naver-home-focus orbit-naver-home-focus--list"></span>
        <span class="orbit-naver-number-badge orbit-naver-number-badge--1" aria-hidden="true">01</span>
      </div>
      <div class="orbit-naver-film-scene orbit-naver-film-compare" aria-hidden="true">
        <div class="orbit-naver-answer-pane orbit-naver-answer-pane--accepted">
          <img src="${base}02_02N_PROBLEM_FILM_ACCEPTED_HD.png" alt="" decoding="async" loading="eager">
          <span class="orbit-naver-answer-type">채택 답변</span>
          <span class="orbit-naver-small-accepted"></span>
          <span class="orbit-naver-accepted-zoom" aria-hidden="true"><span class="orbit-naver-accepted-zoom-label">채택 표시 확대</span><img src="${base}02_02N_PROBLEM_FILM_ACCEPTED_DETAIL_ZOOM.png" alt="" decoding="async" loading="eager"></span>
        </div>
        <div class="orbit-naver-answer-pane orbit-naver-answer-pane--ordinary">
          <img src="${base}02_02N_PROBLEM_FILM_ORDINARY.png" alt="" decoding="async" loading="eager">
          <span class="orbit-naver-answer-type">일반 답변</span>
        </div>
        <span class="orbit-naver-number-badge orbit-naver-number-badge--2" aria-hidden="true">02</span>
      </div>
      <div class="orbit-naver-film-scene orbit-naver-film-scroll" aria-hidden="true">
        <div class="orbit-naver-scroll-viewport">
          <div class="orbit-naver-scroll-capture">
            <img src="${base}02_02N_PROBLEM_FILM_SCROLL_REFERENCE.png" alt="" decoding="async" loading="eager">
            <span class="orbit-naver-scroll-focus orbit-naver-scroll-focus--header">상단 메뉴</span>
            <span class="orbit-naver-scroll-focus orbit-naver-scroll-focus--sidebar">측면 메뉴</span>
          </div>
          <span class="orbit-naver-scroll-guide orbit-naver-scroll-guide--header">상단 메뉴 이탈</span>
          <span class="orbit-naver-scroll-guide orbit-naver-scroll-guide--sidebar">측면 메뉴 이탈</span>
        </div>
        <span class="orbit-naver-number-badge orbit-naver-number-badge--3" aria-hidden="true">03</span>
      </div>
      <div class="orbit-naver-film-caption" aria-hidden="true"><span class="orbit-naver-film-caption--home">01 · 복잡한 정보 구성</span><span class="orbit-naver-film-caption--compare">02 · 일반·채택 답변 구분 부족</span><span class="orbit-naver-film-caption--scroll">03 · 탐색 메뉴 고정 부재</span></div>
    </div>`;
  }
  function section(key, label, contents) {
    return `<section class="orbit-detail-section" id="orbit-detail-${key}" data-section="${key}" aria-label="${label}">${contents}</section>`;
  }
  // v1.50.56 — ALADIN PROBLEM: reuse the BUGS! screen-in-device approach.
  // Each supplied unmarked screenshot receives its exact marked counterpart;
  // no UI reconstruction and no other project's film is changed.
  function aladinProblemFilm() {
    const base='ASSET/05_MODAL_03_ALADIN/';
    const frame='ASSET/06_PROTOTYPE_PC_MOBILE/01_MOBILE_IPHONE_PROTO.png';
    const slides=[
      ['01','아이콘의 시각적 일관성 부족'],
      ['02','불명확한 카테고리 분류 체계'],
      ['03','검색 결과의 시각적 위계 부족']
    ];
    return `<div class="orbit-aladin-problem-film" data-aladin-stage="base1" role="img"
      aria-label="알라딘 기존 앱 문제 분석. 아이콘 스타일 혼재, 카테고리 분류 체계, 검색 결과 정보 위계를 실제 화면과 강조 캡처로 순서대로 보여줍니다.">
      <div class="orbit-aladin-problem-screen">
        ${slides.map((slide,i)=>`<div class="orbit-aladin-film-scene orbit-aladin-film-scene--${i+1}" aria-hidden="true">
          <img class="orbit-aladin-film-original" src="${base}02_03A_PROBLEM_ISSUE${slide[0]}_ORIGINAL.png" alt="" loading="eager" decoding="async" draggable="false">
          <img class="orbit-aladin-film-marked" src="${base}02_03A_PROBLEM_ISSUE${slide[0]}_MARKED_BADGE_CLEAN.png" alt="" loading="eager" decoding="async" draggable="false">
          ${i===0?'<span class="orbit-problem-uniform-badge orbit-aladin-badge--1a" aria-hidden="true">01</span><span class="orbit-problem-uniform-badge orbit-aladin-badge--1b" aria-hidden="true">01</span>':i===1?'<span class="orbit-problem-uniform-badge orbit-aladin-badge--2" aria-hidden="true">02</span>':'<span class="orbit-problem-uniform-badge orbit-aladin-badge--3" aria-hidden="true">03</span>'}
        </div>`).join('')}
        <div class="orbit-problem-film-caption orbit-aladin-film-caption" aria-hidden="true"><span class="cap-1">01 · 아이콘 일관성 부족</span><span class="cap-2">02 · 불명확한 카테고리</span><span class="cap-3">03 · 검색 결과 위계 부족</span></div>
      </div>
      <img class="orbit-aladin-problem-frame" src="${frame}" alt="" loading="eager" decoding="async" draggable="false">
    </div>`;
  }
  // v1.50.71 — GTA is an original promotion concept, NOT a redesign of an
  // existing website. Reuse existing project artwork; no invented old-site UI.
  // v1.50.84 — CAVE only. Keep the photographed original leaflet intact and
  // animate the green callout rectangles as separate HTML overlays. The outside
  // spread is shown first, ISSUE 01 zooms in slightly, ISSUE 02 shows two
  // distinct text-heavy regions, then the inside spread slides in quickly for
  // ISSUE 03 with the poster / Where overlay sequence.
  function caveProblemFilm(item){
    const base='ASSET/05_MODAL_05_BROCHURE/';
    const label=item.issues.map((issue,i)=>`0${i+1} ${issue.title}`).join(', ');
    return `<div class="orbit-cave-problem-film" data-cave-stage="base1" role="img" aria-label="활옥동굴 원본 리플렛의 문제를 단계적으로 보여주는 자동 애니메이션. ${escape(label)}">
      <div class="orbit-cave-problem-canvas">
        <figure class="orbit-cave-problem-page orbit-cave-problem-page--outside" aria-hidden="true">
          <div class="orbit-cave-problem-page-inner">
            <img class="orbit-cave-problem-page-image" src="${base}02_05C_PROBLEM_ORIGINAL_OUTSIDE_FULL.png" alt="" loading="eager" decoding="async" draggable="false">
          </div>
          <span class="orbit-cave-problem-box orbit-cave-problem-box--issue1" data-label="01" aria-hidden="true"></span>
          <span class="orbit-cave-problem-box orbit-cave-problem-box--issue2a" data-label="02" aria-hidden="true"></span>
          <span class="orbit-cave-problem-box orbit-cave-problem-box--issue2b" data-label="02" aria-hidden="true"></span>
        </figure>
        <figure class="orbit-cave-problem-page orbit-cave-problem-page--inside" aria-hidden="true">
          <div class="orbit-cave-problem-page-inner">
            <img class="orbit-cave-problem-page-image" src="${base}02_05C_PROBLEM_ORIGINAL_INSIDE_FULL.png" alt="" loading="eager" decoding="async" draggable="false">
          </div>
          <div class="orbit-cave-problem-drama-overlay" aria-hidden="true">
            <div class="orbit-cave-problem-drama-filter"></div>
            <figure class="orbit-cave-problem-poster orbit-cave-problem-poster--1">
              <img src="${base}02_05C_PROBLEM_POSTER_DP_ORIGINAL.png" alt="" loading="eager" decoding="async" draggable="false">
              <figcaption>#DP_촬영지</figcaption>
            </figure>
            <figure class="orbit-cave-problem-poster orbit-cave-problem-poster--2">
              <img src="${base}02_05C_PROBLEM_POSTER_MONEYHEIST_ORIGINAL.png" alt="" loading="eager" decoding="async" draggable="false">
              <figcaption>#종이의집_촬영지</figcaption>
            </figure>
            <div class="orbit-cave-problem-where"><b>?</b><span>Where??</span></div>
          </div>
        </figure>
      </div>
      <div class="orbit-problem-film-caption orbit-cave-film-caption" aria-hidden="true">
        <span class="cap-1">01. 혼재된 정보 구조</span>
        <span class="cap-2">02. 텍스트 중심 안내의 한계</span>
        <span class="cap-3">03. 차별적 매력 전달 부족</span>
      </div>
    </div>`;
  }

  function gtaPlanningFilm(){
    const base='ASSET/05_MODAL_06_GTA/';
    const scenes=[
      {tag:'TARGET',heading:'신규·복귀 플레이어',sub:'새로운 시작을 준비하는 이용자',image:'01_05G_OVERVIEW_GTA.png'},
      {tag:'BENEFIT',heading:'자금 · 부동산 · 차량',sub:'게임 시작을 돕는 세 가지 혜택',image:'05_05G_FINAL_03_BENEFIT_CARD.png'},
      {tag:'GOAL',heading:'혜택 인지 → 참여',sub:'정보 확인에서 직접 탐색으로',image:'05_05G_FINAL_02_PROPERTY_MAP.png'}
    ];
    return `<div class="orbit-gta-planning-film" role="img" aria-label="GTA Online 가상 프로모션 기획: 신규·복귀 플레이어, 자금·부동산·차량 혜택, 혜택 인지와 참여 유도 순서로 자동 전환">
      ${scenes.map((scene,i)=>`<div class="orbit-gta-planning-scene orbit-gta-planning-scene--${i+1}" aria-hidden="true">
        <img src="${base+scene.image}" alt="" loading="eager" decoding="async" draggable="false">
        <div class="orbit-gta-planning-shade"></div>
        <div class="orbit-gta-planning-copy"><b>0${i+1} / ${scene.tag}</b><strong>${scene.heading}</strong><span>${scene.sub}</span></div>
      </div>`).join('')}
    </div>`;
  }
  function render(item) {
    stopSevenLogoAuto();
    const meta = item.media;
    const sectionTitle = (name, head) => `<div class="orbit-detail-kicker">${escape(name)}</div><h3>${head}</h3>`;
    // Keep the approved four topic tags on a single row. Shorten only longer
    // tags that cannot fit the 278px metadata column; meaning stays unchanged.
    const shortenedTags = {'#정보우선순위':'#정보위계','#한글로고타입':'#한글로고','#비주얼스토리텔링':'#비주얼연출','#직관적인UI':'#직관적UI','#아이콘일관성':'#아이콘통일','#도서탐색':'#책탐색','#CI리디자인':'#CI개선'};
    const tags = `<div class="orbit-detail-tags">${item.tags.map(tag=>`<span>${escape(shortenedTags[tag] || tag)}</span>`).join('')}</div>`;
    const colors = `<div class="orbit-detail-colors">${item.colors.map(color=>`<span title="${escape(color)}"><i style="background:${escape(color)}"></i><small>${escape(String(color).replace(/^#/,''))}</small></span>`).join('')}</div>`;
    const summary = escape(item.summary);
    const description = escape(item.description);
    const periodLabel = /^(개인 프로젝트|팀 프로젝트)/.exec(item.period)?.[0] || '';
    const periodText = periodLabel ? item.period.slice(periodLabel.length).trim() : item.period;
    const period = `<p class="orbit-detail-period"><strong>${escape(periodLabel)}</strong><span>${escape(periodText)}</span></p>`;
    const overview = section('overview','OVERVIEW',
      `${media(meta.overview,item.title,'cover')}<div class="orbit-detail-overview-content"><h2>${escape(item.headline)}</h2><div class="orbit-detail-overview-grid"><div><p class="orbit-detail-summary">${summary}</p><p class="orbit-detail-description">${description}</p></div><div>${tags}${period}${colors}</div></div></div>`);
    const issueTexts = `<div class="orbit-detail-issues">${item.issues.map((issue,i)=>`<article><strong>${item.key==='gta'?['TARGET','BENEFIT','GOAL'][i]:'ISSUE 0'+(i+1)}</strong><h4>${escape(issue.title)}</h4><p>${escape(issue.body)}</p></article>`).join('')}</div>`;
    // v1.50.60 — 7ELEVEN only: retain the authentic prior storefront photo;
    // use the original CI artwork as a structure analysis rather than repeating
    // the plain logo image, without redrawing or inventing a historical logo.
    const sevenProblemMedia=item.key==='seven' ? `<div class="orbit-detail-media orbit-detail-media--problem orbit-seven-problem-media"><figure>${assetImg(meta.problem[0],'기존 7ELEVEN 간판과 매장 사진')}</figure><figure class="orbit-seven-problem-breakdown"><div class="orbit-seven-problem-breakdown-image">${assetImg(meta.problem[1],'기존 7ELEVEN 로고와 줄무늬 CI')}</div></figure></div>` : '';
    const caveProblemMedia=item.key==='hwalok' ? `<div class="orbit-detail-media orbit-detail-media--problem orbit-cave-original-problem-media">${meta.problem.map((src,i)=>`<figure>${assetImg(src,'활옥동굴 기존 리플렛 원본 문제 분석 '+(i+1))}</figure>`).join('')}</div>` : '';
    const caveProblemCopy = item.key==='hwalok' ? `<div class="orbit-cave-problem-copy">${item.issues.map((issue,i)=>`<article data-issue-index="${i}"><strong>0${i+1}</strong><h4>${escape(issue.title)}</h4><p>${escape(issue.body)}</p></article>`).join('')}<article class="orbit-cave-problem-key"><strong>KEY INSIGHT</strong><p>${escape(item.keyInsight)}</p></article></div>` : '';
    const problem = item.key==='hwalok'
      ? section('problem','PROBLEM',`${sectionTitle('PROBLEM',escape(item.problemTitle))}<div class="orbit-cave-problem-horizontal">${caveProblemFilm(item)}${caveProblemCopy}</div>`)
      : section('problem',item.key==='gta'?'PLANNING':'PROBLEM',`${sectionTitle(item.key==='gta'?'PLANNING':'PROBLEM',escape(item.problemTitle))}<div class="orbit-detail-split">${item.key==='naver'?naverProblemFilm():item.key==='aladin'?aladinProblemFilm():item.key==='seven'?sevenProblemMedia:item.key==='hwalok'?caveProblemMedia:item.key==='gta'?gtaPlanningFilm():media(meta.problem,item.title+' 문제 분석','problem')}${issueTexts}</div><div class="orbit-detail-key-insight"><strong>${item.key==='gta'?'PLANNING INSIGHT':'KEY INSIGHT'}</strong><p>${escape(item.keyInsight)}</p></div>`);
    // 7ELEVEN INSIGHT focuses on its own CI decisions, not repeated photos:
    // 01 historical symbol/wordmark/colors; 02 verified old-to-new comparison.
    // All images are original project/user assets; annotations are HTML/CSS.
    const sevenInsightArt=(index)=> index===0 ? `<div class="orbit-seven-insight-artboard orbit-seven-insight-artboard--identity" role="img" aria-label="기존 7ELEVEN CI에 사용된 숫자 7, 워드마크와 브랜드 색상 분석"><div class="orbit-seven-identity-source">${assetImg(meta.insight[0],'7ELEVEN 로고 변천사 원본 이미지')}</div></div>` : `<div class="orbit-seven-insight-artboard orbit-seven-insight-artboard--comparison" role="img" aria-label="기존 7ELEVEN CI와 새로 제작한 기본 CI의 형태 비교"><div class="orbit-seven-artboard-eyebrow">FORM REFINEMENT · COMPARISON</div><div class="orbit-seven-compare-content"><div class="orbit-seven-compare-side"><span>ORIGINAL</span><div>${assetImg(meta.insight[0],'기존 7ELEVEN CI')}</div></div><span class="orbit-seven-compare-arrow" aria-hidden="true">→</span><div class="orbit-seven-compare-side orbit-seven-compare-side--new"><span>REFINED</span><div>${assetImg(meta.insight[1],'사용자가 제작한 새 기본 7ELEVEN CI')}</div></div></div></div>`;
    const insightRows = `<div class="orbit-detail-insight-rows">${item.insightRows.map((row,i)=>`<article>${item.key==='seven'?sevenInsightArt(i):meta.insight[i]?assetImg(meta.insight[i],item.title+' 분석 자료 '+(i+1)):`<div class="orbit-detail-empty-media orbit-detail-empty-media--insight" aria-label="이미지 미제공"></div>`}<div class="orbit-detail-row-caption"><b>0${i+1}</b><div><strong>${escape(row.title)}</strong><p>${escape(row.body)}</p></div></div></article>`).join('')}</div>`;
    // The IDC screenshot is user-supplied evidence for BUGS! only; keep existing insight artwork intact.
    const insightEvidence=item.key==='bugs' ? `<figure class="orbit-insight-idc-evidence"><img src="ASSET/05_MODAL_01_BUGS/03_01B_IDC_MARKET_REPORT_CAPTURE.png" alt="IDC 폴더블 스마트폰 시장 전망 기사 캡처" loading="lazy" decoding="async"><figcaption>근거 자료 출처 : <a href="https://my.idc.com/getdoc.jsp?containerId=prUS54017625" target="_blank" rel="noopener noreferrer">IDC Market Report</a></figcaption></figure>` : '';
    // BUGS! only: distill the supplied "02 - UI Benchmarking" slide into two contextual
    // figures and its Safety First takeaway. These numbers are cited as values stated
    // in the user's slide, not as independently verified conclusions of the IDC article.
    const insightBenchmark=item.key==='bugs' ? `<div class="orbit-bugs-benchmark" aria-label="UI 벤치마킹 참고 지표"><div class="orbit-bugs-benchmark-facts"><div><strong>70% 이상</strong><span>이동·운동·작업 중<br>한 손 조작 의존</span></div><div><strong>6.7인치</strong><span>길어진 화면에서<br>상단 도달 부담 증가</span></div></div><div class="orbit-bugs-benchmark-takeaway"><b>SAFETY FIRST</b><span>엄지 범위 내 핵심 조작,<br>실수 없는 음악 제어.</span></div></div>` : '';
    // v1.50.51 — NAVER INSIGHT: show the real project concept / benchmark basis
    // under DESIGN DIRECTION, using the user's PPT and captured reference UIs.
    const insightReference=item.key==='naver' ? `<section class="orbit-naver-insight-reference" aria-label="NAVER 지식iN 디자인 콘셉트 및 벤치마킹 근거"><div class="orbit-naver-insight-reference-head"><strong>BENCHMARK REFERENCE</strong><p>‘지식의 숲’ 콘셉트와 명확한 정보 위계 참고</p></div><div class="orbit-naver-insight-reference-list"><article class="orbit-naver-insight-reference-card"><div class="orbit-naver-insight-reference-copy"><span>Aha</span><b>명확한 정보 위계</b><p>질문 중심의 직관적인 정보 배치 참고</p></div><figure><button class="orbit-detail-image-button orbit-benchmark-viewer" type="button" aria-label="Aha 벤치마킹 이미지 크게 보기"><img src="ASSET/05_MODAL_02_NAVER/03_02N_INSIGHT_BENCHMARK_AHA.png" alt="Aha 서비스 UI 캡처" loading="lazy" decoding="async"></button></figure></article><article class="orbit-naver-insight-reference-card"><div class="orbit-naver-insight-reference-copy"><span>Quora</span><b>답변 탐색 흐름</b><p>SNS형 피드를 활용한 답변 탐색 참고</p></div><figure><button class="orbit-detail-image-button orbit-benchmark-viewer" type="button" aria-label="Quora 벤치마킹 이미지 크게 보기"><img src="ASSET/05_MODAL_02_NAVER/03_02N_INSIGHT_BENCHMARK_QUORA.png" alt="Quora 서비스 UI 캡처" loading="lazy" decoding="async"></button></figure></article></div></section>` : '';
    // v1.50.57 — ALADIN only. Reuse NAVER's benchmark markup/CSS layout;
    // source analysis: user-supplied Kyobo and YES24 benchmarking slides.
    const aladinBenchmark=item.key==='aladin' ? `<section class="orbit-naver-insight-reference orbit-aladin-insight-reference" aria-label="알라딘 교보문고 YES24 벤치마킹"><div class="orbit-naver-insight-reference-head"><strong>BENCHMARK REFERENCE</strong><p>모바일 도서 탐색의 일관성과 정보 구조 참고</p></div><div class="orbit-naver-insight-reference-list"><article class="orbit-naver-insight-reference-card"><div class="orbit-naver-insight-reference-copy"><span>교보문고</span><b>카테고리 구조</b><p>직관적인 도서 분류와 여백 설계 참고</p></div><figure><button class="orbit-detail-image-button orbit-aladin-benchmark-viewer" type="button" aria-label="교보문고 벤치마킹 이미지 전체보기"><img src="ASSET/05_MODAL_03_ALADIN/03_03A_BENCHMARK_KYOBO.png" alt="사용자 제공 교보문고 앱 UI 캡처" loading="lazy" decoding="async"></button></figure></article><article class="orbit-naver-insight-reference-card"><div class="orbit-naver-insight-reference-copy"><span>YES24</span><b>아이콘 일관성</b><p>통일된 아이콘과 색상 체계 참고</p></div><figure><button class="orbit-detail-image-button orbit-aladin-benchmark-viewer" type="button" aria-label="YES24 벤치마킹 이미지 전체보기"><img src="ASSET/05_MODAL_03_ALADIN/03_03A_BENCHMARK_YES24.png" alt="YES24 앱 UI 벤치마킹 참고 이미지" loading="lazy" decoding="async"></button></figure></article></div></section>` : '';
    // v1.50.59 — 7ELEVEN: project-specific CI heritage / redesign criteria.
    // The two photos on the left are existing original-CI assets, not new mockups.
    // These are design objectives, not measured brand-recognition outcomes.
    const sevenCiDecision=item.key==='seven' ? `<div class="orbit-seven-ci-decision" aria-label="기존 7ELEVEN CI의 유지 요소와 재구성 요소"><p class="orbit-seven-ci-decision-note">브랜드 식별성 유지 여부의 검증 결과가 아닌 디자인 계승 목표입니다.</p><div class="orbit-seven-ci-decision-columns"><div><h5>KEEP</h5><ul><li>숫자 7의 상징</li><li>브랜드 고유색</li><li>식별 요소 계승</li></ul></div><div><h5>REFINE</h5><ul><li>복합 형태 정리</li><li>각진 인상 완화</li><li>심벌·로고 조화</li></ul></div></div></div>` : '';
    const insight = section('insight','INSIGHT',`${sectionTitle('INSIGHT',escape(item.insightTitle))}<div class="orbit-detail-insight-grid">${insightRows}<div class="orbit-detail-direction"><span>DESIGN DIRECTION</span><h4>${escape(item.direction)}</h4><p>${escape(item.directionBody)}</p>${insightBenchmark}${insightReference}${aladinBenchmark}${sevenCiDecision}${insightEvidence}</div></div>`);
    const solutionLabels=item.key==='seven'
      ? ['DESIGN DIRECTION','DESIGN DEVELOPMENT','DESIGN PROCESS']
      : ['DESIGN DIRECTION','KEY IMPROVEMENTS','FLOW POINT'];
    const solutionGroups = item.solutionGroups.map((list,i)=>`<article><b>0${i+1}</b><div><h4>${solutionLabels[i]}</h4>${i===2?`<p>${escape(list.join(' · '))}</p>`:`<ul>${list.map(t=>`<li>${escape(t)}</li>`).join('')}</ul>`}</div></article>`).join('');
    // v1.49.3: approved MOBILE / PC solution prototype mount points.
    // The transparent PNG is the fixed device shell; future Figma UI is mounted
    // into the separate screen beneath it. Nothing is invented for the UI yet.
    const prototypeKinds={bugs:'mobile',aladin:'mobile',naver:'desktop',gta:'desktop'};
    const prototypeKind=prototypeKinds[item.key];
    const prototypeFrame=prototypeKind==='mobile'
      ? 'ASSET/06_PROTOTYPE_PC_MOBILE/01_MOBILE_IPHONE_PROTO.png'
      : 'ASSET/06_PROTOTYPE_PC_MOBILE/02_PC_FRAME_PROTO_V2.png';
    const prototypeLabel=prototypeKind==='mobile'?'모바일 앱':'PC 웹';
    const prototypeShell=prototypeKind ? `<div class="orbit-solution-prototype orbit-solution-prototype--${prototypeKind}" data-prototype-project="${item.key}" data-prototype-kind="${prototypeKind}" aria-label="${escape(item.title)} ${prototypeLabel} 프로토타입 프레임">
      <div class="orbit-solution-prototype-screen" data-prototype-screen="${item.key}">
        <div class="orbit-solution-prototype-placeholder" aria-label="프로토타입 화면 연결 대기">
          <span>PROTOTYPE</span><small>화면 연결 대기</small>
        </div>
      </div><img class="orbit-solution-prototype-frame" src="${prototypeFrame}" alt="" draggable="false" loading="eager" decoding="async"><button type="button" class="orbit-prototype-expand" data-prototype-expand="${item.key}" aria-label="${escape(item.title)} 프로토타입 크게 보기" title="프로토타입 크게 보기"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8.5 3H3v5.5M15.5 3H21v5.5M3 15.5V21h5.5M21 15.5V21h-5.5"/></svg></button>
    </div>` : null;
    // 7ELEVEN option selector is a same-size artwork viewer, not an added page.
    // The four PNGs are the user's exact uploaded files (including their captions).
    const sevenLogoOptions=[
      ['Default','711_01_Default.png','기본 영문 컬러 로고'],
      ['Korean','711_02_Kor.png','한글판 컬러 로고'],
      ['Mono','711_03_Mono.png','단색 영문 로고'],
      ['Mono KR','711_04_Mono_Kor.png','단색 한글 로고']
    ];
    const sevenLogoDir='ASSET/05_MODAL_04_7ELEVEN/';
    const sevenSlideImage=(opt,extra='')=>`<img class="orbit-seven-logo-slide-image" src="${sevenLogoDir+opt[1]}" alt="${escape(opt[2])}" draggable="false" loading="eager" decoding="async" ${extra}>`;
    // The leading/trailing clones allow the 4 -> 1 loop to visibly slide forward.
    const sevenLogoTrack=[sevenLogoOptions[3],...sevenLogoOptions,sevenLogoOptions[0]].map((opt,i)=>`<div class="orbit-seven-logo-slide" ${i===0||i===5?'aria-hidden="true"':''}>${sevenSlideImage(opt)}</div>`).join('');
    const sevenLogoViewer=item.key==='seven' ? `<div class="orbit-detail-media orbit-detail-media--solution orbit-seven-logo-viewer" aria-label="7ELEVEN 로고 시안 4종 선택형 뷰어"><figure class="orbit-seven-logo-display"><div class="orbit-seven-logo-track" style="transform:translate3d(-100%,0,0)">${sevenLogoTrack}</div></figure><div class="orbit-seven-logo-options" role="group" aria-label="로고 시안 선택">${sevenLogoOptions.map((opt,i)=>`<button type="button" data-seven-logo-option="${i}" aria-pressed="${i===0?'true':'false'}" class="${i===0?'is-selected':''}">${escape(opt[0])}</button>`).join('')}</div></div>` : '';
    // v1.50.65 — CAVE: actual Illustrator PDF surfaces, physical tri-fold demonstration.
    const caveDir='ASSET/05_MODAL_05_BROCHURE/';
    const caveViewer=item.key==='hwalok' ? `<div class="orbit-cave-leaflet-viewer" data-cave-mode="outside" aria-label="충주 활옥동굴 3단 리플렛 앞면, 뒷면, 접힌 모습 체험">
      <div class="orbit-cave-view-tabs" role="group" aria-label="리플렛 보기 전환">
        <button type="button" class="is-active" data-cave-view="outside" aria-pressed="true">OUTSIDE</button>
        <button type="button" data-cave-view="inside" aria-pressed="false">INSIDE</button>
        <button type="button" data-cave-view="folded" aria-pressed="false">FOLDED</button>
      </div>
      <div class="orbit-cave-stage">
        <div class="orbit-cave-sheet orbit-cave-sheet--flat" aria-label="펼친 리플렛 앞면 또는 뒷면">
          <div class="orbit-cave-sheet-face orbit-cave-sheet-face--outside"><img src="${caveDir}04_05C_SOLUTION_OUTSIDE.png" alt="활옥동굴 리플렛 펼친 외부면, 표지·관람안내" draggable="false"></div>
          <div class="orbit-cave-sheet-face orbit-cave-sheet-face--inside"><img src="${caveDir}04_05C_SOLUTION_INSIDE.png" alt="활옥동굴 리플렛 펼친 내부면, 동굴 일러스트 지도" draggable="false"></div>
        </div>
        <div class="orbit-cave-fold" aria-label="3개의 패널이 순서대로 두 번 접히는 3단 리플렛" aria-hidden="true">
          <div class="orbit-cave-fold-cover" aria-hidden="true"></div>
          <div class="orbit-cave-fold-wing" aria-hidden="true">
            <div class="orbit-cave-fold-wing-face orbit-cave-fold-wing-face--outside"></div>
            <div class="orbit-cave-fold-wing-face orbit-cave-fold-wing-face--inside"></div>
            <div class="orbit-cave-fold-flap">
              <div class="orbit-cave-fold-flap-face orbit-cave-fold-flap-face--outside"></div>
              <div class="orbit-cave-fold-flap-face orbit-cave-fold-flap-face--inside"></div>
            </div>
          </div>
        </div>
        <div class="orbit-cave-measure orbit-cave-measure--width"><span>297mm</span></div>
        <div class="orbit-cave-measure orbit-cave-measure--height"><span>210mm</span></div>
      </div>
      <div class="orbit-cave-view-info"><span data-cave-description>펼친 외부면 · 표지와 관람 안내</span><button type="button" data-cave-replay hidden>REPLAY <span aria-hidden="true">↻</span></button></div>
    </div>` : '';
    const solutionMedia=item.key==='hwalok'?caveViewer:item.key==='seven'?sevenLogoViewer:(prototypeKind ? prototypeShell : media(meta.solution,item.title+' 해결 방향','solution'));
    const solution = section('solution','SOLUTION',`<div class="orbit-detail-kicker">SOLUTION</div><div class="orbit-detail-solution-grid${prototypeKind?' orbit-detail-solution-grid--prototype orbit-detail-solution-grid--'+prototypeKind:''}">${solutionMedia}<div class="orbit-detail-solution-points">${solutionGroups}</div></div>`);
    const finalHeading=item.key==='seven'?'VISUAL APPLICATION':'FINAL DESIGN';
    const final = section('final',finalHeading,`<div class="orbit-detail-kicker">${finalHeading}</div>${media(meta.final,item.title+' 최종 결과물','final',item.key)}`);
    scroll.innerHTML = overview + problem + insight + solution + final;
    // v1.50.105: every genuine INSIGHT image (analysis, evidence and comparison)
    // opens the same viewer as BENCHMARK and RESULT. Do not create a new viewer.
    scroll.querySelectorAll('.orbit-detail-section[data-section="insight"] img').forEach(img=>{
      if(img.closest('.orbit-detail-image-button'))return; // already supported
      img.classList.add('orbit-insight-zoomable');
      img.setAttribute('role','button');
      img.setAttribute('tabindex','0');
      img.setAttribute('aria-label',(img.alt||'분석 이미지')+' 크게 보기');
    });
    // v1.50.97: preserve 9.9px type, +1.5px horizontal pill padding, 5px gaps.
    // Show 4 tags only when they genuinely fit inside the 216px marked region;
    // otherwise retain 3 and shorten the longest label as a last resort.
    function fitOverviewHashtags() {
      const row=scroll.querySelector('[data-section="overview"] .orbit-detail-tags');
      if(!row)return;
      const spans=[...row.querySelectorAll('span')];
      spans.forEach(span=>{
        span.hidden=false;
        span.style.display='';
        if(!span.dataset.fullTag)span.dataset.fullTag=span.textContent;
        span.textContent=span.dataset.fullTag;
        span.style.flex='0 0 auto';
      });
      const limit=Math.min(216,row.parentElement?.getBoundingClientRect().width || 216);
      const gap=5;
      function measuredWidth(list){
        return list.reduce((sum,span)=>{
          const st=getComputedStyle(span);
          const cv=document.createElement('canvas').getContext('2d');
          cv.font=`${st.fontWeight} ${st.fontSize} ${st.fontFamily}`;
          const width=cv.measureText(span.textContent).width
            + parseFloat(st.paddingLeft)+parseFloat(st.paddingRight)
            + parseFloat(st.borderLeftWidth||0)+parseFloat(st.borderRightWidth||0);
          return sum+width;
        },Math.max(0,list.length-1)*gap);
      }
      let visible=spans.slice();
      if(measuredWidth(visible)>limit && visible.length>3){
        spans.slice(3).forEach(span=>{span.hidden=true;span.style.display='none';});
        visible=spans.slice(0,3);
      }
      // Never slice a hashtag mid-word: that produced broken labels such as
      // "#CI리디" in earlier builds. The explicit semantic aliases above keep
      // all three fallback tags legible while fitting inside the 216px track.
      // If fonts load late, the same fitting pass runs again after fonts.ready.
      visible.forEach(span=>{span.title=span.dataset.fullTag;});
    }
    fitOverviewHashtags();
    requestAnimationFrame(fitOverviewHashtags);
    if(document.fonts?.ready)document.fonts.ready.then(fitOverviewHashtags);

    root.dataset.layout = item.layout;
    root.dataset.project = item.key;
    resetPosition();
    const navButtons = [...nav.querySelectorAll('[data-detail-nav]')];
    // The shared HUD retains its index, position and event handlers.
    const secondLabel=navButtons[1]?.querySelector('.orbit-detail-nav-text');
    if(secondLabel)secondLabel.textContent=item.key==='gta'?'02. PLANNING':'02. PROBLEM';
    navButtons.forEach((button,i)=>{button.classList.toggle('is-active',i===0);button.setAttribute('aria-current',i===0?'step':'false');});
    active = 0;
    syncActive(0);
    if(prototypeKind){
      const slot=scroll.querySelector('[data-prototype-screen="'+item.key+'"]');
      window.dispatchEvent(new CustomEvent('orbit:solution-prototype-ready',{detail:{project:item.key,kind:prototypeKind,slot}}));
    }
  }
  // v1.50.61 — 7ELEVEN only: horizontal slide carousel, seamless 5s loop.
  // The viewer keeps the original media box size, leaving section scrolling,
  // planet framing and the navigation HUD untouched.
  function stopSevenLogoAuto(){
    if(sevenLogoInterval!==null){clearInterval(sevenLogoInterval);sevenLogoInterval=null;}
  }
  function sevenLogoViewer(){return scroll.querySelector('.orbit-seven-logo-viewer');}
  function setSevenLogoActive(viewer,index){
    viewer.querySelectorAll('[data-seven-logo-option]').forEach((button,i)=>{
      const selected=i===index;
      button.classList.toggle('is-selected',selected);
      button.setAttribute('aria-pressed',String(selected));
    });
  }
  function slideSevenLogo(viewer,nextIndex){
    if(!viewer || viewer.dataset.animating==='true')return false;
    const currentIndex=Number(viewer.dataset.logoIndex||0);
    const normalized=(nextIndex+4)%4;
    if(normalized===currentIndex)return false;
    const track=viewer.querySelector('.orbit-seven-logo-track');
    if(!track)return false;
    const wrapForward=currentIndex===3 && normalized===0;
    const wrapBack=currentIndex===0 && normalized===3;
    const indexToShow=wrapForward?5:wrapBack?0:normalized+1;
    viewer.dataset.logoIndex=String(normalized);
    viewer.dataset.animating='true';
    setSevenLogoActive(viewer,normalized);
    const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    track.style.transition=reduced?'none':'transform 520ms cubic-bezier(.24,.68,.21,1)';
    track.style.transform=`translate3d(-${indexToShow*100}%,0,0)`;
    if(reduced){
      track.style.transform=`translate3d(-${(normalized+1)*100}%,0,0)`;
      viewer.dataset.animating='false';
    }
    return true;
  }
  scroll.addEventListener('transitionend',event=>{
    if(!event.target.classList?.contains('orbit-seven-logo-track') || event.propertyName!=='transform')return;
    const viewer=event.target.closest('.orbit-seven-logo-viewer');
    if(!viewer)return;
    const index=Number(viewer.dataset.logoIndex||0);
    // Do not animate the invisible jump from the terminal clone to real slide.
    event.target.style.transition='none';
    event.target.style.transform=`translate3d(-${(index+1)*100}%,0,0)`;
    viewer.dataset.animating='false';
  });
  function syncSevenLogoAuto(){
    const shouldRun=current==='seven' && active===3 && root.classList.contains('is-visible') && !document.hidden;
    if(!shouldRun){stopSevenLogoAuto();return;}
    if(sevenLogoInterval!==null)return;
    sevenLogoInterval=setInterval(()=>{
      const viewer=sevenLogoViewer();
      if(!viewer)return;
      slideSevenLogo(viewer,(Number(viewer.dataset.logoIndex||0)+1)%4);
    },5000);
  }
  document.addEventListener('visibilitychange',syncSevenLogoAuto);
  scroll.addEventListener('click',event=>{
    const button=event.target.closest?.('[data-seven-logo-option]');
    if(!button || root.dataset.project!=='seven')return;
    event.preventDefault();
    slideSevenLogo(button.closest('.orbit-seven-logo-viewer'),Number(button.dataset.sevenLogoOption));
    stopSevenLogoAuto();syncSevenLogoAuto();
  });
  // Mount a real UI only after its Figma screens/behaviors are supplied.
  // Passing an HTMLElement keeps the PNG device frame independent of its UI.
  window.ClearOrbitSolutionPrototype=Object.freeze({
    getSlot(project){return scroll.querySelector('[data-prototype-screen="'+project+'"]');},
    mount(project,element){
      const slot=this.getSlot(project);
      if(!slot || !(element instanceof HTMLElement))return false;
      slot.replaceChildren(element);slot.classList.add('is-interactive');return true;
    }
  });
  // v1.50.67 — CAVE: single delegated event listener, measured 3D leaflets,
  // and cancellable forward/reverse fold & face-flip timelines.
  let caveFoldTimers=[];
  function clearCaveFoldTimers(){
    caveFoldTimers.forEach(clearTimeout);
    caveFoldTimers=[];
  }
  function queueCaveFoldTimer(fn,delay){
    const id=setTimeout(()=>{
      caveFoldTimers=caveFoldTimers.filter(timer=>timer!==id);
      fn();
    },delay);
    caveFoldTimers.push(id);
    return id;
  }
  // v1.50.68: a flexible paper curl composed of 22 joined 3D strips.
  // Unlike a single rotateY panel, each strip bends at a slightly delayed
  // angle, keeping adjacent edges connected in x/z space at every frame.
  let caveCurlFrame=0;
  function stopCaveCurl(viewer){
    if(caveCurlFrame){cancelAnimationFrame(caveCurlFrame);caveCurlFrame=0;}
    if(viewer){
      viewer.classList.remove('is-curling');
      const curl=viewer.querySelector('.orbit-cave-page-curl');
      if(curl)curl.classList.remove('is-active');
    }
  }
  function makeCaveCurl(viewer){
    const stage=viewer.querySelector('.orbit-cave-stage');
    let curl=stage.querySelector('.orbit-cave-page-curl');
    if(curl)return curl;
    curl=document.createElement('div');
    curl.className='orbit-cave-page-curl';
    curl.setAttribute('aria-hidden','true');
    const outside=viewer.querySelector('.orbit-cave-sheet-face--outside img')?.getAttribute('src');
    const inside=viewer.querySelector('.orbit-cave-sheet-face--inside img')?.getAttribute('src');
    const count=30;
    const width=parseFloat(getComputedStyle(stage).getPropertyValue('--cave-w'))||444;
    const height=parseFloat(getComputedStyle(stage).getPropertyValue('--cave-h'))||314;
    const piece=width/count;
    for(let i=0;i<count;i++){
      const strip=document.createElement('div');
      strip.className='orbit-cave-page-curl-strip';
      strip.style.width=`${piece+.7}px`;
      strip.dataset.curlStrip=String(i);
      const front=document.createElement('div');
      front.className='orbit-cave-page-curl-face orbit-cave-page-curl-face--outside';
      front.style.backgroundImage=`url("${outside}")`;
      front.style.backgroundSize=`${width}px ${height}px`;
      front.style.backgroundPosition=`-${i*piece}px 0`;
      const back=document.createElement('div');
      back.className='orbit-cave-page-curl-face orbit-cave-page-curl-face--inside';
      back.style.backgroundImage=`url("${inside}")`;
      back.style.backgroundSize=`${width}px ${height}px`;
      // Physical sheet backside is seen from the opposite direction.
      back.style.backgroundPosition=`-${(count-1-i)*piece}px 0`;
      strip.append(front,back);
      curl.append(strip);
    }
    stage.append(curl);
    return curl;
  }
  function animateCavePaperFlip(viewer,from,to,onDone){
    stopCaveCurl(viewer);
    if(from===to){viewer.dataset.caveMode=to;onDone();return;}
    const curl=makeCaveCurl(viewer);
    const strips=[...curl.children];
    const count=strips.length;
    const width=parseFloat(getComputedStyle(viewer.querySelector('.orbit-cave-stage')).getPropertyValue('--cave-w'))||444;
    const piece=width/count;
    const forward=from==='outside';
    const total=1050;
    const PI=Math.PI;
    const clamp=n=>Math.max(0,Math.min(1,n));
    const ease=t=>t*t*(3-2*t);
    function paint(time){
      const progress=clamp(time/total);
      const angles=[];
      for(let i=0;i<count;i++){
        const u=(i+.5)/count;
        // The leading edge begins first; the trailing edge catches up.
        const delay=(forward?u:1-u)*.17;
        const fraction=clamp((progress-delay)/.83);
        const flutter=Math.sin(PI*fraction)*Math.sin((u*1.8-progress*2.4)*PI)*.10;
        angles.push(PI*(forward?ease(fraction):1-ease(fraction))+flutter);
      }
      const x=[0],z=[0];
      for(let i=0;i<count;i++){
        x.push(x[i]+piece*Math.cos(angles[i]));
        z.push(z[i]-piece*Math.sin(angles[i]));
      }
      const shiftX=(x[0]+x[count])/2;
      const shiftZ=(z[0]+z[count])/2;
      for(let i=0;i<count;i++){
        const angle=angles[i];
        const px=x[i]+piece*Math.cos(angle)/2-shiftX+width/2-piece/2;
        const pz=z[i]-piece*Math.sin(angle)/2-shiftZ;
        const v=(i+.5)/count;
        const sway=Math.sin(PI*progress)*Math.sin((v*.9-progress*1.15)*PI)*1.3;
        strips[i].style.transform=`translate3d(${px.toFixed(3)}px,${sway.toFixed(2)}px,${pz.toFixed(3)}px) rotateY(${(angle*180/PI).toFixed(3)}deg)`;
        strips[i].style.setProperty('--curl-shade',String((.02+.10*Math.abs(Math.sin(angle))*Math.abs(Math.sin(v*PI))).toFixed(3)));
      }
    }
    viewer.dataset.caveMode=to;
    viewer.classList.add('is-curling');
    curl.classList.add('is-active');
    paint(0);
    const start=performance.now();
    function step(now){
      const elapsed=now-start;
      paint(elapsed);
      if(elapsed<total){caveCurlFrame=requestAnimationFrame(step);}
      else{
        caveCurlFrame=0;
        // Static target face becomes visible only after the last curl frame.
        stopCaveCurl(viewer);
        onDone();
      }
    }
    caveCurlFrame=requestAnimationFrame(step);
  }
  function setCaveView(viewer,mode,{replay=false}={}){
    if(!viewer || !['outside','inside','folded'].includes(mode))return;
    const previous=viewer.dataset.caveMode || 'outside';
    if(!replay && previous===mode && !viewer.classList.contains('is-animating'))return;
    clearCaveFoldTimers();
    stopCaveCurl(viewer);
    const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const label=viewer.querySelector('[data-cave-description]');
    const replayButton=viewer.querySelector('[data-cave-replay]');
    viewer.querySelectorAll('[data-cave-view]').forEach(btn=>{
      const selected=btn.dataset.caveView===mode;
      btn.classList.toggle('is-active',selected);
      btn.setAttribute('aria-pressed',String(selected));
    });
    if(label) label.textContent={
      outside:'펼친 외부면 · 표지와 관람 안내',
      inside:'펼친 내부면 · 일러스트 지도와 주요 체험',
      folded:'접힌 모습 · 최종 표지'
    }[mode];
    if(replayButton)replayButton.hidden=mode!=='folded';
    viewer.classList.add('is-animating');
    const finish=()=>viewer.classList.remove('is-animating');
    // Reduced-motion requests still receive a working state switch and sizes.
    if(reduced){
      viewer.dataset.caveMode=mode;
      viewer.classList.toggle('is-fold-step1',mode==='folded');
      viewer.classList.toggle('is-fold-step2',mode==='folded');
      viewer.classList.toggle('is-folded',mode==='folded');
      finish();
      return;
    }
    const foldFromOutside=()=>{
      viewer.dataset.caveMode='folded';
      viewer.classList.remove('is-fold-step1','is-fold-step2','is-folded');
      // Consecutive folds: left panel onto middle, then the paired leaves
      // onto the cover. The last repositioning centers the 99mm front.
      queueCaveFoldTimer(()=>viewer.classList.add('is-fold-step1'),55);
      queueCaveFoldTimer(()=>viewer.classList.add('is-fold-step2'),370);
      queueCaveFoldTimer(()=>viewer.classList.add('is-folded'),690);
      queueCaveFoldTimer(finish,950);
    };
    const flipTo=face=>{
      const from=viewer.dataset.caveMode==='inside'?'inside':'outside';
      viewer.classList.remove('is-fold-step1','is-fold-step2','is-folded');
      animateCavePaperFlip(viewer,from,face,finish);
    };
    if(previous==='folded'){
      // Unfold in reverse order so changing tabs never makes a closed leaflet
      // suddenly pop open or leave its 99mm dimension visible mid-motion.
      viewer.classList.add('is-fold-step1','is-fold-step2','is-folded');
      viewer.dataset.caveMode='folded';
      if(mode==='folded'){
        // REPLAY must start from the fully closed 99mm leaflet, unfold BOTH
        // hinged panels in reverse, hold the full 297mm spread briefly, and
        // only then perform the original two-step closing sequence. Removing
        // all fold classes at once skipped the unfolding animation entirely.
        queueCaveFoldTimer(()=>viewer.classList.remove('is-folded'),45);
        queueCaveFoldTimer(()=>viewer.classList.remove('is-fold-step2'),330);
        queueCaveFoldTimer(()=>viewer.classList.remove('is-fold-step1'),660);
        queueCaveFoldTimer(foldFromOutside,1090);
        return;
      }
      queueCaveFoldTimer(()=>viewer.classList.remove('is-folded'),45);
      queueCaveFoldTimer(()=>viewer.classList.remove('is-fold-step2'),320);
      queueCaveFoldTimer(()=>viewer.classList.remove('is-fold-step1'),630);
      queueCaveFoldTimer(()=>{
        viewer.dataset.caveMode='outside';
        if(mode==='inside')queueCaveFoldTimer(()=>flipTo('inside'),60);
        else finish();
      },950);
      return;
    }
    if(mode==='folded'){
      if(previous==='inside'){
        animateCavePaperFlip(viewer,'inside','outside',foldFromOutside);
      }else foldFromOutside();
      return;
    }
    flipTo(mode);
  }
  // Delegation survives rebuilding the detail panel via render().
  scroll.addEventListener('click',event=>{
    const button=event.target.closest?.('[data-cave-view]');
    const replay=event.target.closest?.('[data-cave-replay]');
    if(!button && !replay)return;
    if(current!=='hwalok')return;
    const viewer=event.target.closest('.orbit-cave-leaflet-viewer');
    if(!viewer)return;
    event.preventDefault();
    event.stopPropagation();
    setCaveView(viewer,button?button.dataset.caveView:'folded',{replay:!!replay});
  });
  function syncActive(index) {
    active=index;
    syncSevenLogoAuto();
    for(const button of nav.querySelectorAll('[data-detail-nav]')) {
      const is = Number(button.dataset.detailNav)===index;
      button.classList.toggle('is-active',is);
      button.setAttribute('aria-current',is?'step':'false');
    }
    // 50% luminance for previously passed and not-yet-reached sections;
    // only the section currently in view is displayed at full brightness.
    [...scroll.querySelectorAll('[data-section]')].forEach((section,i)=>{
      section.classList.toggle('is-current',i===index);
    });
    // Only animate while the NAVER problem chapter is active. Re-entering it
    // restarts the film from scene 01; leave/close stops all three CSS timelines.
    // Each project's PROBLEM loop runs only while its chapter is active.
    for(const film of scroll.querySelectorAll('.orbit-naver-problem-film,.orbit-aladin-problem-film,.orbit-gta-planning-film')){
      const project=film.classList.contains('orbit-naver-problem-film')?'naver':film.classList.contains('orbit-gta-planning-film')?'gta':'aladin';
      const play=index===1 && current===project && root.classList.contains('is-visible');
      film.classList.toggle('is-playing',play);
    }
  }
  // v1.50.89: remove the optional segmented progress indicators entirely.
  // Existing per-project films own their own timing; no autoplay sequence is changed.
  // FINAL DESIGN viewer — isolated from project scroll/camera controls.
  // Initial image width matches the project's main content width (560 stage px).
  const lightbox=document.createElement('div');
  lightbox.className='orbit-detail-lightbox';lightbox.hidden=true;
  lightbox.setAttribute('role','dialog');lightbox.setAttribute('aria-modal','true');
  lightbox.setAttribute('aria-label','프로젝트 이미지 전체보기');
  lightbox.innerHTML=`<div class="orbit-lightbox-legend" aria-label="조작 방법">
    <strong>IMAGE VIEWER</strong>
    <span>마우스 휠 · 확대 / 축소 (최소 100%)</span>
    <span>왼쪽 버튼 누른 채 드래그 · 이미지 이동</span>
    <span>화면 좌우 가장자리 / ← → · 같은 묶음 사진 이동</span>
    <span>ESC · 닫기</span>
  </div><div class="orbit-lightbox-tools">
    <label for="orbit-lightbox-zoom">ZOOM</label>
    <button class="orbit-lightbox-zoom-out" type="button" aria-label="축소">−</button>
    <input id="orbit-lightbox-zoom" class="orbit-lightbox-slider" type="range" min="100" max="400" step="5" value="100" aria-label="이미지 확대 배율">
    <button class="orbit-lightbox-zoom-in" type="button" aria-label="확대">+</button>
    <output class="orbit-lightbox-percent" for="orbit-lightbox-zoom">100%</output>
    <button class="orbit-lightbox-close" type="button" aria-label="전체보기 닫기">×</button>
  </div><div class="orbit-lightbox-surface" aria-label="확대 이미지 영역">
    <img class="orbit-lightbox-image" alt="" draggable="false">
  </div>
  <button class="orbit-lightbox-edge orbit-lightbox-edge--prev" type="button" aria-label="같은 섹션의 이전 이미지" title="이전 이미지" hidden><span aria-hidden="true"></span></button>
  <button class="orbit-lightbox-edge orbit-lightbox-edge--next" type="button" aria-label="같은 섹션의 다음 이미지" title="다음 이미지" hidden><span aria-hidden="true"></span></button>`;
  document.body.append(lightbox);
  const lightboxImage=lightbox.querySelector('.orbit-lightbox-image');
  const lightboxSurface=lightbox.querySelector('.orbit-lightbox-surface');
  const lightboxClose=lightbox.querySelector('.orbit-lightbox-close');
  const lightboxSlider=lightbox.querySelector('.orbit-lightbox-slider');
  const lightboxPercent=lightbox.querySelector('.orbit-lightbox-percent');
  const zoomOut=lightbox.querySelector('.orbit-lightbox-zoom-out');
  const zoomIn=lightbox.querySelector('.orbit-lightbox-zoom-in');
  const previousImage=lightbox.querySelector('.orbit-lightbox-edge--prev');
  const nextImage=lightbox.querySelector('.orbit-lightbox-edge--next');
  let galleryImages=[], galleryIndex=0, gallerySection="";
  let gallerySliding=false, gallerySlideSession=0;
  let restoreFocus=null, lightboxCloseTimer=null, lightboxOpenToken=0;
  let zoom=1,panX=0,panY=0,baseWidth=560,spaceHeld=false,panPointer=null;
  const lightboxClamp = value=>clamp(value,1,4);
  function viewerBusy(){return !lightbox.hidden;}
  function keepPanInRange(){
    // An image at or below its fitted size is ALWAYS centered. Once
    // zoomed in, allow wheel/Space-drag panning within a useful range.
    if(zoom<=1){panX=0;panY=0;return;}
    const naturalRatio=lightboxImage.naturalWidth>0 && lightboxImage.naturalHeight>0
      ? lightboxImage.naturalHeight/lightboxImage.naturalWidth : 1;
    // The zoomed image may pass the viewport edge by at most 100px.
    // Do not allow the center to drift beyond the image edge + 100px.
    const viewWidth=lightboxSurface.clientWidth||innerWidth;
    const viewHeight=lightboxSurface.clientHeight||innerHeight;
    const limitX=Math.max(0,(baseWidth*zoom-viewWidth)/2+100);
    const limitY=Math.max(0,(baseWidth*naturalRatio*zoom-viewHeight)/2+100);
    panX=clamp(panX,-limitX,limitX);
    panY=clamp(panY,-limitY,limitY);
  }
  function paintViewer(){
    keepPanInRange();
    lightboxImage.style.width=baseWidth+'px';
    lightboxImage.style.transform=`translate3d(${panX}px,${panY}px,0) scale(${zoom})`;
    lightboxSlider.value=String(Math.round(zoom*100));
    lightboxPercent.textContent=Math.round(zoom*100)+'%';
    zoomOut.disabled=zoom<=1.0001;
  }
  function setZoom(value,point=null){
    const next=lightboxClamp(value);
    if(next===zoom){if(next<=1){panX=panY=0;paintViewer();}return;}
    if(next<zoom){
      // Any zoom-out recenters the image instead of retaining stale pan.
      panX=0;panY=0;
    }else if(point){
      const cx=innerWidth/2,cy=innerHeight/2;
      const factor=next/zoom;
      panX=(point.x-cx)+(panX-(point.x-cx))*factor;
      panY=(point.y-cy)+(panY-(point.y-cy))*factor;
    }
    zoom=next;paintViewer();
  }
  function updateBaseWidth(){
    if(lightbox.hidden)return;
    const ratio=lightboxImage.naturalWidth && lightboxImage.naturalHeight
      ? lightboxImage.naturalWidth/lightboxImage.naturalHeight : 1;
    // Fit the full original image inside the viewport with a 20px margin
    // on all four sides, without cropping or stretching either dimension.
    const availWidth=Math.max(40,innerWidth-40);
    const availHeight=Math.max(40,innerHeight-40);
    baseWidth=Math.min(availWidth,availHeight*ratio);
    paintViewer();
  }
  function hideLightbox(){
    if(lightbox.hidden)return;
    ++gallerySlideSession;gallerySliding=false;clearGallerySlide();
    ++lightboxOpenToken;
    galleryImages=[];galleryIndex=0;
    panPointer=null;spaceHeld=false;
    lightbox.classList.remove('is-open','is-panning','is-space-held');
    if(lightboxCloseTimer)clearTimeout(lightboxCloseTimer);
    const oldFocus=restoreFocus;restoreFocus=null;
    lightboxCloseTimer=setTimeout(()=>{
      lightbox.hidden=true;lightboxImage.removeAttribute('src');lightboxCloseTimer=null;
      if(oldFocus?.isConnected)oldFocus.focus({preventScroll:true});
    },window.matchMedia('(prefers-reduced-motion: reduce)').matches?0:240);
  }
  // v1.50.108 — Screen-space PROBLEM viewer. Keep the real source animation
  // running; mirror the live stage into a separate centered overlay. Never put
  // the enlarged viewer inside the transformed 1440x1024 DETAIL viewport.
  const problemViewer=document.createElement('div');
  problemViewer.className='orbit-problem-live-viewer';
  problemViewer.hidden=true;
  problemViewer.setAttribute('role','dialog');
  problemViewer.setAttribute('aria-modal','true');
  problemViewer.setAttribute('aria-label','PROBLEM 애니메이션 크게보기');
  problemViewer.innerHTML=`<div class="orbit-problem-live-backdrop" aria-hidden="true"></div>
    <div class="orbit-problem-live-dialog">
      <header class="orbit-problem-live-head"><strong>PROBLEM · ANIMATION</strong>
        <span class="orbit-problem-live-hint">마우스 휠 · 확대/축소 &nbsp;|&nbsp; 클릭 후 드래그 · 이동 &nbsp;|&nbsp; 바깥 클릭 · 닫기</span>
        <button type="button" class="orbit-problem-live-notes-toggle" aria-expanded="true" aria-controls="orbit-problem-live-notes">설명 숨기기</button>
      </header>
      <div class="orbit-problem-live-content">
        <div class="orbit-problem-live-stage" aria-label="재생 중인 애니메이션">
          <div class="orbit-problem-live-host"></div>
          <span class="orbit-problem-live-bugs-badge" aria-hidden="true" hidden>02</span>
          <div class="orbit-problem-live-caption-overlay" aria-live="off"></div>
        </div>
        <aside class="orbit-problem-live-notes" id="orbit-problem-live-notes" aria-label="PROBLEM 설명"></aside>
      </div>
    </div>
    <div class="orbit-lightbox-tools orbit-viewer-close-tools">
      <button type="button" class="orbit-lightbox-close orbit-problem-live-close" aria-label="애니메이션 확대 닫기">×</button>
    </div>`;
  document.body.appendChild(problemViewer);
  const liveBackdrop=problemViewer.querySelector('.orbit-problem-live-backdrop');
  const liveDialog=problemViewer.querySelector('.orbit-problem-live-dialog');
  const liveHost=problemViewer.querySelector('.orbit-problem-live-host');
  const liveStage=problemViewer.querySelector('.orbit-problem-live-stage');
  const liveCaption=problemViewer.querySelector('.orbit-problem-live-caption-overlay');
  const liveBugBadge=problemViewer.querySelector('.orbit-problem-live-bugs-badge');
  const liveNotes=problemViewer.querySelector('.orbit-problem-live-notes');
  const liveNotesToggle=problemViewer.querySelector('.orbit-problem-live-notes-toggle');
  const liveClose=problemViewer.querySelector('.orbit-problem-live-close');
  let liveObserver=null,liveSource=null,liveCopy=null,liveRestoreFocus=null;
  let liveFrame=null,liveFitScale=1,liveZoom=1,liveFrameWidth=0,liveFrameHeight=0;
  let livePanX=0,livePanY=0,liveDragPointer=null,liveDidDrag=false;
  let liveRAF=0,liveCloseTimer=0,liveToken=0,liveScrollRestore=null;
  const liveReduced=()=>window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function keepBackgroundLocked(){
    if(liveScrollRestore)return;
    liveScrollRestore={html:document.documentElement.style.overflow,body:document.body.style.overflow};
    document.documentElement.style.overflow='hidden';
    document.body.style.overflow='hidden';
  }
  function unlockBackground(){
    if(!liveScrollRestore)return;
    document.documentElement.style.overflow=liveScrollRestore.html;
    document.body.style.overflow=liveScrollRestore.body;
    liveScrollRestore=null;
  }
  function liveCaptionText(){
    if(!liveSource)return '';
    // Existing captions are read from the ORIGINAL animated film, so the HUD
    // keeps its own pixel size even while the enlarged film is zoomed.
    const choices=[...liveSource.querySelectorAll('.orbit-problem-film-caption span,.orbit-naver-film-caption span')];
    let chosen='',opacity=0;
    for(const span of choices){
      const style=getComputedStyle(span);
      if(style.display==='none' || style.visibility==='hidden')continue;
      const visible=Number(style.opacity)||0;
      if(visible>opacity && visible>.10){opacity=visible;chosen=span.textContent.trim();}
    }
    if(chosen)return chosen;
    if(current==='gta'){
      let best=null,bestOpacity=0;
      for(const scene of liveSource.querySelectorAll('.orbit-gta-planning-scene')){
        const value=Number(getComputedStyle(scene).opacity)||0;
        if(value>bestOpacity){bestOpacity=value;best=scene;}
      }
      return best?.querySelector('.orbit-gta-planning-copy')?.textContent?.replace(/\s+/g,' ').trim()||'';
    }
    // Some transitions have zero-opacity captions between scenes. Keep the
    // fixed-size HUD populated from the original project's ISSUE copy.
    const issues=ITEMS.get(current)?.issues||[];
    const stage=current==='bugs'?liveSource.dataset.bugsStage
      :current==='aladin'?liveSource.dataset.aladinStage
      :current==='hwalok'?liveSource.dataset.caveStage:'';
    let index=0;
    if(current==='bugs'){
      if(['playlist-in','zoom','unzoom','playlist-out'].includes(stage))index=1;
      else if(stage==='controls')index=2;
    }else if(current==='aladin'){
      if(/2/.test(stage))index=1;
      if(/3/.test(stage))index=2;
    }else if(current==='hwalok'){
      if(stage==='focus2')index=1;
      else if(/slide3|focus3|return1/.test(stage))index=2;
    }else if(current==='naver'){
      const scenes=[...liveSource.querySelectorAll('.orbit-naver-film-scene')];
      let mostVisible=-1;
      scenes.forEach((scene,i)=>{
        const opacity=Number(getComputedStyle(scene).opacity)||0;
        if(opacity>mostVisible){mostVisible=opacity;index=i;}
      });
    }
    return issues[index] ? `0${index+1} · ${issues[index].title}` : '';
  }
  function syncLiveContents(){
    if(!liveSource?.isConnected || !liveCopy)return;
    const sourceNodes=[liveSource,...liveSource.querySelectorAll('*')];
    const copyNodes=[liveCopy,...liveCopy.querySelectorAll('*')];
    if(sourceNodes.length!==copyNodes.length)return;
    for(let i=0;i<sourceNodes.length;i++){
      const original=sourceNodes[i],target=copyNodes[i];
      if(typeof original.className==='string' && target.className!==original.className)target.className=original.className;
      if(original.getAttribute('style')!==target.getAttribute('style')){
        const value=original.getAttribute('style');
        if(value===null)target.removeAttribute('style');else target.setAttribute('style',value);
      }
      for(const attr of original.attributes){
        if(attr.name.startsWith('data-') && target.getAttribute(attr.name)!==attr.value)target.setAttribute(attr.name,attr.value);
      }
    }
  }
  // Pan the outer film as one layer (not the phone playlist or subtitle HUD).
  // Match the RESULT image viewer's 100px over-edge safety margin.
  function constrainLivePan(){
    if(liveZoom<=1.0001){livePanX=livePanY=0;return;}
    const width=liveStage.clientWidth||innerWidth;
    const height=liveStage.clientHeight||innerHeight;
    const shownWidth=liveFrameWidth*liveFitScale*liveZoom;
    const shownHeight=liveFrameHeight*liveFitScale*liveZoom;
    // Even a portrait phone narrower than the viewport can be repositioned
    // by up to 100px when zoomed; do not force horizontal movement to zero.
    const limitX=Math.max(100,(shownWidth-width)/2+100);
    const limitY=Math.max(100,(shownHeight-height)/2+100);
    livePanX=clamp(livePanX,-limitX,limitX);
    livePanY=clamp(livePanY,-limitY,limitY);
  }
  function paintProblemFilm(){
    if(!liveFrame)return;
    constrainLivePan();
    liveFrame.style.transform=`translate3d(-50%,-50%,0) translate3d(${livePanX.toFixed(2)}px,${livePanY.toFixed(2)}px,0) scale(${(liveFitScale*liveZoom).toFixed(5)})`;
    positionLiveBugsBadge();
  }
  // The 02 disc is a screen-space foreground annotation. It follows the
  // phone's location while remaining the same size during image zoom/pan.
  function positionLiveBugsBadge(){
    if(problemViewer.hidden||current!=='bugs'||!liveCopy||!liveFrame){liveBugBadge.hidden=true;return;}
    const stage=liveSource?.dataset.bugsStage;
    if(!['playlist-in','zoom','unzoom','playlist-out'].includes(stage)){
      liveBugBadge.hidden=true;return;
    }
    const anchor=liveCopy.querySelector('.orbit-bugs-badge--2');
    if(!anchor){liveBugBadge.hidden=true;return;}
    const a=anchor.getBoundingClientRect(),b=liveStage.getBoundingClientRect();
    if(!a.width||!b.width){liveBugBadge.hidden=true;return;}
    const size=Math.min(50,Math.max(26.6667,26.6667*liveFitScale));
    liveBugBadge.style.left=(a.left+a.width/2-b.left)+'px';
    liveBugBadge.style.top=(a.top+a.height/2-b.top)+'px';
    liveBugBadge.style.width=size+'px';liveBugBadge.style.height=size+'px';
    const typeFactor=Number(getComputedStyle(problemViewer).getPropertyValue('--orbit-type-adjust'))||1;
    liveBugBadge.style.fontSize=(size*.425*typeFactor)+'px';
    liveBugBadge.hidden=false;
  }
  function sizeProblemFilm(){
    if(problemViewer.hidden || !liveFrame || !liveFrameWidth || !liveFrameHeight)return;
    const r=liveStage.getBoundingClientRect();
    liveFitScale=Math.min((r.width-48)/liveFrameWidth,(r.height-108)/liveFrameHeight,2.9);
    liveFitScale=Math.max(.18,liveFitScale);
    paintProblemFilm();
  }
  function renderLiveHUD(){
    if(problemViewer.hidden || !liveSource)return;
    if(!liveSource.isConnected){closeProblemViewer(true);return;}
    const caption=liveCaptionText();
    if(liveCaption.textContent!==caption)liveCaption.textContent=caption;
    liveCaption.classList.toggle('has-caption',Boolean(caption));
    positionLiveBugsBadge();
    liveRAF=requestAnimationFrame(renderLiveHUD);
  }
  function closeProblemViewer(immediate=false){
    if(problemViewer.hidden)return;
    const token=++liveToken;
    problemViewer.classList.remove('is-open');
    if(liveRAF){cancelAnimationFrame(liveRAF);liveRAF=0;}
    if(liveObserver){liveObserver.disconnect();liveObserver=null;}
    liveSource=null;liveCopy=null;liveFrame=null;
    if(liveDragPointer){
      try{if(liveStage.hasPointerCapture(liveDragPointer.id))liveStage.releasePointerCapture(liveDragPointer.id);}catch(_err){}
    }
    liveDragPointer=null;liveDidDrag=false;problemViewer.classList.remove('is-panning');
    liveBugBadge.hidden=true;
    unlockBackground();
    if(liveCloseTimer)clearTimeout(liveCloseTimer);
    const focus=liveRestoreFocus;liveRestoreFocus=null;
    liveCloseTimer=setTimeout(()=>{
      if(token!==liveToken)return;
      problemViewer.hidden=true;liveHost.replaceChildren();liveCaption.textContent='';
      document.documentElement.classList.remove('orbit-problem-native-cursor');
      liveCloseTimer=0;
      if(focus?.isConnected)focus.focus({preventScroll:true});
    },immediate||liveReduced()?0:300);
  }
  function openProblemViewer(source){
    if(!source || !current || !problemViewer.hidden || !lightbox.hidden)return;
    if(liveCloseTimer){clearTimeout(liveCloseTimer);liveCloseTimer=0;}
    ++liveToken;
    liveSource=source;
    liveRestoreFocus=document.activeElement;
    problemViewer.dataset.project=current;
    liveZoom=1;livePanX=livePanY=0;liveDragPointer=null;liveDidDrag=false;
    liveBugBadge.hidden=true;
    // Preserve the source's unscaled drawing dimensions, not its coordinates
    // inside the moving / scaled DETAIL viewport.
    liveFrameWidth=Math.max(1,source.offsetWidth);
    liveFrameHeight=Math.max(1,source.offsetHeight);
    const holder=document.createElement('div');
    holder.className='orbit-project-detail is-visible orbit-problem-live-context';
    holder.dataset.project=current;
    const section=document.createElement('section');
    section.className='orbit-detail-section is-current';section.dataset.section='problem';
    const split=document.createElement('div');split.className='orbit-detail-split';
    const media=document.createElement('div');media.className='orbit-detail-media orbit-detail-media--problem';
    liveCopy=source.cloneNode(true);
    media.append(liveCopy);split.append(media);section.append(split);holder.append(section);
    liveFrame=document.createElement('div');liveFrame.className='orbit-problem-live-film-frame';
    liveFrame.style.width=liveFrameWidth+'px';liveFrame.style.height=liveFrameHeight+'px';
    liveFrame.append(holder);liveHost.replaceChildren(liveFrame);
    const data=ITEMS.get(current);
    // v1.50.121: The toggle belongs to the top dialog header, never inside
    // the sliding right-hand card. Do not reparent the toggle during open.
    liveNotes.innerHTML=`<div class="orbit-problem-live-notes-heading">${current==='gta'?'PLANNING':'PROBLEM'} · DETAILS</div>
      ${(data?.issues||[]).map((item,i)=>`<article><small>${current==='gta'?['TARGET','BENEFIT','GOAL'][i]:'ISSUE '+String(i+1).padStart(2,'0')}</small><h3>${escape(item.title)}</h3><p>${escape(item.body)}</p></article>`).join('')}
      <div class="orbit-problem-live-notes-insight"><strong>${current==='gta'?'PLANNING INSIGHT':'KEY INSIGHT'}</strong><p>${escape(data?.keyInsight||'')}</p></div>`;
    problemViewer.classList.remove('is-notes-hidden','is-open');
    liveNotesToggle.textContent='설명 숨기기';liveNotesToggle.setAttribute('aria-expanded','true');
    liveNotes.hidden=false;
    liveNotes.inert=false;
    liveNotes.setAttribute('aria-hidden','false');
    problemViewer.hidden=false;
    // The global custom cursor hides the native pointer with !important.
    // Temporarily restore the system pointer inside this full-screen viewer.
    document.documentElement.classList.add('orbit-problem-native-cursor');
    keepBackgroundLocked();
    // Cancel any residual DETAIL position tween. The background must remain
    // frozen from the first enlarged frame until the viewer is dismissed.
    if(scrollFrame){cancelAnimationFrame(scrollFrame);scrollFrame=0;}
    targetPosition=position;navTween=null;navLock=null;
    syncLiveContents();
    // Match the CSS-only animation playhead immediately; JavaScript storyboard
    // changes continue to be mirrored by the MutationObserver below.
    const originalAnimations=source.getAnimations({subtree:true});
    const copiedAnimations=liveCopy.getAnimations({subtree:true});
    originalAnimations.forEach((animation,index)=>{
      const target=copiedAnimations[index];
      if(!target || animation.currentTime==null)return;
      try{target.currentTime=animation.currentTime;}catch(_err){}
    });
    liveObserver=new MutationObserver(syncLiveContents);
    liveObserver.observe(source,{subtree:true,attributes:true,attributeFilter:['class','style','data-bugs-stage','data-aladin-stage','data-cave-stage','aria-hidden']});
    sizeProblemFilm();
    liveRAF=requestAnimationFrame(renderLiveHUD);
    requestAnimationFrame(()=>{
      if(problemViewer.hidden)return;
      sizeProblemFilm();
      requestAnimationFrame(()=>{if(!problemViewer.hidden)problemViewer.classList.add('is-open');});
    });
    liveClose.focus({preventScroll:true});
  }
  liveClose.addEventListener('click',()=>closeProblemViewer());
  liveBackdrop.addEventListener('click',()=>closeProblemViewer());
  liveStage.addEventListener('click',event=>{
    // The entire animation CARD is a safe interactive region, even where no
    // phone mockup is painted. Only the full-screen BLACK backdrop closes it.
    // Pointer capture also synthesizes a click after dragging: consume it.
    if(liveDidDrag){liveDidDrag=false;event.preventDefault();}
    event.stopPropagation();
  });
  // Windows Photos-style primary-button drag after zoom. The underlying film
  // keeps playing; pointer movement only translates the enlarged film layer.
  liveStage.addEventListener('pointerdown',event=>{
    if(problemViewer.hidden||event.button!==0||liveZoom<=1.0001)return;
    liveDragPointer={id:event.pointerId,startX:event.clientX,startY:event.clientY,
      originX:livePanX,originY:livePanY};
    liveDidDrag=false;problemViewer.classList.add('is-panning');
    try{liveStage.setPointerCapture(event.pointerId);}catch(_err){}
    event.preventDefault();
  });
  liveStage.addEventListener('pointermove',event=>{
    if(!liveDragPointer||liveDragPointer.id!==event.pointerId)return;
    const dx=event.clientX-liveDragPointer.startX;
    const dy=event.clientY-liveDragPointer.startY;
    if(Math.hypot(dx,dy)>4)liveDidDrag=true;
    livePanX=liveDragPointer.originX+dx;
    livePanY=liveDragPointer.originY+dy;
    paintProblemFilm();event.preventDefault();
  });
  function stopLivePan(event){
    if(!liveDragPointer||(event&&event.pointerId!==liveDragPointer.id))return;
    const id=liveDragPointer.id;liveDragPointer=null;
    problemViewer.classList.remove('is-panning');
    try{if(liveStage.hasPointerCapture(id))liveStage.releasePointerCapture(id);}catch(_err){}
  }
  liveStage.addEventListener('pointerup',stopLivePan);
  liveStage.addEventListener('pointercancel',stopLivePan);
  liveStage.addEventListener('lostpointercapture',stopLivePan);
  problemViewer.addEventListener('click',event=>{
    // Do not treat the dialog/header/animation card as backdrop: a click
    // inside the enlarged viewer must never skip a UI depth level.
    if(event.target===problemViewer)closeProblemViewer();
  });
  // v1.50.121: Keep the film's grid cell fixed while the details card slides.
  // Re-measuring on each animation frame used to shrink the phone/film, and
  // collapsing the second grid track caused its height to change abruptly.
  liveNotesToggle.addEventListener('click',()=>{
    const hidden=problemViewer.classList.toggle('is-notes-hidden');
    liveNotesToggle.setAttribute('aria-expanded',String(!hidden));
    liveNotesToggle.textContent=hidden?'설명 보기':'설명 숨기기';
    liveNotes.setAttribute('aria-hidden',String(hidden));
    liveNotes.inert=hidden;
  });
  window.addEventListener('resize',sizeProblemFilm);
  // Intercept at window capture BEFORE the existing project/camera handlers.
  window.addEventListener('wheel',event=>{
    if(problemViewer.hidden)return;
    if(event.target.closest?.('.orbit-problem-live-notes')){
      event.stopImmediatePropagation();return; // Notes may scroll independently.
    }
    event.preventDefault();event.stopImmediatePropagation();
    if(event.target.closest?.('.orbit-problem-live-stage')){
      liveZoom=clamp(liveZoom*Math.exp(-event.deltaY*.0012),1,2.6);
      paintProblemFilm(); // The HUD and right pane never scale.
    }
  },{capture:true,passive:false});
  window.addEventListener('touchmove',event=>{
    if(problemViewer.hidden || event.target.closest?.('.orbit-problem-live-notes'))return;
    event.preventDefault();event.stopImmediatePropagation();
  },{capture:true,passive:false});
  window.addEventListener('keydown',event=>{
    if(problemViewer.hidden)return;
    if(event.key==='Escape')closeProblemViewer();
    if(['Escape','ArrowDown','ArrowUp','PageDown','PageUp','Home','End',' '].includes(event.key)){
      event.preventDefault();event.stopImmediatePropagation();
    }
  },true);
  const animatedFilmSelector='.orbit-bugs-problem-animated,.orbit-naver-problem-film,.orbit-aladin-problem-film,.orbit-cave-problem-film,.orbit-gta-planning-film';
  scroll.addEventListener('click',event=>{
    if(!current || !problemViewer.hidden || !lightbox.hidden)return;
    const film=event.target.closest(animatedFilmSelector);
    if(!film || !film.closest('.orbit-detail-section[data-section="problem"]'))return;
    event.preventDefault();openProblemViewer(film);
  });
  // Phone frames have nested pointer-events:none elements: accept the slot.
  scroll.addEventListener('click',event=>{
    if(!current || !problemViewer.hidden || !lightbox.hidden || !['bugs','aladin'].includes(current))return;
    const slot=event.target.closest('.orbit-bugs-problem-host,.orbit-aladin-problem-film,.orbit-detail-section[data-section="problem"] .orbit-detail-media--problem');
    if(!slot || !slot.closest('.orbit-detail-section[data-section="problem"]'))return;
    const film=slot.matches(animatedFilmSelector)?slot:slot.querySelector(animatedFilmSelector);
    if(film){event.preventDefault();openProblemViewer(film);}
  });
  // Each collection is local to the clicked detail section: RESULT cards only
  // travel to other RESULT cards, benchmarks only to their two references.
  function getViewerGallery(img){
    const benchmark=img.closest('.orbit-naver-insight-reference');
    if(benchmark)return [...benchmark.querySelectorAll('.orbit-detail-image-button img')];
    const section=img.closest('.orbit-detail-section');
    if(!section)return [img];
    if(section.dataset.section==='final'){
      return [...section.querySelectorAll('.orbit-detail-image-button img')];
    }
    if(section.dataset.section==='insight'){
      return [...section.querySelectorAll('img.orbit-insight-zoomable')];
    }
    return [img];
  }
  function syncGalleryArrows(){
    const hasMultiple=galleryImages.length>1;
    previousImage.hidden=nextImage.hidden=!hasMultiple;
    if(hasMultiple){
      previousImage.setAttribute('aria-label',`이전 이미지 (${galleryIndex+1}/${galleryImages.length})`);
      nextImage.setAttribute('aria-label',`다음 이미지 (${galleryIndex+1}/${galleryImages.length})`);
    }
  }
  // v1.50.124 — INSIGHT (including its benchmark sub-galleries) and RESULT
  // use a horizontal, direction-aware slide. Decode the incoming image before
  // moving the viewport; retain existing zoom/pan until the slide ends.
  function clearGallerySlide(){
    lightboxSurface.querySelectorAll('.orbit-lightbox-slide-frame').forEach(node=>node.remove());
    // Never leave an opacity:0 or disabled transition on the reusable image.
    lightboxImage.style.opacity='';
    lightboxImage.style.transition='';
  }
  function loadGalleryImage(img,onReady=null){
    const token=++lightboxOpenToken;
    const handoff=typeof onReady==='function';
    zoom=1;panX=panY=0;panPointer=null;
    lightbox.classList.remove('is-panning');
    lightboxImage.alt=img.alt||'이미지 상세보기';
    let handled=false;
    const ready=()=>{
      if(handled || token!==lightboxOpenToken)return;
      handled=true;
      // v1.50.125: keep the animated incoming frame in place until the live
      // image is fully opaque and has painted. Previous code cleared the frame
      // as the live image began a 350ms fade, causing a visible blink.
      if(handoff)lightboxImage.style.transition='none';
      updateBaseWidth();
      lightboxImage.style.opacity=handoff?'1':'';
      if(handoff){
        requestAnimationFrame(()=>requestAnimationFrame(()=>{
          if(token!==lightboxOpenToken || lightbox.hidden)return;
          onReady();
        }));
      }
    };
    lightboxImage.style.opacity='0';
    lightboxImage.onload=ready;
    lightboxImage.onerror=ready;
    lightboxImage.src=img.currentSrc||img.src;
    if(lightboxImage.complete && lightboxImage.naturalWidth)ready();
    paintViewer();syncGalleryArrows();
  }
  async function slideGalleryImage(direction,nextIndex){
    if(gallerySliding)return;
    gallerySliding=true;
    const session=++gallerySlideSession;
    const nextSource=galleryImages[nextIndex];
    const nextUrl=nextSource.currentSrc||nextSource.src;
    const incoming=new Image();
    incoming.alt=nextSource.alt||'이미지 상세보기';
    incoming.draggable=false;
    incoming.src=nextUrl;
    try{
      await incoming.decode();
    }catch(_err){
      if(session===gallerySlideSession && !lightbox.hidden){
        galleryIndex=nextIndex;loadGalleryImage(nextSource);
      }
      if(session===gallerySlideSession)gallerySliding=false;
      return;
    }
    if(session!==gallerySlideSession || lightbox.hidden)return;
    if(window.matchMedia('(prefers-reduced-motion: reduce)').matches){
      galleryIndex=nextIndex;loadGalleryImage(nextSource);gallerySliding=false;
      return;
    }
    const makeFrame=(img,entering)=>{
      const frame=document.createElement('div');
      frame.className='orbit-lightbox-slide-frame';
      const picture=img;
      picture.className='orbit-lightbox-slide-image';
      picture.draggable=false;
      if(entering){
        const ratio=incoming.naturalWidth/incoming.naturalHeight||1;
        picture.style.width=Math.min(Math.max(40,innerWidth-40),Math.max(40,innerHeight-40)*ratio)+'px';
      }else{
        picture.style.width=baseWidth+'px';
        picture.style.transform=`translate3d(${panX}px,${panY}px,0) scale(${zoom})`;
      }
      frame.append(picture);lightboxSurface.append(frame);
      return frame;
    };
    const outgoing=makeFrame(lightboxImage.cloneNode(false),false);
    const entering=makeFrame(incoming,true);
    const start=direction>0?100:-100;
    // A viewport-wide gallery track gives consistent motion for any image ratio.
    entering.style.transform=`translate3d(${start}%,0,0)`;
    // The live image underneath the moving frames must disappear instantly.
    // Its old 350ms opacity transition left a second, fading ghost behind
    // the outgoing frame. The animated frames own ALL visual movement.
    lightboxImage.style.transition='none';
    lightboxImage.style.opacity='0';
    const opts={duration:460,easing:'cubic-bezier(.22,.72,.2,1)',fill:'forwards'};
    const outMotion=outgoing.animate([
      {transform:'translate3d(0,0,0)'},
      {transform:`translate3d(${-start}%,0,0)`}
    ],opts);
    const inMotion=entering.animate([
      {transform:`translate3d(${start}%,0,0)`},
      {transform:'translate3d(0,0,0)'}
    ],opts);
    try{await Promise.all([outMotion.finished,inMotion.finished]);}catch(_err){}
    if(session!==gallerySlideSession || lightbox.hidden)return;
    galleryIndex=nextIndex;
    // Keep the incoming frame in place until the live img has switched;
    // this avoids a blank frame even on slower devices or large assets.
    loadGalleryImage(nextSource,()=>{
      if(session!==gallerySlideSession)return;
      clearGallerySlide();gallerySliding=false;
    });
  }
  function changeGalleryImage(direction){
    if(lightbox.hidden || galleryImages.length<2 || gallerySliding)return;
    const target=(galleryIndex+direction+galleryImages.length)%galleryImages.length;
    if(gallerySection==='final' || gallerySection==='insight')slideGalleryImage(direction,target);
    else{galleryIndex=target;loadGalleryImage(galleryImages[galleryIndex]);}
  }
  previousImage.addEventListener('click',()=>changeGalleryImage(-1));
  nextImage.addEventListener('click',()=>changeGalleryImage(1));
  function showLightbox(img,trigger){
    if(lightboxCloseTimer){clearTimeout(lightboxCloseTimer);lightboxCloseTimer=null;}
    restoreFocus=trigger;
    galleryImages=getViewerGallery(img).filter(candidate=>candidate.getAttribute('src'));
    if(!galleryImages.length)galleryImages=[img];
    galleryIndex=Math.max(0,galleryImages.indexOf(img));
    gallerySection=img.closest('.orbit-detail-section')?.dataset.section||'';
    ++gallerySlideSession;gallerySliding=false;clearGallerySlide();
    spaceHeld=false;panPointer=null;
    lightbox.hidden=false;lightbox.classList.remove('is-open','is-panning','is-space-held');
    loadGalleryImage(img);
    requestAnimationFrame(()=>requestAnimationFrame(()=>{
      if(!lightbox.hidden)lightbox.classList.add('is-open');
    }));
    lightboxClose.focus({preventScroll:true});
  }
  scroll.addEventListener('click',event=>{
    if(!current)return;
    const trigger=event.target.closest('.orbit-detail-image-button');
    if(trigger){
      const img=trigger.querySelector('img');if(img)showLightbox(img,trigger);
      return;
    }
    const img=event.target.closest('img.orbit-insight-zoomable');
    if(img)showLightbox(img,img);
  });
  scroll.addEventListener('keydown',event=>{
    if(!current || (event.key!=='Enter' && event.key!==' '))return;
    const img=event.target.closest('img.orbit-insight-zoomable');
    if(!img)return;
    event.preventDefault();showLightbox(img,img);
  });
  lightboxClose.addEventListener('click',hideLightbox);
  // A click within a top-level viewer is NEVER a request to close the parent
  // project. Even if the viewer is in its closing transition, keep it in this
  // layer of the UI event stack (the full-screen background is still clickable).
  lightbox.addEventListener('click',event=>event.stopPropagation());
  problemViewer.addEventListener('click',event=>event.stopPropagation());
  // The full-screen surface sits above the dark overlay. Close only when
  // clicking outside the *displayed image*, never for a drag or toolbar click.
  let surfacePress=null;
  lightboxSurface.addEventListener('pointerdown',event=>{
    surfacePress=event.button===0?{id:event.pointerId,x:event.clientX,y:event.clientY}:null;
  });
  lightboxSurface.addEventListener('pointerup',event=>{
    if(!surfacePress || surfacePress.id!==event.pointerId)return;
    const distance=Math.hypot(event.clientX-surfacePress.x,event.clientY-surfacePress.y);
    surfacePress=null;
    if(distance>6 || spaceHeld || panPointer)return;
    const bounds=lightboxImage.getBoundingClientRect();
    const onImage=event.clientX>=bounds.left && event.clientX<=bounds.right &&
      event.clientY>=bounds.top && event.clientY<=bounds.bottom;
    if(!onImage)hideLightbox();
  });
  lightboxSurface.addEventListener('pointercancel',()=>{surfacePress=null;});
  lightboxSlider.addEventListener('input',()=>setZoom(Number(lightboxSlider.value)/100));
  zoomOut.addEventListener('click',()=>setZoom(zoom-.25));
  zoomIn.addEventListener('click',()=>setZoom(zoom+.25));
  window.addEventListener('resize',updateBaseWidth);
  lightboxSurface.addEventListener('pointerdown',event=>{
    if(!viewerBusy()||gallerySliding||event.button!==0)return;
    // Only the visible image can be grabbed; a background click still closes.
    const rect=lightboxImage.getBoundingClientRect();
    if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)return;
    panPointer={id:event.pointerId,x:event.clientX,y:event.clientY};
    lightbox.classList.add('is-panning');
    try{lightboxSurface.setPointerCapture(event.pointerId);}catch(_err){}
    event.preventDefault();
  });
  lightboxSurface.addEventListener('pointermove',event=>{
    if(!panPointer||panPointer.id!==event.pointerId)return;
    panX+=event.clientX-panPointer.x;panY+=event.clientY-panPointer.y;
    panPointer.x=event.clientX;panPointer.y=event.clientY;
    paintViewer();event.preventDefault();
  });
  function stopPan(event){
    if(!panPointer || (event && event.pointerId!==panPointer.id))return;
    const id=panPointer.id;panPointer=null;
    lightbox.classList.remove('is-panning');
    try{if(lightboxSurface.hasPointerCapture(id))lightboxSurface.releasePointerCapture(id);}catch(_err){}
  }
  lightboxSurface.addEventListener('pointerup',stopPan);
  lightboxSurface.addEventListener('pointercancel',stopPan);
  lightboxSurface.addEventListener('lostpointercapture',stopPan);
  window.addEventListener('wheel',event=>{
    if(!viewerBusy())return;
    event.preventDefault();event.stopImmediatePropagation();
    if(gallerySliding)return;
    const multiplier=event.deltaMode===1?16:event.deltaMode===2?innerHeight:1;
    // Windows Photos-like controls: wheel zooms without Ctrl;
    // panning happens ONLY through a held primary-button drag.
    setZoom(zoom*Math.exp(-event.deltaY*multiplier*.0015),{x:event.clientX,y:event.clientY});
    // While the viewer is open, wheel never scrolls the DETAIL/camera.
  },{capture:true,passive:false});
  // Space is exclusively a grab modifier while the viewer is open.
  document.addEventListener('keydown',event=>{
    if(!viewerBusy())return;
    if(event.key==='Escape'){
      event.preventDefault();event.stopImmediatePropagation();hideLightbox();return;
    }
    if(event.key==='ArrowLeft' || event.key==='ArrowRight'){
      event.preventDefault();event.stopImmediatePropagation();
      changeGalleryImage(event.key==='ArrowLeft'?-1:1);return;
    }
    if(event.code==='Space'){
      event.preventDefault();event.stopImmediatePropagation();
      spaceHeld=true;lightbox.classList.add('is-space-held');return;
    }
    if(event.key==='Tab'){
      const controls=[lightboxClose,zoomOut,lightboxSlider,zoomIn,...(galleryImages.length>1?[previousImage,nextImage]:[])];
      const index=controls.indexOf(document.activeElement);
      event.preventDefault();
      controls[(index+(event.shiftKey?-1:1)+controls.length)%controls.length].focus();
    }
  },true);
  document.addEventListener('keyup',event=>{
    if(event.code==='Space' && viewerBusy()){
      spaceHeld=false;stopPan();lightbox.classList.remove('is-space-held');
      event.preventDefault();event.stopImmediatePropagation();
    }
  },true);
  window.addEventListener('blur',()=>{
    spaceHeld=false;stopPan();lightbox.classList.remove('is-space-held');
  });

  // v1.50.14 — one masked backdrop, not six unfiltered rectangular strips.
  // The 3D scene/camera, project labels and real logo remain untouched.
  const detailDimmer=document.createElement('div');
  detailDimmer.className='orbit-detail-background-dimmer';
  detailDimmer.setAttribute('aria-hidden','true');
  // v1.50.15: the Three.js #gl canvas is fixed under body, not under
  // #stage. The blur must therefore share #gl's viewport coordinates.
  document.body.appendChild(detailDimmer);
  const outerDimmer=document.createElement('div');
  outerDimmer.className='orbit-detail-outer-dimmer';
  outerDimmer.setAttribute('aria-hidden','true');
  outerDimmer.innerHTML=['left','right','top','bottom']
    .map(part=>`<span class="orbit-detail-outer-${part}"></span>`).join('');
  document.body.appendChild(outerDimmer);
  let detailDimmerRAF=0;
  function positionDetailDimmer(){
    const stageBox=stage.getBoundingClientRect();
    if(!stageBox.width || !stageBox.height)return;
    // Screen-space overlay: no rectangular stage/letterbox boundary.
    const key=root.dataset.project;
    const planet=key ? explore.querySelector(`.orbit-planet[data-project="${key}"]`) : null;
    if(!planet || planet.style.display==='none')return;
    const globe=planet.getBoundingClientRect();
    const cx=(globe.left+globe.right)/2,cy=(globe.top+globe.bottom)/2;
    // The clickable planet circle is already centered at the projected GLB.
    // Its CSS *width* is its projected globe RADIUS in explore.js, NOT
    // the diameter. Old padding 75 stage px made an unnecessarily huge hole.
    const radius=Math.max(globe.width,globe.height);
    const protectR=Math.min(240,Math.max(72,radius+27));
    const set=(name,value)=>detailDimmer.style.setProperty('--orbit-focus-'+name,`${value.toFixed(1)}px`);
    set('planet-x',cx);set('planet-y',cy);
    set('planet-rx',protectR);set('planet-ry',protectR);
    // The selected DOM label is already painted above this body-level
    // blur layer. Do NOT cut out the background behind its text.
    // Original 3D logo is drawn on the same WebGL canvas as the globe.
    // Its docked location is (256,70) in the approved 1440x1024 stage.
    const scale=stageBox.width/1440;
    set('logo-x',stageBox.left+256*scale);
    set('logo-y',stageBox.top+70*scale);
    set('logo-rx',91*scale);
    set('logo-ry',75*scale);
  }
  function updateDetailDimmer(){
    detailDimmerRAF=0;
    if(!stage.classList.contains('has-orbit-detail'))return;
    positionDetailDimmer();
    detailDimmerRAF=requestAnimationFrame(updateDetailDimmer);
  }
  function toggleDetailDimmer(show){
    if(detailDimmerRAF){cancelAnimationFrame(detailDimmerRAF);detailDimmerRAF=0;}
    detailDimmer.classList.toggle('is-visible',show);
    // Old 4-strip letterbox dimmer is deliberately disabled; one body layer
    // now handles the complete viewport and keeps its fade transitions.
    if(show){positionDetailDimmer();detailDimmerRAF=requestAnimationFrame(updateDetailDimmer);}
  }

  function setVisible(show){
    root.classList.toggle('is-visible',show);
    syncSevenLogoAuto();
    root.setAttribute('aria-hidden',String(!show));
    explore.classList.toggle('has-project-detail',show);
    explore.querySelectorAll('.orbit-planet').forEach(el=>
      el.classList.toggle('is-selected-detail',show&&el.dataset.project===root.dataset.project));
    stage.classList.toggle('has-orbit-detail',show);
    toggleDetailDimmer(show);
    if(!show){scroll.querySelectorAll('.orbit-naver-problem-film,.orbit-aladin-problem-film').forEach(film=>film.classList.remove('is-playing'));}
    else if(active===1){scroll.querySelector(current==='naver'?'.orbit-naver-problem-film':'.orbit-aladin-problem-film')?.classList.add('is-playing');}
  }
  function focusComplete(e) {
    const key=e.detail?.project;
    if(!key||key!==pending || !ITEMS.has(key))return;
    current=key;
    stopChapterClearances();
    render(ITEMS.get(key));
    if(closeTimeout){clearTimeout(closeTimeout);closeTimeout=null;}
    root.hidden=false;
    syncChapterClearances();
    watchChapterClearances();
    if(document.fonts?.ready){
      document.fonts.ready.then(()=>{if(current===key)queueChapterClearances();});
    }
    const token=++openingToken;
    requestAnimationFrame(()=>{if(token!==openingToken)return;setVisible(true);
      requestAnimationFrame(queueBugsEvidenceAlignment);
    });
    window.__CLEAR_ORBIT_STATE='PROJECT_DETAIL';
  }
  function closeDetail(){
    // v1.50.126 — SOLUTION's live prototype sits above DETAIL, just like the
    // picture/PROBLEM inspectors. A close request must dismiss only one layer.
    if(window.ClearOrbitPrototypeViewer?.isOpen()){
      window.ClearOrbitPrototypeViewer.close();return;
    }
    // Depth-safe dismissal: only close the highest open inspector first.
    // Project/camera release must not run for an inspector backdrop click.
    if(!problemViewer.hidden){closeProblemViewer();return;}
    if(!lightbox.hidden){hideLightbox();return;}
    stopChapterClearances();
    closeProblemViewer(true);
    stopSevenLogoAuto();clearCaveFoldTimers();stopCaveCurl(scroll.querySelector('.orbit-cave-leaflet-viewer'));
    if (!pending && !current)return;
    ++openingToken;
    pending=null;current=null;navLock=null;navTween=null;
    hideLightbox();
    if(scrollFrame){cancelAnimationFrame(scrollFrame);scrollFrame=0;}
    setVisible(false);
    window.ClearOrbitExplore?.releaseFocus?.();
    if(closeTimeout)clearTimeout(closeTimeout);
    closeTimeout=setTimeout(()=>{if(!current){root.hidden=true;resetPosition();}},450);
  }
  window.addEventListener('orbit:project-selected',e=>{
    if(root.classList.contains('is-visible')||pending)return;
    pending=e.detail?.project||null;
  });
  window.addEventListener('orbit:project-focus-complete',focusComplete);
  window.addEventListener('orbit:project-released',()=>{
    stopChapterClearances();
    closeProblemViewer(true);
    stopSevenLogoAuto();clearCaveFoldTimers();stopCaveCurl(scroll.querySelector('.orbit-cave-leaflet-viewer'));
    pending=null;
    if(current){current=null;hideLightbox();setVisible(false);root.hidden=true;resetPosition();}
  });
  // v1.50.44 — shared for all six projects and all five chapters.
  // Align the vertical midpoint of the chapter's *actual visible content*
  // to the focused planet's horizontal centerline when choosing a HUD chapter.
  // Do not use section min-height (large invisible chapter padding), and do
  // not reposition the planet, HUD, or existing continuous wheel exploration.
  function chapterCenterTarget(section) {
    // All other chapters keep their existing planet-center landing.  RESULT
    // alone uses the top-aligned viewport landing requested in the markup.
    if(section.dataset.section==='final')return resultLandingPosition();
    const elements=[...section.children].filter(el=>el.getClientRects().length);
    const planet=explore.querySelector(`.orbit-planet.is-selected-detail`);
    if(!elements.length || !planet)return section.offsetTop;
    const panelRect=panel.getBoundingClientRect();
    const firstRect=elements[0].getBoundingClientRect();
    const lastRect=elements[elements.length-1].getBoundingClientRect();
    const planetRect=planet.getBoundingClientRect();
    const scaled=DETAIL_PANEL_SCALE*stageScale();
    // The moving panel's top reflects the current scroll position.
    // Reconstruct its fixed, pre-scroll top in screen pixels.
    const baseTop=panelRect.top+position*scaled;
    const contentMidLocal=((firstRect.top+lastRect.bottom)/2-panelRect.top)/scaled;
    const planetMidScreen=(planetRect.top+planetRect.bottom)/2;
    return contentMidLocal-(planetMidScreen-baseTop)/scaled;
  }

  nav.addEventListener('click',e=>{
    const button=e.target.closest('[data-detail-nav]');
    if(!button||!current)return;
    const index=Number(button.dataset.detailNav);
    const section=scroll.querySelectorAll('[data-section]')[index];
    if(!section)return;
    // Consistent planet-centerline alignment for OVERVIEW through FINAL DESIGN.
    // The full panel still scrolls; only the selected chapter's landing point changes.
    requestScroll(chapterCenterTarget(section),index);
  });
  // Capture wheel BEFORE Explore's existing bubble listener, including if the
  // cursor is over the planet or fixed HUD. This prevents competing camera travel.
  window.addEventListener('wheel',e=>{
    // The enlarged LIVE prototype owns wheel input; never scroll the long DETAIL.
    if(window.ClearOrbitPrototypeViewer?.isOpen()){e.preventDefault();e.stopImmediatePropagation();return;}
    if(!problemViewer.hidden)return;
    if(!current || !root.classList.contains('is-visible') || e.ctrlKey || e.metaKey)return;
    if(!lightbox.hidden){e.preventDefault();e.stopImmediatePropagation();return;}
    // In future prototype UI, wheel input belongs to its embedded screen.
    // Stop Explore's camera listener but allow native scrolling in the UI.
    if(e.target.closest?.('.orbit-solution-prototype-screen.is-interactive')){
      e.stopImmediatePropagation();return;
    }
    e.preventDefault();e.stopImmediatePropagation();
    const multiplier=e.deltaMode===1?16:e.deltaMode===2?innerHeight:1;
    userScroll(e.deltaY*multiplier/stageScale());
  },{passive:false,capture:true});
  // Keyboard and touch move the same long panel; no native nested scrollbar.
  window.addEventListener('keydown',e=>{
    if(window.ClearOrbitPrototypeViewer?.isOpen())return;
    if(!problemViewer.hidden)return;
    if(!current || !root.classList.contains('is-visible') || e.ctrlKey || e.altKey || e.metaKey)return;
    if(!lightbox.hidden)return; // Viewer handles Space, Escape and controls at document capture.
    if(e.target.closest?.('.orbit-solution-prototype-screen.is-interactive'))return;
    const step={ArrowDown:115,ArrowUp:-115,PageDown:VIEW_HEIGHT*.8,PageUp:-VIEW_HEIGHT*.8};
    let next=null;
    if(Object.prototype.hasOwnProperty.call(step,e.key))next=targetPosition+step[e.key];
    if(e.key==='Home')next=0;
    if(e.key==='End')next=maxPosition();
    if(e.key===' ' && !e.target.closest?.('button,a,input,textarea,select'))next=targetPosition+(e.shiftKey?-1:1)*VIEW_HEIGHT*.8;
    if(next===null)return;
    e.preventDefault();e.stopImmediatePropagation();requestScroll(next);
  },{capture:true});
  panel.addEventListener('touchstart',e=>{
    if(!problemViewer.hidden){touchStartY=null;return;}
    touchStartY=e.target.closest?.('.orbit-solution-prototype-screen.is-interactive')
      ? null : e.touches.length===1?e.touches[0].clientY:null;
  },{passive:true});
  panel.addEventListener('touchmove',e=>{
    if(!problemViewer.hidden || !current || touchStartY===null || e.touches.length!==1)return;
    e.preventDefault();
    const nextY=e.touches[0].clientY;
    userScroll((touchStartY-nextY)/stageScale());touchStartY=nextY;
  },{passive:false});
  panel.addEventListener('touchend',()=>{touchStartY=null;},{passive:true});
  // v1.50.127 — precisely align BUGS INSIGHT IDC evidence image's bottom
  // with the neighboring second research image, regardless of loaded artwork,
  // Pretendard metrics, window size, or the project panel's transform scale.
  let insightAlignmentFrame=0;
  function alignBugsInsightEvidence(){
    insightAlignmentFrame=0;
    if(current!=='bugs' || !root.classList.contains('is-visible'))return;
    const chapter=scroll.querySelector('[data-section="insight"]');
    const left=chapter?.querySelector('.orbit-detail-insight-rows article:nth-child(2)>img');
    const right=chapter?.querySelector('.orbit-insight-idc-evidence img');
    const figure=chapter?.querySelector('.orbit-insight-idc-evidence');
    if(!left||!right||!figure||!left.complete||!right.complete)return;
    figure.style.translate='0px 0px';
    const difference=left.getBoundingClientRect().bottom-right.getBoundingClientRect().bottom;
    const effectiveScale=DETAIL_PANEL_SCALE*stageScale();
    if(effectiveScale>0)figure.style.translate=`0px ${(difference/effectiveScale).toFixed(2)}px`;
  }
  function queueBugsEvidenceAlignment(){
    if(insightAlignmentFrame)cancelAnimationFrame(insightAlignmentFrame);
    insightAlignmentFrame=requestAnimationFrame(alignBugsInsightEvidence);
  }
  window.addEventListener('resize',queueBugsEvidenceAlignment);
  document.addEventListener('orbit:typography-resized',queueBugsEvidenceAlignment);
  // Late-loading images can change the total panel height; keep offsets valid.
  scroll.addEventListener('load',()=>{
    if(current && (targetPosition>maxPosition() || position>maxPosition())){
      requestScroll(Math.min(position,maxPosition()));
    }
    queueBugsEvidenceAlignment();
  },true);
  close.addEventListener('click',closeDetail);
  // Click the empty left-hand sky to leave DETAIL, without stealing clicks/
  // pointer capture from the planet, logo, viewer, HUD or any other control.
  window.addEventListener('click',event=>{
    // Capture runs before descendant handlers. SOLUTION's full-screen
    // prototype uses a separate overlay plus a top-layer live popover; both
    // (including its exit animation) must be owned by the viewer, not DETAIL.
    if(window.ClearOrbitPrototypeViewer?.isOpen() ||
       event.target?.closest?.('.orbit-prototype-overlay,.orbit-prototype-screen-zoom'))return;
    // Ignore the other inspectors too, including their close animations.
    if(event.target?.closest?.('.orbit-detail-lightbox,.orbit-problem-live-viewer'))return;
    if(!problemViewer.hidden || !current || !root.classList.contains('is-visible') || !lightbox.hidden)return;
    if(event.button!==0 || event.defaultPrevented)return;
    if(event.target.closest?.('button,a,input,select,textarea,[role="button"],.orbit-detail-viewport,.orbit-detail-nav,.orbit-detail-close,.orbit-planet'))return;
    const rect=stage.getBoundingClientRect();
    if(!rect.width || !rect.height)return;
    const x=(event.clientX-rect.left)*1440/rect.width;
    const y=(event.clientY-rect.top)*1024/rect.height;
    if(x<0 || x>=515 || y<0 || y>=1024)return;
    event.preventDefault();
    closeDetail();
  },true);
  window.addEventListener('keydown',e=>{
    if(e.key==='Escape' && current && !window.__CLEAR_ORBIT_LOGO_NAV_ACTIVE){e.preventDefault();closeDetail();}
  });
  // Exposed to tests only as a read-only state; no new camera/scene or site router.
  window.ClearOrbitProjectDetail={close:closeDetail,get state(){return {pending,current,active,visible:root.classList.contains('is-visible')};}};
})();
