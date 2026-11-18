// Flying saucer fleet shared by FleetEntities (DOM + typing hunt) and CosmicCanvas (3D flight paths).
// alien-1..3 fly the original dogfight paths with their rocket pursuers; the rest join as the hunt escalates.

export const BASE_UFO_COUNT = 3;
export const MAX_UFO_COUNT = 8;
export const KILLS_PER_REINFORCEMENT = 3;

const VARIANTS = ['', 'variant-chrono', 'variant-void'];

// Orbits for the reinforcement saucers (solar-plane local units, same space as the planets)
const EXTRA_ORBITS = [
  { r: 12.5, stretch: 1.12, yAmp: 3.6, yFreq: 1.7, speed: 0.0062, phase: 1.0, wobble: 1.2 },
  { r: 18.0, stretch: 0.9, yAmp: 2.6, yFreq: 2.2, speed: 0.0049, phase: 3.3, wobble: 0.8 },
  { r: 8.6, stretch: 1.2, yAmp: 2.0, yFreq: 3.1, speed: 0.0081, phase: 5.1, wobble: 1.0 },
  { r: 22.5, stretch: 0.95, yAmp: 4.4, yFreq: 1.4, speed: 0.0041, phase: 0.4, wobble: 1.6 },
  { r: 15.8, stretch: 1.05, yAmp: 5.0, yFreq: 2.6, speed: 0.0057, phase: 2.6, wobble: 1.3 },
];

export const UFO_FLEET = Array.from({ length: MAX_UFO_COUNT }, (_, i) => ({
  id: `alien-${i + 1}`,
  variant: VARIANTS[i % VARIANTS.length],
  orbit: i >= BASE_UFO_COUNT ? EXTRA_ORBITS[i - BASE_UFO_COUNT] : null,
}));

// Position of a reinforcement saucer along its orbit at sim time t
export const getExtraUfoPosition = (orbit, t) => {
  const r = orbit.r + Math.sin(t * 2.0) * orbit.wobble;
  return {
    x: Math.cos(t) * r,
    y: Math.sin(t * orbit.yFreq) * orbit.yAmp,
    z: Math.sin(t) * r * orbit.stretch,
  };
};

const ONSETS = ['zor', 'kry', 'vel', 'qua', 'bly', 'mor', 'thra', 'gli', 'nox', 'pex', 'vyr', 'zul', 'jax', 'fen', 'dro', 'ske', 'hux', 'lom', 'ruk', 'wex', 'cyb', 'iko', 'ulo', 'esk', 'aru', 'tov', 'sil', 'gor'];
const CODAS = ['gax', 'lon', 'rix', 'mup', 'tor', 'vex', 'zon', 'ith', 'dar', 'oob', 'nak', 'lux', 'quo', 'bel', 'fyr', 'sha', 'kin', 'dux', 'wyn', 'ept'];
const MIDDLES = ['', '', '', 'a', 'o', 'i', 'u', 'ar', 'el'];

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

// Random alien name whose first letter isn't already claimed, so one keystroke picks a single target
export const generateUfoName = (takenInitials = new Set()) => {
  for (let attempt = 0; attempt < 60; attempt++) {
    const name = pick(ONSETS) + pick(MIDDLES) + pick(CODAS);
    if (!takenInitials.has(name[0]) && name.length <= 9) return name;
  }
  return pick(ONSETS) + pick(CODAS);
};
