import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { audioEngine } from '../utils/audio';
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
    camLerp: { x: 2.65, y: 13.16, z: 25.14, tx: 0, ty: 0, tz: 0 },
    mouseX: 0,
    mouseY: 0,
    currentCamTarget: 'overview',
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
      stateRef.current.targetRadius = Math.max(16.0, stateRef.current.targetRadius - 4.5);
    } else if (zoomAction === 'out') {
      stateRef.current.targetRadius = Math.min(46.0, stateRef.current.targetRadius + 4.5);
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
      isMobile ? 58 : 45,
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

    // 3. Central Sun Core
    const sunGroup = new THREE.Group();
    scene.add(sunGroup);

    const sunGeo = new THREE.IcosahedronGeometry(3.2, 3);
    const sunMat = new THREE.MeshBasicMaterial({
      color: 0xd4a373,
      wireframe: true,
      transparent: true,
      opacity: 0.45,
    });
    const sunMesh = new THREE.Mesh(sunGeo, sunMat);
    sunGroup.add(sunMesh);

    const sunCore = new THREE.Mesh(
      new THREE.SphereGeometry(1.6, 24, 24),
      new THREE.MeshBasicMaterial({ color: 0xd4a373, transparent: true, opacity: 0.3 })
    );
    sunGroup.add(sunCore);

    // 4. Solar System Plane (Level Reference Plane whose normal aligns with central Y axis)
    const solarPlane = new THREE.Group();
    scene.add(solarPlane);

    // Helper: Orbit Ring
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

    // Orbit Rings
    createRing(6.2, 0xd4a373, 0.28);
    createRing(10.4, 0x5aafa9, 0.26);
    createRing(17.5, 0xc06c54, 0.24);
    createRing(23.0, 0xc8bfaf, 0.22);

    // Planet Hit Targets for Raycaster Clicks
    const interactiveHitObjects = [];

    // Planet 01: Missions
    const p1Group = new THREE.Group();
    solarPlane.add(p1Group);
    const p1Core = new THREE.Mesh(
      new THREE.SphereGeometry(0.95, 20, 20),
      new THREE.MeshBasicMaterial({ color: 0xd4a373 })
    );
    p1Core.userData = { sectorKey: 'missions' };
    p1Group.add(p1Core);
    const p1Wire = new THREE.Mesh(
      new THREE.SphereGeometry(1.2, 16, 16),
      new THREE.MeshBasicMaterial({ color: 0xf5f2eb, wireframe: true, transparent: true, opacity: 0.35 })
    );
    p1Wire.userData = { sectorKey: 'missions' };
    p1Group.add(p1Wire);
    const p1Ring1 = new THREE.Mesh(
      new THREE.RingGeometry(1.42, 1.48, 48),
      new THREE.MeshBasicMaterial({ color: 0xd4a373, side: THREE.DoubleSide, transparent: true, opacity: 0.45 })
    );
    p1Ring1.rotation.x = Math.PI / 2.6;
    p1Group.add(p1Ring1);

    const p1Ring2 = new THREE.Mesh(
      new THREE.RingGeometry(1.58, 1.64, 48),
      new THREE.MeshBasicMaterial({ color: 0xc8bfaf, side: THREE.DoubleSide, transparent: true, opacity: 0.35 })
    );
    p1Ring2.rotation.y = Math.PI / 2.2;
    p1Group.add(p1Ring2);

    // Orbiting Satellite Probe (Revolves around P-01)
    const p1ProbeGroup = new THREE.Group();
    p1Group.add(p1ProbeGroup);
    const p1Probe = new THREE.Mesh(
      new THREE.SphereGeometry(0.24, 12, 12),
      new THREE.MeshBasicMaterial({ color: 0xffffff })
    );
    p1Probe.position.set(1.95, 0, 0);
    p1ProbeGroup.add(p1Probe);

    const hit1 = new THREE.Mesh(new THREE.SphereGeometry(2.8, 12, 12), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.0 }));
    hit1.userData = { sectorKey: 'missions' };
    p1Group.add(hit1);
    interactiveHitObjects.push(p1Core, p1Wire, hit1);

    // Planet 02: Experience / Flight Log
    const p2Group = new THREE.Group();
    solarPlane.add(p2Group);
    const p2Core = new THREE.Mesh(
      new THREE.SphereGeometry(1.25, 24, 24),
      new THREE.MeshBasicMaterial({ color: 0x5aafa9 })
    );
    p2Core.userData = { sectorKey: 'experience' };
    p2Group.add(p2Core);
    const p2Atmo = new THREE.Mesh(
      new THREE.SphereGeometry(1.36, 20, 20),
      new THREE.MeshBasicMaterial({ color: 0x89cff0, wireframe: true, transparent: true, opacity: 0.3 })
    );
    p2Atmo.userData = { sectorKey: 'experience' };
    p2Group.add(p2Atmo);

    // Orbiting Moon System (Primary Moon + Sensor Satellite)
    const p2MoonGroup = new THREE.Group();
    p2Group.add(p2MoonGroup);
    const p2Moon = new THREE.Mesh(
      new THREE.SphereGeometry(0.36, 12, 12),
      new THREE.MeshBasicMaterial({ color: 0xc8bfaf })
    );
    p2Moon.position.set(2.2, 0, 0);
    p2MoonGroup.add(p2Moon);

    const p2Probe = new THREE.Mesh(
      new THREE.SphereGeometry(0.16, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0x89cff0 })
    );
    p2Probe.position.set(-1.75, 0.35, 0);
    p2MoonGroup.add(p2Probe);

    const hit2 = new THREE.Mesh(new THREE.SphereGeometry(3.0, 12, 12), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.0 }));
    hit2.userData = { sectorKey: 'experience' };
    p2Group.add(hit2);
    interactiveHitObjects.push(p2Core, p2Atmo, hit2);

    // Planet 03: Systems
    const p3Group = new THREE.Group();
    solarPlane.add(p3Group);
    const p3Core = new THREE.Mesh(
      new THREE.SphereGeometry(1.85, 28, 28),
      new THREE.MeshBasicMaterial({ color: 0xc06c54 })
    );
    p3Core.userData = { sectorKey: 'systems' };
    p3Group.add(p3Core);
    const p3RingGroup = new THREE.Group();
    p3RingGroup.rotation.x = Math.PI * 0.42;
    p3RingGroup.rotation.y = 0.18;
    p3Group.add(p3RingGroup);
    const p3InnerRing = new THREE.Mesh(
      new THREE.RingGeometry(2.4, 3.2, 64),
      new THREE.MeshBasicMaterial({ color: 0xd4a373, side: THREE.DoubleSide, transparent: true, opacity: 0.48 })
    );
    p3RingGroup.add(p3InnerRing);
    const p3OuterRing = new THREE.Mesh(
      new THREE.RingGeometry(3.45, 4.8, 64),
      new THREE.MeshBasicMaterial({ color: 0xc8bfaf, side: THREE.DoubleSide, transparent: true, opacity: 0.32 })
    );
    p3RingGroup.add(p3OuterRing);

    // Orbiting Shepherd Moons revolving around ring system
    const p3MoonGroup = new THREE.Group();
    p3Group.add(p3MoonGroup);
    const p3Shepherd1 = new THREE.Mesh(
      new THREE.SphereGeometry(0.32, 10, 10),
      new THREE.MeshBasicMaterial({ color: 0xffffff })
    );
    p3Shepherd1.position.set(5.1, 0, 0);
    p3MoonGroup.add(p3Shepherd1);
    const p3Shepherd2 = new THREE.Mesh(
      new THREE.SphereGeometry(0.22, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0xd4a373 })
    );
    p3Shepherd2.position.set(-3.3, 0.25, 0);
    p3MoonGroup.add(p3Shepherd2);

    const hit3 = new THREE.Mesh(new THREE.SphereGeometry(4.2, 12, 12), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.0 }));
    hit3.userData = { sectorKey: 'systems' };
    p3Group.add(hit3);
    interactiveHitObjects.push(p3Core, hit3);

    // Planet 04: Relay
    const p4Group = new THREE.Group();
    solarPlane.add(p4Group);
    const p4Core = new THREE.Mesh(
      new THREE.SphereGeometry(1.05, 14, 14),
      new THREE.MeshBasicMaterial({ color: 0xf5f2eb })
    );
    p4Core.userData = { sectorKey: 'contact' };
    p4Group.add(p4Core);
    const p4Halo = new THREE.Mesh(
      new THREE.SphereGeometry(1.22, 10, 10),
      new THREE.MeshBasicMaterial({ color: 0x89cff0, wireframe: true, transparent: true, opacity: 0.45 })
    );
    p4Halo.userData = { sectorKey: 'contact' };
    p4Group.add(p4Halo);

    const p4PolarDish = new THREE.Mesh(
      new THREE.RingGeometry(1.4, 1.48, 32),
      new THREE.MeshBasicMaterial({ color: 0xf5f2eb, side: THREE.DoubleSide, transparent: true, opacity: 0.45 })
    );
    p4PolarDish.rotation.x = Math.PI / 2;
    p4Group.add(p4PolarDish);

    // Orbiting Relay Sensor Probe
    const p4ProbeGroup = new THREE.Group();
    p4Group.add(p4ProbeGroup);
    const p4Probe = new THREE.Mesh(
      new THREE.BoxGeometry(0.28, 0.28, 0.28),
      new THREE.MeshBasicMaterial({ color: 0x89cff0 })
    );
    p4Probe.position.set(2.1, 0, 0);
    p4ProbeGroup.add(p4Probe);

    const hit4 = new THREE.Mesh(new THREE.SphereGeometry(2.8, 12, 12), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.0 }));
    hit4.userData = { sectorKey: 'contact' };
    p4Group.add(hit4);
    interactiveHitObjects.push(p4Core, p4Halo, hit4);

    const planetsData = {
      missions: {
        key: 'missions',
        group: p1Group,
        coreMesh: p1Core,
        wireMesh: p1Wire,
        ring1: p1Ring1,
        ring2: p1Ring2,
        probeGroup: p1ProbeGroup,
        probeAngle: 0,
        radius: 6.2,
        speed: 0.012,
        angle: 1.1,
        targetScale: 1.0,
      },
      experience: {
        key: 'experience',
        group: p2Group,
        coreMesh: p2Core,
        atmoMesh: p2Atmo,
        moonGroup: p2MoonGroup,
        moonAngle: 0,
        radius: 10.4,
        speed: 0.0085,
        angle: 3.5,
        targetScale: 1.0,
      },
      systems: {
        key: 'systems',
        group: p3Group,
        coreMesh: p3Core,
        ringGroup: p3RingGroup,
        moonGroup: p3MoonGroup,
        moonAngle: 0,
        radius: 17.5,
        speed: 0.0055,
        angle: 5.2,
        targetScale: 1.0,
      },
      contact: {
        key: 'contact',
        group: p4Group,
        coreMesh: p4Core,
        haloMesh: p4Halo,
        probeGroup: p4ProbeGroup,
        probeAngle: 0,
        radius: 23.0,
        speed: 0.0038,
        angle: 2.1,
        targetScale: 1.0,
      },
    };

    // 5. 3D Orbital Anchors for 9 Differentiated Skill Stars
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

      // Unique 3D Geometries tailored to each skill archetype
      if (star.id === 'docker') {
        // Container Cube Wireframe Shell + Equatorial Band
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
        // Icosahedron Geodesic Wireframe + Dual Hyper-Speed Gyro Rings + Dual Probes
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
        // Hexagonal Ring System (Node.js logo hexagon shape) + Dual Emerald Moons
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
        // Concentric Dual Relational Ring Bands (representing database tables)
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
        // Blazing Heat Corona + Dual Rapid Micro-Probes
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
        // Saturnian Wide Flat Ring Disk with Cassini Gap
        wireMesh = new THREE.Mesh(
          new THREE.SphereGeometry(sScale * 0.95, 12, 12),
          new THREE.MeshBasicMaterial({ color: 0x777bb4, wireframe: true, transparent: true, opacity: 0.28 })
        );
        ring1 = new THREE.Mesh(
          new THREE.RingGeometry(sScale * 1.32, sScale * 2.05, 48),
          new THREE.MeshBasicMaterial({ color: 0x777bb4, side: THREE.DoubleSide, transparent: true, opacity: 0.42 })
        );
        ring1.rotation.x = Math.PI / 2.7;
        ring1.rotation.y = 0.15;
        const moon1 = new THREE.Mesh(
          new THREE.SphereGeometry(sScale * 0.18, 8, 8),
          new THREE.MeshBasicMaterial({ color: 0xc8bfaf })
        );
        moon1.position.set(sScale * 2.2, 0, 0);
        moonGroup.add(moon1);
      } else if (star.id === 'laravel') {
        // Triple Orthogonal Intersecting Atomic Gyro Rings
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
        // Polar Vertical Ring Disk (passing north & south poles)
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
        // Radar Sweep Reticle with Crosshairs
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
      };
    });

    // 6. 3D Flight Simulation for Fleet Dogfight (3 Rockets pursuing 3 Aliens)
    const fleetSim = {
      pair1: { t: 0.0, speed: 0.0075 },
      pair2: { t: 2.1, speed: 0.0058 },
      pair3: { t: 4.3, speed: 0.0068 },
    };

    const getEntityPosition = (id, time) => {
      let x = 0, y = 0, z = 0;
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

    // 7. Raycaster & Input Listeners (3D Interactive Planets + 360° Sumbu X & Y)
    const raycaster = new THREE.Raycaster();
    const mouseVector = new THREE.Vector2();

    const handleCanvasClick = (e) => {
      // Don't intercept if clicked inside dialog or button
      if (e.target && typeof e.target.closest === 'function') {
        if (
          e.target.closest('dialog') ||
          e.target.closest('button') ||
          e.target.closest('a') ||
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

      // Trackpad pinch zoom
      if (e.ctrlKey || e.metaKey || e.altKey) {
        const zoomDelta = e.deltaY * 0.045;
        stateRef.current.targetRadius = Math.max(16.0, Math.min(46.0, stateRef.current.targetRadius + zoomDelta));
        return;
      }

      const dx = e.deltaX || 0;
      const dy = e.deltaY || 0;

      // Sumbu X: Unbounded Continuous Turntable Orbit (Rotates around central vertical axis)
      if (Math.abs(dx) > 0) {
        const azimuthDelta = dx * 0.0035;
        stateRef.current.orbitalVelocityX += azimuthDelta * 0.12;
        stateRef.current.targetOrbitalAngle += azimuthDelta;
      }

      // Sumbu Y: Elevation tilt around central pivot
      if (Math.abs(dy) > 0) {
        const elevationDelta = -dy * 0.0022;
        stateRef.current.orbitalVelocityY += elevationDelta * 0.12;
        stateRef.current.targetElevation = Math.max(
          -1.48,
          Math.min(1.48, stateRef.current.targetElevation + elevationDelta)
        );
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
        stateRef.current.targetElevation = Math.max(
          -1.48,
          Math.min(1.48, stateRef.current.targetElevation + elevationDelta)
        );
      } else if (e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const currentDist = Math.sqrt(dx * dx + dy * dy);
        if (initialPinchDist > 10) {
          const ratio = initialPinchDist / currentDist;
          stateRef.current.targetRadius = Math.max(16.0, Math.min(48.0, initialPinchRadius * ratio));
        }
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight') stateRef.current.targetOrbitalAngle += 0.2;
      else if (e.key === 'ArrowLeft') stateRef.current.targetOrbitalAngle -= 0.2;
      else if (e.key === 'ArrowUp') stateRef.current.targetElevation = Math.min(1.48, stateRef.current.targetElevation + 0.15);
      else if (e.key === 'ArrowDown') stateRef.current.targetElevation = Math.max(-1.48, stateRef.current.targetElevation - 0.15);
      else if (e.key === '+' || e.key === '=') stateRef.current.targetRadius = Math.max(16.0, stateRef.current.targetRadius - 3.5);
      else if (e.key === '-' || e.key === '_') stateRef.current.targetRadius = Math.min(46.0, stateRef.current.targetRadius + 3.5);
    };

    const handleMouseMove = (e) => {
      stateRef.current.mouseX = (e.clientX / window.innerWidth) * 2 - 1;
      stateRef.current.mouseY = (e.clientY / window.innerHeight) * 2 - 1;

      mouseVector.x = stateRef.current.mouseX;
      mouseVector.y = -stateRef.current.mouseY;
      raycaster.setFromCamera(mouseVector, camera);
      const intersects = raycaster.intersectObjects(interactiveHitObjects);

      let detectedSector = null;
      if (intersects.length > 0) {
        detectedSector = intersects[0].object.userData.sectorKey;
      }

      if (detectedSector) {
        if (stateRef.current.hoveredPlanet !== detectedSector) {
          stateRef.current.hoveredPlanet = detectedSector;
          audioEngine.playUiClick(640, 'sine', 0.02);
          document.body.style.cursor = 'pointer';

          // Toggle is-hovered class on DOM HUD buttons
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

    const handleResize = () => {
      const mob = window.innerWidth < 768;
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.fov = mob ? 58 : 45;
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

    // 8. Animation Loop
    const projectVector = new THREE.Vector3();
    const tempWorldPos = new THREE.Vector3();
    const tempAheadPos = new THREE.Vector3();
    const pAheadProj = new THREE.Vector3();

    const animate = () => {
      animId = requestAnimationFrame(animate);

      // Rotate Sun Core
      sunMesh.rotation.y += 0.003;
      sunMesh.rotation.x += 0.0015;

      // Update Planet Positions with Dynamic Hover Slowdown, Scale Lerp & Satellite Revolutions
      for (const key in planetsData) {
        const p = planetsData[key];
        const isHovered = (stateRef.current.hoveredPlanet === key);

        // Hover slows down revolution to 0.2x speed!
        p.angle += p.speed * (isHovered ? 0.2 : 1.0);
        p.group.position.x = Math.cos(p.angle) * p.radius;
        p.group.position.z = Math.sin(p.angle) * p.radius;
        p.group.position.y = 0;

        // Smooth scale lerp (enlarge when hovered!)
        p.targetScale = isHovered ? 1.40 : 1.0;
        const curScale = p.group.scale.x;
        const nextScale = curScale + (p.targetScale - curScale) * 0.12;
        p.group.scale.set(nextScale, nextScale, nextScale);

        // Dynamic axial rotation (spinning planet cores & rings)
        if (p.coreMesh) p.coreMesh.rotation.y += 0.012;
        if (p.wireMesh) p.wireMesh.rotation.y -= 0.008;
        if (p.atmoMesh) p.atmoMesh.rotation.y += 0.010;
        if (p.ring1) p.ring1.rotation.z += 0.018;
        if (p.ring2) p.ring2.rotation.x += 0.012;
        if (p.ringGroup) p.ringGroup.rotation.z += 0.005;

        // Dynamic revolving satellites for all 4 main planets!
        if (p.probeGroup) {
          p.probeAngle = (p.probeAngle || 0) + 0.045;
          p.probeGroup.rotation.y = p.probeAngle;
        }
        if (p.moonGroup) {
          p.moonAngle = (p.moonAngle || 0) + 0.038;
          p.moonGroup.rotation.y = p.moonAngle;
        }
      }

      // Update Skills 3D Positions in Orbit
      for (const id in skillNodes) {
        const sData = skillNodes[id];
        sData.angle += sData.speed;
        sData.node.position.x = Math.cos(sData.angle) * sData.radius;
        sData.node.position.z = Math.sin(sData.angle) * sData.radius;
        sData.node.position.y = Math.sin(sData.angle * sData.yFreq) * sData.yAmp + sData.yOffset;

        // Animate 3D wireframe spin, rings, and satellites
        if (sData.wireMesh) sData.wireMesh.rotation.y += 0.015;
        if (sData.ring1) sData.ring1.rotation.z += 0.012;
        if (sData.ring2) sData.ring2.rotation.y += 0.010;
        if (sData.moonGroup) {
          sData.moonAngle += 0.045;
          sData.moonGroup.rotation.y = sData.moonAngle;
        }
      }

      // Advance Fleet Dogfight Simulation Times
      fleetSim.pair1.t += fleetSim.pair1.speed;
      fleetSim.pair2.t += fleetSim.pair2.speed;
      fleetSim.pair3.t += fleetSim.pair3.speed;

      // Physics momentum damping
      const s = stateRef.current;
      if (Math.abs(s.orbitalVelocityX) > 0.00004) {
        s.targetOrbitalAngle += s.orbitalVelocityX;
        s.orbitalVelocityX *= 0.88;
      } else {
        s.orbitalVelocityX = 0;
      }

      if (Math.abs(s.orbitalVelocityY) > 0.00004) {
        s.targetElevation = Math.max(-1.48, Math.min(1.48, s.targetElevation + s.orbitalVelocityY));
        s.orbitalVelocityY *= 0.88;
      } else {
        s.orbitalVelocityY = 0;
      }

      if (s.autoOrbit) {
        s.targetOrbitalAngle += 0.0028;
      }

      // Smooth interpolation
      s.orbitalAngle += (s.targetOrbitalAngle - s.orbitalAngle) * 0.10;
      s.elevation += (s.targetElevation - s.elevation) * 0.10;
      s.radius += (s.targetRadius - s.radius) * 0.12;

      // Spherical Camera Coordinates centered on Sun Pivot (360° X Turntable & Y Tilt)
      const mob = window.innerWidth < 768;
      const theta = s.orbitalAngle;
      const phi = s.elevation;
      const R = s.radius;

      let camTargetX = 0, camTargetY = 0, camTargetZ = 0;
      let lookTargetX = 0, lookTargetY = 0, lookTargetZ = 0;
      let upX = 0, upY = 1, upZ = 0;

      if (s.currentCamTarget === 'overview') {
        const cosPhi = Math.cos(phi);
        const sinPhi = Math.sin(phi);
        const sinTheta = Math.sin(theta);
        const cosTheta = Math.cos(theta);

        // Spherical position vector around central pivot (0, 0, 0)
        camTargetX = R * cosPhi * sinTheta + s.mouseX * (mob ? 0.4 : 0.8);
        camTargetY = R * sinPhi - s.mouseY * (mob ? 0.3 : 0.6);
        camTargetZ = R * cosPhi * cosTheta;

        lookTargetX = s.mouseX * 0.4;
        lookTargetY = -s.mouseY * 0.3;
        lookTargetZ = 0;

        // Keep horizon level so Sumbu X revolves cleanly around the central vertical axis
        upX = 0;
        upY = 1;
        upZ = 0;
      } else if (planetsData[s.currentCamTarget]) {
        const targetPlanet = planetsData[s.currentCamTarget];
        const wp = new THREE.Vector3();
        targetPlanet.group.getWorldPosition(wp);
        // On desktop, offset camera slightly so the active planet is framed prominently on the left side (outside the side modal)
        const offsetX = mob ? 0 : 3.8;
        camTargetX = wp.x + (mob ? 3.0 : 4.5) + offsetX;
        camTargetY = wp.y + (mob ? 2.0 : 2.5);
        camTargetZ = wp.z + (mob ? 4.5 : 6.0);
        lookTargetX = wp.x + offsetX * 0.72;
        lookTargetY = wp.y - 0.2;
        lookTargetZ = wp.z;
        upX = 0;
        upY = 1;
        upZ = 0;
      }

      const lerpSpeed = 0.08;
      s.camLerp.x += (camTargetX - s.camLerp.x) * lerpSpeed;
      s.camLerp.y += (camTargetY - s.camLerp.y) * lerpSpeed;
      s.camLerp.z += (camTargetZ - s.camLerp.z) * lerpSpeed;
      s.camLerp.tx += (lookTargetX - s.camLerp.tx) * lerpSpeed;
      s.camLerp.ty += (lookTargetY - s.camLerp.ty) * lerpSpeed;
      s.camLerp.tz += (lookTargetZ - s.camLerp.tz) * lerpSpeed;

      // Always set pure unit length up vector directly to avoid zero-vector lerp singularities
      camera.up.set(upX, upY, upZ);
      camera.position.set(s.camLerp.x, s.camLerp.y, s.camLerp.z);
      camera.lookAt(s.camLerp.tx, s.camLerp.ty, s.camLerp.tz);

      renderer.render(scene, camera);

      // Project Planet Floating HUD Markers directly to DOM Elements (Zero React re-render lag)
      for (const key in planetsData) {
        if (!domPlanetCache[key]) {
          domPlanetCache[key] = document.getElementById(`planet-hud-${key}`);
        }
        const pEl = domPlanetCache[key];
        if (!pEl) continue;

        const wp = new THREE.Vector3();
        planetsData[key].group.getWorldPosition(wp);
        projectVector.copy(wp).project(camera);

        const isBehind = projectVector.z > 1.0;
        const x = (projectVector.x * 0.5 + 0.5) * window.innerWidth;
        const y = (-(projectVector.y * 0.5) + 0.5) * window.innerHeight;

        if (isBehind || x < -100 || x > window.innerWidth + 100 || y < -100 || y > window.innerHeight + 100) {
          pEl.style.opacity = '0';
          pEl.style.pointerEvents = 'none';
        } else {
          pEl.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) translate(-50%, -50%)`;
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
          // Perspective depth scaling (near = larger, far = smaller)
          const depthFactor = Math.max(0.72, Math.min(1.28, 28 / dist));
          const finalScale = (sData.scale || 1.0) * depthFactor * (mob ? 0.75 : 1.0);
          el.style.transform = `translate3d(${sx.toFixed(1)}px, ${sy.toFixed(1)}px, 0) translate(-50%, -50%) scale(${finalScale.toFixed(3)})`;
          
          // Foreground is 1.0, background stays nicely visible (0.60)
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
      ];

      fleetEntitiesList.forEach(({ id, sim, isRocket }) => {
        if (!domFleetCache[id]) {
          domFleetCache[id] = document.getElementById(id);
        }
        const fEl = domFleetCache[id];
        if (!fEl) return;

        // Skip positioning if currently being dragged
        if (fEl.classList.contains('is-dragged')) return;

        // Calculate 3D position in solarPlane
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
          // Analytical heading from projected future point along trajectory (Zero camera jitter!)
          const posAhead = getEntityPosition(id, sim.t + 0.06);
          tempAheadPos.set(posAhead.x, posAhead.y, posAhead.z);
          solarPlane.localToWorld(tempAheadPos);
          pAheadProj.copy(tempAheadPos).project(camera);

          const fxAhead = (pAheadProj.x * 0.5 + 0.5) * window.innerWidth;
          const fyAhead = (-(pAheadProj.y * 0.5) + 0.5) * window.innerHeight;

          const dx = fxAhead - fx;
          const dy = fyAhead - fy;
          const baseAngle = Math.atan2(dy, dx) * (180 / Math.PI);
          // Rockets point UP by default in CSS (+90deg offset), Aliens point forward
          const headingDeg = isRocket ? baseAngle + 90 : baseAngle;

          const depthFactor = Math.max(0.70, Math.min(1.25, 28 / dist));
          const mobFactor = mob ? 0.65 : 1.05;
          const finalScale = depthFactor * mobFactor;

          fEl.style.transform = `translate3d(${fx.toFixed(1)}px, ${fy.toFixed(1)}px, 0) translate(-50%, -50%) rotate(${headingDeg.toFixed(1)}deg) scale(${finalScale.toFixed(3)})`;
          fEl.style.opacity = '1';
          fEl.style.pointerEvents = 'auto';
        }
      });

      // Update Telemetry Callbacks (Full 360° Omnidirectional Readouts)
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
      window.removeEventListener('click', handleCanvasClick);
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('planetHoverChange', handlePlanetHoverEvent);
      window.removeEventListener('resize', handleResize);
      document.body.style.cursor = '';
      renderer.dispose();
    };
  }, []);

  return <canvas ref={canvasRef} id="cosmic-canvas" aria-hidden="true" />;
}
