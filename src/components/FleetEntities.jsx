import React, { useEffect, useRef } from 'react';
import { audioEngine } from '../utils/audio';

export default function FleetEntities() {
  const containerRef = useRef(null);

  useEffect(() => {
    // Autonomous dogfight loop
    const dogfightPairs = [
      { rId: 'rocket-1', aId: 'alien-1', color: 'laser-cyan' },
      { rId: 'rocket-2', aId: 'alien-2', color: 'laser-amber' },
      { rId: 'rocket-3', aId: 'alien-3', color: 'laser-cyan' },
    ];

    let pairIdx = 0;
    const interval = setInterval(() => {
      const pair = dogfightPairs[pairIdx];
      pairIdx = (pairIdx + 1) % dogfightPairs.length;

      const rEl = document.getElementById(pair.rId);
      const aEl = document.getElementById(pair.aId);
      if (rEl && aEl) {
        fireLaser(rEl, aEl, pair.color);
      }
    }, 2400);

    return () => clearInterval(interval);
  }, []);

  const fireLaser = (rEl, aEl, colorClass = 'laser-cyan') => {
    if (!rEl || !aEl || aEl.classList.contains('alien-destroyed')) return;

    const rRect = rEl.getBoundingClientRect();
    const aRect = aEl.getBoundingClientRect();

    const rOnScreen =
      rRect.bottom > 0 &&
      rRect.top < window.innerHeight &&
      rRect.right > 0 &&
      rRect.left < window.innerWidth;
    const aOnScreen =
      aRect.bottom > 0 &&
      aRect.top < window.innerHeight &&
      aRect.right > 0 &&
      aRect.left < window.innerWidth;

    if (!rOnScreen || !aOnScreen) return;

    const startX = rRect.left + rRect.width / 2;
    const startY = rRect.top + rRect.height / 2;
    const endX = aRect.left + aRect.width / 2;
    const endY = aRect.top + aRect.height / 2;

    const dx = endX - startX;
    const dy = endY - startY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const angleRad = Math.atan2(dy, dx);
    const angleDeg = angleRad * (180 / Math.PI);

    const bolt = document.createElement('div');
    bolt.className = `laser-bolt ${colorClass}`;
    bolt.style.left = `${startX}px`;
    bolt.style.top = `${startY}px`;
    bolt.style.width = `${Math.min(distance, 110)}px`;
    bolt.style.transform = `rotate(${angleDeg}deg)`;

    document.body.appendChild(bolt);
    audioEngine.playLaserSound();

    const anim = bolt.animate(
      [
        { transform: `rotate(${angleDeg}deg) translateX(0) scaleX(0.4)`, opacity: 1 },
        { transform: `rotate(${angleDeg}deg) translateX(${distance * 0.7}px) scaleX(1.4)`, opacity: 1 },
        { transform: `rotate(${angleDeg}deg) translateX(${distance}px) scaleX(0.2)`, opacity: 0 },
      ],
      { duration: 280, easing: 'cubic-bezier(0.2, 0.8, 0.4, 1)' }
    );

    anim.onfinish = () => {
      bolt.remove();
      if (!aEl.classList.contains('alien-destroyed')) {
        const spark = document.createElement('div');
        spark.className = 'impact-spark';
        spark.style.left = `${endX}px`;
        spark.style.top = `${endY}px`;
        document.body.appendChild(spark);
        setTimeout(() => spark.remove(), 360);

        aEl.style.filter = 'brightness(2.2)';
        setTimeout(() => {
          aEl.style.filter = '';
        }, 120);
      }
    };
  };

  const handleRocketClick = (e, rocketId) => {
    e.stopPropagation();
    const el = document.getElementById(rocketId);
    if (!el) return;

    audioEngine.playWarpSound();
    ['alien-1', 'alien-2', 'alien-3'].forEach((aId, idx) => {
      setTimeout(() => {
        const aEl = document.getElementById(aId);
        if (aEl && !aEl.classList.contains('alien-destroyed')) {
          fireLaser(el, aEl, 'laser-cyan');
        }
      }, idx * 120);
    });
  };

  const handleAlienClick = (e, alienId) => {
    e.stopPropagation();
    const aEl = document.getElementById(alienId);
    if (!aEl || aEl.classList.contains('alien-destroyed')) return;

    audioEngine.playExplosionSound();

    const rect = aEl.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;

    // Create explosion FX
    const wrapper = document.createElement('div');
    wrapper.className = 'alien-explosion-wrapper';
    wrapper.style.left = `${x}px`;
    wrapper.style.top = `${y}px`;

    const shockwave = document.createElement('div');
    shockwave.className = 'explosion-shockwave';
    wrapper.appendChild(shockwave);

    const flash = document.createElement('div');
    flash.className = 'explosion-flash';
    wrapper.appendChild(flash);

    for (let i = 0; i < 18; i++) {
      const p = document.createElement('div');
      p.className = 'explosion-particle';
      const angle = (i / 18) * Math.PI * 2 + (Math.random() * 0.4 - 0.2);
      const dist = 45 + Math.random() * 85;
      const tx = Math.cos(angle) * dist;
      const ty = Math.sin(angle) * dist;
      p.style.setProperty('--p-tx', `${tx}px`);
      p.style.setProperty('--p-ty', `${ty}px`);
      p.style.background = i % 2 === 0 ? '#4db2ff' : '#D4A373';
      p.style.boxShadow = `0 0 10px ${i % 2 === 0 ? '#4db2ff' : '#D4A373'}`;
      wrapper.appendChild(p);
    }

    document.body.appendChild(wrapper);
    setTimeout(() => wrapper.remove(), 850);

    aEl.classList.add('alien-destroyed');

    setTimeout(() => {
      aEl.classList.remove('alien-destroyed');
      aEl.classList.add('alien-respawning');
      setTimeout(() => {
        aEl.classList.remove('alien-respawning');
      }, 800);
    }, 3000);
  };

  return (
    <>
      <div id="dogfight-combat-layer" className="dogfight-combat-layer" aria-hidden="true"></div>
      <div id="cosmic-fleet-layer" className="cosmic-fleet-layer" ref={containerRef}>
        {/* Rocket 1: Endurance Scout */}
        <div
          id="rocket-1"
          className="draggable-entity rocket-entity flight-dogfight-rocket1"
          role="button"
          tabIndex={0}
          onClick={(e) => handleRocketClick(e, 'rocket-1')}
          aria-label="Endurance Scout Rocket. Click to fire twin laser cannons."
          title="Endurance Scout: Click to fire twin laser cannons"
        >
          <div className="rocket-body">
            <div className="rocket-cockpit"></div>
            <div className="rocket-wing left-wing"></div>
            <div className="rocket-wing right-wing"></div>
            <div className="rocket-thruster">
              <div className="thruster-flame"></div>
            </div>
          </div>
          <div className="entity-tag">ENDURANCE-01</div>
        </div>

        {/* Rocket 2: Ranger Interceptor */}
        <div
          id="rocket-2"
          className="draggable-entity rocket-entity flight-dogfight-rocket2"
          role="button"
          tabIndex={0}
          onClick={(e) => handleRocketClick(e, 'rocket-2')}
          aria-label="Ranger Interceptor Rocket. Click to fire laser volley."
          title="Ranger Interceptor: Click to fire laser volley"
        >
          <div className="rocket-body variant-ranger">
            <div className="rocket-cockpit cockpit-amber"></div>
            <div className="rocket-wing left-wing delta-wing"></div>
            <div className="rocket-wing right-wing delta-wing"></div>
            <div className="rocket-thruster">
              <div className="thruster-flame flame-cyan"></div>
            </div>
          </div>
          <div className="entity-tag">RANGER-02</div>
        </div>

        {/* Rocket 3: Lander Module */}
        <div
          id="rocket-3"
          className="draggable-entity rocket-entity flight-dogfight-rocket3"
          role="button"
          tabIndex={0}
          onClick={(e) => handleRocketClick(e, 'rocket-3')}
          aria-label="Lander Heavy Module. Click to unleash heavy plasma barrage."
          title="Lander Heavy: Click to unleash heavy plasma barrage"
        >
          <div className="rocket-body variant-lander">
            <div className="rocket-cockpit"></div>
            <div className="rocket-wing left-wing heavy-wing"></div>
            <div className="rocket-wing right-wing heavy-wing"></div>
            <div className="rocket-thruster">
              <div className="thruster-flame flame-dual"></div>
            </div>
          </div>
          <div className="entity-tag">LANDER-03</div>
        </div>

        {/* Alien 1: 5D Tesseract */}
        <div
          id="alien-1"
          className="draggable-entity alien-entity flight-dogfight-alien1"
          role="button"
          tabIndex={0}
          onClick={(e) => handleAlienClick(e, 'alien-1')}
          aria-label="Tesseract 5D Alien Probe. Click to trigger 5D core detonation shockwave."
          title="5D Tesseract: Click to explode"
        >
          <div className="alien-biosphere">
            <div className="alien-core"></div>
            <div className="alien-eye"></div>
            <div className="alien-tendril t1"></div>
            <div className="alien-tendril t2"></div>
            <div className="alien-tendril t3"></div>
          </div>
          <div className="entity-tag">5D TESSERACT</div>
        </div>

        {/* Alien 2: Chrono Bio-Probe */}
        <div
          id="alien-2"
          className="draggable-entity alien-entity flight-dogfight-rocket1-low"
          role="button"
          tabIndex={0}
          onClick={(e) => handleAlienClick(e, 'alien-2')}
          aria-label="Chrono Bio-Entity. Click to disintegrate alien biosystem."
          title="Chrono Entity: Click to explode"
        >
          <div className="alien-biosphere variant-chrono">
            <div className="alien-core core-amber"></div>
            <div className="alien-eye eye-glow"></div>
            <div className="alien-tendril t1"></div>
            <div className="alien-tendril t2"></div>
            <div className="alien-tendril t3"></div>
          </div>
          <div className="entity-tag">CHRONO-PROBE</div>
        </div>

        {/* Alien 3: Void Resonator */}
        <div
          id="alien-3"
          className="draggable-entity alien-entity flight-dogfight-alien3"
          role="button"
          tabIndex={0}
          onClick={(e) => handleAlienClick(e, 'alien-3')}
          aria-label="Void Resonator Entity. Click to collapse void core."
          title="Void Resonator: Click to explode"
        >
          <div className="alien-biosphere variant-void">
            <div className="alien-core core-cyan"></div>
            <div className="alien-eye"></div>
            <div className="alien-tendril t1"></div>
            <div className="alien-tendril t2"></div>
            <div className="alien-tendril t3"></div>
          </div>
          <div className="entity-tag">VOID-ORB</div>
        </div>
      </div>
    </>
  );
}
