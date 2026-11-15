import React, { useState } from 'react';
import { audioEngine } from '../utils/audio';

export default function RadarHud({
  telemetry,
  onResetView,
  onZoomIn,
  onZoomOut,
  onToggleAutoOrbit,
}) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const { angle = 0, sector = 'FRONT OBLIQUE', elevationDeg = 15, autoOrbit = true } =
    telemetry || {};

  const padDeg = String(angle).padStart(3, '0');
  const padElv = String(elevationDeg).padStart(3, '0');

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

  const handleHideHud = () => {
    audioEngine.playUiClick(480, 'sine', 0.03);
    setIsCollapsed(true);
  };

  const handleExpandHud = () => {
    audioEngine.playUiClick(880, 'sine', 0.04);
    setIsCollapsed(false);
  };

  if (isCollapsed) {
    return (
      <button
        type="button"
        className="scroll-hud-fab"
        onClick={handleExpandHud}
        title="Open Telemetry & Spatial Navigation Radar"
        aria-label="Open Telemetry Radar HUD"
      >
        <div className="hud-fab-radar-ring">
          <div
            className="hud-fab-needle"
            aria-hidden="true"
            style={{ transform: `rotate(${angle}deg)` }}
          />
          <span className="hud-fab-beacon" aria-hidden="true"></span>
        </div>
        <div className="hud-fab-info">
          <span className="hud-fab-label">RADAR // HUD</span>
          <span className="hud-fab-deg">{padDeg}°</span>
        </div>
      </button>
    );
  }

  return (
    <aside className="scroll-loop-hud" aria-label="Orbital Camera Perspective and Zoom Controller">
      {/* Top Header Row with Minimize Control */}
      <div className="scroll-hud-topbar">
        <div className="scroll-telemetry-header">
          <span className="scroll-pulse-dot" aria-hidden="true"></span>
          <span className="scroll-telemetry-title">SPATIAL AXIS // 360° X & Y</span>
        </div>
        <button
          type="button"
          className="scroll-hud-collapse-btn"
          onClick={handleHideHud}
          title="Minimize HUD to floating button"
          aria-label="Minimize Telemetry HUD"
        >
          <span className="collapse-icon" aria-hidden="true">-</span>
          <span className="collapse-text">HIDE</span>
        </button>
      </div>

      <div className="scroll-hud-body">
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
          <div className="scroll-telemetry-readout">
            <span className="scroll-angle-display">{padDeg}°</span>
            <span className="scroll-sector-tag">{sector}</span>
            <span className="scroll-elevation-tag">ELV {padElv}°</span>
          </div>

          <div className="scroll-instruction-row">
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
      </div>
    </aside>
  );
}
