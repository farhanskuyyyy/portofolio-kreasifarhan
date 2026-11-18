import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { audioEngine } from '../utils/audio';
import { UFO_FLEET, getExtraUfoPosition } from '../utils/ufoFleet';
import { TECH_STARS } from './CelestialSkillStars';

export default function CosmicCanvas({
  camTarget,
  onPlanetClick,
  onUpdateTelemetry,
  onUpdatePlanetCoords,
  zoomAction,
  resetViewTrigger,
  autoOrbitEnabled,
}) {
  const canvasRef = useRef(null);
  const stateRef = useRef({
    orbitalAngle: 0.105,
    orbitalVelocityX: 0,
    targetOrbitalAngle: 0.105,
    elevation: 0.48,
    orbitalVelocityY: 0,
    targetElevation: 0.48,
    radius: 28.5,
    targetRadius: 28.5,
    autoOrbit: true,
    hoveredPlanet: null,
    hoveredViaDom: false,
    lastDragDistance: 0,
    camLerp: { x: 2.65, y: 13.16, z: 25.14, tx: 0, ty: 0, tz: 0 },
    mouseX: 0,
    mouseY: 0,
    currentCamTarget: 'overview',
    coreHovered: false,
    pulseStart: 0,
    pulseDetonated: {},
  });

  // Sync auto orbit prop
  useEffect(() => {
    if (autoOrbitEnabled !== undefined) {
      stateRef.current.autoOrbit = autoOrbitEnabled;
    }
  }, [autoOrbitEnabled]);

  // Sync zoom action prop (+ / -)
  useEffect(() => {
    if (!zoomAction) return;
    if (zoomAction === 'in') {
      stateRef.current.targetRadius = Math.max(13.5, stateRef.current.targetRadius - 4.5);
    } else if (zoomAction === 'out') {
      stateRef.current.targetRadius = Math.min(48.0, stateRef.current.targetRadius + 4.5);
    }
  }, [zoomAction]);

  // Sync reset view trigger
  useEffect(() => {
    if (!resetViewTrigger) return;
    const twoPi = Math.PI * 2;
    const currentLoopsX = Math.round((stateRef.current.orbitalAngle - 0.105) / twoPi);
    stateRef.current.targetOrbitalAngle = currentLoopsX * twoPi + 0.105;
    stateRef.current.targetElevation = 0.48;
    stateRef.current.targetRadius = window.innerWidth < 768 ? 32.5 : 28.5;
  }, [resetViewTrigger]);

  // Sync camera sector target
  useEffect(() => {
    stateRef.current.currentCamTarget = camTarget || 'overview';
  }, [camTarget]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let animId;
    const isMobile = window.innerWidth < 768;
    stateRef.current.radius = isMobile ? 32.5 : 28.5;
    stateRef.current.targetRadius = stateRef.current.radius;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x0a0c10, 0.007);

    const camera = new THREE.PerspectiveCamera(
      isMobile ? 58 : 54,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.up.set(0, 1, 0);
    camera.position.set(2.65, 13.16, 25.14);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Three-point ambient lighting for 3D PBR materials
    const ambientLight = new THREE.AmbientLight(0x282c34, 1.4);
    scene.add(ambientLight);

    const rimLight = new THREE.DirectionalLight(0x38bdf8, 1.1);
    rimLight.position.set(-25, 18, -20);
    scene.add(rimLight);

    const warmFill = new THREE.DirectionalLight(0xd4a373, 0.8);
    warmFill.position.set(20, -12, 22);
    scene.add(warmFill);

    // 2. Stars Field
    const starCount = 2800;
    const starGeo = new THREE.BufferGeometry();
    const starPos = new Float32Array(starCount * 3);
    const starCols = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount; i++) {
      const i3 = i * 3;
      const rad = 70 + Math.random() * 320;
      const th = Math.random() * Math.PI * 2;
      const ph = Math.acos(Math.random() * 2 - 1);

      starPos[i3] = rad * Math.sin(ph) * Math.cos(th);
      starPos[i3 + 1] = rad * Math.sin(ph) * Math.sin(th);
      starPos[i3 + 2] = rad * Math.cos(ph);

      const tint = Math.random();
      if (tint > 0.85) {
        starCols[i3] = 0.83;
        starCols[i3 + 1] = 0.64;
        starCols[i3 + 2] = 0.45;
      } else if (tint > 0.7) {
        starCols[i3] = 0.35;
        starCols[i3 + 1] = 0.69;
        starCols[i3 + 2] = 0.66;
      } else {
        starCols[i3] = 0.96;
        starCols[i3 + 1] = 0.95;
        starCols[i3 + 2] = 0.92;
      }
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    starGeo.setAttribute('color', new THREE.BufferAttribute(starCols, 3));

    const starMat = new THREE.PointsMaterial({
      size: 1.15,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
    });
    const starPoints = new THREE.Points(starGeo, starMat);
    scene.add(starPoints);

    // 3. Central Gargantua Black Hole Singularity & Accretion Disk
    const solarPlane = new THREE.Group();
    scene.add(solarPlane);

    function createRadialGlowTexture(colorCenter, colorMid, colorEdge) {
      const c = document.createElement('canvas');
      c.width = 256;
      c.height = 256;
      const ctx = c.getContext('2d');
      const grad = ctx.createRadialGradient(128, 128, 4, 128, 128, 128);
      grad.addColorStop(0.0, colorCenter);
      grad.addColorStop(0.38, colorMid);
      grad.addColorStop(1.0, colorEdge);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 256, 256);
      return new THREE.CanvasTexture(c);
    }

    const gargantuaGroup = new THREE.Group();
    solarPlane.add(gargantuaGroup);

    // Event Horizon (Pitch Black Singularity Core)
    const horizonGeo = new THREE.SphereGeometry(2.35, 48, 48);
    const horizonMat = new THREE.MeshBasicMaterial({ color: 0x020305 });
    const horizonMesh = new THREE.Mesh(horizonGeo, horizonMat);
    gargantuaGroup.add(horizonMesh);

    // Relativistic Photon Ring
    const photonGeo = new THREE.SphereGeometry(2.46, 36, 36);
    const photonMat = new THREE.MeshBasicMaterial({
      color: 0xfff3d1,
      wireframe: true,
      transparent: true,
      opacity: 0.42,
      blending: THREE.AdditiveBlending,
    });
    const gargantuaCorona = new THREE.Mesh(photonGeo, photonMat);
    gargantuaGroup.add(gargantuaCorona);

    // Soft Atmospheric Solar Glow Sprite
    const glowTex = createRadialGlowTexture(
      'rgba(255, 235, 190, 0.9)',
      'rgba(212, 163, 115, 0.42)',
      'rgba(16, 18, 22, 0.0)'
    );
    const glowSpriteMat = new THREE.SpriteMaterial({
      map: glowTex,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const glowSprite = new THREE.Sprite(glowSpriteMat);
    glowSprite.scale.set(11.5, 11.5, 1.0);
    gargantuaGroup.add(glowSprite);

    // Primary Horizontal Accretion Disk
    const gargantuaDiskGroup = new THREE.Group();
    gargantuaDiskGroup.rotation.x = 0.08;
    gargantuaDiskGroup.rotation.z = -0.06;
    gargantuaGroup.add(gargantuaDiskGroup);

    const diskLayers = [
      { inner: 2.55, outer: 3.15, color: 0xfff8e7, opacity: 0.88 },
      { inner: 3.10, outer: 4.10, color: 0xe0a96d, opacity: 0.65 },
      { inner: 4.05, outer: 5.15, color: 0xc06c54, opacity: 0.35 },
      { inner: 5.10, outer: 5.75, color: 0xd4a373, opacity: 0.16 },
    ];
    diskLayers.forEach((layer) => {
      const rGeo = new THREE.RingGeometry(layer.inner, layer.outer, 96);
      const rMat = new THREE.MeshBasicMaterial({
        color: layer.color,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: layer.opacity,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const rMesh = new THREE.Mesh(rGeo, rMat);
      rMesh.rotation.x = Math.PI / 2;
      gargantuaDiskGroup.add(rMesh);
    });

    // 900 Swirling Accretion Plasma Particles
    const pCount = 900;
    const pGeo = new THREE.BufferGeometry();
    const pPos = new Float32Array(pCount * 3);
    const pCol = new Float32Array(pCount * 3);
    const cHot = new THREE.Color(0xfff9e6);
    const cWarm = new THREE.Color(0xd4a373);
    const cDeep = new THREE.Color(0xc06c54);

    for (let i = 0; i < pCount; i++) {
      const i3 = i * 3;
      const a = Math.random() * Math.PI * 2;
      const dist = 2.6 + Math.pow(Math.random(), 1.5) * 3.1;
      pPos[i3] = Math.cos(a) * dist;
      pPos[i3 + 1] = (Math.random() - 0.5) * 0.18 * (6.0 - dist) * 0.4;
      pPos[i3 + 2] = Math.sin(a) * dist;

      const t = (dist - 2.6) / 3.1;
      const col = t < 0.3 ? cHot : t < 0.7 ? cWarm : cDeep;
      pCol[i3] = col.r;
      pCol[i3 + 1] = col.g;
      pCol[i3 + 2] = col.b;
    }
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
    pGeo.setAttribute('color', new THREE.BufferAttribute(pCol, 3));
    const pMat = new THREE.PointsMaterial({
      size: 0.11,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const diskParticles = new THREE.Points(pGeo, pMat);
    gargantuaDiskGroup.add(diskParticles);

    // Gravitational Lensing Halo (Bent Light Arc)
    const gargantuaLensingRing = new THREE.Group();
    gargantuaGroup.add(gargantuaLensingRing);

    const lensOuter = new THREE.Mesh(
      new THREE.TorusGeometry(2.68, 0.11, 20, 100),
      new THREE.MeshBasicMaterial({
        color: 0xffe8b8,
        transparent: true,
        opacity: 0.65,
        blending: THREE.AdditiveBlending,
      })
    );
    lensOuter.rotation.x = 0.22;
    gargantuaLensingRing.add(lensOuter);

    const lensHalo = new THREE.Mesh(
      new THREE.RingGeometry(2.58, 3.25, 84),
      new THREE.MeshBasicMaterial({
        color: 0xd4a373,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.28,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    );
    lensHalo.rotation.x = 0.18;
    gargantuaLensingRing.add(lensHalo);

    // Central Point Light from Singularity
    const sunLight = new THREE.PointLight(0xffe4b5, 4.8, 120);
    gargantuaGroup.add(sunLight);

    // Clickable singularity core (Gravity Pulse) + the gravitational shockwave rings it emits
    const singularityHit = new THREE.Mesh(
      new THREE.SphereGeometry(3.2, 12, 12),
      new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.0, depthWrite: false })
    );
    singularityHit.userData = { isCore: true };
    gargantuaGroup.add(singularityHit);

    const createPulseRing = (color) => {
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(0.97, 1.0, 160),
        new THREE.MeshBasicMaterial({
          color,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        })
      );
      ring.rotation.x = Math.PI / 2;
      ring.visible = false;
      solarPlane.add(ring);
      return ring;
    };
    const pulseRings = [createPulseRing(0xfff3d1), createPulseRing(0xd4a373)];

    // 4. Concentric Orbit Rings & Asteroid Belt
    const createRing = (radius, colorHex, opacity) => {
      const ringGeo = new THREE.RingGeometry(radius - 0.03, radius + 0.03, 128);
      const ringMat = new THREE.MeshBasicMaterial({
        color: colorHex,
        side: THREE.DoubleSide,
        transparent: true,
        opacity,
      });
      const mesh = new THREE.Mesh(ringGeo, ringMat);
      mesh.rotation.x = Math.PI / 2;
      solarPlane.add(mesh);
      return mesh;
    };

    createRing(6.6, 0xd4a373, 0.36); // Orbit 1: Missions
    createRing(10.6, 0x5aafa9, 0.32); // Orbit 2: Flight Log
    createRing(17.5, 0xc8bfaf, 0.28); // Orbit 3: Core Systems
    createRing(23.0, 0xf5f2eb, 0.24); // Orbit 4: Relay

    // Asteroid Belt between Orbit 2 and Orbit 3
    const createAsteroidBelt = (parent, centerRadius, count) => {
      const geo = new THREE.BufferGeometry();
      const pos = new Float32Array(count * 3);
      for (let i = 0; i < count; i++) {
        const i3 = i * 3;
        const angle = Math.random() * Math.PI * 2;
        const r = centerRadius + (Math.random() - 0.5) * 1.4;
        pos[i3] = Math.cos(angle) * r;
        pos[i3 + 1] = (Math.random() - 0.5) * 0.4;
        pos[i3 + 2] = Math.sin(angle) * r;
      }
      geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      const mat = new THREE.PointsMaterial({
        size: 0.09,
        color: 0xc8bfaf,
        transparent: true,
        opacity: 0.5,
      });
      const pts = new THREE.Points(geo, mat);
      parent.add(pts);
      return pts;
    };
    createAsteroidBelt(solarPlane, 13.6, 360);

    // Inner Scout Probe & Orbit Ring
    createRing(5.85, 0xd4a373, 0.22);
    const scoutGroup = new THREE.Group();
    solarPlane.add(scoutGroup);
    const scoutMesh = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.25, 0),
      new THREE.MeshBasicMaterial({ color: 0xfff3d1 })
    );
    scoutGroup.add(scoutMesh);
    const scoutData = {
      group: scoutGroup,
      radius: 5.85,
      speed: 0.022,
      angle: 0.5,
    };

    // 5. Four Differentiated Interactive Revolving Planets with 3D Shading
    const interactiveHitObjects = [];

    // Planet 01: Missions & Architecture ("Miller's Water World")
    const p1Group = new THREE.Group();
    solarPlane.add(p1Group);

    const p1CoreGeo = new THREE.SphereGeometry(1.05, 64, 64);
    const p1CoreMat = new THREE.MeshStandardMaterial({
      color: 0x1e6b7b,
      emissive: 0x0b2d39,
      roughness: 0.22,
      metalness: 0.35,
    });
    const p1Core = new THREE.Mesh(p1CoreGeo, p1CoreMat);
    p1Group.add(p1Core);

    const p1WireGeo = new THREE.IcosahedronGeometry(1.26, 1);
    const p1WireMat = new THREE.MeshBasicMaterial({
      color: 0xd4a373,
      wireframe: true,
      transparent: true,
      opacity: 0.42,
    });
    const p1Wire = new THREE.Mesh(p1WireGeo, p1WireMat);
    p1Group.add(p1Wire);

    const p1Ring1 = new THREE.Mesh(
      new THREE.TorusGeometry(1.55, 0.032, 12, 64),
      new THREE.MeshBasicMaterial({ color: 0xd4a373, transparent: true, opacity: 0.75 })
    );
    p1Ring1.rotation.x = Math.PI / 2.4;
    p1Group.add(p1Ring1);

    const p1Ring2 = new THREE.Mesh(
      new THREE.TorusGeometry(1.78, 0.022, 12, 64),
      new THREE.MeshBasicMaterial({ color: 0x70a9a1, transparent: true, opacity: 0.55 })
    );
    p1Ring2.rotation.y = Math.PI / 2.1;
    p1Group.add(p1Ring2);

    const p1ProbeGroup = new THREE.Group();
    p1Group.add(p1ProbeGroup);
    const p1Probe = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.24, 0),
      new THREE.MeshBasicMaterial({ color: 0xfff8e7 })
    );
    p1Probe.position.set(2.05, 0.2, 0);
    p1ProbeGroup.add(p1Probe);

    const hit1 = new THREE.Mesh(
      new THREE.SphereGeometry(2.9, 12, 12),
      new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.0, depthWrite: false })
    );
    hit1.userData = { sectorKey: 'missions', label: 'P-01 // MISSIONS & ARCHITECTURE' };
    p1Core.userData = { sectorKey: 'missions', label: 'P-01 // MISSIONS & ARCHITECTURE' };
    p1Group.add(hit1);
    interactiveHitObjects.push(hit1, p1Core);
    interactiveHitObjects.push(singularityHit);

    // Planet 02: Flight Log & Credentials ("Mann's Frozen World")
    const p2Group = new THREE.Group();
    solarPlane.add(p2Group);

    const p2CoreGeo = new THREE.SphereGeometry(1.32, 64, 64);
    const p2CoreMat = new THREE.MeshStandardMaterial({
      color: 0x5aafa9,
      emissive: 0x16383b,
      roughness: 0.35,
      metalness: 0.2,
    });
    const p2Core = new THREE.Mesh(p2CoreGeo, p2CoreMat);
    p2Group.add(p2Core);

    const p2Atmo = new THREE.Mesh(
      new THREE.SphereGeometry(1.46, 48, 48),
      new THREE.MeshBasicMaterial({ color: 0xa5f3fc, wireframe: true, transparent: true, opacity: 0.25 })
    );
    p2Group.add(p2Atmo);

    const p2MoonOrbitGroup = new THREE.Group();
    p2Group.add(p2MoonOrbitGroup);

    const p2IceRing = new THREE.Mesh(
      new THREE.RingGeometry(1.9, 2.35, 6),
      new THREE.MeshBasicMaterial({ color: 0x89cff0, side: THREE.DoubleSide, transparent: true, opacity: 0.28 })
    );
    p2IceRing.rotation.x = Math.PI / 2.6;
    p2MoonOrbitGroup.add(p2IceRing);

    const p2Moon = new THREE.Mesh(
      new THREE.DodecahedronGeometry(0.38, 0),
      new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.5, flatShading: true })
    );
    p2Moon.position.set(2.45, 0.25, 0);
    p2MoonOrbitGroup.add(p2Moon);

    const p2Probe = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.22, 0),
      new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
    );
    p2Probe.position.set(-1.95, -0.2, 0);
    p2MoonOrbitGroup.add(p2Probe);

    const hit2 = new THREE.Mesh(
      new THREE.SphereGeometry(3.1, 12, 12),
      new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.0, depthWrite: false })
    );
    hit2.userData = { sectorKey: 'experience', label: 'P-02 // FLIGHT LOG & CREDENTIALS' };
    p2Core.userData = { sectorKey: 'experience', label: 'P-02 // FLIGHT LOG & CREDENTIALS' };
    p2Group.add(hit2);
    interactiveHitObjects.push(hit2, p2Core);

    // Planet 03: Core Systems & Stack ("Edmunds Ringed Giant")
    const p3Group = new THREE.Group();
    solarPlane.add(p3Group);

    // Banded gas giant texture with an oval storm so the axial spin is actually visible
    const createGasGiantTexture = () => {
      const c = document.createElement('canvas');
      c.width = 512;
      c.height = 256;
      const ctx = c.getContext('2d');
      const bands = ['#8a4636', '#c06c54', '#d4a373', '#a85a44', '#e0a96d', '#c06c54', '#7a3e30', '#d4a373', '#b5634b'];
      let y = 0;
      while (y < c.height) {
        const h = 10 + Math.random() * 26;
        ctx.fillStyle = bands[Math.floor(Math.random() * bands.length)];
        ctx.fillRect(0, y, c.width, h);
        y += h;
      }
      // Turbulent streaks along the bands
      for (let i = 0; i < 260; i++) {
        ctx.fillStyle = `rgba(${Math.random() < 0.5 ? '245, 242, 235' : '58, 27, 20'}, ${0.05 + Math.random() * 0.12})`;
        ctx.fillRect(Math.random() * c.width, Math.random() * c.height, 20 + Math.random() * 90, 1 + Math.random() * 3);
      }
      // Great storm
      ctx.fillStyle = 'rgba(245, 242, 235, 0.55)';
      ctx.beginPath();
      ctx.ellipse(150, 165, 34, 13, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(192, 108, 84, 0.9)';
      ctx.beginPath();
      ctx.ellipse(150, 165, 22, 7, 0, 0, Math.PI * 2);
      ctx.fill();
      const tex = new THREE.CanvasTexture(c);
      tex.wrapS = THREE.RepeatWrapping;
      return tex;
    };

    const p3CoreGeo = new THREE.SphereGeometry(1.9, 64, 64);
    const p3CoreMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: createGasGiantTexture(),
      emissive: 0x3a1b14,
      roughness: 0.45,
      metalness: 0.15,
    });
    const p3Core = new THREE.Mesh(p3CoreGeo, p3CoreMat);
    p3Group.add(p3Core);

    const p3BandMesh = new THREE.Mesh(
      new THREE.SphereGeometry(1.98, 28, 10),
      new THREE.MeshBasicMaterial({ color: 0xd4a373, wireframe: true, transparent: true, opacity: 0.32 })
    );
    p3Group.add(p3BandMesh);

    const p3RingGroup = new THREE.Group();
    p3RingGroup.rotation.x = Math.PI * 0.41;
    p3RingGroup.rotation.y = 0.22;
    p3Group.add(p3RingGroup);

    const p3R1 = new THREE.Mesh(
      new THREE.RingGeometry(2.35, 3.05, 84),
      new THREE.MeshBasicMaterial({ color: 0xd4a373, side: THREE.DoubleSide, transparent: true, opacity: 0.62 })
    );
    const p3R2 = new THREE.Mesh(
      new THREE.RingGeometry(3.22, 4.35, 84),
      new THREE.MeshBasicMaterial({ color: 0xc8bfaf, side: THREE.DoubleSide, transparent: true, opacity: 0.38 })
    );
    const p3R3 = new THREE.Mesh(
      new THREE.RingGeometry(4.52, 5.05, 84),
      new THREE.MeshBasicMaterial({ color: 0xe0a96d, side: THREE.DoubleSide, transparent: true, opacity: 0.22 })
    );
    p3RingGroup.add(p3R1, p3R2, p3R3);

    // Ring dust: uneven particles make the ring rotation readable
    const p3DustCount = 520;
    const p3DustPos = new Float32Array(p3DustCount * 3);
    for (let i = 0; i < p3DustCount; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = 2.4 + Math.random() * 2.6;
      p3DustPos[i * 3] = Math.cos(a) * r;
      p3DustPos[i * 3 + 1] = Math.sin(a) * r;
      p3DustPos[i * 3 + 2] = (Math.random() - 0.5) * 0.08;
    }
    const p3DustGeo = new THREE.BufferGeometry();
    p3DustGeo.setAttribute('position', new THREE.BufferAttribute(p3DustPos, 3));
    const p3Dust = new THREE.Points(
      p3DustGeo,
      new THREE.PointsMaterial({ color: 0xfff3d1, size: 0.07, transparent: true, opacity: 0.85, depthWrite: false })
    );
    p3RingGroup.add(p3Dust);

    const p3MoonGroup = new THREE.Group();
    p3Group.add(p3MoonGroup);

    const p3Shepherd1 = new THREE.Mesh(
      new THREE.SphereGeometry(0.28, 12, 12),
      new THREE.MeshStandardMaterial({ color: 0xf5f2eb })
    );
    p3Shepherd1.position.set(5.3, 0.3, 0);

    const p3Shepherd2 = new THREE.Mesh(
      new THREE.SphereGeometry(0.22, 12, 12),
      new THREE.MeshStandardMaterial({ color: 0xd4a373 })
    );
    p3Shepherd2.position.set(-3.6, -0.25, 1.2);
    p3MoonGroup.add(p3Shepherd1, p3Shepherd2);

    const hit3 = new THREE.Mesh(
      new THREE.SphereGeometry(3.8, 12, 12),
      new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.0, depthWrite: false })
    );
    hit3.userData = { sectorKey: 'systems', label: 'P-03 // CORE SYSTEMS & STACK' };
    p3Core.userData = { sectorKey: 'systems', label: 'P-03 // CORE SYSTEMS & STACK' };
    p3Group.add(hit3, p3Core);
    interactiveHitObjects.push(hit3, p3Core);

    // Planet 04: Telemetry Relay ("Cooper Station Dyson Relay")
    const p4Group = new THREE.Group();
    solarPlane.add(p4Group);

    const p4CoreGeo = new THREE.OctahedronGeometry(1.15, 2);
    const p4CoreMat = new THREE.MeshStandardMaterial({
      color: 0xf5f2eb,
      emissive: 0x2a3648,
      roughness: 0.18,
      metalness: 0.6,
      flatShading: true,
    });
    const p4Core = new THREE.Mesh(p4CoreGeo, p4CoreMat);
    p4Group.add(p4Core);

    const p4StationTorus = new THREE.Mesh(
      new THREE.TorusGeometry(1.75, 0.11, 16, 64),
      new THREE.MeshStandardMaterial({
        color: 0xcbd5e1,
        emissive: 0x1e293b,
        roughness: 0.3,
        metalness: 0.75,
      })
    );
    p4StationTorus.rotation.x = Math.PI / 3;
    p4Group.add(p4StationTorus);

    const p4PolarDish = new THREE.Mesh(
      new THREE.TorusGeometry(2.15, 0.03, 12, 48),
      new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.65 })
    );
    p4PolarDish.rotation.y = Math.PI / 2;
    p4Group.add(p4PolarDish);

    const p4ProbeGroup = new THREE.Group();
    p4Group.add(p4ProbeGroup);

    const p4P1 = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.28, 0),
      new THREE.MeshBasicMaterial({ color: 0xd4a373 })
    );
    p4P1.position.set(2.6, 0, 0);

    const p4P2 = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.28, 0),
      new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
    );
    p4P2.position.set(-2.6, 0, 0);
    p4ProbeGroup.add(p4P1, p4P2);

    const hit4 = new THREE.Mesh(
      new THREE.SphereGeometry(3.2, 12, 12),
      new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.0, depthWrite: false })
    );
    hit4.userData = { sectorKey: 'contact', label: 'P-04 // DEEP SPACE RELAY' };
    p4Core.userData = { sectorKey: 'contact', label: 'P-04 // DEEP SPACE RELAY' };
    p4Group.add(hit4);
    interactiveHitObjects.push(hit4, p4Core);

    const planetsData = {
      missions: {
        key: 'missions',
        bodyRadius: 1.3,
        group: p1Group,
        coreMesh: p1Core,
        wireMesh: p1Wire,
        ring1: p1Ring1,
        ring2: p1Ring2,
        probeGroup: p1ProbeGroup,
        radius: 6.6,
        speed: 0.011,
        angle: 1.1,
        targetScale: 1.0,
      },
      experience: {
        key: 'experience',
        bodyRadius: 1.5,
        group: p2Group,
        coreMesh: p2Core,
        atmoMesh: p2Atmo,
        moonOrbitGroup: p2MoonOrbitGroup,
        radius: 10.6,
        speed: 0.008,
        angle: 3.5,
        targetScale: 1.0,
      },
      systems: {
        key: 'systems',
        bodyRadius: 2.3,
        group: p3Group,
        coreMesh: p3Core,
        wireMesh: p3BandMesh,
        ringGroup: p3RingGroup,
        moonGroup: p3MoonGroup,
        radius: 17.5,
        speed: 0.0052,
        angle: 5.2,
        targetScale: 1.0,
      },
      contact: {
        key: 'contact',
        bodyRadius: 1.8,
        group: p4Group,
        coreMesh: p4Core,
        stationTorus: p4StationTorus,
        polarDish: p4PolarDish,
        probeGroup: p4ProbeGroup,
        radius: 23.0,
        speed: 0.0038,
        angle: 2.1,
        targetScale: 1.0,
      },
    };

    // 6. 3D Orbital Anchors for 9 Differentiated Skill Stars
    const skillNodes = {};
    TECH_STARS.forEach((star) => {
      const node = new THREE.Group();
      solarPlane.add(node);

      const sScale = (star.scale || 1.0) * 0.9;
      let wireMesh = null;
      let ring1 = null;
      let ring2 = null;
      const moonGroup = new THREE.Group();
      node.add(moonGroup);

      if (star.id === 'docker') {
        wireMesh = new THREE.Mesh(
          new THREE.BoxGeometry(sScale * 1.35, sScale * 1.35, sScale * 1.35),
          new THREE.MeshBasicMaterial({ color: 0x2496ed, wireframe: true, transparent: true, opacity: 0.45 })
        );
        ring1 = new THREE.Mesh(
          new THREE.RingGeometry(sScale * 1.3, sScale * 1.42, 32),
          new THREE.MeshBasicMaterial({ color: 0x2496ed, side: THREE.DoubleSide, transparent: true, opacity: 0.5 })
        );
        ring1.rotation.x = Math.PI / 2;
        const moonMesh = new THREE.Mesh(
          new THREE.BoxGeometry(sScale * 0.22, sScale * 0.22, sScale * 0.22),
          new THREE.MeshBasicMaterial({ color: 0xffffff })
        );
        moonMesh.position.set(sScale * 1.55, 0, 0);
        moonGroup.add(moonMesh);
      } else if (star.id === 'golang') {
        wireMesh = new THREE.Mesh(
          new THREE.IcosahedronGeometry(sScale * 1.08, 1),
          new THREE.MeshBasicMaterial({ color: 0x00add8, wireframe: true, transparent: true, opacity: 0.42 })
        );
        ring1 = new THREE.Mesh(
          new THREE.RingGeometry(sScale * 1.25, sScale * 1.36, 36),
          new THREE.MeshBasicMaterial({ color: 0x00add8, side: THREE.DoubleSide, transparent: true, opacity: 0.55 })
        );
        ring1.rotation.x = Math.PI / 2.5;
        ring2 = new THREE.Mesh(
          new THREE.RingGeometry(sScale * 1.42, sScale * 1.48, 36),
          new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide, transparent: true, opacity: 0.35 })
        );
        ring2.rotation.y = Math.PI / 2.3;
        node.add(ring2);
        const moon1 = new THREE.Mesh(
          new THREE.SphereGeometry(sScale * 0.18, 8, 8),
          new THREE.MeshBasicMaterial({ color: 0xffffff })
        );
        moon1.position.set(sScale * 1.55, 0, 0);
        const moon2 = new THREE.Mesh(
          new THREE.SphereGeometry(sScale * 0.15, 8, 8),
          new THREE.MeshBasicMaterial({ color: 0x00add8 })
        );
        moon2.position.set(-sScale * 1.55, 0, 0);
        moonGroup.add(moon1, moon2);
      } else if (star.id === 'nodejs') {
        wireMesh = new THREE.Mesh(
          new THREE.SphereGeometry(sScale * 0.95, 12, 12),
          new THREE.MeshBasicMaterial({ color: 0x339933, wireframe: true, transparent: true, opacity: 0.35 })
        );
        ring1 = new THREE.Mesh(
          new THREE.RingGeometry(sScale * 1.25, sScale * 1.38, 6),
          new THREE.MeshBasicMaterial({ color: 0x339933, side: THREE.DoubleSide, transparent: true, opacity: 0.6 })
        );
        ring1.rotation.x = Math.PI / 2.6;
        const moon1 = new THREE.Mesh(
          new THREE.SphereGeometry(sScale * 0.17, 8, 8),
          new THREE.MeshBasicMaterial({ color: 0xffffff })
        );
        moon1.position.set(sScale * 1.52, 0, 0);
        moonGroup.add(moon1);
      } else if (star.id === 'postgres') {
        wireMesh = new THREE.Mesh(
          new THREE.SphereGeometry(sScale * 1.0, 16, 8),
          new THREE.MeshBasicMaterial({ color: 0x4169e1, wireframe: true, transparent: true, opacity: 0.38 })
        );
        ring1 = new THREE.Mesh(
          new THREE.RingGeometry(sScale * 1.18, sScale * 1.30, 48),
          new THREE.MeshBasicMaterial({ color: 0x4169e1, side: THREE.DoubleSide, transparent: true, opacity: 0.52 })
        );
        ring1.rotation.x = Math.PI / 2.8;
        ring2 = new THREE.Mesh(
          new THREE.RingGeometry(sScale * 1.48, sScale * 1.62, 48),
          new THREE.MeshBasicMaterial({ color: 0x89cff0, side: THREE.DoubleSide, transparent: true, opacity: 0.32 })
        );
        ring2.rotation.x = Math.PI / 2.8;
        node.add(ring2);
        const moon1 = new THREE.Mesh(
          new THREE.SphereGeometry(sScale * 0.19, 8, 8),
          new THREE.MeshBasicMaterial({ color: 0x89cff0 })
        );
        moon1.position.set(sScale * 1.68, 0, 0);
        moonGroup.add(moon1);
      } else if (star.id === 'redis') {
        wireMesh = new THREE.Mesh(
          new THREE.SphereGeometry(sScale * 1.1, 10, 10),
          new THREE.MeshBasicMaterial({ color: 0xdc382d, wireframe: true, transparent: true, opacity: 0.48 })
        );
        ring1 = new THREE.Mesh(
          new THREE.RingGeometry(sScale * 1.25, sScale * 1.35, 36),
          new THREE.MeshBasicMaterial({ color: 0xdc382d, side: THREE.DoubleSide, transparent: true, opacity: 0.55 })
        );
        ring1.rotation.x = Math.PI / 2.4;
        const moon1 = new THREE.Mesh(
          new THREE.SphereGeometry(sScale * 0.18, 8, 8),
          new THREE.MeshBasicMaterial({ color: 0xffffff })
        );
        moon1.position.set(sScale * 1.45, 0, 0);
        const moon2 = new THREE.Mesh(
          new THREE.SphereGeometry(sScale * 0.14, 8, 8),
          new THREE.MeshBasicMaterial({ color: 0xffa07a })
        );
        moon2.position.set(-sScale * 1.65, 0, 0);
        moonGroup.add(moon1, moon2);
      } else if (star.id === 'php') {
        wireMesh = new THREE.Mesh(
          new THREE.SphereGeometry(sScale * 0.95, 12, 12),
          new THREE.MeshBasicMaterial({ color: 0x777bb4, wireframe: true, transparent: true, opacity: 0.28 })
        );
        ring1 = new THREE.Mesh(
          new THREE.RingGeometry(sScale * 1.32, sScale * 2.05, 48),
          new THREE.MeshBasicMaterial({ color: 0x777bb4, side: THREE.DoubleSide, transparent: true, opacity: 0.42 })
        );
        ring1.rotation.x = Math.PI / 2.7;
        const moon1 = new THREE.Mesh(
          new THREE.SphereGeometry(sScale * 0.18, 8, 8),
          new THREE.MeshBasicMaterial({ color: 0xc8bfaf })
        );
        moon1.position.set(sScale * 2.2, 0, 0);
        moonGroup.add(moon1);
      } else if (star.id === 'laravel') {
        wireMesh = new THREE.Mesh(
          new THREE.SphereGeometry(sScale * 0.96, 12, 12),
          new THREE.MeshBasicMaterial({ color: 0xff2d20, wireframe: true, transparent: true, opacity: 0.35 })
        );
        ring1 = new THREE.Mesh(
          new THREE.RingGeometry(sScale * 1.25, sScale * 1.32, 36),
          new THREE.MeshBasicMaterial({ color: 0xff2d20, side: THREE.DoubleSide, transparent: true, opacity: 0.5 })
        );
        ring1.rotation.x = Math.PI / 2.6;
        ring2 = new THREE.Mesh(
          new THREE.RingGeometry(sScale * 1.34, sScale * 1.40, 36),
          new THREE.MeshBasicMaterial({ color: 0xff7f7f, side: THREE.DoubleSide, transparent: true, opacity: 0.35 })
        );
        ring2.rotation.y = Math.PI / 3;
        node.add(ring2);
        const moon1 = new THREE.Mesh(
          new THREE.SphereGeometry(sScale * 0.18, 8, 8),
          new THREE.MeshBasicMaterial({ color: 0xffffff })
        );
        moon1.position.set(sScale * 1.5, 0, 0);
        moonGroup.add(moon1);
      } else if (star.id === 'nextjs') {
        wireMesh = new THREE.Mesh(
          new THREE.SphereGeometry(sScale * 0.95, 12, 12),
          new THREE.MeshBasicMaterial({ color: 0xe5e7eb, wireframe: true, transparent: true, opacity: 0.35 })
        );
        ring1 = new THREE.Mesh(
          new THREE.RingGeometry(sScale * 1.3, sScale * 1.38, 48),
          new THREE.MeshBasicMaterial({ color: 0xe5e7eb, side: THREE.DoubleSide, transparent: true, opacity: 0.5 })
        );
        ring1.rotation.y = Math.PI / 2;
        const moon1 = new THREE.Mesh(
          new THREE.SphereGeometry(sScale * 0.20, 8, 8),
          new THREE.MeshBasicMaterial({ color: 0xffffff })
        );
        moon1.position.set(0, sScale * 1.52, 0);
        moonGroup.add(moon1);
      } else if (star.id === 'grafana') {
        wireMesh = new THREE.Mesh(
          new THREE.SphereGeometry(sScale * 1.0, 12, 12),
          new THREE.MeshBasicMaterial({ color: 0xf46800, wireframe: true, transparent: true, opacity: 0.38 })
        );
        ring1 = new THREE.Mesh(
          new THREE.RingGeometry(sScale * 1.25, sScale * 1.36, 48),
          new THREE.MeshBasicMaterial({ color: 0xf46800, side: THREE.DoubleSide, transparent: true, opacity: 0.55 })
        );
        ring1.rotation.x = Math.PI / 2.6;
        const moon1 = new THREE.Mesh(
          new THREE.SphereGeometry(sScale * 0.18, 8, 8),
          new THREE.MeshBasicMaterial({ color: 0xffa500 })
        );
        moon1.position.set(sScale * 1.52, 0, 0);
        moonGroup.add(moon1);
      }

      if (wireMesh) node.add(wireMesh);
      if (ring1) node.add(ring1);

      // Visual body radius in world units; the DOM orb is sized from its projection every frame
      let bodyRadius = sScale;
      if (wireMesh) {
        wireMesh.geometry.computeBoundingSphere();
        bodyRadius = wireMesh.geometry.boundingSphere.radius;
        // A cube's bounding sphere overshoots its silhouette; use the half side instead
        if (star.id === 'docker') bodyRadius /= Math.sqrt(3);
      }

      skillNodes[star.id] = {
        node,
        wireMesh,
        ring1,
        ring2,
        moonGroup,
        moonAngle: Math.random() * Math.PI * 2,
        radius: star.orbitRadius,
        speed: star.orbitSpeed,
        angle: star.orbitAngle,
        yOffset: star.yOffset || 0,
        yAmp: star.yAmp || 0.8,
        yFreq: star.yFreq || 1.8,
        scale: star.scale || 1.0,
        bodyRadius,
        orbDiameter: 0,
      };
    });

    // 7. 3D Flight Simulation for Fleet Dogfight (3 Rockets pursuing 3 Aliens)
    const fleetSim = {
      pair1: { t: 0.0, speed: 0.0075 },
      pair2: { t: 2.1, speed: 0.0058 },
      pair3: { t: 4.3, speed: 0.0068 },
    };
    // Reinforcement saucers (typing hunt) fly solo orbits
    const extraUfos = UFO_FLEET.filter((u) => u.orbit).map((u) => ({
      id: u.id,
      orbit: u.orbit,
      sim: { t: u.orbit.phase, speed: u.orbit.speed },
    }));

    const getEntityPosition = (id, time) => {
      let x = 0, y = 0, z = 0;
      const extra = extraUfos.find((u) => u.id === id);
      if (extra) return getExtraUfoPosition(extra.orbit, time);
      if (id === 'alien-1') {
        const r = 14.5 + Math.sin(time * 3.0) * 1.8;
        x = Math.cos(time) * r;
        z = Math.sin(time) * (r * 1.06);
        y = Math.sin(time * 2.4) * 3.2;
      } else if (id === 'rocket-1') {
        const t = time - 0.22;
        const r = 14.2 + Math.sin(t * 3.0) * 1.6;
        x = Math.cos(t) * r;
        z = Math.sin(t) * (r * 1.06);
        y = Math.sin(t * 2.4) * 3.0;
      } else if (id === 'alien-2') {
        const r = 20.5;
        x = Math.cos(time) * r;
        z = Math.sin(time) * 19.0;
        y = Math.cos(time * 2.0) * 4.2;
      } else if (id === 'rocket-2') {
        const t = time - 0.20;
        x = Math.cos(t) * 20.0;
        z = Math.sin(t) * 18.5;
        y = Math.cos(t * 2.0) * 4.0;
      } else if (id === 'alien-3') {
        const r = 10.5 + Math.cos(time * 2.0) * 1.5;
        x = Math.cos(time) * r;
        z = Math.sin(time) * (r * 1.1);
        y = Math.sin(time * 3.0) * 2.2;
      } else if (id === 'rocket-3') {
        const t = time - 0.24;
        const r = 10.1 + Math.cos(t * 2.0) * 1.4;
        x = Math.cos(t) * r;
        z = Math.sin(t) * (r * 1.1);
        y = Math.sin(t * 3.0) * 2.0;
      }
      return { x, y, z };
    };

    // Cache DOM Elements for 60FPS Transform Updates
    const domStarCache = {};
    const domFleetCache = {};
    const domPlanetCache = {};

    // 8. Raycaster & Desktop Pointer Drag-to-Orbit
    const raycaster = new THREE.Raycaster();
    const mouseVector = new THREE.Vector2();

    let isPointerOrbiting = false;
    let dragStartX = 0;
    let dragStartY = 0;
    let totalDragDist = 0;

    const handlePointerDown = (e) => {
      if (e.button !== 0) return;
      isPointerOrbiting = true;
      totalDragDist = 0;
      stateRef.current.lastDragDistance = 0;
      dragStartX = e.clientX;
      dragStartY = e.clientY;
      canvas.classList.add('is-dragging-orbit');
    };

    const handlePointerMove = (e) => {
      if (!isPointerOrbiting) return;
      const dx = e.clientX - dragStartX;
      const dy = e.clientY - dragStartY;
      totalDragDist += Math.hypot(dx, dy);
      stateRef.current.lastDragDistance = totalDragDist;
      dragStartX = e.clientX;
      dragStartY = e.clientY;

      if (totalDragDist > 4) {
        if (stateRef.current.currentCamTarget !== 'overview') {
          stateRef.current.currentCamTarget = 'overview';
          document.querySelectorAll('.cam-btn').forEach((btn) => {
            btn.classList.toggle('active', btn.getAttribute('data-cam-target') === 'overview');
          });
        }

        const azimuthDelta = -dx * 0.0055;
        const elevationDelta = dy * 0.0042;

        stateRef.current.orbitalVelocityX = azimuthDelta * 0.35;
        stateRef.current.targetOrbitalAngle += azimuthDelta;

        stateRef.current.orbitalVelocityY = elevationDelta * 0.35;
        stateRef.current.targetElevation = Math.max(-1.35, Math.min(1.35, stateRef.current.targetElevation + elevationDelta));
      }
    };

    const handlePointerUp = () => {
      if (!isPointerOrbiting) return;
      isPointerOrbiting = false;
      canvas.classList.remove('is-dragging-orbit');
    };

    canvas.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);

    // Gravity Pulse: a gravitational wave rolls out from the singularity, shoving each planet
    // outward as it passes and detonating the skill planets in a chain reaction.
    const PULSE_DURATION = 2600; // ms
    const PULSE_MAX_RADIUS = 30;
    const triggerGravityPulse = () => {
      const s = stateRef.current;
      if (s.pulseStart && performance.now() - s.pulseStart < PULSE_DURATION) return;
      s.pulseStart = performance.now();
      s.pulseDetonated = {};
      audioEngine.playSingularityPulse();
      window.dispatchEvent(new CustomEvent('singularityPulse'));
    };

    const handleCanvasClick = (e) => {
      if (stateRef.current.lastDragDistance > 6) {
        stateRef.current.lastDragDistance = 0;
        return;
      }
      if (e.target && typeof e.target.closest === 'function') {
        if (
          e.target.closest('dialog') ||
          e.target.closest('.cockpit-modal') ||
          e.target.closest('.top-hud') ||
          e.target.closest('.bottom-hud') ||
          e.target.closest('.scroll-loop-hud') ||
          e.target.closest('.scroll-hud-fab') ||
          e.target.closest('.hero-overlay') ||
          e.target.closest('.celestial-skill-star') ||
          e.target.closest('.draggable-entity') ||
          e.target.closest('.planet-floating-hud')
        ) {
          return;
        }
      }

      mouseVector.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouseVector.y = -(e.clientY / window.innerHeight) * 2 + 1;

      raycaster.setFromCamera(mouseVector, camera);
      const intersects = raycaster.intersectObjects(interactiveHitObjects);

      if (intersects.length > 0 && intersects[0].object.userData.isCore) {
        triggerGravityPulse();
        return;
      }

      if (intersects.length > 0) {
        const sectorKey = intersects[0].object.userData.sectorKey;
        if (onPlanetClick) {
          audioEngine.playWarpSound();
          onPlanetClick(sectorKey);
        }
      }
    };

    const handleWheel = (e) => {
      if (e.target && typeof e.target.closest === 'function') {
        if (e.target.closest('dialog') || e.target.closest('.cockpit-modal')) return;
      }
      e.preventDefault();

      if (stateRef.current.currentCamTarget !== 'overview') {
        stateRef.current.currentCamTarget = 'overview';
      }

      const dx = e.deltaX || 0;
      const dy = e.deltaY || 0;

      if (Math.abs(dx) > Math.abs(dy)) {
        const azimuthDelta = dx * 0.0035;
        stateRef.current.orbitalVelocityX += azimuthDelta * 0.12;
        stateRef.current.targetOrbitalAngle += azimuthDelta;
      } else if (e.shiftKey) {
        const elevationDelta = -dy * 0.0022;
        stateRef.current.targetElevation = Math.max(-1.35, Math.min(1.35, stateRef.current.targetElevation + elevationDelta));
      } else {
        const zoomDelta = dy * 0.024;
        stateRef.current.targetRadius = Math.max(13.5, Math.min(48.0, stateRef.current.targetRadius + zoomDelta));
        stateRef.current.targetOrbitalAngle += dy * 0.0006;
      }
    };

    let touchStartX = 0;
    let touchStartY = 0;
    let initialPinchDist = 0;
    let initialPinchRadius = 0;

    const handleTouchStart = (e) => {
      if (e.touches.length === 1) {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
      } else if (e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        initialPinchDist = Math.sqrt(dx * dx + dy * dy);
        initialPinchRadius = stateRef.current.targetRadius;
      }
    };

    const handleTouchMove = (e) => {
      if (e.touches.length === 1) {
        if (e.target && typeof e.target.closest === 'function' && e.target.closest('dialog')) return;

        const deltaX = touchStartX - e.touches[0].clientX;
        const deltaY = touchStartY - e.touches[0].clientY;
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;

        if (stateRef.current.currentCamTarget !== 'overview') {
          stateRef.current.currentCamTarget = 'overview';
        }

        const azimuthDelta = deltaX * 0.0045;
        stateRef.current.orbitalVelocityX += azimuthDelta * 0.14;
        stateRef.current.targetOrbitalAngle += azimuthDelta;

        const elevationDelta = deltaY * 0.0032;
        stateRef.current.orbitalVelocityY += elevationDelta * 0.14;
        stateRef.current.targetElevation = Math.max(-1.35, Math.min(1.35, stateRef.current.targetElevation + elevationDelta));
      } else if (e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const currentDist = Math.sqrt(dx * dx + dy * dy);
        if (initialPinchDist > 10) {
          const ratio = initialPinchDist / currentDist;
          stateRef.current.targetRadius = Math.max(13.5, Math.min(48.0, initialPinchRadius * ratio));
        }
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight') stateRef.current.targetOrbitalAngle += 0.2;
      else if (e.key === 'ArrowLeft') stateRef.current.targetOrbitalAngle -= 0.2;
      else if (e.key === 'ArrowUp') stateRef.current.targetElevation = Math.min(1.35, stateRef.current.targetElevation + 0.15);
      else if (e.key === 'ArrowDown') stateRef.current.targetElevation = Math.max(-1.35, stateRef.current.targetElevation - 0.15);
      else if (e.key === '+' || e.key === '=') stateRef.current.targetRadius = Math.max(13.5, stateRef.current.targetRadius - 3.5);
      else if (e.key === '-' || e.key === '_') stateRef.current.targetRadius = Math.min(48.0, stateRef.current.targetRadius + 3.5);
    };

    const handleMouseMove = (e) => {
      stateRef.current.mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
      stateRef.current.mouseY = (e.clientY / window.innerHeight - 0.5) * 2;

      mouseVector.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouseVector.y = -(e.clientY / window.innerHeight) * 2 + 1;
      raycaster.setFromCamera(mouseVector, camera);
      const intersects = raycaster.intersectObjects(interactiveHitObjects);

      let detectedSector = null;
      if (intersects.length > 0) {
        detectedSector = intersects[0].object.userData.sectorKey;
      }

      const overCore = intersects.length > 0 && !!intersects[0].object.userData.isCore;
      if (overCore !== stateRef.current.coreHovered) {
        stateRef.current.coreHovered = overCore;
        if (overCore) {
          document.body.style.cursor = 'pointer';
          audioEngine.playUiClick(420, 'sine', 0.03);
        } else if (!stateRef.current.hoveredPlanet) {
          document.body.style.cursor = '';
        }
      }

      if (detectedSector) {
        if (stateRef.current.hoveredPlanet !== detectedSector) {
          stateRef.current.hoveredPlanet = detectedSector;
          audioEngine.playUiClick(640, 'sine', 0.02);
          document.body.style.cursor = 'pointer';

          for (const key in planetsData) {
            const btn = document.getElementById(`planet-hud-${key}`);
            if (btn) btn.classList.toggle('is-hovered', key === detectedSector);
          }
        }
      } else {
        if (stateRef.current.hoveredPlanet && !stateRef.current.hoveredViaDom) {
          stateRef.current.hoveredPlanet = null;
          for (const key in planetsData) {
            const btn = document.getElementById(`planet-hud-${key}`);
            if (btn) btn.classList.remove('is-hovered');
          }
          if (!e.target || !e.target.closest('.planet-floating-hud, .celestial-skill-star, button, a')) {
            document.body.style.cursor = '';
          }
        }
      }
    };

    // Custom Event Listener for hovering from DOM HUD tags
    const handlePlanetHoverEvent = (e) => {
      const { sector, isHovered } = e.detail || {};
      if (isHovered && sector) {
        stateRef.current.hoveredPlanet = sector;
        stateRef.current.hoveredViaDom = true;
        document.body.style.cursor = 'pointer';
        audioEngine.playUiClick(580, 'sine', 0.02);
        for (const key in planetsData) {
          const btn = document.getElementById(`planet-hud-${key}`);
          if (btn) btn.classList.toggle('is-hovered', key === sector);
        }
      } else {
        if (stateRef.current.hoveredPlanet === sector) {
          stateRef.current.hoveredPlanet = null;
          stateRef.current.hoveredViaDom = false;
          document.body.style.cursor = '';
          for (const key in planetsData) {
            const btn = document.getElementById(`planet-hud-${key}`);
            if (btn) btn.classList.remove('is-hovered');
          }
        }
      }
    };
    window.addEventListener('planetHoverChange', handlePlanetHoverEvent);

    // Custom Event Listeners for Skill Star Pop Explosion & Respawn
    const handleSkillExplode = (e) => {
      const { id } = e.detail || {};
      if (id && skillNodes[id]) {
        skillNodes[id].isExploding = true;
        skillNodes[id].isRespawning = false;
      }
    };

    const handleSkillRespawn = (e) => {
      const { id } = e.detail || {};
      if (id && skillNodes[id]) {
        skillNodes[id].isExploding = false;
        skillNodes[id].isRespawning = true;
      }
    };

    window.addEventListener('skillStarExplode', handleSkillExplode);
    window.addEventListener('skillStarRespawn', handleSkillRespawn);

    let hudOrigin = null; // window offset of the planet label container, refreshed on resize
    const handleResize = () => {
      hudOrigin = null;
      const mob = window.innerWidth < 768;
      const aspect = window.innerWidth / window.innerHeight;
      camera.aspect = aspect;
      if (aspect < 1.0) {
        camera.fov = Math.min(76, Math.max(54, (54 / aspect) * 0.58));
      } else {
        camera.fov = 54;
      }
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('click', handleCanvasClick);
    window.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('resize', handleResize);

    // 9. Animation Loop
    const projectVector = new THREE.Vector3();
    const tempWorldPos = new THREE.Vector3();
    const tempAheadPos = new THREE.Vector3();
    const pAheadProj = new THREE.Vector3();

    const ORB_BASE_PX = 44; // .star-orb-body diameter at --orb-scale: 1
    const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    // On-screen radius (px) of a world-space sphere: project its center and a point one radius along camera-up
    const camUpVec = new THREE.Vector3();
    const radiusProbe = new THREE.Vector3();
    const radiusCenter = new THREE.Vector3();
    const projectRadiusPx = (worldPos, worldRadius) => {
      camUpVec.set(0, 1, 0).applyQuaternion(camera.quaternion);
      radiusCenter.copy(worldPos).project(camera);
      radiusProbe.copy(worldPos).addScaledVector(camUpVec, worldRadius).project(camera);
      return Math.abs(radiusProbe.y - radiusCenter.y) * 0.5 * window.innerHeight;
    };

    const animate = () => {
      animId = requestAnimationFrame(animate);

      // Star Points Subtle Drift
      starPoints.rotation.y += 0.00025;
      starPoints.rotation.x += 0.0001;

      // Gravity Pulse progress (t: 0..1 while active, -1 when idle)
      const pulseElapsed = stateRef.current.pulseStart ? performance.now() - stateRef.current.pulseStart : Infinity;
      const pulseT = pulseElapsed < PULSE_DURATION ? pulseElapsed / PULSE_DURATION : -1;
      const pulseWaveR = pulseT >= 0 ? (1 - Math.pow(1 - pulseT, 1.6)) * PULSE_MAX_RADIUS : -100;
      const pulseFlash = pulseT >= 0 ? Math.exp(-pulseT * 7) : 0;
      const pulseBoost = pulseT >= 0 ? Math.pow(1 - pulseT, 2) : 0;
      // Radial shove applied to bodies near the wavefront
      const pulsePush = (r) => (pulseT >= 0 ? 1.8 * Math.exp(-Math.pow((pulseWaveR - r) / 2.4, 2)) * (1 - pulseT) : 0);

      pulseRings.forEach((ring, i) => {
        const ringR = pulseWaveR - i * 2.2;
        ring.visible = pulseT >= 0 && ringR > 0.5;
        if (ring.visible) {
          ring.scale.set(ringR, ringR, ringR);
          ring.material.opacity = (i === 0 ? 0.85 : 0.45) * (1 - pulseT);
        }
      });

      glowSprite.scale.setScalar(11.5 * (1 + 0.9 * pulseFlash + (stateRef.current.coreHovered ? 0.12 : 0)));
      sunLight.intensity = 4.8 * (1 + 3 * pulseFlash);

      // Rotate Gargantua Accretion Disk, Corona, and Lensing Arc
      if (gargantuaDiskGroup) {
        gargantuaDiskGroup.rotation.y -= 0.014 * (1 + 7 * pulseBoost);
      }
      if (gargantuaCorona) {
        gargantuaCorona.rotation.y += 0.008;
        gargantuaCorona.rotation.z -= 0.005;
      }
      if (gargantuaLensingRing && camera) {
        gargantuaLensingRing.rotation.y = stateRef.current.orbitalAngle;
      }

      // Inner Scout Probe Orbit
      scoutData.angle += scoutData.speed;
      scoutData.group.position.x = Math.cos(scoutData.angle) * scoutData.radius;
      scoutData.group.position.z = Math.sin(scoutData.angle) * scoutData.radius;

      // Update 4 Sector Planets with Slowdown, Scale Lerp & Satellite Revolutions
      for (const key in planetsData) {
        const p = planetsData[key];
        const isHovered = stateRef.current.hoveredPlanet === key;
        const isDockedTarget = stateRef.current.currentCamTarget === key;

        // Active docked planet slows down to 0.12x; hover slows to 0.2x!
        p.angle += p.speed * (isDockedTarget ? 0.12 : isHovered ? 0.2 : 1.0);
        const pPush = pulsePush(p.radius);
        p.group.position.x = Math.cos(p.angle) * (p.radius + pPush);
        p.group.position.z = Math.sin(p.angle) * (p.radius + pPush);
        p.group.position.y = pPush * 0.35;

        // Smooth scale lerp (enlarge when hovered!)
        p.targetScale = isHovered ? 1.35 : 1.0;
        const curScale = p.group.scale.x;
        const nextScale = curScale + (p.targetScale - curScale) * 0.12;
        p.group.scale.set(nextScale, nextScale, nextScale);

        // Dynamic axial rotation (spinning planet cores & rings)
        if (p.coreMesh) p.coreMesh.rotation.y += 0.01;
        if (p.wireMesh) p.wireMesh.rotation.y -= 0.008;
        if (p.atmoMesh) p.atmoMesh.rotation.y += 0.01;
        if (p.ring1) p.ring1.rotation.z += 0.018;
        if (p.ring2) p.ring2.rotation.x += 0.015;
        if (p.moonOrbitGroup) p.moonOrbitGroup.rotation.y += 0.038;
        if (p.moonGroup) p.moonGroup.rotation.y += 0.032;
        if (p.ringGroup) p.ringGroup.rotation.z += 0.012;
        if (p.probeGroup) p.probeGroup.rotation.y += 0.045;
      }

      // Update Skills 3D Positions in Orbit
      for (const id in skillNodes) {
        const sData = skillNodes[id];
        sData.angle += sData.speed;
        const sPush = pulsePush(sData.radius);
        sData.node.position.x = Math.cos(sData.angle) * (sData.radius + sPush);
        sData.node.position.z = Math.sin(sData.angle) * (sData.radius + sPush);
        sData.node.position.y = Math.sin(sData.angle * sData.yFreq) * sData.yAmp + sData.yOffset + sPush * 0.35;

        // Chain reaction: the wavefront detonates each skill planet as it rolls past
        if (pulseT >= 0 && pulseWaveR >= sData.radius && !stateRef.current.pulseDetonated[id]) {
          stateRef.current.pulseDetonated[id] = true;
          window.dispatchEvent(new CustomEvent('skillStarImpact', { detail: { id } }));
        }

        // Geometry is already built at the star's scale, so the node only carries the pop/respawn multiplier
        const baseScale = 1.0;
        if (sData.isExploding) {
          sData.currentScale = (sData.currentScale ?? baseScale) * 0.72;
          if (sData.currentScale < 0.05) sData.currentScale = 0.0001;
        } else if (sData.isRespawning) {
          sData.currentScale = (sData.currentScale ?? 0.0001) + (baseScale - (sData.currentScale ?? 0.0001)) * 0.16;
          if (Math.abs(sData.currentScale - baseScale) < 0.03) {
            sData.currentScale = baseScale;
            sData.isRespawning = false;
          }
        } else {
          sData.currentScale = baseScale;
        }
        sData.node.scale.set(sData.currentScale, sData.currentScale, sData.currentScale);

        if (sData.wireMesh) sData.wireMesh.rotation.y += 0.015;
        if (sData.moonGroup) {
          sData.moonAngle += 0.045;
          sData.moonGroup.rotation.y = sData.moonAngle;
        }
      }

      // Advance Fleet Dogfight Simulation Times
      fleetSim.pair1.t += fleetSim.pair1.speed;
      fleetSim.pair2.t += fleetSim.pair2.speed;
      fleetSim.pair3.t += fleetSim.pair3.speed;
      extraUfos.forEach((u) => {
        u.sim.t += u.sim.speed;
      });

      // Physics momentum damping
      const s = stateRef.current;
      if (Math.abs(s.orbitalVelocityX) > 0.00004) {
        s.targetOrbitalAngle += s.orbitalVelocityX;
        s.orbitalVelocityX *= 0.88;
      } else {
        s.orbitalVelocityX = 0;
      }

      if (Math.abs(s.orbitalVelocityY) > 0.00004) {
        s.targetElevation = Math.max(-1.35, Math.min(1.35, s.targetElevation + s.orbitalVelocityY));
        s.orbitalVelocityY *= 0.88;
      } else {
        s.orbitalVelocityY = 0;
      }

      if (s.autoOrbit) {
        s.targetOrbitalAngle += 0.0032;
      }

      // Smooth interpolation
      s.orbitalAngle += (s.targetOrbitalAngle - s.orbitalAngle) * 0.10;
      s.elevation += (s.targetElevation - s.elevation) * 0.10;
      s.radius += (s.targetRadius - s.radius) * 0.12;

      // Camera Coordinates & 60:40 Viewport Framing
      const mob = window.innerWidth < 768;

      if (s.currentCamTarget === 'overview') {
        const theta = s.orbitalAngle;
        const phi = s.elevation;
        const R = s.radius;
        const H = R * Math.cos(phi);

        const camTargetX = Math.sin(theta) * H + s.mouseX * (mob ? 0.5 : 1.0);
        const camTargetZ = Math.cos(theta) * H;
        const camTargetY = R * Math.sin(phi) - s.mouseY * (mob ? 0.4 : 0.8);

        const lerpSpeed = 0.055;
        s.camLerp.x += (camTargetX - s.camLerp.x) * lerpSpeed;
        s.camLerp.y += (camTargetY - s.camLerp.y) * lerpSpeed;
        s.camLerp.z += (camTargetZ - s.camLerp.z) * lerpSpeed;

        const lookTargetX = s.mouseX * 0.5;
        const lookTargetY = -s.mouseY * 0.4;
        const lookTargetZ = 0;

        s.camLerp.tx += (lookTargetX - s.camLerp.tx) * lerpSpeed;
        s.camLerp.ty += (lookTargetY - s.camLerp.ty) * lerpSpeed;
        s.camLerp.tz += (lookTargetZ - s.camLerp.tz) * lerpSpeed;
      } else if (planetsData[s.currentCamTarget]) {
        // Real-time dynamic follow camera framed in the left 60% viewport
        const targetPlanet = planetsData[s.currentCamTarget];
        const px = targetPlanet.group.position.x;
        const py = targetPlanet.group.position.y;
        const pz = targetPlanet.group.position.z;

        // Radial and tangential unit vectors in the orbital plane
        const pLen = Math.hypot(px, pz) || 1;
        const rx = px / pLen;
        const rz = pz / pLen;
        const tx = -rz;
        const tz = rx;

        // Tailored close-up inspection distance per planet
        const distMap = { missions: 5.4, experience: 6.0, systems: 8.4, contact: 6.2 };
        const camDist = (distMap[s.currentCamTarget] || 6.2) * (mob ? 1.25 : 1.0);
        const camHeight = mob ? 2.2 : 1.65;

        // Base camera position outside and slightly ahead so Gargantua shines in background
        const baseCamX = px + rx * (camDist * 0.84) + tx * (camDist * 0.46) + s.mouseX * 0.65;
        const baseCamY = py + camHeight - s.mouseY * 0.55;
        const baseCamZ = pz + rz * (camDist * 0.84) + tz * (camDist * 0.46);

        // Compute camera right vector perpendicular to view ray
        const vx = px - baseCamX;
        const vz = pz - baseCamZ;
        const vHoriz = Math.hypot(vx, vz) || 1;
        const fx = vx / vHoriz;
        const fz = vz / vHoriz;
        const rightX = -fz;
        const rightZ = fx;

        // Shift camera & lookAt rightward so planet is pinned in the left 60% viewport beside docked modal
        const fovRad = (camera.fov * Math.PI) / 180;
        const halfHeight = camDist * Math.tan(fovRad * 0.5);
        const halfWidth = halfHeight * camera.aspect;
        const leftFrameShift = mob ? 0 : halfWidth * 0.36;

        const desiredCamX = baseCamX + rightX * leftFrameShift;
        const desiredCamY = baseCamY;
        const desiredCamZ = baseCamZ + rightZ * leftFrameShift;

        const desiredLookX = px + rightX * leftFrameShift;
        const desiredLookY = py - (mob ? 0.4 : 0.1);
        const desiredLookZ = pz + rightZ * leftFrameShift;

        const followLerp = 0.075;
        s.camLerp.x += (desiredCamX - s.camLerp.x) * followLerp;
        s.camLerp.y += (desiredCamY - s.camLerp.y) * followLerp;
        s.camLerp.z += (desiredCamZ - s.camLerp.z) * followLerp;

        s.camLerp.tx += (desiredLookX - s.camLerp.tx) * followLerp;
        s.camLerp.ty += (desiredLookY - s.camLerp.ty) * followLerp;
        s.camLerp.tz += (desiredLookZ - s.camLerp.tz) * followLerp;
      }

      camera.up.set(0, 1, 0);
      const shake = pulseT >= 0 && !reducedMotion ? 0.35 * pulseFlash + 0.08 * pulseBoost : 0;
      camera.position.set(
        s.camLerp.x + (Math.random() - 0.5) * shake,
        s.camLerp.y + (Math.random() - 0.5) * shake,
        s.camLerp.z + (Math.random() - 0.5) * shake
      );
      camera.lookAt(s.camLerp.tx, s.camLerp.ty, s.camLerp.tz);

      renderer.render(scene, camera);

      // Project Planet Floating HUD Markers directly to DOM Elements
      const camDir = camera.getWorldDirection(new THREE.Vector3());
      for (const key in planetsData) {
        if (!domPlanetCache[key]) {
          domPlanetCache[key] = document.getElementById(`planet-hud-${key}`);
        }
        const pEl = domPlanetCache[key];
        if (!pEl) continue;

        const wp = new THREE.Vector3();
        planetsData[key].group.getWorldPosition(wp);

        const toPlanet = wp.clone().sub(camera.position).normalize();
        const isInFront = camDir.dot(toPlanet) > 0.2;

        projectVector.copy(wp).project(camera);

        const x = (projectVector.x * 0.5 + 0.5) * window.innerWidth;
        const y = (-(projectVector.y * 0.5) + 0.5) * window.innerHeight;

        if (!isInFront || projectVector.z >= 1.0) {
          pEl.style.opacity = '0';
          pEl.style.pointerEvents = 'none';
        } else {
          // Labels live inside .spatial-viewport (below the header), so convert window coords to its box
          if (!hudOrigin) {
            const box = (pEl.offsetParent || document.body).getBoundingClientRect();
            hudOrigin = { x: box.left, y: box.top };
          }
          const rimPx = projectRadiusPx(wp, planetsData[key].bodyRadius * planetsData[key].group.scale.x);
          pEl.style.left = `${(x - hudOrigin.x).toFixed(1)}px`;
          pEl.style.top = `${(y - hudOrigin.y + rimPx + 18).toFixed(1)}px`;
          pEl.style.transform = 'translate(-50%, -50%)';
          pEl.style.opacity = '1';
          pEl.style.pointerEvents = 'auto';
        }
      }

      // Project Skill Stars in 3D Orbit directly to DOM Elements
      const camPos = camera.position;
      for (const id in skillNodes) {
        if (!domStarCache[id]) {
          domStarCache[id] = document.getElementById(`star-${id}`);
        }
        const el = domStarCache[id];
        if (!el) continue;

        const sData = skillNodes[id];
        sData.node.getWorldPosition(tempWorldPos);
        const dist = tempWorldPos.distanceTo(camPos);
        projectVector.copy(tempWorldPos).project(camera);

        const isBehindLens = projectVector.z > 1.0;
        const sx = (projectVector.x * 0.5 + 0.5) * window.innerWidth;
        const sy = (-(projectVector.y * 0.5) + 0.5) * window.innerHeight;

        if (isBehindLens) {
          el.style.opacity = '0';
          el.style.pointerEvents = 'none';
        } else {
          // Orb sits just inside the 3D wireframe; the label pill hangs below without being scaled
          const orbDiameter = Math.max(14, Math.min(240, projectRadiusPx(tempWorldPos, sData.bodyRadius) * 2 * 0.92));
          if (Math.abs(orbDiameter - sData.orbDiameter) > 0.3) {
            sData.orbDiameter = orbDiameter;
            el.style.setProperty('--orb-scale', (orbDiameter / ORB_BASE_PX).toFixed(4));
          }
          el.style.transform = `translate3d(${sx.toFixed(1)}px, ${sy.toFixed(1)}px, 0) translate(-50%, ${(-sData.orbDiameter / 2).toFixed(1)}px)`;

          const depthFade = Math.max(0.60, Math.min(1.0, 1.4 - dist / 55));
          el.style.opacity = depthFade.toFixed(2);
          el.style.pointerEvents = 'auto';
        }
      }

      // Project Fleet Entities (Rockets & Aliens) with Smooth Projected 3D Headings
      const fleetEntitiesList = [
        { id: 'alien-1', sim: fleetSim.pair1, isRocket: false },
        { id: 'rocket-1', sim: fleetSim.pair1, isRocket: true },
        { id: 'alien-2', sim: fleetSim.pair2, isRocket: false },
        { id: 'rocket-2', sim: fleetSim.pair2, isRocket: true },
        { id: 'alien-3', sim: fleetSim.pair3, isRocket: false },
        { id: 'rocket-3', sim: fleetSim.pair3, isRocket: true },
        ...extraUfos.map((u) => ({ id: u.id, sim: u.sim, isRocket: false })),
      ];

      fleetEntitiesList.forEach(({ id, sim, isRocket }) => {
        if (!domFleetCache[id]) {
          domFleetCache[id] = document.getElementById(id);
        }
        const fEl = domFleetCache[id];
        if (!fEl) return;

        if (fEl.classList.contains('is-dragged')) return;

        const posLocal = getEntityPosition(id, sim.t);
        tempWorldPos.set(posLocal.x, posLocal.y, posLocal.z);
        solarPlane.localToWorld(tempWorldPos);

        const dist = tempWorldPos.distanceTo(camPos);
        projectVector.copy(tempWorldPos).project(camera);

        const isBehindLens = projectVector.z > 1.0;
        const fx = (projectVector.x * 0.5 + 0.5) * window.innerWidth;
        const fy = (-(projectVector.y * 0.5) + 0.5) * window.innerHeight;

        if (isBehindLens) {
          fEl.style.opacity = '0';
          fEl.style.pointerEvents = 'none';
        } else {
          const posAhead = getEntityPosition(id, sim.t + 0.06);
          tempAheadPos.set(posAhead.x, posAhead.y, posAhead.z);
          solarPlane.localToWorld(tempAheadPos);
          pAheadProj.copy(tempAheadPos).project(camera);

          const fxAhead = (pAheadProj.x * 0.5 + 0.5) * window.innerWidth;
          const fyAhead = (-(pAheadProj.y * 0.5) + 0.5) * window.innerHeight;

          const dx = fxAhead - fx;
          const dy = fyAhead - fy;
          const baseAngle = Math.atan2(dy, dx) * (180 / Math.PI);
          // Rockets point along their path; flying saucers stay level and only bank into horizontal motion
          const bankDeg = Math.max(-16, Math.min(16, (dx / (Math.abs(dx) + Math.abs(dy) + 1)) * 16));
          const headingDeg = isRocket ? baseAngle + 90 : bankDeg;

          const depthFactor = Math.max(0.70, Math.min(1.25, 28 / dist));
          const mobFactor = mob ? 0.65 : 1.05;
          const finalScale = depthFactor * mobFactor;

          fEl.style.transform = `translate3d(${fx.toFixed(1)}px, ${fy.toFixed(1)}px, 0) translate(-50%, -50%) rotate(${headingDeg.toFixed(1)}deg) scale(${finalScale.toFixed(3)})`;
          fEl.style.opacity = '1';
          fEl.style.pointerEvents = 'auto';
        }
      });

      // Update Telemetry Callbacks
      if (onUpdateTelemetry) {
        const twoPi = Math.PI * 2;
        let normAzimuth = s.orbitalAngle % twoPi;
        if (normAzimuth < 0) normAzimuth += twoPi;
        const azimuthDeg = Math.round((normAzimuth / twoPi) * 360) % 360;

        let normElevation = s.elevation % twoPi;
        if (normElevation < 0) normElevation += twoPi;
        const elevationDeg = Math.round((normElevation / twoPi) * 360) % 360;

        let sectorName = 'FRONT OBLIQUE';
        if (azimuthDeg >= 45 && azimuthDeg < 135) sectorName = 'EAST PROFILE';
        else if (azimuthDeg >= 135 && azimuthDeg < 225) sectorName = 'DEEP HORIZON';
        else if (azimuthDeg >= 225 && azimuthDeg < 315) sectorName = 'WEST PROFILE';

        onUpdateTelemetry({
          angle: azimuthDeg,
          sector: sectorName,
          elevationDeg,
          autoOrbit: s.autoOrbit,
        });
      }
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
      canvas.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('click', handleCanvasClick);
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('planetHoverChange', handlePlanetHoverEvent);
      window.removeEventListener('skillStarExplode', handleSkillExplode);
      window.removeEventListener('skillStarRespawn', handleSkillRespawn);
      window.removeEventListener('resize', handleResize);
      document.body.style.cursor = '';
      renderer.dispose();
    };
  }, []);

  return <canvas ref={canvasRef} id="cosmic-canvas" aria-hidden="true" />;
}
