import React from 'react';
import { audioEngine } from '../utils/audio';

export default function PlanetMarkers({ onSelectSector, activeSector }) {
  const handleClick = (sector) => {
    audioEngine.playWarpSound();
    if (onSelectSector) onSelectSector(sector);
  };

  const handleMouseEnter = (sector) => {
    window.dispatchEvent(
      new CustomEvent('planetHoverChange', { detail: { sector, isHovered: true } })
    );
  };

  const handleMouseLeave = (sector) => {
    window.dispatchEvent(
      new CustomEvent('planetHoverChange', { detail: { sector, isHovered: false } })
    );
  };

  const markers = [
    {
      id: 'missions',
      className: 'hud-missions',
      pipClass: 'pip-gold',
      index: 'P-01',
      name: 'MISSIONS // ARCHITECTURE',
    },
    {
      id: 'experience',
      className: 'hud-experience',
      pipClass: 'pip-cyan',
      index: 'P-02',
      name: 'FLIGHT LOG // CREDENTIALS',
    },
    {
      id: 'systems',
      className: 'hud-systems',
      pipClass: 'pip-rust',
      index: 'P-03',
      name: 'CORE SYSTEMS // STACK',
    },
    {
      id: 'contact',
      className: 'hud-contact',
      pipClass: 'pip-ivory',
      index: 'P-04',
      name: 'TELEMETRY // RELAY',
    },
  ];

  return (
    <div id="planet-hud-layer" className="planet-hud-layer" aria-label="Interactive 3D Planets HUD">
      {markers.map((m) => (
        <button
          key={m.id}
          id={`planet-hud-${m.id}`}
          data-sector={m.id}
          type="button"
          className={`planet-floating-hud ${m.className} ${activeSector === m.id ? 'is-docked-target' : ''}`}
          style={{ opacity: 0, pointerEvents: 'none' }}
          onClick={() => handleClick(m.id)}
          onMouseEnter={() => handleMouseEnter(m.id)}
          onMouseLeave={() => handleMouseLeave(m.id)}
          title={`Inspect ${m.index}: ${m.name}`}
        >
          <span className="hud-target-bracket bracket-left">[</span>
          <span className={`hud-planet-pip ${m.pipClass}`} aria-hidden="true"></span>
          <span className="hud-planet-info">
            <span className="hud-planet-index">{m.index}</span>
            <span className="hud-planet-name">{m.name}</span>
          </span>
          <span className="hud-target-bracket bracket-right">]</span>
          <span className="hud-action-callout">CLICK TO DOCK</span>
        </button>
      ))}
    </div>
  );
}
