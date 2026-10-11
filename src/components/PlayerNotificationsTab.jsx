import React, { useState, useEffect } from 'react';
import {
  Bell,
  Mail,
  Share2,
  Calendar,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Clock,
  Send,
  MessageCircle,
  Loader2,
  ExternalLink,
  ShieldCheck,
  Check,
  Smartphone,
  Info,
  RefreshCw,
  AlertTriangle,
  Zap,
} from 'lucide-react';
import { updateUserNotificationPreferences } from '../services/firebase';
import {
  isNotificationSupported,
  isIosDevice,
  isPwaInstalled,
  getNotificationDiagnostic,
  requestNotificationPermission,
  sendAppNotification,
} from '../utils/notifications';

export default function PlayerNotificationsTab({
  user,
  stats,
  isUserLoggedIn,
  lang = 'fr',
  onOpenAuth,
}) {
  const currentUid = user?.uid;

  // Récupération des préférences initiales depuis stats Firestore ou localStorage
  const getInitialPrefs = () => {
    let savedLocal = null;
    try {
      const stored = localStorage.getItem(`bizgames_notif_${currentUid || 'guest'}`);
      if (stored) savedLocal = JSON.parse(stored);
    } catch (e) {
      // Ignorer
    }

    const firestorePrefs = stats?.notification_preferences || {};
    return {
      dailyReminder: firestorePrefs.dailyReminder ?? savedLocal?.dailyReminder ?? true,
      dailyReminderHour: firestorePrefs.dailyReminderHour ?? savedLocal?.dailyReminderHour ?? '09:00',
      streakAlert: firestorePrefs.streakAlert ?? savedLocal?.streakAlert ?? true,
      newsletterWeekly: firestorePrefs.newsletterWeekly ?? savedLocal?.newsletterWeekly ?? true,
      breakingEconomics: firestorePrefs.breakingEconomics ?? savedLocal?.breakingEconomics ?? false,
      socialDiscordAlerts: firestorePrefs.socialDiscordAlerts ?? savedLocal?.socialDiscordAlerts ?? true,
      socialLeaderboardChange: firestorePrefs.socialLeaderboardChange ?? savedLocal?.socialLeaderboardChange ?? true,
      socialNewFollowers: firestorePrefs.socialNewFollowers ?? savedLocal?.socialNewFollowers ?? true,
    };
  };

  const [prefs, setPrefs] = useState(getInitialPrefs);
  const [browserPermission, setBrowserPermission] = useState(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission;
    }
    return 'default';
  });
  const [saving, setSaving] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [requestingPush, setRequestingPush] = useState(false);
  const [testingNotif, setTestingNotif] = useState(false);
  const [diagnostic, setDiagnostic] = useState(null);

  const refreshDiagnostic = async () => {
    const diag = await getNotificationDiagnostic();
    setDiagnostic(diag);
    if (diag.permission && diag.permission !== 'unsupported') {
      setBrowserPermission(diag.permission);
    }
  };

  useEffect(() => {
    refreshDiagnostic();
  }, []);

  // Mettre à jour si les stats changent
  useEffect(() => {
    if (stats?.notification_preferences) {
      setPrefs((prev) => ({
        ...prev,
        ...stats.notification_preferences,
      }));
    }
  }, [stats?.notification_preferences]);

  // Demande d'autorisation de notifications Web Push (compatible Mobile & Service Worker)
  const handleRequestPushPermission = async () => {
    setRequestingPush(true);
    try {
      const res = await requestNotificationPermission();
      await refreshDiagnostic();
      if (res.success) {
        setBrowserPermission('granted');
        setToastMsg('🎉 Notifications activées avec succès ! Envoi de l’alerte test...');
        await sendAppNotification({
          title: 'BizGames 🌍',
          body: 'Votre rappel quotidien est activé ! Prêt pour le défi économique ?',
          tag: 'bizgames-welcome',
        });
      } else {
        setBrowserPermission(res.permission || 'denied');
        setToastMsg(res.message || 'Autorisation non accordée.');
      }
    } catch (err) {
      console.warn('Erreur demande push :', err);
      setToastMsg('Erreur lors de la demande d’autorisation.');
    } finally {
      setRequestingPush(false);
    }
  };

  // Test direct d'une alerte native (Service Worker mobile & desktop)
  const handleTestNotification = async () => {
    setTestingNotif(true);
    try {
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission !== 'granted') {
        const res = await requestNotificationPermission();
        if (!res.success) {
          setToastMsg(res.message || 'Veuillez d’abord autoriser les notifications sur cet appareil.');
          setTestingNotif(false);
          await refreshDiagnostic();
          return;
        }
      }

      const sent = await sendAppNotification({
        title: 'BizGames 🌍 Rappel Quotidien',
        body: "🔔 C'est l'heure ! 5 questions rapides vous attendent pour tester votre culture business sur le globe.",
        tag: 'bizgames-test-alert',
        url: '/',
      });

      if (sent) {
        if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
          try { navigator.vibrate([150, 80, 150]); } catch (e) {}
        }
        setToastMsg('🎉 Alerte envoyée sur votre écran ! Vérifiez la bannière ou le centre de notifications.');
      } else {
        setToastMsg('⚠️ Impossible d’afficher l’alerte. Vérifiez que les notifications ne sont pas bloquées par votre système.');
      }
      await refreshDiagnostic();
    } catch (err) {
      console.warn('Erreur test notification :', err);
      setToastMsg('Erreur lors de l’envoi de la notification test.');
    } finally {
      setTestingNotif(false);
    }
  };

  const handleToggle = (key) => {
    setPrefs((prev) => {
      const next = {
        ...prev,
        [key]: !prev[key],
      };
      try {
        localStorage.setItem(`bizgames_notif_${currentUid || 'guest'}`, JSON.stringify(next));
      } catch (e) {}
      return next;
    });
  };

  const handleChangeHour = (val) => {
    setPrefs((prev) => {
      const next = {
        ...prev,
        dailyReminderHour: val,
      };
      try {
        localStorage.setItem(`bizgames_notif_${currentUid || 'guest'}`, JSON.stringify(next));
      } catch (e) {}
      return next;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateUserNotificationPreferences(currentUid, prefs);
      try {
        localStorage.setItem(`bizgames_notif_${currentUid || 'guest'}`, JSON.stringify(prefs));
      } catch (e) {}
      setToastMsg('Vos préférences ont été enregistrées avec succès.');
    } catch (e) {
      setToastMsg('Erreur lors de l’enregistrement.');
    } finally {
      setSaving(false);
      setTimeout(() => setToastMsg(''), 4000);
    }
  };

  const isIos = isIosDevice();
  const isPwa = isPwaInstalled();

  return (
    <div style={styles.container}>
      {/* Toast de confirmation */}
      {toastMsg && (
        <div style={styles.toast}>
          <CheckCircle2 size={16} color="#10b981" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* En-tête */}
      <div style={styles.header}>
        <div style={styles.headerIconBox}>
          <Bell size={24} color="#10b981" />
        </div>
        <div>
          <h2 style={styles.headerTitle}>Centre des Notifications & Abonnements</h2>
          <p style={styles.headerSubtitle}>
            Gérez vos rappels quotidiens de manche, vos alertes mobile et vos synthèses économiques.
          </p>
        </div>
      </div>

      {/* 📱 BLOC DIAGNOSTIC MOBILE & ÉTAT DE RÉCEPTION EN DIRECT */}
      <div style={styles.diagnosticCard}>
        <div style={styles.diagnosticHeader}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Smartphone size={18} color="#10b981" />
            <h3 style={styles.diagnosticTitle}>État & Diagnostic de Réception Mobile</h3>
          </div>
          <button
            onClick={refreshDiagnostic}
            style={styles.refreshDiagBtn}
            title="Rafraîchir le diagnostic de l'appareil"
            type="button"
          >
            <RefreshCw size={13} color="#94a3b8" />
            <span>Actualiser</span>
          </button>
        </div>

        <div style={styles.diagnosticGrid}>
          {/* Ligne 1 : Statut Navigateur */}
          <div style={styles.diagnosticItem}>
            <span style={styles.diagnosticLabel}>Autorisation du Navigateur</span>
            <div style={styles.diagnosticValueRow}>
              {browserPermission === 'granted' ? (
                <span style={styles.badgeSuccess}>
                  <CheckCircle2 size={13} color="#10b981" />
                  <span>Activé (Autorisé)</span>
                </span>
              ) : browserPermission === 'denied' ? (
                <span style={styles.badgeDanger}>
                  <AlertTriangle size={13} color="#ef4444" />
                  <span>Bloqué par le navigateur</span>
                </span>
              ) : (
                <span style={styles.badgeWarning}>
                  <Clock size={13} color="#f59e0b" />
                  <span>En attente d’activation</span>
                </span>
              )}
            </div>
          </div>

          {/* Ligne 2 : Service Worker d'arrière-plan */}
          <div style={styles.diagnosticItem}>
            <span style={styles.diagnosticLabel}>Service Worker Arrière-Plan</span>
            <div style={styles.diagnosticValueRow}>
              {diagnostic?.swActive ? (
                <span style={styles.badgeSuccess}>
                  <Zap size={13} color="#10b981" />
                  <span>Actif & Connecté (Veille)</span>
                </span>
              ) : (
                <span style={styles.badgeSuccess}>
                  <Zap size={13} color="#10b981" />
                  <span>Prêt (sw.js enregistré)</span>
                </span>
              )}
            </div>
          </div>

          {/* Ligne 3 : Système détecté */}
          <div style={styles.diagnosticItem}>
            <span style={styles.diagnosticLabel}>Type d'Appareil</span>
            <span style={{ fontSize: '13px', color: '#f8fafc', fontWeight: '600' }}>
              {isIos ? (isPwa ? 'iPhone/iPad (PWA Installée 📱)' : 'iPhone/iPad (Safari iOS)') : 'Mobile Android / Navigateur Web'}
            </span>
          </div>
        </div>

        {/* Action immédiate de test sur mobile */}
        <div style={styles.diagnosticActionRow}>
          {browserPermission !== 'granted' ? (
            <button
              onClick={handleRequestPushPermission}
              disabled={requestingPush}
              style={styles.pushEnableBtn}
              type="button"
            >
              {requestingPush ? <Loader2 size={15} className="spin" /> : <Sparkles size={15} />}
              <span>Activer les notifications sur cet appareil</span>
            </button>
          ) : (
            <button
              onClick={handleTestNotification}
              disabled={testingNotif}
              style={styles.testNotifDirectBtn}
              type="button"
            >
              {testingNotif ? <Loader2 size={15} className="spin" /> : <Bell size={15} color="#10b981" />}
              <span>🔔 Envoyer une alerte test sur mon téléphone</span>
            </button>
          )}
        </div>

        {/* Aide si bloqué dans le navigateur */}
        {browserPermission === 'denied' && (
          <div style={styles.unblockHelpBox}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fca5a5', fontWeight: '700', fontSize: '12px' }}>
              <AlertTriangle size={15} color="#ef4444" />
              <span>Comment débloquer les alertes sur votre mobile ?</span>
            </div>
            <p style={styles.unblockHelpText}>
              1. Dans votre navigateur mobile, appuyez sur l'icône de cadenas ou de réglages à gauche de l'adresse web.<br />
              2. Appuyez sur <strong>« Autorisations »</strong> ou <strong>« Paramètres du site »</strong>.<br />
              3. Définissez <strong>« Notifications »</strong> sur <strong>« Autoriser »</strong>, puis rechargez la page.
            </p>
          </div>
        )}

        {/* Information spéciale iPhone (iOS 16.4+) */}
        {isIos && !isPwa && (
          <div style={styles.iosHelpBox}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#93c5fd', fontWeight: '700', fontSize: '12px' }}>
              <Info size={15} color="#3b82f6" />
              <span>Astuce iPhone (iOS 16.4+) pour les alertes en veille :</span>
            </div>
            <p style={styles.iosHelpText}>
              Pour recevoir les rappels même lorsque Safari est fermé, appuyez sur le bouton <strong>Partager ⎋</strong> dans Safari puis sélectionnez <strong>« Sur l'écran d'accueil »</strong>.
            </p>
          </div>
        )}
      </div>

      {/* SECTION 1 : RAPPELS DE JEU QUOTIDIEN */}
      <div style={styles.card}>
        <div style={styles.cardHeader}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Calendar size={18} color="#10b981" />
            <h3 style={styles.cardTitle}>Manche Officielle du Jour & Série Active</h3>
          </div>
          <span style={styles.freeBadge}>100% GRATUIT</span>
        </div>

        <div style={styles.togglesList}>
          {/* Toggle 1: Rappel Quotidien */}
          <div style={styles.toggleRow}>
            <div style={styles.toggleInfo}>
              <strong style={styles.toggleTitle}>Rappel Quotidien pour Jouer la Manche</strong>
              <span style={styles.toggleDesc}>
                Recevez une alerte chaque jour dès que les 5 nouvelles questions du round officiel sont publiées.
              </span>
            </div>
            <button
              onClick={() => handleToggle('dailyReminder')}
              style={{
                ...styles.switchTrack,
                background: prefs.dailyReminder ? '#10b981' : 'rgba(255, 255, 255, 0.15)',
              }}
              aria-label="Activer rappel quotidien"
            >
              <div
                style={{
                  ...styles.switchThumb,
                  transform: prefs.dailyReminder ? 'translateX(20px)' : 'translateX(2px)',
                }}
              />
            </button>
          </div>

          {/* Heure de rappel personnalisée & saisie directe */}
          {prefs.dailyReminder && (
            <div style={styles.subRow}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f8fafc', fontSize: '13px', fontWeight: '600' }}>
                  <Clock size={15} color="#10b981" />
                  <span>Heure exacte de votre rappel quotidien :</span>
                </div>
                <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                  Saisissez l'heure de votre choix (ex: 08:30, 14:15) ou choisissez un raccourci
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                {/* Saisie directe de l'heure */}
                <div style={styles.timeInputWrap}>
                  <input
                    type="time"
                    value={prefs.dailyReminderHour || '09:00'}
                    onChange={(e) => handleChangeHour(e.target.value)}
                    style={styles.timeInput}
                    aria-label="Sélectionner l'heure du rappel"
                  />
                </div>

                {/* Bouton de test direct */}
                <button
                  type="button"
                  onClick={handleTestNotification}
                  disabled={testingNotif}
                  style={styles.testNotifBtn}
                  title="Tester l'affichage d'une notification sur votre écran"
                >
                  {testingNotif ? <Loader2 size={13} className="spin" /> : <Bell size={13} color="#10b981" />}
                  <span>{testingNotif ? 'Envoi...' : 'Tester l’alerte'}</span>
                </button>
              </div>

              {/* Raccourcis horaires rapides */}
              <div style={styles.quickHoursRow}>
                <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>Raccourcis :</span>
                {['07:30', '09:00', '12:30', '18:00', '20:30'].map((h) => {
                  const isSelected = prefs.dailyReminderHour === h;
                  return (
                    <button
                      key={h}
                      type="button"
                      onClick={() => handleChangeHour(h)}
                      style={{
                        ...styles.quickHourPill,
                        ...(isSelected ? styles.quickHourPillActive : {}),
                      }}
                    >
                      {h}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Toggle 2: Alerte Sauvegarde de Streak */}
          <div style={styles.toggleRow}>
            <div style={styles.toggleInfo}>
              <strong style={styles.toggleTitle}>Alerte Anti-Perte de Série (Streak 🔥)</strong>
              <span style={styles.toggleDesc}>
                Une alerte d'urgence si vous n'avez pas encore joué à 21h00, pour protéger vos jours consécutifs de victoires.
              </span>
            </div>
            <button
              onClick={() => handleToggle('streakAlert')}
              style={{
                ...styles.switchTrack,
                background: prefs.streakAlert ? '#10b981' : 'rgba(255, 255, 255, 0.15)',
              }}
              aria-label="Activer alerte streak"
            >
              <div
                style={{
                  ...styles.switchThumb,
                  transform: prefs.streakAlert ? 'translateX(20px)' : 'translateX(2px)',
                }}
              />
            </button>
          </div>
        </div>
      </div>

      {/* SECTION 2 : NEWSLETTERS & ACTUALITÉS ÉCONOMIQUES */}
      <div style={styles.card}>
        <div style={styles.cardHeader}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Mail size={18} color="#38bdf8" />
            <h3 style={styles.cardTitle}>Newsletters & Analyses Économiques</h3>
          </div>
          <span style={{ ...styles.freeBadge, borderColor: 'rgba(56, 189, 248, 0.3)', color: '#38bdf8' }}>
            PAR EMAIL
          </span>
        </div>

        <div style={styles.togglesList}>
          {/* Toggle 3: Newsletter Hebdo */}
          <div style={styles.toggleRow}>
            <div style={styles.toggleInfo}>
              <strong style={styles.toggleTitle}>La Synthèse Hebdomadaire BizGames (Chaque Lundi)</strong>
              <span style={styles.toggleDesc}>
                Le récapitulatif des 5 dossiers business les plus marquants de la semaine, les réponses expliquées et le podium des joueurs.
              </span>
            </div>
            <button
              onClick={() => handleToggle('newsletterWeekly')}
              style={{
                ...styles.switchTrack,
                background: prefs.newsletterWeekly ? '#38bdf8' : 'rgba(255, 255, 255, 0.15)',
              }}
              aria-label="Activer newsletter hebdomadaire"
            >
              <div
                style={{
                  ...styles.switchThumb,
                  transform: prefs.newsletterWeekly ? 'translateX(20px)' : 'translateX(2px)',
                }}
              />
            </button>
          </div>

          {/* Toggle 4: Alertes Flash Économie */}
          <div style={styles.toggleRow}>
            <div style={styles.toggleInfo}>
              <strong style={styles.toggleTitle}>Flash Info & Éditions Spéciales Événements</strong>
              <span style={styles.toggleDesc}>
                Manches exceptionnelles lors des grands événements économiques mondiaux (IPO, fusions géantes, sommets tech).
              </span>
            </div>
            <button
              onClick={() => handleToggle('breakingEconomics')}
              style={{
                ...styles.switchTrack,
                background: prefs.breakingEconomics ? '#38bdf8' : 'rgba(255, 255, 255, 0.15)',
              }}
              aria-label="Activer flashs spéciaux"
            >
              <div
                style={{
                  ...styles.switchThumb,
                  transform: prefs.breakingEconomics ? 'translateX(20px)' : 'translateX(2px)',
                }}
              />
            </button>
          </div>
        </div>
      </div>

      {/* SECTION 3 : RÉSEAUX SOCIAUX & COMMUNAUTÉ */}
      <div style={styles.card}>
        <div style={styles.cardHeader}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Share2 size={18} color="#f59e0b" />
            <h3 style={styles.cardTitle}>Réseaux Sociaux & Notifications de Classement</h3>
          </div>
          <span style={{ ...styles.freeBadge, borderColor: 'rgba(245, 158, 11, 0.3)', color: '#f59e0b' }}>
            COMMUNAUTÉ
          </span>
        </div>

        <div style={styles.togglesList}>
          {/* Toggle 5: Dépassement au Classement */}
          <div style={styles.toggleRow}>
            <div style={styles.toggleInfo}>
              <strong style={styles.toggleTitle}>Alerte Compétition & Dépassement au Classement</strong>
              <span style={styles.toggleDesc}>
                Soyez alerté lorsqu’un ami ou rival vous dépasse dans le podium ou dans votre ligue.
              </span>
            </div>
            <button
              onClick={() => handleToggle('socialLeaderboardChange')}
              style={{
                ...styles.switchTrack,
                background: prefs.socialLeaderboardChange ? '#f59e0b' : 'rgba(255, 255, 255, 0.15)',
              }}
              aria-label="Activer alerte dépassement"
            >
              <div
                style={{
                  ...styles.switchThumb,
                  transform: prefs.socialLeaderboardChange ? 'translateX(20px)' : 'translateX(2px)',
                }}
              />
            </button>
          </div>

          {/* Toggle 6: Parrainages & Filleuls */}
          <div style={styles.toggleRow}>
            <div style={styles.toggleInfo}>
              <strong style={styles.toggleTitle}>Validation de Bonus Parrainage (+500 pts)</strong>
              <span style={styles.toggleDesc}>
                Notification instantanée dès qu'un ami invité termine sa première manche et vous fait gagner +500 points.
              </span>
            </div>
            <button
              onClick={() => handleToggle('socialNewFollowers')}
              style={{
                ...styles.switchTrack,
                background: prefs.socialNewFollowers ? '#f59e0b' : 'rgba(255, 255, 255, 0.15)',
              }}
              aria-label="Activer alerte parrainage"
            >
              <div
                style={{
                  ...styles.switchThumb,
                  transform: prefs.socialNewFollowers ? 'translateX(20px)' : 'translateX(2px)',
                }}
              />
            </button>
          </div>
        </div>

        {/* Liens Réseaux Sociaux Officiels */}
        <div style={styles.socialChannelsBox}>
          <span style={styles.socialChannelsTitle}>Rejoindre les canaux officiels BizGames :</span>
          <div style={styles.socialButtonsRow}>
            <a
              href="https://www.linkedin.com"
              target="_blank"
              rel="noopener noreferrer"
              style={styles.socialPill}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="#0a66c2">
                <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"/>
              </svg>
              <span>LinkedIn</span>
              <ExternalLink size={12} color="#64748b" />
            </a>

            <a
              href="https://twitter.com"
              target="_blank"
              rel="noopener noreferrer"
              style={styles.socialPill}
            >
              <span style={{ fontWeight: '900', fontSize: '14px', color: '#ffffff' }}>𝕏</span>
              <span>X (Twitter)</span>
              <ExternalLink size={12} color="#64748b" />
            </a>

            <a
              href="https://discord.com"
              target="_blank"
              rel="noopener noreferrer"
              style={styles.socialPill}
            >
              <MessageCircle size={15} color="#5865f2" />
              <span>Discord BizGames</span>
              <ExternalLink size={12} color="#64748b" />
            </a>
          </div>
        </div>
      </div>

      {/* BOUTON D'ENREGISTREMENT */}
      <div style={styles.actionsBar}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#94a3b8', fontSize: '12px' }}>
          <ShieldCheck size={16} color="#10b981" />
          <span>Vos préférences sont respectées. Zéro spam, désinscription en un clic à tout moment.</span>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          style={styles.saveBtn}
        >
          {saving ? <Loader2 size={16} className="spin" /> : <Check size={16} />}
          <span>{saving ? 'Enregistrement...' : 'Enregistrer mes préférences'}</span>
        </button>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    maxWidth: '920px',
    margin: '0 auto',
    paddingBottom: '30px',
  },
  toast: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '12px 18px',
    borderRadius: '12px',
    background: 'rgba(16, 185, 129, 0.15)',
    border: '1px solid rgba(16, 185, 129, 0.3)',
    color: '#34d399',
    fontSize: '13px',
    fontWeight: '600',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    background: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid rgba(255, 255, 255, 0.06)',
    borderRadius: '18px',
    padding: '20px 24px',
  },
  headerIconBox: {
    width: '48px',
    height: '48px',
    borderRadius: '14px',
    background: 'rgba(16, 185, 129, 0.12)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  headerTitle: {
    margin: '0 0 4px 0',
    fontSize: '18px',
    fontWeight: '800',
    color: '#ffffff',
  },
  headerSubtitle: {
    margin: 0,
    fontSize: '13px',
    color: '#94a3b8',
    lineHeight: 1.4,
  },
  pushBanner: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '16px',
    flexWrap: 'wrap',
    background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12), rgba(6, 78, 59, 0.2))',
    border: '1px solid rgba(16, 185, 129, 0.3)',
    borderRadius: '16px',
    padding: '18px 22px',
  },
  pushBannerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    flex: 1,
    minWidth: '260px',
  },
  pushBannerIcon: {
    width: '42px',
    height: '42px',
    borderRadius: '12px',
    background: 'rgba(0, 0, 0, 0.3)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  pushBannerTitle: {
    display: 'block',
    fontSize: '14px',
    color: '#ffffff',
    fontWeight: '700',
    marginBottom: '2px',
  },
  pushBannerDesc: {
    display: 'block',
    fontSize: '12px',
    color: '#94a3b8',
    lineHeight: 1.4,
  },
  pushEnableBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 18px',
    borderRadius: '10px',
    border: 'none',
    background: '#10b981',
    color: '#03120e',
    fontWeight: '700',
    fontSize: '13px',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  card: {
    background: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid rgba(255, 255, 255, 0.07)',
    borderRadius: '18px',
    padding: '22px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
    paddingBottom: '14px',
  },
  cardTitle: {
    margin: 0,
    fontSize: '15px',
    fontWeight: '700',
    color: '#ffffff',
  },
  freeBadge: {
    fontSize: '11px',
    fontWeight: '700',
    padding: '3px 8px',
    borderRadius: '8px',
    background: 'rgba(16, 185, 129, 0.1)',
    color: '#10b981',
    border: '1px solid rgba(16, 185, 129, 0.25)',
  },
  togglesList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  toggleRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '20px',
  },
  toggleInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '3px',
    flex: 1,
  },
  toggleTitle: {
    fontSize: '14px',
    color: '#f8fafc',
    fontWeight: '600',
  },
  toggleDesc: {
    fontSize: '12px',
    color: '#94a3b8',
    lineHeight: 1.4,
  },
  switchTrack: {
    width: '46px',
    height: '26px',
    borderRadius: '13px',
    border: 'none',
    cursor: 'pointer',
    position: 'relative',
    transition: 'background 0.2s ease',
    padding: 0,
    flexShrink: 0,
  },
  switchThumb: {
    width: '22px',
    height: '22px',
    borderRadius: '11px',
    background: '#ffffff',
    position: 'absolute',
    top: '2px',
    left: 0,
    transition: 'transform 0.2s ease',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
  },
  subRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '12px',
    padding: '12px 16px',
    background: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid rgba(255, 255, 255, 0.05)',
    borderRadius: '12px',
    flexWrap: 'wrap',
  },
  hourSelect: {
    padding: '8px 12px',
    borderRadius: '8px',
    background: '#0b1613',
    border: '1px solid rgba(16, 185, 129, 0.3)',
    color: '#ffffff',
    fontSize: '13px',
    fontWeight: '600',
    outline: 'none',
    cursor: 'pointer',
  },
  timeInputWrap: {
    display: 'flex',
    alignItems: 'center',
  },
  timeInput: {
    padding: '8px 14px',
    borderRadius: '10px',
    background: '#0b1613',
    border: '1px solid rgba(16, 185, 129, 0.4)',
    color: '#34d399',
    fontSize: '15px',
    fontWeight: '700',
    outline: 'none',
    cursor: 'pointer',
    colorScheme: 'dark',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
  },
  testNotifBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 12px',
    borderRadius: '9px',
    background: 'rgba(16, 185, 129, 0.12)',
    border: '1px solid rgba(16, 185, 129, 0.3)',
    color: '#34d399',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  quickHoursRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    width: '100%',
    paddingTop: '8px',
    borderTop: '1px solid rgba(255, 255, 255, 0.04)',
    flexWrap: 'wrap',
  },
  quickHourPill: {
    padding: '4px 10px',
    borderRadius: '7px',
    background: 'rgba(255, 255, 255, 0.04)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    color: '#94a3b8',
    fontSize: '11px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  quickHourPillActive: {
    background: 'rgba(16, 185, 129, 0.2)',
    border: '1px solid #10b981',
    color: '#34d399',
  },
  socialChannelsBox: {
    borderTop: '1px solid rgba(255, 255, 255, 0.05)',
    paddingTop: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  socialChannelsTitle: {
    fontSize: '13px',
    color: '#94a3b8',
    fontWeight: '600',
  },
  socialButtonsRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    flexWrap: 'wrap',
  },
  socialPill: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 14px',
    borderRadius: '10px',
    background: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    color: '#f8fafc',
    fontSize: '12px',
    fontWeight: '600',
    textDecoration: 'none',
    transition: 'all 0.15s ease',
  },
  actionsBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '16px',
    flexWrap: 'wrap',
    padding: '16px 20px',
    background: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid rgba(255, 255, 255, 0.06)',
    borderRadius: '16px',
  },
  saveBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px 24px',
    borderRadius: '12px',
    border: 'none',
    background: 'linear-gradient(135deg, #10b981, #059669)',
    color: '#03120e',
    fontWeight: '800',
    fontSize: '14px',
    cursor: 'pointer',
    boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)',
    transition: 'all 0.15s ease',
  },

  // ─── STYLES DU BLOC DIAGNOSTIC MOBILE ─────────────────────────────────────
  diagnosticCard: {
    background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.8) 0%, rgba(6, 27, 21, 0.8) 100%)',
    border: '1.5px solid rgba(16, 185, 129, 0.35)',
    borderRadius: '18px',
    padding: '20px 22px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    boxShadow: '0 8px 25px rgba(0, 0, 0, 0.4)',
  },
  diagnosticHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '12px',
    flexWrap: 'wrap',
    borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
    paddingBottom: '12px',
  },
  diagnosticTitle: {
    margin: 0,
    fontSize: '15px',
    fontWeight: '800',
    color: '#ffffff',
    fontFamily: 'var(--font-heading)',
  },
  refreshDiagBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '5px 10px',
    borderRadius: '8px',
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    color: '#94a3b8',
    fontSize: '11px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  diagnosticGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '14px',
  },
  diagnosticItem: {
    background: 'rgba(3, 18, 14, 0.5)',
    border: '1px solid rgba(255, 255, 255, 0.05)',
    borderRadius: '12px',
    padding: '12px 14px',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  diagnosticLabel: {
    fontSize: '11px',
    color: '#94a3b8',
    fontWeight: '600',
  },
  diagnosticValueRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  badgeSuccess: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px',
    fontSize: '12px',
    fontWeight: '700',
    color: '#34d399',
    background: 'rgba(16, 185, 129, 0.15)',
    border: '1px solid rgba(16, 185, 129, 0.35)',
    padding: '3px 8px',
    borderRadius: '8px',
  },
  badgeDanger: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px',
    fontSize: '12px',
    fontWeight: '700',
    color: '#f87171',
    background: 'rgba(239, 68, 68, 0.15)',
    border: '1px solid rgba(239, 68, 68, 0.35)',
    padding: '3px 8px',
    borderRadius: '8px',
  },
  badgeWarning: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px',
    fontSize: '12px',
    fontWeight: '700',
    color: '#fbbf24',
    background: 'rgba(245, 158, 11, 0.15)',
    border: '1px solid rgba(245, 158, 11, 0.35)',
    padding: '3px 8px',
    borderRadius: '8px',
  },
  diagnosticActionRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flexWrap: 'wrap',
    paddingTop: '6px',
  },
  testNotifDirectBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '11px 18px',
    borderRadius: '12px',
    border: '1.5px solid rgba(16, 185, 129, 0.45)',
    background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(6, 78, 59, 0.3))',
    color: '#34d399',
    fontWeight: '800',
    fontSize: '13px',
    cursor: 'pointer',
    boxShadow: '0 4px 15px rgba(16, 185, 129, 0.2)',
    transition: 'all 0.15s ease',
  },
  unblockHelpBox: {
    background: 'rgba(239, 68, 68, 0.08)',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    borderRadius: '12px',
    padding: '12px 14px',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  unblockHelpText: {
    margin: 0,
    fontSize: '12px',
    color: '#fca5a5',
    lineHeight: '1.5',
  },
  iosHelpBox: {
    background: 'rgba(59, 130, 246, 0.08)',
    border: '1px solid rgba(59, 130, 246, 0.3)',
    borderRadius: '12px',
    padding: '12px 14px',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  iosHelpText: {
    margin: 0,
    fontSize: '12px',
    color: '#93c5fd',
    lineHeight: '1.5',
  },
};
