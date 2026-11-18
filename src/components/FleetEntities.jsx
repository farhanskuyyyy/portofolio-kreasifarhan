import React, { useCallback, useEffect, useRef, useState } from 'react';
import { audioEngine } from '../utils/audio';
import {
  BASE_UFO_COUNT,
  KILLS_PER_REINFORCEMENT,
  MAX_UFO_COUNT,
  UFO_FLEET,
  generateUfoName,
} from '../utils/ufoFleet';

const RESPAWN_MS = 3000;
const BEST_KEY = 'ufoHuntBest';

// Typing hunt runs on desktop-class input only (physical keyboard + fine pointer)
const isTypingDevice = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(pointer: fine)').matches && window.innerWidth >= 1024;

const createInitialNames = () => {
  const names = {};
  UFO_FLEET.forEach((u) => {
    names[u.id] = generateUfoName(new Set(Object.values(names).map((n) => n[0])));
  });
  return names;
};

const readBest = () => {
  try {
    return parseInt(window.localStorage.getItem(BEST_KEY) || '0', 10) || 0;
  } catch (e) {
    return 0;
  }
};

export default function FleetEntities() {
  const containerRef = useRef(null);
  const [names, setNames] = useState(createInitialNames);
  const [lock, setLock] = useState(null); // { id, progress }
  const [errorId, setErrorId] = useState(null);
  const [stats, setStats] = useState({ kills: 0, combo: 0, hits: 0, misses: 0, best: readBest() });
  const [typingEnabled, setTypingEnabled] = useState(isTypingDevice);

  const namesRef = useRef(names);
  namesRef.current = names;
  const lockRef = useRef(lock);
  lockRef.current = lock;
  const destroyedRef = useRef(new Set());

  const activeCount = typingEnabled
    ? Math.min(MAX_UFO_COUNT, BASE_UFO_COUNT + Math.floor(stats.kills / KILLS_PER_REINFORCEMENT))
    : BASE_UFO_COUNT;
  const activeCountRef = useRef(activeCount);
  activeCountRef.current = activeCount;

  useEffect(() => {
    const handleResize = () => setTypingEnabled(isTypingDevice());
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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

  const isOnScreen = (rect) =>
    rect.bottom > 0 && rect.top < window.innerHeight && rect.right > 0 && rect.left < window.innerWidth;

  // Fires a bolt from a screen point at an alien element
  const fireBolt = (startX, startY, aEl, colorClass = 'laser-cyan', maxLength = 110) => {
    const aRect = aEl.getBoundingClientRect();
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
    bolt.style.width = `${Math.min(distance, maxLength)}px`;
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

  const fireLaser = (rEl, aEl, colorClass = 'laser-cyan') => {
    if (!rEl || !aEl || aEl.classList.contains('alien-destroyed')) return;

    const rRect = rEl.getBoundingClientRect();
    const aRect = aEl.getBoundingClientRect();
    if (!isOnScreen(rRect) || !isOnScreen(aRect)) return;

    fireBolt(rRect.left + rRect.width / 2, rRect.top + rRect.height / 2, aEl, colorClass);
  };

  const handleRocketClick = (e, rocketId) => {
    e.stopPropagation();
    const el = document.getElementById(rocketId);
    if (!el) return;

    audioEngine.playWarpSound();
    UFO_FLEET.slice(0, activeCountRef.current).forEach(({ id: aId }, idx) => {
      setTimeout(() => {
        const aEl = document.getElementById(aId);
        if (aEl && !aEl.classList.contains('alien-destroyed')) {
          fireLaser(el, aEl, 'laser-cyan');
        }
      }, idx * 120);
    });
  };

  const explodeAlien = useCallback((alienId) => {
    const aEl = document.getElementById(alienId);
    if (!aEl || destroyedRef.current.has(alienId)) return;
    destroyedRef.current.add(alienId);

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
    if (lockRef.current?.id === alienId) setLock(null);

    // Respawn as a fresh saucer with a new random name
    setTimeout(() => {
      setNames((prev) => {
        const taken = new Set(Object.entries(prev).filter(([id]) => id !== alienId).map(([, n]) => n[0]));
        return { ...prev, [alienId]: generateUfoName(taken) };
      });
      destroyedRef.current.delete(alienId);
      aEl.classList.remove('alien-destroyed');
      aEl.classList.add('alien-respawning');
      setTimeout(() => {
        aEl.classList.remove('alien-respawning');
      }, 800);
    }, RESPAWN_MS);
  }, []);

  const handleAlienClick = (e, alienId) => {
    e.stopPropagation();
    explodeAlien(alienId);
  };

  // Reinforcements warp in as the kill count climbs
  const prevActiveRef = useRef(activeCount);
  useEffect(() => {
    if (activeCount > prevActiveRef.current) {
      UFO_FLEET.slice(prevActiveRef.current, activeCount).forEach(({ id }) => {
        const el = document.getElementById(id);
        if (!el) return;
        el.classList.add('alien-respawning');
        setTimeout(() => el.classList.remove('alien-respawning'), 800);
      });
      audioEngine.playAlienChime();
    }
    prevActiveRef.current = activeCount;
  }, [activeCount]);

  // Typing hunt: type a saucer's name to lock on and shoot it down
  useEffect(() => {
    if (!typingEnabled) return undefined;

    const isTargetable = (id) => {
      if (destroyedRef.current.has(id)) return false;
      const el = document.getElementById(id);
      if (!el || el.style.opacity === '0') return false;
      return isOnScreen(el.getBoundingClientRect());
    };

    const shootAt = (id) => {
      const el = document.getElementById(id);
      if (el) fireBolt(window.innerWidth / 2, window.innerHeight - 8, el, 'laser-amber', 160);
    };

    const flashError = (id) => {
      audioEngine.playUiClick(180, 'square', 0.05);
      setErrorId(id);
      setTimeout(() => setErrorId((cur) => (cur === id ? null : cur)), 260);
      setStats((s) => ({ ...s, combo: 0, misses: s.misses + 1 }));
    };

    const handleKeyDown = (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.target?.closest?.('input, textarea, select, [contenteditable="true"]')) return;
      if (document.querySelector('dialog[open], .rocket-opening-overlay')) return;

      const current = lockRef.current;
      if ((e.key === 'Escape' || e.key === 'Backspace') && current) {
        e.preventDefault();
        setLock(null);
        return;
      }

      const key = e.key.toLowerCase();
      if (!/^[a-z]$/.test(key)) return;

      if (current && !isTargetable(current.id)) {
        setLock(null);
        return;
      }

      if (!current) {
        const target = UFO_FLEET.slice(0, activeCountRef.current).find(
          ({ id }) => namesRef.current[id]?.[0] === key && isTargetable(id)
        );
        if (!target) {
          audioEngine.playUiClick(180, 'square', 0.04);
          setStats((s) => ({ ...s, combo: 0, misses: s.misses + 1 }));
          return;
        }
        setLock({ id: target.id, progress: 1 });
        setStats((s) => ({ ...s, hits: s.hits + 1 }));
        shootAt(target.id);
        return;
      }

      const name = namesRef.current[current.id];
      if (name[current.progress] !== key) {
        flashError(current.id);
        return;
      }

      const progress = current.progress + 1;
      shootAt(current.id);
      if (progress >= name.length) {
        setLock(null);
        setStats((s) => {
          const kills = s.kills + 1;
          const best = Math.max(s.best, kills);
          if (best > s.best) {
            try {
              window.localStorage.setItem(BEST_KEY, String(best));
            } catch (err) {
              // storage unavailable (private mode); best score just won't persist
            }
          }
          return { ...s, kills, best, combo: s.combo + 1, hits: s.hits + 1 };
        });
        // Let the final bolt land before the saucer blows
        setTimeout(() => explodeAlien(current.id), 170);
      } else {
        setLock({ id: current.id, progress });
        setStats((s) => ({ ...s, hits: s.hits + 1 }));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [typingEnabled, explodeAlien]);

  const accuracy = stats.hits + stats.misses > 0 ? Math.round((stats.hits / (stats.hits + stats.misses)) * 100) : 100;
  const lockedName = lock ? names[lock.id] : '';

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

        {/* Flying saucer fleet: names are random; on desktop, type a name to shoot that saucer down */}
        {UFO_FLEET.map(({ id, variant }, idx) => {
          const name = names[id];
          const progress = lock?.id === id ? lock.progress : 0;
          return (
            <div
              key={id}
              id={id}
              className={`draggable-entity alien-entity ${idx >= activeCount ? 'ufo-dormant' : ''} ${
                lock?.id === id ? 'is-locked' : ''
              }`}
              role="button"
              tabIndex={idx >= activeCount ? -1 : 0}
              onClick={(e) => handleAlienClick(e, id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAlienClick(e, id);
              }}
              aria-label={`Flying saucer ${name}. Click${typingEnabled ? ' or type its name' : ''} to shoot it down.`}
              title={`${name}: click${typingEnabled ? ' or type the name' : ''} to explode`}
            >
              <div className={`alien-biosphere ufo-saucer ${variant}`} aria-hidden="true">
                <div className="ufo-beam"></div>
                <div className="ufo-dome">
                  <span className="ufo-pilot"></span>
                </div>
                <div className="ufo-hull">
                  <span className="ufo-light"></span>
                  <span className="ufo-light"></span>
                  <span className="ufo-light"></span>
                  <span className="ufo-light"></span>
                  <span className="ufo-light"></span>
                </div>
              </div>
              <div className={`entity-tag ufo-name-tag ${errorId === id ? 'is-error' : ''}`} aria-hidden="true">
                <span className="ufo-name-typed">{name.slice(0, progress)}</span>
                {name.slice(progress)}
              </div>
            </div>
          );
        })}
      </div>

      {typingEnabled && (
        <aside className="ufo-hunt-hud" aria-label="UFO typing hunt">
          <div className="uh-title">
            <span className="uh-pip" aria-hidden="true"></span>
            UFO HUNT // TYPE A SAUCER&apos;S NAME
          </div>
          <div className="uh-buffer" aria-live="polite">
            <span className="uh-prompt">&gt;</span>
            {lock ? (
              <>
                <span className="uh-typed">{lockedName.slice(0, lock.progress)}</span>
                <span className="uh-rest">{lockedName.slice(lock.progress)}</span>
              </>
            ) : (
              <span className="uh-idle">awaiting target…</span>
            )}
          </div>
          <div className="uh-stats">
            <span>
              KILLS <strong>{stats.kills}</strong>
            </span>
            <span>
              COMBO <strong>x{stats.combo}</strong>
            </span>
            <span>
              ACC <strong>{accuracy}%</strong>
            </span>
            <span>
              BEST <strong>{stats.best}</strong>
            </span>
            <span>
              FLEET <strong>{activeCount}/{MAX_UFO_COUNT}</strong>
            </span>
          </div>
        </aside>
      )}
    </>
  );
}
