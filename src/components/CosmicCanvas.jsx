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
    orbitalAngle: 0,
    orbitalVelocityX: 0,
    targetOrbitalAngle: 0,
    elevation: 0.28,
    orbitalVelocityY: 0,
    targetElevation: 0.28,
    radius: 28.5,
    targetRadius: 28.5,
    autoOrbit: true, // Default to true per user requirement
    camLerp: { x: 0, y: 7.5, z: 28.5, tx: 0, ty: 0, tz: 0 },
    upLerp: { x: 0, y: 1, z: 0 },
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
    const currentLoopsX = Math.round(stateRef.current.orbitalAngle / twoPi);
    const currentLoopsY = Math.round(stateRef.current.elevation / twoPi);
    stateRef.current.targetOrbitalAngle = currentLoopsX * twoPi;
    stateRef.current.targetElevation = currentLoopsY * twoPi + 0.28;
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
    camera.position.set(0, 7.5, stateRef.current.radius);

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

    // 4. Solar System Plane (Tilted towards viewer)
    const solarPlane = new THREE.Group();
    solarPlane.rotation.x = 0.48;
    solarPlane.rotation.z = -0.15;
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

    // Planet 01: Missions
    const p1Group = new THREE.Group();
    solarPlane.add(p1Group);
    const p1Core = new THREE.Mesh(
      new THREE.SphereGeometry(0.95, 20, 20),
      new THREE.MeshBasicMaterial({ color: 0xd4a373 })
    );
    p1Group.add(p1Core);
    const p1Wire = new THREE.Mesh(
      new THREE.SphereGeometry(1.2, 16, 16),
      new THREE.MeshBasicMaterial({ color: 0xf5f2eb, wireframe: true, transparent: true, opacity: 0.35 })
    );
    p1Group.add(p1Wire);
    const p1Ring1 = new THREE.Mesh(
      new THREE.RingGeometry(1.42, 1.48, 48),
      new THREE.MeshBasicMaterial({ color: 0xd4a373, side: THREE.DoubleSide, transparent: true, opacity: 0.45 })
    );
    p1Ring1.rotation.x = Math.PI / 2.6;
    p1Group.add(p1Ring1);

    // Planet 02: Experience / Flight Log
    const p2Group = new THREE.Group();
    solarPlane.add(p2Group);
    const p2Core = new THREE.Mesh(
      new THREE.SphereGeometry(1.25, 24, 24),
      new THREE.MeshBasicMaterial({ color: 0x5aafa9 })
    );
    p2Group.add(p2Core);
    const p2Atmo = new THREE.Mesh(
      new THREE.SphereGeometry(1.36, 20, 20),
      new THREE.MeshBasicMaterial({ color: 0x89cff0, wireframe: true, transparent: true, opacity: 0.3 })
    );
    p2Group.add(p2Atmo);
    const p2MoonGroup = new THREE.Group();
    p2Group.add(p2MoonGroup);
    const p2Moon = new THREE.Mesh(
      new THREE.SphereGeometry(0.36, 12, 12),
      new THREE.MeshBasicMaterial({ color: 0xc8bfaf })
    );
    p2Moon.position.set(2.2, 0, 0);
    p2MoonGroup.add(p2Moon);

    // Planet 03: Systems
    const p3Group = new THREE.Group();
    solarPlane.add(p3Group);
    const p3Core = new THREE.Mesh(
      new THREE.SphereGeometry(1.85, 28, 28),
      new THREE.MeshBasicMaterial({ color: 0xc06c54 })
    );
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

    // Planet 04: Relay
    const p4Group = new THREE.Group();
    solarPlane.add(p4Group);
    const p4Core = new THREE.Mesh(
      new THREE.SphereGeometry(1.05, 14, 14),
      new THREE.MeshBasicMaterial({ color: 0xf5f2eb })
    );
    p4Group.add(p4Core);
    const p4Halo = new THREE.Mesh(
      new THREE.SphereGeometry(1.22, 10, 10),
      new THREE.MeshBasicMaterial({ color: 0x89cff0, wireframe: true, transparent: true, opacity: 0.45 })
    );
    p4Group.add(p4Halo);

    const planetsData = {
      missions: { group: p1Group, radius: 6.2, speed: 0.012, angle: 1.1 },
      experience: { group: p2Group, radius: 10.4, speed: 0.0085, angle: 3.5, moonAngle: 0, moonGroup: p2MoonGroup },
      systems: { group: p3Group, radius: 17.5, speed: 0.0055, angle: 5.2 },
      contact: { group: p4Group, radius: 23.0, speed: 0.0038, angle: 2.1 },
    };

    // 5. Orbital Anchors for 9 Skill Stars
    const skillNodes = {};
    TECH_STARS.forEach((star) => {
      const node = new THREE.Object3D();
      solarPlane.add(node);
      skillNodes[star.id] = {
        node,
        radius: star.orbitRadius,
        speed: star.orbitSpeed,
        angle: star.orbitAngle,
        yOffset: star.yOffset,
        yAmp: star.yAmp,
        yFreq: star.yFreq,
        scale: star.scale,
      };
    });

    // 6. Orbital Anchors for Fleet Entities (3 Rockets + 3 Aliens Dogfight)
    const fleetNodes = {
      // Pair 1: Alien 1 & Rocket 1
      'alien-1': { node: new THREE.Object3D(), t: 0, speed: 0.008, baseR: 13.8, yAmp: 3.2, prevX: 0, prevY: 0 },
      'rocket-1': { node: new THREE.Object3D(), t: -0.22, speed: 0.008, baseR: 13.4, yAmp: 3.0, prevX: 0, prevY: 0 },
      // Pair 2: Alien 2 & Rocket 2
      'alien-2': { node: new THREE.Object3D(), t: 2.4, speed: 0.0062, baseR: 19.5, yAmp: 4.5, prevX: 0, prevY: 0 },
      'rocket-2': { node: new THREE.Object3D(), t: 2.18, speed: 0.0062, baseR: 19.1, yAmp: 4.2, prevX: 0, prevY: 0 },
      // Pair 3: Alien 3 & Rocket 3
      'alien-3': { node: new THREE.Object3D(), t: 4.5, speed: 0.0075, baseR: 9.8, yAmp: 2.6, prevX: 0, prevY: 0 },
      'rocket-3': { node: new THREE.Object3D(), t: 4.28, speed: 0.0075, baseR: 9.4, yAmp: 2.4, prevX: 0, prevY: 0 },
    };

    Object.keys(fleetNodes).forEach((id) => {
      solarPlane.add(fleetNodes[id].node);
    });

    // Cache DOM Elements for 60FPS Transform Updates
    const domStarCache = {};
    const domFleetCache = {};

    // 7. Input Listeners (Unbounded 360° Sumbu X & Sumbu Y)
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

      // Sumbu X: Unbounded Continuous Orbit
      if (Math.abs(dx) > 0) {
        const azimuthDelta = dx * 0.0035;
        stateRef.current.orbitalVelocityX += azimuthDelta * 0.12;
        stateRef.current.targetOrbitalAngle += azimuthDelta;
      }

      // Sumbu Y: Unbounded Continuous Pitch (Rotates 360° without clamp)
      if (Math.abs(dy) > 0) {
        const elevationDelta = -dy * 0.0024;
        stateRef.current.orbitalVelocityY += elevationDelta * 0.12;
        stateRef.current.targetElevation += elevationDelta;
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

        const elevationDelta = deltaY * 0.0035;
        stateRef.current.orbitalVelocityY += elevationDelta * 0.14;
        stateRef.current.targetElevation += elevationDelta;
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
      else if (e.key === 'ArrowUp') stateRef.current.targetElevation += 0.15;
      else if (e.key === 'ArrowDown') stateRef.current.targetElevation -= 0.15;
      else if (e.key === '+' || e.key === '=') stateRef.current.targetRadius = Math.max(16.0, stateRef.current.targetRadius - 3.5);
      else if (e.key === '-' || e.key === '_') stateRef.current.targetRadius = Math.min(46.0, stateRef.current.targetRadius + 3.5);
    };

    const handleMouseMove = (e) => {
      stateRef.current.mouseX = (e.clientX / window.innerWidth) * 2 - 1;
      stateRef.current.mouseY = (e.clientY / window.innerHeight) * 2 - 1;
    };

    const handleResize = () => {
      const mob = window.innerWidth < 768;
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.fov = mob ? 58 : 45;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('resize', handleResize);

    // 8. Animation Loop
    const projectVector = new THREE.Vector3();
    const tempWorldPos = new THREE.Vector3();

    const animate = () => {
      animId = requestAnimationFrame(animate);

      // Rotate Sun Core
      sunMesh.rotation.y += 0.003;
      sunMesh.rotation.x += 0.0015;

      // Update Planet Positions
      for (const key in planetsData) {
        const p = planetsData[key];
        p.angle += p.speed;
        p.group.position.x = Math.cos(p.angle) * p.radius;
        p.group.position.z = Math.sin(p.angle) * p.radius;
        p.group.position.y = 0;

        if (p.moonGroup) {
          p.moonAngle += 0.035;
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
      }

      // Update Fleet 3D Positions in Orbit (Dogfight Trajectories)
      for (const id in fleetNodes) {
        const f = fleetNodes[id];
        f.t += f.speed;
        f.node.position.x = Math.cos(f.t) * f.baseR;
        f.node.position.z = Math.sin(f.t) * (f.baseR * 1.08);
        f.node.position.y = Math.sin(f.t * 2.5) * f.yAmp;
      }

      // Physics momentum damping
      const s = stateRef.current;
      if (Math.abs(s.orbitalVelocityX) > 0.00004) {
        s.targetOrbitalAngle += s.orbitalVelocityX;
        s.orbitalVelocityX *= 0.88;
      } else {
        s.orbitalVelocityX = 0;
      }

      if (Math.abs(s.orbitalVelocityY) > 0.00004) {
        s.targetElevation += s.orbitalVelocityY;
        s.orbitalVelocityY *= 0.88;
      } else {
        s.orbitalVelocityY = 0;
      }

      if (s.autoOrbit) {
        s.targetOrbitalAngle += 0.0028;
      }

      // Smooth interpolation
      s.orbitalAngle += (s.targetOrbitalAngle - s.orbitalAngle) * 0.1;
      s.elevation += (s.targetElevation - s.elevation) * 0.1;
      s.radius += (s.targetRadius - s.radius) * 0.12;

      // Unbounded Spherical Camera Coordinates (360° X & Y Omnidirectional Orbit)
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

        // Spherical position vector
        camTargetX = R * cosPhi * sinTheta + s.mouseX * (mob ? 0.4 : 0.8);
        camTargetY = R * sinPhi - s.mouseY * (mob ? 0.3 : 0.6);
        camTargetZ = R * cosPhi * cosTheta;

        lookTargetX = s.mouseX * 0.4;
        lookTargetY = -s.mouseY * 0.3;
        lookTargetZ = 0;

        // Smooth orthogonal up-vector preventing gimbal singularities
        upX = -sinPhi * sinTheta;
        upY = cosPhi;
        upZ = -sinPhi * cosTheta;
      } else if (planetsData[s.currentCamTarget]) {
        const targetPlanet = planetsData[s.currentCamTarget];
        const wp = new THREE.Vector3();
        targetPlanet.group.getWorldPosition(wp);
        camTargetX = wp.x + (mob ? 3.0 : 4.5);
        camTargetY = wp.y + (mob ? 2.0 : 2.5);
        camTargetZ = wp.z + (mob ? 4.5 : 6.0);
        lookTargetX = wp.x;
        lookTargetY = wp.y;
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

      s.upLerp.x += (upX - s.upLerp.x) * lerpSpeed;
      s.upLerp.y += (upY - s.upLerp.y) * lerpSpeed;
      s.upLerp.z += (upZ - s.upLerp.z) * lerpSpeed;

      camera.up.set(s.upLerp.x, s.upLerp.y, s.upLerp.z);
      camera.position.set(s.camLerp.x, s.camLerp.y, s.camLerp.z);
      camera.lookAt(s.camLerp.tx, s.camLerp.ty, s.camLerp.tz);

      renderer.render(scene, camera);

      // Project Planet 3D to 2D Screen Coordinates
      if (onUpdatePlanetCoords) {
        const coords = {};
        for (const key in planetsData) {
          const wp = new THREE.Vector3();
          planetsData[key].group.getWorldPosition(wp);
          projectVector.copy(wp).project(camera);

          const isBehind = projectVector.z > 1.0;
          const x = (projectVector.x * 0.5 + 0.5) * window.innerWidth;
          const y = (-(projectVector.y * 0.5) + 0.5) * window.innerHeight;

          coords[key] = {
            x,
            y,
            visible: !isBehind && x > -50 && x < window.innerWidth + 50 && y > -50 && y < window.innerHeight + 50,
          };
        }
        onUpdatePlanetCoords(coords);
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

        const isBehind = projectVector.z > 1.0;
        const sx = (projectVector.x * 0.5 + 0.5) * window.innerWidth;
        const sy = (-(projectVector.y * 0.5) + 0.5) * window.innerHeight;
        const inBounds = sx >= -80 && sx <= window.innerWidth + 80 && sy >= -80 && sy <= window.innerHeight + 80;

        if (isBehind || !inBounds) {
          el.style.opacity = '0';
          el.style.pointerEvents = 'none';
        } else {
          // Perspective depth scaling (near = larger, far = smaller)
          const depthFactor = Math.max(0.68, Math.min(1.28, 28 / dist));
          const finalScale = (sData.scale || 1.0) * depthFactor * (mob ? 0.72 : 1.0);
          el.style.transform = `translate3d(${sx}px, ${sy}px, 0) translate(-50%, -50%) scale(${finalScale.toFixed(3)})`;
          // Modulate brightness/opacity smoothly with distance
          const depthFade = Math.max(0.35, Math.min(1.0, 1.4 - dist / 50));
          el.style.opacity = depthFade.toFixed(2);
          el.style.pointerEvents = 'auto';
        }
      }

      // Project Fleet Entities (Rockets & Aliens) in 3D Orbit directly to DOM Elements
      for (const id in fleetNodes) {
        if (!domFleetCache[id]) {
          domFleetCache[id] = document.getElementById(id);
        }
        const fEl = domFleetCache[id];
        if (!fEl) continue;

        // Skip positioning if currently being dragged
        if (fEl.classList.contains('is-dragged')) continue;

        const f = fleetNodes[id];
        f.node.getWorldPosition(tempWorldPos);
        const dist = tempWorldPos.distanceTo(camPos);
        projectVector.copy(tempWorldPos).project(camera);

        const isBehind = projectVector.z > 1.0;
        const fx = (projectVector.x * 0.5 + 0.5) * window.innerWidth;
        const fy = (-(projectVector.y * 0.5) + 0.5) * window.innerHeight;
        const inBounds = fx >= -120 && fx <= window.innerWidth + 120 && fy >= -120 && fy <= window.innerHeight + 120;

        if (isBehind || !inBounds) {
          fEl.style.opacity = '0';
          fEl.style.pointerEvents = 'none';
        } else {
          // Dynamic heading angle calculated from instantaneous screen delta
          let headingDeg = 0;
          if (f.prevX !== 0 && f.prevY !== 0) {
            const dScreenX = fx - f.prevX;
            const dScreenY = fy - f.prevY;
            if (dScreenX * dScreenX + dScreenY * dScreenY > 0.05) {
              // Rocket noses point up by default (offset 90deg), Aliens point forward
              const isRocket = id.startsWith('rocket');
              const baseAngle = Math.atan2(dScreenY, dScreenX) * (180 / Math.PI);
              headingDeg = isRocket ? baseAngle + 90 : baseAngle;
            }
          }
          f.prevX = fx;
          f.prevY = fy;

          const depthFactor = Math.max(0.65, Math.min(1.3, 28 / dist));
          const mobFactor = mob ? 0.6 : 1.0;
          const finalScale = depthFactor * mobFactor;

          fEl.style.transform = `translate3d(${fx}px, ${fy}px, 0) translate(-50%, -50%) rotate(${headingDeg.toFixed(1)}deg) scale(${finalScale.toFixed(3)})`;
          fEl.style.opacity = '1';
          fEl.style.pointerEvents = 'auto';
        }
      }

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
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
    };
  }, []);

  return <canvas ref={canvasRef} id="cosmic-canvas" aria-hidden="true" />;
}
