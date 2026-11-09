/* v1.50.56 — ALADIN PROBLEM playback, borrowing BUGS!' staged, in-phone motion.
   No new camera, scroll, project selection, or navigation logic. */
(()=>{'use strict';
  const SPEED=.8; // Match BUGS! PROBLEM playback rate and stage transitions.
  const sequence=[
    ['base1',850,-1],
    ['focus1',2150,0],
    ['base2',900,-1],
    ['focus2',2150,1],
    ['base3',900,-1],
    ['focus3',2150,2],
    ['reset',1100,-1]
  ];
  let current=null, job=null, step=0, running=false;
  const getRoot=()=>document.getElementById('orbit-project-detail');
  function label(index){
    current?.section?.querySelectorAll('.orbit-detail-issues article').forEach((row,i)=>{
      row.classList.toggle('aladin-issue-active',i===index);
    });
  }
  function stage(name,index=-1){
    if(!current)return;
    current.film.dataset.aladinStage=name;
    label(index);
  }
  function stop(){
    clearTimeout(job);job=null;running=false;step=0;
    stage('base1');
  }
  function next(){
    if(!running || !current)return;
    const [name,ms,index]=sequence[step];
    stage(name,index);
    step=(step+1)%sequence.length;
    job=setTimeout(next,ms/SPEED);
  }
  function start(){
    if(running || !current)return;
    running=true;step=0;
    stage('base1');
    job=setTimeout(next,550/SPEED);
  }
  function sync(){
    const root=getRoot();
    const section=root?.querySelector('.orbit-detail-section[data-section="problem"]');
    const film=section?.querySelector('.orbit-aladin-problem-film');
    if(root?.dataset.project!=='aladin' || !section || !film){
      if(current){stop();current=null;}
      return;
    }
    if(current?.film!==film){
      if(current)stop();
      current={root,section,film};
      film.dataset.aladinStage='base1';
    }
    // The DETAIL component already owns which section is active and visible.
    const active=!document.hidden && root.classList.contains('is-visible') &&
      root.getAttribute('aria-hidden')!=='true' && section.classList.contains('is-current') &&
      film.classList.contains('is-playing');
    if(active&&!running)start();
    else if(!active&&running)stop();
  }
  document.addEventListener('visibilitychange',sync);
  setInterval(sync,220); // Same lightweight lifecycle observation used by BUGS.
  window.ClearOrbitAladinProblem=Object.freeze({
    replay(){if(current){stop();start();}},
    getStage(){return current?.film.dataset.aladinStage||null;}
  });
})();
