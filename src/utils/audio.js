/**
 * Moteur Audio & Synthétiseur Web Audio Pro pour BizGames
 * 100% autonome, zéro dépendance externe, latence nulle, compatible tous navigateurs et mobiles.
 */

let audioCtx = null;

function getAudioContext() {
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
}

/**
 * Vérifie si le son est activé dans les préférences locales
 */
export function isSoundEnabled() {
  if (typeof window === 'undefined') return true;
  try {
    const val = localStorage.getItem('bizgames_sound_enabled');
    return val === null ? true : val === 'true';
  } catch (e) {
    return true;
  }
}

/**
 * Active ou désactive le son
 */
export function setSoundEnabled(enabled) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('bizgames_sound_enabled', enabled ? 'true' : 'false');
  } catch (e) {}
}

/**
 * Clic d'interface standard (boutons, onglets)
 */
export function playClickSound() {
  if (!isSoundEnabled()) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(560, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(280, ctx.currentTime + 0.04);

    gain.gain.setValueAtTime(0.06, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.04);
  } catch (e) {}
}

/**
 * Son de placement du repère sur la carte (Pin Drop)
 * Impact doux, boisé et précis qui confirme que le pointeur a été posé
 */
export function playPinDropSound() {
  if (!isSoundEnabled()) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    // Petite onde percussive (click aigu)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(880, now);
    osc1.frequency.exponentialRampToValueAtTime(440, now + 0.05);
    gain1.gain.setValueAtTime(0.08, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.05);

    // Résonance douce (onde sinusoïdale chaude)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(320, now + 0.01);
    osc2.frequency.exponentialRampToValueAtTime(160, now + 0.09);
    gain2.gain.setValueAtTime(0.09, now + 0.01);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.01);
    osc2.stop(now + 0.09);
  } catch (e) {}
}

/**
 * Son de tir / validation de coordonnées ("Valider mon tir")
 * Balayage dynamique montant avec impulsion radar / laser futuriste
 */
export function playShotSound() {
  if (!isSoundEnabled()) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    // Balayage ascendant rapide (lancement du tir)
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(1100, now + 0.12);

    // Filtre passe-bas pour arrondir le son (chaleur acoustique)
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2400, now);
    filter.frequency.exponentialRampToValueAtTime(800, now + 0.14);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.14);

    // Bip radar de verrouillage de la cible
    const radarOsc = ctx.createOscillator();
    const radarGain = ctx.createGain();
    radarOsc.type = 'sine';
    radarOsc.frequency.setValueAtTime(1400, now + 0.08);
    radarOsc.frequency.exponentialRampToValueAtTime(1800, now + 0.16);

    radarGain.gain.setValueAtTime(0.08, now + 0.08);
    radarGain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

    radarOsc.connect(radarGain);
    radarGain.connect(ctx.destination);

    radarOsc.start(now + 0.08);
    radarOsc.stop(now + 0.16);
  } catch (e) {}
}

/**
 * Son de tir parfait (score >= 900 ou distance <= 100 km)
 * Carillon cristallin ascendant et étincelant (Arpège majeur doré)
 */
export function playPerfectScoreSound() {
  if (!isSoundEnabled()) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    // Arpège C5, E5, G5, B5, C6 avec harmoniques riches
    const freqs = [523.25, 659.25, 783.99, 987.77, 1046.5];

    freqs.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + i * 0.045);

      gain.gain.setValueAtTime(0.12, now + i * 0.045);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.045 + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + i * 0.045);
      osc.stop(now + i * 0.045 + 0.35);
    });
  } catch (e) {}
}

/**
 * Son de bon tir (score >= 600)
 * Triade harmonieuse chaleureuse (D5, F#5, A5)
 */
export function playGoodScoreSound() {
  if (!isSoundEnabled()) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const freqs = [587.33, 739.99, 880.0]; // D5, F#5, A5

    freqs.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + i * 0.06);

      gain.gain.setValueAtTime(0.1, now + i * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.06 + 0.28);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + i * 0.06);
      osc.stop(now + i * 0.06 + 0.28);
    });
  } catch (e) {}
}

/**
 * Son de tir éloigné ou imprécis (score < 600)
 * Sonorité douce en deux temps (pas punitive, mais informative)
 */
export function playMissScoreSound() {
  if (!isSoundEnabled()) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(370, now);
    osc.frequency.exponentialRampToValueAtTime(260, now + 0.18);

    gain.gain.setValueAtTime(0.09, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.18);
  } catch (e) {}
}

/**
 * Joue le son de révélation adapté en fonction du score obtenu
 */
export function playScoreRevealSound(score, distanceKm) {
  if (score >= 900 || (typeof distanceKm === 'number' && distanceKm <= 100)) {
    playPerfectScoreSound();
  } else if (score >= 600 || (typeof distanceKm === 'number' && distanceKm <= 500)) {
    playGoodScoreSound();
  } else {
    playMissScoreSound();
  }
}

/**
 * Son de transition / question suivante
 * Whoosh aérien rapide
 */
export function playNextQuestionSound() {
  if (!isSoundEnabled()) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(640, now + 0.08);

    gain.gain.setValueAtTime(0.07, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.08);
  } catch (e) {}
}

/**
 * Fanfare de fin de partie / Victoire (Summary Modal)
 * Grande mélodie triomphale de célébration des 5 questions
 */
export function playGameOverFanfare(isHighRank = true) {
  if (!isSoundEnabled()) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    if (isHighRank) {
      // Fanfare victorieuse éclatante (7 notes rythmées)
      // C5 (0s), E5 (0.09s), G5 (0.18s), C6 (0.28s), G5 (0.42s), C6 (0.54s) accord final
      const melody = [
        { freq: 523.25, time: 0, dur: 0.12, vol: 0.11 },
        { freq: 659.25, time: 0.1, dur: 0.12, vol: 0.12 },
        { freq: 783.99, time: 0.2, dur: 0.14, vol: 0.13 },
        { freq: 1046.5, time: 0.32, dur: 0.22, vol: 0.15 },
        { freq: 783.99, time: 0.52, dur: 0.12, vol: 0.12 },
        { freq: 1046.5, time: 0.64, dur: 0.45, vol: 0.16 },
        { freq: 1318.51, time: 0.64, dur: 0.45, vol: 0.12 }, // Tierce supérieure harmonique (E6)
      ];

      melody.forEach((n) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(n.freq, now + n.time);

        gain.gain.setValueAtTime(n.vol, now + n.time);
        gain.gain.exponentialRampToValueAtTime(0.001, now + n.time + n.dur);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + n.time);
        osc.stop(now + n.time + n.dur);
      });
    } else {
      // Fin de partie normale (4 notes chaleureuses)
      const melody = [
        { freq: 440.0, time: 0, dur: 0.12, vol: 0.09 },
        { freq: 554.37, time: 0.1, dur: 0.12, vol: 0.1 },
        { freq: 659.25, time: 0.2, dur: 0.14, vol: 0.11 },
        { freq: 880.0, time: 0.32, dur: 0.35, vol: 0.13 },
      ];

      melody.forEach((n) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(n.freq, now + n.time);

        gain.gain.setValueAtTime(n.vol, now + n.time);
        gain.gain.exponentialRampToValueAtTime(0.001, now + n.time + n.dur);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + n.time);
        osc.stop(now + n.time + n.dur);
      });
    }
  } catch (e) {}
}

/**
 * Son de copie de résultat (Partage)
 */
export function playCopySound() {
  if (!isSoundEnabled()) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(600, now);
    gain1.gain.setValueAtTime(0.07, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.05);

    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(900, now + 0.06);
    gain2.gain.setValueAtTime(0.08, now + 0.06);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.06);
    osc2.stop(now + 0.12);
  } catch (e) {}
}

/**
 * Son d'activation / bascule de paramètre
 */
export function playSwitchSound() {
  if (!isSoundEnabled()) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.06);

    gain.gain.setValueAtTime(0.07, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.06);
  } catch (e) {}
}

/**
 * Son de succès générique
 */
export function playSuccessSound() {
  playPerfectScoreSound();
}

/**
 * ============================================================================
 * AMBIANCE MUSICALE DU JEU (SONO 1 & SONO 2)
 * Joue uniquement lorsque la carte / globe est visible à l'écran.
 * S'arrête immédiatement et en douceur dès que le joueur quitte la carte.
 * ============================================================================
 */
const AMBIENT_TRACKS = [
  '/audio/sono1.mp3',
  '/audio/sono2.mp3',
];

const AMBIENT_TARGET_VOLUME = 0.28;
let ambientAudio = null;
let currentTrackIndex = 0;
let isAmbianceRequested = false;
let fadeInterval = null;
let unlockListenerAttached = false;

function setupAmbientAudio() {
  if (typeof window === 'undefined') return null;
  if (!ambientAudio) {
    ambientAudio = new Audio();
    ambientAudio.preload = 'auto';
    ambientAudio.volume = 0;

    // Enchaîner sur la piste suivante (sono1 -> sono2 -> sono1 ...)
    ambientAudio.addEventListener('ended', () => {
      if (!isAmbianceRequested) return;
      currentTrackIndex = (currentTrackIndex + 1) % AMBIENT_TRACKS.length;
      ambientAudio.src = AMBIENT_TRACKS[currentTrackIndex];
      ambientAudio.volume = AMBIENT_TARGET_VOLUME;
      ambientAudio.play().catch(() => {});
    });
  }
  return ambientAudio;
}

/**
 * Démarre l'ambiance musicale (sono1 & sono2) quand la carte est visible
 */
export function startAmbientMusic() {
  if (typeof window === 'undefined') return;
  if (!isSoundEnabled()) return;

  isAmbianceRequested = true;
  const audio = setupAmbientAudio();
  if (!audio) return;

  if (fadeInterval) {
    clearInterval(fadeInterval);
    fadeInterval = null;
  }

  // Si déjà en lecture de la bonne piste, réajuster simplement le volume
  if (!audio.paused && audio.src && audio.volume >= AMBIENT_TARGET_VOLUME - 0.05) {
    return;
  }

  // Définir la piste si non initialisée
  if (!audio.src || audio.src === '' || audio.src.endsWith('/')) {
    audio.src = AMBIENT_TRACKS[currentTrackIndex];
  }

  // Tenter le lancement avec un fade-in progressif
  audio.volume = 0.05;
  const playPromise = audio.play();

  if (playPromise !== undefined) {
    playPromise
      .then(() => {
        // Fondu montant (fade-in) jusqu'à AMBIENT_TARGET_VOLUME
        let vol = 0.05;
        fadeInterval = setInterval(() => {
          if (!ambientAudio || !isAmbianceRequested) {
            clearInterval(fadeInterval);
            return;
          }
          vol = Math.min(AMBIENT_TARGET_VOLUME, vol + 0.03);
          ambientAudio.volume = vol;
          if (vol >= AMBIENT_TARGET_VOLUME) {
            clearInterval(fadeInterval);
            fadeInterval = null;
          }
        }, 60);
      })
      .catch((err) => {
        // Si le navigateur bloque l'autoplay sans interaction préalable, écouter le premier clic
        if (!unlockListenerAttached) {
          unlockListenerAttached = true;
          const unlock = () => {
            if (isAmbianceRequested && isSoundEnabled() && ambientAudio) {
              ambientAudio.volume = AMBIENT_TARGET_VOLUME;
              ambientAudio.play().catch(() => {});
            }
            window.removeEventListener('pointerdown', unlock);
            window.removeEventListener('click', unlock);
            unlockListenerAttached = false;
          };
          window.addEventListener('pointerdown', unlock, { once: true });
          window.addEventListener('click', unlock, { once: true });
        }
      });
  }
}

/**
 * Arrête l'ambiance musicale dès que la carte n'est plus affichée
 * @param {boolean} fade - Effectue un fondu descendant doux si true
 */
export function stopAmbientMusic(fade = true) {
  if (typeof window === 'undefined') return;
  isAmbianceRequested = false;

  if (!ambientAudio) return;

  if (fadeInterval) {
    clearInterval(fadeInterval);
    fadeInterval = null;
  }

  if (!fade || ambientAudio.paused) {
    try {
      ambientAudio.pause();
      ambientAudio.currentTime = 0;
      ambientAudio.volume = 0;
    } catch (e) {}
    return;
  }

  // Fondu descendant doux (fade-out) sur ~300ms
  try {
    let vol = ambientAudio.volume;
    fadeInterval = setInterval(() => {
      if (!ambientAudio) {
        clearInterval(fadeInterval);
        return;
      }
      vol = Math.max(0, vol - 0.05);
      ambientAudio.volume = vol;
      if (vol <= 0.01) {
        clearInterval(fadeInterval);
        fadeInterval = null;
        ambientAudio.pause();
        ambientAudio.currentTime = 0;
        ambientAudio.volume = 0;
      }
    }, 40);
  } catch (e) {
    ambientAudio.pause();
    ambientAudio.currentTime = 0;
  }
}

