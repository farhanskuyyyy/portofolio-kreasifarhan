import React, { useState, useEffect, useCallback } from 'react';
import CosmicCanvas from './components/CosmicCanvas';
import HudHeader from './components/HudHeader';
import HeroOverlay from './components/HeroOverlay';
import FleetEntities from './components/FleetEntities';
import PlanetMarkers from './components/PlanetMarkers';
import CelestialSkillStars from './components/CelestialSkillStars';
import RadarHud from './components/RadarHud';
import CosmicRocketOpening from './components/CosmicRocketOpening';
import MeteorShower from './components/MeteorShower';
import SingularityProfile from './components/SingularityProfile';

import MissionsModal from './components/Modals/MissionsModal';
import FlightLogModal from './components/Modals/FlightLogModal';
import SystemsModal from './components/Modals/SystemsModal';
import RelayModal from './components/Modals/RelayModal';

import { audioEngine } from './utils/audio';

export default function App() {
  const [activeModal, setActiveModal] = useState(null); // 'missions' | 'experience' | 'systems' | 'contact' | null
  const [showOpening, setShowOpening] = useState(true);
  const [camTarget, setCamTarget] = useState('overview');
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [telemetry, setTelemetry] = useState({
    angle: 0,
    sector: 'FRONT OBLIQUE',
    elevationDeg: 15,
    autoOrbit: true,
  });
  const [zoomAction, setZoomAction] = useState(null);
  const [resetViewTrigger, setResetViewTrigger] = useState(0);

  // Sync body.is-modal-docked class whenever modal is open
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.body.classList.toggle('is-modal-docked', activeModal !== null);
    }
  }, [activeModal]);

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
        zoomAction={zoomAction}
        resetViewTrigger={resetViewTrigger}
        autoOrbitEnabled={telemetry.autoOrbit}
      />

      {/* Atmospheric Overlays */}
      <div className="mist-overlay" aria-hidden="true"></div>
      <MeteorShower />

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
          onReplayLaunch={() => setShowOpening(true)}
        />

        <main className="spatial-viewport" id="main-content">
          <PlanetMarkers onSelectSector={handleOpenSector} activeSector={activeModal} />
          <HeroOverlay />
          <CelestialSkillStars />
          <RadarHud
            telemetry={telemetry}
            onResetView={handleResetView}
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
            onToggleAutoOrbit={handleToggleAutoOrbit}
          />
        </main>
      </div>

      {/* Gravity Pulse core profile (click the central singularity) */}
      <SingularityProfile onOpenSector={handleOpenSector} suppressed={activeModal !== null} />

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

      {/* Opening Cosmic Rocket & Zipper Veil */}
      {showOpening && (
        <CosmicRocketOpening onComplete={() => setShowOpening(false)} />
      )}
    </div>
  );
}
