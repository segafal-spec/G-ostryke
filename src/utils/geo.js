/**
 * Utilitaires géographiques et algorithmes de scoring BizGames
 */

/**
 * Calcule la distance orthodromique entre deux points en km (Formule Haversine)
 */
export function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Rayon moyen de la Terre en km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

function toRad(degrees) {
  return (degrees * Math.PI) / 180;
}

/**
 * Calcule le score de 50 à 1 000 points basé sur la distance en km (Formule exponentielle Haversine)
 * - Précision absolue : <= 1 km = 1 000 points max (Tir Parfait)
 * - Décroissance exponentielle continue au kilomètre près (brise les ex-aequo)
 * - Aucun 0 punitif : plancher garanti de 50 pts pour valoriser la prise de risque
 */
export function calculateScore(distanceKm) {
  if (distanceKm <= 1) {
    return 1000;
  }

  // Décroissance exponentielle calibrée : 1 000 pts max, départage au km près
  const rawScore = 50 + 950 * Math.exp(-distanceKm / 1600);
  return Math.max(50, Math.min(1000, Math.round(rawScore)));
}

/**
 * Retourne la couleur dynamique (#10b981, #f59e0b, #ef4444) selon la qualité de la réponse
 */
export function getScoreColor(score, distanceKm) {
  const normScore = typeof score === 'number' ? (score <= 10 ? score * 100 : score) : 0;
  if (normScore >= 800 || (typeof distanceKm === 'number' && distanceKm <= 300)) {
    return '#10b981'; // Vert vif (Excellent)
  }
  if (normScore >= 500 || (typeof distanceKm === 'number' && distanceKm <= 1500)) {
    return '#f59e0b'; // Jaune / Ambre (Moyen)
  }
  return '#ef4444'; // Rouge vif (Mauvais / Loin)
}

/**
 * Attribue un emoji selon la performance sur une question (sur 1 000 pts)
 */
export function getScoreEmoji(score, distanceKm) {
  const normScore = typeof score === 'number' ? (score <= 10 ? score * 100 : score) : 0;
  if (normScore >= 800 || (typeof distanceKm === 'number' && distanceKm <= 300)) {
    return '🟩'; // Excellent (800 – 1 000 pts)
  }
  if (normScore >= 500 || (typeof distanceKm === 'number' && distanceKm <= 1500)) {
    return '🟨'; // Bon / Moyen (500 – 799 pts)
  }
  return '🟥'; // Mauvais / Loin (< 500 pts)
}

/**
 * Génère le texte de partage pour les réseaux sociaux (évaluation jusqu'à 1 000 pts/q, total sur 5 000 pts)
 */
export function generateShareText(dateStr, totalScore, details, timeSeconds) {
  const emojiRow = details.map((d) => getScoreEmoji(d.score, d.distanceKm)).join('');
  const formattedScore = Number(totalScore || 0).toLocaleString('fr-FR');

  const lines = [
    `🌿 BizGames • Éco-Titan • ${dateStr}`,
    `Score : ${formattedScore} / 5 000 pts`,
  ];

  if (timeSeconds && timeSeconds > 0) {
    const minutes = Math.floor(timeSeconds / 60);
    const remainingSeconds = timeSeconds % 60;
    const timeFormatted = `${minutes > 0 ? `${minutes}m ` : ''}${remainingSeconds}s`;
    lines.push(`Chrono : ${timeFormatted}`);
  }

  lines.push('', emojiRow, '', 'Testez votre culture business : https://bizgames-game.web.app');
  return lines.join('\n');
}

/**
 * Génère les URLs de partage direct pour les 6 réseaux sociaux les plus connus
 */
export function getSocialShareUrls(shareText, url = 'https://bizgames-game.web.app') {
  const encodedText = encodeURIComponent(shareText);
  const encodedUrl = encodeURIComponent(url);

  return {
    whatsapp: `https://api.whatsapp.com/send?text=${encodedText}`,
    x: `https://twitter.com/intent/tweet?text=${encodedText}`,
    linkedin: `https://www.linkedin.com/feed/?shareActive=true&text=${encodedText}`,
    telegram: `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedText}`,
    reddit: `https://reddit.com/submit?url=${encodedUrl}&title=${encodeURIComponent('Mon score BizGames !')}`,
  };
}

/**
 * Rangs business officiels BizGames (sur 5 000 points, 5 questions x 1 000 pts max)
 */
export const ALL_RANKS = [
  { title: 'Légende du Business Mondial', badge: '👑', color: '#f59e0b', range: '4 700 – 5 000 pts', noteMin: 'Score global ≥ 94%', minScore: 4700 },
  { title: 'Directeur Général International', badge: '💎', color: '#10b981', range: '4 000 – 4 699 pts', noteMin: 'Score global ≥ 80%', minScore: 4000 },
  { title: 'Stratège Global', badge: '🌍', color: '#38bdf8', range: '3 200 – 3 999 pts', noteMin: 'Score global ≥ 64%', minScore: 3200 },
  { title: 'Analyste de Marchés', badge: '⚡', color: '#fbbf24', range: '2 400 – 3 199 pts', noteMin: 'Score global ≥ 48%', minScore: 2400 },
  { title: 'Entrepreneur en Herbe', badge: '🌱', color: '#34d399', range: '1 500 – 2 399 pts', noteMin: 'Score global ≥ 30%', minScore: 1500 },
  { title: 'Stagiaire du Commerce', badge: '🍃', color: '#94a3b8', range: '0 – 1 499 pts', noteMin: 'Score global < 30%', minScore: 0 },
];

/**
 * Retourne le rang honorifique selon le score total sur 5 000 points (5 questions x 1 000 points max)
 */
export function getRankTitle(totalScore) {
  const score = Number(totalScore) || 0;
  if (score >= 4700 || (score <= 50 && score >= 47)) return { title: 'Légende du Business Mondial', badge: '👑', color: '#f59e0b' };
  if (score >= 4000 || (score <= 50 && score >= 40)) return { title: 'Directeur Général International', badge: '💎', color: '#10b981' };
  if (score >= 3200 || (score <= 50 && score >= 32)) return { title: 'Stratège Global', badge: '🌍', color: '#38bdf8' };
  if (score >= 2400 || (score <= 50 && score >= 24)) return { title: 'Analyste de Marchés', badge: '⚡', color: '#fbbf24' };
  if (score >= 1500 || (score <= 50 && score >= 15)) return { title: 'Entrepreneur en Herbe', badge: '🌱', color: '#34d399' };
  return { title: 'Stagiaire du Commerce', badge: '🍃', color: '#94a3b8' };
}

/**
 * Paliers du Challenge 30 Jours d'affilée (Série Quotidienne)
 */
export const STREAK_MILESTONES = [
  {
    days: 3,
    title: 'Initié du Marché',
    badge: '🥉',
    flameEmoji: '🔥',
    flameColor: '#cd7f32',
    bonusPts: 100,
    perkFr: '+100 pts bonus & Série affichée sur le profil',
    perkEn: '+100 bonus pts & Streak displayed on profile',
  },
  {
    days: 7,
    title: 'Analyste Régulier',
    badge: '🥈',
    flameEmoji: '🔥',
    flameColor: '#94a3b8',
    bonusPts: 250,
    perkFr: 'Bouclier de série (Streak Shield) + Badge argenté',
    perkEn: 'Streak Shield protection + Silver flame badge',
  },
  {
    days: 14,
    title: 'Stratège Confirmé',
    badge: '🥇',
    flameEmoji: '🔥',
    flameColor: '#f59e0b',
    bonusPts: 500,
    perkFr: 'Pack Quiz Expert débloqué & Flamme dorée brillante',
    perkEn: 'Expert Quiz Pack unlocked & Golden shiny flame',
  },
  {
    days: 21,
    title: 'Directeur Émérite',
    badge: '💎',
    flameEmoji: '✨',
    flameColor: '#38bdf8',
    bonusPts: 1000,
    perkFr: 'Aura Élite dans le Leaderboard Mondial',
    perkEn: 'Elite Aura badge on the World Leaderboard',
  },
  {
    days: 30,
    title: 'Titan du Business (Légende)',
    badge: '👑',
    flameEmoji: '👑',
    flameColor: '#10b981',
    bonusPts: 2500,
    perkFr: 'Club Ultime des 30 Jours & Diplôme de Titan certifié',
    perkEn: 'Ultimate 30-Day Club & Certified Titan Trophy',
  },
];

/**
 * Détermine le palier actuel et le prochain jalon à atteindre selon le streak
 */
export function getStreakTier(streakCount = 0) {
  const current = Number(streakCount) || 0;
  let activeMilestone = null;
  let nextMilestone = STREAK_MILESTONES[0];

  for (let i = 0; i < STREAK_MILESTONES.length; i++) {
    if (current >= STREAK_MILESTONES[i].days) {
      activeMilestone = STREAK_MILESTONES[i];
      nextMilestone = STREAK_MILESTONES[i + 1] || null;
    } else {
      if (!activeMilestone) {
        nextMilestone = STREAK_MILESTONES[i];
      }
      break;
    }
  }

  const daysToNext = nextMilestone ? Math.max(0, nextMilestone.days - current) : 0;
  const progressPercent = Math.min(100, Math.round((current / 30) * 100));

  return {
    currentStreak: current,
    activeMilestone,
    nextMilestone,
    daysToNext,
    progressPercent,
    isCompleted30: current >= 30,
  };
}


/**
 * Générateur pseudo-aléatoire linéaire congruentiel (LCG) — seedable
 * Fournit des nombres dans [0, 1) de façon reproductible à partir d'un entier seed.
 */
function seededRandom(seed) {
  let s = seed;
  return function () {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

/**
 * Calcule un hash entier 32 bits à partir d'une chaîne (djb2 variant)
 */
function hashString(str) {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 33) ^ str.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}

/**
 * Sélectionne un round de 5 questions pour une date donnée.
 * - Filtre les questions inactives (actif !== false)
 * - Garantit l'unicité des IDs sélectionnés
 * - Résultat déterministe pour une même date (même round pour tous les joueurs)
 * - Algorithme : Fisher-Yates shuffle avec seed LCG basé sur la date
 */
export function getDailyRound(allQuestions, dateString) {
  if (!allQuestions || allQuestions.length === 0) return [];

  // Ne sélectionner que les questions actives
  const pool = allQuestions.filter((q) => q.actif !== false);
  if (pool.length <= 5) return [...pool];

  // Seed reproductible basé sur la date YYYY-MM-DD
  const seed = hashString(dateString);
  const rand = seededRandom(seed);

  // Fisher-Yates shuffle sur une copie du pool
  const shuffled = [...pool];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  // Prendre les 5 premières (IDs forcément uniques car source sans doublons)
  return shuffled.slice(0, 5);
}

// ============================================================================
// LISTES NORMALISÉES POUR LA CRÉATION DE COMPTE (PAYS, ÂGE, PROFESSION)
// ============================================================================

export const COUNTRY_OPTIONS = [
  { code: 'FR', name: 'France', flag: '🇫🇷' },
  { code: 'CH', name: 'Suisse', flag: '🇨🇭' },
  { code: 'BE', name: 'Belgique', flag: '🇧🇪' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦' },
  { code: 'LU', name: 'Luxembourg', flag: '🇱🇺' },
  { code: 'MC', name: 'Monaco', flag: '🇲🇨' },
  { code: 'MA', name: 'Maroc', flag: '🇲🇦' },
  { code: 'DZ', name: 'Algérie', flag: '🇩🇿' },
  { code: 'TN', name: 'Tunisie', flag: '🇹🇳' },
  { code: 'SN', name: 'Sénégal', flag: '🇸🇳' },
  { code: 'CI', name: "Côte d'Ivoire", flag: '🇨🇮' },
  { code: 'CM', name: 'Cameroun', flag: '🇨🇲' },
  { code: 'MG', name: 'Madagascar', flag: '🇲🇬' },
  { code: 'US', name: 'États-Unis', flag: '🇺🇸' },
  { code: 'GB', name: 'Royaume-Uni', flag: '🇬🇧' },
  { code: 'DE', name: 'Allemagne', flag: '🇩🇪' },
  { code: 'ES', name: 'Espagne', flag: '🇪🇸' },
  { code: 'IT', name: 'Italie', flag: '🇮🇹' },
  { code: 'PT', name: 'Portugal', flag: '🇵🇹' },
  { code: 'NL', name: 'Pays-Bas', flag: '🇳🇱' },
  { code: 'SE', name: 'Suède', flag: '🇸🇪' },
  { code: 'NO', name: 'Norvège', flag: '🇳🇴' },
  { code: 'DK', name: 'Danemark', flag: '🇩🇰' },
  { code: 'FI', name: 'Finlande', flag: '🇫🇮' },
  { code: 'IE', name: 'Irlande', flag: '🇮🇪' },
  { code: 'JP', name: 'Japon', flag: '🇯🇵' },
  { code: 'SG', name: 'Singapour', flag: '🇸🇬' },
  { code: 'AE', name: 'Émirats Arabes Unis', flag: '🇦🇪' },
  { code: 'QA', name: 'Qatar', flag: '🇶🇦' },
  { code: 'SA', name: 'Arabie Saoudite', flag: '🇸🇦' },
  { code: 'BR', name: 'Brésil', flag: '🇧🇷' },
  { code: 'MX', name: 'Mexique', flag: '🇲🇽' },
  { code: 'AU', name: 'Australie', flag: '🇦🇺' },
  { code: 'OTHER', name: 'Autre / International', flag: '🌍' },
];

export const AGE_RANGE_OPTIONS = [
  { id: 'under_18', label: '- de 18 ans' },
  { id: '18_24', label: '18 – 24 ans' },
  { id: '25_34', label: '25 – 34 ans' },
  { id: '35_44', label: '35 – 44 ans' },
  { id: '45_54', label: '45 – 54 ans' },
  { id: '55_64', label: '55 – 64 ans' },
  { id: '65_plus', label: '65 ans et +' },
];

export const PROFESSION_OPTIONS = [
  { id: 'etudiant', label: '🎓 Étudiant / Alternant' },
  { id: 'finance_banque', label: '🏦 Finance, Banque & Audit' },
  { id: 'tech_informatique', label: '💻 Tech, Digital & Informatique' },
  { id: 'conseil_strategie', label: '📊 Conseil & Stratégie' },
  { id: 'direction_management', label: '👑 Direction Générale & C-Level' },
  { id: 'entrepreneur', label: '🚀 Entrepreneur / Fondateur' },
  { id: 'commerce_vente', label: '🤝 Commerce, Vente & Business Dev' },
  { id: 'marketing_com', label: '📣 Marketing, Communication & Médias' },
  { id: 'industrie_ingenierie', label: '⚙️ Industrie & Ingénierie' },
  { id: 'droit_juridique', label: '⚖️ Droit & Juridique' },
  { id: 'rh_recrutement', label: '👥 Ressources Humaines' },
  { id: 'sante_medical', label: '🩺 Santé, Médical & Pharma' },
  { id: 'immobilier', label: '🏢 Immobilier & Construction' },
  { id: 'logistique_supply', label: '🚢 Logistique & Supply Chain' },
  { id: 'fonction_publique', label: '🏛️ Fonction Publique & Enseignement' },
  { id: 'retraite', label: '🏖️ Retraité' },
  { id: 'autre', label: '🌐 Autre domaine' },
];

