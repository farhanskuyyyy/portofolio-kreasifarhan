import React, { useState } from 'react';
import { audioEngine } from '../utils/audio';

export const TECH_STARS = [
  {
    id: 'golang',
    name: 'GOLANG',
    mastery: 96,
    scale: 1.35,
    role: 'CORE CONCURRENCY & GRPC',
    title: 'Golang (Go) : 96% Dominance · High Concurrency, Distributed Microservices, gRPC',
    color: '#00ADD8',
    rgb: '0, 173, 216',
    freq: 528,
    orbitRadius: 9.0,
    orbitSpeed: 0.0072,
    orbitAngle: 0.5,
    yOffset: 1.2,
    yAmp: 0.9,
    yFreq: 2.0,
    svg: (
      <svg viewBox="0 0 256 95" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Golang Logo">
        <path d="M26.2 36.8h46.4v13.6H26.2V36.8zm-11.6 24h34.8v13.6H14.6V60.8zm17.4 24h23.2v13.6H32V84.8z" fill="#00ADD8"/>
        <path d="M114.7 13.6c-27 0-47.8 20.4-47.8 47.4s20.8 47.4 47.8 47.4c21.8 0 38.6-13.6 44.8-32.8h-44.8v-17h64.8c.8 4.6 1.2 9.6 1.2 15 0 36.4-28.8 65.6-66 65.6-38.6 0-69.8-30.8-69.8-69.2S76.1 1.8 114.7 1.8c20.4 0 37.8 8.6 50.2 22.8L151.6 38c-8.6-10.2-21.4-16.4-36.9-16.4z" fill="#00ADD8"/>
        <path d="M192.4 38.8c-20.4 0-37 16.6-37 37s16.6 37 37 37 37-16.6 37-37-16.6-37-37-37zm0 57.6c-11.4 0-20.6-9.2-20.6-20.6s9.2-20.6 20.6-20.6 20.6 9.2 20.6 20.6-9.2 20.6-20.6 20.6z" fill="#00ADD8"/>
      </svg>
    ),
  },
  {
    id: 'redis',
    name: 'REDIS',
    mastery: 94,
    scale: 1.25,
    role: 'CACHE & QUEUE PIPELINES',
    title: 'Redis : 94% Dominance · In-Memory Store, Pub/Sub, Distributed Locks, Streams',
    color: '#DC382D',
    rgb: '220, 56, 45',
    freq: 940,
    orbitRadius: 13.2,
    orbitSpeed: 0.0056,
    orbitAngle: 1.9,
    yOffset: -1.0,
    yAmp: 1.1,
    yFreq: 1.6,
    svg: (
      <svg viewBox="0 0 256 217" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Redis Logo">
        <path d="M0 64.8L127.9 0l127.9 64.8-127.9 64.9L0 64.8z" fill="#D82C20"/>
        <path d="M0 64.8v43.2l127.9 64.9V129.7L0 64.8z" fill="#A3241C"/>
        <path d="M255.8 64.8v43.2l-127.9 64.9V129.7l127.9-64.9z" fill="#C0261E"/>
        <path d="M0 108v43.2l127.9 64.9v-43.2L0 108z" fill="#A3241C"/>
        <path d="M255.8 108v43.2l-127.9 64.9v-43.2l127.9-64.9z" fill="#C0261E"/>
        <circle cx="128" cy="65" r="14" fill="#FFFFFF" fillOpacity="0.9"/>
        <path d="M100 55l14 10-14 10M156 55l-14 10 14 10" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    id: 'postgres',
    name: 'POSTGRES',
    mastery: 93,
    scale: 1.20,
    role: 'RELATIONAL ARCHITECTURE',
    title: 'PostgreSQL : 93% Dominance · Multi-tenant Schemas, Query Optimization, Indexing',
    color: '#4169E1',
    rgb: '65, 105, 225',
    freq: 990,
    orbitRadius: 15.6,
    orbitSpeed: 0.0044,
    orbitAngle: 3.2,
    yOffset: 1.6,
    yAmp: 1.3,
    yFreq: 1.7,
    svg: (
      <svg viewBox="0 0 256 250" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="PostgreSQL Logo">
        <path d="M128 0C68.6 0 20.6 42.6 20.6 98.4c0 37.6 22 70.3 54.8 86.8v48.6h28.4v-42.2h15.2v42.2h28.4v-48c41.2-5.4 73-37.6 73-77.4C220.4 42.6 172.4 0 128 0zm-20.6 85.2c-7.6 0-13.8-6.2-13.8-13.8s6.2-13.8 13.8-13.8 13.8 6.2 13.8 13.8-6.2 13.8-13.8 13.8zm69.2 0c-7.6 0-13.8-6.2-13.8-13.8s6.2-13.8 13.8-13.8 13.8 6.2 13.8 13.8-6.2 13.8-13.8 13.8z" fill="#336791"/>
        <path d="M96 156c12 14 26 20 40 20s28-6 40-20" stroke="#FFFFFF" strokeWidth="12" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    id: 'laravel',
    name: 'LARAVEL',
    mastery: 92,
    scale: 1.18,
    role: 'ENTERPRISE APIS & GATEWAYS',
    title: 'Laravel : 92% Dominance · Robust RESTful Services, Middleware, Eloquent ORM',
    color: '#FF2D20',
    rgb: '255, 45, 32',
    freq: 704,
    orbitRadius: 10.6,
    orbitSpeed: 0.0064,
    orbitAngle: 4.6,
    yOffset: -1.5,
    yAmp: 1.0,
    yFreq: 2.2,
    svg: (
      <svg viewBox="0 0 256 264" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Laravel Logo">
        <path d="M127.8 0L2.4 72.4l125.4 72.4 125.7-72.4L127.8 0z" fill="#FF2D20"/>
        <path d="M2.4 72.4v118.8l125.4 72.4V144.8L2.4 72.4z" fill="#E02619"/>
        <path d="M253.5 72.4v118.8l-125.7 72.4V144.8l125.7-72.4z" fill="#FF3D30"/>
        <path d="M127.8 144.8L2.4 72.4l50.8-29.3 74.6 43 74.8-43 50.9 29.3-125.7 72.4z" fill="#FFFFFF" fillOpacity="0.2"/>
      </svg>
    ),
  },
  {
    id: 'docker',
    name: 'DOCKER',
    mastery: 91,
    scale: 1.14,
    role: 'CONTAINERIZATION & CI/CD',
    title: 'Docker : 91% Dominance · Multi-stage Containerization, Compose Orchestration',
    color: '#2496ED',
    rgb: '36, 150, 237',
    freq: 880,
    orbitRadius: 14.2,
    orbitSpeed: 0.0050,
    orbitAngle: 5.7,
    yOffset: 0.9,
    yAmp: 1.2,
    yFreq: 1.5,
    svg: (
      <svg viewBox="0 0 256 188" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Docker Logo">
        <path d="M54 78h22v22H54zm26 0h22v22H80zm26 0h22v22h-22zm26 0h22v22h-22zm-52-26h22v22H80zm26 0h22v22h-22zm26 0h22v22h-22zm26 0h22v22h-22zm-26-26h22v22h-22z" fill="#2496ED"/>
        <path d="M239.8 89.2c-4.4-3.3-13.8-3.8-21-0.6-2.2-15.4-14.4-27-28.8-27h-5.5v38.6H33c-2.8 15.4 2.8 32 15.4 43 14.4 12.6 37.4 18 73.2 18 60.6 0 99.2-30.3 107.5-60.6 1.7-4.4 1.1-8.8-2.7-11.4z" fill="#2496ED"/>
      </svg>
    ),
  },
  {
    id: 'nodejs',
    name: 'NODE.JS',
    mastery: 90,
    scale: 1.10,
    role: 'ASYNC RUNTIMES & APIS',
    title: 'Node.js : 90% Dominance · Event Loop, Express/Nest, Stream Processing',
    color: '#339933',
    rgb: '51, 153, 51',
    freq: 594,
    orbitRadius: 11.8,
    orbitSpeed: 0.0060,
    orbitAngle: 2.4,
    yOffset: -0.7,
    yAmp: 1.0,
    yFreq: 2.0,
    svg: (
      <svg viewBox="0 0 256 289" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Node.js Logo">
        <path d="M128 0L256 73.9V221.7L128 295.6L0 221.7V73.9L128 0Z" fill="#339933"/>
        <path d="M140.2 125.6V64.8L79.4 125.6H140.2Z" fill="#FFFFFF" fillOpacity="0.8"/>
        <path d="M115.8 163.4V224.2L176.6 163.4H115.8Z" fill="#FFFFFF"/>
        <path d="M79.4 125.6L128 174.2L176.6 125.6L128 77L79.4 125.6Z" fill="#FFFFFF" fillOpacity="0.95"/>
      </svg>
    ),
  },
  {
    id: 'grafana',
    name: 'GRAFANA',
    mastery: 90,
    scale: 1.10,
    role: 'METRICS & OBSERVABILITY',
    title: 'Grafana & Prometheus : 90% Dominance · APM Dashboards, SLI/SLO Telemetry Alerts',
    color: '#F46800',
    rgb: '244, 104, 0',
    freq: 1056,
    orbitRadius: 18.8,
    orbitSpeed: 0.0036,
    orbitAngle: 1.0,
    yOffset: 2.1,
    yAmp: 1.4,
    yFreq: 1.3,
    svg: (
      <svg viewBox="0 0 256 256" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Grafana Logo">
        <rect width="256" height="256" rx="48" fill="#1F232B"/>
        <circle cx="128" cy="128" r="92" stroke="#F46800" strokeWidth="16" fill="none"/>
        <path d="M68 140c16-36 48-52 84-44 24 5 44 24 52 48M84 172c18-20 44-28 72-20 18 5 32 18 36 34" stroke="#FF8533" strokeWidth="14" strokeLinecap="round"/>
        <circle cx="152" cy="100" r="16" fill="#F46800"/>
      </svg>
    ),
  },
  {
    id: 'nextjs',
    name: 'NEXT.JS',
    mastery: 88,
    scale: 1.02,
    role: 'REACT SSR & FULLSTACK UI',
    title: 'Next.js : 88% Dominance · App Router, Server Components, Hydration & SSR',
    color: '#E5E7EB',
    rgb: '229, 231, 235',
    freq: 792,
    orbitRadius: 17.0,
    orbitSpeed: 0.0040,
    orbitAngle: 4.0,
    yOffset: -1.9,
    yAmp: 1.2,
    yFreq: 1.8,
    svg: (
      <svg viewBox="0 0 180 180" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Next.js Logo">
        <circle cx="90" cy="90" r="86" fill="#000000" stroke="#FFFFFF" strokeWidth="6"/>
        <path d="M149.5 149.5L78.8 54H60v72h14.4V72.2l62.4 82.2c4.4-1.6 8.7-3.6 12.7-5.9z" fill="#FFFFFF"/>
        <path d="M120 54h14.4v72H120z" fill="#FFFFFF"/>
      </svg>
    ),
  },
  {
    id: 'php',
    name: 'PHP',
    mastery: 86,
    scale: 0.94,
    role: 'ENTERPRISE PLATFORMS',
    title: 'PHP 8.x : 86% Dominance · Modernization, PSR Standards, CLI Workers',
    color: '#777BB4',
    rgb: '119, 123, 180',
    freq: 660,
    orbitRadius: 21.2,
    orbitSpeed: 0.0032,
    orbitAngle: 5.2,
    yOffset: 0.6,
    yAmp: 1.5,
    yFreq: 1.2,
    svg: (
      <svg viewBox="0 0 256 138" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="PHP Logo">
        <ellipse cx="128" cy="69" rx="124" ry="67" fill="#777BB4"/>
        <path d="M68.5 89.2l6.8-33.8h22.6c7.8 0 13.5 1.8 17.1 5.3 3.6 3.5 4.6 8.5 3 14.8-1.7 6.8-5.3 11.8-10.7 15-5.4 3.2-12.7 4.7-21.8 4.7H68.5zm19.8-14.8h6.8c4.3 0 7.4-.7 9.3-2 1.9-1.4 2.9-3.8 3.5-7.3.7-3.4.3-5.7-1.2-6.9-1.5-1.2-4.4-1.8-8.8-1.8h-6.8l-2.8 18zM128 89.2l12.4-61.6h16.2l-5.6 27.8h17.8l5.6-27.8h16.2l-12.4 61.6h-16.2l5.6-27.8h-17.8l-5.6 27.8H128zm68.5 0l6.8-33.8h22.6c7.8 0 13.5 1.8 17.1 5.3 3.6 3.5 4.6 8.5 3 14.8-1.7 6.8-5.3 11.8-10.7 15-5.4 3.2-12.7 4.7-21.8 4.7h-17.2zm19.8-14.8h6.8c4.3 0 7.4-.7 9.3-2 1.9-1.4 2.9-3.8 3.5-7.3.7-3.4.3-5.7-1.2-6.9-1.5-1.2-4.4-1.8-8.8-1.8h-6.8l-2.8 18z" fill="#FFFFFF"/>
      </svg>
    ),
  },
];

export default function CelestialSkillStars() {
  const [starStates, setStarStates] = useState({});

  const handleClick = (tech) => {
    const currentState = starStates[tech.id] || 'idle';
    if (currentState !== 'idle') return;

    // 1. Play cosmic pop explosion sound effect
    audioEngine.playSkillPopExplosion(tech.freq);

    // 2. Mark star as exploding
    setStarStates((prev) => ({ ...prev, [tech.id]: 'exploding' }));

    // Dispatch event to 3D scene
    window.dispatchEvent(
      new CustomEvent('skillStarExplode', { detail: { id: tech.id } })
    );

    // 3. After explosion blast dissipates (550ms), transition to hidden
    setTimeout(() => {
      setStarStates((prev) => ({ ...prev, [tech.id]: 'hidden' }));
    }, 550);

    // 4. Respawn sequence after 2.8s
    setTimeout(() => {
      audioEngine.playSkillRespawn(tech.freq);
      setStarStates((prev) => ({ ...prev, [tech.id]: 'respawning' }));

      window.dispatchEvent(
        new CustomEvent('skillStarRespawn', { detail: { id: tech.id } })
      );

      // Settle back to fully active idle after warp-in (800ms)
      setTimeout(() => {
        setStarStates((prev) => ({ ...prev, [tech.id]: 'idle' }));
      }, 800);
    }, 2800);
  };

  return (
    <div className="celestial-stars-layer" aria-label="Constellation of Skills and Technologies">
      {TECH_STARS.map((tech) => {
        const state = starStates[tech.id] || 'idle';
        const isExploding = state === 'exploding';
        const isHidden = state === 'hidden';
        const isRespawning = state === 'respawning';

        return (
          <div
            key={tech.id}
            id={`star-${tech.id}`}
            className={`celestial-skill-star star-variant-${tech.id} ${
              isExploding ? 'is-exploding' : ''
            } ${isHidden ? 'is-hidden' : ''} ${
              isRespawning ? 'is-respawning' : ''
            }`}
            style={{
              '--star-glow': tech.color,
              '--star-glow-rgb': tech.rgb,
              '--star-mastery-scale': tech.scale,
            }}
            onClick={() => handleClick(tech)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleClick(tech);
              }
            }}
            title={`${tech.title} (Click to Pop & Explode)`}
            role="button"
            tabIndex={0}
          >
            {/* Pop Explosion FX: Shockwave, Radial Sparks Burst & Energy Flare */}
            {isExploding && (
              <div className="pop-explosion-fx" aria-hidden="true">
                <div className="pop-shockwave-ring"></div>
                <div className="pop-flash-core"></div>
                <div className="pop-sparks-burst">
                  {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
                    <span
                      key={deg}
                      className="pop-spark-particle"
                      style={{ '--spark-deg': `${deg}deg` }}
                    ></span>
                  ))}
                </div>
              </div>
            )}

            {/* Respawn Warp FX: Implosion Gather Ring */}
            {isRespawning && (
              <div className="pop-respawn-fx" aria-hidden="true">
                <div className="pop-implosion-ring"></div>
              </div>
            )}

            {/* Distinct Gyro Orbit System & Satellite Probes tailored per tech */}
            <div className="skill-gyro-system" aria-hidden="true">
              <div className="skill-orbit-track track-primary">
                <span className="skill-satellite-bead bead-primary" aria-hidden="true"></span>
                {(tech.id === 'golang' || tech.id === 'redis') && (
                  <span className="skill-satellite-bead bead-secondary" aria-hidden="true"></span>
                )}
              </div>
              <div className="skill-orbit-track track-secondary"></div>
              {tech.id === 'laravel' && (
                <div className="skill-orbit-track track-tertiary"></div>
              )}
              {tech.id === 'grafana' && (
                <div className="radar-sweep-beam" aria-hidden="true"></div>
              )}
            </div>

            {/* Celestial Body with Customized Architectural Geometry */}
            <div className="star-orb-body">
              <div className="star-orb-halo" aria-hidden="true"></div>
              {tech.id === 'docker' ? (
                <div className="star-cube-shell" aria-hidden="true"></div>
              ) : (
                <div className="star-wireframe-shell" aria-hidden="true"></div>
              )}
              <div className="star-orb-icon">{tech.svg}</div>
            </div>

            {/* Floating Pill Tag with Mastery Indicator */}
            <div className="star-meta-pill">
              <span className="star-label-pip">{tech.name}</span>
              <span className="star-mastery-badge">{tech.mastery}%</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
