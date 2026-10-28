/**
 * Web Audio API synthesizer for instant order notifications.
 * Produces a crisp, modern 3-tone cash-register / arrival chime.
 */
class SoundService {
  private ctx: AudioContext | null = null;

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public playOrderChime() {
    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      // 3 ascending harmonic notes: D5 (587Hz), F#5 (740Hz), A5 (880Hz), D6 (1175Hz)
      const notes = [
        { freq: 587.33, time: 0.0, dur: 0.15 },
        { freq: 739.99, time: 0.1, dur: 0.15 },
        { freq: 880.0, time: 0.2, dur: 0.2 },
        { freq: 1174.66, time: 0.32, dur: 0.45 }
      ];

      notes.forEach(({ freq, time, dur }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + time);

        gain.gain.setValueAtTime(0, now + time);
        gain.gain.linearRampToValueAtTime(0.25, now + time + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + time + dur);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + time);
        osc.stop(now + time + dur);
      });
    } catch {
      // Audio context might be restricted before interaction
    }
  }

  public async requestNotificationPermission(): Promise<boolean> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return false;
    }
    if (Notification.permission === 'granted') {
      return true;
    }
    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return false;
  }

  public triggerNativePush(title: string, body: string) {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    if (Notification.permission === 'granted') {
      try {
        new Notification(title, {
          body,
          badge: '/favicon.ico',
          tag: 'order-alert-' + Date.now()
        });
      } catch {
        // Fallback handled silently
      }
    }
  }
}

export const soundService = new SoundService();
