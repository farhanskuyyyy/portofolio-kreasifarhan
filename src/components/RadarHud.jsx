import React from 'react';
import { audioEngine } from '../utils/audio';

export default function RadarHud({
  telemetry,
  onResetView,
  onZoomIn,
  onZoomOut,
  onToggleAutoOrbit,
}) {
  const { angle = 0, sector = 'FRONT OBLIQUE', elevationDeg = 15, autoOrbit = false } =
    telemetry || {};

  const padDeg = String(angle).padStart(3, '0');
  const sign = elevationDeg >= 0 ? '+' : '';

  const handleCompassClick = () => {
    audioEngine.playWarpSound();
    onResetView();
  };

  const handleZoomInClick = () => {
    audioEngine.playUiClick(980, 'sine', 0.03);
    onZoomIn();
  };

  const handleZoomOutClick = () => {
    audioEngine.playUiClick(640, 'sine', 0.03);
    onZoomOut();
  };

  const handleAutoClick = () => {
    audioEngine.playUiClick(880, 'sine', 0.04);
    onToggleAutoOrbit();
  };

  return (
    <aside className="scroll-loop-hud" aria-label="Orbital Camera Perspective and Zoom Controller">
      <div
        className="scroll-compass-ring"
        onClick={handleCompassClick}
        title="Click to reset camera to 000 deg (Front View)"
      >
        <div
          className="scroll-compass-needle"
          aria-hidden="true"
          style={{ transform: `translateX(-50%) rotate(${angle}deg)` }}
        ></div>
        <div className="scroll-compass-center" aria-hidden="true"></div>
      </div>

      <div className="scroll-telemetry">
        <div className="scroll-telemetry-header">
          <span className="scroll-pulse-dot" aria-hidden="true"></span>
          <span className="scroll-telemetry-title">SPATIAL AXIS // X: ORBIT · Y: TILT</span>
        </div>

        <div className="scroll-telemetry-readout">
          <span className="scroll-angle-display">{padDeg}°</span>
          <span className="scroll-sector-tag">{sector}</span>
          <span className="scroll-elevation-tag">ELV {sign}{elevationDeg}°</span>
        </div>

        <div className="scroll-instruction-row">
          <span className="scroll-hint-label">X: ORBIT · Y: TILT</span>
          <button
            type="button"
            className="scroll-zoom-btn"
            onClick={handleZoomInClick}
            title="Zoom In (+)"
            aria-label="Zoom camera in"
          >
            +
          </button>
          <button
            type="button"
            className="scroll-zoom-btn"
            onClick={handleZoomOutClick}
            title="Zoom Out (-)"
            aria-label="Zoom camera out"
          >
            -
          </button>
          <button
            type="button"
            className={`scroll-auto-btn ${autoOrbit ? 'active' : ''}`}
            onClick={handleAutoClick}
            title="Toggle automatic continuous orbital rotation"
          >
            {autoOrbit ? 'AUTO: ON' : 'AUTO: DRIFT'}
          </button>
        </div>
      </div>
    </aside>
  );
}
