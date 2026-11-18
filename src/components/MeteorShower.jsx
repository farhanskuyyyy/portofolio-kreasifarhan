import React, { useEffect, useRef } from 'react';

const MAX_METEORS = 16;
const AIMED_CHANCE = 0.2; // share of meteors that home in on a skill planet
const IMPACT_COOLDOWN = 4000; // ms between planet strikes so the skill orbit isn't constantly exploding

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

// Skill planets that can currently be struck: visible, in front of the camera and not mid-explosion
const getTargets = () =>
  [...document.querySelectorAll('.celestial-skill-star')]
    .filter((el) => {
      if (el.classList.contains('is-exploding') || el.classList.contains('is-hidden') || el.classList.contains('is-respawning')) {
        return false;
      }
      return parseFloat(el.style.opacity || '1') > 0.3;
    })
    .map((el) => {
      const body = el.querySelector('.star-orb-body') || el;
      const rect = body.getBoundingClientRect();
      return {
        id: el.id.replace(/^star-/, ''),
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
        r: Math.max(rect.width, rect.height) * 0.45,
      };
    })
    .filter((t) => t.r > 4 && t.x > 0 && t.y > 0 && t.x < window.innerWidth && t.y < window.innerHeight);

export default function MeteorShower() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext('2d');
    const reduced = prefersReducedMotion();
    const meteors = [];
    const sparks = [];
    let width = 0;
    let height = 0;
    let rafId = null;
    let spawnTimer = null;
    let lastTime = performance.now();
    let lastImpact = -Infinity;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    const spawnMeteor = () => {
      if (meteors.length >= MAX_METEORS) return;
      const speed = 620 + Math.random() * 620; // px/s
      const meteor = {
        length: 90 + Math.random() * 170,
        width: 1 + Math.random() * 1.4,
        amber: Math.random() < 0.45,
        targetId: null,
        entered: false,
        age: 0,
      };

      const canAim = !reduced && performance.now() - lastImpact > IMPACT_COOLDOWN && Math.random() < AIMED_CHANCE;
      const targets = canAim ? getTargets() : [];
      if (targets.length) {
        // Back-project from the target along a downward diagonal so the meteor enters from off-screen
        const target = targets[Math.floor(Math.random() * targets.length)];
        const angle = (Math.random() < 0.5 ? 25 + Math.random() * 40 : 115 + Math.random() * 40) * (Math.PI / 180);
        const dx = Math.cos(angle);
        const dy = Math.sin(angle);
        const back = Math.hypot(width, height) * 0.7;
        meteor.x = target.x - dx * back;
        meteor.y = target.y - dy * back;
        meteor.vx = dx * speed;
        meteor.vy = dy * speed;
        meteor.targetId = target.id;
        meteor.speed = speed;
      } else {
        const fromLeft = Math.random() < 0.65;
        const angle = (fromLeft ? 22 + Math.random() * 30 : 128 + Math.random() * 30) * (Math.PI / 180);
        meteor.x = Math.random() * width;
        meteor.y = -40 - Math.random() * height * 0.15;
        meteor.vx = Math.cos(angle) * speed;
        meteor.vy = Math.sin(angle) * speed;
      }
      meteors.push(meteor);
    };

    const burst = (x, y, amber) => {
      const count = 22;
      for (let i = 0; i < count; i++) {
        const a = (i / count) * Math.PI * 2 + Math.random() * 0.3;
        const v = 80 + Math.random() * 260;
        sparks.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 1, decay: 1.4 + Math.random() * 1.2, amber });
      }
    };

    const scheduleSpawn = () => {
      const base = reduced ? 4000 : window.innerWidth < 768 ? 900 : 520;
      spawnTimer = setTimeout(() => {
        if (!document.hidden) {
          spawnMeteor();
          // Occasional meteor shower burst
          if (!reduced && Math.random() < 0.18) {
            setTimeout(spawnMeteor, 120);
            setTimeout(spawnMeteor, 260);
          }
        }
        scheduleSpawn();
      }, base + Math.random() * base * 1.6);
    };
    scheduleSpawn();

    const render = (now) => {
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;
      ctx.clearRect(0, 0, width, height);

      const armed = now - lastImpact > IMPACT_COOLDOWN;
      const targets = meteors.length && armed ? getTargets() : [];

      for (let i = meteors.length - 1; i >= 0; i--) {
        const m = meteors[i];

        // Gentle homing so aimed meteors still connect with planets drifting along their orbit
        if (m.targetId) {
          const target = targets.find((t) => t.id === m.targetId);
          if (target) {
            const dx = target.x - m.x;
            const dy = target.y - m.y;
            const dist = Math.hypot(dx, dy) || 1;
            m.vx += ((dx / dist) * m.speed - m.vx) * Math.min(dt * 2.5, 1);
            m.vy += ((dy / dist) * m.speed - m.vy) * Math.min(dt * 2.5, 1);
          } else {
            m.targetId = null;
          }
        }

        m.x += m.vx * dt;
        m.y += m.vy * dt;
        m.age += dt;

        const hit = targets.find((t) => Math.hypot(t.x - m.x, t.y - m.y) < t.r);
        if (hit) {
          lastImpact = now;
          burst(m.x, m.y, m.amber);
          window.dispatchEvent(new CustomEvent('skillStarImpact', { detail: { id: hit.id } }));
          meteors.splice(i, 1);
          continue;
        }

        const inside = m.x >= 0 && m.x <= width && m.y >= 0 && m.y <= height;
        if (inside) m.entered = true;
        if ((m.entered && !inside && Math.hypot(m.x - width / 2, m.y - height / 2) > Math.hypot(width, height)) || m.age > 5) {
          meteors.splice(i, 1);
          continue;
        }

        const speed = Math.hypot(m.vx, m.vy) || 1;
        const tx = m.x - (m.vx / speed) * m.length;
        const ty = m.y - (m.vy / speed) * m.length;
        const color = m.amber ? '212, 163, 115' : '245, 242, 235';
        const grad = ctx.createLinearGradient(m.x, m.y, tx, ty);
        grad.addColorStop(0, `rgba(255, 248, 231, 0.95)`);
        grad.addColorStop(0.25, `rgba(${color}, 0.55)`);
        grad.addColorStop(1, `rgba(${color}, 0)`);
        ctx.strokeStyle = grad;
        ctx.lineWidth = m.width;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(m.x, m.y);
        ctx.lineTo(tx, ty);
        ctx.stroke();

        ctx.fillStyle = 'rgba(255, 248, 231, 0.9)';
        ctx.shadowColor = `rgba(${color}, 0.9)`;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(m.x, m.y, m.width * 1.1, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      for (let i = sparks.length - 1; i >= 0; i--) {
        const s = sparks[i];
        s.life -= s.decay * dt;
        if (s.life <= 0) {
          sparks.splice(i, 1);
          continue;
        }
        s.vx *= 1 - dt * 2.2;
        s.vy *= 1 - dt * 2.2;
        s.x += s.vx * dt;
        s.y += s.vy * dt;
        ctx.fillStyle = s.amber ? `rgba(224, 169, 109, ${s.life})` : `rgba(255, 248, 231, ${s.life})`;
        ctx.fillRect(s.x - 1, s.y - 1, 2, 2);
      }

      rafId = requestAnimationFrame(render);
    };
    rafId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(spawnTimer);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="shooting-stars-layer" aria-hidden="true"></canvas>;
}
