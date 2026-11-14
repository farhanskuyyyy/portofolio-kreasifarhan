import React from 'react';
import { audioEngine } from '../utils/audio';

export default function PlanetMarkers({ coords, onSelectSector }) {
  const handleClick = (sector) => {
    audioEngine.playWarpSound();
    onSelectSector(sector);
  };

  const markers = [
    {
      id: 'missions',
      className: 'hud-missions',
      pipClass: 'pip-gold',
      index: 'P-01',
      name: 'MISSIONS // ARCHITECTURE',
      coord: coords?.missions,
    },
    {
      id: 'experience',
      className: 'hud-experience',
      pipClass: 'pip-cyan',
      index: 'P-02',
      name: 'FLIGHT LOG // CREDENTIALS',
      coord: coords?.experience,
    },
    {
      id: 'systems',
      className: 'hud-systems',
      pipClass: 'pip-rust',
      index: 'P-03',
      name: 'CORE SYSTEMS // STACK',
      coord: coords?.systems,
    },
    {
      id: 'contact',
      className: 'hud-contact',
      pipClass: 'pip-ivory',
      index: 'P-04',
      name: 'TELEMETRY // RELAY',
      coord: coords?.contact,
    },
  ];

  return (
    <div id="planet-hud-layer" className="planet-hud-layer" aria-label="Interactive 3D Planets HUD">
      {markers.map((m) => {
        const c = m.coord;
        const style = c
          ? {
              transform: `translate3d(${c.x}px, ${c.y}px, 0)`,
              opacity: c.visible ? 1 : 0,
              pointerEvents: c.visible ? 'auto' : 'none',
            }
          : undefined;

        return (
          <button
            key={m.id}
            type="button"
            className={`planet-floating-hud ${m.className}`}
            style={style}
            onClick={() => handleClick(m.id)}
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
        );
      })}
    </div>
  );
}
