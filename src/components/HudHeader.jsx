import React, { useState, useEffect } from 'react';
import { audioEngine } from '../utils/audio';

export default function HudHeader({ camTarget, onSetCamTarget, onOpenContact, audioEnabled, onToggleAudio }) {
  const [timeStr, setTimeStr] = useState('00:00:00');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const utc = now.getTime() + now.getTimezoneOffset() * 60000;
      const jakartaDate = new Date(utc + 3600000 * 7);
      const h = String(jakartaDate.getHours()).padStart(2, '0');
      const m = String(jakartaDate.getMinutes()).padStart(2, '0');
      const s = String(jakartaDate.getSeconds()).padStart(2, '0');
      setTimeStr(`${h}:${m}:${s} WIB`);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleCamClick = (target) => {
    audioEngine.playUiClick(780, 'sine', 0.03);
    onSetCamTarget(target);
  };

  return (
    <header className="top-hud">
      <div className="hud-left">
        <span className="hud-beacon" aria-hidden="true"></span>
        <div className="hud-callsign">
          <span className="callsign-code">FA // FULLSTACK-DEV</span>
          <span className="callsign-sub">JAKARTA, ID : LAT 03°44'S 119°54'E</span>
        </div>
      </div>

      <div className="hud-center">
        <div className="camera-mode-switcher" aria-label="3D Camera Viewpoint Navigation">
          <button
            type="button"
            className={`cam-btn ${camTarget === 'overview' ? 'active' : ''}`}
            onClick={() => handleCamClick('overview')}
            title="Reset camera to orbital overview"
          >
            <span>CORE ORBIT</span>
          </button>
          <button
            type="button"
            className={`cam-btn ${camTarget === 'missions' ? 'active' : ''}`}
            onClick={() => handleCamClick('missions')}
            title="Warp camera to Sector 01: Missions"
          >
            <span>S-01 MISSIONS</span>
          </button>
          <button
            type="button"
            className={`cam-btn ${camTarget === 'experience' ? 'active' : ''}`}
            onClick={() => handleCamClick('experience')}
            title="Warp camera to Sector 02: Flight Log"
          >
            <span>S-02 FLIGHT LOG</span>
          </button>
          <button
            type="button"
            className={`cam-btn ${camTarget === 'systems' ? 'active' : ''}`}
            onClick={() => handleCamClick('systems')}
            title="Warp camera to Sector 03: Propulsion"
          >
            <span>S-03 SYSTEMS</span>
          </button>
          <button
            type="button"
            className={`cam-btn ${camTarget === 'contact' ? 'active' : ''}`}
            onClick={() => handleCamClick('contact')}
            title="Warp camera to Sector 04: Relay"
          >
            <span>S-04 RELAY</span>
          </button>
        </div>
      </div>

      <div className="hud-right">
        <div className="coordinates-badge" aria-label="Current coordinates">
          <span className="coord-icon" aria-hidden="true">⌖</span>
          <span>JAKARTA GMT+7</span>
          <span className="coord-sep">|</span>
          <span>{timeStr}</span>
        </div>

        <button
          type="button"
          className="hud-btn"
          onClick={onToggleAudio}
          aria-label="Toggle ambient cockpit audio"
          title="Toggle audio telemetry synthesizer"
        >
          <span className="btn-indicator" aria-hidden="true" style={{ background: audioEnabled ? '#00e5ff' : '#4a5568' }}></span>
          <span className="btn-label">{audioEnabled ? 'AUDIO: ON' : 'AUDIO: OFF'}</span>
        </button>

        <button
          type="button"
          className="hud-btn highlight"
          onClick={onOpenContact}
          title="Open Communication Relay Modal"
        >
          <span>CONNECT</span>
        </button>
      </div>
    </header>
  );
}
