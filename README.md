# Farhan Arfianto : 3D Cosmic Spatial Portfolio

Cinematic, interactive 3D spatial developer portfolio for **Farhan Arfianto** (Senior Backend and Distributed Systems Specialist at Lumoshive). Built with **React**, **Vite**, and **Three.js**.

---

## Highlights and Features

1. **3D Heliocentric Solar System (Three.js)**:
   - Central pulsating wireframe core radiating cosmic energy.
   - 4 tilted planetary orbits angled towards the cockpit viewport.
   - 4 unique planetary bodies representing key portfolio sectors:
     - **Sector 01 (Missions)**: Dual gyro-ringed ember planet.
     - **Sector 02 (Flight Log)**: Terrestrial cyan planet with orbiting 3D lunar satellite.
     - **Sector 03 (Systems)**: Saturn-ringed gas giant with shepherd moons.
     - **Sector 04 (Relay)**: Crystalline ivory deep-space transmission relay.

2. **Multi-Axis Spatial Control Engine**:
   - **X-Axis (Horizontal Azimuth Orbit)**: Continuous 360 degree circular camera loop via trackpad horizontal swipe, keyboard Arrow keys, or touch gestures.
   - **Y-Axis (Vertical Elevation Tilt)**: Dynamic pitch elevation from -15 deg up to +65 deg (bird's-eye view) via mouse wheel and swipe.
   - **Radial Camera Zoom**: Radial camera distance adjustments (16.0 to 46.0) via trackpad pinch (`ctrlKey + wheel`), touch pinch 2 fingers, on-screen `[+]` / `[-]` radar buttons, and keyboard `+` / `-`.
   - **Physics Momentum Damping**: Friction decay for gliding camera motion.

3. **Autonomous Dogfight Fleet & Void Probes**:
   - Draggable autonomous spacecrafts (**ENDURANCE-01**, **RANGER-02**, **LANDER-03**) and alien probes (**5D TESSERACT**, **CHRONO-PROBE**, **VOID-ORB**).
   - Real-time laser bolt combat and shockwave particle explosions.

4. **Procedural Web Audio API Synthesizer**:
   - Pure client-side sound synthesis with zero external audio assets:
     - Cockpit button clicks (sine frequency modulation)
     - Warp speed transition sweeps
     - Twin laser cannon pulses
     - Sub-bass filtered concussive explosions
     - Deep space ambient background drone

5. **Cockpit HUD Command Modals with Direct Switching**:
   - Direct cross-modal switching between Sectors (01 Missions -> 02 Log -> 03 Systems -> 04 Relay) without closing dialogs.
   - Full keyboard accessibility (ESC to close, autofocus, tab navigation).
   - Responsive mobile layout optimized for portrait viewports (iPhone & Android).

---

## Tech Stack

- **Framework**: React 18 + Vite 5
- **3D Graphics Engine**: Three.js (WebGL)
- **Audio**: Web Audio API (Synthesizer & Oscillator filters)
- **Styling**: Modern CSS3 Custom Properties, Glassmorphism, and SVG graphics
- **Typography**: Cinzel, JetBrains Mono, Space Grotesk

---

## Getting Started

### Prerequisites

- Node.js 18+ (tested on Node.js 22)
- npm 9+

### Installation

```bash
git clone https://github.com/farhanskuyyyy/portofolio-kreasifarhan.git
cd portofolio-kreasifarhan
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build

```bash
npm run build
npm run preview
```

---

## License

Copyright (c) 2026 Farhan Arfianto. All rights reserved.
