import React, { useState, useEffect } from 'react';
import {
  Flame,
  Trophy,
  Globe2,
  Play,
  Swords,
  Layers,
  Users,
  Sparkles,
  Shield,
  ArrowRight,
  User,
  Compass,
  CheckCircle2,
  Calendar,
  Lock,
  ChevronRight,
  ExternalLink,
  Target,
  Medal,
  Crown,
  Share2,
} from 'lucide-react';
import { logoutUser, getUserStats } from '../services/firebase';
import { getScoreColor, getScoreEmoji, STREAK_MILESTONES, getStreakTier } from '../utils/geo';
import LegalModal from './LegalModal';

export default function LandingPage({
  onStartGame,
  onGoAdmin,
  todayDateStr,
  onOpenAuth,
  authInfo,
  onOpenLeaderboard,
  onOpenPlayerHub,
  alreadyPlayedData,
  invitedBy,
}) {
  const isUserLoggedIn = authInfo && authInfo.user && !authInfo.isAnonymous;
  const user = authInfo?.user;
  const stats = authInfo?.stats;
  const currentStreak = Number(stats?.streak_actuel) || 0;
  const xp = Number(stats?.total_score) || 100;
  const level = Math.max(1, Math.floor(xp / 1000) + 1);

  // Vue active dans le Dashboard GeoGuessr : 'home' (Accueil/Solo) | 'duels' (Compétitif) | 'sectors' (Monde/Secteurs)
  const [activeTab, setActiveTab] = useState('home');
  const [legalTab, setLegalTab] = useState(null);
  const [selectedDuelRound, setSelectedDuelRound] = useState(1);

  // Détection mobile
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth <= 768;
    }
    return false;
  });

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isUserAdmin = Boolean(
    authInfo?.isAdmin === true ||
    authInfo?.stats?.is_admin === true ||
    authInfo?.stats?.isAdmin === true ||
    authInfo?.user?.email?.trim().toLowerCase() === 'segafal@gmail.com' ||
    authInfo?.user?.uid === '6uNoDpHzLvRikKRJplgGXOZJXIU2'
  );

  const handleLaunchDaily = () => {
    if (isUserAdmin && onGoAdmin) {
      onGoAdmin();
      return;
    }
    if (onStartGame) onStartGame();
  };

  // Jours de la semaine pour la carte Streak GeoGuessr
  const daysOfWeek = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
  const todayDayIdx = (new Date().getDay() + 6) % 7; // Lundi = 0

  return (
    <div style={styles.container}>
      {/* 0. BANNIÈRE ADMIN SI SUPERVISEUR */}
      {isUserAdmin && (
        <div style={styles.adminBanner}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Shield size={16} color="#ffbe1a" />
            <strong style={{ color: '#ffbe1a', fontSize: '13px' }}>Compte Administrateur ({user?.email})</strong>
          </div>
          <button onClick={onGoAdmin} style={styles.adminBannerBtn}>
            <span>Ouvrir l'Espace Admin</span>
            <ArrowRight size={13} />
          </button>
        </div>
      )}

      {/* 1. HEADER GEOGUESSR (Logo Rouge, Navigation, Profil) */}
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <div
            className="geoguessr-logo-badge"
            onClick={() => setActiveTab('home')}
            title="BizGames"
          >
            <span>BIZGAMES</span>
          </div>

          <nav className="desktop-only" style={styles.topNav}>
            <button
              onClick={() => setActiveTab('home')}
              style={activeTab === 'home' ? styles.topNavBtnActive : styles.topNavBtn}
            >
              Singleplayer
            </button>
            <button
              onClick={() => setActiveTab('duels')}
              style={activeTab === 'duels' ? styles.topNavBtnActive : styles.topNavBtn}
            >
              Duels & Rangs
            </button>
            <button
              onClick={() => setActiveTab('sectors')}
              style={activeTab === 'sectors' ? styles.topNavBtnActive : styles.topNavBtn}
            >
              Secteurs & Monde
            </button>
            {onOpenLeaderboard && (
              <button onClick={onOpenLeaderboard} style={styles.topNavBtn}>
                Classement
              </button>
            )}
          </nav>
        </div>

        <div style={styles.headerRight}>
          {(onOpenPlayerHub || onOpenAuth) && (
            <div
              onClick={onOpenPlayerHub || onOpenAuth}
              style={styles.playerPill}
              title={isUserLoggedIn ? `Mon Profil (${user.displayName || user.email})` : 'Connexion'}
            >
              {isUserLoggedIn ? (
                <>
                  {(user.photoURL || stats?.photo_url) ? (
                    <img src={user.photoURL || stats?.photo_url} alt="Avatar" style={styles.avatarMini} />
                  ) : (
                    <div style={styles.avatarInitial}>
                      {(user.displayName || stats?.pseudo || user.email || 'J')[0].toUpperCase()}
                    </div>
                  )}
                  <div className="small-screen-hide" style={styles.playerTextCol}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span style={{ fontSize: '11px' }}>🇫🇷</span>
                      <span style={styles.playerNick}>
                        {user.displayName?.split(' ')[0] || stats?.pseudo || 'Joueur'}
                      </span>
                    </div>
                  </div>
                  <div style={styles.coinsBadge}>
                    <span>🟣</span>
                    <span>{(currentStreak * 50) + 100}</span>
                  </div>
                  <div style={styles.levelBadge} title={`Niveau ${level}`}>
                    {level}
                  </div>
                </>
              ) : (
                <div style={styles.loginBtn}>
                  <User size={14} color="#ffffff" />
                  <span style={styles.loginBtnText}>CONNEXION</span>
                </div>
              )}
            </div>
          )}
        </div>
      </header>

      {/* 2. CORPS PRINCIPAL SELON L'ONGLET ACTIF */}
      <main style={styles.mainContent}>
        {/* =========================================================
            ONGLET 1 : ACCUEIL / SINGLEPLAYER (SCREENSHOT 1)
            ========================================================= */}
        {activeTab === 'home' && (
          <div style={styles.homeGrid}>
            {/* COLONNE GAUCHE : Cartes Streaks, Défi Quotidien, Duels, Secteurs */}
            <div style={styles.leftCol}>
              {/* Carte 1 : Streaks de X jours */}
              <div className="geo-card" style={styles.streakCard}>
                <div style={styles.streakCardHeader}>
                  <div style={styles.streakTitleRow}>
                    <span style={styles.streakCardTitle}>STREAKS DE {currentStreak} JOUR{currentStreak > 1 ? 'S' : ''}</span>
                    <Flame size={20} color="#ff6e14" fill="#ff6e14" className="pulse-glow" />
                  </div>
                </div>

                <div style={styles.weekDaysRow}>
                  {daysOfWeek.map((day, idx) => {
                    const isPassed = idx <= todayDayIdx;
                    const hasFire = idx === todayDayIdx && currentStreak > 0;
                    return (
                      <div
                        key={idx}
                        style={{
                          ...styles.dayCol,
                          ...(idx === todayDayIdx ? styles.dayColToday : {}),
                        }}
                      >
                        <span style={styles.dayLetter}>{day}</span>
                        <div
                          style={{
                            ...styles.dayDot,
                            ...(hasFire ? styles.dayDotFire : isPassed ? styles.dayDotPassed : {}),
                          }}
                        >
                          {hasFire ? (
                            <Flame size={12} color="#ffffff" fill="#ffffff" />
                          ) : (
                            <span style={{ fontSize: '10px' }}>{idx + 8}</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Carte 2 : Daily Challenge */}
              <div
                className="geo-card"
                style={styles.gameModeCard}
                onClick={handleLaunchDaily}
              >
                <div style={styles.modeCardContent}>
                  <div style={styles.modeCardText}>
                    <h3 style={styles.modeCardTitle}>Daily Challenge</h3>
                    <span style={styles.modeCardSubtitle}>
                      {alreadyPlayedData ? 'Score validé • Revoir bilan' : 'Nouveau défi du jour disponible !'}
                    </span>
                  </div>
                  <div style={styles.modeCardIconWrapper}>
                    <img
                      src="/images/geoguessr_daily_badge.jpg"
                      alt="Défi Quotidien"
                      style={styles.modeCardImg}
                    />
                  </div>
                </div>
              </div>

              {/* Carte 3 : Competitive / Duels */}
              <div
                className="geo-card"
                style={styles.gameModeCard}
                onClick={() => setActiveTab('duels')}
              >
                <div style={styles.modeCardContent}>
                  <div style={styles.modeCardText}>
                    <h3 style={styles.modeCardTitle}>Competitive</h3>
                    <span style={styles.getRankedBadge}>GET RANKED</span>
                  </div>
                  <div style={styles.modeCardIconWrapper}>
                    <img
                      src="/images/geoguessr_duel_crystals.jpg"
                      alt="Compétitif Duels"
                      style={styles.modeCardImg}
                    />
                  </div>
                </div>
              </div>

              {/* Carte 4 : World & Secteurs */}
              <div
                className="geo-card"
                style={styles.gameModeCard}
                onClick={() => setActiveTab('sectors')}
              >
                <div style={styles.modeCardContent}>
                  <div style={styles.modeCardText}>
                    <h3 style={styles.modeCardTitle}>World & Secteurs</h3>
                    <span style={styles.modeCardSubtitle}>Entraînement illimité par secteur</span>
                  </div>
                  <div style={styles.modeCardIconWrapper}>
                    <div style={styles.globeBadgeIcon}>
                      <Globe2 size={28} color="#68de18" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* COLONNE CENTRALE : Globe 3D & Avatar debout sur la Terre */}
            <div style={styles.centerCol}>
              <div style={styles.globeAvatarContainer}>
                {/* Image / Illustration de l'avatar au sommet du globe */}
                <div style={styles.avatarGlobeWrapper}>
                  <img
                    src="/images/geoguessr_globe_avatar.jpg"
                    alt="Mon Avatar sur la Terre"
                    style={styles.avatarGlobeImg}
                  />
                  <div style={styles.glowAura} />
                </div>

                {/* Bouton Violet GeoGuessr "MODIFIER L'AVATAR" */}
                {(onOpenPlayerHub || onOpenAuth) && (
                  <button
                    onClick={onOpenPlayerHub || onOpenAuth}
                    className="geo-btn-purple"
                    style={styles.editAvatarBtn}
                  >
                    <span>MODIFIER L'AVATAR</span>
                    <span style={styles.notifDot} />
                  </button>
                )}

                {/* Gros Bouton Vert Énergique GeoGuessr "JOUER" */}
                <div style={styles.playCtaWrapper}>
                  <button
                    onClick={handleLaunchDaily}
                    className="geo-btn-green"
                    style={styles.playBigBtn}
                  >
                    <Play size={22} fill="#122803" />
                    <span>{alreadyPlayedData ? 'REVOIR MA PARTIE' : 'JOUER LE DÉFI DU JOUR'}</span>
                  </button>
                  <span style={styles.playHelpText}>
                    5 questions • Classement mondial • 100% Gratuit
                  </span>
                </div>
              </div>
            </div>

            {/* COLONNE DROITE (Desktop) : Bannière Communauté / Règles */}
            <div className="desktop-only" style={styles.rightCol}>
              <div className="geo-card" style={styles.promoCard}>
                <div style={styles.promoCardBanner}>
                  <img
                    src="/images/concept_solarpunk_luxury.jpg"
                    alt="BizGames Univers"
                    style={styles.promoImg}
                  />
                </div>
                <div style={styles.promoCardBody}>
                  <h3 style={styles.promoTitle}>BizGames : Jouez sans limites !</h3>
                  <ul style={styles.perksList}>
                    <li style={styles.perkItem}>
                      <CheckCircle2 size={15} color="#68de18" />
                      <span>Sans pub bloquante, jeu illimité</span>
                    </li>
                    <li style={styles.perkItem}>
                      <CheckCircle2 size={15} color="#68de18" />
                      <span>Des milliers de coordonnées business</span>
                    </li>
                    <li style={styles.perkItem}>
                      <CheckCircle2 size={15} color="#68de18" />
                      <span>Jouez sur le Web, sur mobile ou tablette</span>
                    </li>
                  </ul>
                  {onOpenLeaderboard && (
                    <button
                      onClick={onOpenLeaderboard}
                      className="geo-btn-purple"
                      style={{ width: '100%', marginTop: '14px' }}
                    >
                      <Trophy size={16} />
                      <span>VOIR LE CLASSEMENT</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================
            ONGLET 2 : DUELS & COMPÉTITION (SCREENSHOT 2 CLONE)
            ========================================================= */}
        {activeTab === 'duels' && (
          <div style={styles.duelsView}>
            {/* Titre Display Géant DUELS */}
            <div style={styles.duelsHeader}>
              <h1 style={styles.duelsTitle}>DUELS</h1>
              <p style={styles.duelsSubtitle}>Jouez 2 Duels pour être classé dans la ligue mondiale</p>
            </div>

            {/* Arène de Face-à-Face */}
            <div style={styles.duelsArenaGrid}>
              <div style={styles.arenaCenter}>
                {/* Sélecteurs de Duels [DUEL 1 ✓] [DUEL 2] [DUEL 3] */}
                <div style={styles.duelPillsRow}>
                  {[1, 2, 3].map((num) => (
                    <button
                      key={num}
                      onClick={() => setSelectedDuelRound(num)}
                      style={{
                        ...styles.duelRoundPill,
                        ...(selectedDuelRound === num ? styles.duelRoundPillActive : {}),
                      }}
                    >
                      <span>DUEL {num}</span>
                      {num === 1 && <span style={styles.checkDone}>✓</span>}
                    </button>
                  ))}
                </div>

                {/* Duelistes Face-à-Face avec Cristaux Lumineux au Centre */}
                <div style={styles.faceOffContainer}>
                  {/* Joueur 1 (Vous) */}
                  <div style={styles.duelistCol}>
                    <div style={styles.duelistAvatarWrapper}>
                      {(user?.photoURL || stats?.photo_url) ? (
                        <img src={user.photoURL || stats?.photo_url} alt="Vous" style={styles.duelistAvatarImg} />
                      ) : (
                        <img src="/images/avatars/avatar_tech_visionary.jpg" alt="Vous" style={styles.duelistAvatarImg} />
                      )}
                    </div>
                    <div style={styles.duelistNameRow}>
                      <span>🇫🇷</span>
                      <span style={styles.duelistName}>{user?.displayName?.split(' ')[0] || stats?.pseudo || 'Vous'}</span>
                    </div>
                  </div>

                  {/* Cristaux de Duel Lumineux au Centre */}
                  <div style={styles.duelCrystalsCenter}>
                    <img
                      src="/images/geoguessr_duel_crystals.jpg"
                      alt="Duel Cristaux"
                      style={styles.crystalsImg}
                    />
                  </div>

                  {/* Joueur 2 (Adversaire) */}
                  <div style={styles.duelistCol}>
                    <div style={styles.duelistAvatarWrapperGhost}>
                      <img src="/images/avatars/avatar_young_trader.jpg" alt="Adversaire" style={styles.duelistAvatarImg} />
                    </div>
                    <div style={styles.duelistNameRow}>
                      <span style={styles.duelistNameGhost}>Joueur mondial</span>
                    </div>
                  </div>
                </div>

                {/* Gros Bouton Vert JOUER LE DUEL */}
                <div style={styles.duelPlayWrapper}>
                  <button
                    onClick={handleLaunchDaily}
                    className="geo-btn-green"
                    style={styles.duelPlayBtn}
                  >
                    <span>JOUER LE DUEL {selectedDuelRound}</span>
                  </button>
                </div>
              </div>

              {/* Échelle de Rangs à droite (Ladder GeoGuessr) */}
              <div className="desktop-only" style={styles.arenaLadderCol}>
                <div className="geo-card" style={styles.ladderCard}>
                  <h4 style={styles.ladderTitle}>RANGS</h4>
                  <div style={styles.ladderList}>
                    <div style={styles.ladderItem}>
                      <div style={{ ...styles.ladderBadgeIcon, borderColor: '#00d2ff', color: '#00d2ff' }}>
                        💎
                      </div>
                      <span style={{ ...styles.ladderRankName, color: '#00d2ff' }}>CHAMPION</span>
                    </div>
                    <div style={styles.ladderItem}>
                      <div style={{ ...styles.ladderBadgeIcon, borderColor: '#ff2d78', color: '#ff2d78' }}>
                        👑
                      </div>
                      <span style={{ ...styles.ladderRankName, color: '#ff2d78' }}>MASTER</span>
                    </div>
                    <div style={styles.ladderItem}>
                      <div style={{ ...styles.ladderBadgeIcon, borderColor: '#ffbe1a', color: '#ffbe1a' }}>
                        🥇
                      </div>
                      <span style={{ ...styles.ladderRankName, color: '#ffbe1a' }}>GOLD</span>
                    </div>
                    <div style={styles.ladderItem}>
                      <div style={{ ...styles.ladderBadgeIcon, borderColor: '#e2e8f0', color: '#e2e8f0' }}>
                        🥈
                      </div>
                      <span style={{ ...styles.ladderRankName, color: '#e2e8f0' }}>SILVER</span>
                    </div>
                    <div style={styles.ladderItem}>
                      <div style={{ ...styles.ladderBadgeIcon, borderColor: '#d97706', color: '#d97706' }}>
                        🥉
                      </div>
                      <span style={{ ...styles.ladderRankName, color: '#d97706' }}>BRONZE</span>
                    </div>
                    <div style={{ ...styles.ladderItem, ...styles.ladderItemActive }}>
                      <div style={{ ...styles.ladderBadgeIcon, borderColor: '#68de18', color: '#68de18' }}>
                        👤
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ ...styles.ladderRankName, color: '#68de18' }}>
                          {stats?.rang_titre || 'NON CLASSÉ'}
                        </span>
                        <span style={{ fontSize: '10px', color: '#b3a9db' }}>Votre niveau actuel</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================
            ONGLET 3 : SECTEURS & MONDE (ENTRAÎNEMENT LIBRE)
            ========================================================= */}
        {activeTab === 'sectors' && (
          <div style={styles.sectorsView}>
            <div style={styles.sectorsHeader}>
              <h1 style={styles.duelsTitle}>SECTEURS DU MONDE</h1>
              <p style={styles.duelsSubtitle}>
                Entraînez-vous librement sur les 10 grands secteurs économiques de la planète
              </p>
            </div>

            <div style={styles.sectorsGrid}>
              {[
                { id: 'tech', label: 'Tech & Intelligence Artificielle', icon: '💻', count: 'Silicon Valley, Shenzhen, Tokyo', color: '#00d2ff' },
                { id: 'finance', label: 'Finance & Banques Mondiales', icon: '🏦', count: 'Wall Street, City, Zurich, Singapour', color: '#68de18' },
                { id: 'luxe', label: 'Luxe, Mode & Cosmétiques', icon: '💎', count: 'Paris, Milan, Genève, Florence', color: '#ffbe1a' },
                { id: 'energie', label: 'Énergie, Pétrole & Renouvelable', icon: '⚡', count: 'Houston, Riyad, Abu Dhabi, Oslo', color: '#ff6e14' },
                { id: 'auto', label: 'Automobile & Mobilité Future', icon: '🚗', count: 'Stuttgart, Détroit, Toyota City, Séoul', color: '#ff2d78' },
                { id: 'aero', label: 'Aéronautique & Espace', icon: '🚀', count: 'Toulouse, Seattle, Baïkonour, Cap Canaveral', color: '#b3a9db' },
                { id: 'sante', label: 'Santé, Pharma & Biotech', icon: '🔬', count: 'Bâle, Boston, Copenhague, Cambridge', color: '#5eead4' },
                { id: 'agro', label: 'Agroalimentaire & Terroirs', icon: '🌾', count: 'Vevey, Chicago, São Paulo, Bordeaux', color: '#bef264' },
              ].map((sec) => (
                <div
                  key={sec.id}
                  className="geo-card"
                  style={styles.sectorCard}
                  onClick={handleLaunchDaily}
                >
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>{sec.icon}</div>
                  <h3 style={{ ...styles.sectorTitle, color: sec.color }}>{sec.label}</h3>
                  <p style={styles.sectorDesc}>{sec.count}</p>
                  <button className="geo-btn-purple" style={{ width: '100%', marginTop: '12px', padding: '8px 14px' }}>
                    <span>S'ENTRAÎNER</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* 3. BARRE DE NAVIGATION INFÉRIEURE MOBILE (GEO-MOBILE-NAV) */}
      {isMobile && (
        <nav className="geo-mobile-nav">
          <div
            className={`geo-mobile-nav-item ${activeTab === 'home' ? 'active' : ''}`}
            onClick={() => setActiveTab('home')}
          >
            <Globe2 size={20} />
            <span>Accueil</span>
          </div>
          <div
            className="geo-mobile-nav-item"
            onClick={handleLaunchDaily}
          >
            <Play size={20} />
            <span>Défi Jour</span>
          </div>
          <div
            className={`geo-mobile-nav-item ${activeTab === 'duels' ? 'active' : ''}`}
            onClick={() => setActiveTab('duels')}
          >
            <Swords size={20} />
            <span>Duels</span>
          </div>
          <div
            className={`geo-mobile-nav-item ${activeTab === 'sectors' ? 'active' : ''}`}
            onClick={() => setActiveTab('sectors')}
          >
            <Layers size={20} />
            <span>Secteurs</span>
          </div>
          {onOpenLeaderboard && (
            <div
              className="geo-mobile-nav-item"
              onClick={onOpenLeaderboard}
            >
              <Trophy size={20} />
              <span>Scores</span>
            </div>
          )}
          {(onOpenPlayerHub || onOpenAuth) && (
            <div
              className="geo-mobile-nav-item"
              onClick={onOpenPlayerHub || onOpenAuth}
            >
              <User size={20} />
              <span>Profil</span>
            </div>
          )}
        </nav>
      )}

      {/* 4. FOOTER AVEC MENTIONS LEGALES (DESKTOP) */}
      <footer className="desktop-only" style={styles.footer}>
        <div style={styles.footerInner}>
          <span style={styles.copyright}>© 2026 BizGames — Thème GeoGuessr Cosmic Edition. 100% Gratuit.</span>
          <div style={styles.footerLinks}>
            <button onClick={() => setLegalTab('cgu')} style={styles.footerLink}>Conditions</button>
            <button onClick={() => setLegalTab('privacy')} style={styles.footerLink}>Confidentialité</button>
            <button onClick={() => setLegalTab('mentions')} style={styles.footerLink}>Mentions Légales</button>
          </div>
        </div>
      </footer>

      {/* MODALE MENTIONS LÉGALES */}
      {legalTab && (
        <LegalModal defaultTab={legalTab} onClose={() => setLegalTab(null)} />
      )}
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    paddingBottom: '70px',
  },
  adminBanner: {
    background: 'linear-gradient(90deg, #15132a 0%, #201b3f 100%)',
    borderBottom: '1px solid #ffbe1a',
    padding: '8px 16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 1001,
  },
  adminBannerBtn: {
    background: '#ffbe1a',
    color: '#15132a',
    fontWeight: '800',
    fontSize: '11px',
    border: 'none',
    borderRadius: '6px',
    padding: '4px 10px',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    cursor: 'pointer',
  },
  header: {
    height: '64px',
    padding: '0 20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    background: 'rgba(21, 19, 42, 0.95)',
    backdropFilter: 'blur(20px)',
    borderBottom: '1px solid #352d62',
    position: 'sticky',
    top: 0,
    zIndex: 900,
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '24px',
  },
  topNav: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  topNavBtn: {
    background: 'transparent',
    border: 'none',
    color: '#b3a9db',
    fontSize: '14px',
    fontWeight: '700',
    fontFamily: 'var(--font-heading)',
    padding: '8px 14px',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  topNavBtnActive: {
    background: 'rgba(116, 64, 230, 0.25)',
    border: 'none',
    color: '#ffffff',
    fontSize: '14px',
    fontWeight: '800',
    fontFamily: 'var(--font-heading)',
    padding: '8px 14px',
    borderRadius: '8px',
    cursor: 'pointer',
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  playerPill: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    background: 'var(--bg-card)',
    border: '1px solid var(--bg-card-border)',
    borderRadius: '9999px',
    padding: '4px 10px 4px 4px',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  avatarMini: {
    width: '30px',
    height: '30px',
    borderRadius: '50%',
    objectFit: 'cover',
    border: '2px solid var(--geo-purple)',
  },
  avatarInitial: {
    width: '30px',
    height: '30px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #7440e6, #e12239)',
    color: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '900',
    fontSize: '13px',
  },
  playerTextCol: {
    display: 'flex',
    flexDirection: 'column',
  },
  playerNick: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: '13px',
    maxWidth: '90px',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  coinsBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '3px',
    background: 'rgba(116, 64, 230, 0.25)',
    borderRadius: '9999px',
    padding: '3px 8px',
    fontSize: '11px',
    fontWeight: '800',
    color: '#ffffff',
  },
  levelBadge: {
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    background: '#ffbe1a',
    color: '#15132a',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '900',
    fontSize: '11px',
    boxShadow: '0 2px 8px rgba(255, 190, 26, 0.4)',
  },
  loginBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '5px 10px',
  },
  loginBtnText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: '12px',
  },
  mainContent: {
    flex: 1,
    padding: '24px 20px',
    maxWidth: '1300px',
    width: '100%',
    margin: '0 auto',
  },
  /* GRILLE ACCUEIL (SCREENSHOT 1) */
  homeGrid: {
    display: 'grid',
    gridTemplateColumns: '320px 1fr 300px',
    gap: '24px',
    alignItems: 'start',
  },
  '@media (max-width: 1024px)': {
    homeGrid: {
      gridTemplateColumns: '1fr',
    },
  },
  leftCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
  },
  streakCard: {
    padding: '16px',
    background: 'var(--bg-card)',
  },
  streakCardHeader: {
    marginBottom: '12px',
  },
  streakTitleRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  streakCardTitle: {
    fontFamily: 'var(--font-heading)',
    fontSize: '13px',
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: '0.4px',
    textTransform: 'uppercase',
  },
  weekDaysRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    background: 'rgba(21, 19, 42, 0.7)',
    padding: '8px 10px',
    borderRadius: '12px',
    border: '1px solid #352d62',
  },
  dayCol: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px',
  },
  dayColToday: {
    transform: 'scale(1.08)',
  },
  dayLetter: {
    fontSize: '10px',
    fontWeight: '800',
    color: '#7a71a3',
  },
  dayDot: {
    width: '24px',
    height: '24px',
    borderRadius: '8px',
    background: 'rgba(255, 255, 255, 0.05)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#7a71a3',
    fontWeight: '700',
  },
  dayDotPassed: {
    background: 'rgba(116, 64, 230, 0.3)',
    color: '#ffffff',
  },
  dayDotFire: {
    background: 'linear-gradient(135deg, #ff6e14, #ffbe1a)',
    boxShadow: '0 0 10px rgba(255, 110, 20, 0.6)',
  },
  gameModeCard: {
    padding: '16px',
    cursor: 'pointer',
  },
  modeCardContent: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '12px',
  },
  modeCardText: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  modeCardTitle: {
    fontFamily: 'var(--font-heading)',
    fontSize: '16px',
    fontWeight: '900',
    color: '#ffffff',
    margin: 0,
  },
  modeCardSubtitle: {
    fontSize: '12px',
    color: '#b3a9db',
  },
  getRankedBadge: {
    fontSize: '11px',
    fontWeight: '900',
    color: '#ffbe1a',
    letterSpacing: '0.6px',
  },
  modeCardIconWrapper: {
    width: '54px',
    height: '54px',
    borderRadius: '12px',
    overflow: 'hidden',
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(21, 19, 42, 0.8)',
    border: '1px solid #352d62',
  },
  modeCardImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  globeBadgeIcon: {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(104, 222, 24, 0.1)',
  },
  /* COLONNE CENTRALE : AVATAR & GLOBE */
  centerCol: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  globeAvatarContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    width: '100%',
  },
  avatarGlobeWrapper: {
    position: 'relative',
    width: '100%',
    maxWidth: '420px',
    aspectRatio: '1',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '16px',
  },
  avatarGlobeImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    borderRadius: '50%',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.8), 0 0 40px rgba(116, 64, 230, 0.3)',
    border: '2px solid rgba(116, 64, 230, 0.4)',
  },
  glowAura: {
    position: 'absolute',
    inset: '-10px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(116, 64, 230, 0.25) 0%, transparent 70%)',
    pointerEvents: 'none',
  },
  editAvatarBtn: {
    marginBottom: '18px',
  },
  notifDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    background: '#ffbe1a',
    display: 'inline-block',
  },
  playCtaWrapper: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
    width: '100%',
    maxWidth: '380px',
  },
  playBigBtn: {
    width: '100%',
    padding: '16px 28px',
    fontSize: '17px',
  },
  playHelpText: {
    fontSize: '12px',
    color: '#7a71a3',
    fontWeight: '700',
  },
  /* COLONNE DROITE : PROMO */
  rightCol: {
    display: 'flex',
    flexDirection: 'column',
  },
  promoCard: {
    overflow: 'hidden',
  },
  promoCardBanner: {
    height: '140px',
    overflow: 'hidden',
  },
  promoImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  promoCardBody: {
    padding: '18px',
  },
  promoTitle: {
    fontFamily: 'var(--font-heading)',
    fontSize: '16px',
    fontWeight: '900',
    color: '#ffffff',
    marginBottom: '12px',
  },
  perksList: {
    listStyle: 'none',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    padding: 0,
    margin: 0,
  },
  perkItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    color: '#b3a9db',
    fontSize: '12px',
    fontWeight: '600',
  },
  /* =========================================================
     VUE DUELS (SCREENSHOT 2 CLONE)
     ========================================================= */
  duelsView: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  duelsHeader: {
    textAlign: 'center',
    marginBottom: '24px',
  },
  duelsTitle: {
    fontFamily: 'var(--font-heading)',
    fontSize: '48px',
    fontWeight: '900',
    fontStyle: 'italic',
    color: '#ffffff',
    letterSpacing: '1px',
    margin: 0,
    textShadow: '0 0 25px rgba(116, 64, 230, 0.5)',
  },
  duelsSubtitle: {
    color: '#ffbe1a',
    fontSize: '14px',
    fontWeight: '800',
    marginTop: '6px',
  },
  duelsArenaGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 280px',
    gap: '30px',
    width: '100%',
    maxWidth: '960px',
    alignItems: 'start',
  },
  arenaCenter: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    background: 'var(--bg-card)',
    border: '1px solid var(--bg-card-border)',
    borderRadius: '24px',
    padding: '24px',
    boxShadow: '0 16px 40px rgba(0, 0, 0, 0.6)',
  },
  duelPillsRow: {
    display: 'flex',
    gap: '10px',
    marginBottom: '28px',
  },
  duelRoundPill: {
    background: 'rgba(21, 19, 42, 0.8)',
    border: '1px solid #352d62',
    color: '#b3a9db',
    fontFamily: 'var(--font-heading)',
    fontWeight: '800',
    fontSize: '13px',
    padding: '8px 16px',
    borderRadius: '9999px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    transition: 'all 0.15s ease',
  },
  duelRoundPillActive: {
    background: 'var(--geo-purple)',
    borderColor: '#9066f7',
    color: '#ffffff',
    boxShadow: '0 0 14px rgba(116, 64, 230, 0.5)',
  },
  checkDone: {
    color: '#68de18',
    fontWeight: '900',
  },
  faceOffContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: '32px',
  },
  duelistCol: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '10px',
  },
  duelistAvatarWrapper: {
    width: '100px',
    height: '100px',
    borderRadius: '50%',
    overflow: 'hidden',
    border: '3px solid #68de18',
    boxShadow: '0 0 20px rgba(104, 222, 24, 0.5)',
  },
  duelistAvatarWrapperGhost: {
    width: '100px',
    height: '100px',
    borderRadius: '50%',
    overflow: 'hidden',
    border: '3px solid #7440e6',
    boxShadow: '0 0 20px rgba(116, 64, 230, 0.5)',
    filter: 'grayscale(0.3)',
  },
  duelistAvatarImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  duelistNameRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  duelistName: {
    color: '#ffffff',
    fontWeight: '900',
    fontSize: '15px',
  },
  duelistNameGhost: {
    color: '#b3a9db',
    fontWeight: '800',
    fontSize: '14px',
  },
  duelCrystalsCenter: {
    width: '140px',
    height: '140px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  crystalsImg: {
    width: '100%',
    height: '100%',
    objectFit: 'contain',
    filter: 'drop-shadow(0 0 25px rgba(255, 45, 120, 0.6))',
  },
  duelPlayWrapper: {
    width: '100%',
    maxWidth: '320px',
  },
  duelPlayBtn: {
    width: '100%',
    padding: '16px 24px',
    fontSize: '18px',
  },
  arenaLadderCol: {
    display: 'flex',
    flexDirection: 'column',
  },
  ladderCard: {
    padding: '20px',
  },
  ladderTitle: {
    fontSize: '12px',
    fontWeight: '900',
    color: '#7a71a3',
    letterSpacing: '0.8px',
    textTransform: 'uppercase',
    marginBottom: '16px',
  },
  ladderList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  ladderItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '6px 8px',
    borderRadius: '10px',
  },
  ladderItemActive: {
    background: 'rgba(104, 222, 24, 0.12)',
    border: '1px solid rgba(104, 222, 24, 0.3)',
  },
  ladderBadgeIcon: {
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    border: '1.5px solid',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
    background: 'rgba(21, 19, 42, 0.7)',
  },
  ladderRankName: {
    fontFamily: 'var(--font-heading)',
    fontWeight: '900',
    fontSize: '13px',
    letterSpacing: '0.5px',
  },
  /* =========================================================
     VUE SECTEURS & MONDE
     ========================================================= */
  sectorsView: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  sectorsHeader: {
    textAlign: 'center',
    marginBottom: '28px',
  },
  sectorsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
    gap: '16px',
    width: '100%',
  },
  sectorCard: {
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    cursor: 'pointer',
  },
  sectorTitle: {
    fontFamily: 'var(--font-heading)',
    fontSize: '15px',
    fontWeight: '900',
    marginBottom: '6px',
  },
  sectorDesc: {
    fontSize: '12px',
    color: '#b3a9db',
    lineHeight: '1.4',
    margin: 0,
  },
  /* FOOTER */
  footer: {
    borderTop: '1px solid #352d62',
    background: 'rgba(21, 19, 42, 0.85)',
    padding: '16px 20px',
    marginTop: 'auto',
  },
  footerInner: {
    maxWidth: '1200px',
    margin: '0 auto',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  copyright: {
    fontSize: '12px',
    color: '#7a71a3',
  },
  footerLinks: {
    display: 'flex',
    gap: '16px',
  },
  footerLink: {
    background: 'none',
    border: 'none',
    color: '#b3a9db',
    fontSize: '12px',
    cursor: 'pointer',
    fontWeight: '600',
  },
};
