/**
 * BizGames — Système de Notifications Mobiles & PWA
 * Gère les autorisations navigateur, Service Worker, et les alertes quotidiennes (Streak & Rappels).
 */

/**
 * Vérifie si le navigateur supporte les notifications
 */
export function isNotificationSupported() {
  if (typeof window === 'undefined') return false;
  return 'Notification' in window || ('serviceWorker' in navigator && 'PushManager' in window);
}

/**
 * Détecte si l'appareil est un iPhone / iPad (iOS)
 */
export function isIosDevice() {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  );
}

/**
 * Détecte si l'application est installée en mode autonome (PWA / Écran d'accueil)
 */
export function isPwaInstalled() {
  if (typeof window === 'undefined') return false;
  return (
    window.navigator.standalone === true ||
    window.matchMedia('(display-mode: standalone)').matches ||
    window.matchMedia('(display-mode: fullscreen)').matches
  );
}

/**
 * Récupère le statut complet des notifications pour diagnostic
 */
export async function getNotificationDiagnostic() {
  const supported = isNotificationSupported();
  const ios = isIosDevice();
  const pwa = isPwaInstalled();
  const permission = typeof window !== 'undefined' && 'Notification' in window
    ? Notification.permission
    : 'unsupported';

  let swActive = false;
  if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      swActive = Boolean(reg && reg.active);
    } catch (e) {
      swActive = false;
    }
  }

  return {
    supported,
    permission,
    isIos: ios,
    isPwa: pwa,
    swActive,
    canReceivePush: permission === 'granted' && (swActive || !ios || pwa),
  };
}

/**
 * Demande l'autorisation pour les notifications Web Push
 */
export async function requestNotificationPermission() {
  if (!isNotificationSupported()) {
    return { success: false, reason: 'unsupported', message: 'Les notifications ne sont pas supportées par votre navigateur.' };
  }

  // Cas spécifique iOS : Apple requiert iOS 16.4+ et l'installation sur l'écran d'accueil
  if (isIosDevice() && !isPwaInstalled() && !('Notification' in window)) {
    return {
      success: false,
      reason: 'ios_pwa_required',
      message: 'Sur iPhone, appuyez sur Partager ⎋ puis "Sur l\'écran d\'accueil" pour activer les notifications (iOS 16.4+).',
    };
  }

  try {
    let perm = 'default';
    if ('Notification' in window) {
      perm = await Notification.requestPermission();
    } else if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.ready;
      if (reg && reg.pushManager) {
        perm = await Notification.requestPermission();
      }
    }

    if (perm === 'granted') {
      return { success: true, permission: perm, message: 'Notifications activées avec succès !' };
    } else if (perm === 'denied') {
      return { success: false, reason: 'denied', permission: perm, message: 'Notifications bloquées dans les paramètres de votre navigateur.' };
    } else {
      return { success: false, reason: 'dismissed', permission: perm, message: 'Autorisation fermée ou non accordée.' };
    }
  } catch (err) {
    console.warn('[Notifications] Erreur demande permission :', err);
    return { success: false, reason: 'error', error: err.message, message: 'Erreur lors de la demande d’autorisation.' };
  }
}

/**
 * Envoie une notification via le Service Worker (compatible Android Chrome, iOS 16.4 PWA & Desktop)
 */
export async function sendAppNotification({
  title = 'BizGames 🌍',
  body = 'Les 5 nouvelles questions du jour sont disponibles !',
  tag = 'bizgames-alert',
  icon = '/icons/icon-192.png',
  badge = '/icons/favicon-64.png',
  vibrate = [150, 80, 150],
  url = '/',
}) {
  if (typeof window === 'undefined') return false;

  if ('Notification' in window && Notification.permission !== 'granted') {
    console.warn('[Notifications] Permission non accordée :', Notification.permission);
    return false;
  }

  const options = {
    body,
    icon,
    badge,
    vibrate,
    tag,
    renotify: true,
    data: { url },
    actions: [
      { action: 'play', title: '🎮 Jouer maintenant' },
      { action: 'close', title: 'Fermer' },
    ],
  };

  // 1. Méthode standard & obligatoire sur Mobile : ServiceWorkerRegistration.showNotification()
  if ('serviceWorker' in navigator) {
    try {
      const reg = await navigator.serviceWorker.ready;
      if (reg && typeof reg.showNotification === 'function') {
        await reg.showNotification(title, options);
        return true;
      }
    } catch (swErr) {
      console.warn('[Notifications] Erreur via Service Worker ready :', swErr);
    }

    // Tentative via postMessage vers le Service Worker actif
    try {
      if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'SHOW_NOTIFICATION',
          title,
          options,
        });
        return true;
      }
    } catch (msgErr) {
      console.warn('[Notifications] Erreur via postMessage SW :', msgErr);
    }
  }

  // 2. Fallback pour desktop si le Service Worker n'est pas encore prêt
  if ('Notification' in window) {
    try {
      new Notification(title, {
        body: options.body,
        icon: options.icon,
        tag: options.tag,
      });
      return true;
    } catch (e) {
      console.warn('[Notifications] Notification constructeur échoué (normal sur Android/iOS mobile) :', e);
    }
  }

  return false;
}

/**
 * Vérifie et déclenche les rappels programmés (Rappel Quotidien et Alerte Streak)
 */
export async function checkScheduledReminders({
  preferences = {},
  alreadyPlayed = false,
  streakCount = 0,
}) {
  if (typeof window === 'undefined') return;
  if (!isNotificationSupported()) return;
  if (typeof Notification !== 'undefined' && Notification.permission !== 'granted') return;

  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const currentHours = now.getHours();
  const currentMinutes = now.getMinutes();

  // 1. RAPPEL QUOTIDIEN (Heure configurée par le joueur, par défaut 09:00)
  if (preferences.dailyReminder && !alreadyPlayed) {
    const scheduledHourStr = preferences.dailyReminderHour || '09:00';
    const [targetH, targetM] = scheduledHourStr.split(':').map((n) => parseInt(n, 10) || 0);

    const isPastScheduledTime =
      currentHours > targetH || (currentHours === targetH && currentMinutes >= targetM);

    const lastDailyRemindedDate = localStorage.getItem('bizgames_notif_last_daily_date');

    if (isPastScheduledTime && lastDailyRemindedDate !== todayStr) {
      localStorage.setItem('bizgames_notif_last_daily_date', todayStr);
      await sendAppNotification({
        title: 'BizGames 🌍 Rappel Quotidien',
        body: 'Les 5 questions business du jour vous attendent ! Testez votre culture économique.',
        tag: 'bizgames-daily-reminder',
        url: '/',
      });
    }
  }

  // 2. ALERTE ANTI-PERTE DE SÉRIE (STREAK 🔥) à 20h00
  if (preferences.streakAlert && !alreadyPlayed && Number(streakCount) > 0) {
    const lastStreakRemindedDate = localStorage.getItem('bizgames_notif_last_streak_date');
    if (currentHours >= 20 && lastStreakRemindedDate !== todayStr) {
      localStorage.setItem('bizgames_notif_last_streak_date', todayStr);
      await sendAppNotification({
        title: `🔥 Alerte Série BizGames : ${streakCount} jour${streakCount > 1 ? 's' : ''} en jeu !`,
        body: 'Plus que quelques heures avant minuit pour valider votre round et préserver votre flamme !',
        tag: 'bizgames-streak-alert',
        url: '/',
      });
    }
  }
}

/**
 * Démarre le planificateur local périodique
 */
export function startReminderScheduler(getParams) {
  if (typeof window === 'undefined') return () => {};

  const runCheck = () => {
    try {
      const params = typeof getParams === 'function' ? getParams() : {};
      checkScheduledReminders(params);
    } catch (e) {
      console.warn('[Notifications] Erreur dans le planificateur de rappel :', e);
    }
  };

  // Exécuter immédiatement au lancement
  runCheck();

  // Puis toutes les 60 secondes tant que l'application est ouverte
  const intervalId = setInterval(runCheck, 60000);

  return () => clearInterval(intervalId);
}
