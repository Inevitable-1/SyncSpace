const STORAGE_KEY = 'syncspace-intro-muted';

class AudioEngine {
  private static _inst: AudioEngine | null = null;

  static get(): AudioEngine {
    if (!AudioEngine._inst) AudioEngine._inst = new AudioEngine();
    return AudioEngine._inst;
  }

  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private noiseBuf: AudioBuffer | null = null;
  private _muted: boolean;
  private _droneOn = false;
  private _droneStops: Array<() => void> = [];

  constructor() {
    this._muted = (() => {
      try {
        return localStorage.getItem(STORAGE_KEY) === '1';
      } catch {
        return false;
      }
    })();
  }

  get muted(): boolean {
    return this._muted;
  }

  private ensure(): AudioContext | null {
    if (this.ctx) return this.ctx;
    try {
      const AC =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) return null;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = this._muted ? 0 : 1;
      this.master.connect(this.ctx.destination);
    } catch {
      this.ctx = null;
    }
    return this.ctx;
  }

  async start(): Promise<void> {
    const ctx = this.ensure();
    if (ctx && ctx.state === 'suspended') {
      try {
        await ctx.resume();
      } catch {
        /* autoplay policy may still block */
      }
    }
  }

  setMuted(m: boolean): void {
    this._muted = m;
    if (this.master && this.ctx) {
      this.master.gain.setTargetAtTime(m ? 0 : 1, this.ctx.currentTime, 0.05);
    }
    try {
      localStorage.setItem(STORAGE_KEY, m ? '1' : '0');
    } catch {
      /* ignore */
    }
  }

  toggleMuted(): boolean {
    this.setMuted(!this._muted);
    return this._muted;
  }

  private getNoise(): AudioBuffer | null {
    if (!this.ctx) return null;
    if (this.noiseBuf) return this.noiseBuf;
    const len = Math.floor(this.ctx.sampleRate * 2);
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    this.noiseBuf = buf;
    return buf;
  }

  private output(): { ctx: AudioContext; master: GainNode } | null {
    if (!this.ctx || !this.master) return null;
    return { ctx: this.ctx, master: this.master };
  }

  heartbeat(at = 0): void {
    const o = this.output();
    if (!o) return;
    const { ctx, master } = o;
    const thump = (freq: number, gain: number, decay: number) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, at);
      g.gain.setValueAtTime(0.0001, at);
      g.gain.exponentialRampToValueAtTime(gain, at + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, at + decay);
      osc.connect(g).connect(master);
      osc.start(at);
      osc.stop(at + decay + 0.05);
    };
    thump(66, 0.85, 0.3);
    thump(50, 0.4, 0.5);
  }

  whoosh(at = 0): void {
    const o = this.output();
    if (!o) return;
    const { ctx, master } = o;
    const buf = this.getNoise();
    if (!buf) return;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.Q.value = 1.3;
    bp.frequency.setValueAtTime(180, at);
    bp.frequency.exponentialRampToValueAtTime(2600, at + 0.5);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, at);
    g.gain.exponentialRampToValueAtTime(0.32, at + 0.18);
    g.gain.exponentialRampToValueAtTime(0.0001, at + 0.9);
    src.connect(bp).connect(g).connect(master);
    src.start(at);
    src.stop(at + 1);
  }

  chime(at = 0): void {
    const o = this.output();
    if (!o) return;
    const { ctx, master } = o;
    const base = 523.25;
    [1, 1.5, 2, 2.6].forEach((mult, idx) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = base * mult;
      const t0 = at + idx * 0.05;
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(0.1 / (idx + 1), t0 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + 2.4);
      osc.connect(g).connect(master);
      osc.start(t0);
      osc.stop(t0 + 2.5);
    });
  }

  startDrone(at = 0): void {
    const o = this.output();
    if (!o || this._droneOn) return;
    this._droneOn = true;
    const { ctx, master } = o;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, at);
    g.gain.exponentialRampToValueAtTime(0.045, at + 2.2);
    g.connect(master);
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 320;
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.08;
    const lfoG = ctx.createGain();
    lfoG.gain.value = 90;
    lfo.connect(lfoG).connect(lp.frequency);
    lfo.start(at);
    this._droneStops.push(() => {
      lfo.stop();
      g.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.4);
    });
    [55, 55.6, 110.4, 165.2].forEach((f) => {
      const osc = ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.value = f;
      osc.connect(lp).connect(g);
      osc.start(at);
      this._droneStops.push(() => {
        osc.stop();
        osc.disconnect();
      });
    });
  }

  stopDrone(): void {
    if (!this._droneOn) return;
    this._droneOn = false;
    for (const stop of this._droneStops) {
      try {
        stop();
      } catch {
        /* ignore */
      }
    }
    this._droneStops = [];
  }

  dispose(): void {
    try {
      void this.ctx?.close();
    } catch {
      /* ignore */
    }
    this.ctx = null;
    this.master = null;
  }
}

export const audio = AudioEngine.get();
