import confetti from 'canvas-confetti';

/**
 * Play a short success sound when a sub-topic completes.
 */
export function playSuccessSound(): void {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();

    const osc1 = audioCtx.createOscillator();
    const gain1 = audioCtx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(880, audioCtx.currentTime);
    gain1.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
    osc1.connect(gain1);
    gain1.connect(audioCtx.destination);
    osc1.start(audioCtx.currentTime);
    osc1.stop(audioCtx.currentTime + 0.3);

    const osc2 = audioCtx.createOscillator();
    const gain2 = audioCtx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1175, audioCtx.currentTime + 0.1);
    gain2.gain.setValueAtTime(0, audioCtx.currentTime);
    gain2.gain.setValueAtTime(0.3, audioCtx.currentTime + 0.1);
    gain2.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
    osc2.connect(gain2);
    gain2.connect(audioCtx.destination);
    osc2.start(audioCtx.currentTime + 0.1);
    osc2.stop(audioCtx.currentTime + 0.5);

    setTimeout(() => audioCtx.close(), 600);
  } catch {
    // Audio not available
  }
}

/**
 * Final celebration when ALL sub-topics are done.
 * Plays ding first, then a single cannon burst from bottom center after 10ms.
 */
export function celebrateAllComplete(): void {
  playSuccessSound();
  setTimeout(() => {
    confetti({
      particleCount: 150,
      spread: 60,
      origin: { x: 0.5, y: 1 },
      colors: ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ec4899', '#ffffff'],
      startVelocity: 65,
      gravity: 1.2,
      ticks: 75,
    });
  }, 10);
}
