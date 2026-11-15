import React, { useState, useEffect, useRef, useCallback } from 'react';
import { audioEngine } from '../utils/audio';

const TEETH_COUNT = 28;
const INITIAL_ROCKET_P = 0.07; // Resting position at bottom-left (~7% along trajectory)
const TRAJECTORY_AMP = 0.075;  // 7.5% lateral weave deflection
const TRAJECTORY_FREQ = 3.0;   // 3 half-cycles: climbs, weaves right across center, curves up & exits

// Function returning normalized coordinates (0..1) and normalized derivative vectors
export const getTrajectoryNorm = (u) => {
  const angle = TRAJECTORY_FREQ * Math.PI * u;
  const wave = TRAJECTORY_AMP * Math.sin(angle);
  const dw = TRAJECTORY_AMP * TRAJECTORY_FREQ * Math.PI * Math.cos(angle);

  // Baseline diagonal from (0, 1) to (1, 0)
  const x = u - wave;
  const y = (1.0 - u) - wave;
  const dx = 1.0 - dw;
  const dy = -1.0 - dw;

  return { x, y, dx, dy, wave, dw };
};

// Compute physical screen position and rocket heading angle in degrees (0 deg is UP)
export const getScreenPosAndAngle = (p, W, H) => {
  const { x, y, dx, dy } = getTrajectoryNorm(p);
  const screenX = x * W;
  const screenY = y * H;
  const physDX = dx * W;
  const physDY = dy * H;
  const angleDeg = Math.atan2(physDY, physDX) * (180 / Math.PI) + 90;
  return { screenX, screenY, angleDeg };
};

// Compute SVG seam coordinates and normal in the 1000 x 1000 viewBox
export const getSeamPoint = (u) => {
  const { x, y, dx, dy } = getTrajectoryNorm(u);
  const svgX = x * 1000;
  const svgY = y * 1000;
  const len = Math.hypot(dx, dy) || 1;
  const nx = dy / len;
  const ny = -dx / len;
  return { svgX, svgY, nx, ny };
};

// Generate curved zipper track path string ahead of rocket
export const computeTrackPath = (p) => {
  if (p >= 0.98) return '';
  const steps = 14;
  let d = '';
  for (let i = 0; i <= steps; i++) {
    const u = p + (1.0 - p) * (i / steps);
    const { svgX, svgY } = getSeamPoint(u);
    d += (i === 0 ? `M ${svgX.toFixed(1)},${svgY.toFixed(1)}` : ` L ${svgX.toFixed(1)},${svgY.toFixed(1)}`);
  }
  return d;
};

// Generate SVG path strings for Top-Left and Bottom-Right curtains along curved trajectory
export const computeCurtainPaths = (p) => {
  const { svgX: rx, svgY: ry, nx: rnx, ny: rny } = getSeamPoint(p);
  const openFactor = Math.min(p / 0.95, 1.0);
  const maxDisplacement = 550 * openFactor;

  // Sample seam points ahead of rocket
  const seamAhead = [];
  if (p < 0.98) {
    const steps = 12;
    for (let i = 0; i <= steps; i++) {
      const u = p + (1.0 - p) * (i / steps);
      const { svgX, svgY } = getSeamPoint(u);
      seamAhead.push({ x: svgX, y: svgY });
    }
  }

  // Top-Left curtain path
  let dTL = 'M 0,0 L 1000,0';
  if (seamAhead.length > 0) {
    for (let i = seamAhead.length - 1; i >= 0; i--) {
      dTL += ` L ${seamAhead[i].x.toFixed(1)},${seamAhead[i].y.toFixed(1)}`;
    }
  }
  if (p > INITIAL_ROCKET_P) {
    const apexTL_X = rx + 30 * rnx;
    const apexTL_Y = ry + 30 * rny;
    const midTL_X = Math.max(0, rx * 0.4 - maxDisplacement * 0.5);
    const midTL_Y = Math.max(0, ry * 0.4 - maxDisplacement * 0.5);
    const baseTL_Y = Math.max(0, 1000 - maxDisplacement * 1.2);
    dTL += ` Q ${midTL_X.toFixed(1)},${midTL_Y.toFixed(1)} 0,${baseTL_Y.toFixed(1)}`;
  } else {
    dTL += ' L 0,1000';
  }
  dTL += ' Z';

  // Bottom-Right curtain path
  let dBR = 'M 1000,1000';
  if (p > INITIAL_ROCKET_P) {
    const baseBR_X = Math.min(1000, maxDisplacement * 1.2);
    const midBR_X = Math.min(1000, rx * 0.6 + maxDisplacement * 0.5);
    const midBR_Y = Math.min(1000, ry * 0.6 + maxDisplacement * 0.5);
    const apexBR_X = rx - 30 * rnx;
    const apexBR_Y = ry - 30 * rny;
    dBR += ` L ${baseBR_X.toFixed(1)},1000 Q ${midBR_X.toFixed(1)},${midBR_Y.toFixed(1)} ${apexBR_X.toFixed(1)},${apexBR_Y.toFixed(1)}`;
  } else {
    dBR += ' L 0,1000';
  }
  if (seamAhead.length > 0) {
    for (let i = 0; i < seamAhead.length; i++) {
      dBR += ` L ${seamAhead[i].x.toFixed(1)},${seamAhead[i].y.toFixed(1)}`;
    }
  } else {
    dBR += ' L 1000,0';
  }
  dBR += ' Z';

  return { dTL, dBR };
};

export default function CosmicRocketOpening({ onComplete }) {
  const [status, setStatus] = useState('idle'); // 'idle' | 'igniting' | 'flying' | 'clearing' | 'closed'
  const [isHovered, setIsHovered] = useState(false);

  const overlayRef = useRef(null);
  const promptCardRef = useRef(null);
  const rocketWrapperRef = useRef(null);
  const pathTLRef = useRef(null);
  const pathBRRef = useRef(null);
  const trackRef = useRef(null);
  const targetRingRef = useRef(null);
  const idlePlumeRef = useRef(null);
  const activeFlameRef = useRef(null);
  const nozzleRimRef = useRef(null);
  const teethElementsRef = useRef([]);
  const sparksCanvasRef = useRef(null);

  const animFrameRef = useRef(null);
  const sparksRef = useRef([]);

  // Direct DOM render function (zero React reconciliation during flight for 60/120fps smoothness)
  const applyFrameDirect = useCallback((p, nextUnzippedIdxRef) => {
    const W = window.innerWidth;
    const H = window.innerHeight;
    const { screenX, screenY, angleDeg } = getScreenPosAndAngle(p, W, H);

    // 1. Move & Rotate Rocket Wrapper with dynamic tangent banking along curve
    if (rocketWrapperRef.current) {
      rocketWrapperRef.current.style.left = `${screenX}px`;
      rocketWrapperRef.current.style.top = `${screenY}px`;
      rocketWrapperRef.current.style.transform = `translate(-50%, -50%) rotate(${angleDeg}deg)`;
    }

    // 2. Update SVG Curtain Paths
    const { dTL, dBR } = computeCurtainPaths(p);
    if (pathTLRef.current) pathTLRef.current.setAttribute('d', dTL);
    if (pathBRRef.current) pathBRRef.current.setAttribute('d', dBR);

    // 3. Update Curved Zipper Track ahead of rocket
    if (trackRef.current) {
      if (p < 0.98) {
        trackRef.current.style.display = 'block';
        trackRef.current.setAttribute('d', computeTrackPath(p));
      } else {
        trackRef.current.style.display = 'none';
      }
    }

    // 4. Decouple teeth sequentially as rocket passes them along the curve
    while (
      nextUnzippedIdxRef.current < TEETH_COUNT &&
      p >= nextUnzippedIdxRef.current / (TEETH_COUNT - 1)
    ) {
      const idx = nextUnzippedIdxRef.current;
      const toothItem = teethElementsRef.current[idx];
      if (toothItem) {
        const u = idx / (TEETH_COUNT - 1);
        const { svgX, svgY, nx, ny } = getSeamPoint(u);

        // Decouple top-left prong: shifts +50px along normal
        toothItem.tl.setAttribute('x1', svgX + 44 * nx);
        toothItem.tl.setAttribute('y1', svgY + 44 * ny);
        toothItem.tl.setAttribute('x2', svgX + 56 * nx);
        toothItem.tl.setAttribute('y2', svgY + 56 * ny);
        toothItem.tl.setAttribute('opacity', '0.2');

        // Decouple bottom-right prong: shifts -50px along normal
        toothItem.br.setAttribute('x1', svgX - 44 * nx);
        toothItem.br.setAttribute('y1', svgY - 44 * ny);
        toothItem.br.setAttribute('x2', svgX - 56 * nx);
        toothItem.br.setAttribute('y2', svgY - 56 * ny);
        toothItem.br.setAttribute('opacity', '0.2');

        // Emit spark particles at decoupling tooth location in screen pixels
        const { screenX: toothScreenX, screenY: toothScreenY } = getScreenPosAndAngle(u, W, H);
        for (let s = 0; s < 3; s++) {
          const sparkAngle = Math.random() * Math.PI * 2;
          const speed = 40 + Math.random() * 90;
          sparksRef.current.push({
            x: toothScreenX,
            y: toothScreenY,
            vx: Math.cos(sparkAngle) * speed,
            vy: Math.sin(sparkAngle) * speed,
            color: Math.random() > 0.4 ? '#ffd54f' : '#4fc3f7',
            alpha: 1.0,
            radius: 2 + Math.random() * 2.5,
          });
        }
      }
      nextUnzippedIdxRef.current++;
    }

    // 5. Draw dynamic spark particles on lightweight Canvas
    if (sparksCanvasRef.current) {
      const ctx = sparksCanvasRef.current.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, W, H);
        for (let i = sparksRef.current.length - 1; i >= 0; i--) {
          const sp = sparksRef.current[i];
          sp.x += sp.vx * 0.016;
          sp.y += sp.vy * 0.016;
          sp.alpha -= 0.035;
          if (sp.alpha <= 0) {
            sparksRef.current.splice(i, 1);
          } else {
            ctx.save();
            ctx.globalAlpha = Math.max(0, sp.alpha);
            ctx.fillStyle = sp.color;
            ctx.shadowColor = sp.color;
            ctx.shadowBlur = 8;
            ctx.beginPath();
            ctx.arc(sp.x, sp.y, sp.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
          }
        }
      }
    }
  }, []);

  // Initialize canvas size and default positions on mount
  useEffect(() => {
    const handleResize = () => {
      if (sparksCanvasRef.current) {
        sparksCanvasRef.current.width = window.innerWidth;
        sparksCanvasRef.current.height = window.innerHeight;
      }
      const dummyRef = { current: 0 };
      applyFrameDirect(INITIAL_ROCKET_P, dummyRef);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [applyFrameDirect]);

  // Launch handler: starts audio, ignition shudder, then continuous smooth curving flight
  const handleLaunch = useCallback(() => {
    if (status !== 'idle') return;

    setStatus('igniting');
    audioEngine.playRocketIgnitionLaunch();

    if (promptCardRef.current) promptCardRef.current.classList.add('is-launching');
    if (rocketWrapperRef.current) rocketWrapperRef.current.classList.add('is-igniting');
    if (targetRingRef.current) targetRingRef.current.style.display = 'none';
    if (idlePlumeRef.current) idlePlumeRef.current.style.display = 'none';
    if (activeFlameRef.current) activeFlameRef.current.style.display = 'block';
    if (nozzleRimRef.current) nozzleRimRef.current.setAttribute('fill', '#ffeb3b');

    // After 260ms ignition rumble, begin smooth 60fps flight along curve
    setTimeout(() => {
      setStatus('flying');
      if (rocketWrapperRef.current) {
        rocketWrapperRef.current.classList.remove('is-igniting');
        rocketWrapperRef.current.classList.add('is-flying');
      }

      const startTime = performance.now();
      const FLIGHT_DURATION = 2300; // ms for graceful, weaving flight
      const nextUnzippedIdxRef = { current: 0 };

      const step = (now) => {
        const elapsed = now - startTime;
        const rawT = Math.min(elapsed / FLIGHT_DURATION, 1.0);

        // Continuous smooth mathematical acceleration: starts gentle, accelerates into warp
        const t = Math.pow(rawT, 2.0);

        const currentP = INITIAL_ROCKET_P + t * (1.18 - INITIAL_ROCKET_P);
        applyFrameDirect(currentP, nextUnzippedIdxRef);

        if (rawT < 1.0) {
          animFrameRef.current = requestAnimationFrame(step);
        } else {
          // Clear remaining curtains smoothly
          setStatus('clearing');
          if (overlayRef.current) overlayRef.current.classList.add('is-clearing');
          setTimeout(() => {
            setStatus('closed');
            if (onComplete) onComplete();
          }, 420);
        }
      };

      animFrameRef.current = requestAnimationFrame(step);
    }, 260);
  }, [status, applyFrameDirect, onComplete]);

  // Automatic launch sequence on mount (no click required)
  useEffect(() => {
    const autoTimer = setTimeout(() => {
      handleLaunch();
    }, 700);
    return () => clearTimeout(autoTimer);
  }, [handleLaunch]);

  // Clean up animation on unmount
  useEffect(() => {
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  // Keyboard accessibility: Enter or Space triggers launch immediately
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.key === 'Enter' || e.key === ' ') && status === 'idle') {
        e.preventDefault();
        handleLaunch();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleLaunch, status]);

  if (status === 'closed') {
    return null;
  }

  const initialPaths = computeCurtainPaths(INITIAL_ROCKET_P);
  const initialTrackPath = computeTrackPath(INITIAL_ROCKET_P);
  const initialScreen = typeof window !== 'undefined'
    ? getScreenPosAndAngle(INITIAL_ROCKET_P, window.innerWidth, window.innerHeight)
    : { screenX: 0, screenY: 0, angleDeg: 31 };

  return (
    <div
      ref={overlayRef}
      className={`rocket-opening-overlay ${status === 'clearing' ? 'is-clearing' : ''}`}
      role="region"
      aria-label="Gerbang Pembuka Portofolio"
    >
      {/* 1. Dynamic SVG Cosmic Zipper Curtain */}
      <svg
        className="curtain-svg"
        viewBox="0 0 1000 1000"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <defs>
          <radialGradient id="nebulaGradTL" cx="25%" cy="25%" r="75%">
            <stop offset="0%" stopColor="#0d1424" />
            <stop offset="45%" stopColor="#080c14" />
            <stop offset="100%" stopColor="#040609" />
          </radialGradient>
          <radialGradient id="nebulaGradBR" cx="75%" cy="75%" r="75%">
            <stop offset="0%" stopColor="#120e20" />
            <stop offset="50%" stopColor="#080a12" />
            <stop offset="100%" stopColor="#040609" />
          </radialGradient>
          <linearGradient id="seamGlowGrad" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ffb74d" stopOpacity="0.8" />
            <stop offset="50%" stopColor="#4fc3f7" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#64b5f6" stopOpacity="0.4" />
          </linearGradient>
          <filter id="curtainShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="-4" dy="-4" stdDeviation="12" floodColor="#000000" floodOpacity="0.95" />
          </filter>
        </defs>

        {/* Top-Left Curtain Half */}
        <path
          ref={pathTLRef}
          className="curtain-polygon curtain-tl"
          d={initialPaths.dTL}
          fill="url(#nebulaGradTL)"
          filter="url(#curtainShadow)"
        />

        {/* Bottom-Right Curtain Half */}
        <path
          ref={pathBRRef}
          className="curtain-polygon curtain-br"
          d={initialPaths.dBR}
          fill="url(#nebulaGradBR)"
          filter="url(#curtainShadow)"
        />

        {/* Curved Zipper Track Path ahead of rocket */}
        <path
          ref={trackRef}
          d={initialTrackPath}
          fill="none"
          stroke="url(#seamGlowGrad)"
          strokeWidth="2.5"
          strokeDasharray="8 6"
          className="zipper-seam-track"
        />

        {/* Interlocking Sci-Fi Zipper Teeth along Curved Trajectory */}
        <g id="zipper-teeth-group">
          {Array.from({ length: TEETH_COUNT }).map((_, idx) => {
            const u = idx / (TEETH_COUNT - 1);
            const { svgX, svgY, nx, ny } = getSeamPoint(u);
            return (
              <g key={`tooth-${idx}`} className="zipper-tooth">
                <line
                  ref={(el) => {
                    if (el) {
                      if (!teethElementsRef.current[idx]) teethElementsRef.current[idx] = {};
                      teethElementsRef.current[idx].tl = el;
                    }
                  }}
                  x1={svgX}
                  y1={svgY}
                  x2={svgX + 11 * nx}
                  y2={svgY + 11 * ny}
                  stroke="#ffd54f"
                  strokeWidth="2.8"
                  strokeLinecap="round"
                  opacity="0.85"
                />
                <line
                  ref={(el) => {
                    if (el) {
                      if (!teethElementsRef.current[idx]) teethElementsRef.current[idx] = {};
                      teethElementsRef.current[idx].br = el;
                    }
                  }}
                  x1={svgX}
                  y1={svgY}
                  x2={svgX - 11 * nx}
                  y2={svgY - 11 * ny}
                  stroke="#4fc3f7"
                  strokeWidth="2.8"
                  strokeLinecap="round"
                  opacity="0.85"
                />
              </g>
            );
          })}
        </g>
      </svg>

      {/* 2. Spark particles Canvas overlay */}
      <canvas
        ref={sparksCanvasRef}
        className="zipper-sparks-canvas"
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          zIndex: 100005,
        }}
      />

      {/* 3. Cinematic Opening HUD (Pure Celestial Typography, Autonomous Launch Sequence) */}
      <div
        ref={promptCardRef}
        className={`opening-cinematic-hud ${status !== 'idle' ? 'is-launching' : ''}`}
        aria-live="polite"
      >
        <div className="hud-phase-chip">
          <span className="phase-beacon-dot"></span>
          <span className="phase-text">ORBITAL GATEWAY // AUTONOMOUS LAUNCH</span>
        </div>

        <div className="hud-headline-wrap">
          <h1 className="hud-cinematic-title">
            MEMBELAH CAKRAWALA
          </h1>
          <p className="hud-cinematic-whisper">
            Sistem propulsi hiperdrive aktif. Menembus tirai gravitasi kosmos...
          </p>
        </div>

        <button
          type="button"
          className="hud-launch-pill"
          onClick={handleLaunch}
          onMouseEnter={() => {
            setIsHovered(true);
            audioEngine.playRocketHover();
          }}
          onMouseLeave={() => setIsHovered(false)}
          tabIndex={0}
          aria-label="Sistem propulsi otomatis aktif"
        >
          <span className="pill-bracket">[</span>
          <span className="pill-pulse-dot"></span>
          <span className="pill-label">SEKUENS PELUNCURAN OTOMATIS AKTIF</span>
          <span className="pill-arrow">↗</span>
          <span className="pill-bracket">]</span>
        </button>
      </div>

      {/* 4. Interactive Starship Rocket Vehicle (New Sleek Rounded Capsule Shape) */}
      <div
        ref={rocketWrapperRef}
        className={`rocket-vehicle-wrapper ${status === 'igniting' ? 'is-igniting' : ''} ${status === 'flying' ? 'is-flying' : ''} ${isHovered ? 'is-hovered' : ''}`}
        style={{
          left: `${initialScreen.screenX}px`,
          top: `${initialScreen.screenY}px`,
          transform: `translate(-50%, -50%) rotate(${initialScreen.angleDeg}deg)`,
        }}
        onClick={handleLaunch}
        onMouseEnter={() => {
          setIsHovered(true);
          audioEngine.playRocketHover();
        }}
        onMouseLeave={() => setIsHovered(false)}
        role="button"
        tabIndex={0}
        aria-label="Wahana antariksa rounded berpropulsi otomatis."
      >
        {/* Subtle Ethereal Gravitational Halo (Soft breathing rings, zero clunky borders) */}
        {status === 'idle' && (
          <div ref={targetRingRef} className="rocket-ethereal-halo" aria-hidden="true">
            <span className="halo-pulse-ring ring-1"></span>
            <span className="halo-pulse-ring ring-2"></span>
            <div className="rocket-sleek-callout">
              <span className="callout-pip"></span>
              <span className="callout-text">WARP ↗</span>
            </div>
          </div>
        )}

        {/* Thruster Flame & Plume */}
        <div className="rocket-thruster-exhaust" aria-hidden="true">
          <span ref={idlePlumeRef} className="thruster-idle-plume"></span>
          <div ref={activeFlameRef} className="thruster-active-flame" style={{ display: 'none' }}>
            <span className="flame-core-white"></span>
            <span className="flame-body-orange"></span>
            <span className="flame-sheath-cyan"></span>
          </div>
        </div>

        {/* Detailed Rounded Sci-Fi Starship SVG Model */}
        <svg
          className="rocket-starship-svg"
          viewBox="0 0 90 130"
          width="84"
          height="122"
          aria-hidden="true"
        >
          <defs>
            {/* Soft Rounded Titanium Fuselage Gradient */}
            <linearGradient id="roundedHullGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#cfd8dc" />
              <stop offset="25%" stopColor="#ffffff" />
              <stop offset="65%" stopColor="#f1f5f9" />
              <stop offset="100%" stopColor="#94a3b8" />
            </linearGradient>

            {/* Rounded Aerodynamic Wing Gradient */}
            <linearGradient id="roundedWingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#334155" />
              <stop offset="50%" stopColor="#1e293b" />
              <stop offset="100%" stopColor="#0f172a" />
            </linearGradient>

            {/* Rounded Booster Pods Gradient */}
            <linearGradient id="roundedBoosterGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#64748b" />
              <stop offset="40%" stopColor="#e2e8f0" />
              <stop offset="100%" stopColor="#475569" />
            </linearGradient>

            {/* Cockpit Bubble Visor Glass */}
            <radialGradient id="visorGlassGrad" cx="38%" cy="38%" r="65%">
              <stop offset="0%" stopColor="#e0f2fe" />
              <stop offset="45%" stopColor="#38bdf8" />
              <stop offset="85%" stopColor="#0284c7" />
              <stop offset="100%" stopColor="#0369a1" />
            </radialGradient>

            {/* Gold Thermal Rings Gradient */}
            <linearGradient id="goldRingGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#f59e0b" />
              <stop offset="50%" stopColor="#fef08a" />
              <stop offset="100%" stopColor="#d97706" />
            </linearGradient>

            {/* Rounded Bell Nozzle Gradient */}
            <linearGradient id="bellNozzleGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#1e293b" />
              <stop offset="50%" stopColor="#64748b" />
              <stop offset="100%" stopColor="#0f172a" />
            </linearGradient>
          </defs>

          {/* Left Swept Rounded Wing */}
          <path
            d="M 24,72 C 14,80 6,96 6,106 C 6,112 12,113 18,110 C 22,107 24,103 24,96 Z"
            fill="url(#roundedWingGrad)"
            stroke="#475569"
            strokeWidth="1.2"
            strokeLinejoin="round"
          />
          {/* Left Wingtip Beacon Light */}
          <circle cx="9" cy="107" r="2.2" fill="#ef4444" className="beacon-nav red" />

          {/* Right Swept Rounded Wing */}
          <path
            d="M 66,72 C 76,80 84,96 84,106 C 84,112 78,113 72,110 C 68,107 66,103 66,96 Z"
            fill="url(#roundedWingGrad)"
            stroke="#475569"
            strokeWidth="1.2"
            strokeLinejoin="round"
          />
          {/* Right Wingtip Beacon Light */}
          <circle cx="81" cy="107" r="2.2" fill="#10b981" className="beacon-nav green" />

          {/* Left Rounded Booster Pod (Capsule shape) */}
          <rect
            x="17"
            y="68"
            width="12"
            height="38"
            rx="6"
            ry="6"
            fill="url(#roundedBoosterGrad)"
            stroke="#475569"
            strokeWidth="1.2"
          />
          {/* Left Booster Tip Cap */}
          <circle cx="23" cy="74" r="3.5" fill="#f59e0b" opacity="0.85" />

          {/* Right Rounded Booster Pod (Capsule shape) */}
          <rect
            x="61"
            y="68"
            width="12"
            height="38"
            rx="6"
            ry="6"
            fill="url(#roundedBoosterGrad)"
            stroke="#475569"
            strokeWidth="1.2"
          />
          {/* Right Booster Tip Cap */}
          <circle cx="67" cy="74" r="3.5" fill="#f59e0b" opacity="0.85" />

          {/* Main Aerodynamic Fuselage with Soft Rounded Dome Nose Cone */}
          <path
            d="M 45,7 C 34,7 26,22 24,44 C 22,65 22,86 24,104 C 25,108 30,111 45,111 C 60,111 65,108 66,104 C 68,86 68,65 66,44 C 64,22 56,7 45,7 Z"
            fill="url(#roundedHullGrad)"
            stroke="#64748b"
            strokeWidth="1.4"
            strokeLinejoin="round"
          />

          {/* Soft Highlight Ridge along Hull */}
          <path
            d="M 45,11 C 38,11 32,24 30,46 C 29,65 29,85 31,102"
            stroke="#ffffff"
            strokeWidth="1.2"
            strokeLinecap="round"
            fill="none"
            opacity="0.8"
          />

          {/* Rounded Gold Thermal Rings */}
          <rect
            x="27"
            y="42"
            width="36"
            height="3.2"
            rx="1.6"
            fill="url(#goldRingGrad)"
            opacity="0.9"
          />
          <rect
            x="25"
            y="62"
            width="40"
            height="3.2"
            rx="1.6"
            fill="url(#goldRingGrad)"
            opacity="0.9"
          />

          {/* Cockpit Bubble Visor Glass */}
          <ellipse
            cx="45"
            cy="36"
            rx="9"
            ry="13"
            fill="url(#visorGlassGrad)"
            stroke="#38bdf8"
            strokeWidth="1.2"
          />
          {/* Cockpit Glare Reflection */}
          <ellipse
            cx="43"
            cy="33"
            rx="4.5"
            ry="7.5"
            fill="#ffffff"
            opacity="0.65"
          />

          {/* Avionics Marking Badge */}
          <text
            x="45"
            y="79"
            textAnchor="middle"
            fill="#0ea5e9"
            fontSize="7"
            fontFamily="monospace"
            fontWeight="bold"
            letterSpacing="1.2"
          >
            FA-01
          </text>

          {/* Engine Fairing & Rounded Bell Nozzle */}
          <path
            d="M 32,109 L 28,124 C 28,126 36,128 45,128 C 54,128 62,126 62,124 L 58,109 Z"
            fill="url(#bellNozzleGrad)"
            stroke="#475569"
            strokeWidth="1.2"
          />
          {/* Nozzle Gimbal Interior Rim */}
          <ellipse
            ref={nozzleRimRef}
            cx="45"
            cy="124"
            rx="14"
            ry="3.5"
            fill="#00e5ff"
            opacity="0.9"
          />
        </svg>
      </div>
    </div>
  );
}
