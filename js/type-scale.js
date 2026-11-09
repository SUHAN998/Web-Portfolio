/* CLEAR ORBIT v1.50.138 — laptop viewport fitting without layout reflow.
 * Reference max: 3840 x 2160 Windows at 150% -> ~2560 x 1440 CSS pixels.
 * The stage uses the actual browser viewport rather than a minimum height;
 * 1440x1024 design positions and all existing 3D interactions are retained.
 */
"use strict";
(()=>{
  const DESIGN_WIDTH=1440,DESIGN_HEIGHT=1024;
  const REFERENCE_CSS_WIDTH=2560,REFERENCE_CSS_HEIGHT=1440;
  const REFERENCE_STAGE_SCALE=Math.min(REFERENCE_CSS_WIDTH/DESIGN_WIDTH,REFERENCE_CSS_HEIGHT/DESIGN_HEIGHT);
  const REFERENCE_OVERLAY_WIDTH=1920,REFERENCE_OVERLAY_HEIGHT=1080;
  const MAX_OVERLAY_SCALE=4/3;
  const MIN_LAYOUT_WIDTH=1536,MIN_LAYOUT_HEIGHT=960;
  const doc=document.documentElement;
  let queued=false;
  function apply(){
    queued=false;
    const rawWidth=Math.max(320,window.innerWidth||0);
    const rawHeight=Math.max(320,window.innerHeight||0);
    const effectiveWidth=Math.max(MIN_LAYOUT_WIDTH,rawWidth);
    const effectiveHeight=Math.max(MIN_LAYOUT_HEIGHT,rawHeight);
    // v1.50.138: fit the stage into the ACTUAL browser content viewport.
    // The previous 1536x960 minimum artificially enlarged the 1440x1024
    // stage beyond laptop browser height, cropping the docked logo and HUD.
    // Keep the fixed design coordinates; only the uniform stage scale changes.
    // This must match app.js Stage.resize() (which uses the raw viewport).
    const stageFit=Math.min(rawWidth/DESIGN_WIDTH,rawHeight/DESIGN_HEIGHT,2.5);
    // Retain the approved typography reference/minimum as a preference, but
    // cap compensation on short windows to avoid overflowing fixed columns.
    const typographyFit=Math.min(effectiveWidth/DESIGN_WIDTH,effectiveHeight/DESIGN_HEIGHT,2.5);
    const desiredStageType=Math.max(1,Math.min(typographyFit,REFERENCE_STAGE_SCALE));
    const factor=Math.min(1.12,desiredStageType/Math.max(.01,stageFit));
    doc.style.setProperty('--s',stageFit.toFixed(7));
    doc.style.setProperty('--orbit-type-adjust',factor.toFixed(7));
    const overlayScale=Math.max(1,Math.min(
      MAX_OVERLAY_SCALE,
      effectiveWidth/REFERENCE_OVERLAY_WIDTH,
      effectiveHeight/REFERENCE_OVERLAY_HEIGHT
    ));
    doc.style.setProperty('--orbit-overlay-type-scale',overlayScale.toFixed(7));
    doc.style.setProperty('--orbit-layout-min-width',MIN_LAYOUT_WIDTH+'px');
    doc.style.setProperty('--orbit-layout-min-height',MIN_LAYOUT_HEIGHT+'px');
    doc.dispatchEvent(new CustomEvent('orbit:typography-resized',{
      detail:{
        rawWidth,rawHeight,effectiveWidth,effectiveHeight,
        stageFit,desiredStageType,stageFontRatio:factor,overlayScale,
        minLayoutWidth:MIN_LAYOUT_WIDTH,minLayoutHeight:MIN_LAYOUT_HEIGHT
      }
    }));
  }
  function queue(){if(queued)return;queued=true;requestAnimationFrame(apply);}
  apply();
  window.addEventListener('resize',queue,{passive:true});
  window.visualViewport?.addEventListener('resize',queue,{passive:true});
  window.addEventListener('load',queue,{passive:true});
  window.addEventListener('orbit3dready',queue,{passive:true});
})();
