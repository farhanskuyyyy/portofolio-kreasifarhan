import React, { useState, useEffect, useCallback } from 'react';
import CosmicCanvas from './components/CosmicCanvas';
import HudHeader from './components/HudHeader';
import HeroOverlay from './components/HeroOverlay';
import FleetEntities from './components/FleetEntities';
import PlanetMarkers from './components/PlanetMarkers';
import CelestialSkillStars from './components/CelestialSkillStars';
import RadarHud from './components/RadarHud';

import MissionsModal from './components/Modals/MissionsModal';
import FlightLogModal from './components/Modals/FlightLogModal';
import SystemsModal from './components/Modals/SystemsModal';
import RelayModal from './components/Modals/RelayModal';

import { audioEngine } from './utils/audio';

export default function App() {
  const [activeModal, setActiveModal] = useState(null); // 'missions' | 'experience' | 'systems' | 'contact' | null
  const [camTarget, setCamTarget] = useState('overview');
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [telemetry, setTelemetry] = useState({
    angle: 0,
    sector: 'FRONT OBLIQUE',
    elevationDeg: 15,
    autoOrbit: false,
  });
  const [planetCoords, setPlanetCoords] = useState({});
  const [zoomAction, setZoomAction] = useState(null);
  const [resetViewTrigger, setResetViewTrigger] = useState(0);

  // Keyboard ESC closes active modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && activeModal) {
        audioEngine.playUiClick(520, 'sine', 0.04);
        setActiveModal(null);
        setCamTarget('overview');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeModal]);

  // Shooting stars background effect
  useEffect(() => {
    const container = document.getElementById('shooting-stars-container');
    if (!container) return;

    const spawnMeteor = () => {
      if (document.hidden) return;
      const star = document.createElement('div');
      star.className = 'shooting-star';

      const startX = Math.random() * window.innerWidth * 0.85;
      const startY = Math.random() * (window.innerHeight * 0.45);
      const angle = 28 + Math.random() * 24;
      const length = 110 + Math.random() * 160;

      star.style.left = `${startX}px`;
      star.style.top = `${startY}px`;
      star.style.width = `${length}px`;
      star.style.transform = `rotate(${angle}deg)`;

      container.appendChild(star);
      setTimeout(() => star.remove(), 1100);
    };

    const interval = setInterval(() => {
      if (Math.random() > 0.4) spawnMeteor();
    }, 4500);

    return () => clearInterval(interval);
  }, []);

  const handleToggleAudio = () => {
    const active = audioEngine.toggle();
    setAudioEnabled(active);
  };

  const handleSetCamTarget = (target) => {
    setCamTarget(target);
    if (target === 'missions' || target === 'experience' || target === 'systems' || target === 'contact') {
      setActiveModal(target);
    } else {
      setActiveModal(null);
    }
  };

  const handleOpenSector = (sector) => {
    setCamTarget(sector);
    setActiveModal(sector);
  };

  const handleCloseModal = () => {
    audioEngine.playUiClick(520, 'sine', 0.04);
    setActiveModal(null);
    setCamTarget('overview');
  };

  const handleSwitchSector = (nextSector) => {
    setCamTarget(nextSector);
    setActiveModal(nextSector);
  };

  const handleResetView = () => {
    setCamTarget('overview');
    setResetViewTrigger((prev) => prev + 1);
  };

  const handleZoomIn = () => {
    setZoomAction('in');
    setTimeout(() => setZoomAction(null), 50);
  };

  const handleZoomOut = () => {
    setZoomAction('out');
    setTimeout(() => setZoomAction(null), 50);
  };

  const handleToggleAutoOrbit = () => {
    setTelemetry((prev) => ({ ...prev, autoOrbit: !prev.autoOrbit }));
  };

  return (
    <div className="theme-basalt">
      {/* 3D WebGL Canvas */}
      <CosmicCanvas
        camTarget={camTarget}
        onPlanetClick={handleOpenSector}
        onUpdateTelemetry={setTelemetry}
        onUpdatePlanetCoords={setPlanetCoords}
        zoomAction={zoomAction}
        resetViewTrigger={resetViewTrigger}
        autoOrbitEnabled={telemetry.autoOrbit}
      />

      {/* Atmospheric Overlays */}
      <div className="mist-overlay" aria-hidden="true"></div>
      <div id="shooting-stars-container" className="shooting-stars-layer" aria-hidden="true"></div>

      {/* Autonomous Dogfight Fleet */}
      <FleetEntities />

      {/* Spatial Application Shell */}
      <div className="spatial-app">
        <HudHeader
          camTarget={camTarget}
          onSetCamTarget={handleSetCamTarget}
          onOpenContact={() => handleOpenSector('contact')}
          audioEnabled={audioEnabled}
          onToggleAudio={handleToggleAudio}
        />

        <main className="spatial-viewport" id="main-content">
          <PlanetMarkers coords={planetCoords} onSelectSector={handleOpenSector} />
          <HeroOverlay />
          <CelestialSkillStars onSelectTech={() => handleOpenSector('systems')} />
          <RadarHud
            telemetry={telemetry}
            onResetView={handleResetView}
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
            onToggleAutoOrbit={handleToggleAutoOrbit}
          />
        </main>
      </div>

      {/* Cockpit Command Modals with Direct Switching */}
      <MissionsModal
        isOpen={activeModal === 'missions'}
        onClose={handleCloseModal}
        onSwitchSector={handleSwitchSector}
      />
      <FlightLogModal
        isOpen={activeModal === 'experience'}
        onClose={handleCloseModal}
        onSwitchSector={handleSwitchSector}
      />
      <SystemsModal
        isOpen={activeModal === 'systems'}
        onClose={handleCloseModal}
        onSwitchSector={handleSwitchSector}
      />
      <RelayModal
        isOpen={activeModal === 'contact'}
        onClose={handleCloseModal}
        onSwitchSector={handleSwitchSector}
      />
    </div>
  );
}
