/** Original, locally synthesized relaxation soundscapes. No audio downloads required. */
export type Soundscape = 'rain' | 'forest' | 'piano';

export class AmbientSound {
  private context: AudioContext | null = null;
  private nodes: AudioNode[] = [];
  private sources: AudioScheduledSourceNode[] = [];
  private timers: number[] = [];

  async start(kind: Soundscape = 'rain'): Promise<void> {
    this.stop();
    const Ctor = window.AudioContext;
    if (!Ctor) throw new Error('Web Audio is unavailable');
    const ctx = new Ctor();
    this.context = ctx;
    try {
      const master = ctx.createGain();
      master.gain.value = 0;
      master.connect(ctx.destination);
      this.nodes.push(master);
      if (kind === 'piano') this.playPiano(ctx, master);
      else this.playNature(ctx, master, kind);
      await ctx.resume();
      if (this.context !== ctx) return;
      master.gain.setTargetAtTime(0.7, ctx.currentTime, 1.2);
    } catch (error) {
      this.stop();
      throw error;
    }
  }

  private playNature(ctx: AudioContext, output: AudioNode, kind: 'rain' | 'forest'): void {
    const seconds = 4;
    const buffer = ctx.createBuffer(1, ctx.sampleRate * seconds, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    // Smoothed noise makes gentle rain or wind rather than a harsh hiss.
    let smooth = 0;
    for (let i = 0; i < data.length; i++) {
      const white = Math.random() * 2 - 1;
      smooth = smooth * (kind === 'rain' ? 0.78 : 0.985) + white * (kind === 'rain' ? 0.22 : 0.015);
      data[i] = smooth;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = kind === 'rain' ? 1800 : 650;
    const volume = ctx.createGain();
    volume.gain.value = kind === 'rain' ? 0.35 : 0.65;
    noise.connect(filter);
    filter.connect(volume);
    volume.connect(output);
    noise.start();
    this.sources.push(noise);
    this.nodes.push(noise, filter, volume);

    if (kind === 'forest') {
      // Sparse, gentle bird-like chirps above the wind.
      const chirp = () => {
        if (this.context !== ctx) return;
        const start = ctx.currentTime + 0.02;
        const osc = ctx.createOscillator();
        const envelope = ctx.createGain();
        const frequency = 950 + Math.random() * 550;
        osc.type = 'sine';
        osc.frequency.setValueAtTime(frequency, start);
        osc.frequency.exponentialRampToValueAtTime(frequency * 1.25, start + 0.12);
        osc.frequency.exponentialRampToValueAtTime(frequency * 0.92, start + 0.36);
        envelope.gain.setValueAtTime(0.0001, start);
        envelope.gain.exponentialRampToValueAtTime(0.018, start + 0.05);
        envelope.gain.exponentialRampToValueAtTime(0.0001, start + 0.4);
        osc.connect(envelope);
        envelope.connect(output);
        osc.start(start);
        osc.stop(start + 0.42);
        osc.onended = () => { osc.disconnect(); envelope.disconnect(); };
        this.sources.push(osc);
      };
      chirp();
      this.timers.push(window.setInterval(chirp, 3600));
    }
  }

  private playPiano(ctx: AudioContext, output: AudioNode): void {
    // Original repeating pentatonic phrase with a soft plucked envelope.
    const notes = [261.63, 329.63, 392, 523.25, 440, 392, 329.63, 293.66];
    let index = 0;
    const play = () => {
      if (this.context !== ctx) return;
      const start = ctx.currentTime + 0.02;
      const frequency = notes[index % notes.length];
      index++;
      [1, 2].forEach((harmonic, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = frequency * harmonic;
        gain.gain.setValueAtTime(0.0001, start);
        gain.gain.exponentialRampToValueAtTime(i === 0 ? 0.095 : 0.018, start + 0.025);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + 2.3);
        osc.connect(gain);
        gain.connect(output);
        osc.start(start);
        osc.stop(start + 2.35);
        osc.onended = () => { osc.disconnect(); gain.disconnect(); };
        this.sources.push(osc);
      });
    };
    play();
    this.timers.push(window.setInterval(play, 1250));
  }

  stop(): void {
    this.timers.forEach(id => window.clearInterval(id));
    this.timers = [];
    this.sources.forEach(source => {
      try { source.stop(); } catch { /* already stopped */ }
      try { source.disconnect(); } catch { /* already disconnected */ }
    });
    this.sources = [];
    this.nodes.forEach(node => { try { node.disconnect(); } catch { /* noop */ } });
    this.nodes = [];
    const ctx = this.context;
    this.context = null;
    if (ctx) void ctx.close().catch(() => undefined);
  }
}
