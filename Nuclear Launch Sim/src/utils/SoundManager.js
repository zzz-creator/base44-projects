class SoundManager {
  constructor() {
    this.context = null;
    this.oscillators = [];
    this.gainNodes = [];
    this.initialized = false;
  }

  init() {
    if (!this.initialized) {
      try {
        // @ts-ignore
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        this.context = new AudioContext();
        this.initialized = true;
      } catch (e) {
        console.error('Web Audio API not supported', e);
      }
    }
    // Resume context if suspended (browser policy)
    if (this.context && this.context.state === 'suspended') {
      this.context.resume();
    }
  }

  playTone(freq, type, duration, volume = 0.1) {
    if (!this.initialized) this.init();
    if (!this.context) return;

    const osc = this.context.createOscillator();
    const gain = this.context.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.context.currentTime);
    
    gain.gain.setValueAtTime(volume, this.context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.context.currentTime + duration);

    osc.connect(gain);
    gain.connect(this.context.destination);

    osc.start();
    osc.stop(this.context.currentTime + duration);
  }

  playClick() {
    this.playTone(800, 'sine', 0.05, 0.05);
  }

  playAlarm() {
    this.playTone(440, 'square', 0.3, 0.1);
    setTimeout(() => this.playTone(300, 'square', 0.3, 0.1), 150);
  }

  // Siren effect for DEFCON 1
  playKlaxon() {
    if (!this.initialized) this.init();
    if (!this.context) return;

    const osc = this.context.createOscillator();
    const gain = this.context.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(400, this.context.currentTime);
    osc.frequency.linearRampToValueAtTime(800, this.context.currentTime + 1); // Rise
    osc.frequency.linearRampToValueAtTime(400, this.context.currentTime + 2); // Fall

    gain.gain.setValueAtTime(0.15, this.context.currentTime);
    gain.gain.linearRampToValueAtTime(0, this.context.currentTime + 2.5);

    osc.connect(gain);
    gain.connect(this.context.destination);

    osc.start();
    osc.stop(this.context.currentTime + 2.5);
  }
  
  playDefconChange(level) {
      if (level === 1) {
          this.playKlaxon();
      } else if (level <= 3) {
          this.playAlarm();
      } else {
          this.playClick();
      }
  }
}

export const soundManager = new SoundManager();
