import React, { useState, useEffect } from 'react';

const INTRO_PHRASES = [
  '5+ years building scalable web apps, B2B platforms & high-performance APIs.',
  'Engineering Golang (Echo) & Laravel backends with Asynq + Redis task queues.',
  'Integrating Web3 payments: smart contracts & multi-chain stablecoin transfers.',
  'Shipping observable systems with Docker, Grafana & Prometheus.',
];

export default function HeroOverlay() {
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [displayText, setDisplayText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const currentPhrase = INTRO_PHRASES[phraseIndex];
    let timeout;

    if (!isDeleting) {
      if (displayText.length < currentPhrase.length) {
        timeout = setTimeout(() => {
          setDisplayText(currentPhrase.slice(0, displayText.length + 1));
        }, 42);
      } else {
        timeout = setTimeout(() => {
          setIsDeleting(true);
        }, 2600);
      }
    } else {
      if (displayText.length > 0) {
        timeout = setTimeout(() => {
          setDisplayText(currentPhrase.slice(0, displayText.length - 1));
        }, 22);
      } else {
        setIsDeleting(false);
        setPhraseIndex((prev) => (prev + 1) % INTRO_PHRASES.length);
      }
    }

    return () => clearTimeout(timeout);
  }, [displayText, isDeleting, phraseIndex]);

  return (
    <div className="solar-hero-identity" aria-label="Solar System Core: Farhan Arfianto">
      <div className="hero-beacon-pip" aria-hidden="true"></div>
      <span className="hero-status-tag">SOLAR SYSTEM : CORE ACTIVE</span>
      <h1 className="hero-title-name">FARHAN ARFIANTO</h1>
      <p className="hero-role-title">FULLSTACK DEVELOPER · BACKEND ENGINEER</p>

      {/* Elegant Typing Effect Introduction */}
      <div className="hero-typewriter-container" aria-live="polite">
        <span className="typewriter-prefix">&gt; </span>
        <span className="typewriter-text">{displayText}</span>
        <span className="typewriter-cursor" aria-hidden="true">|</span>
      </div>

      <div className="hero-subline">Click any planet or tech logo to inspect, or tap the singularity core for a gravity pulse</div>
    </div>
  );
}
