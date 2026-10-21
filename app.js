(() => {
  "use strict";

  /* ============================================================
     Data
     ============================================================ */

  const PROJECTS = {
    bugs: {
      eyebrow: "UX/UI Design",
      title: "Bugs! ReDesign",
      period: "2026.03. ~ 2026. 06.",
      role: "개인 프로젝트",
      lead: "음악 스트리밍 서비스 벅스(Bugs!)의 사용자 경험을 개선한 UX/UI 리디자인 프로젝트입니다.",
      body: "서비스 사용 흐름을 분석하고, 주요 기능의 접근성과 정보의 시각적 위계를 개선했습니다. 음악 탐색과 재생에 필요한 정보를 직관적으로 파악하도록 화면을 재설계하고, 현재 재생 상태를 명확하게 전달하는 인터페이스를 구현했습니다.",
      image: "./assets/bugs-hero.jpg"
    },
    naver: {
      eyebrow: "UX/UI Design",
      title: "NAVER 지식iN",
      period: "2026.03. ~ 2026. 05.",
      role: "개인 프로젝트",
      lead: "네이버 지식iN의 정보 탐색 경험을 개선한 UX/UI 리디자인 프로젝트입니다.",
      body: "기존 사용 흐름을 분석해 정보 밀도 조절, 탐색의 연속성, 시각적 위계 강화에 집중했습니다. 불필요한 요소를 줄이고 탐색 영역을 고정해 접근성을 높였으며, 핵심 질문과 답변을 구분해 정보 탐색 효율을 개선했습니다.",
      image: "./assets/naver.jpg"
    },
    gta: {
      eyebrow: "UX/UI Design",
      title: "GTA : Online Promotion site",
      period: "2026.05. ~ 2026. 06.",
      role: "개인 프로젝트",
      lead: "GTA 온라인 신규·복귀 플레이어를 위한 가상 이벤트와 세계관 기반 프로모션 웹사이트 제작 프로젝트입니다.",
      body: "'범죄 제국의 귀환' 콘셉트로 이벤트 혜택의 시각적 강조, 인터랙티브 콘텐츠와 몰입감에 집중했습니다. 부동산 지도와 차량 포디움 등 탐색형 인터랙션을 구현하고, 보상 정보를 직관적으로 배치해 이벤트 참여를 유도했습니다.",
      image: "./assets/gta.jpg"
    },
    hwalok: {
      eyebrow: "Visual Design",
      title: "충주 활옥동굴 Brochure Design",
      period: "2025.10. ~ 2026. 12.",
      role: "개인 프로젝트",
      lead: "충주 활옥동굴의 관광 매력을 효과적으로 전달하기 위한 브로슈어 리디자인 프로젝트입니다.",
      body: "관광 홍보물과 유사 사례를 분석해 타깃 설정, 콘텐츠 차별화, 촬영지 이미지 강화에 집중했습니다. 활옥동굴의 역사와 관광 자원을 재구성하고, 촬영지로서의 매력을 부각해 관광객의 관심과 방문 동기를 높이는 브로슈어를 기획했습니다.",
      image: "./assets/hwalok.jpg"
    },
    aladin: {
      eyebrow: "UX/UI Design",
      title: "Aladin App ReDesign project",
      period: "2025.09. ~ 2025. 12.",
      role: "팀 프로젝트",
      lead: "온라인 서점 알라딘(Aladin)의 모바일 사용 경험을 개선하기 위한 UX/UI 리디자인 프로젝트입니다.",
      body: "사용자 설문과 서비스 분석을 바탕으로 정보 구조, 디자인 일관성, 탐색 효율을 개선했습니다. 복잡한 카테고리를 단순화하고 통일된 디자인 시스템과 여백 중심 레이아웃을 적용해 원하는 도서를 빠르게 탐색하고 구매할 수 있도록 재설계했습니다.",
      image: "./assets/aladin.jpg"
    },
    seven: {
      eyebrow: "Visual Design",
      title: "7ELEVEN CI ReDesign",
      period: "2025.09. ~ 2026. 10.",
      role: "개인 프로젝트",
      lead: "세븐일레븐(7-ELEVEN)의 친근하고 편안한 이미지를 강화하기 위한 CI 리디자인 프로젝트입니다.",
      body: "기존 브랜드 컬러를 유지하며 둥근 로고와 한글 로고 로컬라이징으로 친숙한 정체성을 표현했습니다. '내 친구, 내 이웃' 콘셉트를 중심으로 간판, 유니폼, 패키지 등 다양한 접점에 적용 가능한 일관된 브랜드 아이덴티티를 설계했습니다.",
      image: "./assets/seven.jpg"
    },
    profile: {
      eyebrow: "PROFILE",
      title: "Su Han",
      body: "복잡한 문제 속에서 핵심을 발견하고, 흩어진 정보를 연결해 명확한 경험으로 정리하는 UX/UI 디자이너입니다."
    },
    skill: {
      eyebrow: "SKILL",
      title: "Design & Build",
      body: "UX/UI 설계와 Figma 기반 화면 제작을 중심으로, HTML·CSS·JavaScript를 활용해 디자인을 실제 인터랙션으로 구현합니다."
    },
    contact: {
      eyebrow: "CONTACT",
      title: "Let’s Connect",
      body: "포트폴리오의 Contact 영역입니다. 실제 제출 시 이메일과 연락처를 이 영역에 연결하면 됩니다."
    }
  };


  /* ============================================================
     Custom cursor
     ============================================================ */

  const customCursor = document.getElementById("customCursor");
  const cursorHint = document.getElementById("cursorHint");

  if (customCursor && matchMedia("(pointer: fine)").matches) {
    let mouseX = innerWidth / 2;
    let mouseY = innerHeight / 2;
    let cursorX = mouseX;
    let cursorY = mouseY;

    const interactiveSelector = [
      "a",
      "button",
      "[role='button']",
      ".space-node",
      ".project-card"
    ].join(",");

    function animateCursor() {
      cursorX += (mouseX - cursorX) * .22;
      cursorY += (mouseY - cursorY) * .22;

      customCursor.style.left = `${cursorX}px`;
      customCursor.style.top = `${cursorY}px`;

      // Always stay on the RIGHT. Fade smoothly near the right edge, no flipping.
      if (cursorHint) {
        const hintWidth = cursorHint.offsetWidth;
        const hintX = cursorX + 24;
        const rightClearance = innerWidth - (hintX + hintWidth);
        const fadeStart = 80; // fade before the text actually reaches the edge
        const boundaryOpacity = Math.max(0, Math.min(1, rightClearance / fadeStart));
        const hintY = Math.min(innerHeight - 28, Math.max(28, cursorY));
        cursorHint.style.transform = `translate3d(${hintX}px,${hintY}px,0) translateY(-50%)`;
        cursorHint.style.setProperty('--hint-edge-opacity', boundaryOpacity.toFixed(3));
      }

      requestAnimationFrame(animateCursor);
    }

    addEventListener("mousemove", e => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      customCursor.classList.add("is-visible");
      cursorHint?.classList.add("is-visible");

      const interactive = e.target.closest?.(interactiveSelector);
      customCursor.classList.toggle("is-interactive", Boolean(interactive));
    }, { passive: true });

    addEventListener("mouseleave", () => {
      customCursor.classList.remove("is-visible");
      customCursor.classList.remove("is-interactive");
      cursorHint?.classList.remove("is-visible");
    });

    addEventListener("mouseenter", () => {
      customCursor.classList.add("is-visible");
      cursorHint?.classList.add("is-visible");
    });

    addEventListener("pointerdown", () => {
      customCursor.classList.add("is-pressed");

      const ripple = document.createElement("span");
      ripple.className = "cursor-ripple";
      // Start the ripple at the visible custom cursor, including its soft trailing.
      ripple.style.left = `${cursorX}px`;
      ripple.style.top = `${cursorY}px`;
      document.body.appendChild(ripple);
      ripple.addEventListener("animationend", () => ripple.remove(), { once: true });
    });

    addEventListener("pointerup", () => {
      customCursor.classList.remove("is-pressed");
    });

    addEventListener("pointercancel", () => {
      customCursor.classList.remove("is-pressed");
    });

    requestAnimationFrame(animateCursor);
  }

  /* ============================================================
     V33 — Pointer-down comet / stardust trail.
     Own transparent overlay: never alters the 3D starfield, intro,
     modal content, or click targets. Tiny silver/blue dust fades out.
     ============================================================ */
  const meteorCanvas = document.getElementById('meteorTrail');
  const meteorCtx = meteorCanvas?.getContext('2d', { alpha: true });
  const meteorMotionOK = !matchMedia('(prefers-reduced-motion: reduce)').matches;
  let meteorDpr = Math.min(window.devicePixelRatio || 1, 2);
  let meteorDust = [];
  let meteorPath = [];
  let meteorRaf = 0;
  let meteorPressed = false;
  let meteorPointerId = null;
  let meteorLastPoint = null;

  function sizeMeteorCanvas() {
    if (!meteorCanvas || !meteorCtx) return;
    meteorDpr = Math.min(window.devicePixelRatio || 1, 2);
    meteorCanvas.width = Math.round(innerWidth * meteorDpr);
    meteorCanvas.height = Math.round(innerHeight * meteorDpr);
    meteorCtx.setTransform(meteorDpr, 0, 0, meteorDpr, 0, 0);
  }
  sizeMeteorCanvas();
  addEventListener('resize', sizeMeteorCanvas, { passive: true });

  function renderMeteor(now) {
    meteorRaf = 0;
    if (!meteorCtx) return;
    const c = meteorCtx;
    c.clearRect(0, 0, innerWidth, innerHeight);
    meteorPath = meteorPath.filter(point => now - point.at < 260);
    meteorDust = meteorDust.filter(p => now - p.born < p.life);

    // A tapered hairline streak behind the moving, held pointer.
    if (meteorPath.length > 1) {
      c.lineCap = 'round';
      for (let i = 1; i < meteorPath.length; i++) {
        const prev = meteorPath[i - 1];
        const point = meteorPath[i];
        const age = now - point.at;
        const alpha = Math.pow(Math.max(0, 1 - age / 260), 1.65) * .72;
        c.beginPath();
        c.strokeStyle = `rgba(205,224,255,${alpha})`;
        c.lineWidth = .45 + alpha * 2.0;
        c.moveTo(prev.x, prev.y);
        c.lineTo(point.x, point.y);
        c.stroke();
        if (alpha > .16) {
          c.beginPath();
          c.strokeStyle = `rgba(129,170,255,${alpha * .19})`;
          c.lineWidth = 5 + alpha * 3;
          c.moveTo(prev.x, prev.y);
          c.lineTo(point.x, point.y);
          c.stroke();
        }
      }
    }

    // Particles drift and twinkle separately from the core streak.
    for (const p of meteorDust) {
      const t = Math.max(0, Math.min(1, (now - p.born) / p.life));
      const fade = (1 - t) ** 1.55;
      const x = p.x + p.vx * t * .75;
      const y = p.y + p.vy * t * .75;
      c.beginPath();
      c.fillStyle = `rgba(${p.blue ? '176,207,255' : '246,249,255'},${p.alpha * fade})`;
      c.arc(x, y, p.r * (1 - t * .26), 0, Math.PI * 2);
      c.fill();
    }

    if (meteorPath.length || meteorDust.length) {
      meteorRaf = requestAnimationFrame(renderMeteor);
    }
  }

  function emitMeteorMovement(x, y) {
    if (!meteorCtx || !meteorMotionOK || !meteorPressed) return;
    const now = performance.now();
    if (!meteorLastPoint) {
      meteorLastPoint = { x, y };
      return;
    }
    const dx = x - meteorLastPoint.x;
    const dy = y - meteorLastPoint.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 1.5) return;
    const ux = dx / dist;
    const uy = dy / dist;
    const steps = Math.min(20, Math.max(1, Math.ceil(dist / 6)));
    for (let step = 1; step <= steps; step++) {
      const t = step / steps;
      const sx = meteorLastPoint.x + dx * t;
      const sy = meteorLastPoint.y + dy * t;
      meteorPath.push({ x: sx, y: sy, at: now });
      // Small, abundant particles flow slightly against the movement direction.
      for (let i = 0; i < 4; i++) {
        const side = (Math.random() - .5) * 12;
        const back = Math.random() * 19;
        meteorDust.push({
          x: sx - ux * back - uy * side,
          y: sy - uy * back + ux * side,
          vx: -ux * (12 + Math.random() * 24) + (Math.random() - .5) * 10,
          vy: -uy * (12 + Math.random() * 24) + (Math.random() - .5) * 10,
          born: now,
          life: 320 + Math.random() * 370,
          r: .38 + Math.random() * 1.0,
          alpha: .20 + Math.random() * .50,
          blue: Math.random() > .48
        });
      }
    }
    // Constant-time memory guard for fast drag movement.
    if (meteorDust.length > 620) meteorDust.splice(0, meteorDust.length - 620);
    if (meteorPath.length > 130) meteorPath.splice(0, meteorPath.length - 130);
    meteorLastPoint = { x, y };
    if (!meteorRaf) meteorRaf = requestAnimationFrame(renderMeteor);
  }

  addEventListener('pointerdown', event => {
    if (!meteorMotionOK || event.pointerType !== 'mouse' || event.button !== 0) return;
    // Keep selecting and editing fully functional inside editable controls.
    if (event.target.closest?.('input, textarea, select, [contenteditable], [contenteditable="true"]')) return;
    meteorPressed = true;
    meteorPointerId = event.pointerId;
    meteorLastPoint = { x: event.clientX, y: event.clientY };
    document.body.classList.add('is-meteor-dragging');
  });
  addEventListener('pointermove', event => {
    if (!meteorPressed || event.pointerId !== meteorPointerId) return;
    if (!(event.buttons & 1)) {
      releaseMeteorPointer();
      return;
    }
    emitMeteorMovement(event.clientX, event.clientY);
  }, { passive: true });
  function releaseMeteorPointer() {
    meteorPressed = false;
    meteorPointerId = null;
    meteorLastPoint = null;
    document.body.classList.remove('is-meteor-dragging');
  }
  // Suppress native selection/drag ghosts without preventing pointerdown,
  // click, focus, project modal opening, or text editing after releasing.
  addEventListener('selectstart', event => {
    if (meteorPressed) event.preventDefault();
  }, { capture: true });
  addEventListener('dragstart', event => {
    if (meteorPressed) event.preventDefault();
  }, { capture: true });
  addEventListener('pointerup', releaseMeteorPointer);
  addEventListener('pointercancel', releaseMeteorPointer);
  addEventListener('blur', releaseMeteorPointer);

  /* ============================================================
     V34 — subtle mouse-avoidance field for ambient background dust ONLY.
     Constellation nodes/lines never react to pointer proximity.
     ============================================================ */
  const starAvoid = {
    x: innerWidth / 2,
    y: innerHeight / 2,
    targetX: innerWidth / 2,
    targetY: innerHeight / 2,
    strength: 0,
    targetStrength: 0
  };

  // Eased position drives the starfield canvas only.
  function advanceStarAvoid(dtMs) {
    const follow = 1 - Math.exp(-dtMs / 85);
    const fade = 1 - Math.exp(-dtMs / 125);
    starAvoid.x += (starAvoid.targetX - starAvoid.x) * follow;
    starAvoid.y += (starAvoid.targetY - starAvoid.y) * follow;
    starAvoid.strength += (starAvoid.targetStrength - starAvoid.strength) * fade;
    if (Math.abs(starAvoid.strength) < 0.0005 && starAvoid.targetStrength === 0) {
      starAvoid.strength = 0;
    }
  }

  // Two-distance cursor field, always continuous with NO hard cutoff.
  // Nearby stars retain V32's readable response, while even very distant
  // stars/dust receive an extremely small smooth outward displacement.
  function getStarAvoidance(px, py, radiusPx, limitPx) {
    if (starAvoid.strength < 0.001) return { x: 0, y: 0 };
    const dx = px - starAvoid.x;
    const dy = py - starAvoid.y;
    const distance = Math.hypot(dx, dy);
    const nearT = Math.max(0, 1 - distance / radiusPx);
    const nearField = nearT * nearT * (3 - 2 * nearT);
    // Long-range tail remains nonzero even near the opposite screen corner.
    // A faint subpixel tail is retained for distant background dust.
    const farRange = Math.max(440, Math.hypot(innerWidth, innerHeight) * .72);
    const farField = .32 * Math.exp(-distance / farRange);
    const displacement = (limitPx * nearField + farField) * starAvoid.strength;
    const directionX = distance > .001 ? dx / distance : 0;
    const directionY = distance > .001 ? dy / distance : -1;
    return { x: directionX * displacement, y: directionY * displacement };
  }

  /* ============================================================
     Particle starfield — image background is intentionally NOT used.
     ============================================================ */

  const canvas = document.getElementById("starfield");
  const ctx = canvas.getContext("2d", { alpha: true });
  let stars = [];
  let dpr = Math.min(window.devicePixelRatio || 1, 2);
  let lastTime = performance.now();

  function resizeCanvas() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(innerWidth * dpr);
    canvas.height = Math.round(innerHeight * dpr);
    canvas.style.width = `${innerWidth}px`;
    canvas.style.height = `${innerHeight}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const target = Math.max(110, Math.round((innerWidth * innerHeight) / 4700));
    stars = Array.from({ length: target }, () => makeStar(true));
  }

  function makeStar(randomY = false) {
    // Each particle has a fixed world-space Z layer. Most are distant dust,
    // while a minority are near-camera stars with visibly stronger parallax.
    const pick = Math.random();
    const z = pick < .16
      ? 1.05 + Math.random() * .95
      : pick < .53
        ? 2.0 + Math.random() * 1.7
        : 3.7 + Math.random() * 4.3;
    const depth = (8 - z) / 7;
    return {
      x: Math.random() * innerWidth,
      y: randomY ? Math.random() * innerHeight : innerHeight + 8,
      z,
      // Intrinsic brightness varies, but spatial size follows depth
      // monotonically (near remains larger at forward AND backward limits).
      r: 1.02 * Math.pow(2.4 / z, .5),
      alpha: .15 + Math.random() * .65,
      speed: 2.0 + depth * 10.5,
      drift: -1.1 + Math.random() * 2.2,
      twinkle: .7 + Math.random() * 2.2,
      phase: Math.random() * Math.PI * 2
    };
  }

  /* This same perspective equation is used by the real project nodes below. */
  function perspectiveScale(worldZ, cameraZ) {
    return worldZ / (worldZ - cameraZ);
  }

  let lastStarfieldCameraZ = 0;
  function renderStars(now) {
    const dt = Math.min((now - lastTime) / 1000, .035);
    lastTime = now;
    advanceStarAvoid(dt * 1000);
    ctx.clearRect(0, 0, innerWidth, innerHeight);

    // The starfield participates in the SAME depth motion as Explore nodes.
    // In Intro/List it keeps its existing quiet, two-dimensional ambient drift.
    const inExplore = document.getElementById("portfolio")?.classList.contains("is-active") &&
      document.getElementById("portfolio")?.dataset.view === "explore";
    const cameraZ = inExplore ? getCameraTravel(cameraCurrent) : 0;
    // Aim the vanishing point into the H constellation, not the page's edge.
    // This naturally shortens 7ELEVEN's sideways path without any clamp.
    const cx = innerWidth * .63;
    const cy = innerHeight * .52;

    for (const s of stars) {
      s.y -= s.speed * dt;
      s.x += s.drift * dt;
      if (s.y < -10 || s.x < -10 || s.x > innerWidth + 10) {
        Object.assign(s, makeStar(false));
      }

      const depthScale = inExplore ? perspectiveScale(s.z, cameraZ) : 1;
      const projectedX = cx + (s.x - cx) * depthScale;
      const projectedY = cy + (s.y - cy) * depthScale;
      const avoid = getStarAvoidance(projectedX, projectedY, 118, 3.5);
      const x = projectedX + avoid.x;
      const y = projectedY + avoid.y;
      const r = s.r * depthScale;
      // Crossing the viewport is natural: never clamp/project stars to its edge.
      if (x < -r * 6 || x > innerWidth + r * 6 ||
          y < -r * 6 || y > innerHeight + r * 6) continue;

      const pulse = .58 + Math.sin(now * .001 * s.twinkle + s.phase) * .34;
      const a = Math.max(.05, Math.min(.96, s.alpha * pulse * Math.sqrt(depthScale)));

      // Short, translucent radial motion trails only while travelling. A near
      // world star creates a longer trail than a distant star automatically.
      if (inExplore && Math.abs(cameraZ - lastStarfieldCameraZ) > .0003) {
        const beforeScale = perspectiveScale(s.z, lastStarfieldCameraZ);
        const oldX = cx + (s.x - cx) * beforeScale;
        const oldY = cy + (s.y - cy) * beforeScale;
        const speedPx = Math.hypot(x - oldX, y - oldY);
        if (speedPx > .35 && speedPx < 36) {
          ctx.beginPath();
          ctx.strokeStyle = `rgba(179,203,255,${a * .24})`;
          ctx.lineWidth = Math.min(.85, .32 * depthScale);
          ctx.moveTo(oldX, oldY);
          ctx.lineTo(x, y);
          ctx.stroke();
        }
      }

      ctx.beginPath();
      ctx.fillStyle = `rgba(242,246,255,${a})`;
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();

      if (r > 1.12 && a > .35) {
        ctx.beginPath();
        ctx.strokeStyle = `rgba(179,203,255,${a * .22})`;
        ctx.lineWidth = .5 * Math.min(1.6, depthScale);
        ctx.moveTo(x - r * 4.8, y);
        ctx.lineTo(x + r * 4.8, y);
        ctx.moveTo(x, y - r * 4.8);
        ctx.lineTo(x, y + r * 4.8);
        ctx.stroke();
      }
    }

    lastStarfieldCameraZ = cameraZ;
    requestAnimationFrame(renderStars);
  }

  resizeCanvas();
  addEventListener("resize", resizeCanvas, { passive: true });
  requestAnimationFrame(renderStars);

  /* ============================================================
     Intro assembly: particles -> logo/text, left to right
     ============================================================ */

  const introParticlesCanvas = document.getElementById("introParticles");
  const introParticlesCtx = introParticlesCanvas?.getContext("2d");
  const introScene = document.getElementById("intro");

  let introFxDpr = Math.min(window.devicePixelRatio || 1, 2);
  let introFxParticles = [];
  let introFxRaf = null;

  function resizeIntroParticles() {
    if (!introParticlesCanvas || !introParticlesCtx) return;

    introFxDpr = Math.min(window.devicePixelRatio || 1, 2);
    introParticlesCanvas.width = Math.round(innerWidth * introFxDpr);
    introParticlesCanvas.height = Math.round(innerHeight * introFxDpr);
    introParticlesCanvas.style.width = `${innerWidth}px`;
    introParticlesCanvas.style.height = `${innerHeight}px`;
    introParticlesCtx.setTransform(introFxDpr, 0, 0, introFxDpr, 0, 0);
  }

  resizeIntroParticles();
  addEventListener("resize", resizeIntroParticles, { passive: true });

  function spawnAssemblyParticles(x, y, count = 28, spreadX = 56, spreadY = 26) {
    if (!introParticlesCtx) return;

    for (let i = 0; i < count; i++) {
      const life = 540 + Math.random() * 430;

      introFxParticles.push({
        x: x - spreadX - Math.random() * spreadX * .55,
        y: y + (Math.random() - .5) * spreadY * 1.6,
        tx: x + (Math.random() - .5) * 7,
        ty: y + (Math.random() - .5) * 7,
        size: .4 + Math.random() * 1.0,
        alpha: .18 + Math.random() * .72,
        life,
        maxLife: life,
        drift: (Math.random() - .5) * .35
      });
    }

    if (!introFxRaf) {
      introFxRaf = requestAnimationFrame(renderIntroParticles);
    }
  }

  /*
    Logo-only particle spawner.
    Every batch uses almost the same flight time so the arrival wave can
    be synchronized exactly with the logo's left-to-right reveal head.
  */
  function spawnLogoAssemblyParticles(
    x,
    y,
    count,
    spreadX,
    spreadY,
    flightMs
  ) {
    if (!introParticlesCtx) return;

    /*
      V18:
      Logo dust no longer "shoots" in from far left.
      It begins from a much closer, softer cloud with only a slight
      left-to-right bias and settles using a smooth ease-in-out path.
    */
    const softenedCount = Math.max(8, Math.round(count * .64));

    for (let i = 0; i < softenedCount; i++) {
      const life = flightMs + (Math.random() - .5) * 70;

      introFxParticles.push({
        x:
          x
          - spreadX * (.22 + Math.random() * .34)
          + (Math.random() - .5) * spreadX * .22,
        y: y + (Math.random() - .5) * spreadY * .90,
        tx: x + (Math.random() - .5) * 3.6,
        ty: y + (Math.random() - .5) * 3.6,
        size: .4 + Math.random() * .9,
        alpha: .12 + Math.random() * .43,
        life,
        maxLife: life,
        drift: (Math.random() - .5) * .14,
        motion: "logo-soft",
        fadeStart: .58
      });
    }

    if (!introFxRaf) {
      introFxRaf = requestAnimationFrame(renderIntroParticles);
    }
  }

  /*
    Responsive particle density
    ---------------------------
    Particle amount and gathering range are derived from the rendered
    element size, rather than hard-coded per line.

    Result:
    - large logo / large type -> more particles + wider gathering field
    - small type              -> fewer particles + tighter gathering field
    - responsive font changes automatically change the effect too
  */
  function getParticleProfile(rect, type = "text") {
    const width = Math.max(1, rect.width);
    const height = Math.max(1, rect.height);
    const area = width * height;

    if (type === "logo") {
      return {
        count: Math.round(Math.min(38, Math.max(18, area / 1100))),
        spreadX: Math.min(78, Math.max(36, width * .23)),
        spreadY: Math.min(56, Math.max(24, height * .25)),
        columns: Math.round(Math.min(24, Math.max(16, width / 12)))
      };
    }

    // A character's height is the strongest visual cue for font size.
    // Area adds a small bonus for wide glyphs such as M/W/한글.
    return {
      count: Math.round(
        Math.min(
          34,
          Math.max(
            6,
            height * .27 + area / 210
          )
        )
      ),
      spreadX: Math.min(72, Math.max(20, height * .78 + width * .34)),
      spreadY: Math.min(52, Math.max(13, height * .72))
    };
  }

  function renderIntroParticles() {
    if (!introParticlesCtx) return;

    introParticlesCtx.clearRect(0, 0, innerWidth, innerHeight);

    introFxParticles = introFxParticles.filter(p => p.life > 0);

    for (const p of introFxParticles) {
      p.life -= 16.7;

      const progress = 1 - Math.max(0, p.life / p.maxLife);

      // Normal text dust keeps its existing motion.
      // Logo dust uses smoothstep: slower start + slower arrival, no "shot" feeling.
      const ease = p.motion === "logo-soft"
        ? progress * progress * (3 - 2 * progress)
        : 1 - Math.pow(1 - progress, 3);

      const cx = p.x + (p.tx - p.x) * ease;
      const cy = p.y + (p.ty - p.y) * ease + Math.sin(progress * Math.PI * 2) * p.drift * 7;

      const fadeStart = p.fadeStart ?? .76;
      const fade = progress < fadeStart
        ? 1
        : Math.max(0, (1 - progress) / Math.max(.001, 1 - fadeStart));

      introParticlesCtx.beginPath();
      introParticlesCtx.fillStyle = `rgba(235,239,249,${p.alpha * fade})`;
      introParticlesCtx.arc(cx, cy, p.size, 0, Math.PI * 2);
      introParticlesCtx.fill();

      if (p.size > 1.15) {
        introParticlesCtx.beginPath();
        introParticlesCtx.strokeStyle = `rgba(115,157,248,${p.alpha * fade * .34})`;
        introParticlesCtx.lineWidth = .35;
        introParticlesCtx.moveTo(cx - p.size * 3.2, cy);
        introParticlesCtx.lineTo(cx + p.size * 3.2, cy);
        introParticlesCtx.stroke();
      }
    }

    if (introFxParticles.length) {
      introFxRaf = requestAnimationFrame(renderIntroParticles);
    } else {
      introParticlesCtx.clearRect(0, 0, innerWidth, innerHeight);
      introFxRaf = null;
    }
  }

  function prepareIntroText(node) {
    if (!node || node.dataset.fxPrepared === "true") return;

    const text = node.textContent;
    node.textContent = "";
    node.dataset.fxPrepared = "true";
    node.classList.add("is-prepared");

    [...text].forEach(char => {
      const span = document.createElement("span");
      span.className = "intro-char";

      if (char === " ") {
        span.classList.add("is-space");
        span.innerHTML = "&nbsp;";
      } else {
        span.textContent = char;
      }

      node.appendChild(span);
    });
  }

  function revealIntroLine(node, {
    startDelay = 0,
    charDelay = 60,
    density = 1
  } = {}) {
    if (!node) return 0;

    prepareIntroText(node);
    const chars = [...node.querySelectorAll(".intro-char")];

    chars.forEach((span, index) => {
      setTimeout(() => {
        if (!span.classList.contains("is-space")) {
          const rect = span.getBoundingClientRect();
          const profile = getParticleProfile(rect, "text");

          spawnAssemblyParticles(
            rect.left + rect.width / 2,
            rect.top + rect.height / 2,
            Math.max(4, Math.round(profile.count * density)),
            profile.spreadX,
            profile.spreadY
          );
        }

        span.classList.add("is-visible");
      }, startDelay + index * charDelay);
    });

    return startDelay + chars.length * charDelay + 400;
  }

  function animateIntroLogo(startDelay = 150) {
    const logo = document.getElementById("introLogo");
    if (!logo) return 0;

    /*
      V18 sync:
      - reveal is the master clock
      - dust appears only ~90ms before the reveal head
      - dust itself moves more gently and remains around the drawing edge
        instead of arriving a whole beat before it
    */
    const revealDelayMs = 90;
    const sweepMs = 1220;
    const particleFlightMs = 560;
    const particleVisualLeadMs = 90;

    setTimeout(() => {
      const rect = logo.getBoundingClientRect();
      const profile = getParticleProfile(rect, "logo");

      const columns = Math.max(20, profile.columns);
      const rows = Math.max(3, Math.round(rect.height / 58));

      logo.classList.remove("is-assembling");
      logo.style.clipPath = "inset(0 100% 0 0)";
      logo.style.opacity = ".08";
      logo.style.filter =
        "blur(4px) " +
        "drop-shadow(0 0 .45rem rgba(115,157,248,.18)) " +
        "drop-shadow(0 0 1.5rem rgba(64,111,255,.06))";

      const revealAnimation = logo.animate(
        [
          {
            clipPath: "inset(0 100% 0 0)",
            opacity: .08,
            filter:
              "blur(4px) " +
              "drop-shadow(0 0 .45rem rgba(115,157,248,.18)) " +
              "drop-shadow(0 0 1.5rem rgba(64,111,255,.06))"
          },
          {
            clipPath: "inset(0 0% 0 0)",
            opacity: 1,
            filter:
              "blur(0px) " +
              "drop-shadow(0 0 .45rem rgba(115,157,248,.42)) " +
              "drop-shadow(0 0 1.5rem rgba(64,111,255,.10))"
          }
        ],
        {
          delay: revealDelayMs,
          duration: sweepMs,
          easing: "linear",
          fill: "forwards"
        }
      );

      /*
        Every column's dust starts only slightly before the reveal head
        reaches the same X position. The dust continues settling during
        and just after reveal, which reads as "forming" rather than "shooting".
      */
      for (let i = 0; i < columns; i++) {
        const progress = i / Math.max(1, columns - 1);
        const revealAt = revealDelayMs + progress * sweepMs;
        const launchAt = Math.max(0, revealAt - particleVisualLeadMs);

        setTimeout(() => {
          const x = rect.left + rect.width * progress;

          for (let j = 0; j < rows; j++) {
            const rowT = rows === 1 ? .5 : j / (rows - 1);
            const y = rect.top + rect.height * (.18 + rowT * .64);

            spawnLogoAssemblyParticles(
              x,
              y,
              profile.count,
              profile.spreadX,
              profile.spreadY,
              particleFlightMs
            );
          }
        }, launchAt);
      }

      revealAnimation.finished.then(() => {
        logo.classList.add("is-assembling");
        logo.style.clipPath = "";
        logo.style.opacity = "";
        logo.style.filter = "";
        revealAnimation.cancel();
      }).catch(() => {});
    }, startDelay);

    return startDelay + revealDelayMs + sweepMs + 180;
  }

  function runIntroAssembly() {
    const name = document.querySelector(".intro-name");
    const keywords = document.querySelector(".intro-keywords");
    const philosophy = document.querySelector(".intro-philosophy");
    const meta = document.querySelector(".intro-meta");

    let t = 0;

    t = animateIntroLogo(200);

    t = revealIntroLine(name, {
      startDelay: t + 135,
      charDelay: 96,
      density: 1.18
    });

    t = revealIntroLine(keywords, {
      startDelay: t + 100,
      charDelay: 23,
      density: .92
    });

    t = revealIntroLine(philosophy, {
      startDelay: t + 84,
      charDelay: 45,
      density: 1.0
    });

    t = revealIntroLine(meta, {
      startDelay: t + 75,
      charDelay: 52,
      density: .88
    });

    return t;
  }

  /* ============================================================
     Intro -> Explore
     ============================================================ */

  const intro = document.getElementById("intro");
  const portfolio = document.getElementById("portfolio");
  const introLogo = document.getElementById("introLogo");
  const headerLogo = document.getElementById("headerLogo");
  const introSkip = document.getElementById("introSkip");
  let introTransitionStarted = false;
  let autoIntroTimer;

  function flyLogoToHeader(isSkip = false) {
    if (introTransitionStarted) return;
    introTransitionStarted = true;
    clearTimeout(autoIntroTimer);

    portfolio.classList.add("is-active");
    portfolio.setAttribute("aria-hidden", "false");

    const source = document.getElementById("introLogo");
    const target = document.getElementById("headerLogo");

    if (!source || !target) {
      intro.classList.remove("is-active");
      intro.setAttribute("aria-hidden", "true");
      portfolio.classList.add("has-entered");
      document.body.classList.add("portfolio-entered");
      return;
    }

    // Skip may happen while the logo is still partially drawn.
    // Force the flying copy to represent the complete SH mark.
    if (isSkip) {
      source.classList.add("is-assembling");
      source.style.clipPath = "inset(0 0 0 0)";
      source.style.filter = "none";
    }

    /*
      Critical V17 fix:
      Measure the actual visible logo boxes AFTER the Portfolio layer is active
      and AFTER layout has completed. The old animation could measure a wrapper /
      transitional state and therefore land beside the normal header logo.
    */
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const sourceRect = source.getBoundingClientRect();
        const targetRect = target.getBoundingClientRect();

        const clone = source.cloneNode(true);
        clone.removeAttribute("id");
        clone.classList.remove("brand-logo--intro", "is-assembling");
        clone.classList.add("intro-logo-flight");
        clone.setAttribute("aria-hidden", "true");

        Object.assign(clone.style, {
          position: "fixed",
          zIndex: "500",
          left: `${sourceRect.left}px`,
          top: `${sourceRect.top}px`,
          width: `${sourceRect.width}px`,
          height: `${sourceRect.height}px`,
          margin: "0",
          transform: "none",
          transformOrigin: "top left",
          pointerEvents: "none",
          clipPath: "none",
          opacity: "1",
          filter: "none"
        });

        document.body.appendChild(clone);

        // Hide originals only after measurements/cloning are complete.
        source.style.opacity = "0";
        target.style.opacity = "0";

        const dx = targetRect.left - sourceRect.left;
        const dy = targetRect.top - sourceRect.top;
        const sx = targetRect.width / Math.max(1, sourceRect.width);
        const sy = targetRect.height / Math.max(1, sourceRect.height);

        const duration = isSkip ? 520 : 1120;

        const flight = clone.animate(
          [
            {
              transform: "translate3d(0,0,0) scale(1,1)",
              opacity: 1,
              filter: "blur(0px)"
            },
            {
              offset: .72,
              transform:
                `translate3d(${dx * .86}px, ${dy * .86}px, 0) ` +
                `scale(${1 + (sx - 1) * .82}, ${1 + (sy - 1) * .82})`,
              opacity: .98,
              filter: "blur(.15px)"
            },
            {
              // Exact target geometry: same top-left, width and height as headerLogo.
              transform: `translate3d(${dx}px, ${dy}px, 0) scale(${sx}, ${sy})`,
              opacity: 1,
              filter: "blur(0px)"
            }
          ],
          {
            duration,
            easing: "cubic-bezier(.22,.67,.20,1)",
            fill: "forwards"
          }
        );

        intro.classList.add("is-leaving");

        flight.finished.then(() => {
          /*
            Switch clone -> real header logo on the same frame.
            Because the clone's last transform uses targetRect exactly,
            there should be no visible jump.
          */
          target.style.opacity = "";
          clone.remove();

          intro.classList.remove("is-active");
          intro.setAttribute("aria-hidden", "true");
          portfolio.classList.add("has-entered");
          document.body.classList.add("portfolio-entered");
          window.scrollTo(0, 0);
        }).catch(() => {
          target.style.opacity = "";
          clone.remove();
        });
      });
    });
  }

  // Starts on the first screen, builds logo/text from particles,
  // then naturally transitions to Explore after the assembly completes.
  const introAssemblyDuration = runIntroAssembly();
  autoIntroTimer = setTimeout(
    () => flyLogoToHeader(false),
    Math.max(5160, introAssemblyDuration + 540)
  );

  introSkip.addEventListener("click", event => {
    event.preventDefault();
    event.stopPropagation();

    // Stop currently visible intro dust immediately so Skip feels responsive.
    introFxParticles.length = 0;
    if (introParticlesCtx) {
      introParticlesCtx.clearRect(0, 0, innerWidth, innerHeight);
    }

    flyLogoToHeader(true);
  });

  /* ============================================================
     Explore project thumbnail preview — TWO FIXED SLOTS
     ============================================================ */

  const previewSlots = new Map(
    [...document.querySelectorAll(".preview-slot[data-preview-zone]")].map(slot => [
      Number(slot.dataset.previewZone),
      {
        slot,
        layers: [...slot.querySelectorAll(".preview-layer")],
        activeIndex: 0,
        currentProject: null,
        hideTimer: null
      }
    ])
  );

  /*
    Latest markup mapping:
      Area 1 (upper fixed gap)
        Bugs / NAVER / Aladin / 7ELEVEN

      Area 2 (lower fixed gap)
        GTA / 충주 활옥동굴

    IMPORTANT:
    JavaScript never changes slot left/top coordinates.
  */
  const projectPreviewZone = {
    bugs: 1,
    naver: 1,
    aladin: 1,
    seven: 1,
    gta: 2,
    hwalok: 2
  };

  let activePreviewZone = null;

  function crossfadeSlotImage(state, projectKey) {
    const data = PROJECTS[projectKey];
    if (!data?.image) return;

    clearTimeout(state.hideTimer);

    const currentLayer = state.layers[state.activeIndex];
    const nextIndex = state.activeIndex === 0 ? 1 : 0;
    const nextLayer = state.layers[nextIndex];

    // First project in this fixed area.
    if (!state.currentProject) {
      currentLayer.src = data.image;
      currentLayer.alt = "";
      requestAnimationFrame(() => {
        currentLayer.classList.add("is-active");
        state.slot.classList.add("is-visible");
      });
      state.currentProject = projectKey;
      return;
    }

    // Hovering the same project again: no reload, no movement.
    if (state.currentProject === projectKey) {
      state.slot.classList.add("is-visible");
      currentLayer.classList.add("is-active");
      return;
    }

    /*
      Different project assigned to the SAME area:
      only the image layers crossfade for 1.5 seconds.
      The preview area itself remains completely stationary.
    */
    nextLayer.src = data.image;
    nextLayer.alt = "";

    requestAnimationFrame(() => {
      nextLayer.classList.add("is-active");
      currentLayer.classList.remove("is-active");
    });

    state.activeIndex = nextIndex;
    state.currentProject = projectKey;
    state.slot.classList.add("is-visible");
  }

  function showProjectPreview(projectKey) {
    const zone = projectPreviewZone[projectKey];
    const state = previewSlots.get(zone);
    if (!state) return;

    // Different fixed area: fade old area out, new area in.
    // Neither area changes position.
    if (activePreviewZone !== null && activePreviewZone !== zone) {
      const oldState = previewSlots.get(activePreviewZone);
      if (oldState) {
        clearTimeout(oldState.hideTimer);
        oldState.slot.classList.remove("is-visible");
      }
    }

    activePreviewZone = zone;
    // Repaint soft safety mask to reflect the current positions before display.
    refreshPreviewSafetyMasks(true);
    crossfadeSlotImage(state, projectKey);
  }

  function hideProjectPreview() {
    if (activePreviewZone === null) return;

    const zone = activePreviewZone;
    const state = previewSlots.get(zone);
    if (!state) return;

    clearTimeout(state.hideTimer);
    state.hideTimer = setTimeout(() => {
      state.slot.classList.remove("is-visible");
      activePreviewZone = null;
    }, 130);
  }

  function hideAllProjectPreviews() {
    for (const state of previewSlots.values()) {
      clearTimeout(state.hideTimer);
      state.slot.classList.remove("is-visible");
    }
    activePreviewZone = null;
  }

  document.querySelectorAll(".explore-layer .project-node[data-project]").forEach(node => {
    node.addEventListener("mouseenter", () => {
      showProjectPreview(node.dataset.project);
    });

    node.addEventListener("mouseleave", hideProjectPreview);

    node.addEventListener("focus", () => {
      showProjectPreview(node.dataset.project);
    });

    node.addEventListener("blur", hideProjectPreview);
  });

  /* ============================================================
     Explore <-> List
     ============================================================ */

  const viewButtons = [...document.querySelectorAll(".view-btn")];
  const listLayer = document.getElementById("listLayer");
  const projectCards = [...document.querySelectorAll(".project-card")];

  projectCards.forEach(card => {
    card.addEventListener("animationend", event => {
      if (event.animationName === "cardStagger") {
        card.classList.add("is-hover-ready");
      }
    });
  });

  let currentView = "explore";
  portfolio.dataset.view = "explore";

  /* ============================================================
     Explore preview adaptive negative-space masks — V24
     ============================================================

     Keep the two V10 preview anchors in their ORIGINAL gaps. Unlike a static
     radial mask, the soft organic silhouette is recomputed against the live
     star, label and constellation-line positions while the camera zooms.
     The alpha is fully erased where content needs breathing room; outer
     edges of each lobe fade gradually into the starfield.
  */
  const previewBaseAnchors = new Map([
    [1, { x: 64.1, y: 35.2 }],
    [2, { x: 65.1, y: 68.6 }]
  ]);
  const previewMaskCanvas = document.createElement("canvas");
  const previewMaskCtx = previewMaskCanvas.getContext("2d", { willReadFrequently: false });
  let lastPreviewMaskTime = 0;

  // A faint irregularly shaped lobe with a long, natural falloff.
  function paintPreviewLobe(ctx, x, y, rx, ry, tilt, strength = 1) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(tilt);
    ctx.scale(rx, ry);
    const grad = ctx.createRadialGradient(0, 0, .05, 0, 0, 1);
    grad.addColorStop(0, `rgba(255,255,255,${strength})`);
    grad.addColorStop(.35, `rgba(255,255,255,${strength})`);
    grad.addColorStop(.53, `rgba(255,255,255,${strength * .94})`);
    grad.addColorStop(.68, `rgba(255,255,255,${strength * .62})`);
    grad.addColorStop(.80, `rgba(255,255,255,${strength * .26})`);
    grad.addColorStop(.91, `rgba(255,255,255,${strength * .06})`);
    grad.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = grad;
    ctx.fillRect(-1, -1, 2, 2);
    ctx.restore();
  }

  // Erase the space around a projected constellation connection, with feathering.
  function erasePreviewLine(ctx, a, b, width = 8) {
    const stroke = (px, opacity) => {
      ctx.strokeStyle = `rgba(0,0,0,${opacity})`;
      ctx.lineWidth = px;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    };
    stroke(width + 28, .12);
    stroke(width + 20, .24);
    stroke(width + 13, .45);
    stroke(width + 7, .78);
    stroke(width, 1);
  }

  function erasePreviewCircle(ctx, x, y, radius) {
    const grad = ctx.createRadialGradient(x, y, 0, x, y, radius + 15);
    grad.addColorStop(0, "rgba(0,0,0,1)");
    grad.addColorStop(radius / (radius + 15), "rgba(0,0,0,1)");
    grad.addColorStop((radius + 7) / (radius + 15), "rgba(0,0,0,.46)");
    grad.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, radius + 15, 0, Math.PI * 2);
    ctx.fill();
  }

  function erasePreviewLabel(ctx, x, y, w, h) {
    // A soft rectangular safety band around actual lettering (not the
    // entire generously wide button / label hit area).
    const draw = (pad, opacity) => {
      ctx.fillStyle = `rgba(0,0,0,${opacity})`;
      ctx.beginPath();
      ctx.roundRect(x - pad, y - pad, w + pad * 2, h + pad * 2, 7 + pad);
      ctx.fill();
    };
    draw(18, .14);
    draw(13, .28);
    draw(9, .52);
    draw(6, 1);
  }

  function collectPreviewObstacles() {
    const stars = [];
    const labels = [];
    const fontMeasureCtx = previewMaskCtx;

    exploreCamera.querySelectorAll(".space-node").forEach(node => {
      const rect = node.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const project = node.classList.contains("project-node");
      const decorative = node.classList.contains("decorative-node");
      const star = node.querySelector(".node-star");
      const starCenterX = rect.left + rect.width / 2;
      const starCenterY = rect.top + rect.height * .44;
      const relativeDepth = star ? Number.parseFloat(getComputedStyle(star).scale) || 1 : 1;
      const trueSize = relativeDepth * cameraCurrent;
      // Reserve space for the full white star strokes and a soft light margin.
      const radius = decorative ? Math.max(9, 7 * trueSize + 4)
        : project ? Math.max(20, 18 * trueSize + 12)
        : Math.max(17, 12 * trueSize + 11);
      stars.push({ x: starCenterX, y: starCenterY, radius });

      const label = node.querySelector(".node-label");
      if (!label) return;
      const lb = label.getBoundingClientRect();
      const computed = getComputedStyle(label);
      fontMeasureCtx.font = `${computed.fontWeight} ${computed.fontSize} ${computed.fontFamily}`;
      const longest = (label.innerText || label.textContent || "")
        .split(/\r?\n/).reduce((max, line) => Math.max(max, fontMeasureCtx.measureText(line).width), 0);
      const hovered = node.matches(":hover") || node.matches(":focus-visible");
      const visibleW = Math.min(lb.width, longest * (hovered ? 1.5 : 1) + 8);
      labels.push({
        x: lb.left + (lb.width - visibleW) / 2,
        y: lb.top,
        w: visibleW,
        h: lb.height
      });
    });

    // Paths use viewBox coordinates, converted through the actual SVG CTM.
    const segments = [];
    const svg = exploreCamera.querySelector(".map-lines");
    const ctm = svg?.getScreenCTM();
    if (ctm) {
      svg.querySelectorAll("path").forEach(path => {
        const raw = path.getAttribute("d") || "";
        const pairs = [...raw.matchAll(/(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)/g)]
          .map(match => {
            const x = +match[1], y = +match[2];
            return { x: ctm.a * x + ctm.c * y + ctm.e,
                     y: ctm.b * x + ctm.d * y + ctm.f };
          });
        for (let i = 1; i < pairs.length; i++) {
          segments.push([pairs[i-1], pairs[i]]);
        }
      });
    }
    return { stars, labels, segments };
  }

  function refreshPreviewSafetyMasks(force = false) {
    // When the images are invisible, postpone raster work until next hover.
    if (activePreviewZone === null || !previewMaskCtx) return;
    const now = performance.now();
    if (!force && now - lastPreviewMaskTime < 36) return;
    lastPreviewMaskTime = now;

    const { stars, labels, segments } = collectPreviewObstacles();
    for (const [zone, state] of previewSlots) {
      if (zone !== activePreviewZone) continue;
      const slot = state.slot;
      const sr = slot.getBoundingClientRect();
      const w = Math.round(sr.width), h = Math.round(sr.height);
      if (!w || !h) continue;
      if (previewMaskCanvas.width !== w) previewMaskCanvas.width = w;
      if (previewMaskCanvas.height !== h) previewMaskCanvas.height = h;
      const ctx = previewMaskCtx;
      ctx.clearRect(0, 0, w, h);

      // Gentle asymmetric organic morph in response to depth scrolling.
      const morph = Math.max(-1, Math.min(1, (cameraCurrent - 1) / .55));
      paintPreviewLobe(ctx, w * (.47 + morph * .025), h * .48,
        w * .47, h * .49, -.13 + morph * .07, 1);
      paintPreviewLobe(ctx, w * (.61 - morph * .035), h * (.46 + morph * .025),
        w * .34, h * .42, .28 - morph * .11, .91);
      paintPreviewLobe(ctx, w * (.37 + morph * .02), h * (.64 - morph * .035),
        w * .35, h * .34, -.23 + morph * .12, .81);

      // All obstacle coordinates here are SCREEN pixels relative to the slot.
      ctx.globalCompositeOperation = "destination-out";
      for (const [a, b] of segments) {
        erasePreviewLine(ctx,
          { x: a.x - sr.left, y: a.y - sr.top },
          { x: b.x - sr.left, y: b.y - sr.top });
      }
      for (const label of labels) {
        erasePreviewLabel(ctx,
          label.x - sr.left, label.y - sr.top, label.w, label.h);
      }
      for (const star of stars) {
        erasePreviewCircle(ctx,
          star.x - sr.left, star.y - sr.top, star.radius);
      }
      ctx.globalCompositeOperation = "source-over";
      // Both CSS mask-image spellings are required for Chromium/Safari.
      const image = `url("${previewMaskCanvas.toDataURL("image/png")}")`;
      slot.style.maskImage = image;
      slot.style.webkitMaskImage = image;
      slot.classList.add("is-safety-masked");
    }
  }

  /* ============================================================
     Explore camera — mouse wheel moves forward / backward
     ============================================================ */

  const exploreCamera = document.getElementById("exploreCamera");
  const zoomMinimum = 0.44;
  const zoomMaximum = 1.95;
  const zoomSensitivity = 0.00068;
  const zoomEaseMs = 180;

  let cameraTarget = zoomMinimum;
  let cameraCurrent = zoomMinimum;
  let cameraFrame = 0;
  let cameraLastTime = 0;

  /*
    V30 — shared 3D world / camera travel
    ------------------------------------
    Every object sits at a fixed world-space (X,Y,Z). Moving the camera along Z
    increases its apparent size AND its radial position by exactly the same
    physical projection factor:  scale = Z / (Z - cameraZ).

    Projects, navigation stars and the surrounding canvas dust all share this
    equation and vanishing point. No individual star is capped to a rectangle
    and no object is clamped to a common visual size at the forward limit.
  */
  const projectDepth = {
    gta:    1.55,  // near project — strongest response
    seven:  3.86,  // distant small accent — stays smaller
    bugs:   2.05,
    hwalok: 2.56,
    naver:  3.10,
    aladin: 4.42   // farthest
  };
  const infoDepth = {
    profile: 4.45,
    skill: 4.90,
    contact: 4.68
  };

  /*
    All H stars share the same actual intrinsic glyph size; a *world-space*
    size weight is derived from Z. This ensures near > far for the entire
    allowed camera travel, including the backward endpoint. The old formula
    used equal sizes at neutral and caused order reversals behind the camera.
    alpha=0.72 preserves near > far even at the expanded -1.75 endpoint.
  */
  function projectWorldSizeWeight(z) {
    return Math.pow(2.45 / z, .72);
  }


  /*
    V31 — protect the H silhouette without flattening its depth.
    The camera still uses real Z for each project's STAR/GLOW size.
    Only the projected XY anchors are gently drawn toward a shared H plane.
    The two waist nodes (NAVER / 7ELEVEN) follow that plane most closely,
    preserving the original slightly angled horizontal crossbar.
    All positions remain continuous with wheel travel; no clamping/edges.
  */
  const hShapePlaneDepth = 3.65;
  const hIndependentParallax = {
    bugs: .15,
    naver: .04,
    gta: .15,
    aladin: .15,
    seven: .04,
    hwalok: .15
  };
  const backgroundAnchorDepth = 4.78;
  const forwardTravel = .85;
  const backwardTravel = -1.75;

  // Map the established V29 wheel extent onto actual camera-space travel.
  // Both endpoints are inside the near plane of the closest project / dust.
  function getCameraTravel(cameraScale) {
    return cameraScale >= 1
      ? ((cameraScale - 1) / (zoomMaximum - 1)) * forwardTravel
      : ((1 - cameraScale) / (1 - zoomMinimum)) * backwardTravel;
  }

  const depthNodes = new Map(
    [...document.querySelectorAll(".explore-layer .project-node[data-project]")]
      .map(node => [node.dataset.project, {
        node,
        baseX: Number.parseFloat(node.style.getPropertyValue("--x")),
        baseY: Number.parseFloat(node.style.getPropertyValue("--y")),
        z: projectDepth[node.dataset.project] ?? 2.5
      }])
  );

  /* ============================================================
     V41 — project star -> orbital thumbnail metamorphosis
     ============================================================
     The camera still owns XYZ position and apparent size. Only the existing
     five-point glyph's silhouette and its inner thumbnail are changed.
     The twenty-point contour interpolates continuously from five sharp
     points (including edge midpoints) to a smooth circular polygon.
     Distinct morph thresholds retain the near/far hierarchy.
  */
  const baseStarVertices = [
    [50, 0], [61, 36], [98, 36], [68, 59], [79, 96],
    [50, 74], [21, 96], [32, 59], [2, 36], [39, 36]
  ];
  const sharpContour = [];
  const roundContour = [];
  for (let i = 0; i < baseStarVertices.length; i++) {
    const vertex = baseStarVertices[i];
    const next = baseStarVertices[(i + 1) % baseStarVertices.length];
    sharpContour.push(vertex, [(vertex[0] + next[0]) / 2, (vertex[1] + next[1]) / 2]);
  }
  for (let i = 0; i < sharpContour.length; i++) {
    const angle = (-90 + i * 360 / sharpContour.length) * Math.PI / 180;
    roundContour.push([50 + Math.cos(angle) * 48, 50 + Math.sin(angle) * 48]);
  }

  const clamp01 = value => Math.max(0, Math.min(1, value));
  const smoothstep01 = value => {
    const p = clamp01(value);
    return p * p * (3 - 2 * p);
  };

  function setProjectStarMorph(star, morph) {
    const points = sharpContour.map((point, i) => {
      const x = point[0] + (roundContour[i][0] - point[0]) * morph;
      const y = point[1] + (roundContour[i][1] - point[1]) * morph;
      return `${x.toFixed(2)}% ${y.toFixed(2)}%`;
    });
    star.style.setProperty('--project-star-clip', `polygon(${points.join(',')})`);
    star.style.setProperty('--project-orb-opacity', (morph * .67).toFixed(3));
    star.style.setProperty('--project-star-opacity', (1 - morph * .75).toFixed(3));
    star.style.setProperty('--project-orb-ring', (morph * .5).toFixed(3));
  }

  // Thumbnail sources are reused from the existing six projects.
  depthNodes.forEach((data, key) => {
    data.starGlyph = data.node.querySelector('.node-star--project');
    if (!data.starGlyph) return;
    data.starGlyph.style.setProperty('--project-orb-image', `url("${PROJECTS[key].image}")`);
    setProjectStarMorph(data.starGlyph, 0);
  });

  const infoDepthNodes = [...exploreCamera.querySelectorAll('.info-node, .decorative-node')].map(node => ({
    node,
    baseX: Number.parseFloat(node.style.getPropertyValue('--x')),
    baseY: Number.parseFloat(node.style.getPropertyValue('--y')),
    z: infoDepth[node.dataset.node] ?? backgroundAnchorDepth
  }));

  // SVG order: S, H-left, H-right, H-crossbar.
  const depthLines = [...exploreCamera.querySelectorAll(".map-lines path")];

  function projectWorldPoint(xPercent, yPercent, z, cameraZ) {
    const scale = perspectiveScale(z, cameraZ);
    // The shared vanishing point is focused toward the H projects.
    // This avoids the previous 7ELEVEN's excessively long horizontal route,
    // while retaining physically consistent 3D movement for everything.
    return {
      x: 63 + (xPercent - 63) * scale,
      y: 52 + (yPercent - 52) * scale,
      scale
    };
  }

  // V34: constellation stars (projects, info, and decorative nodes) use
  // only camera perspective. Mouse avoidance belongs to ambient dust only.
  // As a result, their connecting SVG lines stay perfectly anchored too.

  function applyExploreDepth() {
    const cameraZ = getCameraTravel(cameraCurrent);

    // Preview images remain in the original two negative spaces.
    // Their adaptive feathered masks still carve around projected labels,
    // connecting paths and star glows in LIVE screen coordinates.
    for (const [zone, state] of previewSlots) {
      const anchor = previewBaseAnchors.get(zone);
      if (!anchor) continue;
      state.slot.style.left = `${anchor.x}%`;
      state.slot.style.top = `${anchor.y}%`;
      state.slot.style.setProperty('--preview-counter-scale', '1');
    }

    // Text has constant SCREEN font size, even though its XY anchor moves in 3D.
    exploreCamera.style.setProperty('--label-counter-scale', '1');
    const infoPoints = [];

    infoDepthNodes.forEach(data => {
      const projected = projectWorldPoint(data.baseX, data.baseY, data.z, cameraZ);
      const p = projected;
      data.node.style.left = `${p.x.toFixed(5)}%`;
      data.node.style.top = `${p.y.toFixed(5)}%`;
      data.node.style.setProperty('--info-depth-relative', p.scale.toFixed(6));
      // Keep Profile/Skill/Contact labels a constant offset from their stars.
      data.node.style.setProperty('--info-label-top', '64%');
      infoPoints.push(p);
    });

    const positions = {};
    depthNodes.forEach((data, key) => {
      const natural = projectWorldPoint(data.baseX, data.baseY, data.z, cameraZ);
      const grouped = projectWorldPoint(data.baseX, data.baseY, hShapePlaneDepth, cameraZ);
      const parallax = hIndependentParallax[key] ?? .15;
      const shapePreserving = {
        // Stabilise H geometry, especially the shared NAVER–7ELEVEN waist.
        x: grouped.x + (natural.x - grouped.x) * parallax,
        y: grouped.y + (natural.y - grouped.y) * parallax
      };
      const p = shapePreserving;

      positions[key] = p;
      data.node.style.left = `${p.x.toFixed(5)}%`;
      data.node.style.top = `${p.y.toFixed(5)}%`;
      // Monotonic world-depth size: a closer star never becomes smaller
      // than a farther one, at any wheel position (front or back).
      // 7ELEVEN deliberately remains a small, distant visual accent even
      // when the camera moves forward. All other projects keep V32 sizes.
      const worldSize = projectWorldSizeWeight(data.z) * (key === 'seven' ? .67 : 1);
      const naverSize = projectWorldSizeWeight(projectDepth.naver) *
        perspectiveScale(projectDepth.naver, cameraZ);
      // Bugs and GTA keep visually balanced, exact ratios to NAVER at ANY zoom.
      // Their 3D positional parallax and all other projects' depths are preserved.
      const visualScale = key === 'bugs' ? naverSize * 1.5
        : key === 'gta' ? naverSize * 1.3
        : worldSize * natural.scale;
      data.node.style.setProperty('--depth-relative', visualScale.toFixed(6));

      // Build the circular thumbnail only when the camera gets close.
      // Near projects morph first; distant projects follow later. At the
      // far endpoint every project remains a crisp five-point star.
      const cameraProgress = clamp01(
        (cameraZ - backwardTravel) / (forwardTravel - backwardTravel)
      );
      const distanceRank = clamp01((data.z - 1.55) / (4.42 - 1.55));
      const morphStart = .43 + distanceRank * .17;
      const orbMorph = smoothstep01(
        (cameraProgress - morphStart) / (1 - morphStart)
      );
      if (data.starGlyph) setProjectStarMorph(data.starGlyph, orbMorph);

      // As a five-point star grows, keep its visible bottom clear of its title.
      // Title font remains fixed; only the label anchor can move down as needed.
      const nativeDiameter = Math.min(42.4, Math.max(23.2, innerWidth * .026));
      const nodeHeight = data.node.offsetHeight;
      const requiredTop = nodeHeight * .44 + nativeDiameter * visualScale * .5 + 12;
      data.node.style.setProperty('--project-label-top',
        `${Math.max(nodeHeight * .72, requiredTop).toFixed(2)}px`);
      // Distant project labels gently breathe brighter while camera approaches.
      const farStrength = Math.max(0, Math.min(1, (data.z - cameraZ - 1.55) / 4.9));
      data.node.style.setProperty('--far-label-strength', farStrength.toFixed(4));
    });

    // Lines go through exactly the same projected XYZ anchors as the stars.
    const xy = point => `${(point.x * 14.4).toFixed(2)} ${(point.y * 10.24).toFixed(2)}`;
    const p = key => xy(positions[key]);
    if (depthLines.length >= 4) {
      if (infoPoints.length === 5) {
        depthLines[0].setAttribute('d', `M${infoPoints.map(xy).join(' L')}`);
      }
      depthLines[1].setAttribute('d', `M${p('bugs')} L${p('naver')} L${p('gta')}`);
      depthLines[2].setAttribute('d', `M${p('aladin')} L${p('seven')} L${p('hwalok')}`);
      depthLines[3].setAttribute('d', `M${p('naver')} L${p('seven')}`);
    }
  }

  function updateExploreCamera(now) {
    const deltaTime = cameraLastTime ? Math.min(now - cameraLastTime, 64) : 16.7;
    cameraLastTime = now;

    // Framerate-independent easing: trackpads and wheel mice feel consistent.
    const factor = 1 - Math.exp(-deltaTime / zoomEaseMs);
    cameraCurrent += (cameraTarget - cameraCurrent) * factor;

    if (Math.abs(cameraTarget - cameraCurrent) < 0.0003) {
      cameraCurrent = cameraTarget;
    }

    // The camera moves through space; the scene itself is NOT uniformly scaled.
    exploreCamera.style.transform = 'none';
    applyExploreDepth();
    refreshPreviewSafetyMasks();

    // Ambient dust is animated by renderStars() on its own frame loop.
    // Moving the pointer should never trigger a constellation re-projection.
    if (cameraCurrent !== cameraTarget) {
      cameraFrame = requestAnimationFrame(updateExploreCamera);
    } else {
      cameraFrame = 0;
      cameraLastTime = 0;
    }
  }

  function isExploreCameraActive() {
    return currentView === "explore" &&
      portfolio.classList.contains("is-active") &&
      portfolio.classList.contains("has-entered") &&
      !document.getElementById("modal").classList.contains("is-open");
  }

  function onExploreWheel(event) {
    // Only Explore uses scrolling as a depth control. Keep browser pinch-zoom,
    // List scrolling and modal/intro behavior unchanged.
    if (!isExploreCameraActive() || event.ctrlKey || event.metaKey) return;
    if (!event.deltaY) return;
    if (event.target.closest?.('input, textarea, select, [contenteditable="true"]')) return;

    event.preventDefault();

    // DOM_DELTA_PIXEL=0 / LINE=1 / PAGE=2; clamp one huge wheel spike.
    const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? innerHeight : 1;
    const delta = Math.max(-380, Math.min(380, event.deltaY * unit));
    cameraTarget = Math.max(
      zoomMinimum,
      Math.min(zoomMaximum, cameraTarget * Math.exp(delta * zoomSensitivity))
    );

    if (!cameraFrame) {
      cameraFrame = requestAnimationFrame(updateExploreCamera);
    }
  }

  // Mouse-following field affects ONLY small background particles.
  // Project, Profile, Skill, Contact, decorative nodes and their lines are inert.
  window.addEventListener('pointermove', event => {
    if (event.pointerType && event.pointerType !== 'mouse' && event.pointerType !== 'pen') return;
    starAvoid.targetX = event.clientX;
    starAvoid.targetY = event.clientY;
    starAvoid.targetStrength = 1;
  }, { passive: true });

  const withdrawStarAvoidance = () => {
    starAvoid.targetStrength = 0;
  };
  document.addEventListener('pointerleave', withdrawStarAvoidance);
  window.addEventListener('blur', withdrawStarAvoidance);

  // Neutral camera: preserve every original star and line coordinate.
  applyExploreDepth();
  window.addEventListener("resize", () => {
    applyExploreDepth();
    refreshPreviewSafetyMasks(true);
  }, { passive: true });

  // non-passive is required to prevent ordinary page scrolling in Explore.
  window.addEventListener("wheel", onExploreWheel, { passive: false });

  function setView(next) {
    if (next === currentView) return;
    currentView = next;
    portfolio.dataset.view = next;
    document.body.classList.toggle("is-list-view", next === "list");

    viewButtons.forEach(btn => {
      const selected = btn.dataset.view === next;
      btn.classList.toggle("is-selected", selected);
      btn.setAttribute("aria-pressed", String(selected));
    });

    listLayer.setAttribute("aria-hidden", String(next !== "list"));

    if (next === "list") {
      // List must appear immediately in the current first viewport.
      window.scrollTo(0, 0);
      hideAllProjectPreviews();

      // Re-run the entrance stagger. After each card finishes,
      // `is-hover-ready` releases transform control back to hover.
      projectCards.forEach(card => {
        card.classList.remove("is-hover-ready");
        card.style.animation = "none";
      });
      void listLayer.offsetWidth;
      projectCards.forEach(card => {
        card.style.animation = "";
      });
    }

    if (next === "explore") {
      // Re-trigger the node entrance after the List cards leave.
      const nodes = [...document.querySelectorAll(".space-node")];
      nodes.forEach(n => {
        n.style.animation = "none";
        void n.offsetWidth;
        n.style.animation = "";
      });
    }
  }

  viewButtons.forEach(btn => {
    btn.addEventListener("click", () => setView(btn.dataset.view));
  });

  /* ============================================================
     Forward-flying modal
     ============================================================ */

  const modal = document.getElementById("modal");
  const modalPanel = document.getElementById("modalPanel");
  const modalClose = document.getElementById("modalClose");
  const modalEyebrow = document.getElementById("modalEyebrow");
  const modalTitle = document.getElementById("modalTitle");
  const modalBody = document.getElementById("modalBody");
  const modalPeriod = document.getElementById("modalPeriod");
  const modalRole = document.getElementById("modalRole");
  const modalLead = document.getElementById("modalLead");
  const modalImageAmbient = document.getElementById("modalImageAmbient");
  const modalMedia = document.getElementById("modalMedia");
  const modalImage = document.getElementById("modalImage");
  const modalBackdrop = modal.querySelector(".modal-backdrop");
  let lastTrigger = null;
  let panelAnimation = null;
  let modalClosingTimer = null;

  // Skill arcs are retriggered on each modal opening and cancelled on close.
  // No timing or behavior in project / Profile / Contact modals is changed.
  let skillRingTimer = null;
  function resetSkillRings() {
    clearTimeout(skillRingTimer);
    skillRingTimer = null;
    modalPanel.classList.remove("is-skill-rings-active");
  }
  function scheduleSkillRings() {
    resetSkillRings();
    skillRingTimer = setTimeout(() => {
      if (modal.classList.contains("is-open") && modalPanel.classList.contains("is-skill")) {
        modalPanel.classList.add("is-skill-rings-active");
      }
      skillRingTimer = null;
    }, 800);
  }

  // Contact reveal is deliberately sequenced AFTER the flying modal has
  // completed its full 1,240ms opening animation. Nothing moves during flight.
  let contactFlashTimer = null;
  let contactFlashCleanup = null;

  function resetContactFlash() {
    clearTimeout(contactFlashTimer);
    clearTimeout(contactFlashCleanup);
    contactFlashTimer = contactFlashCleanup = null;
    modalPanel.classList.remove('is-contact-revealed', 'is-contact-flashing',
      'is-contact-emphasized');
  }

  // In the unrevealed state the mail and call icons form a vertically stacked
  // pair at the horizontal center of the Contact details area (responsive).
  function positionContactIconsAtCenter() {
    const details = modalPanel.querySelector('.contact-panel-details');
    const icon = details?.querySelector('.contact-panel-icon');
    if (!details || !icon) return;
    const detailsWidth = details.getBoundingClientRect().width;
    const iconWidth = icon.getBoundingClientRect().width;
    const offset = Math.max(0, (detailsWidth - iconWidth) / 2);
    modalPanel.style.setProperty('--contact-icon-center-offset', `${offset}px`);
  }

  function startContactEntrance() {
    if (!modal.classList.contains('is-open') ||
        modal.classList.contains('is-closing') ||
        !modalPanel.classList.contains('is-contact')) return;

    // Both icons travel left at once while both pieces of contact text wipe
    // from left to right. They have matched, non-staggered durations.
    modalPanel.classList.add('is-contact-revealed');

    // The previous movement has now finished; persist the smaller 1.10x
    // emphasis until close, with one gentle five-second glimmer.
    clearTimeout(contactFlashTimer);
    contactFlashTimer = setTimeout(() => {
      if (!modal.classList.contains('is-open') ||
          modal.classList.contains('is-closing') ||
          !modalPanel.classList.contains('is-contact')) return;
      modalPanel.classList.add('is-contact-emphasized', 'is-contact-flashing');
      contactFlashCleanup = setTimeout(() => {
        modalPanel.classList.remove('is-contact-flashing');
        contactFlashCleanup = null;
      }, 5050);
      contactFlashTimer = null;
    }, 1050);
  }

  function fillModal(key) {
    const data = PROJECTS[key] || PROJECTS.profile;
    const hasImage = Boolean(data.image);

    modalEyebrow.textContent = data.eyebrow;
    modalTitle.textContent = data.title;
    modalPeriod.textContent = data.period ? `작업기간 : ${data.period}` : "";
    modalRole.textContent = data.role || "";
    modalLead.textContent = data.lead || "";
    modalBody.textContent = data.body;

    modalPanel.classList.toggle("is-info", !hasImage);
    // Only Profile gets the new screenshot-matched layout.
    modalPanel.classList.toggle("is-profile", key === "profile");
    modalPanel.classList.toggle("is-skill", key === "skill");
    modalPanel.classList.toggle("is-contact", key === "contact");
    resetSkillRings();
    resetContactFlash();
    modalPanel.setAttribute("aria-labelledby", key === "profile" ? "profileModalTitle" : key === "skill" ? "skillModalTitle" : key === "contact" ? "contactModalTitle" : "modalTitle");
    modalMedia.hidden = !hasImage;
    modalPeriod.hidden = !data.period;
    modalRole.hidden = !data.role;
    modalLead.hidden = !data.lead;

    if (hasImage) {
      modalMedia.classList.toggle("is-square-source", key !== "bugs");
      modalImage.src = data.image;
      modalImage.alt = `${data.title} 프로젝트 이미지`;
      modalImageAmbient.src = data.image;
    } else {
      modalImage.removeAttribute("src");
      modalImage.alt = "";
      modalImageAmbient.removeAttribute("src");
    }
  }

  addEventListener('resize', () => {
    if (modal.classList.contains('is-open') && modalPanel.classList.contains('is-contact')) {
      positionContactIconsAtCenter();
    }
  }, { passive: true });

  // Always keep a project title on one line: contract size/letter spacing
  // to the available overview column rather than inserting a line break.
  function fitProjectModalTitle() {
    if (modalPanel.classList.contains('is-info')) return;
    modalTitle.style.fontSize = '';
    modalTitle.style.letterSpacing = '';
    const initial = Number.parseFloat(getComputedStyle(modalTitle).fontSize) || 34;
    const minSize = innerWidth <= 700 ? 12 : 15;
    let size = initial;
    let tracking = -.035;
    while (modalTitle.scrollWidth > modalTitle.clientWidth + 1 && size > minSize) {
      size = Math.max(minSize, size - .5);
      tracking = Math.max(-.065, tracking - .001);
      modalTitle.style.fontSize = `${size}px`;
      modalTitle.style.letterSpacing = `${tracking}em`;
    }
  }
  addEventListener('resize', () => {
    if (modal.classList.contains('is-open')) fitProjectModalTitle();
  }, { passive: true });

  function openModal(trigger, key) {
    lastTrigger = trigger;
    fillModal(key);

    const r = trigger.getBoundingClientRect();
    const startX = r.left + r.width / 2 - innerWidth / 2;
    const startY = r.top + r.height / 2 - innerHeight / 2;

    clearTimeout(modalClosingTimer);
    modalClosingTimer = null;
    modal.classList.remove("is-closing");
    // Cancel WAAPI remnants from previous versions/interruptions so the
    // full-screen backdrop is controlled only by CSS opacity/filter.
    modalBackdrop.getAnimations().forEach(animation => animation.cancel());
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    if (PROJECTS[key]?.image) fitProjectModalTitle();
    document.body.style.overflow = "hidden";

    // Stop any filled/unfinished previous panel animation before measuring
    // layout, otherwise an old scale transform corrupts the centered offset.
    panelAnimation?.cancel();

    if (key === "skill") scheduleSkillRings();
    if (key === "contact") positionContactIconsAtCenter();

    // Softer approach: less extreme scale/Z distance + longer interpolation.
    panelAnimation = modalPanel.animate(
      [
        {
          transform: `translate3d(${startX}px, ${startY}px, -380px) scale(.28) rotateX(2deg)`,
          opacity: .18,
          filter: "blur(8px)"
        },
        {
          offset: .38,
          transform: `translate3d(${startX * .54}px, ${startY * .54}px, -185px) scale(.58) rotateX(1deg)`,
          opacity: .62,
          filter: "blur(4px)"
        },
        {
          offset: .76,
          transform: `translate3d(${startX * .12}px, ${startY * .12}px, -35px) scale(.94) rotateX(.25deg)`,
          opacity: .94,
          filter: "blur(.8px)"
        },
        {
          transform: "translate3d(0,0,0) scale(1) rotateX(0deg)",
          opacity: 1,
          filter: "blur(0px)"
        }
      ],
      {
        duration: 1240,
        easing: "cubic-bezier(.22,.66,.24,1)",
        fill: "both"
      }
    );

    // Delay the contact animation until the modal is visibly, completely
    // open. `finished` also prevents early starts on slow frames or background
    // tabs; cancelled entrances (e.g. closing early) never reveal anything.
    if (key === "contact") {
      const openingAnimation = panelAnimation;
      openingAnimation.finished.then(() => {
        if (panelAnimation !== openingAnimation) return;
        startContactEntrance();
      }).catch(() => {});
    }

    modalClose.focus({ preventScroll: true });
  }

  function closeModal() {
    if (!modal.classList.contains("is-open") || modal.classList.contains("is-closing")) return;

    // When Skill is reopened the ring must start fully empty again.
    if (modalPanel.classList.contains("is-skill")) resetSkillRings();
    if (modalPanel.classList.contains("is-contact")) resetContactFlash();

    const target = lastTrigger?.getBoundingClientRect();
    const endX = target ? target.left + target.width / 2 - innerWidth / 2 : 0;
    const endY = target ? target.top + target.height / 2 - innerHeight / 2 : 0;

    panelAnimation?.cancel();

    // Reverse the same CSS transition for backdrop: 20% dark / 16px blur -> clear.
    // Preserve the modal in the DOM until the full fade has finished.
    modal.classList.add('is-closing');

    panelAnimation = modalPanel.animate(
      [
        { transform: "translate3d(0,0,0) scale(1)", opacity: 1, filter: "blur(0)" },
        {
          offset: .62,
          transform: `translate3d(${endX * .38}px,${endY * .38}px,-95px) scale(.72)`,
          opacity: .66,
          filter: "blur(2.5px)"
        },
        {
          transform: `translate3d(${endX}px,${endY}px,-360px) scale(.28)`,
          opacity: 0,
          filter: "blur(7px)"
        }
      ],
      {
        duration: 760,
        easing: "cubic-bezier(.4,0,.2,1)",
        fill: "forwards"
      }
    );

    modalClosingTimer = setTimeout(() => {
      modal.classList.remove('is-open', 'is-closing');
      modal.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
      modalPanel.style.transform = '';
      modalPanel.style.opacity = '';
      modalBackdrop.getAnimations().forEach(animation => animation.cancel());
      lastTrigger?.focus?.({ preventScroll: true });
      modalClosingTimer = null;
    }, 1110);
  }

  document.querySelectorAll("[data-project]").forEach(el => {
    el.addEventListener("click", () => openModal(el, el.dataset.project));
  });

  document.querySelectorAll("[data-node]").forEach(el => {
    el.addEventListener("click", () => openModal(el, el.dataset.node));
  });

  modalClose.addEventListener("click", closeModal);
  modalBackdrop.addEventListener("click", closeModal);

  addEventListener("keydown", e => {
    if (e.key === "Escape") closeModal();
  });

  // Optional test URLs: ?skip=1&view=list or ?skip=1&modal=bugs
  const testParams = new URLSearchParams(location.search);
  if (testParams.get("skip") === "1") {
    setTimeout(() => flyLogoToHeader(true), 60);
  }
  if (testParams.get("view") === "list") {
    setTimeout(() => setView("list"), 950);
  }
  if (testParams.get("modal")) {
    const key = testParams.get("modal");
    setTimeout(() => {
      const trigger = document.querySelector(`[data-project="${key}"], [data-node="${key}"]`);
      if (trigger) openModal(trigger, key);
    }, 1250);
  }

  /* Keep brand click from jumping the page while this prototype is single-page. */
  document.querySelector(".brand").addEventListener("click", e => e.preventDefault());
})();
