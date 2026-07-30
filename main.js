/* =========================================================
   Dvij — Portfolio interactions (enhanced)
   Vanilla JS + Three.js + GSAP + Lenis. No build step.
   Premium 3D · fluid animations · mobile-aware
   ========================================================= */
(() => {
  'use strict';
  const prefersReduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isTouch = matchMedia('(hover: none)').matches;
  const mqMobile = matchMedia('(max-width: 820px)');
  const $  = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];

  document.documentElement.classList.add('is-ready');
  $('[data-year]').textContent = new Date().getFullYear();

  /* ---------- LOADER: 3D DNA HELIX (2D canvas, manual projection) ---------- */
  let progress = 0;
  let loaderCleanup = null;
  function initLoaderScene() {
    const canvas = $('[data-loader-canvas]');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    function resize() { canvas.width = innerWidth; canvas.height = innerHeight; }
    resize();
    addEventListener('resize', resize);

    const FOV = 300;
    let ry = 0; // rotation Y angle
    let active = true;
    const N = 90;  // points per strand
    const R = 80;  // helix radius
    const TURNS = 3;
    const H = 240; // helix height

    // 3D rotate around Y axis
    const rotY = (x, z, a) => ({ x: x*Math.cos(a) - z*Math.sin(a), z: x*Math.sin(a) + z*Math.cos(a) });
    // Perspective project
    const proj = (x, y, z) => { const s = FOV / (FOV + z + 120); return { x: canvas.width/2 + x*s, y: canvas.height/2 + y*s, s }; };

    // Build helix points (2 strands)
    function strandPt(i, strand, scale) {
      const t  = (i / N) * Math.PI * 2 * TURNS;
      const sx = R * scale * Math.cos(t + strand * Math.PI);
      const sy = -H/2 + (i/N) * H;
      const sz = R * scale * Math.sin(t + strand * Math.PI);
      const rr = rotY(sx, sz, ry);
      return proj(rr.x, sy, rr.z);
    }

    // Ambient floating dots
    const AMB = 55;
    const amb = Array.from({length: AMB}, () => ({
      x:(Math.random()-.5)*420, y:(Math.random()-.5)*320, z:(Math.random()-.5)*180,
      op: 0.08 + Math.random()*0.18, spd: 0.4 + Math.random()*0.8
    }));

    function draw(time) {
      if (!active) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ry = time * 0.00045;
      const p = progress / 100;
      const scale = 1 - p * 0.38; // helix radius shrinks as progress rises

      // Draw both strands
      for (let strand = 0; strand < 2; strand++) {
        const pts = Array.from({length: N+1}, (_, i) => strandPt(i, strand, scale));

        // Strand spine line
        ctx.beginPath();
        pts.forEach((pt, i) => i===0 ? ctx.moveTo(pt.x,pt.y) : ctx.lineTo(pt.x,pt.y));
        ctx.strokeStyle = `rgba(255,${strand===0?70:130},28,0.18)`;
        ctx.lineWidth = 0.9;
        ctx.stroke();

        // Glow dots
        pts.forEach(pt => {
          const g = ctx.createRadialGradient(pt.x,pt.y,0,pt.x,pt.y,pt.s*9);
          g.addColorStop(0, `rgba(255,${strand===0?77:138},28,${0.25 + p*0.55})`);
          g.addColorStop(1, 'rgba(255,77,28,0)');
          ctx.beginPath(); ctx.arc(pt.x,pt.y,pt.s*9,0,Math.PI*2);
          ctx.fillStyle=g; ctx.fill();
          ctx.beginPath(); ctx.arc(pt.x,pt.y,pt.s*1.6,0,Math.PI*2);
          ctx.fillStyle=`rgba(255,${strand===0?100:160},60,${0.5+p*0.4})`; ctx.fill();
        });
      }

      // Cross-rungs (DNA ladder)
      const STEP = 6;
      for (let i = 0; i <= N; i += STEP) {
        const a = strandPt(i, 0, scale);
        const b = strandPt(i, 1, scale);
        const grad = ctx.createLinearGradient(a.x, a.y, b.x, b.y);
        grad.addColorStop(0, `rgba(255,100,28,${0.08 + p*0.14})`);
        grad.addColorStop(0.5, `rgba(255,160,80,${0.14 + p*0.18})`);
        grad.addColorStop(1, `rgba(255,100,28,${0.08 + p*0.14})`);
        ctx.beginPath(); ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y);
        ctx.strokeStyle = grad; ctx.lineWidth = 0.7; ctx.stroke();
      }

      // Ambient particles
      amb.forEach(pt => {
        const a = ry * pt.spd;
        const rx2 = pt.x*Math.cos(a) - pt.z*Math.sin(a);
        const rz2 = pt.x*Math.sin(a) + pt.z*Math.cos(a);
        const p2 = proj(rx2, pt.y, rz2);
        const g = ctx.createRadialGradient(p2.x,p2.y,0,p2.x,p2.y,p2.s*7);
        g.addColorStop(0, `rgba(255,138,66,${pt.op * (0.2 + p*0.5)})`);
        g.addColorStop(1,'rgba(255,77,28,0)');
        ctx.beginPath(); ctx.arc(p2.x,p2.y,p2.s*7,0,Math.PI*2);
        ctx.fillStyle=g; ctx.fill();
      });

      requestAnimationFrame(draw);
    }
    requestAnimationFrame(draw);

    loaderCleanup = () => {
      active = false;
      removeEventListener('resize', resize);
    };
  }

  /* ---------- LOADER PROGRESS (min 2.5s) ---------- */
  const loader = $('[data-loader]');
  const countEl = $('[data-count]');
  const barEl = $('[data-bar]');
  function runLoader(done) {
    const minWait = new Promise(r => setTimeout(r, 2500));
    let loaded = false;
    const tick = () => {
      progress += Math.max(0.4, (100 - progress) * 0.055);
      if (progress >= 100) progress = 100;
      countEl.textContent = Math.round(progress);
      barEl.style.width = progress + '%';
      if (progress < 100) requestAnimationFrame(tick);
      else if (!loaded) { loaded = true; minWait.then(done); }
    };
    tick();
  }

  /* ---------- LENIS SMOOTH SCROLL ---------- */
  let lenis = null;
  function initLenis() {
    if (prefersReduced || !window.Lenis) return;
    lenis = new Lenis({ duration: 1.1, easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)), smoothWheel: true, touchMultiplier: 1.6 });
    if (window.gsap && window.ScrollTrigger) {
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add(time => lenis.raf(time * 1000));
      gsap.ticker.lagSmoothing(0);
    } else {
      const raf = t => { lenis.raf(t); requestAnimationFrame(raf); };
      requestAnimationFrame(raf);
    }
  }

  /* ---------- CURSOR + MAGNETIC ---------- */
  function initCursor() {
    if (isTouch) return;
    const ring = $('[data-cursor]'), dot = $('[data-cursor-dot]');
    let mx = innerWidth / 2, my = innerHeight / 2, rx = mx, ry = my;
    addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; dot.style.transform = `translate(${mx}px,${my}px) translate(-50%,-50%)`; });
    (function loop() {
      rx += (mx - rx) * 0.18; ry += (my - ry) * 0.18;
      ring.style.transform = `translate(${rx}px,${ry}px) translate(-50%,-50%)`;
      requestAnimationFrame(loop);
    })();
    $$('[data-link],[data-magnetic]').forEach(el => {
      el.addEventListener('mouseenter', () => ring.classList.add('is-hover'));
      el.addEventListener('mouseleave', () => ring.classList.remove('is-hover'));
    });
    if (!prefersReduced) $$('[data-magnetic]').forEach(el => {
      el.style.transition = 'transform .4s cubic-bezier(.16,1,.3,1)';
      el.addEventListener('mousemove', e => {
        const r = el.getBoundingClientRect();
        el.style.transform = `translate(${(e.clientX - (r.left + r.width / 2)) * 0.3}px, ${(e.clientY - (r.top + r.height / 2)) * 0.4}px)`;
      });
      el.addEventListener('mouseleave', () => { el.style.transform = 'translate(0,0)'; });
    });
  }

  /* ---------- THREE.JS : Refined particle morph + subtle camera orbit ---------- */
  let setScrollShape = () => {}, setScrollVel = () => {};
  let mouseX = 0, mouseY = 0;
  function initThree() {
    const canvas = $('[data-bg]');
    if (!window.THREE || !canvas) return;
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.setSize(innerWidth, innerHeight);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(55, innerWidth / innerHeight, 0.1, 200);

    const baseZ = () => (innerWidth < 560 ? 36 : innerWidth < 820 ? 30 : 24);
    camera.position.set(0, 0, baseZ());

    scene.add(new THREE.AmbientLight(0xffffff, 0.7));
    const key = new THREE.DirectionalLight(0xff4d1c, 1.0); key.position.set(8, 10, 8); scene.add(key);
    const fill = new THREE.DirectionalLight(0x1e4dd8, 0.6); fill.position.set(-10, -6, 6); scene.add(fill);

    // Dense fine particles — more numerous, smaller size for tight cluster look
    const N = (prefersReduced || innerWidth < 560) ? 600 : (innerWidth < 820 ? 800 : 1100);
    const sampleGeo = src => {
      const g = src.toNonIndexed ? src.toNonIndexed() : src;
      const p = g.attributes.position.array;
      const out = new Float32Array(N * 3);
      const verts = p.length / 3;
      for (let i = 0; i < N; i++) {
        const s = (Math.floor(Math.random() * verts)) * 3;
        out[i*3] = p[s]; out[i*3+1] = p[s+1]; out[i*3+2] = p[s+2];
      }
      return out;
    };
    const shapes = [
      sampleGeo(new THREE.IcosahedronGeometry(5, 5)),
      sampleGeo(new THREE.TorusGeometry(4, 1.6, 36, 100)),
      sampleGeo(new THREE.TorusKnotGeometry(3.5, 1.1, 140, 20)),
      sampleGeo(new THREE.OctahedronGeometry(5.5, 3)),
      sampleGeo(new THREE.BoxGeometry(7, 7, 7, 20, 20, 20)),
      sampleGeo(new THREE.DodecahedronGeometry(5.5, 3)),
      sampleGeo(new THREE.ConeGeometry(5, 8, 48, 32)),
      sampleGeo(new THREE.CylinderGeometry(4, 4, 7, 48, 24)),
      sampleGeo(new THREE.SphereGeometry(5, 48, 36))
    ];
    const accents = [0xff4d1c,0xff4d1c,0x1e4dd8,0x0f9d6b,0xe0a400,0xc8431f,0xff4d1c,0x1e4dd8,0xff4d1c];

    // Scatter entrance
    const scattered = new Float32Array(N * 3);
    for (let i = 0; i < N * 3; i++) scattered[i] = (Math.random() - 0.5) * 30;
    const cur = Float32Array.from(scattered);
    let scatterFactor = prefersReduced ? 0 : 1.0;

    const pgeo = new THREE.BufferGeometry();
    pgeo.setAttribute('position', new THREE.BufferAttribute(cur, 3));
    const ptSize = innerWidth < 560 ? 0.065 : innerWidth < 820 ? 0.068 : 0.072;
    const pmat = new THREE.PointsMaterial({ size: ptSize, color: 0xff4d1c, transparent: true, opacity: 0.88, depthWrite: false, sizeAttenuation: true });
    const morph = new THREE.Points(pgeo, pmat);
    // Offset shape to the right so it doesn't cover hero text
    morph.position.x = innerWidth < 820 ? 0 : 5;
    morph.position.y = 1;
    scene.add(morph);

    // Smooth sphere wireframe shell — SphereGeometry gives clean latitude/longitude lines
    const shell = new THREE.Mesh(
      new THREE.SphereGeometry(6.2, 56, 40),
      new THREE.MeshBasicMaterial({ color: 0x16130f, wireframe: true, transparent: true, opacity: 0.055 })
    );
    shell.position.copy(morph.position);
    scene.add(shell);


    // Orbital ring — smooth tube segments (16 not 8) so it's a circle not hexagon
    const ringGeo = new THREE.TorusGeometry(7.8, 0.018, 16, 200);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x16130f, transparent: true, opacity: 0.2 });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2.2;
    ring.rotation.y = 0.3;
    ring.position.copy(morph.position);
    scene.add(ring);

    // Second thinner outer ring
    const ring2Geo = new THREE.TorusGeometry(9.4, 0.010, 16, 160);
    const ring2 = new THREE.Mesh(ring2Geo, new THREE.MeshBasicMaterial({ color: 0x16130f, transparent: true, opacity: 0.09 }));
    ring2.rotation.x = Math.PI / 2.5;
    ring2.rotation.z = 0.6;
    ring2.position.copy(morph.position);
    scene.add(ring2);

    // Wave grid — ultra-dense 200×200 subdivisions, gentle amplitude, pushed low
    const gridGeo = new THREE.PlaneGeometry(220, 220, 200, 200);
    const grid = new THREE.Mesh(gridGeo, new THREE.MeshBasicMaterial({ color: 0x16130f, wireframe: true, transparent: true, opacity: 0.045 }));
    grid.rotation.x = -Math.PI / 2.4;
    grid.position.y = -24;
    scene.add(grid);
    const gridBase = Float32Array.from(gridGeo.attributes.position.array);

    if (!isTouch) addEventListener('mousemove', e => { mouseX = e.clientX / innerWidth - 0.5; mouseY = e.clientY / innerHeight - 0.5; });

    let scrollShape = 0, vel = 0;
    const maxIdx = shapes.length - 1;
    setScrollShape = v => { scrollShape = Math.max(0, Math.min(maxIdx, v)); };
    setScrollVel = v => { vel = v; };

    // Ripple on shape change
    let lastShapeInt = 0;
    let rippleTime = -10;

    const colA = new THREE.Color(), colB = new THREE.Color(), col = new THREE.Color(0xff4d1c);
    const clock = new THREE.Clock();

    function render() {
      const t = clock.getElapsedTime();

      // Decay scatter factor
      if (scatterFactor > 0.001) {
        scatterFactor *= 0.97;
      } else {
        scatterFactor = 0;
      }

      // Detect shape change for ripple
      const currentInt = Math.floor(scrollShape);
      if (currentInt !== lastShapeInt) {
        rippleTime = t;
        lastShapeInt = currentInt;
      }
      const ripple = Math.max(0, 1 - (t - rippleTime) * 3);

      // scroll-driven interpolation
      const i0 = Math.floor(scrollShape);
      const i1 = Math.min(maxIdx, i0 + 1);
      const f = scrollShape - i0;
      const a = shapes[i0], b = shapes[i1];
      const pos = pgeo.attributes.position.array;

      for (let i = 0; i < N; i++) {
        const ix = i * 3;
        let tx = a[ix]   + (b[ix]   - a[ix])   * f;
        let ty = a[ix+1] + (b[ix+1] - a[ix+1]) * f;
        let tz = a[ix+2] + (b[ix+2] - a[ix+2]) * f;

        // Mix with scattered positions during entrance
        if (scatterFactor > 0) {
          tx = tx + (scattered[ix]   - tx) * scatterFactor;
          ty = ty + (scattered[ix+1] - ty) * scatterFactor;
          tz = tz + (scattered[ix+2] - tz) * scatterFactor;
        }

        // Smooth lerp
        cur[ix]   += (tx - cur[ix])   * 0.1;
        cur[ix+1] += (ty - cur[ix+1]) * 0.1;
        cur[ix+2] += (tz - cur[ix+2]) * 0.1;

        // Gentle ambient floating
        pos[ix]   = cur[ix]   + Math.sin(t * 0.6 + cur[ix+1]) * 0.08;
        pos[ix+1] = cur[ix+1] + Math.cos(t * 0.5 + cur[ix+2]) * 0.08;
        pos[ix+2] = cur[ix+2] + Math.sin(t * 0.4 + cur[ix]) * 0.08;

        // Subtle ripple
        if (ripple > 0) {
          const dist = Math.sqrt(cur[ix]*cur[ix] + cur[ix+1]*cur[ix+1] + cur[ix+2]*cur[ix+2]) || 1;
          const push = ripple * 0.8 * Math.sin(dist * 1.5 - (t - rippleTime) * 10);
          pos[ix]   += (cur[ix]   / dist) * push * 0.3;
          pos[ix+1] += (cur[ix+1] / dist) * push * 0.3;
          pos[ix+2] += (cur[ix+2] / dist) * push * 0.3;
        }
      }
      pgeo.attributes.position.needsUpdate = true;

      // Color interpolation
      colA.setHex(accents[i0]); colB.setHex(accents[i1]);
      col.lerpColors(colA, colB, f);
      pmat.color.copy(col);

      // Subtle camera orbit driven by scroll
      const orbitAngle = scrollShape * 0.2;
      const camZ = baseZ() - scrollShape * 0.4;
      const targetCamX = Math.sin(orbitAngle) * 3 + mouseX * 2;
      const targetCamY = -mouseY * 1.5;
      const targetCamZ = Math.cos(orbitAngle) * camZ;

      camera.position.x += (targetCamX - camera.position.x) * 0.035;
      camera.position.y += (targetCamY - camera.position.y) * 0.035;
      camera.position.z += (targetCamZ - camera.position.z) * 0.04;
      camera.lookAt(morph.position.x * 0.5, 0, 0);

      // Rotation + scale
      const entranceScale = 1.1 - scatterFactor * 0.2;
      const scrollScale = Math.max(0.7, 1.0 - scrollShape * 0.035);
      morph.scale.setScalar(entranceScale * scrollScale);

      morph.rotation.y = t * 0.06 + scrollShape * 0.25 + mouseX * 0.2 + vel * 0.008;
      morph.rotation.x = mouseY * 0.2 + scrollShape * 0.04;
      shell.position.copy(morph.position);
      shell.rotation.copy(morph.rotation);
      shell.scale.setScalar(morph.scale.x * (1.02 + Math.sin(t * 0.5) * 0.015));

      ring.position.copy(morph.position);
      ring.rotation.x = Math.PI / 2.2 + mouseY * 0.08;
      ring.rotation.y = morph.rotation.y * 0.4 + t * 0.025;
      ring2.position.copy(morph.position);
      ring2.rotation.x = Math.PI / 2.5 + mouseY * 0.05;
      ring2.rotation.z = t * 0.018 + 0.6;

      // Wave grid — gentle fine ripples, small amplitude
      const gridP = gridGeo.attributes.position.array;
      for (let i = 0; i < gridP.length; i += 3) {
        gridP[i+2] = Math.sin((gridBase[i] + t * 0.9) * 0.14) * 0.55 + Math.cos((gridBase[i+1] + t * 0.7) * 0.14) * 0.55;
      }
      gridGeo.attributes.position.needsUpdate = true;

      vel *= 0.9;
      renderer.render(scene, camera);
      requestAnimationFrame(render);
    }
    render();

    addEventListener('resize', () => {
      camera.aspect = innerWidth / innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(innerWidth, innerHeight);
      morph.position.x = innerWidth < 820 ? 0 : 5;
      shell.position.copy(morph.position);
    });
  }

  /* ---------- MARQUEE ---------- */
  let marqueeDir = -1;
  function initMarquee() {
    const track = $('[data-marquee]');
    if (!track) return;
    let x = 0;
    (function move() {
      x += marqueeDir * 0.7;
      const half = track.scrollWidth / 2;
      if (-x >= half) x = 0; if (x > 0) x = -half;
      track.style.transform = `translateX(${x}px)`;
      requestAnimationFrame(move);
    })();
  }

  /* ---------- SCROLL : progress, counter, reveals, gallery, stack cards ---------- */
  function initScroll() {
    if (window.gsap) {
      gsap.set('[data-word]', { yPercent: 115 });
      gsap.to('[data-word]', { yPercent: 0, duration: 1.1, ease: 'power4.out', stagger: 0.08, delay: 0.1 });
    }

    const bar = $('[data-scrollbar]');
    const counterB = $('[data-counter] b');
    let lastY = scrollY;
    const onScroll = () => {
      const h = document.documentElement;
      const p = h.scrollTop / (h.scrollHeight - h.clientHeight || 1);
      bar.style.width = (p * 100) + '%';
      const dy = scrollY - lastY; lastY = scrollY;
      marqueeDir = dy >= 0 ? -1 : 1;
      setScrollVel(dy);
    };
    addEventListener('scroll', onScroll, { passive: true });

    if (!window.gsap || !window.ScrollTrigger) return;
    gsap.registerPlugin(ScrollTrigger);
    document.documentElement.classList.add('gsap-ready');

    // Enhanced reveals with blur + scale
    if (!prefersReduced) {
      $$('[data-reveal]').forEach(el => gsap.to(el, {
        opacity: 1, y: 0, scale: 1, filter: 'blur(0px)',
        duration: 1, ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 90%' }
      }));
    } else {
      gsap.set('[data-reveal]', { opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' });
    }

    // ---------- ABOUT: portrait with replay-on-scroll ----------
    if (!prefersReduced) {
      const portrait      = $('[data-about-portrait]');
      const portraitFrame = $('.about__portrait-frame');
      const badge         = $('[data-about-badge]');
      const lead          = $('[data-about-lead]');
      const bio           = $('[data-about-bio]');
      const facts         = $('[data-about-facts]');

      if (portrait) {
        gsap.fromTo(portrait,
          { opacity: 0, y: 60, scale: 0.72, rotateX: 18, rotateY: -12, transformPerspective: 1100 },
          { opacity: 1, y: 0, scale: 1, rotateX: 0, rotateY: 0, transformPerspective: 1100,
            duration: 1.6, ease: 'expo.out',
            scrollTrigger: { trigger: portrait, start: 'top 82%', toggleActions: 'play none none reset' }
          }
        );
        gsap.to(portrait, { y: -8, duration: 4, ease: 'sine.inOut', yoyo: true, repeat: -1, delay: 1.8 });
      }

      if (portraitFrame && !isTouch) {
        portraitFrame.addEventListener('mousemove', e => {
          const r  = portraitFrame.getBoundingClientRect();
          const rx = ((e.clientY - (r.top + r.height/2)) / r.height) * -12;
          const ry = ((e.clientX - (r.left + r.width/2)) / r.width) * 14;
          gsap.to(portraitFrame, { rotateX: rx, rotateY: ry, transformPerspective: 900, duration: 0.5, ease: 'power2.out', overwrite: 'auto' });
        });
        portraitFrame.addEventListener('mouseleave', () =>
          gsap.to(portraitFrame, { rotateX: 0, rotateY: 0, duration: 0.8, ease: 'elastic.out(1,0.5)', overwrite: 'auto' })
        );
      }

      if (badge) gsap.fromTo(badge,
        { opacity: 0, x: 22, scale: 0.75 },
        { opacity: 1, x: 0, scale: 1, duration: 0.85, ease: 'back.out(2.2)',
          scrollTrigger: { trigger: portrait, start: 'top 78%', toggleActions: 'play none none reset' }, delay: 0.7 }
      );

      if (lead) gsap.fromTo(lead,
        { opacity: 0, y: 36, rotateX: 10, transformPerspective: 900 },
        { opacity: 1, y: 0, rotateX: 0, transformPerspective: 900, duration: 1.1, ease: 'power3.out',
          scrollTrigger: { trigger: lead, start: 'top 88%', toggleActions: 'play none none reset' } }
      );

      if (bio) gsap.fromTo(bio,
        { opacity: 0, y: 28 },
        { opacity: 1, y: 0, duration: 1, ease: 'power3.out',
          scrollTrigger: { trigger: bio, start: 'top 90%', toggleActions: 'play none none reset' } }
      );

      if (facts) {
        gsap.fromTo(facts,
          { opacity: 0, y: 32, scale: 0.97 },
          { opacity: 1, y: 0, scale: 1, duration: 1, ease: 'power3.out',
            scrollTrigger: { trigger: facts, start: 'top 92%', toggleActions: 'play none none reset' } }
        );
        $$('[data-about-facts] > div:not(.about__facts-sep)').forEach((cell, i) =>
          gsap.fromTo(cell,
            { opacity: 0, y: 14 },
            { opacity: 1, y: 0, duration: 0.65, ease: 'power2.out',
              delay: i * 0.1,
              scrollTrigger: { trigger: facts, start: 'top 90%', toggleActions: 'play none none reset' } }
          )
        );
      }
    }

    // ---------- JOURNEY: milestone card reveal ----------
    if (!prefersReduced) {
      const milestones = $$('[data-milestone]');
      milestones.forEach((row, i) => {
        const card = row.querySelector('[data-milestone-card]');
        if (!card) return;

        ScrollTrigger.create({
          trigger: row,
          start: 'top 85%',   // only fires once this item enters view
          onEnter() {
            row.classList.add('is-visible');
            gsap.to(card, {
              opacity: 1,
              y: 0,
              duration: 0.85,
              ease: 'power3.out',
              delay: 0.05 * i
            });
          },
          onLeaveBack() {
            row.classList.remove('is-visible');
            gsap.set(card, { opacity: 0, y: 28 });
          }
        });
      });
    }





    // Hero text parallax

    if (!prefersReduced && !mqMobile.matches) {
      $$('.hero__title .line').forEach((line, i) => {
        gsap.to(line, {
          yPercent: -(i + 1) * 12,
          scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 1 }
        });
      });
    }

    const counterUpdate = i => { if (counterB) counterB.textContent = (i >= 1 && i <= 5) ? String(i).padStart(2, '0') : '00'; };

    // Master morph timeline
    const maxShape = 8;
    ScrollTrigger.create({
      trigger: document.body, start: 'top top', end: 'bottom bottom', scrub: true,
      onUpdate: self => setScrollShape(self.progress * maxShape)
    });

    // Section counter
    $$('[data-shape]').forEach(el => {
      const idx = +el.dataset.shape;
      ScrollTrigger.create({ trigger: el, start: 'top 60%', end: 'bottom 40%',
        onEnter: () => counterUpdate(idx), onEnterBack: () => counterUpdate(idx) });
    });

    // Pinned horizontal gallery (desktop only)
    const gallery = $('[data-gallery]');
    const gtrack = $('[data-gallery-track]');
    if (gallery && gtrack && !mqMobile.matches) {
      const dist = () => Math.max(0, gtrack.scrollWidth - innerWidth);
      gsap.to(gtrack, {
        x: () => -dist(), ease: 'none',
        scrollTrigger: {
          trigger: gallery, start: 'top top', end: () => '+=' + dist(),
          scrub: 1, pin: true, anticipatePin: 1, invalidateOnRefresh: true,
          onUpdate: self => {
            const cards = $$('[data-card]');
            const i = Math.round(self.progress * (cards.length - 1));
            counterUpdate(+cards[i].dataset.shape);
          }
        }
      });
    }

    // Stack cards: scroll-driven scale-down stacking
    const stackCards = $$('[data-stack-card]');
    if (stackCards.length && !prefersReduced) {
      stackCards.forEach((card, i) => {
        // Entrance animation
        gsap.from(card, {
          y: 50, opacity: 0,
          duration: 0.8, ease: 'power3.out',
          scrollTrigger: { trigger: card, start: 'top 88%' }
        });

        // Scale down slightly as next card stacks — no color change
        if (i < stackCards.length - 1) {
          gsap.to(card, {
            scale: 0.96 - i * 0.01,
            scrollTrigger: {
              trigger: stackCards[i + 1],
              start: 'top bottom',
              end: 'top top',
              scrub: true
            }
          });
        }
      });
    }
  }

  /* ---------- NAV + HAMBURGER ---------- */
  function initNav() {
    $$('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
      const id = a.getAttribute('href');
      const target = id.length > 1 ? $(id) : document.body;
      if (!target) return;
      e.preventDefault();
      const navLinks = $('[data-nav-links]');
      const burger = $('[data-burger]');
      if (navLinks) navLinks.classList.remove('is-open');
      if (burger) burger.classList.remove('is-active');
      if (lenis) lenis.scrollTo(id === '#top' ? 0 : target, { offset: -10 });
      else target.scrollIntoView({ behavior: prefersReduced ? 'auto' : 'smooth', block: 'start' });
    }));

    const burger = $('[data-burger]');
    const navLinks = $('[data-nav-links]');
    if (burger && navLinks) {
      burger.addEventListener('click', () => {
        burger.classList.toggle('is-active');
        navLinks.classList.toggle('is-open');
      });
    }
  }

  /* ---------- BOOT ---------- */
  initLoaderScene();
  initThree();
  initMarquee();
  initCursor();
  initNav();
  runLoader(() => {
    if (loaderCleanup) loaderCleanup();
    loader.classList.add('is-done');
    initLenis();
    initScroll();
    if (window.ScrollTrigger) setTimeout(() => ScrollTrigger.refresh(), 350);
  });
})();
