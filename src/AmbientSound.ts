/** Small original ambient soundscape synthesized locally with Web Audio. */
export class AmbientSound {
  private context: AudioContext | null = null;
  private oscillators: OscillatorNode[] = [];
  private master: GainNode | null = null;

  async start(): Promise<void> {
    this.stop();
    const AudioContextCtor = window.AudioContext;
    if (!AudioContextCtor) throw new Error('Web Audio is unavailable');
    const context = new AudioContextCtor();
    this.context = context;
    const master = context.createGain();
    master.gain.value = 0;
    master.connect(context.destination);
    this.master = master;
    const frequencies = [174.61, 261.63, 349.23];
    frequencies.forEach((frequency, index) => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.value = frequency;
      gain.gain.value = [0.035, 0.018, 0.009][index];
      oscillator.connect(gain);
      gain.connect(master);
      oscillator.start();
      this.oscillators.push(oscillator);
    });
    await context.resume();
    master.gain.setTargetAtTime(0.8, context.currentTime, 1.5);
  }

  stop(): void {
    const context = this.context;
    if (!context) return;
    this.oscillators.forEach(oscillator => {
      try { oscillator.stop(); } catch { /* already stopped */ }
      oscillator.disconnect();
    });
    this.oscillators = [];
    this.master?.disconnect();
    this.master = null;
    this.context = null;
    void context.close().catch(() => undefined);
  }
}
