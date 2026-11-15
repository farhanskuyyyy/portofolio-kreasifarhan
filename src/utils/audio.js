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
