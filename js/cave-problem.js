/* CLEAR ORBIT / CAVE PROBLEM storyboard (v1.50.86).
   The original leaflet and its separate issue overlays are preserved.
   ISSUE labels below the film are static: only the film and its own captions animate.
   Sequence: outside -> ISSUE 01 -> ISSUE 02 -> slide to inside -> poster 1 ->
   poster 2 -> Where?? -> text fade -> simultaneous poster/filter fade/down ->
   same-direction slide back to ISSUE 01 -> infinite loop.
*/
(()=>{'use strict';
  const SPEED=.76; // Preserve v1.50.85's 0.8x overall playback setting.
  const sequence=[
    ['base1',700],
    ['focus1',2400],
    ['focus2',2600],
    ['slide3',780],
    ['focus3-pre',650],
    ['focus3-poster1',1000],
    ['focus3-poster2',1000],
    ['focus3-where',1800], // Question/Where?? stays 1.5x longer (was 1200).
    ['focus3-text-out',500], // Fade ALL film text before moving the posters.
    ['focus3-exit',650], // Both posters descend and fade as blur fades out.
    ['return1',780] // The next outside image slides in from the right.
  ];
  const getRoot=()=>document.querySelector('#orbit-project-detail');
  const getSection=()=>document.querySelector('#orbit-detail-problem')||
    document.querySelector('#orbit-project-detail [data-section="problem"]');
  let current=null,job=null,stepIndex=0,visible=false;
  function setStage(stage){
    if(!current)return;
    current.film.dataset.caveStage=stage;
  }
  function stop(reset=true){
    clearTimeout(job);job=null;visible=false;
    if(reset){stepIndex=0;setStage('base1');}
  }
  function next(){
    if(!current||!visible)return;
    const [stage,ms]=sequence[stepIndex];
    setStage(stage);
    stepIndex=(stepIndex+1)%sequence.length;
    job=setTimeout(next,ms/SPEED);
  }
  function start(){
    if(!current||visible)return;
    visible=true;
    stepIndex=0;
    setStage('base1');
    job=setTimeout(next,380/SPEED);
  }
  function mountIfNeeded(){
    const root=getRoot(),section=getSection();
    if(!root||!section||root.dataset.project!=='hwalok')return;
    const film=section.querySelector('.orbit-cave-problem-film');
    if(!film)return;
    if(current?.section===section&&current.film===film&&film.isConnected)return;
    stop();
    current={root,section,film};
  }
  function problemIsActive(){
    const root=current?.root,section=current?.section;
    if(!root||!section||!current.film.isConnected||document.hidden)return false;
    if(root.dataset.project!=='hwalok'||root.getAttribute('aria-hidden')==='true')return false;
    if(!root.classList.contains('is-visible')&&!root.classList.contains('is-open'))return false;
    if(section.classList.contains('is-current'))return true;
    const nav=root.querySelector('[data-detail-nav="1"]');
    if(nav&&(nav.classList.contains('is-active')||nav.getAttribute('aria-current')==='true'))return true;
    const r=section.getBoundingClientRect(),view=(root.querySelector('.orbit-detail-viewport')||root).getBoundingClientRect();
    const y=Math.max(0,Math.min(r.bottom,view.bottom)-Math.max(r.top,view.top));
    return y>Math.min(180,r.height*.55)&&y/Math.max(1,Math.min(r.height,view.height))>.45;
  }
  function sync(){
    mountIfNeeded();
    if(current&&(!current.film.isConnected||current.root.dataset.project!=='hwalok')){stop();current=null;return;}
    if(!current)return;
    const active=problemIsActive();
    if(active&&!visible)start(); else if(!active&&visible)stop();
  }
  document.addEventListener('visibilitychange',sync);
  setInterval(sync,220);
  window.ClearOrbitCaveProblem=Object.freeze({replay(){if(current){stop();start();}},getStage(){return current?.film.dataset.caveStage||null}});
})();
