import React, { useState, useEffect, useRef, useCallback } from 'react';
import { audioEngine } from '../utils/audio';

const TITLE = 'BEYOND THE HORIZON';

// Boot sequence timeline (ms from mount). Auto-launch fires at LAUNCH_AT unless the user skips.
const BOOT_LINES = [
  { at: 350, label: 'NAV SYSTEMS', value: 'ONLINE' },
  { at: 800, label: 'FULLSTACK CORE', value: 'SYNCED' },
  { at: 1250, label: 'TRAJECTORY', value: 'LOCKED' },
];
const COUNTDOWN = [
  { at: 1700, value: 3 },
  { at: 2300, value: 2 },
  { at: 2900, value: 1 },
];
const LAUNCH_AT = 3500;

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

export default function CosmicRocketOpening({ onComplete }) {
  const [status, setStatus] = useState('idle'); // 'idle' | 'igniting' | 'flying' | 'clearing' | 'closed'
  const [isHovered, setIsHovered] = useState(false);
  const [bootStep, setBootStep] = useState(0);
  const [countdown, setCountdown] = useState(null);

  const overlayRef = useRef(null);
  const promptCardRef = useRef(null);
  const rocketWrapperRef = useRef(null);
  const backdropRef = useRef(null);
  const stageRef = useRef(null);
  const flareRef = useRef(null);
  const starCanvasRef = useRef(null);
  const animFrameRef = useRef(null);
  const launchedRef = useRef(false);
  const warpRef = useRef(0); // 0 = idle drift, 1 = full hyperspace streaks
  // Parent passes an inline callback; keep it in a ref so handleLaunch stays stable and the boot timeline isn't reset on every parent render
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  // Dive into the singularity: the emblem's black core becomes a portal that zooms past the camera.
  // The stage (emblem + flare) scales exponentially while a circular mask hole, matched to the core,
  // reveals the portfolio, which settles from an over-zoomed state as the portal swallows the screen.
  const renderDiveFrame = useCallback((t, dive) => {
    const zoom = Math.pow(dive.maxScale, Math.pow(t, 1.7));
    const holeLocal = dive.coreRadius * Math.min(t / 0.14, 1);
    const holeScreen = holeLocal * zoom;
    const coverage = Math.min(holeScreen / dive.screenRadius, 1);

    if (stageRef.current) {
      stageRef.current.style.transform = `scale(${zoom.toFixed(4)})`;
      stageRef.current.style.setProperty('--hole', `${holeLocal.toFixed(2)}px`);
    }
    if (backdropRef.current) {
      backdropRef.current.style.setProperty('--hole', `${holeScreen.toFixed(1)}px`);
    }
    document.body.style.setProperty('--arrival-scale', (1 + 0.35 * (1 - coverage)).toFixed(4));
  }, []);

  // Launch handler: starts audio, shockwave + flare, hyperspace warp, then the singularity dive
  const handleLaunch = useCallback(() => {
    if (launchedRef.current) return;
    launchedRef.current = true;

    setStatus('igniting');
    setCountdown(null);
    audioEngine.playRocketIgnitionLaunch();

    if (promptCardRef.current) promptCardRef.current.classList.add('is-launching');
    if (rocketWrapperRef.current) rocketWrapperRef.current.classList.add('is-igniting');
    if (flareRef.current) flareRef.current.classList.add('is-expanding');
    if (overlayRef.current) overlayRef.current.classList.add('is-launched');

    const reduced = prefersReducedMotion();
    const warpStart = performance.now();
    const rampWarp = (now) => {
      warpRef.current = Math.min((now - warpStart) / 900, 1);
      if (warpRef.current < 1) requestAnimationFrame(rampWarp);
    };
    if (!reduced) requestAnimationFrame(rampWarp);

    setTimeout(() => {
      setStatus('flying');
      if (rocketWrapperRef.current) {
        rocketWrapperRef.current.classList.remove('is-igniting');
        rocketWrapperRef.current.classList.add('is-flying');
      }

      // Black core of the emblem is r=36 in a 200-unit viewBox; keep the hole just inside its ivory rim
      const emblemRect = rocketWrapperRef.current?.getBoundingClientRect();
      const coreRadius = ((emblemRect?.width || 168) * 34) / 200;
      const screenRadius = Math.hypot(window.innerWidth, window.innerHeight) / 2;
      const dive = { coreRadius, screenRadius, maxScale: (screenRadius / coreRadius) * 1.15 };
      document.body.classList.add('opening-arrival');

      const startTime = performance.now();
      const DURATION = reduced ? 700 : 1900; // ms

      const step = (now) => {
        const elapsed = now - startTime;
        const rawT = Math.min(Math.max(elapsed / DURATION, 0), 1.0);
        renderDiveFrame(rawT, dive);

        if (rawT < 1.0) {
          animFrameRef.current = requestAnimationFrame(step);
        } else {
          setStatus('clearing');
          if (overlayRef.current) overlayRef.current.classList.add('is-clearing');
          document.body.classList.remove('opening-arrival');
          setTimeout(() => {
            setStatus('closed');
            if (onCompleteRef.current) onCompleteRef.current();
          }, 420);
        }
      };

      animFrameRef.current = requestAnimationFrame(step);
    }, reduced ? 120 : 320);
  }, [renderDiveFrame]);

  // Boot sequence: telemetry lines, 3-2-1 countdown, then auto-launch
  useEffect(() => {
    const timers = [
      ...BOOT_LINES.map((line, i) =>
        setTimeout(() => {
          if (!launchedRef.current) setBootStep(i + 1);
        }, line.at)
      ),
      ...COUNTDOWN.map(({ at, value }) =>
        setTimeout(() => {
          if (launchedRef.current) return;
          setCountdown(value);
          audioEngine.playUiClick(520 + (3 - value) * 140, 'sine', 0.06);
        }, at)
      ),
      setTimeout(handleLaunch, LAUNCH_AT),
    ];
    return () => timers.forEach(clearTimeout);
  }, [handleLaunch]);

  // Starfield: slow drift toward the singularity, radial hyperspace streaks once launched
  useEffect(() => {
    const canvas = starCanvasRef.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext('2d');
    const reduced = prefersReducedMotion();
    const STAR_COUNT = window.innerWidth < 768 ? 220 : 420;
    let width = 0;
    let height = 0;
    let rafId = null;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    const spawn = (star, farOnly) => {
      star.x = (Math.random() * 2 - 1) * 1.6;
      star.y = (Math.random() * 2 - 1) * 1.6;
      star.z = farOnly ? 0.85 + Math.random() * 0.15 : 0.05 + Math.random() * 0.95;
      star.pz = star.z;
      star.tint = Math.random();
      return star;
    };
    const stars = Array.from({ length: STAR_COUNT }, () => spawn({}, false));

    const render = () => {
      const warp = warpRef.current;
      const cx = width / 2;
      const cy = height / 2;
      const scale = Math.max(width, height) * 0.5;
      const speed = reduced ? 0 : 0.0009 + warp * warp * 0.032;

      ctx.clearRect(0, 0, width, height);

      for (const star of stars) {
        star.pz = star.z;
        star.z -= speed;
        if (star.z <= 0.02) {
          spawn(star, true);
          continue;
        }

        const sx = cx + (star.x / star.z) * scale;
        const sy = cy + (star.y / star.z) * scale;
        if (sx < -50 || sx > width + 50 || sy < -50 || sy > height + 50) {
          spawn(star, true);
          continue;
        }

        const depth = 1 - star.z;
        const alpha = Math.min(0.15 + depth * 0.95, 1);
        const color = star.tint > 0.82 ? '212, 163, 115' : star.tint > 0.68 ? '170, 210, 230' : '245, 242, 235';

        if (warp > 0.05) {
          const px = cx + (star.x / star.pz) * scale;
          const py = cy + (star.y / star.pz) * scale;
          ctx.strokeStyle = `rgba(${color}, ${alpha})`;
          ctx.lineWidth = 0.6 + depth * 1.8;
          ctx.beginPath();
          ctx.moveTo(px, py);
          ctx.lineTo(sx, sy);
          ctx.stroke();
        } else {
          ctx.fillStyle = `rgba(${color}, ${alpha})`;
          const r = 0.35 + depth * 1.35;
          ctx.fillRect(sx - r / 2, sy - r / 2, r, r);
        }
      }

      rafId = requestAnimationFrame(render);
    };
    rafId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  // Clean up animation and the arrival zoom on unmount
  useEffect(() => {
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      document.body.classList.remove('opening-arrival');
      document.body.style.removeProperty('--arrival-scale');
    };
  }, []);

  // Keyboard accessibility: Enter, Space or Escape skips straight to launch
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['Enter', ' ', 'Escape'].includes(e.key) && !launchedRef.current) {
        e.preventDefault();
        handleLaunch();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleLaunch]);

  if (status === 'closed') {
    return null;
  }

  return (
    <div
      ref={overlayRef}
      className={`rocket-opening-overlay ${status === 'clearing' ? 'is-clearing' : ''}`}
      role="region"
      aria-label="Gerbang Pembuka Interstellar"
      onClick={handleLaunch}
      onTouchStart={handleLaunch}
    >
      {/* 1. Deep-space backdrop, masked by the expanding singularity portal */}
      <div ref={backdropRef} className="opening-backdrop" aria-hidden="true"></div>

      {/* 2. Living Starfield (drift -> hyperspace warp) */}
      <canvas ref={starCanvasRef} className="opening-starfield" aria-hidden="true"></canvas>

      {/* 3. Launch shockwave & flash */}
      <div className="opening-shockwave" aria-hidden="true"></div>
      <div className="opening-flash" aria-hidden="true"></div>

      {/* 4. Cinematic Interstellar Editorial HUD */}
      <div
        ref={promptCardRef}
        className={`opening-cinematic-hud ${status !== 'idle' ? 'is-launching' : ''}`}
      >
        <div className="hud-phase-chip">
          <span className="phase-beacon-dot"></span>
          <span className="phase-text phase-text-desktop">ENDURANCE EXPEDITION // GARGANTUA SINGULARITY LOCK</span>
          <span className="phase-text phase-text-mobile">ENDURANCE // SINGULARITY LOCK</span>
        </div>

        <div className="hud-headline-wrap">
          <h1 className="hud-cinematic-title is-split" aria-label={TITLE}>
            {TITLE.split(' ').map((word, w, words) => {
              const offset = words.slice(0, w).join(' ').length + (w ? 1 : 0);
              return (
                <React.Fragment key={word}>
                  {w > 0 && ' '}
                  <span className="title-word" aria-hidden="true">
                    {word.split('').map((char, i) => (
                      <span key={i} className="title-char" style={{ animationDelay: `${120 + (offset + i) * 45}ms` }}>
                        {char}
                      </span>
                    ))}
                  </span>
                </React.Fragment>
              );
            })}
          </h1>
          <p className="hud-cinematic-whisper">
            "Do not go gentle into that good night." - Membuka gerbang singularitas gravitasi...
          </p>
        </div>

        <button
          type="button"
          id="prompt-launch-cta"
          className="hud-launch-pill"
          onClick={handleLaunch}
          tabIndex={0}
          aria-label="Buka gerbang singularitas sekarang"
        >
          <span className="pill-bracket">[</span>
          <span className="pill-pulse-dot"></span>
          <span className="pill-label">ENGAGE WORMHOLE APERTURE</span>
          <span className="pill-arrow">↗</span>
          <span className="pill-bracket">]</span>
        </button>
      </div>

      {/* 5. Zooming stage: anamorphic flare + Gargantua Eclipse & Endurance 12-Module Astrolabe Emblem */}
      <div ref={stageRef} className="opening-stage">
        <div ref={flareRef} className="anamorphic-flare-streak" aria-hidden="true"></div>
        <div
          ref={rocketWrapperRef}
          className={`rocket-vehicle-wrapper endurance-aperture-emblem ${status === 'igniting' ? 'is-igniting' : ''} ${status === 'flying' ? 'is-flying' : ''} ${isHovered ? 'is-hovered' : ''}`}
          role="button"
          tabIndex={0}
          aria-label="Cincin Wahana Endurance & Gerhana Gargantua"
          onClick={handleLaunch}
          onMouseEnter={() => {
            setIsHovered(true);
            audioEngine.playRocketHover();
          }}
          onMouseLeave={() => setIsHovered(false)}
        >
          <div id="rocket-target-ring" className="rocket-ethereal-halo" aria-hidden="true">
            <span className="halo-pulse-ring ring-1"></span>
            <span className="halo-pulse-ring ring-2"></span>
          </div>

          <svg className="rocket-starship-svg endurance-emblem-svg" viewBox="0 0 200 200" width="168" height="168" aria-hidden="true">
            <defs>
              <radialGradient id="gargantuaCoronaGrad" cx="50%" cy="50%" r="50%">
                <stop offset="48%" stopColor="#030508" stopOpacity="1" />
                <stop offset="54%" stopColor="#FFF8E7" stopOpacity="1" />
                <stop offset="64%" stopColor="#D4A373" stopOpacity="0.75" />
                <stop offset="82%" stopColor="#C06C54" stopOpacity="0.22" />
                <stop offset="100%" stopColor="#000000" stopOpacity="0" />
              </radialGradient>
            </defs>

            {/* Outer Astrolabe Telemetry Dial */}
            <g className="astrolabe-outer-ring">
              <circle cx="100" cy="100" r="88" stroke="rgba(212, 163, 115, 0.32)" strokeWidth="1" strokeDasharray="3 6" fill="none" />
              <circle cx="100" cy="100" r="78" stroke="rgba(245, 242, 235, 0.22)" strokeWidth="1.2" strokeDasharray="18 8 4 8" fill="none" />
            </g>

            {/* Countdown progress arc, fills until auto-launch */}
            <circle
              className="countdown-progress-arc"
              cx="100"
              cy="100"
              r="97"
              pathLength="100"
              stroke="#FFF8E7"
              strokeWidth="1.4"
              fill="none"
              style={{ animationDuration: `${LAUNCH_AT}ms` }}
            />

            {/* Gargantua Accretion Glow & Event Horizon Core */}
            <circle cx="100" cy="100" r="72" fill="url(#gargantuaCoronaGrad)" />
            <ellipse cx="100" cy="100" rx="86" ry="14" stroke="#FFF3D1" strokeWidth="1.6" fill="none" opacity="0.75" />
            <ellipse cx="100" cy="100" rx="94" ry="22" stroke="#D4A373" strokeWidth="1" strokeDasharray="8 4" fill="none" opacity="0.45" />
            <circle cx="100" cy="100" r="36" fill="#04060A" stroke="#FFF8E7" strokeWidth="1.8" />

            {/* Endurance 12-Module Ring Craft Silhouette */}
            <g className="endurance-12-ring">
              <circle cx="100" cy="100" r="56" stroke="rgba(212, 163, 115, 0.55)" strokeWidth="2" fill="none" />
              <circle cx="100" cy="100" r="56" stroke="#F5F2EB" strokeWidth="5.5" strokeDasharray="7 22.3" strokeLinecap="round" fill="none" />
            </g>

            {/* Central Singularity Lock Reticle */}
            {countdown === null && <circle id="engine-nozzle-rim" cx="100" cy="100" r="4" fill="#FFF8E7" />}
          </svg>

          {countdown !== null && (
            <span key={countdown} className="emblem-countdown-digit" aria-hidden="true">
              {countdown}
            </span>
          )}
        </div>
      </div>

      {/* 6. Boot telemetry log */}
      <div className={`opening-boot-log ${status !== 'idle' ? 'is-launching' : ''}`} aria-live="polite">
        {BOOT_LINES.slice(0, bootStep).map((line) => (
          <div key={line.label} className="boot-line">
            <span className="boot-label">{line.label}</span>
            <span className="boot-dots" aria-hidden="true"></span>
            <span className="boot-value">{line.value}</span>
          </div>
        ))}
        <div className="boot-skip-hint">
          {countdown !== null ? `T-${countdown} // ` : ''}KLIK ATAU TEKAN ENTER UNTUK SKIP
        </div>
      </div>
    </div>
  );
}
