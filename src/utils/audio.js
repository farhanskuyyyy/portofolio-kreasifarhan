// Web Audio API Cosmic Sound Synthesizer

class CosmicAudioEngine {
  constructor() {
    this.ctx = null;
    this.enabled = false;
    this.ambientDrone = null;
  }

  init() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
      if (AudioCtxClass) {
        this.ctx = new AudioCtxClass();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggle() {
    this.init();
    this.enabled = !this.enabled;
    if (this.enabled) {
      this.startAmbientDrone();
    } else {
      this.stopAmbientDrone();
    }
    return this.enabled;
  }

  playUiClick(freq = 720, type = 'sine', duration = 0.04) {
    if (!this.enabled || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.4, this.ctx.currentTime + duration);

      gain.gain.setValueAtTime(0.04, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (e) {}
  }

  playWarpSound() {
    if (!this.enabled || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(220, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(980, this.ctx.currentTime + 0.35);

      gain.gain.setValueAtTime(0.035, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.35);
    } catch (e) {}
  }

  playAlienChime() {
    if (!this.enabled || !this.ctx) return;
    try {
      [528, 660, 792, 1056].forEach((f, idx) => {
        setTimeout(() => {
          if (!this.ctx) return;
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(f, this.ctx.currentTime);
          gain.gain.setValueAtTime(0.03, this.ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.4);
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start();
          osc.stop(this.ctx.currentTime + 0.4);
        }, idx * 75);
      });
    } catch (e) {}
  }

  playSkillPopExplosion(baseFreq = 720) {
    this.init();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;

      // 1. Crisp bubble pop pitch drop
      const popOsc = this.ctx.createOscillator();
      const popGain = this.ctx.createGain();
      popOsc.type = 'sine';
      popOsc.frequency.setValueAtTime(baseFreq * 1.6, now);
      popOsc.frequency.exponentialRampToValueAtTime(75, now + 0.16);

      popGain.gain.setValueAtTime(0.12, now);
      popGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);

      popOsc.connect(popGain);
      popGain.connect(this.ctx.destination);
      popOsc.start(now);
      popOsc.stop(now + 0.19);

      // 2. High sparkle burst chime
      [baseFreq * 2.0, baseFreq * 2.6].forEach((sf, i) => {
        const sOsc = this.ctx.createOscillator();
        const sGain = this.ctx.createGain();
        sOsc.type = 'triangle';
        sOsc.frequency.setValueAtTime(sf, now + i * 0.03);
        sOsc.frequency.exponentialRampToValueAtTime(sf * 1.3, now + 0.22 + i * 0.03);

        sGain.gain.setValueAtTime(0.04, now + i * 0.03);
        sGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.25 + i * 0.03);

        sOsc.connect(sGain);
        sGain.connect(this.ctx.destination);
        sOsc.start(now + i * 0.03);
        sOsc.stop(now + 0.26 + i * 0.03);
      });
    } catch (e) {}
  }

  playSkillRespawn(baseFreq = 720) {
    this.init();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      // Ascending ethereal warp-in chime
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(120, now);
      osc.frequency.exponentialRampToValueAtTime(baseFreq, now + 0.28);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.06, now + 0.20);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.42);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.44);
    } catch (e) {}
  }

  playLaserSound() {
    this.init();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(1550, now);
      osc.frequency.exponentialRampToValueAtTime(220, now + 0.12);

      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.13);
    } catch (e) {}
  }

  playExplosionSound() {
    this.init();
    if (!this.ctx) return;
    try {
      const ctx = this.ctx;
      const now = ctx.currentTime;

      const bufferSize = Math.floor(ctx.sampleRate * 0.7);
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.18));
      }

      const noiseSource = ctx.createBufferSource();
      noiseSource.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1400, now);
      filter.frequency.exponentialRampToValueAtTime(55, now + 0.65);
      filter.Q.setValueAtTime(4.2, now);

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.18, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.68);

      noiseSource.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(ctx.destination);

      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(120, now);
      osc.frequency.exponentialRampToValueAtTime(26, now + 0.6);

      oscGain.gain.setValueAtTime(0.22, now);
      oscGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.6);

      osc.connect(oscGain);
      oscGain.connect(ctx.destination);

      noiseSource.start(now);
      osc.start(now);
      osc.stop(now + 0.7);
      noiseSource.stop(now + 0.7);
    } catch (e) {}
  }

  playSingularityPulse() {
    this.init();
    if (!this.ctx) return;
    try {
      const ctx = this.ctx;
      const now = ctx.currentTime;

      // 1. Sub-bass gravitational drop
      const sub = ctx.createOscillator();
      const subGain = ctx.createGain();
      sub.type = 'sine';
      sub.frequency.setValueAtTime(110, now);
      sub.frequency.exponentialRampToValueAtTime(24, now + 1.6);
      subGain.gain.setValueAtTime(0.0001, now);
      subGain.gain.exponentialRampToValueAtTime(0.32, now + 0.05);
      subGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.8);
      sub.connect(subGain);
      subGain.connect(ctx.destination);
      sub.start(now);
      sub.stop(now + 1.85);

      // 2. Expanding shockwave whoosh (noise swept by a lowpass)
      const len = Math.floor(ctx.sampleRate * 2.2);
      const buf = ctx.createBuffer(1, len, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
      const noise = ctx.createBufferSource();
      noise.buffer = buf;
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(2400, now);
      filter.frequency.exponentialRampToValueAtTime(90, now + 2.0);
      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.16, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 2.1);
      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(ctx.destination);
      noise.start(now);
      noise.stop(now + 2.2);

      // 3. Bright relativistic shimmer
      const shimmer = ctx.createOscillator();
      const shimmerGain = ctx.createGain();
      shimmer.type = 'triangle';
      shimmer.frequency.setValueAtTime(1320, now);
      shimmer.frequency.exponentialRampToValueAtTime(440, now + 0.9);
      shimmerGain.gain.setValueAtTime(0.05, now);
      shimmerGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.0);
      shimmer.connect(shimmerGain);
      shimmerGain.connect(ctx.destination);
      shimmer.start(now);
      shimmer.stop(now + 1.05);
    } catch (e) {}
  }

  playRocketHover() {
    this.init();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.exponentialRampToValueAtTime(320, now + 0.12);
      gain.gain.setValueAtTime(0.02, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.14);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.15);
    } catch (e) {}
  }

  playRocketIgnitionLaunch() {
    this.init();
    if (!this.ctx) return;
    try {
      const ctx = this.ctx;
      const now = ctx.currentTime;

      // 1. Deep Sub-Bass Ignition Rumble
      const rumbleOsc = ctx.createOscillator();
      const rumbleGain = ctx.createGain();
      rumbleOsc.type = 'triangle';
      rumbleOsc.frequency.setValueAtTime(42, now);
      rumbleOsc.frequency.exponentialRampToValueAtTime(95, now + 0.45);
      rumbleOsc.frequency.exponentialRampToValueAtTime(32, now + 1.8);
      rumbleGain.gain.setValueAtTime(0.18, now);
      rumbleGain.gain.linearRampToValueAtTime(0.24, now + 0.3);
      rumbleGain.gain.exponentialRampToValueAtTime(0.0001, now + 2.0);
      rumbleOsc.connect(rumbleGain);
      rumbleGain.connect(ctx.destination);
      rumbleOsc.start(now);
      rumbleOsc.stop(now + 2.0);

      // 2. Filtered Rocket Thruster Noise
      const bufLen = Math.floor(ctx.sampleRate * 1.8);
      const buf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
      const bData = buf.getChannelData(0);
      for (let i = 0; i < bufLen; i++) {
        bData[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.9));
      }
      const nSrc = ctx.createBufferSource();
      nSrc.buffer = buf;
      const nFilter = ctx.createBiquadFilter();
      nFilter.type = 'bandpass';
      nFilter.frequency.setValueAtTime(140, now);
      nFilter.frequency.exponentialRampToValueAtTime(1600, now + 1.2);
      nFilter.Q.setValueAtTime(2.5, now);
      const nGain = ctx.createGain();
      nGain.gain.setValueAtTime(0.08, now);
      nGain.gain.linearRampToValueAtTime(0.20, now + 0.4);
      nGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.8);
      nSrc.connect(nFilter);
      nFilter.connect(nGain);
      nGain.connect(ctx.destination);
      nSrc.start(now);
      nSrc.stop(now + 1.8);

      // 3. Hypersonic Ascent Jet Tone
      const jetOsc = ctx.createOscillator();
      const jetGain = ctx.createGain();
      jetOsc.type = 'sawtooth';
      jetOsc.frequency.setValueAtTime(110, now + 0.15);
      jetOsc.frequency.exponentialRampToValueAtTime(1480, now + 1.5);
      jetGain.gain.setValueAtTime(0.001, now);
      jetGain.gain.linearRampToValueAtTime(0.07, now + 0.35);
      jetGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.7);
      const jetFilter = ctx.createBiquadFilter();
      jetFilter.type = 'lowpass';
      jetFilter.frequency.setValueAtTime(800, now);
      jetFilter.frequency.exponentialRampToValueAtTime(2400, now + 1.4);
      jetOsc.connect(jetFilter);
      jetFilter.connect(jetGain);
      jetGain.connect(ctx.destination);
      jetOsc.start(now + 0.15);
      jetOsc.stop(now + 1.75);

      // 4. Zipper Unlatching Mechanical Clicks
      const clickCount = 14;
      for (let c = 0; c < clickCount; c++) {
        const cTime = now + 0.25 + c * 0.08;
        const cOsc = ctx.createOscillator();
        const cGain = ctx.createGain();
        cOsc.type = 'sine';
        cOsc.frequency.setValueAtTime(1200 + c * 45, cTime);
        cGain.gain.setValueAtTime(0.035, cTime);
        cGain.gain.exponentialRampToValueAtTime(0.0001, cTime + 0.025);
        cOsc.connect(cGain);
        cGain.connect(ctx.destination);
        cOsc.start(cTime);
        cOsc.stop(cTime + 0.03);
      }

      // 5. Celestial Portal Reveal Chime
      [528, 660, 792, 1056].forEach((f, idx) => {
        const chimeTime = now + 1.4 + idx * 0.08;
        const cOsc = ctx.createOscillator();
        const cGain = ctx.createGain();
        cOsc.type = 'sine';
        cOsc.frequency.setValueAtTime(f, chimeTime);
        cGain.gain.setValueAtTime(0.04, chimeTime);
        cGain.gain.exponentialRampToValueAtTime(0.0001, chimeTime + 0.55);
        cOsc.connect(cGain);
        cGain.connect(ctx.destination);
        cOsc.start(chimeTime);
        cOsc.stop(chimeTime + 0.6);
      });
    } catch (e) {}
  }

  startAmbientDrone() {
    if (!this.ctx || this.ambientDrone) return;
    try {
      const osc = this.ctx.createOscillator();
      const filter = this.ctx.createBiquadFilter();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(55, this.ctx.currentTime);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(120, this.ctx.currentTime);

      gain.gain.setValueAtTime(0.0001, this.ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.015, this.ctx.currentTime + 2.0);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      this.ambientDrone = { osc, gain };
    } catch (e) {}
  }

  stopAmbientDrone() {
    if (this.ambientDrone && this.ctx) {
      try {
        this.ambientDrone.gain.gain.linearRampToValueAtTime(0.0001, this.ctx.currentTime + 0.6);
        setTimeout(() => {
          if (this.ambientDrone) {
            this.ambientDrone.osc.stop();
            this.ambientDrone = null;
          }
        }, 700);
      } catch (e) {
        this.ambientDrone = null;
      }
    }
  }
}

export const audioEngine = new CosmicAudioEngine();
