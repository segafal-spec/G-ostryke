import React, { useState, useEffect, useRef, useCallback } from 'react';
import Header from './components/Header';
import GlobeGame from './components/GlobeGame';
import QuestionCard from './components/QuestionCard';
import ValidationBar from './components/ValidationBar';
import ResultOverlay from './components/ResultOverlay';
import SummaryModal from './components/SummaryModal';
import RulesModal from './components/RulesModal';
import LandingPage from './components/LandingPage';
import AuthModal from './components/AuthModal';
import PlayerDashboard from './components/PlayerDashboard';
import AdminDashboard from './components/admin/AdminDashboard';
import AdminLogin from './components/admin/AdminLogin';
import PWAInstallBanner from './components/PWAInstallBanner';
import questionsPool from '../data/questions.json';
import { calculateHaversineDistance, calculateScore, getDailyRound, getScoreEmoji } from './utils/geo';
import {
  playShotSound,
  playScoreRevealSound,
  playNextQuestionSound,
  playClickSound,
  startAmbientMusic,
  stopAmbientMusic,
} from './utils/audio';
import {
  saveGameScore,
  subscribeToAuth,
  fetchDailyRoundForDate,
  checkUserDailyPlayed,
  logoutUser,
} from './services/firebase';
import { Shield } from 'lucide-react';
import { startReminderScheduler } from './utils/notifications';

// Clés localStorage partitionnées STRICTEMENT par identifiant joueur (UID)
// Évite à 100% tout mélange de parties, scores ou historique entre différents comptes
const getUserStoragePrefix = (uid) => (uid ? `bizgames_u_${uid}_` : 'bizgames_anon_');
const getDailyStorageKey = (uid, dateStr) => `${getUserStoragePrefix(uid)}played_${dateStr}`;
const getHistoryStorageKey = (uid) => `${getUserStoragePrefix(uid)}history`;
const getInProgressStorageKey = (uid, dateStr) => `${getUserStoragePrefix(uid)}inprogress_${dateStr}`;

// Sauvegarde et récupération de la progression de la manche en cours (si le joueur est déconnecté)
function getInProgressRound(uid, dateStr) {
  if (!uid || !dateStr) return null;
  try {
    const raw = localStorage.getItem(getInProgressStorageKey(uid, dateStr));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function storeInProgressRound(uid, dateStr, data) {
  if (!uid || !dateStr || !data) return;
  try {
    localStorage.setItem(getInProgressStorageKey(uid, dateStr), JSON.stringify(data));
  } catch {
    /* ignore */
  }
}

function clearInProgressRound(uid, dateStr) {
  if (!uid || !dateStr) return;
  try {
    localStorage.removeItem(getInProgressStorageKey(uid, dateStr));
  } catch {}
}

// Lecture du résultat sauvegardé pour un utilisateur et une date donnés
function getStoredDailyResult(uid, dateStr) {
  if (!uid) return null;
  try {
    const raw = localStorage.getItem(getDailyStorageKey(uid, dateStr));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

// Sauvegarde du résultat partitionné par UID
function storeDailyResult(uid, dateStr, data) {
  if (!uid) return;
  try {
    localStorage.setItem(getDailyStorageKey(uid, dateStr), JSON.stringify(data));
    const histKey = getHistoryStorageKey(uid);
    const rawHist = localStorage.getItem(histKey);
    const hist = rawHist ? JSON.parse(rawHist) : [];
    const filtered = hist.filter((item) => item.date !== dateStr);
    localStorage.setItem(histKey, JSON.stringify([data, ...filtered]));
  } catch {
    /* ignore */
  }
}

// Nettoyage de sécurité des anciennes clés non partitionnées ou temporaires
function clearLegacySharedStorage() {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return;
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (
        k &&
        (k.startsWith('bizgames_anon_') ||
          k === 'bizgames_all_history' ||
          k.startsWith('bizgames_played_') ||
          k.startsWith('bizgames_temp_'))
      ) {
        keysToRemove.push(k);
      }
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k));
  } catch {}
}

export default function App() {
  const todayDateStr = new Date().toISOString().split('T')[0];

  // Vue active : 'landing' | 'game' | 'admin'
  const [view, setView] = useState(() => {
    if (typeof window !== 'undefined' && window.location.pathname === '/admin') {
      return 'admin';
    }
    if (typeof window !== 'undefined') {
      try {
        const params = new URLSearchParams(window.location.search);
        if (params.get('view') === 'game') return 'game';
      } catch {}
    }
    return 'landing';
  });

  // Détection d'une invitation / défi d'un proche (?ref=... ou ?invite=...)
  const [invitedBy] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const params = new URLSearchParams(window.location.search);
        return params.get('ref') || params.get('invite') || null;
      } catch {
        return null;
      }
    }
    return null;
  });

  // Résultat du round du jour déjà joué (isolé par compte et vérifié avec Firestore)
  const [alreadyPlayedData, setAlreadyPlayedData] = useState(null);
  // Indique si la session en cours correspond au round officiel du jour
  const [isDailyRound, setIsDailyRound] = useState(true);

  // Questions du round (5 questions) - chargées depuis Firestore avec fallback
  const [questions, setQuestions] = useState(() => getDailyRound(questionsPool, todayDateStr));
  const [currentIndex, setCurrentIndex] = useState(0);

  // État de la réponse en cours
  const [currentGuess, setCurrentGuess] = useState(null);
  const [isResultPhase, setIsResultPhase] = useState(false);
  const [lastResult, setLastResult] = useState(null);

  // Historique et scores
  const [history, setHistory] = useState([]);
  const [totalScore, setTotalScore] = useState(0);

  // Chronomètre désactivé (pas de minuterie)
  const elapsedSeconds = 0;
  const [isGameOver, setIsGameOver] = useState(false);

  // Modales & Accès
  const [showRules, setShowRules] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalReason, setAuthModalReason] = useState('general'); // 'play' | 'general'
  const [pendingPlay, setPendingPlay] = useState(null);
  const [isPlayerHubOpen, setIsPlayerHubOpen] = useState(false);
  // État d'authentification utilisateur
  const [authInfo, setAuthInfo] = useState({
    user: null,
    stats: null,
    isAnonymous: true,
    hasPseudo: false,
    isAdmin: false,
  });
  const [authLoading, setAuthLoading] = useState(true);

  // Détection autoritaire du statut Administrateur
  const isAllowedAdmin = Boolean(
    authInfo?.user &&
    !authInfo.isAnonymous &&
    (authInfo.isAdmin === true ||
     authInfo.stats?.is_admin === true ||
     authInfo.stats?.isAdmin === true ||
     authInfo.user?.email?.trim().toLowerCase() === 'segafal@gmail.com' ||
     authInfo.user?.uid === '6uNoDpHzLvRikKRJplgGXOZJXIU2')
  );

  const [playerHubInitialTab, setPlayerHubInitialTab] = useState('stats');
  const handleOpenLeaderboard = () => {
    if (isAllowedAdmin) {
      if (typeof window !== 'undefined') window.history.pushState({}, '', '/admin');
      setView('admin');
      return;
    }
    setPlayerHubInitialTab('leaderboard');
    setIsPlayerHubOpen(true);
  };

  const handleOpenPlayerHub = (tab = 'stats') => {
    if (isAllowedAdmin) {
      if (typeof window !== 'undefined') window.history.pushState({}, '', '/admin');
      setView('admin');
      return;
    }
    // RÈGLE STRICTE : Accès au dashboard joueur réservé exclusivement aux comptes connectés
    const isConnected = Boolean(authInfo && authInfo.user && !authInfo.isAnonymous);
    if (!isConnected && tab !== 'leaderboard') {
      setIsAuthModalOpen(true);
      return;
    }
    setPlayerHubInitialTab(tab || 'stats');
    setIsPlayerHubOpen(true);
  };

  // Abonnement aux changements d'authentification Firebase
  useEffect(() => {
    const unsubscribe = subscribeToAuth((info) => {
      setAuthInfo(info);
      setAuthLoading(false);

      // RÈGLE STRICTE : Dès qu'un compte administrateur est détecté, redirection automatique vers /admin
      const isUserAdmin = Boolean(
        info?.isAdmin === true ||
        info?.stats?.is_admin === true ||
        info?.stats?.isAdmin === true ||
        info?.user?.email?.trim().toLowerCase() === 'segafal@gmail.com' ||
        info?.user?.uid === '6uNoDpHzLvRikKRJplgGXOZJXIU2'
      );
      if (isUserAdmin) {
        if (typeof window !== 'undefined' && window.location.pathname !== '/admin') {
          window.history.pushState({}, '', '/admin');
        }
        setView('admin');
      }
    });
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  // RÈGLE ABSOLUE : Le compte administrateur NE DOIT JAMAIS JOUER
  // Si le compte admin se trouve sur la vue 'game', le renvoyer instantanément sur /admin
  useEffect(() => {
    if (isAllowedAdmin && view === 'game') {
      if (typeof window !== 'undefined') {
        window.history.pushState({}, '', '/admin');
      }
      setView('admin');
    }
  }, [view, isAllowedAdmin]);

  // Planificateur de rappels quotidiens et alertes de streak (Web & Mobile PWA)
  useEffect(() => {
    const cleanup = startReminderScheduler(() => {
      let localPrefs = {};
      try {
        const stored = localStorage.getItem(`bizgames_notif_${authInfo?.user?.uid || 'guest'}`);
        if (stored) localPrefs = JSON.parse(stored);
      } catch (e) {}

      return {
        preferences: {
          ...localPrefs,
          ...(authInfo?.stats?.notification_preferences || {}),
        },
        alreadyPlayed: Boolean(alreadyPlayedData),
        streakCount: authInfo?.stats?.streak_actuel || 0,
      };
    });
    return cleanup;
  }, [authInfo?.stats?.notification_preferences, alreadyPlayedData, authInfo?.stats?.streak_actuel]);

  // Gestion de l'historique de navigation navigateur (/admin <-> /)
  useEffect(() => {
    const handlePopState = () => {
      if (typeof window !== 'undefined' && window.location.pathname === '/admin') {
        setView('admin');
      } else if (view === 'admin') {
        setView('landing');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [view]);

  // Point 7 : Chargement du round officiel du jour depuis Firestore daily_rounds
  useEffect(() => {
    let isMounted = true;
    fetchDailyRoundForDate(todayDateStr, questionsPool)
      .then((loadedQuestions) => {
        if (isMounted && loadedQuestions && loadedQuestions.length === 5) {
          setQuestions(loadedQuestions);
        }
      })
      .catch((err) => {
        console.warn('Erreur chargement round Firestore, fallback actif :', err);
      });
    return () => {
      isMounted = false;
    };
  }, [todayDateStr]);

  // Synchronisation stricte de l'état utilisateur : isolation des profils et reset à la déconnexion
  useEffect(() => {
    const currentUid = authInfo?.user?.uid;
    const isLogged = Boolean(authInfo?.user && !authInfo.isAnonymous);

    if (!isLogged || !currentUid) {
      // 🚨 DÉCONNEXION : Réinitialiser absolument TOUTE liaison avec le compte précédent
      setAlreadyPlayedData(null);
      setCurrentGuess(null);
      setIsResultPhase(false);
      setLastResult(null);
      setHistory([]);
      setTotalScore(0);
      setIsGameOver(false);
      setCurrentIndex(0);
      clearLegacySharedStorage();
      return;
    }

    // 👤 NOUVEAU COMPTE CONNECTÉ :
    // 1. Réinitialiser la partie en mémoire pour ne pas mélanger les tirs d'un autre utilisateur
    setCurrentGuess(null);
    setIsResultPhase(false);
    setLastResult(null);
    setHistory([]);
    setTotalScore(0);
    setIsGameOver(false);
    setCurrentIndex(0);

    // 2. Vérifier le cache local dédié à cet UID précis
    const localDaily = getStoredDailyResult(currentUid, todayDateStr);
    if (localDaily) {
      setAlreadyPlayedData(localDaily);
    }

    // 3. Vérification autoritaire dans Firestore pour ce compte précis
    checkUserDailyPlayed(currentUid, todayDateStr).then((remoteDaily) => {
      if (remoteDaily) {
        storeDailyResult(currentUid, todayDateStr, remoteDaily);
        setAlreadyPlayedData(remoteDaily);
        clearInProgressRound(currentUid, todayDateStr);
      } else if (localDaily) {
        setAlreadyPlayedData(localDaily);
        clearInProgressRound(currentUid, todayDateStr);
      } else {
        setAlreadyPlayedData(null);
        // 🔄 RESTAURATION DE LA PARTIE EN COURS :
        // Si le joueur s'est déconnecté ou a rafraîchi la page en plein milieu de la manche
        const savedProgress = getInProgressRound(currentUid, todayDateStr);
        if (savedProgress && savedProgress.history && savedProgress.history.length > 0) {
          setCurrentIndex(savedProgress.currentIndex ?? 0);
          setHistory(savedProgress.history ?? []);
          setTotalScore(savedProgress.totalScore ?? 0);
          setIsResultPhase(Boolean(savedProgress.isResultPhase));
          setLastResult(savedProgress.lastResult ?? null);
          setIsGameOver(false);
        }
      }
    });
  }, [authInfo?.user?.uid, authInfo?.isAnonymous, todayDateStr]);

  const hasSavedScoreRef = useRef(false);

  // Réinitialiser le verrou de sauvegarde lorsqu'une nouvelle partie démarre
  useEffect(() => {
    if (!isGameOver) {
      hasSavedScoreRef.current = false;
    }
  }, [isGameOver]);

  // Sauvegarde automatique du score dans Firestore + localStorage partitionné par UID à la fin du round
  useEffect(() => {
    if (isGameOver && history.length > 0 && !hasSavedScoreRef.current) {
      hasSavedScoreRef.current = true;
      const currentUid = authInfo?.user?.uid || 'guest_user';
      if (authInfo?.isAdmin) return;

      // Déterminer s'il s'agit du round officiel du jour
      const isOfficial = Boolean(isDailyRound && !alreadyPlayedData);

      saveGameScore({
        date: todayDateStr,
        scoreTotal: totalScore,
        timeSeconds: elapsedSeconds,
        history,
        isOfficial,
      });

      // Persist en localStorage partitionné pour bloquer le rejeu du round officiel du jour
      // (strictement isolé par UID)
      if (isOfficial) {
        const resultData = {
          date: todayDateStr,
          scoreTotal: totalScore,
          timeSeconds: elapsedSeconds,
          emojiGrid: history
            .map((h) => getScoreEmoji(h.score, h.distanceKm))
            .join(''),
          details: history.map((h) => ({
            questionId: h.question.id,
            questionTexte: h.question.texte,
            lieuNom: h.question.lieu_nom,
            pays: h.question.pays,
            explication: h.question.explication,
            distanceKm: h.distanceKm,
            score: h.score,
          })),
        };
        storeDailyResult(currentUid, todayDateStr, resultData);
        setAlreadyPlayedData(resultData);
      }
    }
  }, [isGameOver, authInfo?.user?.uid, authInfo?.isAdmin, isDailyRound, alreadyPlayedData]);


  const currentQuestion = questions[currentIndex];

  // Gestion du clic sur la carte ou le globe (mémoïsée pour éviter les re-renders)
  const handleMapClick = useCallback((coords) => {
    setCurrentGuess((prev) => {
      // Éviter de mettre à jour si identique
      if (prev && prev.lat === coords.lat && prev.lng === coords.lng) return prev;
      return coords;
    });
  }, []);

  // Validation de la proposition du joueur
  function handleValidate() {
    if (!currentGuess || !currentQuestion || isResultPhase) return;

    // Déclencher le son de tir / lancement
    playShotSound();

    const distanceKm = calculateHaversineDistance(
      currentGuess.lat,
      currentGuess.lng,
      currentQuestion.reponse_lat,
      currentQuestion.reponse_lng
    );

    const score = calculateScore(distanceKm);

    // Déclencher le carillon/son de révélation selon le score
    setTimeout(() => {
      playScoreRevealSound(score, distanceKm);
    }, 150);

    const newHistory = [
      ...history,
      {
        question: currentQuestion,
        guess: currentGuess,
        distanceKm,
        score,
      },
    ];

    const newTotalScore = totalScore + score;
    setLastResult({ distanceKm, score });
    setIsResultPhase(true);
    setTotalScore(newTotalScore);
    setHistory(newHistory);

    // Persister immédiatement la progression en cours (pour retrouver sa partie si déconnexion ou rechargement)
    const currentUid = authInfo?.user?.uid;
    if (currentUid && isDailyRound && !alreadyPlayedData) {
      storeInProgressRound(currentUid, todayDateStr, {
        currentIndex,
        history: newHistory,
        totalScore: newTotalScore,
        date: todayDateStr,
        isResultPhase: true,
        lastResult: { distanceKm, score },
      });
    }
  }

  // Passage à la question suivante ou fin de partie
  function handleNext() {
    const currentUid = authInfo?.user?.uid;
    if (currentIndex < questions.length - 1) {
      playNextQuestionSound();
      const nextIdx = currentIndex + 1;
      setCurrentIndex(nextIdx);
      setCurrentGuess(null);
      setIsResultPhase(false);
      setLastResult(null);

      // Mettre à jour l'état de progression pour la question suivante
      if (currentUid && isDailyRound && !alreadyPlayedData) {
        storeInProgressRound(currentUid, todayDateStr, {
          currentIndex: nextIdx,
          history,
          totalScore,
          date: todayDateStr,
          isResultPhase: false,
          lastResult: null,
        });
      }
    } else {
      setIsGameOver(true);
      setIsResultPhase(false);
      stopAmbientMusic();
      if (currentUid) {
        clearInProgressRound(currentUid, todayDateStr);
      }
    }
  }

  // Vérification stricte d'identification pour accéder au jeu (e-mail obligatoirement validé)
  const isEmailUser = authInfo?.user?.providerData?.some((p) => p.providerId === 'password');
  const isEmailVerified = !isEmailUser || Boolean(authInfo?.user?.emailVerified);
  const isIdentified = authInfo && authInfo.user && !authInfo.isAnonymous && isEmailVerified;
  const hasValidPseudo = Boolean(authInfo?.hasPseudo || authInfo?.stats?.pseudo?.trim() || authInfo?.user?.displayName?.trim());

  const isPreviewMode = typeof window !== 'undefined' && (new URLSearchParams(window.location.search).get('preview') === '1' || new URLSearchParams(window.location.search).get('test') === '1');

  // Règle fondamentale : pour accéder au jeu on doit toujours être identifié avec un pseudo vérifié
  useEffect(() => {
    if (view === 'game' && !isPreviewMode && (!isIdentified || !hasValidPseudo)) {
      setView('landing');
      setAuthModalReason('play');
      setIsAuthModalOpen(true);
    }
  }, [view, isIdentified, hasValidPseudo, isPreviewMode]);

  // Garantit l'arrêt de l'ambiance dès que la carte n'est plus visible (accueil, admin, game over)
  useEffect(() => {
    if (view !== 'game' || isGameOver) {
      stopAmbientMusic();
    }
  }, [view, isGameOver]);

  // Relancer une session d'entraînement avec 5 questions aléatoires
  function handlePlayAgain() {
    if (isAllowedAdmin) {
      if (typeof window !== 'undefined') window.history.pushState({}, '', '/admin');
      setView('admin');
      return;
    }
    if (!isIdentified || !hasValidPseudo) {
      setPendingPlay({ type: 'replay' });
      setAuthModalReason('play');
      setIsAuthModalOpen(true);
      return;
    }
    setIsDailyRound(false);
    const shuffled = [...questionsPool].sort(() => Math.random() - 0.5).slice(0, 5);
    setQuestions(shuffled);
    setCurrentIndex(0);
    setCurrentGuess(null);
    setIsResultPhase(false);
    setLastResult(null);
    setHistory([]);
    setTotalScore(0);
    setIsGameOver(false);
    setView('game');
    startAmbientMusic();
  }

  // Démarrer la session depuis la landing — IDENTIFICATION OBLIGATOIRE
  function handleStartFromLanding() {
    if (isAllowedAdmin) {
      if (typeof window !== 'undefined') window.history.pushState({}, '', '/admin');
      setView('admin');
      return;
    }
    if (!isIdentified || !hasValidPseudo) {
      setPendingPlay({ type: 'daily' });
      setAuthModalReason('play');
      setIsAuthModalOpen(true);
      return;
    }
    if (alreadyPlayedData) return; // Déjà joué : ne rien faire (landing affiche le recap)
    setIsDailyRound(true);

    const currentUid = authInfo?.user?.uid;
    const inProgress = getInProgressRound(currentUid, todayDateStr);
    if (inProgress && inProgress.history && inProgress.history.length > 0) {
      setCurrentIndex(inProgress.currentIndex ?? 0);
      setHistory(inProgress.history ?? []);
      setTotalScore(inProgress.totalScore ?? 0);
      setIsResultPhase(Boolean(inProgress.isResultPhase));
      setLastResult(inProgress.lastResult ?? null);
      setIsGameOver(false);
    }

    setView('game');
  }

  // Démarrer une session personnalisée ou sectorielle depuis le dashboard joueur
  function handleStartCustomRound(customQuestions) {
    if (isAllowedAdmin) {
      if (typeof window !== 'undefined') window.history.pushState({}, '', '/admin');
      setView('admin');
      return;
    }
    if (!isIdentified || !hasValidPseudo) {
      setPendingPlay({ type: 'custom', customQuestions });
      setAuthModalReason('play');
      setIsPlayerHubOpen(false);
      setIsAuthModalOpen(true);
      return;
    }
    setIsPlayerHubOpen(false);
    if (customQuestions && customQuestions.length > 0) {
      setIsDailyRound(false);
      setQuestions(customQuestions);
      setCurrentIndex(0);
      setCurrentGuess(null);
      setIsResultPhase(false);
      setLastResult(null);
      setHistory([]);
      setTotalScore(0);
      setElapsedSeconds(0);
      setIsGameOver(false);
      setView('game');
    } else {
      if (alreadyPlayedData) return; // Déjà joué aujourd'hui
      setIsDailyRound(true);
      fetchDailyRoundForDate(todayDateStr, questionsPool).then((loaded) => {
        const roundQuestions = loaded && loaded.length === 5 ? loaded : getDailyRound(questionsPool, todayDateStr);
        setQuestions(roundQuestions);
      });

      // Si le joueur a déjà commencé la manche du jour, restaurer sa progression
      const currentUid = authInfo?.user?.uid;
      const inProgress = getInProgressRound(currentUid, todayDateStr);
      if (inProgress && inProgress.history && inProgress.history.length > 0) {
        setCurrentIndex(inProgress.currentIndex ?? 0);
        setHistory(inProgress.history ?? []);
        setTotalScore(inProgress.totalScore ?? 0);
        setIsResultPhase(Boolean(inProgress.isResultPhase));
        setLastResult(inProgress.lastResult ?? null);
      } else {
        setCurrentIndex(0);
        setCurrentGuess(null);
        setIsResultPhase(false);
        setLastResult(null);
        setHistory([]);
        setTotalScore(0);
      }
      setIsGameOver(false);
      setView('game');
    }
  }

  // Redirection automatique vers l'espace Admin dès la connexion de l'admin
  const prevIsAdminRef = useRef(false);
  useEffect(() => {
    if (!prevIsAdminRef.current && authInfo?.isAdmin) {
      if (isAuthModalOpen) {
        setIsAuthModalOpen(false);
        if (typeof window !== 'undefined') {
          window.history.pushState({}, '', '/admin');
        }
        setView('admin');
      }
    }
    prevIsAdminRef.current = Boolean(authInfo?.isAdmin);
  }, [authInfo?.isAdmin, isAuthModalOpen]);

  // Lancement automatique différé ou redirection admin dès que l'authentification est validée
  const handleAuthSuccess = (authenticatedUser) => {
    setIsAuthModalOpen(false);

    // Détection immédiate du statut Administrateur
    const userEmail = (
      authenticatedUser?.email ||
      authInfo?.user?.email ||
      ''
    ).trim().toLowerCase();

    const isUserAdmin = Boolean(
      userEmail === 'segafal@gmail.com' ||
      authInfo?.isAdmin === true ||
      authInfo?.stats?.is_admin === true ||
      authInfo?.stats?.isAdmin === true
    );

    // L'ESPACE ADMIN DOIT APPARAÎTRE DÈS QUE L'ADMIN RENTRE SON EMAIL ET SON MOT DE PASSE
    if (isUserAdmin) {
      if (typeof window !== 'undefined') {
        window.history.pushState({}, '', '/admin');
      }
      setView('admin');
      setPendingPlay(null);
      return;
    }

    if (pendingPlay) {
      if (pendingPlay.type === 'daily') {
        if (!alreadyPlayedData) setView('game');
      } else if (pendingPlay.type === 'custom') {
        if (pendingPlay.customQuestions && pendingPlay.customQuestions.length > 0) {
          setQuestions(pendingPlay.customQuestions);
          setCurrentIndex(0);
          setCurrentGuess(null);
          setIsResultPhase(false);
          setLastResult(null);
          setHistory([]);
          setTotalScore(0);
          setIsGameOver(false);
          setView('game');
        } else if (!alreadyPlayedData) {
          setView('game');
        }
      } else if (pendingPlay.type === 'replay') {
        handlePlayAgain();
      }
      setPendingPlay(null);
    }
  };

  // Score de la session courante pour affichage instantané dans le classement
  const currentRoundScore = history.length > 0
    ? {
        user_id: authInfo?.user?.uid || 'guest_current',
        pseudo: authInfo?.user?.displayName || 'Vous (Partie en cours)',
        score_total: totalScore,
        temps_total_secondes: elapsedSeconds,
        grille_emoji: history
          .map((h) => getScoreEmoji(h.score, h.distanceKm))
          .join(''),
        date: todayDateStr,
      }
    : null;

  // ── ROUTE PROTÉGÉE /admin ────────────────────────────────────────────────
  if (view === 'admin') {
    if (authLoading) {
      return (
        <div style={styles.adminLoadingContainer}>
          <div style={styles.spinner} />
          <span style={{ color: '#94a3b8', fontSize: '14px', marginTop: '14px' }}>
            Vérification des droits d'administration...
          </span>
        </div>
      );
    }

    const isAllowedAdmin = Boolean(
      authInfo?.user &&
      !authInfo.isAnonymous &&
      (authInfo.isAdmin === true ||
       authInfo.stats?.is_admin === true ||
       authInfo.stats?.isAdmin === true ||
       authInfo.user?.email?.trim().toLowerCase() === 'segafal@gmail.com')
    );

    // Si non connecté en admin, proposer directement l'écran de connexion admin
    if (!isAllowedAdmin) {
      return (
        <AdminLogin
          onLoginSuccess={() => {
            // Vue reste 'admin' et bascule dès que le composant reçoit l'état actualisé
          }}
          onGoHome={() => {
            if (typeof window !== 'undefined') {
              window.history.pushState({}, '', '/');
            }
            setView('landing');
          }}
        />
      );
    }

    return (
      <AdminDashboard
        authInfo={authInfo}
        onGoHome={() => {
          if (typeof window !== 'undefined') {
            window.history.pushState({}, '', '/');
          }
          setView('landing');
        }}
      />
    );
  }

  // Si l'utilisateur est sur la landing page
  if (view === 'landing') {
    return (
      <>
        <LandingPage
          onStartGame={handleStartFromLanding}
          onGoAdmin={() => {
            if (typeof window !== 'undefined') window.history.pushState({}, '', '/admin');
            setView('admin');
          }}
          todayDateStr={todayDateStr}
          onOpenAuth={(reason = 'general') => {
            setAuthModalReason(reason);
            setIsAuthModalOpen(true);
          }}
          authInfo={authInfo}
          onOpenLeaderboard={handleOpenLeaderboard}
          onOpenPlayerHub={handleOpenPlayerHub}
          alreadyPlayedData={alreadyPlayedData}
          invitedBy={invitedBy}
        />
        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => {
            setIsAuthModalOpen(false);
            setPendingPlay(null);
          }}
          authInfo={authInfo}
          onSuccess={handleAuthSuccess}
          authReason={authModalReason}
          invitedBy={invitedBy}
        />
        <PlayerDashboard
          isOpen={isPlayerHubOpen}
          onClose={() => setIsPlayerHubOpen(false)}
          todayDateStr={todayDateStr}
          authInfo={authInfo}
          onOpenAuth={() => {
            setIsPlayerHubOpen(false);
            setAuthModalReason('general');
            setIsAuthModalOpen(true);
          }}
          onStartRound={handleStartCustomRound}
          onOpenLeaderboard={handleOpenLeaderboard}
          onOpenRules={() => {
            setIsPlayerHubOpen(false);
            setShowRules(true);
          }}
          initialTab={playerHubInitialTab}
          alreadyPlayedData={alreadyPlayedData}
          isInGameProgress={
            !alreadyPlayedData &&
            !isGameOver &&
            (history.length > 0 || Boolean(getInProgressRound(authInfo?.user?.uid, todayDateStr)))
          }
          currentScore={totalScore || (getInProgressRound(authInfo?.user?.uid, todayDateStr)?.totalScore ?? 0)}
          currentQuestionNumber={(currentIndex || (getInProgressRound(authInfo?.user?.uid, todayDateStr)?.currentIndex ?? 0)) + 1}
          onResumeGame={() => {
            setIsPlayerHubOpen(false);
            const currentUid = authInfo?.user?.uid;
            const inProgress = getInProgressRound(currentUid, todayDateStr);
            if (inProgress && inProgress.history && inProgress.history.length > 0) {
              setCurrentIndex(inProgress.currentIndex ?? 0);
              setHistory(inProgress.history ?? []);
              setTotalScore(inProgress.totalScore ?? 0);
              setIsResultPhase(Boolean(inProgress.isResultPhase));
              setLastResult(inProgress.lastResult ?? null);
              setIsGameOver(false);
            }
            setIsDailyRound(true);
            setView('game');
          }}
        />

        {/* Accès direct Espace Administrateur pour l'admin */}
        {authInfo?.isAdmin && (
          <button
            onClick={() => {
              if (typeof window !== 'undefined') {
                window.history.pushState({}, '', '/admin');
              }
              setView('admin');
            }}
            style={styles.adminFloatingBtn}
            title="Accéder à l'espace Administration"
          >
            <Shield size={16} color="#fbbf24" />
            <span>Espace Admin</span>
          </button>
        )}
      </>
    );
  }

  // Si l'utilisateur est admin, il ne doit JAMAIS voir l'interface de jeu : basculer immédiatement sur AdminDashboard
  if (isAllowedAdmin) {
    return (
      <AdminDashboard
        authInfo={authInfo}
        onGoHome={() => {
          if (typeof window !== 'undefined') {
            window.history.pushState({}, '', '/');
          }
          setView('landing');
        }}
      />
    );
  }

  const targetCoords =
    isResultPhase && currentQuestion
      ? {
          lat: currentQuestion.reponse_lat,
          lng: currentQuestion.reponse_lng,
          pays: currentQuestion.pays,
          lieu_nom: currentQuestion.lieu_nom,
        }
      : null;

  // Si l'utilisateur est en jeu
  return (
    <div style={styles.container}>
      {/* En-tête avec bouton retour accueil & profil & classement */}
      <Header
        currentIndex={currentIndex}
        totalQuestions={questions.length}
        currentScore={totalScore}
        onOpenRules={() => setShowRules(true)}
        onGoHome={() => setView('landing')}
        authInfo={authInfo}
        onOpenAuth={(reason = 'general') => {
          setAuthModalReason(reason);
          setIsAuthModalOpen(true);
        }}
        onOpenLeaderboard={handleOpenLeaderboard}
        onOpenPlayerHub={handleOpenPlayerHub}
      />

      {/* Rendu Cartographique 100% Globe 3D */}
      <GlobeGame
        currentGuess={currentGuess}
        onMapClick={handleMapClick}
        targetAnswer={targetCoords}
        isResultPhase={isResultPhase}
        distanceKm={lastResult?.distanceKm}
      />

      {/* Carte de Question flottante (masquée pendant le récap final) */}
      {!isGameOver && (
        <QuestionCard
          question={currentQuestion}
          hasGuessed={Boolean(currentGuess)}
        />
      )}

      {/* Barre d'action de validation (active si clic posé, masquée pendant le résultat) */}
      {!isResultPhase && !isGameOver && (
        <ValidationBar
          hasGuess={Boolean(currentGuess)}
          onValidate={handleValidate}
        />
      )}

      {/* Overlay de Résultat de la question courante */}
      {isResultPhase && lastResult && (
        <ResultOverlay
          question={currentQuestion}
          distanceKm={lastResult.distanceKm}
          score={lastResult.score}
          isLastQuestion={currentIndex === questions.length - 1}
          onNext={handleNext}
        />
      )}

      {/* Modale Récapitulative finale après 5 questions */}
      {isGameOver && (
        <SummaryModal
          roundDate={todayDateStr}
          totalScore={totalScore}
          totalSeconds={elapsedSeconds}
          history={history}
          onPlayAgain={handlePlayAgain}
          onGoHome={() => setView('landing')}
          authInfo={authInfo}
          onOpenAuth={(reason = 'general') => {
            setAuthModalReason(reason);
            setIsAuthModalOpen(true);
          }}
          onOpenLeaderboard={handleOpenLeaderboard}
          onOpenPlayerHub={handleOpenPlayerHub}
        />
      )}

      {/* Modale des Règles */}
      {showRules && <RulesModal onClose={() => setShowRules(false)} />}

      {/* Modale d'Authentification (Google / Email) */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => {
          setIsAuthModalOpen(false);
          setPendingPlay(null);
        }}
        authInfo={authInfo}
        onSuccess={handleAuthSuccess}
        authReason={authModalReason}
      />

      {/* Espace Client & Hub Joueur avec Classement Intégré (Style GeoSports /me) */}
      <PlayerDashboard
        isOpen={isPlayerHubOpen}
        onClose={() => setIsPlayerHubOpen(false)}
        todayDateStr={todayDateStr}
        authInfo={authInfo}
        onOpenAuth={() => {
          setIsPlayerHubOpen(false);
          setAuthModalReason('general');
          setIsAuthModalOpen(true);
        }}
        onStartRound={handleStartCustomRound}
        onOpenLeaderboard={handleOpenLeaderboard}
        onOpenRules={() => {
          setIsPlayerHubOpen(false);
          setShowRules(true);
        }}
        initialTab={playerHubInitialTab}
        alreadyPlayedData={alreadyPlayedData}
        isInGameProgress={view === 'game' && !isGameOver && history.length > 0}
        currentScore={totalScore}
        currentQuestionNumber={currentIndex + 1}
        onResumeGame={() => {
          setIsPlayerHubOpen(false);
          setView('game');
        }}
      />

      {/* Bannière et prompt d'installation PWA Mobile / Desktop */}
      <PWAInstallBanner />

      {/* Accès rapide Espace Administrateur pour l'admin en jeu */}
      {authInfo?.isAdmin && (
        <button
          onClick={() => {
            if (typeof window !== 'undefined') {
              window.history.pushState({}, '', '/admin');
            }
            setView('admin');
          }}
          style={styles.adminFloatingBtn}
          title="Accéder à l'espace Administration"
        >
          <Shield size={16} color="#fbbf24" />
          <span>Espace Admin</span>
        </button>
      )}
    </div>
  );
}

const styles = {
  container: {
    position: 'relative',
    width: '100vw',
    height: '100vh',
    overflow: 'hidden',
    backgroundColor: '#050811',
  },

  adminLoadingContainer: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#020b08',
  },

  spinner: {
    width: '36px',
    height: '36px',
    border: '3px solid rgba(16, 185, 129, 0.2)',
    borderTopColor: '#10b981',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },

  adminFloatingBtn: {
    position: 'fixed',
    bottom: '24px',
    right: '24px',
    zIndex: 998,
    background: 'rgba(4, 20, 15, 0.95)',
    backdropFilter: 'blur(12px)',
    border: '1px solid rgba(245, 158, 11, 0.5)',
    borderRadius: '14px',
    padding: '10px 16px',
    color: '#fbbf24',
    fontSize: '12px',
    fontWeight: '800',
    fontFamily: 'var(--font-heading)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '7px',
    boxShadow: '0 4px 20px rgba(245, 158, 11, 0.25)',
    letterSpacing: '0.5px',
    transition: 'all 0.2s ease',
  },
};
