import React, { useEffect, useState } from 'react';
import { audioEngine } from '../utils/audio';

const CARD_DELAY = 650; // ms, lets the shockwave clear the core before the card lands
const AUTO_HIDE = 12000;

const STATS = [
  { val: '5+', lbl: 'Years Shipping' },
  { val: '6', lbl: 'Production Missions' },
  { val: '4', lbl: 'EVM Chains Integrated' },
];

// Triggered by the Gravity Pulse (click on the central singularity in CosmicCanvas)
export default function SingularityProfile({ onOpenSector, suppressed }) {
  const [pulseId, setPulseId] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let showTimer;
    const handlePulse = () => {
      setPulseId((n) => n + 1);
      clearTimeout(showTimer);
      showTimer = setTimeout(() => setVisible(true), CARD_DELAY);
    };
    window.addEventListener('singularityPulse', handlePulse);
    return () => {
      window.removeEventListener('singularityPulse', handlePulse);
      clearTimeout(showTimer);
    };
  }, []);

  useEffect(() => {
    if (!visible) return undefined;
    const hideTimer = setTimeout(() => setVisible(false), AUTO_HIDE);
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setVisible(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      clearTimeout(hideTimer);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [visible, pulseId]);

  const close = () => {
    audioEngine.playUiClick(520, 'sine', 0.04);
    setVisible(false);
  };

  return (
    <>
      {pulseId > 0 && <div key={pulseId} className="singularity-flash" aria-hidden="true"></div>}

      {visible && !suppressed && (
        <section className="singularity-profile-card" aria-label="Core profile">
          <header className="sp-header">
            <span className="sp-code">
              <span className="sp-pip" aria-hidden="true"></span>
              SINGULARITY CORE // PROFILE
            </span>
            <button type="button" className="sp-close" onClick={close} aria-label="Close core profile">
              ×
            </button>
          </header>

          <h2 className="sp-name">Farhan Arfianto</h2>
          <p className="sp-role">Fullstack Developer · Backend Engineer</p>
          <p className="sp-summary">
            Builds scalable web apps, high-performance API ecosystems and B2B transactional platforms with Golang
            (Echo) and Laravel, from Asynq + Redis task queues to multi-chain stablecoin payments via Alchemy RPC.
          </p>

          <div className="sp-stats">
            {STATS.map((s) => (
              <div key={s.lbl} className="sp-stat">
                <span className="sp-stat-val">{s.val}</span>
                <span className="sp-stat-lbl">{s.lbl}</span>
              </div>
            ))}
          </div>

          <div className="sp-actions">
            <button
              type="button"
              className="sp-btn primary"
              onClick={() => {
                setVisible(false);
                onOpenSector('missions');
              }}
            >
              VIEW MISSIONS →
            </button>
            <a className="sp-btn" href="/Farhan-Arfianto-ATS-CV.pdf" download="Farhan Arfianto - ATS CV.pdf">
              DOWNLOAD CV ↓
            </a>
          </div>
        </section>
      )}
    </>
  );
}
