/**
 * journey3d.js
 * Three.js powered Journey section.
 * Loads the Blender-exported ribbon GLB and drives a pinned
 * scroll-triggered camera sweep through 5 story scenes.
 */

import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.165.0/build/three.module.js';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.165.0/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'https://cdn.jsdelivr.net/npm/three@0.165.0/examples/jsm/loaders/DRACOLoader.js';

// ─── Scenes data ────────────────────────────────────────────────────────────
const SCENES = [
  {
    year:    '2017 – 2019',
    label:   'Foundation',
    heading: 'Diploma in Computer Engineering',
    body:    'GTU. Built the foundation — C, Java, databases, networking. Started shipping projects early. Real constraints, real learning.',
    tags:    [],
    // Camera position along the path (0 = start, 1 = end)
    t: 0.0,
  },
  {
    year:    '50+ Projects',
    label:   'Pre-AI Era',
    heading: 'Shipped across every stack',
    body:    'MongoDB, Android, Flutter, ML, Unity — built before AI coding tools existed. Every bug, every debug session, every solution earned.',
    tags:    ['Android', 'Flutter', 'Unity', 'ML', 'MongoDB'],
    t: 0.25,
  },
  {
    year:    '2021 – Now',
    label:   'Depth',
    heading: 'B.Tech CSE — Full-stack + AI/ML',
    body:    'Deepened into distributed systems, ML pipelines, and production-grade architecture. Stopped building for the portfolio. Started building for users.',
    tags:    [],
    t: 0.5,
  },
  {
    year:    '2023',
    label:   'Industry',
    heading: 'Freelance + Internship',
    body:    'BrainyBeam internship. Real client work with JSK Enterprises. Shipped under pressure, managed stakeholders, owned products end to end.',
    tags:    [],
    t: 0.75,
  },
  {
    year:    'Now',
    label:   'Present',
    heading: 'Building products people actually use.',
    body:    'NeuroCanopy and Twig — real users, real infra. Sharpening DSA fundamentals for placements. Turning 7 years of breadth into depth that compounds.',
    tags:    ['NeuroCanopy', 'Twig', 'DSA'],
    t: 1.0,
  },
];

// ─── Main init ───────────────────────────────────────────────────────────────
export function initJourney3D() {
  const section  = document.querySelector('.journey-3d');
  const canvas   = document.querySelector('#journey-canvas');
  const overlay  = document.querySelector('.journey-3d__overlay');

  if (!section || !canvas) return;

  // ── Renderer ───────────────────────────────────────────────────────────────
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: false,
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  // ── Scene ──────────────────────────────────────────────────────────────────
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xf4f1ea); // --paper
  scene.fog = new THREE.FogExp2(0xf4f1ea, 0.045);

  // ── Camera ─────────────────────────────────────────────────────────────────
  const camera = new THREE.PerspectiveCamera(
    40,
    window.innerWidth / window.innerHeight,
    0.1,
    200
  );
  // Will be overridden by scroll, but set a sane default
  camera.position.set(0, -12, 9);
  camera.lookAt(0, 0, 0);

  // ── Lights ─────────────────────────────────────────────────────────────────
  const ambient = new THREE.AmbientLight(0xf4f1ea, 1.2);
  scene.add(ambient);

  const key = new THREE.DirectionalLight(0xfff5ee, 3.5);
  key.position.set(6, -4, 10);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.camera.near = 0.1;
  key.shadow.camera.far  = 50;
  key.shadow.camera.left = -15;
  key.shadow.camera.right = 15;
  key.shadow.camera.top = 15;
  key.shadow.camera.bottom = -15;
  scene.add(key);

  const fill = new THREE.DirectionalLight(0xd0d8ff, 1.2);
  fill.position.set(-6, -2, 5);
  scene.add(fill);

  const rim = new THREE.PointLight(0xffa060, 0.8, 30);
  rim.position.set(0, 6, 3);
  scene.add(rim);

  // ── Ground plane (subtle shadow catcher) ───────────────────────────────────
  const groundGeo = new THREE.PlaneGeometry(60, 60);
  const groundMat = new THREE.ShadowMaterial({ opacity: 0.08 });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.05;
  ground.receiveShadow = true;
  scene.add(ground);

  // ── State ──────────────────────────────────────────────────────────────────
  let ribbonPath     = null; // THREE.CatmullRomCurve3 built from GLB positions
  let ribbonMesh     = null;
  let orangeBall     = null;
  let milestoneBalls = [];
  let glbGroup       = null;

  // Orange accent glowing line drawn along path
  let accentLine = null;
  let accentProgress = 0; // 0→1

  // Camera target positions for each scene (lerped)
  let camTarget = new THREE.Vector3();
  let camLookTarget = new THREE.Vector3();

  // Current scroll progress 0→1
  let scrollProgress = 0;
  let smoothProgress = 0;

  // ── Load GLB ───────────────────────────────────────────────────────────────
  const dracoLoader = new DRACOLoader();
  dracoLoader.setDecoderPath('https://cdn.jsdelivr.net/npm/three@0.165.0/examples/jsm/libs/draco/');

  const loader = new GLTFLoader();
  loader.setDRACOLoader(dracoLoader);

  loader.load('./journey_ribbon.glb', (gltf) => {
    glbGroup = gltf.scene;
    glbGroup.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;

        // Identify objects by name pattern from Blender
        const n = child.name.toLowerCase();

        if (n.includes('ribbonpath') || n.includes('ribbonpathdata')) {
          ribbonMesh = child;
          // Give it the premium paper material with slight SSS look
          child.material = new THREE.MeshStandardMaterial({
            color: new THREE.Color(0xf0ede6),
            roughness: 0.12,
            metalness: 0.05,
            envMapIntensity: 0.6,
          });
        } else if (n.includes('journeyball')) {
          orangeBall = child;
          child.material = new THREE.MeshStandardMaterial({
            color: new THREE.Color(0xff4d1c),
            roughness: 0.08,
            metalness: 0.1,
            emissive: new THREE.Color(0xff4d1c),
            emissiveIntensity: 0.35,
          });
        } else if (n.includes('milestoneball') || n.includes('sphere')) {
          milestoneBalls.push(child);
          child.material = new THREE.MeshStandardMaterial({
            color: new THREE.Color(0xffffff),
            roughness: 0.05,
            metalness: 0.0,
            envMapIntensity: 1.0,
          });
          // Start invisible, will reveal on scroll
          child.material.transparent = true;
          child.material.opacity = 0;
        }
      }
    });

    scene.add(glbGroup);

    // ── Build a CatmullRom path from the ribbon mesh vertices for ball movement
    buildRibbonPath();

    // ── Add the glowing orange accent line (starts at 0 length)
    buildAccentLine();

    // Mark as ready
    section.classList.add('journey-3d--loaded');
    startRender();

  }, undefined, (err) => {
    console.error('GLB load failed:', err);
  });

  // ── Build path from ribbon mesh for ball + camera following ────────────────
  function buildRibbonPath() {
    // Use a manually specified set of waypoints that match our Bezier curve.
    // These are the same control points we used in Blender (converted to Three.js Y-up space).
    // Blender Z-up → Three.js Y-up: swap y↔z, negate new z (old y)
    const waypoints = [
      [-6.0, 0.0,  5.0],
      [-4.5, 0.15, 3.2],
      [-3.0, 0.25, 2.0],
      [-1.5, 0.35, 1.0],
      [-0.5, 0.40, 0.0],
      [ 1.0, 0.45,-0.8],
      [ 2.0, 0.45,-2.0],
      [ 3.0, 0.45,-2.8],
      [ 4.0, 0.30,-4.2],
      [ 4.8, 0.15,-5.5],
      [ 5.0, 0.0, -6.5],
    ].map(([x, y, z]) => new THREE.Vector3(x, y, z));

    ribbonPath = new THREE.CatmullRomCurve3(waypoints, false, 'catmullrom', 0.5);
  }

  // ── Build the accent orange line drawn by scroll ───────────────────────────
  function buildAccentLine() {
    const points = ribbonPath.getPoints(200);
    // Lift slightly above ribbon
    const lifted = points.map(p => new THREE.Vector3(p.x, p.y + 0.18, p.z));

    const geometry = new THREE.BufferGeometry().setFromPoints(lifted);
    const material = new THREE.LineBasicMaterial({
      color: 0xff4d1c,
      linewidth: 2, // Note: linewidth > 1 only works on some browsers
      transparent: true,
      opacity: 0.9,
    });

    accentLine = new THREE.Line(geometry, material);
    // Start with 0 draw range
    accentLine.geometry.setDrawRange(0, 0);
    scene.add(accentLine);
  }

  // ── Camera positions for each scene ───────────────────────────────────────
  function getCameraForProgress(t) {
    if (!ribbonPath) return { pos: new THREE.Vector3(0, 9, 12), lookAt: new THREE.Vector3(0, 0, 0) };

    const pathPt = ribbonPath.getPointAt(Math.min(t, 0.98));
    const tangent = ribbonPath.getTangentAt(Math.min(t, 0.98));

    // Camera sits behind and above the current path point
    const offset = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
    const camPos = pathPt.clone()
      .add(offset.multiplyScalar(3.5))
      .add(new THREE.Vector3(0, 6.5, 5.5));

    // Look at a point slightly ahead on the path
    const aheadT = Math.min(t + 0.15, 1.0);
    const lookPt = ribbonPath.getPointAt(aheadT);

    return { pos: camPos, lookAt: lookPt };
  }

  // ── Get current scene index from progress ──────────────────────────────────
  function getSceneIndex(t) {
    // Clamp to the nearest scene
    let closest = 0;
    let minDist = Infinity;
    SCENES.forEach((s, i) => {
      const d = Math.abs(s.t - t);
      if (d < minDist) { minDist = d; closest = i; }
    });
    return closest;
  }

  // ── Update HTML overlay text, dots, and counter ──────────────────────────
  let lastSceneIdx = -1;
  function updateOverlay(t) {
    const idx = getSceneIndex(t);
    if (idx === lastSceneIdx) return;
    lastSceneIdx = idx;

    // Scene cards
    const scenes = overlay.querySelectorAll('.jscene');
    scenes.forEach((el, i) => {
      el.classList.toggle('jscene--active', i === idx);
    });

    // Progress dots
    const dots = section.querySelectorAll('.jdot');
    dots.forEach((d, i) => d.classList.toggle('is-active', i <= idx));

    // Counter
    const counterEl = section.querySelector('.jcounter-num');
    if (counterEl) counterEl.textContent = String(idx + 1).padStart(2, '0');

    // Hide scroll hint after first scene
    const hint = section.querySelector('.journey-3d__scroll-hint');
    if (hint) hint.style.opacity = idx === 0 ? '1' : '0';
  }

  // ── Scroll wiring ──────────────────────────────────────────────────────────
  function setupScrollTrigger() {
    // GSAP ScrollTrigger — pinned for 500vh
    if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
      gsap.registerPlugin(ScrollTrigger);

      ScrollTrigger.create({
        trigger: section,
        start: 'top top',
        end: '+=500%',
        pin: true,
        scrub: 1,
        onUpdate(self) {
          scrollProgress = self.progress;
        },
      });
    } else {
      // Fallback: simple scroll listener
      const sectionTop = section.offsetTop;
      const sectionH   = window.innerHeight * 5;
      window.addEventListener('scroll', () => {
        const raw = (window.scrollY - sectionTop) / sectionH;
        scrollProgress = Math.max(0, Math.min(1, raw));
      }, { passive: true });
    }
  }

  // ── Animation loop ─────────────────────────────────────────────────────────
  let rafId = null;
  const clock = new THREE.Clock();

  function startRender() {
    setupScrollTrigger();

    function animate() {
      rafId = requestAnimationFrame(animate);
      const dt = clock.getDelta();
      const t  = clock.getElapsedTime();

      // Smooth the scroll progress (lag 0.06 = silky)
      smoothProgress += (scrollProgress - smoothProgress) * 0.06;
      const p = smoothProgress;

      // ── Move orange ball along path ────────────────────────────────────────
      if (ribbonPath && orangeBall) {
        const ballPt = ribbonPath.getPointAt(Math.min(p, 0.99));
        orangeBall.position.copy(ballPt);
        // Bob up and down slightly (alive feeling)
        orangeBall.position.y += Math.sin(t * 2.4) * 0.04;
        // Subtle rotation
        orangeBall.rotation.y = t * 0.8;
      }

      // ── Reveal milestone balls as we pass them ─────────────────────────────
      milestoneBalls.forEach((ball, i) => {
        const targetT = SCENES[Math.min(i + 1, SCENES.length - 1)].t;
        const visible  = p >= targetT - 0.04;
        const targetOp = visible ? 1.0 : 0.0;
        ball.material.opacity += (targetOp - ball.material.opacity) * 0.08;
      });

      // ── Accent line draw-in ────────────────────────────────────────────────
      if (accentLine) {
        const totalPts = accentLine.geometry.attributes.position.count;
        const drawCount = Math.floor(p * totalPts);
        accentLine.geometry.setDrawRange(0, drawCount);
      }

      // ── Camera follow path ─────────────────────────────────────────────────
      if (ribbonPath) {
        const { pos, lookAt } = getCameraForProgress(p);
        camera.position.lerp(pos, 0.04);
        camLookTarget.lerp(lookAt, 0.04);
        camera.lookAt(camLookTarget);
      }

      // ── Scene text updates ─────────────────────────────────────────────────
      updateOverlay(p);

      // ── Orange ball glow pulse ─────────────────────────────────────────────
      if (orangeBall && orangeBall.material) {
        orangeBall.material.emissiveIntensity = 0.25 + Math.sin(t * 3) * 0.15;
      }

      renderer.render(scene, camera);
    }

    animate();
  }

  // ── Resize ─────────────────────────────────────────────────────────────────
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
}
