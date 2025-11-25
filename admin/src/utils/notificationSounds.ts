// Notification sound utilities for Kitchen and Admin panels

// Generate different notification sounds using Web Audio API
export class NotificationSounds {
  private audioContext: AudioContext | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }

  // Play new order notification (Kitchen panel)
  playNewOrderSound() {
    if (!this.audioContext) return;

    const ctx = this.audioContext;
    const now = ctx.currentTime;

    // Create a pleasant "ding-ding" sound
    const oscillator1 = ctx.createOscillator();
    const oscillator2 = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator1.connect(gainNode);
    oscillator2.connect(gainNode);
    gainNode.connect(ctx.destination);

    // First ding (higher pitch)
    oscillator1.frequency.setValueAtTime(800, now);
    oscillator1.type = 'sine';
    gainNode.gain.setValueAtTime(0.3, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
    oscillator1.start(now);
    oscillator1.stop(now + 0.3);

    // Second ding (slightly lower pitch, delayed)
    oscillator2.frequency.setValueAtTime(600, now + 0.15);
    oscillator2.type = 'sine';
    oscillator2.start(now + 0.15);
    oscillator2.stop(now + 0.45);
  }

  // Play low stock alert (Admin panel)
  playLowStockAlert() {
    if (!this.audioContext) return;

    const ctx = this.audioContext;
    const now = ctx.currentTime;

    // Create an alert "beep-beep-beep" sound
    for (let i = 0; i < 3; i++) {
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      const startTime = now + (i * 0.2);
      oscillator.frequency.setValueAtTime(440, startTime);
      oscillator.type = 'square';
      
      gainNode.gain.setValueAtTime(0.2, startTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.15);
      
      oscillator.start(startTime);
      oscillator.stop(startTime + 0.15);
    }
  }

  // Play critical alert (for very low stock or urgent notifications)
  playCriticalAlert() {
    if (!this.audioContext) return;

    const ctx = this.audioContext;
    const now = ctx.currentTime;

    // Create an urgent siren-like sound
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.type = 'sawtooth';
    
    // Oscillate frequency for siren effect
    oscillator.frequency.setValueAtTime(300, now);
    oscillator.frequency.linearRampToValueAtTime(600, now + 0.2);
    oscillator.frequency.linearRampToValueAtTime(300, now + 0.4);
    oscillator.frequency.linearRampToValueAtTime(600, now + 0.6);
    
    gainNode.gain.setValueAtTime(0.15, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.7);
    
    oscillator.start(now);
    oscillator.stop(now + 0.7);
  }

  // Play success sound (for order completion)
  playSuccessSound() {
    if (!this.audioContext) return;

    const ctx = this.audioContext;
    const now = ctx.currentTime;

    // Create a pleasant ascending "success" sound
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(400, now);
    oscillator.frequency.linearRampToValueAtTime(600, now + 0.1);
    oscillator.frequency.linearRampToValueAtTime(800, now + 0.2);
    
    gainNode.gain.setValueAtTime(0.2, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
    
    oscillator.start(now);
    oscillator.stop(now + 0.3);
  }
}

// Singleton instance
export const notificationSounds = new NotificationSounds();
