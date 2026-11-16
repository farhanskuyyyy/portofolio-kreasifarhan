import React, { useState, useEffect, useRef, useCallback } from 'react';
import { audioEngine } from '../utils/audio';

export default function CosmicRocketOpening({ onComplete }) {
  const [status, setStatus] = useState('idle'); // 'idle' | 'igniting' | 'flying' | 'clearing' | 'closed'
  const [isHovered, setIsHovered] = useState(false);

  const overlayRef = useRef(null);
  const promptCardRef = useRef(null);
  const rocketWrapperRef = useRef(null);
  const pathTLRef = useRef(null);
  const pathBRRef = useRef(null);
  const trackRef = useRef(null);
  const flareRef = useRef(null);
  const animFrameRef = useRef(null);

  const renderApertureFrame = useCallback((p) => {
    // p goes from 0.0 (closed horizon) to 1.0 (fully parted gravitational lens)
    const easeP = 1 - Math.pow(1 - p, 3);
    const edgeY = 500 * (1 - Math.pow(p, 1.6));
    const controlY_TL = 500 - easeP * 760;
    const controlY_BR = 500 + easeP * 760;

    if (pathTLRef.current) {
      pathTLRef.current.setAttribute(
        'd',
        `M 0,0 L 1000,0 L 1000,${edgeY.toFixed(1)} Q 500,${controlY_TL.toFixed(1)} 0,${edgeY.toFixed(1)} Z`
      );
    }

    if (pathBRRef.current) {
      const brEdgeY = 1000 - edgeY;
      pathBRRef.current.setAttribute(
        'd',
        `M 0,1000 L 1000,1000 L 1000,${brEdgeY.toFixed(1)} Q 500,${controlY_BR.toFixed(1)} 0,${brEdgeY.toFixed(1)} Z`
      );
    }

    if (trackRef.current) {
      if (p < 0.85) {
        trackRef.current.style.display = 'block';
        trackRef.current.style.opacity = String(1 - p * 1.15);
        trackRef.current.setAttribute('d', `M 0,500 Q 500,${(500 - easeP * 180).toFixed(1)} 1000,500`);
      } else {
        trackRef.current.style.display = 'none';
      }
    }
  }, []);

  // Launch handler: starts audio, anamorphic flare expansion, then smooth aperture opening
  const handleLaunch = useCallback(() => {
    if (status !== 'idle') return;

    setStatus('igniting');
    audioEngine.playRocketIgnitionLaunch();

    if (promptCardRef.current) promptCardRef.current.classList.add('is-launching');
    if (rocketWrapperRef.current) rocketWrapperRef.current.classList.add('is-igniting');
    if (flareRef.current) flareRef.current.classList.add('is-expanding');

    setTimeout(() => {
      setStatus('flying');
      if (rocketWrapperRef.current) {
        rocketWrapperRef.current.classList.remove('is-igniting');
        rocketWrapperRef.current.classList.add('is-flying');
      }

      const startTime = performance.now();
      const DURATION = 1650; // ms

      const step = (now) => {
        const elapsed = now - startTime;
        const rawT = Math.min(elapsed / DURATION, 1.0);
        renderApertureFrame(rawT);

        if (rawT < 1.0) {
          animFrameRef.current = requestAnimationFrame(step);
        } else {
          setStatus('clearing');
          if (overlayRef.current) overlayRef.current.classList.add('is-clearing');
          setTimeout(() => {
            setStatus('closed');
            if (onComplete) onComplete();
          }, 420);
        }
      };

      animFrameRef.current = requestAnimationFrame(step);
    }, 240);
  }, [status, renderApertureFrame, onComplete]);

  // Graceful 1.15s pause so user appreciates the Gargantua Eclipse before auto-opening
  useEffect(() => {
    const timer = setTimeout(() => {
      handleLaunch();
    }, 1150);
    return () => clearTimeout(timer);
  }, [handleLaunch]);

  // Initial frame render
  useEffect(() => {
    renderApertureFrame(0);
  }, [renderApertureFrame]);

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

  return (
    <div
      ref={overlayRef}
      className={`rocket-opening-overlay ${status === 'clearing' ? 'is-clearing' : ''}`}
      role="region"
      aria-label="Gerbang Pembuka Interstellar"
      onClick={handleLaunch}
      onTouchStart={handleLaunch}
    >
      {/* 1. Dynamic SVG Gravitational Horizon Aperture */}
      <svg
        className="curtain-svg"
        viewBox="0 0 1000 1000"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <defs>
          <radialGradient id="nebulaGradTL" cx="50%" cy="100%" r="85%">
            <stop offset="0%" stopColor="#16120e" />
            <stop offset="45%" stopColor="#0b0d13" />
            <stop offset="100%" stopColor="#040508" />
          </radialGradient>
          <radialGradient id="nebulaGradBR" cx="50%" cy="0%" r="85%">
            <stop offset="0%" stopColor="#16120e" />
            <stop offset="45%" stopColor="#0b0d13" />
            <stop offset="100%" stopColor="#040508" />
          </radialGradient>
          <linearGradient id="seamGlowGrad" x1="0%" y1="50%" x2="100%" y2="50%">
            <stop offset="0%" stopColor="#D4A373" stopOpacity="0.0" />
            <stop offset="20%" stopColor="#D4A373" stopOpacity="0.65" />
            <stop offset="50%" stopColor="#FFF8E7" stopOpacity="1.0" />
            <stop offset="80%" stopColor="#D4A373" stopOpacity="0.65" />
            <stop offset="100%" stopColor="#D4A373" stopOpacity="0.0" />
          </linearGradient>
          <filter id="curtainShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="0" stdDeviation="18" floodColor="#D4A373" floodOpacity="0.35" />
          </filter>
        </defs>

        {/* Upper & Lower Gravitational Horizon Curtains */}
        <path
          ref={pathTLRef}
          className="curtain-polygon curtain-tl"
          d="M 0,0 L 1000,0 L 1000,500 Q 500,500 0,500 Z"
          fill="url(#nebulaGradTL)"
          filter="url(#curtainShadow)"
        />
        <path
          ref={pathBRRef}
          className="curtain-polygon curtain-br"
          d="M 0,1000 L 1000,1000 L 1000,500 Q 500,500 0,500 Z"
          fill="url(#nebulaGradBR)"
          filter="url(#curtainShadow)"
        />

        {/* Relativistic Event Horizon Light Seam */}
        <path
          ref={trackRef}
          d="M 0,500 Q 500,500 1000,500"
          fill="none"
          stroke="url(#seamGlowGrad)"
          strokeWidth="2.2"
          className="zipper-seam-track"
        />
      </svg>

      {/* 2. Anamorphic IMAX Optical Lens Flare Streak */}
      <div ref={flareRef} className="anamorphic-flare-streak" aria-hidden="true"></div>

      {/* 3. Cinematic Interstellar Editorial HUD */}
      <div
        ref={promptCardRef}
        className={`opening-cinematic-hud ${status !== 'idle' ? 'is-launching' : ''}`}
        aria-live="polite"
      >
        <div className="hud-phase-chip">
          <span className="phase-beacon-dot"></span>
          <span className="phase-text phase-text-desktop">ENDURANCE EXPEDITION // GARGANTUA SINGULARITY LOCK</span>
          <span className="phase-text phase-text-mobile">ENDURANCE // SINGULARITY LOCK</span>
        </div>

        <div className="hud-headline-wrap">
          <h1 className="hud-cinematic-title">BEYOND THE HORIZON</h1>
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

      {/* 4. Central Gargantua Eclipse & Endurance 12-Module Astrolabe Emblem */}
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
          <circle id="engine-nozzle-rim" cx="100" cy="100" r="4" fill="#FFF8E7" />
        </svg>
      </div>
    </div>
  );
}
