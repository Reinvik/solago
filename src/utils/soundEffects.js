/**
 * Utilidad de Sonido para el Escáner de Código de Barras y Acciones del POS
 * Utiliza Web Audio API (nativo en todos los navegadores, 0 latencia, funciona 100% offline)
 */

let audioCtx = null;

const getAudioContext = () => {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
};

// Obtener preferencia de sonido del usuario desde localStorage
export const isSoundEnabled = () => {
  try {
    const saved = localStorage.getItem('solago_pos_sound_enabled');
    return saved === null ? true : saved === 'true';
  } catch (e) {
    return true;
  }
};

export const setSoundEnabled = (enabled) => {
  try {
    localStorage.setItem('solago_pos_sound_enabled', enabled ? 'true' : 'false');
  } catch (e) {}
};

/**
 * Reproduce diferentes tipos de sonidos sintetizados en tiempo real
 * @param {'scan' | 'payment' | 'error' | 'click' | 'delete'} type
 */
export const playSound = (type = 'scan') => {
  if (!isSoundEnabled()) return;

  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'scan') {
      // Pitido corto de escáner POS profesional (1250 Hz, 75ms)
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1250, now);
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.075);
      osc.start(now);
      osc.stop(now + 0.075);
    } else if (type === 'payment') {
      // Campana de cobro exitoso (acorde ascendente doble)
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.exponentialRampToValueAtTime(1760, now + 0.12);
      gain.gain.setValueAtTime(0.22, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
      osc.start(now);
      osc.stop(now + 0.28);
    } else if (type === 'error') {
      // Tono de alerta/error grave (frecuencia descendente)
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.linearRampToValueAtTime(200, now + 0.18);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
      osc.start(now);
      osc.stop(now + 0.18);
    } else if (type === 'delete') {
      // Tono sutil de eliminación
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.linearRampToValueAtTime(220, now + 0.08);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      osc.start(now);
      osc.stop(now + 0.08);
    } else {
      // Click ligero
      osc.type = 'sine';
      osc.frequency.setValueAtTime(900, now);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
      osc.start(now);
      osc.stop(now + 0.04);
    }
  } catch (e) {
    // Silencioso si no hay soporte de audio
  }
};
