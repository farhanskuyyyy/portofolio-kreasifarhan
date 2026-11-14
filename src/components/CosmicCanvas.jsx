import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { audioEngine } from '../utils/audio';

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
    elevation: 0.26,
    orbitalVelocityY: 0,
    targetElevation: 0.26,
    radius: 28.5,
    targetRadius: 28.5,
    autoOrbit: false,
    camLerp: { x: 0, y: 5.5, z: 28.5, tx: 0, ty: 0, tz: 0 },
    mouseX: 0,
    mouseY: 0,
    currentCamTarget: 'overview',
  });

  // Sync auto orbit prop
  useEffect(() => {
    stateRef.current.autoOrbit = autoOrbitEnabled;
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
    const currentLoops = Math.round(stateRef.current.orbitalAngle / twoPi);
    stateRef.current.targetOrbitalAngle = currentLoops * twoPi;
    stateRef.current.targetElevation = 0.26;
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
    camera.position.set(0, 5.5, stateRef.current.radius);

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

    // 5. Input Listeners (Sumbu X: Orbit, Sumbu Y: Tilt, Zoom: Pinch/Wheel)
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

      // Sumbu X: Orbit
      if (Math.abs(dx) > 0) {
        const azimuthDelta = dx * 0.0035;
        stateRef.current.orbitalVelocityX += azimuthDelta * 0.12;
        stateRef.current.targetOrbitalAngle += azimuthDelta;
      }

      // Sumbu Y: Elevation tilt
      if (Math.abs(dy) > 0) {
        const elevationDelta = -dy * 0.0018;
        stateRef.current.orbitalVelocityY += elevationDelta * 0.12;
        stateRef.current.targetElevation = Math.max(
          -0.15,
          Math.min(1.1, stateRef.current.targetElevation + elevationDelta)
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

        const elevationDelta = deltaY * 0.0028;
        stateRef.current.orbitalVelocityY += elevationDelta * 0.14;
        stateRef.current.targetElevation = Math.max(
          -0.15,
          Math.min(1.1, stateRef.current.targetElevation + elevationDelta)
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
      else if (e.key === 'ArrowUp') stateRef.current.targetElevation = Math.min(1.1, stateRef.current.targetElevation + 0.12);
      else if (e.key === 'ArrowDown') stateRef.current.targetElevation = Math.max(-0.15, stateRef.current.targetElevation - 0.12);
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

    // 6. Animation Loop
    const projectVector = new THREE.Vector3();
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

      // Physics momentum damping
      const s = stateRef.current;
      if (Math.abs(s.orbitalVelocityX) > 0.00004) {
        s.targetOrbitalAngle += s.orbitalVelocityX;
        s.orbitalVelocityX *= 0.88;
      } else {
        s.orbitalVelocityX = 0;
      }

      if (Math.abs(s.orbitalVelocityY) > 0.00004) {
        s.targetElevation = Math.max(-0.15, Math.min(1.1, s.targetElevation + s.orbitalVelocityY));
        s.orbitalVelocityY *= 0.88;
      } else {
        s.orbitalVelocityY = 0;
      }

      if (s.autoOrbit) {
        s.targetOrbitalAngle += 0.0035;
      }

      // Smooth interpolation
      s.orbitalAngle += (s.targetOrbitalAngle - s.orbitalAngle) * 0.1;
      s.elevation += (s.targetElevation - s.elevation) * 0.1;
      s.radius += (s.targetRadius - s.radius) * 0.12;

      // Camera coordinates
      const mob = window.innerWidth < 768;
      const theta = s.orbitalAngle;
      const phi = s.elevation;
      const R = s.radius;

      let camTargetX = 0, camTargetY = 5.5, camTargetZ = R;
      let lookTargetX = 0, lookTargetY = 0, lookTargetZ = 0;

      if (s.currentCamTarget === 'overview') {
        const H = R * Math.cos(phi);
        camTargetX = Math.sin(theta) * H + s.mouseX * (mob ? 0.5 : 1.0);
        camTargetZ = Math.cos(theta) * H;
        camTargetY = R * Math.sin(phi) - s.mouseY * (mob ? 0.4 : 0.8);
        lookTargetX = s.mouseX * 0.5;
        lookTargetY = -s.mouseY * 0.4;
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
      }

      const lerpSpeed = 0.07;
      s.camLerp.x += (camTargetX - s.camLerp.x) * lerpSpeed;
      s.camLerp.y += (camTargetY - s.camLerp.y) * lerpSpeed;
      s.camLerp.z += (camTargetZ - s.camLerp.z) * lerpSpeed;
      s.camLerp.tx += (lookTargetX - s.camLerp.tx) * lerpSpeed;
      s.camLerp.ty += (lookTargetY - s.camLerp.ty) * lerpSpeed;
      s.camLerp.tz += (lookTargetZ - s.camLerp.tz) * lerpSpeed;

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

      // Update Telemetry Callbacks
      if (onUpdateTelemetry) {
        const twoPi = Math.PI * 2;
        let normalizedAngle = s.orbitalAngle % twoPi;
        if (normalizedAngle < 0) normalizedAngle += twoPi;
        const normalizedDeg = Math.round((normalizedAngle / twoPi) * 360) % 360;

        let sectorName = 'FRONT OBLIQUE';
        if (normalizedDeg >= 45 && normalizedDeg < 135) sectorName = 'EAST PROFILE';
        else if (normalizedDeg >= 135 && normalizedDeg < 225) sectorName = 'DEEP HORIZON';
        else if (normalizedDeg >= 225 && normalizedDeg < 315) sectorName = 'WEST PROFILE';

        const elevationDeg = Math.round(s.elevation * (180 / Math.PI));
        onUpdateTelemetry({
          angle: normalizedDeg,
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
