/**
 * Subtle tactile web-audio click synthesizer
 * Zero external audio assets, works instantly in browser
 */

class SoundController {
  private audioCtx: AudioContext | null = null;
  public enabled: boolean = false;

  private initContext() {
    if (!this.audioCtx && typeof window !== 'undefined') {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtxClass) {
        this.audioCtx = new AudioCtxClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  playKeyClick(pitch: number = 800, duration: number = 0.02) {
    if (!this.enabled) return;
    try {
      this.initContext();
      if (!this.audioCtx) return;

      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(pitch, this.audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(pitch * 0.4, this.audioCtx.currentTime + duration);

      gain.gain.setValueAtTime(0.04, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + duration);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start();
      osc.stop(this.audioCtx.currentTime + duration);
    } catch {
      // AudioContext muted or blocked by browser policy
    }
  }

  playActionSound() {
    this.playKeyClick(1200, 0.04);
  }

  playEqualSound() {
    this.playKeyClick(950, 0.05);
  }

  playClearSound() {
    this.playKeyClick(450, 0.03);
  }
}

export const soundManager = new SoundController();
