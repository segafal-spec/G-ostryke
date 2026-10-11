import React, { useState, useEffect } from 'react';
import {
  X,
  Globe2,
  Trophy,
  Flame,
  Clock,
  Target,
  Users,
  Award,
  Crown,
  Play,
  RotateCcw,
  Building2,
  Cpu,
  Gem,
  Car,
  CheckCircle2,
  LogOut,
  LogIn,
  BarChart3,
  Calendar,
  Zap,
  Loader2,
  ChevronDown,
  ChevronUp,
  MapPin,
  HelpCircle,
  History,
  Sparkles,
  Compass,
  UserPlus,
  Share2,
  Copy,
  Check,
  Link2,
  Send,
  Mail,
  MessageCircle,
  Settings,
  Bell,
} from 'lucide-react';
import {
  getUserScoreHistory,
  logoutUser,
  getDailyLeaderboard,
  getGlobalLeaderboard,
  getUserReferralsList,
} from '../services/firebase';
import { getRankTitle, getScoreEmoji, getScoreColor, ALL_RANKS, STREAK_MILESTONES, getStreakTier } from '../utils/geo';
import questionsPool from '../../data/questions.json';
import PlayerSettingsTab from './PlayerSettingsTab';
import PlayerNotificationsTab from './PlayerNotificationsTab';
import PlayerAvatar from './PlayerAvatar';
import PlayerContributionsTab from './PlayerContributionsTab';

// Dictionnaire bilingue Français (par défaut) / Anglais — 100% Gratuit, aucun plan payant
const I18N = {
  fr: {
    // En-tête
    closeTooltip: 'Retour au jeu',
    getApp: "Installer l'app",
    getAppTooltip: "Installer l'application sur smartphone",
    signOut: 'Déconnexion',
    signIn: 'Connexion',
    freeTag: '100% GRATUIT',

    // Menu latéral épuré
    navPlayAction: 'Manche du Jour',
    liveBadge: 'En direct',
    tabStats: 'Profil & Stats',
    tabLeaderboard: 'Classement',
    tabResults: 'Historique',
    tabContributions: 'Proposer & Créer',
    tabInvite: 'Amis Invités & Bonus',
    tabNotifications: 'Notifications',
    tabSettings: 'Paramètres',
    editProfileBtn: 'Paramètres du compte',
    tabRules: 'Règles du Jeu',

    // Profil du joueur & KPIs
    guestPlayer: 'Joueur BizGames',
    verifiedAccount: 'Compte vérifié',
    guest: 'Invité',
    guestHint: 'Connectez-vous pour sauvegarder vos statistiques',
    linkAccount: 'Lier mon compte',
    inviteFriendBtn: 'Inviter un proche',
    inviteCardTitle: 'Inviter un proche & Gagner +500 pts',
    inviteCardSubtitle: 'Défiez vos proches sur le globe 3D ! Gagnez +500 points au classement général dès qu’un ami relève sa 1ère manche.',
    inviteBadgeBonus: '+500 PTS BONUS',
    inviteLinkCopied: 'Lien d’invitation copié !',
    inviteCopyBtn: 'Copier mon lien',
    inviteShareBtn: 'Partager',
    inviteBadgeFree: '100% GRATUIT',
    invitePreviewHeading: 'Aperçu du message envoyé :',
    inviteShareWhatsapp: 'WhatsApp',
    inviteShareSms: 'SMS',
    inviteShareTelegram: 'Telegram',
    inviteShareEmail: 'Email',
    inviteShareLinkedin: 'LinkedIn',
    inviteShareX: 'X / Post',
    kpiTotalPoints: 'Points Cumulés',
    kpiTotalPointsSub: 'somme de chaque jour joué',
    kpiBestScore: 'Meilleur Score',
    kpiBestScoreSub: 'sur 5 000 points (max 1 000 / q)',
    kpiAvgScore: 'Score Moyen',
    kpiAvgScoreSub: 'par manche',
    kpiStreak: 'Série Active (Streak)',
    kpiStreakSub: 'jours consécutifs',
    kpiGamesPlayed: 'Jours Joués',
    kpiGamesPlayedSub: 'au total',
    kpiAvgTime: 'Temps Moyen',
    kpiAvgTimeSub: 'par manche',
    kpiGeoAccuracy: 'Précision Géo',
    kpiGeoAccuracySub: '< 500 km du lieu',

    // Bannière statut round du jour
    dailyBannerNotPlayedTitle: "La manche officielle d'aujourd'hui est prête !",
    dailyBannerNotPlayedDesc: '5 questions sur les titans économiques mondiaux. Marquez des points pour entrer au classement !',
    dailyBannerPlayedTitle: "Manche officielle du jour terminée avec succès !",
    dailyBannerPlayedDesc: 'Vos points sont enregistrés. Vous pouvez consulter vos réponses détaillées ou explorer le classement.',
    btnPlayDailyNow: 'Jouer la Manche du Jour',
    btnSeeResults: 'Voir mes réponses',

    // Maîtrise Sectorielle
    masteryTitle: 'Maîtrise Géographique par Secteur',
    sectorTech: '💻 Tech, IA & GAFAM',
    sectorFinance: '🏦 Wall Street, Bourses & Finance',
    sectorLuxe: '💎 Luxe, Mode & Haute Horlogerie',
    sectorEnergy: '⚡ Énergie, Pétrole & Giga-factories',
    sectorAuto: '🚗 Automobile & Aéronautique',

    // Page de Classement
    leaderboardTitle: 'Classement & Scores Officiels',
    leaderboardSubtitle: 'Comparez vos résultats du jour et le classement final basé sur le cumul des points de chaque jour.',
    tabDailyRound: 'Manche du Jour',
    tabGlobalRank: 'Classement Final (Points Cumulés)',
    yourDailyRankTitle: 'Votre Performance du Jour',
    notPlayedYetTitle: "Vous n'avez pas encore joué le round officiel aujourd'hui.",
    notPlayedYetSub: 'Participez au défi pour faire votre entrée au classement mondial !',
    playDailyBtn: 'Lancer mon Round du Jour',
    youBadge: 'VOUS',
    rankHeader: 'Rang',
    playerHeader: 'Joueur',
    timeHeader: 'Temps',
    scoreHeader: 'Score',
    streakHeader: 'Série',
    streakLabel: 'jours consécutifs',
    emptyLeaderboard: 'Aucun score enregistré pour le moment aujourd’hui. Soyez le premier !',
    loadingScores: 'Chargement des scores en direct...',

    // Onglet Historique & Résultats Détaillés
    resultsTitle: 'Historique des Parties & Corrections',
    resultsDesc: "Consultez l'historique complet de vos rounds et analysez les distances et explications économiques.",
    recentRound: 'Manche récente',
    outOfPoints: '/ 5 000 pts',
    emptyResults: 'Aucune session enregistrée pour le moment.',
    emptyResultsHint: "Jouez votre manche officielle du jour pour voir vos statistiques et analyses s'enregistrer automatiquement ici.",
    launchDailyRound: 'Lancer le Round du Jour',
    youPlayer: 'Vous',

    // Modale Installation Mobile PWA
    pwaTitle: 'Installer BizGames',
    pwaDesc: "Ajoutez BizGames directement sur l'écran d'accueil de votre smartphone iOS ou Android comme une application native.",
    pwaIosTitle: 'Sur iPhone / iPad (Safari) :',
    pwaIosStep1: '1. Appuyez sur le bouton Partager en bas de Safari.',
    pwaIosStep2: '2. Faites défiler et appuyez sur "Sur l\'écran d\'accueil".',
    pwaIosStep3: '3. Validez en cliquant sur "Ajouter".',
    pwaAndroidTitle: 'Sur Android (Chrome) :',
    pwaAndroidStep1: '1. Appuyez sur les 3 points verticaux en haut à droite.',
    pwaAndroidStep2: '2. Choisissez "Installer l\'application" ou "Ajouter à l\'écran d\'accueil".',
    pwaGotIt: 'Compris !',
  },
  en: {
    // Header
    closeTooltip: 'Back to game',
    getApp: 'Get the app',
    getAppTooltip: 'Install application on smartphone',
    signOut: 'Sign out',
    signIn: 'Sign in',
    freeTag: '100% FREE',

    // Sidebar navigation
    navPlayAction: "Today's Round",
    liveBadge: 'Live',
    tabStats: 'Profile & Stats',
    tabLeaderboard: 'Leaderboard',
    tabResults: 'History',
    tabInvite: 'Invited Friends & Bonus',
    tabNotifications: 'Notifications',
    tabSettings: 'Settings',
    editProfileBtn: 'Account Settings',
    tabRules: 'Game Rules',

    // Player profile & KPIs
    guestPlayer: 'BizGames Player',
    verifiedAccount: 'Verified Account',
    guest: 'Guest',
    guestHint: 'Sign in to save your global stats and progress',
    linkAccount: 'Link Account',
    inviteFriendBtn: 'Invite a Friend',
    inviteCardTitle: 'Invite a Friend & Earn +500 pts',
    inviteCardSubtitle: 'Challenge your friends on the 3D globe! Earn +500 bonus points in the global leaderboard as soon as a friend completes their 1st round.',
    inviteBadgeBonus: '+500 PTS BONUS',
    inviteLinkCopied: 'Link copied!',
    inviteCopyBtn: 'Copy link',
    inviteShareBtn: 'Share',
    inviteBadgeFree: '100% FREE',
    invitePreviewHeading: 'Preview of sent challenge:',
    inviteShareWhatsapp: 'WhatsApp',
    inviteShareSms: 'SMS',
    inviteShareTelegram: 'Telegram',
    inviteShareEmail: 'Email',
    inviteShareLinkedin: 'LinkedIn',
    inviteShareX: 'X / Post',
    kpiTotalPoints: 'Total Points',
    kpiTotalPointsSub: 'sum of all days played',
    kpiBestScore: 'Best Score',
    kpiBestScoreSub: 'out of 5,000 pts (max 1,000 / q)',
    kpiAvgScore: 'Average Score',
    kpiAvgScoreSub: 'per round',
    kpiStreak: 'Daily Streak',
    kpiStreakSub: 'consecutive days',
    kpiGamesPlayed: 'Days Played',
    kpiGamesPlayedSub: 'total',
    kpiAvgTime: 'Average Time',
    kpiAvgTimeSub: 'per game',
    kpiGeoAccuracy: 'Geo Accuracy',
    kpiGeoAccuracySub: '< 500 km from target',

    // Daily round status banner
    dailyBannerNotPlayedTitle: "Today's official round is ready!",
    dailyBannerNotPlayedDesc: '5 questions on global economic titans. Score points and climb the world leaderboard!',
    dailyBannerPlayedTitle: "Today's round completed successfully!",
    dailyBannerPlayedDesc: 'Your score is saved. Review your answers and compare rankings on the global leaderboard.',
    btnPlayDailyNow: "Play Today's Round",
    btnSeeResults: 'Review Answers',

    // Sector mastery
    masteryTitle: 'Geographic Mastery by Sector',
    sectorTech: '💻 Tech, AI & Big Tech',
    sectorFinance: '🏦 Wall Street, Exchanges & Finance',
    sectorLuxe: '💎 Luxury, Fashion & High Watchmaking',
    sectorEnergy: '⚡ Energy, Oil & Gigafactories',
    sectorAuto: '🚗 Automotive & Aerospace',

    // Leaderboard
    leaderboardTitle: 'Official Leaderboard & Rankings',
    leaderboardSubtitle: 'Compare your daily results and final standings based on cumulative daily points.',
    tabDailyRound: "Today's Round",
    tabGlobalRank: 'Final Leaderboard (Cumulative Points)',
    yourDailyRankTitle: 'Your Performance Today',
    notPlayedYetTitle: "You haven't played today's official round yet.",
    notPlayedYetSub: 'Join the challenge to secure your spot on the global leaderboard!',
    playDailyBtn: "Start Today's Round",
    youBadge: 'YOU',
    rankHeader: 'Rank',
    playerHeader: 'Player',
    timeHeader: 'Time',
    scoreHeader: 'Score',
    streakHeader: 'Streak',
    streakLabel: 'consecutive days',
    emptyLeaderboard: 'No scores recorded yet today. Be the first to play!',
    loadingScores: 'Loading live scores...',

    // Results & History
    resultsTitle: 'Detailed Game Results & Analysis',
    resultsDesc: 'View your complete round history and analyze distance errors and business explanations.',
    recentRound: 'Recent round',
    outOfPoints: '/ 5 000 pts',
    emptyResults: 'No sessions recorded yet.',
    emptyResultsHint: "Play today's official round to automatically record and view your stats here.",
    launchDailyRound: "Start Today's Round",
    youPlayer: 'You',

    // PWA modal
    pwaTitle: 'Install BizGames',
    pwaDesc: 'Add BizGames directly to your iOS or Android home screen for a full native app experience.',
    pwaIosTitle: 'On iPhone / iPad (Safari):',
    pwaIosStep1: '1. Tap the Share button at the bottom of Safari.',
    pwaIosStep2: '2. Scroll down and tap "Add to Home Screen".',
    pwaIosStep3: '3. Confirm by tapping "Add".',
    pwaAndroidTitle: 'On Android (Chrome):',
    pwaAndroidStep1: '1. Tap the 3 vertical dots at top right.',
    pwaAndroidStep2: '2. Choose "Install app" or "Add to Home screen".',
    pwaGotIt: 'Got it!',
  },
};

// Correspondance anglaise des titres de rang
const RANK_TITLE_EN = {
  'Légende du Business Mondial': 'World Business Legend',
  'Directeur Général International': 'International Managing Director',
  'Stratège Global': 'Global Strategist',
  'Analyste de Marchés': 'Market Analyst',
  'Entrepreneur en Herbe': 'Budding Entrepreneur',
  'Stagiaire du Commerce': 'Commerce Intern',
  "Titan de l'Économie Verte 2085": 'Green Economy Titan 2085',
  'Managing Director Impact & Fusion': 'Managing Director Impact & Fusion',
  'Architecte de Biosphère Solaire': 'Solar Biosphere Architect',
  'Analyste Transition Circulaire': 'Circular Transition Analyst',
  'Pionnier Éco-Futuriste': 'Eco-Futurist Pioneer',
  'Initié des Éco-Cités': 'Eco-Cities Initiate',
  'Titan de la Finance Mondiale': 'Global Finance Titan',
  'Senior Vice President': 'Senior Vice President',
  'Analyste Private Equity': 'Private Equity Analyst',
  'Consultant Junior': 'Junior Consultant',
  "Stagiaire en Période d'Essai": 'Probationary Intern',
};

// Fonction de normalisation des onglets (stats, leaderboard, results, invite, settings)
const normalizeTab = (tab) => {
  if (['leaderboard', 'classement'].includes(tab)) {
    return 'leaderboard';
  }
  if (['results', 'history', 'historique'].includes(tab)) {
    return 'results';
  }
  if (['contributions', 'contribution', 'proposer', 'questions', 'ugc'].includes(tab)) {
    return 'contributions';
  }
  if (['invite', 'inviter', 'parrainage', 'referrals', 'amis'].includes(tab)) {
    return 'invite';
  }
  if (['notifications', 'notification', 'notif', 'notifs', 'newsletter', 'newsletters'].includes(tab)) {
    return 'notifications';
  }
  if (['settings', 'parametres', 'paramètres', 'account', 'compte'].includes(tab)) {
    return 'settings';
  }
  return 'stats';
};

export default function PlayerDashboard({
  isOpen,
  onClose,
  todayDateStr,
  authInfo,
  onOpenAuth,
  onStartRound,
  onOpenRules,
  initialTab = 'stats',
  alreadyPlayedData,
  isInGameProgress = false,
  currentScore = 0,
  currentQuestionNumber = 1,
  onResumeGame,
}) {
  // Langue active : 100% Français
  const lang = 'fr';

  // Détection mobile pour adapter l'ergonomie
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 4 onglets : 'stats' | 'leaderboard' | 'results' | 'invite' | 'settings'
  const [activeTab, setActiveTab] = useState(() => normalizeTab(initialTab));
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [showGetAppModal, setShowGetAppModal] = useState(false);
  const [expandedQuestionKey, setExpandedQuestionKey] = useState(null);
  const [inviteCopied, setInviteCopied] = useState(false);

  // État des filleuls et du parrainage
  const [referralsList, setReferralsList] = useState([]);
  const [loadingReferrals, setLoadingReferrals] = useState(false);

  // État du classement
  const [leaderboardSubTab, setLeaderboardSubTab] = useState('daily'); // 'daily' | 'global'
  const [dailyScores, setDailyScores] = useState([]);
  const [globalScores, setGlobalScores] = useState([]);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);

  // Synchronisation si l'onglet initial change
  useEffect(() => {
    if (isOpen && initialTab) {
      setActiveTab(normalizeTab(initialTab));
    }
  }, [isOpen, initialTab]);

  const t = I18N.fr;

  const user = authInfo?.user;
  const stats = authInfo?.stats;
  const isUserLoggedIn = authInfo && authInfo.user && !authInfo.isAnonymous;
  const currentUserId = user?.uid;

  // Charger l'historique complet des sessions de CE joueur uniquement (partitionné par UID)
  useEffect(() => {
    if (!isOpen) return;

    if (!currentUserId || !isUserLoggedIn) {
      setHistory([]);
      setLoadingHistory(false);
      return;
    }

    let localList = [];
    try {
      const raw = localStorage.getItem(`bizgames_u_${currentUserId}_history`);
      if (raw) localList = JSON.parse(raw);
    } catch (e) {}

    if (alreadyPlayedData && !localList.some((it) => it.date === alreadyPlayedData.date)) {
      localList = [alreadyPlayedData, ...localList];
    }

    const formattedLocal = localList.map((item, idx) => ({
      id: `local_${item.date || idx}`,
      date: item.date,
      score_total: item.scoreTotal ?? item.score_total ?? 0,
      temps_total_secondes: item.timeSeconds ?? item.temps_total_secondes ?? 60,
      grille_emoji: item.emojiGrid || item.grille_emoji || '🟩🟩🟩',
      details_par_question: item.details
        ? item.details.map((d) => ({
            question_id: d.questionId,
            question_texte: d.questionTexte,
            lieu_nom: d.lieuNom,
            pays: d.pays,
            explication: d.explication,
            distance_km: d.distanceKm,
            score: d.score,
          }))
        : item.details_par_question || [],
    }));

    setLoadingHistory(true);
    getUserScoreHistory(currentUserId)
      .then((remoteData) => {
        const remoteList = remoteData || [];
        const seenDates = new Set();
        const merged = [];

        // Priorité aux données distantes Firestore
        for (const item of remoteList) {
          const dKey = item.date || item.id;
          if (dKey && !seenDates.has(dKey)) {
            seenDates.add(dKey);
            merged.push(item);
          }
        }

        // Compléter avec les données locales si une date manque
        for (const loc of formattedLocal) {
          const dKey = loc.date || loc.id;
          if (dKey && !seenDates.has(dKey)) {
            seenDates.add(dKey);
            merged.push(loc);
          }
        }

        merged.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
        setHistory(merged);
        setLoadingHistory(false);
      })
      .catch(() => {
        const seen = new Set();
        const dedupedLocal = [];
        for (const loc of formattedLocal) {
          const dKey = loc.date || loc.id;
          if (dKey && !seen.has(dKey)) {
            seen.add(dKey);
            dedupedLocal.push(loc);
          }
        }
        setHistory(dedupedLocal);
        setLoadingHistory(false);
      });
  }, [isOpen, currentUserId, isUserLoggedIn, alreadyPlayedData]);

  // Charger les classements
  useEffect(() => {
    if (!isOpen || activeTab !== 'leaderboard') return;

    let isMounted = true;
    setLoadingLeaderboard(true);

    const currentUserEntry = alreadyPlayedData
      ? {
          user_id: currentUserId || 'local_user',
          pseudo: user?.displayName || stats?.pseudo || (lang === 'fr' ? 'Vous' : 'You'),
          photo_url: user?.photoURL || stats?.photo_url || '',
          score_total: alreadyPlayedData.scoreTotal,
          temps_total_secondes: alreadyPlayedData.timeSeconds,
          grille_emoji: alreadyPlayedData.emojiGrid,
          date: alreadyPlayedData.date,
        }
      : null;

    Promise.all([
      getDailyLeaderboard(todayDateStr, currentUserEntry),
      getGlobalLeaderboard(),
    ])
      .then(([daily, global]) => {
        if (isMounted) {
          setDailyScores(daily);
          setGlobalScores(global);
          setLoadingLeaderboard(false);
        }
      })
      .catch((err) => {
        console.warn('Erreur chargement leaderboard dashboard :', err);
        if (isMounted) setLoadingLeaderboard(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, activeTab, todayDateStr, alreadyPlayedData, currentUserId, user?.displayName]);

  // Charger la liste des personnes invitées (filleuls) par ce joueur
  useEffect(() => {
    if (!isOpen || !currentUserId || !isUserLoggedIn) return;

    let isMounted = true;
    setLoadingReferrals(true);

    getUserReferralsList(currentUserId, user?.displayName)
      .then((list) => {
        if (isMounted) {
          setReferralsList(list);
          setLoadingReferrals(false);
        }
      })
      .catch((err) => {
        console.warn('Erreur chargement filleuls :', err);
        if (isMounted) setLoadingReferrals(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, currentUserId, isUserLoggedIn, user?.displayName, stats?.referrals_count]);

  if (!isOpen) return null;

  // Calculs statistiques 100% réels liés au profil de l'utilisateur connecté
  const totalGames = stats?.parties_jouees || history.length || 0;
  const bestScore = stats?.meilleur_score || (history.length > 0 ? Math.max(...history.map((h) => h.score_total || 0)) : 0);
  const totalCumulativePoints = stats?.score_total_cumule || stats?.total_points || (history.length > 0 ? history.reduce((acc, cur) => acc + (cur.score_total || 0), 0) : bestScore);
  const streak = stats?.streak_actuel || 0;
  const avgScore = history.length > 0
    ? Math.round(history.reduce((acc, cur) => acc + (cur.score_total || 0), 0) / history.length)
    : bestScore > 0 ? bestScore : 0;
  const avgTimeSeconds = history.length > 0
    ? Math.round(history.reduce((acc, cur) => acc + (cur.temps_total_secondes || 0), 0) / history.length)
    : 0;

  // Calcul dynamique et 100% réel de la précision géographique (< 500 km) du joueur
  let totalQuestionsAnswered = 0;
  let questionsWithin500Km = 0;

  history.forEach((game) => {
    const details = game.details_par_question || [];
    details.forEach((q) => {
      totalQuestionsAnswered++;
      const dist = typeof q.distance_km === 'number' ? q.distance_km : null;
      if (dist !== null && dist < 500) {
        questionsWithin500Km++;
      }
    });
  });

  const geoAccuracyPercent =
    totalQuestionsAnswered > 0
      ? Math.round((questionsWithin500Km / totalQuestionsAnswered) * 100)
      : null;

  // Dictionnaire de catégorie par question_id
  const questionCategoryMap = new Map();
  if (Array.isArray(questionsPool)) {
    questionsPool.forEach((q) => {
      if (q.id && q.categorie) {
        questionCategoryMap.set(q.id, q.categorie.toLowerCase());
      }
    });
  }

  // Calculs dynamiques de maîtrise par secteur d'activité
  const sectorScores = {
    tech: { score: 0, max: 0, count: 0 },
    finance: { score: 0, max: 0, count: 0 },
    luxe: { score: 0, max: 0, count: 0 },
    energie: { score: 0, max: 0, count: 0 },
    auto: { score: 0, max: 0, count: 0 },
  };

  history.forEach((game) => {
    const details = game.details_par_question || [];
    details.forEach((q) => {
      const qCat = (q.categorie || questionCategoryMap.get(q.question_id) || '').toLowerCase();
      let targetKey = null;
      if (qCat === 'tech') targetKey = 'tech';
      else if (qCat === 'finance') targetKey = 'finance';
      else if (qCat === 'luxe') targetKey = 'luxe';
      else if (qCat === 'energie') targetKey = 'energie';
      else if (qCat === 'auto' || qCat === 'aero') targetKey = 'auto';

      if (targetKey && sectorScores[targetKey]) {
        const itemScore = Number(q.score) || 0;
        // Le barème actuel est de 1 000 points max par question (ou 10 pour l'ancien barème)
        const maxScorePerQ = itemScore <= 10 ? 10 : 1000;
        sectorScores[targetKey].score += itemScore;
        sectorScores[targetKey].max += maxScorePerQ;
        sectorScores[targetKey].count += 1;
      }
    });
  });

  const getMastery = (key) => {
    const data = sectorScores[key];
    if (!data || data.max === 0) {
      return { pct: 0, display: '—', count: 0 };
    }
    const percent = Math.min(100, Math.round((data.score / data.max) * 100));
    return { pct: percent, display: `${percent}%`, count: data.count };
  };

  const techMastery = getMastery('tech');
  const financeMastery = getMastery('finance');
  const luxeMastery = getMastery('luxe');
  const energyMastery = getMastery('energie');
  const autoMastery = getMastery('auto');

  const rawRankInfo = getRankTitle(avgScore || 0);
  const localizedRankTitle = lang === 'en' ? (RANK_TITLE_EN[rawRankInfo.title] || rawRankInfo.title) : rawRankInfo.title;

  // Progression Challenge 30 Jours consécutifs (Streak)
  const streakTier = getStreakTier(streak);

  // Ligne de classement du joueur aujourd'hui
  const myDailyEntry =
    dailyScores.find((s) => s.user_id === currentUserId) ||
    (alreadyPlayedData
      ? {
          user_id: currentUserId || 'local_user',
          pseudo: user?.displayName || (lang === 'fr' ? 'Vous' : 'You'),
          score_total: alreadyPlayedData.scoreTotal,
          temps_total_secondes: alreadyPlayedData.timeSeconds,
          grille_emoji: alreadyPlayedData.emojiGrid,
          date: alreadyPlayedData.date,
        }
      : null);

  // Formatage secondes -> 1m 24s
  const formatSeconds = (sec) => {
    const s = sec || 0;
    const m = Math.floor(s / 60);
    const r = s % 60;
    return m > 0 ? `${m}m ${r}s` : `${r}s`;
  };

  // Déconnexion totale et fermeture du dashboard
  const handleSignOut = async () => {
    await logoutUser();
    setHistory([]);
    if (onClose) onClose();
  };

  // Construction de l'URL et du message d'invitation personnalisé avec parrainage (UID prioritaire pour bonus 500 pts)
  const baseUrl = typeof window !== 'undefined' && window.location.origin
    ? window.location.origin
    : 'https://bizgames-game.web.app';
  const senderDisplayName = user?.displayName || (lang === 'fr' ? 'Un proche' : 'A friend');
  // Le paramètre ref utilise l'UID unique de l'utilisateur pour une réconciliation garantie à 100%
  const inviteParam = encodeURIComponent(user?.uid || user?.displayName || 'ami');
  const inviteUrl = `${baseUrl}/?ref=${inviteParam}`;

  const inviteMessage = lang === 'fr'
    ? `⚔️ ${senderDisplayName} t'invite à tester ta culture business sur BizGames ! Retrouve les sièges sociaux des géants mondiaux sur le globe 3D. 100% gratuit : ${inviteUrl}`
    : `⚔️ ${senderDisplayName} invites you to challenge your business knowledge on BizGames! Pinpoint global corporate headquarters on the 3D globe. 100% free: ${inviteUrl}`;

  const inviteWhatsapp = `https://api.whatsapp.com/send?text=${encodeURIComponent(inviteMessage)}`;
  const inviteSms = `sms:?&body=${encodeURIComponent(inviteMessage)}`;
  const inviteTelegram = `https://t.me/share/url?url=${encodeURIComponent(inviteUrl)}&text=${encodeURIComponent(inviteMessage)}`;
  const inviteLinkedin = `https://www.linkedin.com/feed/?shareActive=true&text=${encodeURIComponent(inviteMessage)}`;
  const inviteX = `https://twitter.com/intent/tweet?text=${encodeURIComponent(inviteMessage)}`;
  const inviteEmail = `mailto:?subject=${encodeURIComponent(lang === 'fr' ? 'Défi BizGames : Viens tester ta culture business !' : 'BizGames Challenge: Test your business knowledge!')}&body=${encodeURIComponent(inviteMessage)}`;

  const handleCopyInviteLink = async () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(inviteUrl);
      } else {
        const ta = document.createElement('textarea');
        ta.value = inviteUrl;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      setInviteCopied(true);
      setTimeout(() => setInviteCopied(false), 2500);
    } catch (err) {
      console.warn('Erreur copie lien invitation :', err);
    }
  };

  const handleNativeShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: lang === 'fr' ? 'BizGames — Défi Géographie Business' : 'BizGames — Business Geography Challenge',
          text: inviteMessage,
          url: inviteUrl,
        });
      } catch (err) {
        if (err.name !== 'AbortError') {
          handleCopyInviteLink();
        }
      }
    } else {
      handleCopyInviteLink();
    }
  };

  return (
    <div style={styles.fullscreenContainer}>
      {/* 1. EN-TÊTE ÉPURÉ & MODERNE */}
      <header style={styles.topHeader}>
        <div style={styles.topHeaderLeft}>
          <button
            onClick={onClose}
            style={styles.closeIconButton}
            title={t.closeTooltip}
            aria-label="Fermer"
          >
            <X size={22} />
          </button>
          <div style={styles.brandTitle} onClick={onClose}>
            <span>Biz<span style={{ color: '#10b981' }}>Games</span></span>
            <span style={styles.brandBadge}>{t.freeTag}</span>
          </div>
        </div>

        <div style={styles.topHeaderRight}>

          <button
            onClick={() => setShowGetAppModal(true)}
            style={styles.getAppBtn}
            title={t.getAppTooltip}
          >
            <span className="small-screen-hide">{t.getApp}</span>
            <span style={styles.appIcons}>
              <span>🍎</span>
              <span>▶</span>
            </span>
          </button>

          {isUserLoggedIn ? (
            <button onClick={handleSignOut} style={styles.signOutBtn} title={t.signOut} aria-label={t.signOut}>
              <LogOut size={15} />
              <span className="small-screen-hide">{t.signOut}</span>
            </button>
          ) : (
            <button onClick={onOpenAuth} style={styles.signInBtn} title={t.signIn}>
              <LogIn size={15} />
              <span>{t.signIn}</span>
            </button>
          )}
        </div>
      </header>

      {/* 2. CORPS PRINCIPAL : SIDEBAR SIMPLIFIÉE (5 ONGLETS) + ZONE DE CONTENU */}
      <div style={{ ...styles.mainLayout, ...(isMobile ? styles.mainLayoutMobile : {}) }}>
        {/* BARRE LATÉRALE DE NAVIGATION ÉPURÉE */}
        <aside style={{ ...styles.sidebar, ...(isMobile ? styles.sidebarMobile : {}) }}>
          {/* Action principale : Manche du Jour */}
          <div style={isMobile ? styles.mobileActionRow : styles.sidebarSection}>
            <button
              onClick={() => {
                if (alreadyPlayedData) {
                  setActiveTab('results');
                } else {
                  onClose();
                  if (onStartRound) onStartRound();
                }
              }}
              style={alreadyPlayedData ? styles.dailyActionPlayedBtn : styles.dailyActionBtn}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Play size={16} fill={alreadyPlayedData ? '#10b981' : '#03120e'} />
                <span style={{ fontWeight: '800' }}>{t.navPlayAction}</span>
              </div>
              <span style={alreadyPlayedData ? styles.badgeDone : styles.badgeLive}>
                {alreadyPlayedData ? '✓' : t.liveBadge}
              </span>
            </button>
          </div>

          {/* 5 Onglets principaux */}
          <div style={isMobile ? styles.mobileTabsList : styles.sidebarNavList}>
            {/* 1. Profil & Stats */}
            <button
              onClick={() => setActiveTab('stats')}
              style={{
                ...styles.navItemBtn,
                ...(activeTab === 'stats' ? styles.navItemActive : {}),
              }}
            >
              <div style={styles.navItemInner}>
                <BarChart3 size={17} color={activeTab === 'stats' ? '#34d399' : '#94a3b8'} />
                <span>{t.tabStats}</span>
              </div>
            </button>

            {/* 2. Classement */}
            <button
              onClick={() => setActiveTab('leaderboard')}
              style={{
                ...styles.navItemBtn,
                ...(activeTab === 'leaderboard' ? styles.navItemActive : {}),
              }}
            >
              <div style={styles.navItemInner}>
                <Trophy size={17} color={activeTab === 'leaderboard' ? '#f59e0b' : '#94a3b8'} />
                <span>{t.tabLeaderboard}</span>
              </div>
            </button>

            {/* 3. Historique des résultats */}
            <button
              onClick={() => setActiveTab('results')}
              style={{
                ...styles.navItemBtn,
                ...(activeTab === 'results' ? styles.navItemActive : {}),
              }}
            >
              <div style={styles.navItemInner}>
                <History size={17} color={activeTab === 'results' ? '#38bdf8' : '#94a3b8'} />
                <span>{t.tabResults}</span>
              </div>
            </button>

            {/* 4. Proposer & Créer (+500 pts) */}
            <button
              onClick={() => setActiveTab('contributions')}
              style={{
                ...styles.navItemBtn,
                ...(activeTab === 'contributions' ? styles.navItemActive : {}),
              }}
            >
              <div style={styles.navItemInner}>
                <Send size={17} color={activeTab === 'contributions' ? '#10b981' : '#94a3b8'} />
                <span>{t.tabContributions || 'Proposer & Créer'}</span>
              </div>
              <span style={{
                background: 'rgba(16, 185, 129, 0.18)',
                color: '#34d399',
                border: '1px solid rgba(16, 185, 129, 0.35)',
                fontSize: '11px',
                fontWeight: '700',
                padding: '2px 6px',
                borderRadius: '8px',
              }}>
                +500
              </span>
            </button>

            {/* 5. Amis Invités & Bonus (Page dédiée) */}
            <button
              onClick={() => setActiveTab('invite')}
              style={{
                ...styles.navItemBtn,
                ...(activeTab === 'invite' ? styles.navItemActive : {}),
              }}
            >
              <div style={styles.navItemInner}>
                <UserPlus size={17} color={activeTab === 'invite' ? '#10b981' : '#94a3b8'} />
                <span>{t.tabInvite}</span>
              </div>
              <span style={{
                background: 'rgba(245, 158, 11, 0.18)',
                color: '#f59e0b',
                border: '1px solid rgba(245, 158, 11, 0.35)',
                fontSize: '11px',
                fontWeight: '700',
                padding: '2px 6px',
                borderRadius: '8px',
              }}>
                +500
              </span>
            </button>

            {/* 5. Notifications & Alertes */}
            <button
              onClick={() => setActiveTab('notifications')}
              style={{
                ...styles.navItemBtn,
                ...(activeTab === 'notifications' ? styles.navItemActive : {}),
              }}
            >
              <div style={styles.navItemInner}>
                <Bell size={17} color={activeTab === 'notifications' ? '#10b981' : '#94a3b8'} />
                <span>{t.tabNotifications}</span>
              </div>
            </button>

            {/* 6. Paramètres & Mon Compte */}
            <button
              onClick={() => setActiveTab('settings')}
              style={{
                ...styles.navItemBtn,
                ...(activeTab === 'settings' ? styles.navItemActive : {}),
              }}
            >
              <div style={styles.navItemInner}>
                <Settings size={17} color={activeTab === 'settings' ? '#10b981' : '#94a3b8'} />
                <span>{t.tabSettings}</span>
              </div>
            </button>
          </div>

          {/* Pied de sidebar : Règles du jeu & Info */}
          {!isMobile && (
            <div style={styles.sidebarFooter}>
              <button
                onClick={() => {
                  if (onOpenRules) onOpenRules();
                }}
                style={styles.rulesBtn}
              >
                <HelpCircle size={15} color="#94a3b8" />
                <span>{t.tabRules}</span>
              </button>
              <div style={styles.freeFootnote}>
                <Sparkles size={13} color="#10b981" />
                <span>BizGames · 100% Gratuit pour tous</span>
              </div>
            </div>
          )}
        </aside>

        {/* PANNEAU DE CONTENU DROIT */}
        <main style={{ ...styles.contentArea, ...(isMobile ? styles.contentAreaMobile : {}) }}>
          {/* ============================================================ */}
          {/* ONGLET 1 : STATISTIQUES & PROFIL                             */}
          {/* ============================================================ */}
          {activeTab === 'stats' && (
            <div style={styles.panelContainer}>
              {/* Bannière de Statut du Jour */}
              {alreadyPlayedData ? (
                <div style={styles.dailyDoneBanner}>
                  <div style={styles.dailyDoneLeft}>
                    <div style={styles.dailyDoneCheckIcon}>
                      <CheckCircle2 size={24} color="#10b981" />
                    </div>
                    <div>
                      <h3 style={styles.dailyDoneTitle}>{t.dailyBannerPlayedTitle}</h3>
                      <p style={styles.dailyDoneDesc}>
                        {alreadyPlayedData.scoreTotal?.toLocaleString(lang === 'fr' ? 'fr-FR' : 'en-US')} pts • {alreadyPlayedData.emojiGrid || '🟩🟩🟩'}
                      </p>
                    </div>
                  </div>
                  <div style={styles.dailyDoneActions}>
                    <button
                      onClick={() => setActiveTab('results')}
                      style={styles.bannerSecondaryBtn}
                    >
                      <span>{t.btnSeeResults}</span>
                    </button>
                    <button
                      onClick={() => setActiveTab('leaderboard')}
                      style={styles.bannerPrimaryBtn}
                    >
                      <Trophy size={15} color="#f59e0b" />
                      <span>{t.tabLeaderboard}</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div style={styles.dailyReadyBanner}>
                  <div style={styles.dailyReadyLeft}>
                    <div style={styles.dailyReadyPulseIcon}>
                      <Play size={22} fill="#03120e" color="#03120e" />
                    </div>
                    <div>
                      <h3 style={styles.dailyReadyTitle}>{t.dailyBannerNotPlayedTitle}</h3>
                      <p style={styles.dailyReadyDesc}>{t.dailyBannerNotPlayedDesc}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      onClose();
                      if (onStartRound) onStartRound();
                    }}
                    style={styles.dailyLaunchBtn}
                  >
                    <Play size={16} fill="#03120e" />
                    <span>{t.btnPlayDailyNow}</span>
                  </button>
                </div>
              )}

              {/* Carte Profil Joueur */}
              <div style={styles.profileHeroCard}>
                <div style={styles.profileAvatarBox}>
                  {(user?.photoURL || stats?.photo_url) ? (
                    <img src={user?.photoURL || stats?.photo_url} alt="Avatar" style={styles.profileAvatarImg} />
                  ) : (
                    <span style={styles.profileAvatarInitial}>
                      {(user?.displayName || stats?.pseudo || user?.email || 'J')[0].toUpperCase()}
                    </span>
                  )}
                </div>

                <div style={styles.profileInfoText}>
                  <div style={styles.profileNameLine}>
                    <h2 style={styles.profileNameTitle}>
                      {user?.displayName || t.guestPlayer}
                    </h2>
                    <span style={styles.userStatusPill}>
                      {isUserLoggedIn ? t.verifiedAccount : t.guest}
                    </span>
                  </div>
                  <span style={styles.profileUserEmail}>
                    {user?.email || t.guestHint}
                  </span>
                  {stats?.bio && (
                    <p style={styles.profileBioText}>
                      💬 {stats.bio}
                    </p>
                  )}
                  {stats?.country && (
                    <div style={styles.profileCountryBadge}>
                      <span>{stats.country_flag || '🌍'}</span>
                      <span>{stats.country}</span>
                    </div>
                  )}
                  <div style={styles.rankHonorificBadge}>
                    <span style={{ fontSize: '15px' }}>{rawRankInfo.badge}</span>
                    <span style={{ color: rawRankInfo.color, fontWeight: '700', fontSize: '12px' }}>
                      {localizedRankTitle}
                    </span>
                  </div>
                </div>

                <div style={styles.profileHeroActions}>
                  {/* Bouton direct vers les paramètres */}
                  <button
                    onClick={() => setActiveTab('settings')}
                    style={styles.profileEditSettingsBtn}
                    title={t.editProfileBtn}
                  >
                    <Settings size={15} color="#34d399" />
                    <span>{t.editProfileBtn}</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('invite')}
                    style={styles.profileInviteQuickBtn}
                    title={t.tabInvite}
                  >
                    <UserPlus size={15} color="#10b981" />
                    <span>{t.tabInvite}</span>
                  </button>

                  {isUserLoggedIn ? (
                    <button onClick={handleSignOut} style={styles.profileLogoutBtn} title={t.signOut}>
                      <LogOut size={15} />
                      <span>{t.signOut}</span>
                    </button>
                  ) : (
                    <button onClick={onOpenAuth} style={styles.linkAccountBtn}>
                      <LogIn size={15} />
                      <span>{t.linkAccount}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Carte d'invitation d'un proche & Partage */}
              <div id="invite-section" style={styles.inviteHeroCard}>
                <div style={styles.inviteCardHeader}>
                  <div style={styles.inviteCardIconBadge}>
                    <UserPlus size={22} color="#10b981" />
                  </div>
                  <div style={styles.inviteCardHeaderText}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <h3 style={styles.inviteCardTitle}>{t.inviteCardTitle}</h3>
                      <span style={{ ...styles.inviteBadgeFree, background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', borderColor: 'rgba(245, 158, 11, 0.3)' }}>
                        🎁 {t.inviteBadgeBonus}
                      </span>
                      <span style={styles.inviteBadgeFree}>{t.inviteBadgeFree}</span>
                    </div>
                    <p style={styles.inviteCardSubtitle}>{t.inviteCardSubtitle}</p>
                    {stats?.referrals_count > 0 && (
                      <div style={{ marginTop: '6px', fontSize: '13px', color: '#10b981', fontWeight: '600' }}>
                        ✨ {stats.referrals_count} ami{stats.referrals_count > 1 ? 's' : ''} parrainé{stats.referrals_count > 1 ? 's' : ''} • +{((stats.referrals_count || 0) * 500).toLocaleString(lang === 'fr' ? 'fr-FR' : 'en-US')} pts bonus cumulés au classement !
                      </div>
                    )}
                  </div>
                </div>

                {/* Champ Lien d'invitation & Bouton Copier */}
                <div style={styles.inviteLinkContainer}>
                  <div style={styles.inviteLinkInputBox}>
                    <Link2 size={16} color="#10b981" style={{ flexShrink: 0 }} />
                    <input
                      type="text"
                      readOnly
                      value={inviteUrl}
                      style={styles.inviteLinkInput}
                      onClick={(e) => e.target.select()}
                      aria-label="Lien d'invitation"
                    />
                  </div>
                  <button
                    onClick={handleCopyInviteLink}
                    style={inviteCopied ? styles.inviteCopyBtnCopied : styles.inviteCopyBtn}
                    title={t.inviteCopyBtn}
                  >
                    {inviteCopied ? <Check size={16} color="#03120e" /> : <Copy size={16} />}
                    <span>{inviteCopied ? t.inviteLinkCopied : t.inviteCopyBtn}</span>
                  </button>
                </div>

                {/* Boutons de Partage Direct (Native, WhatsApp, SMS, Telegram, LinkedIn, X, Email) */}
                <div style={styles.inviteShareGrid}>
                  {typeof navigator !== 'undefined' && navigator.share && (
                    <button
                      onClick={handleNativeShare}
                      style={styles.inviteShareNativeBtn}
                      title={t.inviteShareBtn}
                    >
                      <Share2 size={15} />
                      <span>{t.inviteShareBtn}</span>
                    </button>
                  )}

                  {/* WhatsApp */}
                  <a
                    href={inviteWhatsapp}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ ...styles.inviteSocialBtn, background: '#25D366' }}
                    title="Partager sur WhatsApp"
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="white">
                      <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0012.04 2m.01 1.67c4.54 0 8.24 3.7 8.24 8.24 0 2.2-.86 4.28-2.42 5.84a8.19 8.19 0 01-5.82 2.41c-1.45 0-2.88-.39-4.14-1.13l-.3-.18-3.08.81.82-3-.2-.31a8.17 8.17 0 01-1.25-4.44c0-4.54 3.7-8.24 8.24-8.24m4.54 11.66c-.25-.13-1.47-.72-1.7-.81-.23-.08-.39-.13-.56.13-.17.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.13-1.06-.39-2.01-1.24-.74-.66-1.25-1.48-1.39-1.73-.14-.25-.02-.39.11-.51.11-.11.25-.29.38-.44.13-.15.17-.25.25-.42.08-.17.04-.32-.02-.44-.06-.13-.56-1.35-.77-1.85-.2-.49-.41-.42-.56-.43h-.48c-.17 0-.44.06-.67.31-.23.25-.88.86-.88 2.1 0 1.24.9 2.44 1.03 2.61.13.17 1.77 2.7 4.29 3.79.6.26 1.07.41 1.43.53.6.19 1.15.16 1.58.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.15-1.18-.06-.11-.23-.17-.48-.29z"/>
                    </svg>
                    <span>{t.inviteShareWhatsapp}</span>
                  </a>

                  {/* SMS */}
                  <a
                    href={inviteSms}
                    style={{ ...styles.inviteSocialBtn, background: '#059669' }}
                    title="Partager par SMS"
                  >
                    <MessageCircle size={15} color="#ffffff" />
                    <span>{t.inviteShareSms}</span>
                  </a>

                  {/* Telegram */}
                  <a
                    href={inviteTelegram}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ ...styles.inviteSocialBtn, background: '#229ED9' }}
                    title="Partager sur Telegram"
                  >
                    <Send size={15} color="#ffffff" />
                    <span>{t.inviteShareTelegram}</span>
                  </a>

                  {/* LinkedIn */}
                  <a
                    href={inviteLinkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ ...styles.inviteSocialBtn, background: '#0A66C2' }}
                    title="Partager sur LinkedIn"
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="white">
                      <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"/>
                    </svg>
                    <span>{t.inviteShareLinkedin}</span>
                  </a>

                  {/* X / Twitter */}
                  <a
                    href={inviteX}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ ...styles.inviteSocialBtn, background: '#000000', border: '1px solid rgba(255,255,255,0.2)' }}
                    title="Partager sur X / Twitter"
                  >
                    <span style={{ fontWeight: '900', fontSize: '13px' }}>𝕏</span>
                    <span>{t.inviteShareX}</span>
                  </a>

                  {/* Email */}
                  <a
                    href={inviteEmail}
                    style={{ ...styles.inviteSocialBtn, background: 'rgba(255, 255, 255, 0.08)', border: '1px solid rgba(255, 255, 255, 0.15)' }}
                    title="Envoyer par email"
                  >
                    <Mail size={15} color="#e2e8f0" />
                    <span>{t.inviteShareEmail}</span>
                  </a>
                </div>

                {/* Aperçu du défi pré-rempli */}
                <div style={styles.inviteMessagePreviewBox}>
                  <span style={styles.invitePreviewLabel}>{t.invitePreviewHeading}</span>
                  <p style={styles.invitePreviewText}>« {inviteMessage} »</p>
                </div>
              </div>

              {/* Grille des 6 KPIs Statistiques */}
              <div style={styles.kpiGrid}>
                {/* 1. Points Cumulés (Total de chaque jour) */}
                <div style={styles.kpiCard}>
                  <div style={styles.kpiIconBox}>
                    <Trophy size={20} color="#f59e0b" />
                  </div>
                  <span style={styles.kpiValue}>
                    {totalCumulativePoints > 0 ? (lang === 'fr' ? totalCumulativePoints.toLocaleString('fr-FR') : totalCumulativePoints.toLocaleString('en-US')) : '—'}
                  </span>
                  <span style={styles.kpiLabel}>{t.kpiTotalPoints}</span>
                  <span style={styles.kpiSub}>{t.kpiTotalPointsSub}</span>
                </div>

                {/* 2. Meilleur Score sur une manche */}
                <div style={styles.kpiCard}>
                  <div style={styles.kpiIconBox}>
                    <Award size={20} color="#10b981" />
                  </div>
                  <span style={styles.kpiValue}>
                    {bestScore > 0 ? (lang === 'fr' ? bestScore.toLocaleString('fr-FR') : bestScore.toLocaleString('en-US')) : '—'}
                  </span>
                  <span style={styles.kpiLabel}>{t.kpiBestScore}</span>
                  <span style={styles.kpiSub}>{t.kpiBestScoreSub}</span>
                </div>

                {/* 3. Streak Actif */}
                <div style={styles.kpiCard}>
                  <div style={styles.kpiIconBox}>
                    <Flame size={20} color="#f97316" />
                  </div>
                  <span style={styles.kpiValue}>{streak} 🔥</span>
                  <span style={styles.kpiLabel}>{t.kpiStreak}</span>
                  <span style={styles.kpiSub}>{t.kpiStreakSub}</span>
                </div>

                {/* 4. Jours / Manches Jouées */}
                <div style={styles.kpiCard}>
                  <div style={styles.kpiIconBox}>
                    <BarChart3 size={20} color="#3b82f6" />
                  </div>
                  <span style={styles.kpiValue}>{totalGames}</span>
                  <span style={styles.kpiLabel}>{t.kpiGamesPlayed}</span>
                  <span style={styles.kpiSub}>{t.kpiGamesPlayedSub}</span>
                </div>

                {/* 5. Score Moyen */}
                <div style={styles.kpiCard}>
                  <div style={styles.kpiIconBox}>
                    <Target size={20} color="#a855f7" />
                  </div>
                  <span style={styles.kpiValue}>
                    {avgScore > 0 ? (lang === 'fr' ? avgScore.toLocaleString('fr-FR') : avgScore.toLocaleString('en-US')) : '—'}
                  </span>
                  <span style={styles.kpiLabel}>{t.kpiAvgScore}</span>
                  <span style={styles.kpiSub}>{t.kpiAvgScoreSub}</span>
                </div>

                {/* 6. Précision Géographique */}
                <div style={styles.kpiCard}>
                  <div style={styles.kpiIconBox}>
                    <Clock size={20} color="#eab308" />
                  </div>
                  <span style={styles.kpiValue}>
                    {geoAccuracyPercent !== null ? `${geoAccuracyPercent}%` : '—'}
                  </span>
                  <span style={styles.kpiLabel}>{t.kpiGeoAccuracy}</span>
                  <span style={styles.kpiSub}>
                    {totalQuestionsAnswered > 0
                      ? `${questionsWithin500Km}/${totalQuestionsAnswered} < 500 km`
                      : t.kpiGeoAccuracySub}
                  </span>
                </div>
              </div>

              {/* Maîtrise par secteur d'activité (100% réel basé sur les questions jouées par ce profil) */}
              <div style={styles.sectorsMasteryCard}>
                <h3 style={styles.subCardTitle}>{t.masteryTitle}</h3>
                <div style={styles.sectorBarsList}>
                  {/* Tech */}
                  <div style={styles.sectorBarItem}>
                    <div style={styles.sectorBarLabelRow}>
                      <span style={styles.sectorBarName}>
                        {t.sectorTech}
                        {techMastery.count > 0 && (
                          <span style={styles.sectorCountBadge}>({techMastery.count} {techMastery.count > 1 ? 'questions' : 'question'})</span>
                        )}
                      </span>
                      <strong style={styles.sectorBarPercent}>{techMastery.display}</strong>
                    </div>
                    <div style={styles.progressTrack}>
                      <div style={{ ...styles.progressFill, width: `${techMastery.pct}%`, background: '#3b82f6' }} />
                    </div>
                  </div>

                  {/* Finance */}
                  <div style={styles.sectorBarItem}>
                    <div style={styles.sectorBarLabelRow}>
                      <span style={styles.sectorBarName}>
                        {t.sectorFinance}
                        {financeMastery.count > 0 && (
                          <span style={styles.sectorCountBadge}>({financeMastery.count} {financeMastery.count > 1 ? 'questions' : 'question'})</span>
                        )}
                      </span>
                      <strong style={styles.sectorBarPercent}>{financeMastery.display}</strong>
                    </div>
                    <div style={styles.progressTrack}>
                      <div style={{ ...styles.progressFill, width: `${financeMastery.pct}%`, background: '#10b981' }} />
                    </div>
                  </div>

                  {/* Luxe */}
                  <div style={styles.sectorBarItem}>
                    <div style={styles.sectorBarLabelRow}>
                      <span style={styles.sectorBarName}>
                        {t.sectorLuxe}
                        {luxeMastery.count > 0 && (
                          <span style={styles.sectorCountBadge}>({luxeMastery.count} {luxeMastery.count > 1 ? 'questions' : 'question'})</span>
                        )}
                      </span>
                      <strong style={styles.sectorBarPercent}>{luxeMastery.display}</strong>
                    </div>
                    <div style={styles.progressTrack}>
                      <div style={{ ...styles.progressFill, width: `${luxeMastery.pct}%`, background: '#f59e0b' }} />
                    </div>
                  </div>

                  {/* Énergie */}
                  <div style={styles.sectorBarItem}>
                    <div style={styles.sectorBarLabelRow}>
                      <span style={styles.sectorBarName}>
                        {t.sectorEnergy}
                        {energyMastery.count > 0 && (
                          <span style={styles.sectorCountBadge}>({energyMastery.count} {energyMastery.count > 1 ? 'questions' : 'question'})</span>
                        )}
                      </span>
                      <strong style={styles.sectorBarPercent}>{energyMastery.display}</strong>
                    </div>
                    <div style={styles.progressTrack}>
                      <div style={{ ...styles.progressFill, width: `${energyMastery.pct}%`, background: '#f97316' }} />
                    </div>
                  </div>

                  {/* Auto */}
                  <div style={styles.sectorBarItem}>
                    <div style={styles.sectorBarLabelRow}>
                      <span style={styles.sectorBarName}>
                        {t.sectorAuto}
                        {autoMastery.count > 0 && (
                          <span style={styles.sectorCountBadge}>({autoMastery.count} {autoMastery.count > 1 ? 'questions' : 'question'})</span>
                        )}
                      </span>
                      <strong style={styles.sectorBarPercent}>{autoMastery.display}</strong>
                    </div>
                    <div style={styles.progressTrack}>
                      <div style={{ ...styles.progressFill, width: `${autoMastery.pct}%`, background: '#8b5cf6' }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* 🌟 CARTE NOUVELLE : CHALLENGE DES 30 JOURS CONSÉCUTIFS (STREAK) */}
              <div style={styles.streakChallengeCard}>
                <div style={styles.streakChallengeHeader}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={styles.streakFlameIconBox}>
                      <Flame size={22} color="#f97316" fill="#f97316" />
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <h3 style={styles.streakChallengeTitle}>
                          {lang === 'fr' ? 'Challenge 30 Jours d’Affilée' : '30-Day Streak Challenge'}
                        </h3>
                        <span style={styles.streakLiveBadge}>
                          {streak} / 30 {lang === 'fr' ? 'jours' : 'days'}
                        </span>
                      </div>
                      <p style={styles.streakChallengeSubtitle}>
                        {lang === 'fr'
                          ? 'Jouez chaque jour la manche officielle pour débloquer des rangs d’élite et des bonus exclusifs !'
                          : 'Play the daily official round every day to unlock elite ranks and exclusive perks!'}
                      </p>
                    </div>
                  </div>
                  {streakTier.nextMilestone && (
                    <div style={styles.streakNextTargetBox}>
                      <span style={styles.streakNextTargetLabel}>
                        {lang === 'fr' ? 'Prochain Palier :' : 'Next Milestone:'}
                      </span>
                      <strong style={styles.streakNextTargetValue}>
                        {streakTier.nextMilestone.badge} J-{streakTier.nextMilestone.days} ({streakTier.daysToNext} {lang === 'fr' ? 'j restants' : 'd left'})
                      </strong>
                    </div>
                  )}
                </div>

                {/* Barre de progression des 30 jours */}
                <div style={styles.streakProgressBarContainer}>
                  <div style={styles.streakProgressHeaderInfo}>
                    <span style={styles.streakProgressPercentLabel}>
                      {lang === 'fr' ? 'Progression vers le rang Titan :' : 'Progress toward Titan rank:'} <strong>{streakTier.progressPercent}%</strong>
                    </span>
                    <span style={styles.streakActivePerkBadge}>
                      {streakTier.activeMilestone ? `${streakTier.activeMilestone.badge} ${streakTier.activeMilestone.title}` : (lang === 'fr' ? 'Débutant en Série' : 'Streak Novice')}
                    </span>
                  </div>
                  <div style={styles.streakTrack}>
                    <div
                      style={{
                        ...styles.streakFill,
                        width: `${Math.max(4, streakTier.progressPercent)}%`,
                      }}
                    />
                  </div>
                </div>

                {/* Grille des 5 Paliers de Déblocage */}
                <div style={styles.milestonesGrid}>
                  {STREAK_MILESTONES.map((m) => {
                    const isUnlocked = streak >= m.days;
                    const isNext = streakTier.nextMilestone?.days === m.days;

                    return (
                      <div
                        key={m.days}
                        style={{
                          ...styles.milestoneItemCard,
                          ...(isUnlocked ? styles.milestoneUnlockedCard : {}),
                          ...(isNext ? styles.milestoneNextCard : {}),
                        }}
                      >
                        <div style={styles.milestoneTopLine}>
                          <span style={styles.milestoneBadgeIcon}>{m.badge}</span>
                          <span style={{
                            ...styles.milestoneDaysPill,
                            background: isUnlocked ? 'rgba(16, 185, 129, 0.2)' : isNext ? 'rgba(245, 158, 11, 0.2)' : 'rgba(255, 255, 255, 0.06)',
                            color: isUnlocked ? '#34d399' : isNext ? '#fbbf24' : '#94a3b8',
                          }}>
                            {isUnlocked ? '✓ Débloqué' : `Jour ${m.days}`}
                          </span>
                        </div>
                        <h4 style={{
                          ...styles.milestoneCardTitle,
                          color: isUnlocked ? '#34d399' : isNext ? '#fbbf24' : '#e2e8f0',
                        }}>
                          {m.title}
                        </h4>
                        <div style={styles.milestoneBonusTag}>
                          +{m.bonusPts} pts
                        </div>
                        <p style={styles.milestonePerkDesc}>
                          {lang === 'fr' ? m.perkFr : m.perkEn}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>


              {/* Hiérarchie des 6 Rangs Business Officiels BizGames */}
              <div style={styles.ranksHierarchyCard}>
                <div style={styles.ranksHierarchyHeader}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Trophy size={18} color="#fbbf24" />
                    <h3 style={styles.subCardTitle}>
                      {lang === 'fr' ? 'Hiérarchie des Rangs Business' : 'Official Business Ranks'}
                    </h3>
                  </div>
                  <span style={styles.ranksScaleBadge}>
                    {lang === 'fr' ? 'Échelle sur 5 000 pts' : '5,000 pts scale'}
                  </span>
                </div>
                <div style={styles.ranksHierarchyGrid}>
                  {ALL_RANKS.map((r) => {
                    const isCurrent = rawRankInfo.title === r.title;
                    return (
                      <div
                        key={r.title}
                        style={{
                          ...styles.ranksHierarchyItem,
                          ...(isCurrent ? styles.ranksHierarchyItemActive : {}),
                        }}
                      >
                        <span style={{ fontSize: '22px', flexShrink: 0 }}>{r.badge}</span>
                        <div style={styles.ranksHierarchyText}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <strong style={{ color: isCurrent ? r.color : '#ffffff', fontSize: '13px' }}>
                              {lang === 'en' ? (RANK_TITLE_EN[r.title] || r.title) : r.title}
                            </strong>
                            {isCurrent && (
                              <span style={styles.currentRankPill}>
                                {lang === 'fr' ? 'Votre rang actuel' : 'Your current rank'}
                              </span>
                            )}
                          </div>
                          <span style={styles.ranksHierarchySub}>
                            {r.range} • {r.noteMin}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* ONGLET 2 : CLASSEMENT INTÉGRÉ                                */}
          {/* ============================================================ */}
          {activeTab === 'leaderboard' && (
            <div style={styles.panelContainer}>
              <div style={styles.panelHeaderBlock}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={styles.leaderboardTitleIcon}>
                    <Trophy size={24} color="#f59e0b" />
                  </div>
                  <div>
                    <h2 style={styles.panelTitle}>{t.leaderboardTitle}</h2>
                    <p style={styles.panelDescription}>{t.leaderboardSubtitle}</p>
                  </div>
                </div>
              </div>

              {/* Sous-onglets Classement */}
              <div style={styles.leaderboardSubtabsRow}>
                <button
                  onClick={() => setLeaderboardSubTab('daily')}
                  style={{
                    ...styles.leaderboardSubtabBtn,
                    ...(leaderboardSubTab === 'daily' ? styles.leaderboardSubtabActive : {}),
                  }}
                >
                  <Calendar size={14} />
                  <span>{t.tabDailyRound}</span>
                </button>
                <button
                  onClick={() => setLeaderboardSubTab('global')}
                  style={{
                    ...styles.leaderboardSubtabBtn,
                    ...(leaderboardSubTab === 'global' ? styles.leaderboardSubtabActive : {}),
                  }}
                >
                  <Crown size={14} />
                  <span>{t.tabGlobalRank}</span>
                </button>
              </div>

              {loadingLeaderboard ? (
                <div style={styles.leaderboardLoadingBox}>
                  <Loader2 size={32} className="spin" color="#f59e0b" />
                  <span style={{ fontSize: '13px', color: '#94a3b8' }}>{t.loadingScores}</span>
                </div>
              ) : leaderboardSubTab === 'daily' ? (
                <>
                  {/* Bannière personnalisée : résultat du joueur s'il a joué aujourd'hui */}
                  {myDailyEntry ? (
                    <div style={styles.myRankCard}>
                      <div style={styles.myRankBadge}>
                        <span>#{myDailyEntry.rank || 1}</span>
                      </div>
                      <PlayerAvatar
                        photoUrl={myDailyEntry.photo_url || user?.photoURL || stats?.photo_url}
                        pseudo={myDailyEntry.pseudo || user?.displayName || stats?.pseudo}
                        size={42}
                        borderColor="#10b981"
                      />
                      <div style={styles.myRankInfo}>
                        <span style={styles.myRankName}>{t.yourDailyRankTitle}</span>
                        <span style={styles.myRankDetails}>
                          {myDailyEntry.grille_emoji || '🟩🟩🟩'}
                        </span>
                      </div>
                      <div style={styles.myRankScore}>
                        <strong>{(myDailyEntry.score_total || 0).toLocaleString(lang === 'fr' ? 'fr-FR' : 'en-US')}</strong>
                        <span style={styles.myRankScoreSub}>pts</span>
                      </div>
                    </div>
                  ) : isInGameProgress ? (
                    <div style={styles.notPlayedBanner}>
                      <div style={{ flex: 1 }}>
                        <strong style={{ display: 'block', fontSize: '14px', color: '#ffffff' }}>
                          Manche officielle en cours ({currentQuestionNumber || 1}/5)
                        </strong>
                        <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                          Score en cours : {(currentScore || 0).toLocaleString(lang === 'fr' ? 'fr-FR' : 'en-US')} pts • Terminez les 5 questions pour valider votre classement mondial !
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          if (onResumeGame) onResumeGame();
                          else onClose();
                        }}
                        style={styles.playDailyFromLeaderboardBtn}
                      >
                        <Play size={14} fill="#0b0f19" />
                        <span>Reprendre ma partie</span>
                      </button>
                    </div>
                  ) : alreadyPlayedData ? (
                    <div style={styles.notPlayedBanner}>
                      <div style={{ flex: 1 }}>
                        <strong style={{ display: 'block', fontSize: '14px', color: '#ffffff' }}>
                          Manche officielle du jour terminée avec succès !
                        </strong>
                        <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                          Score : {(alreadyPlayedData.scoreTotal || 0).toLocaleString(lang === 'fr' ? 'fr-FR' : 'en-US')} pts • Vos résultats sont enregistrés.
                        </span>
                      </div>
                      <button
                        onClick={() => setActiveTab('results')}
                        style={styles.playDailyDoneBtn}
                      >
                        <CheckCircle2 size={14} color="#10b981" />
                        <span>Voir mes réponses</span>
                      </button>
                    </div>
                  ) : (
                    <div style={styles.notPlayedBanner}>
                      <div style={{ flex: 1 }}>
                        <strong style={{ display: 'block', fontSize: '14px', color: '#ffffff' }}>
                          {t.notPlayedYetTitle}
                        </strong>
                        <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                          {t.notPlayedYetSub}
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          onClose();
                          if (onStartRound) onStartRound();
                        }}
                        style={styles.playDailyFromLeaderboardBtn}
                      >
                        <Play size={14} fill="#0b0f19" />
                        <span>{t.playDailyBtn}</span>
                      </button>
                    </div>
                  )}

                  {/* Podium Top 3 */}
                  {dailyScores.length >= 3 && (
                    <div style={styles.podiumContainer}>
                      {/* 2ème place */}
                      <div style={{ ...styles.podiumStep, ...styles.podiumSilver }}>
                        <div style={styles.medalCircleSilver}>🥈</div>
                        <PlayerAvatar
                          photoUrl={dailyScores[1].photo_url || (dailyScores[1].user_id === currentUserId ? (user?.photoURL || stats?.photo_url) : '')}
                          pseudo={dailyScores[1].pseudo}
                          size={46}
                          borderColor="#94a3b8"
                          style={{ margin: '4px 0 6px 0' }}
                        />
                        <span style={styles.podiumName}>{dailyScores[1].pseudo?.split(' ')[0] || 'Joueur'}</span>
                        <strong style={styles.podiumScore}>
                          {dailyScores[1].score_total.toLocaleString(lang === 'fr' ? 'fr-FR' : 'en-US')}
                        </strong>
                      </div>

                      {/* 1ère place */}
                      <div style={{ ...styles.podiumStep, ...styles.podiumGold }}>
                        <Crown size={22} color="#f59e0b" style={styles.podiumCrown} />
                        <div style={styles.medalCircleGold}>🥇</div>
                        <PlayerAvatar
                          photoUrl={dailyScores[0].photo_url || (dailyScores[0].user_id === currentUserId ? (user?.photoURL || stats?.photo_url) : '')}
                          pseudo={dailyScores[0].pseudo}
                          size={54}
                          borderColor="#f59e0b"
                          style={{ margin: '4px 0 6px 0', boxShadow: '0 0 16px rgba(245, 158, 11, 0.45)' }}
                        />
                        <span style={styles.podiumName}>{dailyScores[0].pseudo?.split(' ')[0] || 'Joueur'}</span>
                        <strong style={{ ...styles.podiumScore, color: '#f59e0b' }}>
                          {dailyScores[0].score_total.toLocaleString(lang === 'fr' ? 'fr-FR' : 'en-US')}
                        </strong>
                      </div>

                      {/* 3ème place */}
                      <div style={{ ...styles.podiumStep, ...styles.podiumBronze }}>
                        <div style={styles.medalCircleBronze}>🥉</div>
                        <PlayerAvatar
                          photoUrl={dailyScores[2].photo_url || (dailyScores[2].user_id === currentUserId ? (user?.photoURL || stats?.photo_url) : '')}
                          pseudo={dailyScores[2].pseudo}
                          size={46}
                          borderColor="#d97706"
                          style={{ margin: '4px 0 6px 0' }}
                        />
                        <span style={styles.podiumName}>{dailyScores[2].pseudo?.split(' ')[0] || 'Joueur'}</span>
                        <strong style={styles.podiumScore}>
                          {dailyScores[2].score_total.toLocaleString(lang === 'fr' ? 'fr-FR' : 'en-US')}
                        </strong>
                      </div>
                    </div>
                  )}

                  {/* Liste complète des scores du jour */}
                  <div style={styles.scoresList}>
                    {dailyScores.length > 0 ? (
                      dailyScores.map((item, idx) => {
                        const isMe = item.user_id === currentUserId;
                        const itemPhoto = item.photo_url || (isMe ? (user?.photoURL || stats?.photo_url) : '');
                        return (
                          <div
                            key={item.id || idx}
                            style={{
                              ...styles.scoreRow,
                              ...(isMe ? styles.scoreRowMe : {}),
                            }}
                          >
                            <div style={styles.rankNum}>
                              {item.rank === 1 ? '🥇' : item.rank === 2 ? '🥈' : item.rank === 3 ? '🥉' : `#${item.rank}`}
                            </div>

                            <PlayerAvatar
                              photoUrl={itemPhoto}
                              pseudo={item.pseudo}
                              size={38}
                              borderColor={isMe ? '#10b981' : null}
                            />

                            <div style={styles.playerInfo}>
                              <div style={styles.nameRow}>
                                <span style={styles.playerName}>
                                  {item.pseudo || (lang === 'fr' ? 'Joueur Anonyme' : 'Anonymous Player')}
                                </span>
                                {isMe && <span style={styles.youBadge}>{t.youBadge}</span>}
                              </div>
                              <span style={styles.playerEmojiGrid}>
                                {item.grille_emoji || '🟩🟩🟩'}
                              </span>
                            </div>

                            <div style={styles.playerScore}>
                              <span style={styles.scoreVal}>
                                {(item.score_total || 0).toLocaleString(lang === 'fr' ? 'fr-FR' : 'en-US')}
                              </span>
                              <span style={styles.scoreUnit}>pts</span>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div style={styles.emptyResultsBox}>
                        <p>{t.emptyLeaderboard}</p>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                /* CLASSEMENT FINAL / CUMUL DES POINTS */
                <div style={styles.scoresList}>
                  {globalScores.length > 0 ? (
                    globalScores.map((item, idx) => {
                      const isMe = item.id === currentUserId;
                      const totalCumule = item.score_total_cumule || item.total_points || item.meilleur_score || 0;
                      const itemPhoto = item.photo_url || (isMe ? (user?.photoURL || stats?.photo_url) : '');
                      return (
                        <div
                          key={item.id || idx}
                          style={{
                            ...styles.scoreRow,
                            ...(isMe ? styles.scoreRowMe : {}),
                          }}
                        >
                          <div style={styles.rankNum}>
                            {idx === 0 ? '👑' : `#${idx + 1}`}
                          </div>

                          <PlayerAvatar
                            photoUrl={itemPhoto}
                            pseudo={item.pseudo}
                            size={38}
                            borderColor={isMe ? '#10b981' : null}
                          />

                          <div style={styles.playerInfo}>
                            <div style={styles.nameRow}>
                              <span style={styles.playerName}>
                                {item.pseudo || (lang === 'fr' ? 'Joueur BizGames' : 'BizGames Player')}
                              </span>
                              {isMe && <span style={styles.youBadge}>{t.youBadge}</span>}
                            </div>
                            <span style={styles.playerEmojiGrid}>
                              {item.parties_jouees || 1} {lang === 'fr' ? 'jours joués' : 'days played'} • {item.streak_actuel || 0} 🔥 {t.streakLabel} • Record : {(item.meilleur_score || 0).toLocaleString(lang === 'fr' ? 'fr-FR' : 'en-US')} pts
                            </span>
                          </div>

                          <div style={styles.playerScore}>
                            <span style={styles.scoreVal}>
                              {totalCumule.toLocaleString(lang === 'fr' ? 'fr-FR' : 'en-US')}
                            </span>
                            <span style={styles.scoreUnit}>{lang === 'fr' ? 'pts cumulés' : 'total pts'}</span>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div style={styles.emptyResultsBox}>
                      <p>{t.emptyLeaderboard}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ============================================================ */}
          {/* ONGLET 4 : HISTORIQUE DÉTAILLÉ                               */}
          {/* ============================================================ */}
          {activeTab === 'results' && (
            <div style={styles.panelContainer}>
              <div style={styles.panelHeaderBlock}>
                <h2 style={styles.panelTitle}>{t.resultsTitle}</h2>
                <p style={styles.panelDescription}>{t.resultsDesc}</p>
              </div>

              {history.length > 0 ? (
                <div style={styles.resultsList}>
                  {history.map((game, index) => (
                    <div key={game.id || index} style={styles.resultHistoryCard}>
                      <div style={styles.resultHistoryHeader}>
                        <div style={styles.resultDatePill}>
                          <Calendar size={13} color="#94a3b8" />
                          <span>{game.date || t.recentRound}</span>
                        </div>
                        <div style={styles.resultScoreBlock}>
                          <span style={styles.resultScoreValue}>
                            {(game.score_total || 0).toLocaleString(lang === 'fr' ? 'fr-FR' : 'en-US')}
                          </span>
                          <span style={styles.resultScoreMax}>{t.outOfPoints}</span>
                        </div>
                      </div>

                      <div style={styles.resultDetailsRow}>
                        <span style={styles.resultEmojiGrid}>
                          {game.details_par_question && game.details_par_question.length > 0
                            ? game.details_par_question.map((q) => getScoreEmoji(q.score, q.distance_km)).join('')
                            : (game.grille_emoji || '🟩🟩🟩')}
                        </span>
                        <div style={styles.resultChrono}>
                          <Clock size={13} color="#94a3b8" />
                          <span>{game.temps_total_secondes || 60}s</span>
                        </div>
                      </div>

                      {/* Détail par question avec accordéon interactif */}
                      {game.details_par_question && game.details_par_question.length > 0 && (
                        <div style={styles.questionBreakdownList}>
                          <div style={styles.breakdownHeaderTitle}>
                            <span>Questions & Réponses ({game.details_par_question.length}) :</span>
                          </div>
                          {game.details_par_question.map((q, qIdx) => {
                            const poolQ = questionsPool.find((p) => p.id === q.question_id);
                            const qText = q.question_texte || poolQ?.texte || `Question #${qIdx + 1}`;
                            const lieu = q.lieu_nom || poolQ?.lieu_nom || '';
                            const pays = q.pays || poolQ?.pays || '';
                            const explication = q.explication || poolQ?.explication || '';
                            const itemKey = `${game.id || index}_${qIdx}`;
                            const isExpanded = expandedQuestionKey === itemKey;

                            return (
                              <div key={qIdx} style={styles.breakdownItemCard}>
                                <button
                                  type="button"
                                  onClick={() => setExpandedQuestionKey(isExpanded ? null : itemKey)}
                                  style={styles.breakdownItemBtn}
                                >
                                  <div style={styles.breakdownItemLeft}>
                                    <span
                                      style={{
                                        ...styles.breakdownNumBadge,
                                        background: getScoreColor(q.score, q.distance_km),
                                        color: '#ffffff',
                                      }}
                                    >
                                      Q{qIdx + 1}
                                    </span>
                                    <span style={styles.breakdownItemTexte}>{qText}</span>
                                  </div>
                                  <div style={styles.breakdownItemRight}>
                                    <span style={styles.breakdownDistBadge}>
                                      {q.distance_km < 1 ? '< 1 km' : `${q.distance_km.toLocaleString(lang === 'fr' ? 'fr-FR' : 'en-US')} km`}
                                    </span>
                                    <strong
                                      style={{
                                        ...styles.breakdownScoreBadge,
                                        color: getScoreColor(q.score, q.distance_km),
                                      }}
                                    >
                                      {q.score > 10 ? q.score.toLocaleString(lang === 'fr' ? 'fr-FR' : 'en-US') : (q.score * 100)} / 1 000
                                    </strong>
                                    {isExpanded ? <ChevronUp size={14} color="#64748b" /> : <ChevronDown size={14} color="#64748b" />}
                                  </div>
                                </button>

                                {isExpanded && (
                                  <div style={styles.breakdownExpandedContent}>
                                    {(lieu || pays) && (
                                      <div style={styles.breakdownTargetLoc}>
                                        <MapPin size={13} color="#10b981" />
                                        <strong>{lieu}</strong>
                                        {pays && <span style={{ color: '#94a3b8' }}> • {pays}</span>}
                                      </div>
                                    )}
                                    {explication && (
                                      <p style={styles.breakdownExplicationText}>
                                        💡 {explication}
                                      </p>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div style={styles.emptyResultsBox}>
                  <p>{t.emptyResults}</p>
                  <p style={{ fontSize: '12px', color: '#64748b' }}>
                    {t.emptyResultsHint}
                  </p>
                  <button
                    onClick={() => {
                      if (alreadyPlayedData) return;
                      onClose();
                      if (onStartRound) onStartRound();
                    }}
                    style={{
                      ...styles.startRoundFromResultsBtn,
                      opacity: alreadyPlayedData ? 0.6 : 1,
                      cursor: alreadyPlayedData ? 'default' : 'pointer',
                    }}
                  >
                    {alreadyPlayedData ? (
                      <>
                        <CheckCircle2 size={15} color="#10b981" />
                        <span>Manche du jour déjà terminée</span>
                      </>
                    ) : (
                      <>
                        <Play size={15} fill="#0b0f19" />
                        <span>{t.launchDailyRound}</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ============================================================ */}
          {/* ONGLET : PROPOSER UNE QUESTION (PROGRAMME CONTRIBUTEUR ÉCO)   */}
          {/* ============================================================ */}
          {activeTab === 'contributions' && (
            <div style={styles.panelContainer}>
              <PlayerContributionsTab
                authInfo={authInfo}
                onOpenAuth={onOpenAuth}
                history={history}
              />
            </div>
          )}

          {/* ============================================================ */}
          {/* ONGLET : AMIS INVITÉS & BONUS DE PARRAINAGE (+500 PTS)       */}
          {/* ============================================================ */}
          {activeTab === 'invite' && (
            <div style={styles.panelContainer}>
              {/* En-tête de la page */}
              <div style={styles.panelHeaderBlock}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '6px' }}>
                  <h2 style={styles.panelTitle}>Parrainage & Amis Invités</h2>
                  <span style={{
                    background: 'rgba(245, 158, 11, 0.15)',
                    color: '#f59e0b',
                    border: '1px solid rgba(245, 158, 11, 0.35)',
                    fontSize: '12px',
                    fontWeight: '800',
                    padding: '3px 10px',
                    borderRadius: '999px',
                  }}>
                    🎁 +500 PTS / AMI VALIDÉ
                  </span>
                </div>
                <p style={styles.panelDescription}>
                  Invitez vos proches à défier votre culture business sur le globe 3D. Dès qu'un ami crée son compte et termine sa première manche officielle, vous empochez immédiatement <strong>+500 points au classement général</strong>.
                </p>
              </div>

              {/* Résumé des KPIs de parrainage */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
                gap: '14px',
                marginBottom: '24px',
              }}>
                {/* 1. Amis parrainés validés */}
                <div style={{ ...styles.kpiCard, background: 'rgba(16, 185, 129, 0.08)', borderColor: 'rgba(16, 185, 129, 0.25)' }}>
                  <div style={{ ...styles.kpiIconBox, background: 'rgba(16, 185, 129, 0.15)' }}>
                    <Users size={20} color="#10b981" />
                  </div>
                  <span style={{ ...styles.kpiValue, color: '#10b981' }}>
                    {referralsList.filter((f) => f.referral_rewarded).length}
                  </span>
                  <span style={styles.kpiLabel}>Amis Validés</span>
                  <span style={styles.kpiSub}>1ère manche terminée</span>
                </div>

                {/* 2. Total Points Bonus Gagnés */}
                <div style={{ ...styles.kpiCard, background: 'rgba(245, 158, 11, 0.08)', borderColor: 'rgba(245, 158, 11, 0.25)' }}>
                  <div style={{ ...styles.kpiIconBox, background: 'rgba(245, 158, 11, 0.15)' }}>
                    <Trophy size={20} color="#f59e0b" />
                  </div>
                  <span style={{ ...styles.kpiValue, color: '#f59e0b' }}>
                    +{(referralsList.filter((f) => f.referral_rewarded).length * 500).toLocaleString('fr-FR')}
                  </span>
                  <span style={styles.kpiLabel}>Points Bonus Rapportés</span>
                  <span style={styles.kpiSub}>crédités à votre classement général</span>
                </div>

                {/* 3. En attente de première manche */}
                <div style={{ ...styles.kpiCard, background: 'rgba(56, 189, 248, 0.08)', borderColor: 'rgba(56, 189, 248, 0.25)' }}>
                  <div style={{ ...styles.kpiIconBox, background: 'rgba(56, 189, 248, 0.15)' }}>
                    <Sparkles size={20} color="#38bdf8" />
                  </div>
                  <span style={{ ...styles.kpiValue, color: '#38bdf8' }}>
                    {referralsList.filter((f) => !f.referral_rewarded).length}
                  </span>
                  <span style={styles.kpiLabel}>En Attente</span>
                  <span style={styles.kpiSub}>compte créé, manche en attente</span>
                </div>
              </div>

              {/* Boîte d'invitation avec Lien & Partages */}
              <div style={{ ...styles.inviteHeroCard, marginBottom: '28px' }}>
                <div style={styles.inviteCardHeader}>
                  <div style={styles.inviteCardIconBadge}>
                    <UserPlus size={22} color="#10b981" />
                  </div>
                  <div style={styles.inviteCardHeaderText}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <h3 style={styles.inviteCardTitle}>Partagez votre lien de parrainage unique</h3>
                      <span style={{ ...styles.inviteBadgeFree, background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', borderColor: 'rgba(245, 158, 11, 0.3)' }}>
                        🎁 +500 PTS
                      </span>
                    </div>
                    <p style={styles.inviteCardSubtitle}>
                      Chaque joueur qui clique sur votre lien est automatiquement relié à votre compte.
                    </p>
                  </div>
                </div>

                {/* Champ Lien & Bouton Copier */}
                <div style={styles.inviteLinkContainer}>
                  <div style={styles.inviteLinkInputBox}>
                    <Link2 size={16} color="#10b981" style={{ flexShrink: 0 }} />
                    <input
                      type="text"
                      readOnly
                      value={inviteUrl}
                      style={styles.inviteLinkInput}
                      onClick={(e) => e.target.select()}
                      aria-label="Lien d'invitation"
                    />
                  </div>
                  <button
                    onClick={handleCopyInviteLink}
                    style={inviteCopied ? styles.inviteCopyBtnCopied : styles.inviteCopyBtn}
                    title={t.inviteCopyBtn}
                  >
                    {inviteCopied ? <Check size={16} color="#03120e" /> : <Copy size={16} />}
                    <span>{inviteCopied ? t.inviteLinkCopied : t.inviteCopyBtn}</span>
                  </button>
                </div>

                {/* Boutons de Partage Direct */}
                <div style={styles.inviteShareGrid}>
                  {typeof navigator !== 'undefined' && navigator.share && (
                    <button
                      onClick={handleNativeShare}
                      style={styles.inviteShareNativeBtn}
                      title={t.inviteShareBtn}
                    >
                      <Share2 size={15} />
                      <span>{t.inviteShareBtn}</span>
                    </button>
                  )}

                  <a
                    href={inviteWhatsapp}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ ...styles.inviteSocialBtn, background: '#25D366' }}
                    title="Partager sur WhatsApp"
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="white">
                      <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0012.04 2m.01 1.67c4.54 0 8.24 3.7 8.24 8.24 0 2.2-.86 4.28-2.42 5.84a8.19 8.19 0 01-5.82 2.41c-1.45 0-2.88-.39-4.14-1.13l-.3-.18-3.08.81.82-3-.2-.31a8.17 8.17 0 01-1.25-4.44c0-4.54 3.7-8.24 8.24-8.24m4.54 11.66c-.25-.13-1.47-.72-1.7-.81-.23-.08-.39-.13-.56.13-.17.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.13-1.06-.39-2.01-1.24-.74-.66-1.25-1.48-1.39-1.73-.14-.25-.02-.39.11-.51.11-.11.25-.29.38-.44.13-.15.17-.25.25-.42.08-.17.04-.32-.02-.44-.06-.13-.56-1.35-.77-1.85-.2-.49-.41-.42-.56-.43h-.48c-.17 0-.44.06-.67.31-.23.25-.88.86-.88 2.1 0 1.24.9 2.44 1.03 2.61.13.17 1.77 2.7 4.29 3.79.6.26 1.07.41 1.43.53.6.19 1.15.16 1.58.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.15-1.18-.06-.11-.23-.17-.48-.29z"/>
                    </svg>
                    <span>{t.inviteShareWhatsapp}</span>
                  </a>

                  <a
                    href={inviteSms}
                    style={{ ...styles.inviteSocialBtn, background: '#059669' }}
                    title="Partager par SMS"
                  >
                    <MessageCircle size={15} color="#ffffff" />
                    <span>{t.inviteShareSms}</span>
                  </a>

                  <a
                    href={inviteTelegram}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ ...styles.inviteSocialBtn, background: '#229ED9' }}
                    title="Partager sur Telegram"
                  >
                    <Send size={15} color="#ffffff" />
                    <span>{t.inviteShareTelegram}</span>
                  </a>

                  <a
                    href={inviteLinkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ ...styles.inviteSocialBtn, background: '#0A66C2' }}
                    title="Partager sur LinkedIn"
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="white">
                      <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"/>
                    </svg>
                    <span>{t.inviteShareLinkedin}</span>
                  </a>

                  <a
                    href={inviteX}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ ...styles.inviteSocialBtn, background: '#000000', border: '1px solid rgba(255,255,255,0.2)' }}
                    title="Partager sur X / Twitter"
                  >
                    <span style={{ fontWeight: '900', fontSize: '13px' }}>𝕏</span>
                    <span>{t.inviteShareX}</span>
                  </a>

                  <a
                    href={inviteEmail}
                    style={{ ...styles.inviteSocialBtn, background: 'rgba(255, 255, 255, 0.08)', border: '1px solid rgba(255, 255, 255, 0.15)' }}
                    title="Envoyer par email"
                  >
                    <Mail size={15} color="#e2e8f0" />
                    <span>{t.inviteShareEmail}</span>
                  </a>
                </div>
              </div>

              {/* LISTE COMPLÈTE DES FILLEULS INVITÉS AVEC LEURS SCORES ET LES POINTS RAPPORTÉS */}
              <div style={{ marginTop: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
                  <h3 style={{ fontSize: '17px', fontWeight: '800', color: '#ffffff', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>Vos Filleuls & Amis Connectés</span>
                    <span style={{
                      background: 'rgba(16, 185, 129, 0.15)',
                      color: '#10b981',
                      fontSize: '12px',
                      padding: '2px 8px',
                      borderRadius: '12px',
                    }}>
                      {referralsList.length}
                    </span>
                  </h3>
                  <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                    Mise à jour en temps réel
                  </span>
                </div>

                {loadingReferrals ? (
                  <div style={styles.emptyResultsBox}>
                    <Loader2 size={24} color="#10b981" className="animate-spin" style={{ margin: '0 auto 10px' }} />
                    <p>Chargement de vos filleuls et scores...</p>
                  </div>
                ) : referralsList.length > 0 ? (
                  <div style={styles.scoresList}>
                    {referralsList.map((filleul, idx) => (
                      <div
                        key={filleul.uid || idx}
                        style={{
                          ...styles.scoreRow,
                          borderLeft: filleul.referral_rewarded ? '3px solid #10b981' : '3px solid #f59e0b',
                          background: filleul.referral_rewarded ? 'rgba(16, 185, 129, 0.05)' : 'rgba(255, 255, 255, 0.02)',
                        }}
                      >
                        <div style={styles.rankNum}>
                          {filleul.referral_rewarded ? '✅' : '⏳'}
                        </div>

                        <PlayerAvatar
                          photoUrl={filleul.photo_url}
                          pseudo={filleul.pseudo}
                          size={38}
                          borderColor={filleul.referral_rewarded ? '#10b981' : '#f59e0b'}
                        />

                        <div style={styles.playerInfo}>
                          <div style={styles.nameRow}>
                            <span style={styles.playerName}>{filleul.pseudo}</span>
                            {filleul.referral_rewarded ? (
                              <span style={{
                                background: 'rgba(16, 185, 129, 0.15)',
                                color: '#10b981',
                                border: '1px solid rgba(16, 185, 129, 0.3)',
                                fontSize: '10px',
                                fontWeight: '700',
                                padding: '1px 6px',
                                borderRadius: '6px',
                              }}>
                                +500 PTS VALIDÉS
                              </span>
                            ) : (
                              <span style={{
                                background: 'rgba(245, 158, 11, 0.15)',
                                color: '#f59e0b',
                                border: '1px solid rgba(245, 158, 11, 0.3)',
                                fontSize: '10px',
                                fontWeight: '700',
                                padding: '1px 6px',
                                borderRadius: '6px',
                              }}>
                                EN ATTENTE DE 1ÈRE MANCHE
                              </span>
                            )}
                          </div>
                          <span style={styles.playerEmojiGrid}>
                            Score de l'ami : <strong>{(filleul.total_points || 0).toLocaleString('fr-FR')} pts</strong> • {filleul.parties_jouees || 0} manche{(filleul.parties_jouees || 0) > 1 ? 's' : ''} jouée{(filleul.parties_jouees || 0) > 1 ? 's' : ''} • Record : {(filleul.meilleur_score || 0).toLocaleString('fr-FR')} pts
                          </span>
                        </div>

                        <div style={styles.playerScore}>
                          <span style={{ ...styles.scoreVal, color: filleul.referral_rewarded ? '#10b981' : '#94a3b8' }}>
                            {filleul.referral_rewarded ? '+500' : '0'}
                          </span>
                          <span style={styles.scoreUnit}>
                            {filleul.referral_rewarded ? 'pts pour vous' : 'en attente'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={styles.emptyResultsBox}>
                    <div style={{ fontSize: '36px', marginBottom: '10px' }}>🤝</div>
                    <strong style={{ display: 'block', fontSize: '15px', color: '#ffffff', marginBottom: '6px' }}>
                      Vous n'avez pas encore de filleul enregistré
                    </strong>
                    <p style={{ margin: 0, fontSize: '13px', color: '#94a3b8', maxWidth: '420px', marginLeft: 'auto', marginRight: 'auto' }}>
                      Partagez votre lien d'invitation à un collègue ou un proche. Dès qu'il crée son compte et joue sa première manche, il apparaîtra ici et vous rapportera automatiquement <strong>+500 points</strong> !
                    </p>
                    <button
                      onClick={handleCopyInviteLink}
                      style={{
                        ...styles.dailyLaunchBtn,
                        margin: '16px auto 0',
                        display: 'inline-flex',
                      }}
                    >
                      <Copy size={15} />
                      <span>{inviteCopied ? 'Lien copié !' : 'Copier mon lien de parrainage'}</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* ONGLET 5 : NOTIFICATIONS & ABONNEMENTS                       */}
          {/* ============================================================ */}
          {activeTab === 'notifications' && (
            <PlayerNotificationsTab
              user={user}
              stats={stats}
              isUserLoggedIn={isUserLoggedIn}
              lang="fr"
              onOpenAuth={onOpenAuth}
            />
          )}

          {/* ============================================================ */}
          {/* ONGLET 6 : PARAMÈTRES & MON COMPTE                           */}
          {/* ============================================================ */}
          {activeTab === 'settings' && (
            <PlayerSettingsTab
              user={user}
              stats={stats}
              isUserLoggedIn={isUserLoggedIn}
              lang="fr"
              onOpenAuth={onOpenAuth}
              onCloseDashboard={onClose}
              onProfileUpdated={() => {
                // Rafraîchir les données de l'historique ou du profil si besoin
              }}
            />
          )}

        </main>
      </div>

      {/* 3. MODAL "GET THE APP" (PWA / INSTALLATION MOBILE) */}
      {showGetAppModal && (
        <div style={styles.appModalBackdrop} onClick={() => setShowGetAppModal(false)}>
          <div style={styles.appModalCard} onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setShowGetAppModal(false)}
              style={styles.closeAppModalBtn}
              aria-label="Fermer"
            >
              <X size={18} />
            </button>

            <div style={styles.appModalHeader}>
              <div style={styles.appLogoCircle}>
                <Globe2 size={28} color="#10b981" />
              </div>
              <h3 style={styles.appModalTitle}>{t.pwaTitle}</h3>
              <p style={styles.appModalDesc}>{t.pwaDesc}</p>
            </div>

            <div style={styles.installStepsBox}>
              <div style={styles.installStep}>
                <strong style={styles.stepTitle}>{t.pwaIosTitle}</strong>
                <p style={styles.stepText}>
                  {t.pwaIosStep1}<br />
                  {t.pwaIosStep2}<br />
                  {t.pwaIosStep3}
                </p>
              </div>

              <div style={styles.installStep}>
                <strong style={styles.stepTitle}>{t.pwaAndroidTitle}</strong>
                <p style={styles.stepText}>
                  {t.pwaAndroidStep1}<br />
                  {t.pwaAndroidStep2}
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowGetAppModal(false)}
              style={styles.closeInstallBtn}
            >
              <span>{t.pwaGotIt}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  fullscreenContainer: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 4000,
    background: '#03120e',
    color: '#ffffff',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    fontFamily: 'var(--font-body)',
  },
  topHeader: {
    height: '62px',
    background: 'rgba(3, 18, 14, 0.98)',
    borderBottom: '1px solid rgba(16, 185, 129, 0.22)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 18px',
    flexShrink: 0,
    gap: '12px',
  },
  topHeaderLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flexShrink: 0,
  },
  closeIconButton: {
    background: 'rgba(16, 185, 129, 0.1)',
    border: '1px solid rgba(16, 185, 129, 0.25)',
    color: '#34d399',
    cursor: 'pointer',
    padding: '6px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '8px',
    transition: 'all 0.15s ease',
  },
  brandTitle: {
    fontFamily: 'var(--font-heading)',
    fontSize: '20px',
    fontWeight: '800',
    color: '#ffffff',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  brandBadge: {
    fontSize: '10px',
    fontWeight: '800',
    letterSpacing: '0.5px',
    color: '#10b981',
    background: 'rgba(16, 185, 129, 0.12)',
    border: '1px solid rgba(16, 185, 129, 0.3)',
    borderRadius: '6px',
    padding: '2px 6px',
  },
  topHeaderRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    flexWrap: 'nowrap',
  },
  getAppBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    borderRadius: '24px',
    border: '1px solid rgba(16, 185, 129, 0.45)',
    background: 'linear-gradient(180deg, #062b21, #03120e)',
    padding: '6px 12px',
    fontSize: '12px',
    fontWeight: '800',
    color: '#34d399',
    cursor: 'pointer',
    boxShadow: '0 0 15px rgba(16, 185, 129, 0.25)',
    whiteSpace: 'nowrap',
  },
  appIcons: {
    display: 'flex',
    alignItems: 'center',
    gap: '3px',
    fontSize: '11px',
  },
  signOutBtn: {
    background: 'rgba(239, 68, 68, 0.12)',
    border: '1px solid rgba(239, 68, 68, 0.35)',
    borderRadius: '10px',
    color: '#fca5a5',
    fontSize: '12px',
    fontWeight: '700',
    cursor: 'pointer',
    padding: '6px 10px',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    transition: 'all 0.15s ease',
    whiteSpace: 'nowrap',
    flexShrink: 0,
  },
  signInBtn: {
    background: 'linear-gradient(135deg, #10b981, #059669)',
    border: 'none',
    color: '#03120e',
    borderRadius: '12px',
    padding: '6px 14px',
    fontSize: '12px',
    fontWeight: '800',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  mainLayout: {
    display: 'flex',
    flex: 1,
    overflow: 'hidden',
  },
  mainLayoutMobile: {
    flexDirection: 'column',
  },
  sidebar: {
    width: '250px',
    flexShrink: 0,
    background: '#020907',
    borderRight: '1px solid rgba(16, 185, 129, 0.18)',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    padding: '16px 12px',
    gap: '12px',
  },
  sidebarMobile: {
    width: '100%',
    flexShrink: 0,
    borderRight: 'none',
    borderBottom: '1px solid rgba(16, 185, 129, 0.18)',
    padding: '8px 12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    background: '#020907',
  },
  sidebarSection: {
    display: 'flex',
    flexDirection: 'column',
  },
  mobileActionRow: {
    width: '100%',
  },
  mobileTabsList: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: '6px',
    overflowX: 'auto',
    overflowY: 'hidden',
    paddingBottom: '2px',
    whiteSpace: 'nowrap',
  },
  sidebarNavList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    flex: 1,
  },
  dailyActionBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '11px 14px',
    borderRadius: '12px',
    border: 'none',
    background: 'linear-gradient(135deg, #10b981, #059669)',
    color: '#03120e',
    fontSize: '13px',
    cursor: 'pointer',
    boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)',
    width: '100%',
    transition: 'all 0.15s ease',
  },
  dailyActionPlayedBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '11px 14px',
    borderRadius: '12px',
    border: '1px solid rgba(16, 185, 129, 0.3)',
    background: 'rgba(16, 185, 129, 0.1)',
    color: '#34d399',
    fontSize: '13px',
    cursor: 'pointer',
    width: '100%',
  },
  badgeLive: {
    fontSize: '9px',
    fontWeight: '800',
    background: 'rgba(3, 18, 14, 0.25)',
    color: '#03120e',
    padding: '2px 7px',
    borderRadius: '10px',
  },
  badgeDone: {
    fontSize: '11px',
    fontWeight: '800',
    color: '#10b981',
  },
  navItemBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '10px 12px',
    borderRadius: '10px',
    border: '1px solid transparent',
    background: 'transparent',
    color: '#cbd5e1',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    whiteSpace: 'nowrap',
    width: '100%',
  },
  navItemActive: {
    background: 'rgba(16, 185, 129, 0.16)',
    color: '#34d399',
    fontWeight: '700',
    borderColor: 'rgba(16, 185, 129, 0.35)',
  },
  navItemInner: {
    display: 'flex',
    alignItems: 'center',
    gap: '9px',
  },
  pillFreeNav: {
    fontSize: '10px',
    fontWeight: '800',
    color: '#10b981',
    background: 'rgba(16, 185, 129, 0.12)',
    padding: '2px 6px',
    borderRadius: '6px',
  },
  sidebarFooter: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    paddingTop: '12px',
    borderTop: '1px solid rgba(16, 185, 129, 0.12)',
  },
  rulesBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 10px',
    borderRadius: '8px',
    border: 'none',
    background: 'transparent',
    color: '#94a3b8',
    fontSize: '12px',
    cursor: 'pointer',
    textAlign: 'left',
  },
  freeFootnote: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '11px',
    color: '#64748b',
    padding: '0 8px',
  },
  contentArea: {
    flex: 1,
    overflowY: 'auto',
    padding: '24px 28px',
    background: 'radial-gradient(ellipse at 50% 0%, #062b21 0%, #03120e 65%, #020907 100%)',
  },
  contentAreaMobile: {
    padding: '16px 12px',
  },
  panelContainer: {
    maxWidth: '860px',
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  panelHeaderBlock: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  panelTitle: {
    fontSize: '22px',
    fontWeight: '800',
    color: '#ffffff',
    fontFamily: 'var(--font-heading)',
  },
  panelDescription: {
    fontSize: '13px',
    color: '#94a3b8',
    lineHeight: '1.4',
  },
  dailyReadyBanner: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 20px',
    background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.18), rgba(6, 43, 33, 0.95))',
    border: '1px solid rgba(16, 185, 129, 0.4)',
    borderRadius: '16px',
    gap: '16px',
    flexWrap: 'wrap',
    boxShadow: '0 8px 24px rgba(16, 185, 129, 0.15)',
  },
  dailyReadyLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    flex: 1,
    minWidth: '240px',
  },
  dailyReadyPulseIcon: {
    width: '44px',
    height: '44px',
    borderRadius: '12px',
    background: 'linear-gradient(135deg, #10b981, #34d399)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    boxShadow: '0 0 15px rgba(16, 185, 129, 0.4)',
  },
  dailyReadyTitle: {
    fontSize: '15px',
    fontWeight: '800',
    color: '#ffffff',
    margin: 0,
  },
  dailyReadyDesc: {
    fontSize: '12px',
    color: '#a7f3d0',
    margin: '3px 0 0 0',
    lineHeight: '1.4',
  },
  dailyLaunchBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 18px',
    background: 'linear-gradient(135deg, #10b981, #059669)',
    border: 'none',
    borderRadius: '10px',
    color: '#03120e',
    fontWeight: '800',
    fontSize: '13px',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)',
  },
  dailyDoneBanner: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 20px',
    background: 'rgba(6, 27, 21, 0.8)',
    border: '1px solid rgba(16, 185, 129, 0.25)',
    borderRadius: '16px',
    gap: '16px',
    flexWrap: 'wrap',
  },
  dailyDoneLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flex: 1,
    minWidth: '240px',
  },
  dailyDoneCheckIcon: {
    width: '40px',
    height: '40px',
    borderRadius: '10px',
    background: 'rgba(16, 185, 129, 0.15)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  dailyDoneTitle: {
    fontSize: '14px',
    fontWeight: '800',
    color: '#34d399',
    margin: 0,
  },
  dailyDoneDesc: {
    fontSize: '12px',
    color: '#94a3b8',
    margin: '3px 0 0 0',
  },
  dailyDoneActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  bannerSecondaryBtn: {
    padding: '8px 14px',
    borderRadius: '10px',
    border: '1px solid rgba(16, 185, 129, 0.3)',
    background: 'rgba(16, 185, 129, 0.08)',
    color: '#cbd5e1',
    fontSize: '12px',
    fontWeight: '700',
    cursor: 'pointer',
  },
  bannerPrimaryBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 14px',
    borderRadius: '10px',
    border: 'none',
    background: '#10b981',
    color: '#03120e',
    fontSize: '12px',
    fontWeight: '800',
    cursor: 'pointer',
  },
  profileHeroCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '18px',
    padding: '20px 24px',
    background: 'rgba(6, 27, 21, 0.85)',
    border: '1px solid rgba(16, 185, 129, 0.22)',
    borderRadius: '20px',
    flexWrap: 'wrap',
  },
  profileAvatarBox: {
    width: '64px',
    height: '64px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #10b981, #059669)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    boxShadow: '0 0 20px rgba(16, 185, 129, 0.35)',
    overflow: 'hidden',
  },
  profileAvatarImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  profileAvatarInitial: {
    fontSize: '26px',
    fontWeight: '900',
    color: '#03120e',
  },
  profileInfoText: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    flex: 1,
    minWidth: '200px',
  },
  profileNameLine: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  profileNameTitle: {
    fontSize: '18px',
    fontWeight: '800',
    color: '#ffffff',
    margin: 0,
  },
  userStatusPill: {
    fontSize: '11px',
    fontWeight: '700',
    padding: '2px 8px',
    borderRadius: '12px',
    background: 'rgba(16, 185, 129, 0.15)',
    color: '#34d399',
    border: '1px solid rgba(16, 185, 129, 0.3)',
  },
  profileUserEmail: {
    fontSize: '12px',
    color: '#94a3b8',
  },
  rankHonorificBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    marginTop: '4px',
  },
  profileHeroActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    flexWrap: 'wrap',
  },
  profileInviteQuickBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 14px',
    borderRadius: '10px',
    border: '1px solid rgba(16, 185, 129, 0.4)',
    background: 'rgba(16, 185, 129, 0.12)',
    color: '#34d399',
    fontSize: '12px',
    fontWeight: '800',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  sidebarInviteBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '9px 12px',
    borderRadius: '10px',
    border: '1px dashed rgba(16, 185, 129, 0.35)',
    background: 'rgba(16, 185, 129, 0.06)',
    color: '#a7f3d0',
    fontSize: '12px',
    fontWeight: '700',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    width: '100%',
    marginTop: '6px',
  },
  sidebarInvitePill: {
    fontSize: '10px',
    fontWeight: '800',
    color: '#03120e',
    background: '#10b981',
    padding: '1px 6px',
    borderRadius: '6px',
  },
  inviteHeroCard: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    padding: '20px 22px',
    background: 'linear-gradient(135deg, rgba(6, 43, 33, 0.95) 0%, rgba(3, 18, 14, 0.98) 100%)',
    border: '1px solid rgba(16, 185, 129, 0.35)',
    borderRadius: '20px',
    boxShadow: '0 8px 30px rgba(16, 185, 129, 0.15)',
    position: 'relative',
    overflow: 'hidden',
  },
  inviteCardHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '14px',
  },
  inviteCardIconBadge: {
    width: '44px',
    height: '44px',
    borderRadius: '12px',
    background: 'rgba(16, 185, 129, 0.15)',
    border: '1px solid rgba(16, 185, 129, 0.3)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    boxShadow: '0 0 15px rgba(16, 185, 129, 0.25)',
  },
  inviteCardHeaderText: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    flex: 1,
  },
  inviteCardTitle: {
    fontSize: '16px',
    fontWeight: '800',
    color: '#ffffff',
    margin: 0,
    fontFamily: 'var(--font-heading)',
  },
  inviteBadgeFree: {
    fontSize: '9px',
    fontWeight: '800',
    letterSpacing: '0.5px',
    color: '#10b981',
    background: 'rgba(16, 185, 129, 0.15)',
    border: '1px solid rgba(16, 185, 129, 0.3)',
    borderRadius: '6px',
    padding: '2px 6px',
  },
  inviteCardSubtitle: {
    fontSize: '12px',
    color: '#94a3b8',
    margin: 0,
    lineHeight: '1.4',
  },
  inviteLinkContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    background: 'rgba(0, 0, 0, 0.4)',
    border: '1px solid rgba(16, 185, 129, 0.25)',
    borderRadius: '12px',
    padding: '6px 8px 6px 14px',
    flexWrap: 'wrap',
  },
  inviteLinkInputBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flex: 1,
    minWidth: '200px',
    overflow: 'hidden',
  },
  inviteLinkInput: {
    background: 'transparent',
    border: 'none',
    color: '#a7f3d0',
    fontSize: '13px',
    fontFamily: 'monospace',
    width: '100%',
    outline: 'none',
    cursor: 'pointer',
    textOverflow: 'ellipsis',
    overflow: 'hidden',
    whiteSpace: 'nowrap',
  },
  inviteCopyBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 16px',
    borderRadius: '8px',
    border: 'none',
    background: '#10b981',
    color: '#03120e',
    fontSize: '12px',
    fontWeight: '800',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    transition: 'all 0.15s ease',
    boxShadow: '0 2px 10px rgba(16, 185, 129, 0.3)',
  },
  inviteCopyBtnCopied: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 16px',
    borderRadius: '8px',
    border: '1px solid #10b981',
    background: 'rgba(16, 185, 129, 0.2)',
    color: '#34d399',
    fontSize: '12px',
    fontWeight: '800',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    boxShadow: '0 0 12px rgba(16, 185, 129, 0.4)',
  },
  inviteShareGrid: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flexWrap: 'wrap',
  },
  inviteShareNativeBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 14px',
    borderRadius: '10px',
    border: 'none',
    background: 'linear-gradient(135deg, #10b981, #059669)',
    color: '#03120e',
    fontSize: '12px',
    fontWeight: '800',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)',
  },
  inviteSocialBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '7px 12px',
    borderRadius: '10px',
    color: '#ffffff',
    fontSize: '12px',
    fontWeight: '700',
    textDecoration: 'none',
    cursor: 'pointer',
    transition: 'transform 0.15s ease, opacity 0.15s ease',
  },
  inviteMessagePreviewBox: {
    background: 'rgba(255, 255, 255, 0.02)',
    border: '1px dashed rgba(255, 255, 255, 0.1)',
    borderRadius: '10px',
    padding: '10px 14px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  invitePreviewLabel: {
    fontSize: '11px',
    fontWeight: '700',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  invitePreviewText: {
    fontSize: '12px',
    color: '#cbd5e1',
    margin: 0,
    fontStyle: 'italic',
    lineHeight: '1.4',
  },
  profileLogoutBtn: {
    background: 'rgba(239, 68, 68, 0.12)',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    borderRadius: '10px',
    color: '#fca5a5',
    padding: '8px 12px',
    fontSize: '12px',
    fontWeight: '700',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
  },
  profileEditSettingsBtn: {
    background: 'rgba(16, 185, 129, 0.12)',
    border: '1px solid rgba(16, 185, 129, 0.35)',
    borderRadius: '10px',
    color: '#34d399',
    padding: '8px 12px',
    fontSize: '12px',
    fontWeight: '700',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    transition: 'all 0.15s ease',
  },
  profileBioText: {
    fontSize: '12px',
    color: '#a7f3d0',
    margin: '2px 0 0 0',
    fontStyle: 'italic',
    lineHeight: '1.3',
  },
  profileCountryBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '11px',
    fontWeight: '700',
    color: '#cbd5e1',
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '8px',
    padding: '2px 8px',
    width: 'fit-content',
    marginTop: '2px',
  },
  linkAccountBtn: {
    background: 'linear-gradient(135deg, #10b981, #059669)',
    border: 'none',
    color: '#03120e',
    borderRadius: '10px',
    padding: '8px 14px',
    fontSize: '12px',
    fontWeight: '800',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
  },
  kpiGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
    gap: '12px',
  },
  kpiCard: {
    background: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid rgba(255, 255, 255, 0.07)',
    borderRadius: '16px',
    padding: '16px 14px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    gap: '4px',
  },
  kpiIconBox: {
    width: '36px',
    height: '36px',
    borderRadius: '10px',
    background: 'rgba(255, 255, 255, 0.04)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '4px',
  },
  kpiValue: {
    fontSize: '20px',
    fontWeight: '900',
    fontFamily: 'var(--font-heading)',
    color: '#ffffff',
  },
  kpiLabel: {
    fontSize: '11px',
    fontWeight: '700',
    color: '#cbd5e1',
  },
  kpiSub: {
    fontSize: '10px',
    color: '#64748b',
  },
  sectorsMasteryCard: {
    background: 'rgba(6, 27, 21, 0.6)',
    border: '1px solid rgba(16, 185, 129, 0.2)',
    borderRadius: '18px',
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
  },
  subCardTitle: {
    fontSize: '15px',
    fontWeight: '800',
    color: '#ffffff',
    margin: 0,
  },
  sectorBarsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  sectorBarItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  sectorBarLabelRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '12px',
  },
  sectorBarName: {
    color: '#e2e8f0',
    display: 'flex',
    alignItems: 'center',
  },
  sectorCountBadge: {
    fontSize: '11px',
    color: '#94a3b8',
    marginLeft: '6px',
    fontWeight: '500',
  },
  sectorBarPercent: {
    color: '#34d399',
  },
  progressTrack: {
    height: '6px',
    background: 'rgba(255, 255, 255, 0.06)',
    borderRadius: '4px',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: '4px',
  },
  // ─── STYLES CHALLENGE 30 JOURS (STREAK) ────────────────────────────────────
  streakChallengeCard: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    padding: '22px 24px',
    background: 'linear-gradient(135deg, rgba(20, 25, 20, 0.95) 0%, rgba(6, 20, 15, 0.98) 100%)',
    border: '1px solid rgba(249, 115, 22, 0.35)',
    borderRadius: '20px',
    boxShadow: '0 8px 32px rgba(249, 115, 22, 0.12)',
    position: 'relative',
    overflow: 'hidden',
  },
  streakChallengeHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: '16px',
    flexWrap: 'wrap',
  },
  streakFlameIconBox: {
    width: '42px',
    height: '42px',
    borderRadius: '12px',
    background: 'rgba(249, 115, 22, 0.15)',
    border: '1px solid rgba(249, 115, 22, 0.3)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  streakChallengeTitle: {
    fontSize: '18px',
    fontWeight: '800',
    color: '#ffffff',
    margin: 0,
  },
  streakLiveBadge: {
    fontSize: '11px',
    fontWeight: '800',
    background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.25), rgba(234, 88, 12, 0.35))',
    color: '#fb923c',
    border: '1px solid rgba(249, 115, 22, 0.4)',
    padding: '2px 8px',
    borderRadius: '8px',
  },
  streakChallengeSubtitle: {
    fontSize: '13px',
    color: '#94a3b8',
    margin: '4px 0 0 0',
  },
  streakNextTargetBox: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    background: 'rgba(255, 255, 255, 0.04)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    padding: '8px 12px',
    borderRadius: '10px',
  },
  streakNextTargetLabel: {
    fontSize: '11px',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: '0.4px',
  },
  streakNextTargetValue: {
    fontSize: '13px',
    color: '#fbbf24',
    fontWeight: '800',
  },
  streakProgressBarContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    background: 'rgba(0, 0, 0, 0.25)',
    padding: '12px 14px',
    borderRadius: '12px',
    border: '1px solid rgba(255, 255, 255, 0.05)',
  },
  streakProgressHeaderInfo: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    fontSize: '12px',
  },
  streakProgressPercentLabel: {
    color: '#cbd5e1',
  },
  streakActivePerkBadge: {
    color: '#34d399',
    fontWeight: '700',
    background: 'rgba(16, 185, 129, 0.12)',
    padding: '2px 8px',
    borderRadius: '6px',
  },
  streakTrack: {
    height: '10px',
    background: 'rgba(255, 255, 255, 0.08)',
    borderRadius: '6px',
    overflow: 'hidden',
  },
  streakFill: {
    height: '100%',
    background: 'linear-gradient(90deg, #f97316 0%, #f59e0b 50%, #10b981 100%)',
    borderRadius: '6px',
    transition: 'width 0.4s ease',
  },
  milestonesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
    gap: '10px',
  },
  milestoneItemCard: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    padding: '12px 14px',
    background: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid rgba(255, 255, 255, 0.07)',
    borderRadius: '12px',
    transition: 'all 0.2s ease',
  },
  milestoneUnlockedCard: {
    background: 'rgba(16, 185, 129, 0.08)',
    border: '1px solid rgba(16, 185, 129, 0.35)',
    boxShadow: '0 4px 16px rgba(16, 185, 129, 0.1)',
  },
  milestoneNextCard: {
    background: 'rgba(245, 158, 11, 0.07)',
    border: '1px solid rgba(245, 158, 11, 0.4)',
    boxShadow: '0 4px 16px rgba(245, 158, 11, 0.12)',
  },
  milestoneTopLine: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  milestoneBadgeIcon: {
    fontSize: '20px',
  },
  milestoneDaysPill: {
    fontSize: '10px',
    fontWeight: '800',
    padding: '2px 6px',
    borderRadius: '6px',
    textTransform: 'uppercase',
  },
  milestoneCardTitle: {
    fontSize: '13px',
    fontWeight: '700',
    margin: 0,
    lineHeight: '1.3',
  },
  milestoneBonusTag: {
    fontSize: '11px',
    fontWeight: '800',
    color: '#fbbf24',
  },
  milestonePerkDesc: {
    fontSize: '11px',
    color: '#94a3b8',
    margin: 0,
    lineHeight: '1.35',
  },

  leaderboardTitleIcon: {
    width: '42px',
    height: '42px',
    borderRadius: '12px',
    background: 'rgba(245, 158, 11, 0.15)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  leaderboardSubtabsRow: {
    display: 'flex',
    gap: '8px',
    background: 'rgba(6, 27, 21, 0.7)',
    padding: '4px',
    borderRadius: '12px',
    border: '1px solid rgba(16, 185, 129, 0.2)',
    width: 'fit-content',
  },
  leaderboardSubtabBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 14px',
    borderRadius: '8px',
    border: 'none',
    background: 'transparent',
    color: '#94a3b8',
    fontSize: '12px',
    fontWeight: '700',
    cursor: 'pointer',
  },
  leaderboardSubtabActive: {
    background: 'rgba(16, 185, 129, 0.2)',
    color: '#34d399',
    border: '1px solid rgba(16, 185, 129, 0.35)',
  },
  leaderboardLoadingBox: {
    padding: '40px',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '12px',
  },
  myRankCard: {
    display: 'flex',
    alignItems: 'center',
    padding: '14px 18px',
    background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(6, 27, 21, 0.9))',
    border: '1px solid rgba(16, 185, 129, 0.4)',
    borderRadius: '14px',
    gap: '14px',
  },
  myRankBadge: {
    fontSize: '18px',
    fontWeight: '900',
    color: '#34d399',
    background: 'rgba(16, 185, 129, 0.25)',
    width: '42px',
    height: '42px',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  myRankInfo: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  myRankName: {
    fontSize: '14px',
    fontWeight: '800',
    color: '#ffffff',
  },
  myRankDetails: {
    fontSize: '12px',
    color: '#94a3b8',
  },
  myRankScore: {
    textAlign: 'right',
    fontSize: '18px',
    color: '#34d399',
  },
  myRankScoreSub: {
    fontSize: '11px',
    color: '#6ee7b7',
    marginLeft: '3px',
  },
  notPlayedBanner: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 20px',
    background: 'rgba(255, 255, 255, 0.02)',
    border: '1px dashed rgba(255, 255, 255, 0.15)',
    borderRadius: '14px',
    gap: '14px',
    flexWrap: 'wrap',
  },
  playDailyFromLeaderboardBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '10px 16px',
    borderRadius: '10px',
    border: 'none',
    background: '#10b981',
    color: '#03120e',
    fontWeight: '800',
    fontSize: '13px',
    cursor: 'pointer',
  },
  playDailyDoneBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '10px 16px',
    borderRadius: '10px',
    border: '1px solid rgba(16, 185, 129, 0.3)',
    background: 'rgba(16, 185, 129, 0.1)',
    color: '#34d399',
    fontWeight: '700',
    fontSize: '12px',
    cursor: 'pointer',
  },
  podiumContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'flex-end',
    gap: '12px',
    padding: '20px 0 10px',
  },
  podiumStep: {
    flex: 1,
    maxWidth: '180px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '14px 10px',
    borderRadius: '14px 14px 0 0',
    textAlign: 'center',
    gap: '4px',
    position: 'relative',
  },
  podiumGold: {
    background: 'linear-gradient(180deg, rgba(245, 158, 11, 0.25) 0%, rgba(245, 158, 11, 0.05) 100%)',
    border: '1px solid rgba(245, 158, 11, 0.5)',
    minHeight: '150px',
  },
  podiumSilver: {
    background: 'linear-gradient(180deg, rgba(148, 163, 184, 0.2) 0%, rgba(148, 163, 184, 0.04) 100%)',
    border: '1px solid rgba(148, 163, 184, 0.35)',
    minHeight: '125px',
  },
  podiumBronze: {
    background: 'linear-gradient(180deg, rgba(217, 119, 6, 0.2) 0%, rgba(217, 119, 6, 0.04) 100%)',
    border: '1px solid rgba(217, 119, 6, 0.35)',
    minHeight: '110px',
  },
  podiumCrown: {
    position: 'absolute',
    top: '-16px',
  },
  medalCircleGold: { fontSize: '20px' },
  medalCircleSilver: { fontSize: '18px' },
  medalCircleBronze: { fontSize: '18px' },
  podiumName: {
    fontSize: '12px',
    fontWeight: '800',
    color: '#ffffff',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    maxWidth: '100%',
  },
  podiumScore: {
    fontSize: '14px',
    fontWeight: '900',
    color: '#e2e8f0',
  },
  podiumTime: {
    fontSize: '11px',
    color: '#94a3b8',
  },
  scoresList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  scoreRow: {
    display: 'flex',
    alignItems: 'center',
    padding: '12px 14px',
    background: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid rgba(255, 255, 255, 0.06)',
    borderRadius: '12px',
    gap: '12px',
  },
  scoreRowMe: {
    background: 'rgba(16, 185, 129, 0.12)',
    border: '1px solid rgba(16, 185, 129, 0.4)',
  },
  rankNum: {
    width: '32px',
    fontSize: '13px',
    fontWeight: '800',
    color: '#94a3b8',
    textAlign: 'center',
  },
  playerInfo: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  nameRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  playerName: {
    fontSize: '13px',
    fontWeight: '700',
    color: '#ffffff',
  },
  youBadge: {
    fontSize: '9px',
    fontWeight: '800',
    background: '#10b981',
    color: '#03120e',
    padding: '1px 5px',
    borderRadius: '4px',
  },
  playerEmojiGrid: {
    fontSize: '11px',
    color: '#94a3b8',
  },
  playerScore: {
    textAlign: 'right',
  },
  scoreVal: {
    fontSize: '14px',
    fontWeight: '800',
    color: '#34d399',
  },
  scoreUnit: {
    fontSize: '11px',
    color: '#64748b',
    marginLeft: '3px',
  },
  trainingHeaderCard: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  trainingHeaderBadgeRow: {
    display: 'flex',
    alignItems: 'center',
  },
  trainingFreePill: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    background: 'rgba(16, 185, 129, 0.12)',
    border: '1px solid rgba(16, 185, 129, 0.3)',
    color: '#34d399',
    fontSize: '11px',
    fontWeight: '800',
    padding: '4px 10px',
    borderRadius: '20px',
  },
  randomHeroCard: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '22px 24px',
    background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.14), rgba(6, 43, 33, 0.85))',
    border: '1px solid rgba(16, 185, 129, 0.3)',
    borderRadius: '18px',
    gap: '18px',
    flexWrap: 'wrap',
  },
  randomLeftContent: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    flex: 1,
    minWidth: '240px',
  },
  randomIconBox: {
    width: '52px',
    height: '52px',
    borderRadius: '14px',
    background: 'rgba(16, 185, 129, 0.18)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  randomCardHeading: {
    fontSize: '16px',
    fontWeight: '800',
    color: '#ffffff',
    margin: 0,
  },
  randomCardParagraph: {
    fontSize: '12px',
    color: '#94a3b8',
    margin: '4px 0 0 0',
    lineHeight: '1.4',
  },
  launchRandomBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px 20px',
    background: 'linear-gradient(135deg, #10b981, #059669)',
    border: 'none',
    borderRadius: '12px',
    color: '#03120e',
    fontWeight: '800',
    fontSize: '14px',
    cursor: 'pointer',
    boxShadow: '0 4px 16px rgba(16, 185, 129, 0.3)',
    whiteSpace: 'nowrap',
  },
  trainingSectionWrapper: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    marginTop: '6px',
  },
  trainingSectionHeader: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  trainingSectionTitle: {
    fontSize: '16px',
    fontWeight: '800',
    color: '#ffffff',
    margin: 0,
  },
  trainingSectionDesc: {
    fontSize: '12px',
    color: '#94a3b8',
    margin: 0,
  },
  sectorsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
    gap: '12px',
  },
  sectorCard: {
    background: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid rgba(255, 255, 255, 0.07)',
    borderRadius: '16px',
    padding: '18px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  sectorIconBox: {
    width: '42px',
    height: '42px',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectorCardTitle: {
    fontSize: '15px',
    fontWeight: '800',
    color: '#ffffff',
    margin: 0,
  },
  sectorCardDesc: {
    fontSize: '12px',
    color: '#94a3b8',
    lineHeight: '1.4',
    flex: 1,
    margin: 0,
  },
  playSectorBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    padding: '8px 12px',
    background: 'rgba(255, 255, 255, 0.07)',
    border: '1px solid rgba(255, 255, 255, 0.15)',
    borderRadius: '8px',
    color: '#ffffff',
    fontSize: '12px',
    fontWeight: '700',
    cursor: 'pointer',
  },
  archivesList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  archiveRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 16px',
    background: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid rgba(255, 255, 255, 0.06)',
    borderRadius: '12px',
    gap: '12px',
    flexWrap: 'wrap',
  },
  archiveDateBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '12px',
    fontWeight: '700',
    color: '#cbd5e1',
  },
  archiveText: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    minWidth: '200px',
  },
  archivePlayBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 12px',
    background: '#10b981',
    border: 'none',
    borderRadius: '8px',
    color: '#03120e',
    fontSize: '12px',
    fontWeight: '800',
    cursor: 'pointer',
  },
  resultsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  resultHistoryCard: {
    background: 'rgba(6, 27, 21, 0.7)',
    border: '1px solid rgba(16, 185, 129, 0.2)',
    borderRadius: '16px',
    padding: '18px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  resultHistoryHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  resultDatePill: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '12px',
    color: '#cbd5e1',
    background: 'rgba(255, 255, 255, 0.04)',
    padding: '4px 10px',
    borderRadius: '8px',
  },
  resultScoreBlock: {
    textAlign: 'right',
  },
  resultScoreValue: {
    fontSize: '18px',
    fontWeight: '900',
    color: '#34d399',
  },
  resultScoreMax: {
    fontSize: '11px',
    color: '#64748b',
    marginLeft: '3px',
  },
  resultDetailsRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '6px 0',
    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
  },
  resultEmojiGrid: {
    fontSize: '14px',
    letterSpacing: '2px',
  },
  resultChrono: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '12px',
    color: '#94a3b8',
  },
  questionBreakdownList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    marginTop: '4px',
  },
  breakdownHeaderTitle: {
    fontSize: '12px',
    fontWeight: '700',
    color: '#94a3b8',
    marginBottom: '2px',
  },
  breakdownItemCard: {
    background: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid rgba(255, 255, 255, 0.05)',
    borderRadius: '10px',
    overflow: 'hidden',
  },
  breakdownItemBtn: {
    width: '100%',
    padding: '10px 12px',
    background: 'transparent',
    border: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '10px',
    cursor: 'pointer',
    color: '#e2e8f0',
    textAlign: 'left',
  },
  breakdownItemLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flex: 1,
    overflow: 'hidden',
  },
  breakdownNumBadge: {
    fontSize: '10px',
    fontWeight: '900',
    color: '#03120e',
    padding: '2px 5px',
    borderRadius: '4px',
    flexShrink: 0,
  },
  breakdownItemTexte: {
    fontSize: '12px',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  breakdownItemRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flexShrink: 0,
  },
  breakdownDistBadge: {
    fontSize: '11px',
    color: '#94a3b8',
  },
  breakdownScoreBadge: {
    fontSize: '12px',
    fontWeight: '800',
  },
  breakdownExpandedContent: {
    padding: '10px 12px 12px',
    borderTop: '1px solid rgba(255, 255, 255, 0.05)',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  breakdownTargetLoc: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '12px',
    color: '#e2e8f0',
  },
  breakdownExplicationText: {
    fontSize: '11px',
    color: '#94a3b8',
    lineHeight: '1.4',
    margin: 0,
    background: 'rgba(16, 185, 129, 0.05)',
    padding: '8px',
    borderRadius: '6px',
    borderLeft: '2px solid #10b981',
  },
  emptyResultsBox: {
    padding: '40px 20px',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '10px',
    background: 'rgba(255, 255, 255, 0.02)',
    borderRadius: '16px',
    border: '1px dashed rgba(255, 255, 255, 0.1)',
  },
  startRoundFromResultsBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 18px',
    background: '#10b981',
    border: 'none',
    borderRadius: '10px',
    color: '#03120e',
    fontWeight: '800',
    fontSize: '13px',
    cursor: 'pointer',
    marginTop: '6px',
  },
  joinGroupCard: {
    background: 'rgba(6, 27, 21, 0.7)',
    border: '1px solid rgba(16, 185, 129, 0.2)',
    borderRadius: '16px',
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  joinGroupTitle: {
    fontSize: '15px',
    fontWeight: '800',
    color: '#ffffff',
    margin: 0,
  },
  joinInputRow: {
    display: 'flex',
    gap: '10px',
  },
  joinInput: {
    flex: 1,
    padding: '10px 14px',
    borderRadius: '10px',
    border: '1px solid rgba(16, 185, 129, 0.3)',
    background: 'rgba(3, 18, 14, 0.8)',
    color: '#ffffff',
    fontSize: '13px',
    outline: 'none',
  },
  joinBtn: {
    padding: '10px 20px',
    borderRadius: '10px',
    border: 'none',
    background: '#10b981',
    color: '#03120e',
    fontWeight: '800',
    fontSize: '13px',
    cursor: 'pointer',
  },
  joinedSuccessBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 14px',
    borderRadius: '10px',
    background: 'rgba(16, 185, 129, 0.15)',
    color: '#34d399',
    fontSize: '12px',
  },
  activeGroupsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  groupsSubheading: {
    fontSize: '13px',
    fontWeight: '700',
    color: '#94a3b8',
    margin: 0,
  },
  groupCard: {
    background: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid rgba(255, 255, 255, 0.07)',
    borderRadius: '16px',
    padding: '18px',
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
  },
  groupCardTop: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  groupInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  groupName: {
    fontSize: '15px',
    fontWeight: '800',
    color: '#ffffff',
  },
  groupMemberCount: {
    fontSize: '11px',
    color: '#94a3b8',
  },
  groupRankBadge: {
    fontSize: '11px',
    fontWeight: '800',
    color: '#10b981',
    background: 'rgba(16, 185, 129, 0.15)',
    padding: '4px 8px',
    borderRadius: '6px',
  },
  groupLeaderboardPreview: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  groupLeaderRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '8px 12px',
    borderRadius: '8px',
    background: 'rgba(255, 255, 255, 0.02)',
    fontSize: '12px',
    color: '#cbd5e1',
  },
  appModalBackdrop: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.8)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5000,
    padding: '16px',
  },
  appModalCard: {
    width: '100%',
    maxWidth: '440px',
    background: '#062b21',
    border: '1px solid rgba(16, 185, 129, 0.4)',
    borderRadius: '22px',
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '18px',
    position: 'relative',
    boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6)',
  },
  closeAppModalBtn: {
    position: 'absolute',
    top: '16px',
    right: '16px',
    background: 'rgba(255, 255, 255, 0.1)',
    border: 'none',
    borderRadius: '50%',
    width: '32px',
    height: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#ffffff',
    cursor: 'pointer',
  },
  appModalHeader: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    gap: '8px',
  },
  appLogoCircle: {
    width: '56px',
    height: '56px',
    borderRadius: '16px',
    background: 'rgba(16, 185, 129, 0.2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  appModalTitle: {
    fontSize: '18px',
    fontWeight: '800',
    color: '#ffffff',
    margin: 0,
  },
  appModalDesc: {
    fontSize: '12px',
    color: '#94a3b8',
    margin: 0,
    lineHeight: '1.4',
  },
  installStepsBox: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  installStep: {
    background: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '12px',
    padding: '12px',
  },
  stepTitle: {
    display: 'block',
    fontSize: '12px',
    color: '#34d399',
    marginBottom: '4px',
  },
  stepText: {
    fontSize: '11px',
    color: '#cbd5e1',
    lineHeight: '1.5',
    margin: 0,
  },
  closeInstallBtn: {
    padding: '12px',
    borderRadius: '12px',
    border: 'none',
    background: '#10b981',
    color: '#03120e',
    fontWeight: '800',
    fontSize: '13px',
    cursor: 'pointer',
  },
  ranksHierarchyCard: {
    background: 'rgba(6, 27, 21, 0.75)',
    border: '1px solid rgba(16, 185, 129, 0.22)',
    borderRadius: '16px',
    padding: '22px',
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
    backdropFilter: 'blur(10px)',
  },
  ranksHierarchyHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: '10px',
  },
  ranksScaleBadge: {
    fontSize: '11px',
    fontWeight: '700',
    color: '#34d399',
    background: 'rgba(16, 185, 129, 0.12)',
    border: '1px solid rgba(16, 185, 129, 0.25)',
    borderRadius: '20px',
    padding: '3px 10px',
  },
  ranksHierarchyGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
    gap: '10px',
  },
  ranksHierarchyItem: {
    background: 'rgba(3, 18, 14, 0.65)',
    border: '1px solid rgba(16, 185, 129, 0.14)',
    borderRadius: '12px',
    padding: '12px 14px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    transition: 'all 0.2s ease',
  },
  ranksHierarchyItemActive: {
    background: 'rgba(16, 185, 129, 0.16)',
    border: '1px solid rgba(16, 185, 129, 0.5)',
    boxShadow: '0 0 15px rgba(16, 185, 129, 0.15)',
  },
  ranksHierarchyText: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  ranksHierarchySub: {
    fontSize: '11px',
    color: '#94a3b8',
    fontWeight: '500',
  },
  currentRankPill: {
    fontSize: '10px',
    fontWeight: '800',
    color: '#03120e',
    background: 'linear-gradient(135deg, #fbbf24 0%, #34d399 100%)',
    borderRadius: '10px',
    padding: '2px 8px',
    letterSpacing: '0.3px',
  },
};
