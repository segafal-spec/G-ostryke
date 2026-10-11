import React from 'react';
import {
  Globe2,
  Play,
  Building2,
  MapPin,
  Share2,
  Sparkles,
  TrendingUp,
  Cpu,
  Gem,
  Flame,
  Car,
  CheckCircle2,
  ArrowRight,
  User,
  LogOut,
  Trophy,
  Lock,
  Clock,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Crown,
  Award,
  BookOpen,
  Users,
  Zap,
  Target,
  BarChart2,
  Factory,
  DollarSign,
  Plane,
  ShoppingBag,
  Leaf,
  Shield,
  Settings,
  Menu,
  X,
} from 'lucide-react';
import GlobeMockupPreview from './GlobeMockupPreview';
import LegalModal from './LegalModal';
import { logoutUser, getUserStats } from '../services/firebase';
import { getScoreColor, getScoreEmoji, STREAK_MILESTONES, getStreakTier } from '../utils/geo';

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
  const [expandedQuestion, setExpandedQuestion] = React.useState(null);
  const stats = authInfo?.stats;
  const currentStreak = Number(stats?.streak_actuel) || 0;
  const maxStreak = Number(stats?.streak_max) || currentStreak;
  const streakTier = getStreakTier(currentStreak);
  const [legalTab, setLegalTab] = React.useState(null);
  const [referrerDisplayName, setReferrerDisplayName] = React.useState(() => {
    return invitedBy ? decodeURIComponent(invitedBy) : null;
  });

  // Si le paramètre invitedBy ressemble à un UID Firebase (ex: 28 caractères sans espaces), tenter de récupérer son pseudo
  React.useEffect(() => {
    if (!invitedBy) return;
    const cleanParam = decodeURIComponent(invitedBy).trim();
    // Si c'est un identifiant Firebase UID typique
    if (cleanParam.length >= 20 && !cleanParam.includes(' ')) {
      getUserStats(cleanParam).then((refProfile) => {
        if (refProfile && refProfile.pseudo) {
          setReferrerDisplayName(refProfile.pseudo);
        }
      }).catch(() => {});
    }
  }, [invitedBy]);

  const isUserAdmin = Boolean(
    authInfo?.isAdmin === true ||
    authInfo?.stats?.is_admin === true ||
    authInfo?.stats?.isAdmin === true ||
    authInfo?.user?.email?.trim().toLowerCase() === 'segafal@gmail.com' ||
    authInfo?.user?.uid === '6uNoDpHzLvRikKRJplgGXOZJXIU2'
  );

  const handleAction = () => {
    if (isUserAdmin) {
      if (onGoAdmin) onGoAdmin();
      return;
    }
    if (onStartGame) onStartGame();
  };

  // Détection adaptative Mobile / Desktop
  const [isMobile, setIsMobile] = React.useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth <= 768;
    }
    return false;
  });

  React.useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Page active sur la version mobile : 'home' | 'rules' | 'sectors' | 'scoring' | 'leaderboard' | 'social'
  const [activeMobilePage, setActiveMobilePage] = React.useState('home');
  const [isDropdownOpen, setIsDropdownOpen] = React.useState(false);
  const dropdownRef = React.useRef(null);

  // Configuration des 6 pages distinctes pour le menu déroulant mobile
  const NAV_PAGES = [
    {
      id: 'home',
      title: 'Accueil & Défi du jour',
      shortTitle: 'Défi du jour',
      subtitle: 'La manche officielle en 5 questions',
      icon: <Play size={15} color="#10b981" fill="#10b981" />,
      badge: 'DIRECT',
    },
    {
      id: 'rules',
      title: 'Comment Jouer',
      shortTitle: 'Règles',
      subtitle: 'En 4 étapes simples & astuces de tir',
      icon: <Target size={15} color="#f59e0b" />,
    },
    {
      id: 'sectors',
      title: 'Secteurs Business',
      shortTitle: '13 Secteurs',
      subtitle: 'Les 13 domaines économiques mondiaux',
      icon: <Building2 size={15} color="#60a5fa" />,
    },
    {
      id: 'scoring',
      title: 'Scoring & Rangs',
      shortTitle: 'Barème & Rangs',
      subtitle: 'Barème Haversine & 6 Rangs honorifiques',
      icon: <Trophy size={15} color="#fbbf24" />,
    },
    {
      id: 'challenge',
      title: 'Challenge 30 Jours',
      shortTitle: 'Challenge 30J',
      subtitle: 'Série de 30 jours, boucliers & 2 500 pts bonus',
      icon: <Flame size={15} color="#f97316" fill="#f97316" />,
      badge: 'STREAK',
    },
    {
      id: 'leaderboard',
      title: 'Classement des Joueurs',
      shortTitle: 'Classement',
      subtitle: 'Top scores quotidiens & palmarès',
      icon: <Crown size={15} color="#34d399" />,
    },
    {
      id: 'social',
      title: 'Compétition & Amis',
      shortTitle: 'Amis & Défis',
      subtitle: 'Défis privés, groupes & partage sans spoiler',
      icon: <Users size={15} color="#a78bfa" />,
    },
  ];

  const currentPageIndex = Math.max(0, NAV_PAGES.findIndex((p) => p.id === activeMobilePage));
  const currentPageConfig = NAV_PAGES[currentPageIndex] || NAV_PAGES[0];

  const handleSelectPage = (pageId) => {
    setActiveMobilePage(pageId);
    setIsDropdownOpen(false);
    if (typeof window !== 'undefined') {
      const sectionMap = {
        home: null,
        rules: 'how-to-play',
        sectors: 'sectors',
        scoring: 'scoring',
        challenge: 'challenge-30-jours',
        leaderboard: 'leaderboard',
        social: 'social',
      };
      if (pageId === 'home') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        const targetId = sectionMap[pageId] || pageId;
        const el = document.getElementById(targetId);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    }
  };

  const handlePrevPage = () => {
    if (currentPageIndex > 0) {
      handleSelectPage(NAV_PAGES[currentPageIndex - 1].id);
    }
  };

  const handleNextPage = () => {
    if (currentPageIndex < NAV_PAGES.length - 1) {
      handleSelectPage(NAV_PAGES[currentPageIndex + 1].id);
    }
  };

  // Fermeture automatique du menu déroulant au clic extérieur
  React.useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
      }
    };
    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isDropdownOpen]);


  return (
    <div style={styles.landingContainer}>
      {/* 0. BANNIÈRE SUPERVISEUR ADMIN */}
      {isUserAdmin && (
        <div style={styles.adminBanner}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <Shield size={16} color="#fbbf24" />
            <strong style={{ color: '#fbbf24', fontSize: '13px' }}>Compte Administrateur ({user?.email})</strong>
            <span style={{ color: '#94a3b8', fontSize: '12px' }}>
              — Mode supervision actif. Le compte admin est réservé à la gestion et ne participe pas aux parties de jeu.
            </span>
          </div>
          <button onClick={onGoAdmin} style={styles.adminBannerBtn}>
            <span>Ouvrir l'Espace Admin</span>
            <ArrowRight size={13} />
          </button>
        </div>
      )}

      {/* 1. EN-TÊTE DE LA LANDING PAGE */}
      <header style={styles.header}>
        <div style={styles.headerInner}>
          {/* Brand Desktop (> 768px) */}
          <div
            className="desktop-brand-header"
            style={styles.brand}
            onClick={() => {
              if (activeMobilePage !== 'home') setActiveMobilePage('home');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            title="BizGames - Accueil"
          >
            <div className="geo-logo-badge" style={{ padding: '6px 14px', fontSize: '18px' }}>
              <span>BIZGAMES</span>
            </div>
            <div>
              <span style={styles.brandTag}>GÉOGRAPHIE BUSINESS</span>
            </div>
          </div>

          {/* Mobile Header Left (<= 768px) : Hamburger ☰ + Grand "B" */}
          <div className="mobile-header-left">
            <button
              onClick={() => setIsDropdownOpen((prev) => !prev)}
              style={styles.mobileHamburgerBtn}
              aria-label={isDropdownOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
              title="Menu des pages"
              type="button"
            >
              {isDropdownOpen ? <X size={20} color="#f8fafc" /> : <Menu size={20} color="#f8fafc" />}
            </button>

            <div
              className="mobile-brand-b"
              onClick={() => {
                setActiveMobilePage('home');
                setIsDropdownOpen(false);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              title="BizGames - Accueil"
              aria-label="BizGames Accueil"
            >
              <span className="mobile-b-letter" style={{ fontFamily: 'var(--font-logo)' }}>B</span>
            </div>
          </div>

          <nav className="desktop-only" style={styles.navLinks}>
            <a href="#how-to-play" style={styles.navLink}>Comment jouer</a>
            <a href="#sectors" style={styles.navLink}>Secteurs Business</a>
            <a href="#scoring" style={styles.navLink}>Scoring & Rangs</a>
            <a href="#challenge-30-jours" style={styles.navLink}>Challenge 30 Jours</a>
            <a href="#social" style={styles.navLink}>Classement & Partage</a>
          </nav>

          <div style={styles.headerActionGroup}>
            {(onOpenPlayerHub || onOpenAuth) && (
              <button
                onClick={isUserLoggedIn && onOpenPlayerHub ? onOpenPlayerHub : (onOpenAuth || onOpenPlayerHub)}
                style={isUserLoggedIn ? styles.landingUserPill : styles.landingLoginBtn}
                title={isUserLoggedIn ? 'Mon Espace & Statistiques' : 'Se connecter'}
              >
                {isUserLoggedIn ? (
                  <>
                    {(user.photoURL || stats?.photo_url) ? (
                      <img src={user.photoURL || stats?.photo_url} alt="Avatar" style={styles.landingAvatarMini} />
                    ) : (
                      <span style={styles.landingAvatarInitial}>
                        {(user.displayName || stats?.pseudo || user.email || 'U')[0].toUpperCase()}
                      </span>
                    )}
                    <span className="small-screen-hide" style={styles.landingUserPseudo}>
                      {user.displayName?.split(' ')[0] || 'Mon Compte'}
                    </span>
                    {stats?.streak_actuel > 0 && (
                      <span style={styles.landingStreak}>
                        <Flame size={12} color="#10b981" />
                        {stats.streak_actuel}
                      </span>
                    )}
                  </>
                ) : (
                  <>
                    <User size={14} />
                    <span>Connexion</span>
                  </>
                )}
              </button>
            )}

            {isUserLoggedIn && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onOpenPlayerHub) onOpenPlayerHub('settings');
                  }}
                  style={styles.landingSettingsBtn}
                  title="Paramètres du compte & Avatar"
                  aria-label="Paramètres du compte"
                >
                  <Settings size={15} />
                </button>
                <button
                  onClick={async (e) => {
                    e.stopPropagation();
                    await logoutUser();
                  }}
                  style={styles.landingLogoutBtn}
                  title="Se déconnecter de BizGames"
                  aria-label="Se déconnecter"
                >
                  <LogOut size={15} />
                </button>
              </>
            )}

            {isUserAdmin ? (
              <button onClick={onGoAdmin} style={styles.headerCtaAdmin} title="Accéder au panneau d'administration">
                <Shield size={14} color="#03120e" />
                <span>Espace Admin</span>
              </button>
            ) : alreadyPlayedData ? (
              <button
                onClick={() => {
                  if (onOpenPlayerHub) onOpenPlayerHub('results');
                }}
                style={styles.headerCtaDone}
                title="Consulter vos réponses et score du jour"
              >
                <CheckCircle2 size={14} color="#10b981" />
                <span>Score : {(alreadyPlayedData.scoreTotal || 0).toLocaleString('fr-FR')} pts</span>
              </button>
            ) : (
              <button onClick={handleAction} style={styles.headerCta}>
                <Play size={14} fill="#03120e" />
                <span>Jouer</span>
              </button>
            )}
          </div>
        </div>

        {/* MENU DÉROULANT DES PAGES (VERSION MOBILE DIRECTEMENT DANS L'ENTÊTE) */}
        {isMobile && isDropdownOpen && (
          <div ref={dropdownRef} className="mobile-menu-overlay">
            <div
              style={styles.mobileDropdownBackdrop}
              onClick={() => setIsDropdownOpen(false)}
            />
            <div className="mobile-dropdown-enter" style={styles.mobileMenuDropdownCard}>
              <div style={styles.mobileMenuHead}>
                <div style={styles.mobileMenuHeadBrand}>
                  <div style={styles.mobileMenuBadgeB}>B</div>
                  <div>
                    <div style={styles.mobileMenuHeadTitle}>Pages BizGames</div>
                    <div style={styles.mobileMenuHeadSub}>Navigation rapide</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsDropdownOpen(false)}
                  style={styles.mobileMenuCloseBtn}
                  aria-label="Fermer"
                >
                  <X size={18} color="#94a3b8" />
                </button>
              </div>

              <div style={styles.mobileMenuItemsList}>
                {NAV_PAGES.map((page, idx) => {
                  const isActive = activeMobilePage === page.id;
                  return (
                    <button
                      key={page.id}
                      type="button"
                      onClick={() => handleSelectPage(page.id)}
                      style={isActive ? styles.mobileDropdownItemActive : styles.mobileDropdownItem}
                    >
                      <div style={styles.mobileDropdownItemContent}>
                        <div style={isActive ? styles.mobileItemIconActive : styles.mobileItemIcon}>
                          {page.icon}
                        </div>
                        <div style={styles.mobileItemTextCol}>
                          <div style={styles.mobileItemTitleRow}>
                            <span style={isActive ? styles.mobileItemTitleActive : styles.mobileItemTitle}>
                              {page.title}
                            </span>
                            {page.badge && (
                              <span style={styles.mobileItemBadge}>{page.badge}</span>
                            )}
                          </div>
                          <span style={styles.mobileItemDesc}>{page.subtitle}</span>
                        </div>
                      </div>
                      {isActive ? (
                        <CheckCircle2 size={18} color="#10b981" style={{ flexShrink: 0 }} />
                      ) : (
                        <span style={styles.mobileItemNum}>0{idx + 1}</span>
                      )}
                    </button>
                  );
                })}
              </div>

              <div style={styles.mobileMenuQuickPlay}>
                <button
                  type="button"
                  onClick={() => {
                    setIsDropdownOpen(false);
                    handleAction();
                  }}
                  style={styles.mobileMenuPlayBtn}
                >
                  <Play size={16} fill="#03120e" />
                  <span>Jouer la manche du jour</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* 2. HERO SECTION : VERSION MOBILE OU DESKTOP */}
      {isMobile ? (
        <section style={styles.mobileCleanHero}>
          {invitedBy && (
            <div style={styles.invitedByHeroCard}>
              <div style={styles.invitedByHeaderRow}>
                <div style={styles.invitedByAvatarBox}>
                  <Trophy size={20} color="#fbbf24" />
                </div>
                <div style={styles.invitedByHeaderText}>
                  <span style={styles.invitedByBadge}>⚔️ DÉFI AMICAL EN ATTENTE</span>
                  <h3 style={styles.invitedByTitle}>
                    <strong>{referrerDisplayName || decodeURIComponent(invitedBy)}</strong> vous met au défi !
                  </h3>
                </div>
              </div>
              <button onClick={handleAction} style={styles.invitedByAcceptBtn}>
                <Play size={16} fill="#03120e" />
                <span>Relever le Défi de {referrerDisplayName || decodeURIComponent(invitedBy)}</span>
              </button>
            </div>
          )}

          <div style={styles.mobileCleanHeroInner}>
            <div style={styles.mobileHeroBadge}>
              <span style={styles.dailyDot} />
              <span>⚡ DÉFI DU JOUR • 100% GRATUIT • {todayDateStr}</span>
            </div>

            <h1 style={styles.mobileHeroTitle}>
              Biz<span style={{ color: '#10b981' }}>Games</span>
            </h1>

            <p style={styles.mobileHeroSubtitle}>
              Le jeu quotidien de géographie économique
            </p>

            <div style={styles.mobileHeroPillsRow}>
              <span style={styles.mobileHeroPillItem}>5 questions rapides</span>
              <span style={styles.mobileHeroPillDot}>•</span>
              <span style={styles.mobileHeroPillItem}>Visez sur la carte</span>
              <span style={styles.mobileHeroPillDot}>•</span>
              <span style={styles.mobileHeroPillItem}>Sans abonnement</span>
            </div>

            {isUserAdmin ? (
              <div style={styles.mobileCleanActionArea}>
                <button onClick={onGoAdmin} style={{ ...styles.mobileCleanBigPlayBtn, background: '#f59e0b', color: '#03120e' }}>
                  <Shield size={18} />
                  <span>Panneau d'Administration</span>
                  <ArrowRight size={18} />
                </button>
              </div>
            ) : alreadyPlayedData ? (
              <div style={styles.mobileCleanPlayedCard}>
                <div style={styles.mobileCleanPlayedStatus}>
                  <CheckCircle2 size={16} color="#10b981" />
                  <span>Manche du jour complétée !</span>
                </div>
                <div style={styles.mobileCleanScoreBig}>
                  {(alreadyPlayedData.scoreTotal || 0).toLocaleString('fr-FR')} pts
                </div>
                <p style={styles.mobileCleanPlayedNotice}>
                  Rendez-vous demain à minuit pour la prochaine manche officielle !
                </p>
                <button
                  onClick={() => onOpenPlayerHub && onOpenPlayerHub('results')}
                  style={styles.mobileCleanViewAnswersBtn}
                >
                  <span>Consulter mes réponses</span>
                  <ArrowRight size={15} />
                </button>
              </div>
            ) : (
              <div style={styles.mobileCleanActionArea}>
                <button onClick={handleAction} style={styles.mobileCleanBigPlayBtn}>
                  <Play size={18} fill="#03120e" />
                  <span>Jouer la manche du jour</span>
                  <ArrowRight size={18} />
                </button>
                <div style={styles.mobileCleanSubnotice}>
                  ⚡ 5 minutes chrono • Entièrement gratuit
                </div>
              </div>
            )}

            {/* Aperçu Globe 3D épuré */}
            <div style={styles.mobileCleanGlobeCard}>
              <GlobeMockupPreview />
            </div>

            {/* Raccourcis épurés vers les autres pages */}
            <div style={styles.mobileCleanQuickLinks}>
              <button
                type="button"
                onClick={() => handleSelectPage('rules')}
                style={styles.mobileCleanQuickLinkBtn}
              >
                <Target size={15} color="#f59e0b" />
                <span>Règles</span>
              </button>
              <button
                type="button"
                onClick={() => handleSelectPage('sectors')}
                style={styles.mobileCleanQuickLinkBtn}
              >
                <Building2 size={15} color="#60a5fa" />
                <span>13 Secteurs</span>
              </button>
              <button
                type="button"
                onClick={() => handleSelectPage('scoring')}
                style={styles.mobileCleanQuickLinkBtn}
              >
                <Trophy size={15} color="#fbbf24" />
                <span>Rangs</span>
              </button>
              <button
                type="button"
                onClick={() => handleSelectPage('leaderboard')}
                style={styles.mobileCleanQuickLinkBtn}
              >
                <Crown size={15} color="#34d399" />
                <span>Classement</span>
              </button>
            </div>
          </div>
        </section>
      ) : (
        <section style={styles.heroSection}>
        <div style={styles.heroGlow} />
        <div style={styles.heroContent}>
          {/* Bannière VIP Défi d'un proche invitant */}
          {invitedBy && (
            <div style={styles.invitedByHeroCard}>
              <div style={styles.invitedByHeaderRow}>
                <div style={styles.invitedByAvatarBox}>
                  <Trophy size={20} color="#fbbf24" />
                </div>
                <div style={styles.invitedByHeaderText}>
                  <div style={styles.invitedByBadgeRow}>
                    <span style={styles.invitedByBadge}>⚔️ DÉFI AMICAL EN ATTENTE</span>
                    <span style={styles.invitedByBadgeFree}>100% GRATUIT</span>
                  </div>
                  <h3 style={styles.invitedByTitle}>
                    <strong>{referrerDisplayName || decodeURIComponent(invitedBy)}</strong> vous invite à défier votre culture business !
                  </h3>
                </div>
              </div>

              <p style={styles.invitedByQuote}>
                « Peux-tu faire un meilleur score que moi sur le globe 3D ? 5 questions rapides pour localiser les empires économiques mondiaux. Prouvez votre intuition ! »
              </p>

              <div style={styles.invitedByActionRow}>
                <button onClick={handleAction} style={styles.invitedByAcceptBtn}>
                  <Play size={16} fill="#03120e" />
                  <span>Relever le Défi de {referrerDisplayName || decodeURIComponent(invitedBy)}</span>
                  <ArrowRight size={16} />
                </button>
                <span style={styles.invitedByMetaText}>
                  ⚡ 5 questions en 5 minutes • Sans carte bancaire
                </span>
              </div>
            </div>
          )}

          <h1 style={styles.heroTitle}>
            Testez votre <span style={styles.goldGradient}>culture Business</span> : Simple, Rapide et 100% Gratuit
          </h1>

          <p style={styles.heroDescription}>
            Seulement <strong>5 minutes par jour</strong> et <strong>5 questions ludiques</strong> pour tester votre intuition sur l'économie mondiale.
            Sièges emblématiques, giga-usines, bourses, tech et marques de luxe…
            Visez sur la carte MapLibre ou le globe 3D interactif avec frontières détaillées (départements français, états américains, pays).
            <strong>100% gratuit, simple à jouer et accessible à tous !</strong>
          </p>

          {!isUserLoggedIn && !alreadyPlayedData && (
            <div style={styles.accountRequiredNote}>
              <Shield size={14} color="#10b981" />
              <span>Pseudo vérifié obligatoire pour jouer • 100% Gratuit • Sans abonnement</span>
            </div>
          )}

          {isUserAdmin ? (
            <div style={styles.ctaGroup}>
              <button onClick={onGoAdmin} style={{ ...styles.primaryCta, background: '#f59e0b', color: '#03120e' }}>
                <Shield size={18} />
                <span>Accéder au Panneau d'Administration</span>
                <ArrowRight size={18} />
              </button>

              <button
                onClick={() => {
                  if (onOpenLeaderboard) onOpenLeaderboard();
                }}
                style={styles.secondaryCta}
              >
                <Trophy size={17} color="#f59e0b" />
                <span>Classement Joueurs</span>
              </button>
            </div>
          ) : alreadyPlayedData ? (
            <div style={styles.alreadyPlayedHeroCard}>
              <div style={styles.alreadyPlayedStatusBadge}>
                <Lock size={13} color="#10b981" />
                <span>DÉFI DU JOUR COMPLÉTÉ • REVENEZ DEMAIN</span>
              </div>
              <div style={styles.alreadyPlayedScoreRow}>
                <span style={styles.alreadyPlayedScoreVal}>
                  {(alreadyPlayedData.scoreTotal || 0).toLocaleString('fr-FR')} pts
                </span>
                <span style={styles.alreadyPlayedEmoji}>
                  {alreadyPlayedData.details && alreadyPlayedData.details.length > 0
                    ? alreadyPlayedData.details.map((d) => getScoreEmoji(d.score, d.distanceKm)).join('')
                    : alreadyPlayedData.emojiGrid}
                </span>
                <span style={styles.alreadyPlayedTime}>
                  <Clock size={14} color="#94a3b8" />
                  {alreadyPlayedData.timeSeconds}s
                </span>
              </div>
              <p style={styles.alreadyPlayedNote}>
                Vous avez complété les 5 questions business du jour. Pour préserver l'équité du classement, vous ne pouvez pas rejouer. Consultez vos réponses ou explorez les classements.
              </p>
              <div style={styles.alreadyPlayedBtnRow}>
                <button
                  onClick={() => onOpenPlayerHub && onOpenPlayerHub('results')}
                  style={styles.viewPastQuestionsBtn}
                >
                  <Building2 size={16} />
                  <span>Historique & Questions Répondues</span>
                </button>
                <button
                  onClick={() => {
                    if (onOpenPlayerHub) onOpenPlayerHub('leaderboard');
                    else if (onOpenLeaderboard) onOpenLeaderboard();
                  }}
                  style={styles.secondaryCta}
                >
                  <Trophy size={17} color="#f59e0b" />
                  <span>Classement du jour</span>
                </button>
              </div>
            </div>
          ) : (
            <div style={styles.ctaGroup}>
              <button onClick={handleAction} style={styles.primaryCta}>
                <Play size={18} fill="#03120e" />
                <span>Jouer ma Partie Gratuite (5 min)</span>
                <ArrowRight size={18} />
              </button>

              <button
                onClick={() => {
                  if (onOpenPlayerHub) onOpenPlayerHub('leaderboard');
                  else if (onOpenLeaderboard) onOpenLeaderboard();
                }}
                style={styles.secondaryCta}
              >
                <Trophy size={17} color="#f59e0b" />
                <span>Classement</span>
              </button>
            </div>
          )}

          {/* Mini-aperçu Avatars 3D personnalisables */}
          <div
            style={{
              marginTop: '16px',
              padding: '10px 14px',
              borderRadius: '12px',
              background: 'rgba(15, 23, 42, 0.65)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              maxWidth: '520px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center' }}>
              {[
                '/images/avatars/avatar_executive_ceo.jpg',
                '/images/avatars/avatar_female_ceo.jpg',
                '/images/avatars/avatar_young_trader.jpg',
                '/images/avatars/avatar_tech_visionary.jpg',
                '/images/avatars/avatar_global_investor.jpg',
              ].map((src, i) => (
                <img
                  key={i}
                  src={src}
                  alt="Avatar 3D BizGames"
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: '2px solid #0f172a',
                    marginLeft: i > 0 ? '-10px' : '0',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.4)',
                  }}
                />
              ))}
            </div>
            <div style={{ fontSize: '12px', color: '#cbd5e1' }}>
              <strong style={{ color: '#10b981', display: 'block' }}>Avatars 3D Exclusifs</strong>
              <span>Personnalisez votre profil et incarnez votre stratège business !</span>
            </div>
          </div>
        </div>

        {/* Aperçu interactif mockup avec vraie mapmonde 3D OU récap si déjà joué */}
        <div style={styles.mockupContainer}>
          {alreadyPlayedData ? (
            /* — Carte récap détaillée — */
            <div style={styles.recapCard}>
              <div style={styles.recapHeader}>
                <CheckCircle2 size={20} color="#10b981" />
                <span style={styles.recapTitle}>Vos réponses d'aujourd'hui</span>
              </div>
              <div style={styles.recapQuestionList}>
                {(alreadyPlayedData.details || []).map((d, i) => (
                  <div key={i} style={styles.recapQuestionItem}>
                    <button
                      style={styles.recapQuestionBtn}
                      onClick={() => setExpandedQuestion(expandedQuestion === i ? null : i)}
                    >
                      <div style={styles.recapQLeft}>
                        <span style={{
                          ...styles.recapQNum,
                          background: getScoreColor(d.score, d.distanceKm),
                          color: '#ffffff',
                        }}>Q{i + 1}</span>
                        <span style={styles.recapQText}>{d.questionTexte}</span>
                      </div>
                      <div style={styles.recapQRight}>
                        <span style={{ ...styles.recapQScore, color: getScoreColor(d.score, d.distanceKm) }}>
                          {d.score > 10 ? d.score.toLocaleString('fr-FR') : (d.score * 100)} / 1 000
                        </span>
                        {expandedQuestion === i ? <ChevronUp size={14} color="#64748b" /> : <ChevronDown size={14} color="#64748b" />}
                      </div>
                    </button>
                    {expandedQuestion === i && (
                      <div style={styles.recapExpanded}>
                        <div style={styles.recapExpandedLieu}>
                          <MapPin size={13} color="#10b981" />
                          <strong>{d.lieuNom}</strong>
                          <span style={{ color: '#64748b' }}>&nbsp;• {d.pays}</span>
                        </div>
                        <p style={styles.recapExpandedExplication}>{d.explication}</p>
                        <div style={styles.recapExpandedDist}>
                          <span>Distance : {d.distanceKm < 1 ? '< 1 km' : `${d.distanceKm.toLocaleString('fr-FR')} km`}</span>
                          <span style={{ color: '#334155' }}>•</span>
                          <strong style={{ color: getScoreColor(d.score, d.distanceKm) }}>
                            {d.score >= 800 || (d.distanceKm <= 300)
                              ? '🟩 Excellent !'
                              : d.score >= 500 || (d.distanceKm <= 1500)
                              ? '🟨 Bien'
                              : '🟥 À améliorer'}
                          </strong>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* — Showcase Présentation Globe 3D — */
            <div
              style={styles.globeShowcaseCard}
              onClick={handleAction}
              role="button"
              tabIndex={0}
              title={isUserAdmin ? "Compte Administrateur — Ouvrir l'espace d'administration" : "Cliquer pour démarrer le défi sur le globe 3D"}
            >
              <div style={styles.globeShowcaseTopBar}>
                <div style={styles.globeLiveIndicator}>
                  <span style={styles.livePulseDot} />
                  <span>GLOBE 3D ÉCONOMIQUE • MANCHE OFFICIELLE</span>
                </div>
                <span style={styles.globeFreeBadge}>100% GRATUIT</span>
              </div>

              <div style={styles.globeImageWrapper}>
                <img
                  src="/images/bizgames_globe_preview.jpg"
                  alt="BizGames Globe 3D interactif - Sièges mondiaux et hubs économiques"
                  style={styles.globePreviewImg}
                />

                {/* Vignette & Gradients néon */}
                <div style={styles.globeImageVignette} />

                {/* Badges holographiques interactifs */}
                <div style={styles.hologramPin1}>
                  <span style={styles.hologramDotGreen} />
                  <span>Silicon Valley · Tech & IA</span>
                </div>
                <div style={styles.hologramPin2}>
                  <span style={styles.hologramDotAmber} />
                  <span>Paris · LVMH & Luxe</span>
                </div>
                <div style={styles.hologramPin3}>
                  <span style={styles.hologramDotBlue} />
                  <span>Wall Street · NYSE</span>
                </div>

                {/* Bouton Play central flottant */}
                <div style={styles.globePlayCenterBtn}>
                  <div style={styles.globePlayIconWrap}>
                    {isUserAdmin ? (
                      <Shield size={20} color="#03120e" />
                    ) : (
                      <Play size={22} fill="#03120e" color="#03120e" style={{ marginLeft: '3px' }} />
                    )}
                  </div>
                  <span style={styles.globePlayBtnLabel}>
                    {isUserAdmin ? "Espace Administrateur" : "Cliquer pour explorer le globe"}
                  </span>
                </div>
              </div>

              <div style={styles.globeShowcaseBottomBar}>
                <div style={styles.globeQuestionTeaser}>
                  <span style={styles.globeTeaserLabel}>QUESTION DU JOUR EN 5 MINUTES :</span>
                  <p style={styles.globeTeaserText}>
                    « Où se trouve le siège mondial d'Apple Park ? Visez sur le globe 3D ! »
                  </p>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAction();
                  }}
                  style={isUserAdmin ? { ...styles.globeActionPlayBtn, background: '#f59e0b' } : styles.globeActionPlayBtn}
                >
                  {isUserAdmin ? <Shield size={14} color="#03120e" /> : <Play size={14} fill="#03120e" />}
                  <span>{isUserAdmin ? "Admin" : "Lancer"}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </section>
      )}

      {/* STATS BAR (pour Mobile et Desktop) */}
      <section style={styles.statsBar}>
        <div style={styles.statsBarInner}>
          <div style={styles.statItem}>
            <span style={styles.statValue}>5 MIN</span>
            <span style={styles.statLabel}>Par jour (Simple & Rapide)</span>
          </div>
          <div style={styles.statDivider} />
          <div style={styles.statItem}>
            <span style={styles.statValue}>5</span>
            <span style={styles.statLabel}>Questions / jour</span>
          </div>
          <div style={styles.statDivider} />
          <div style={styles.statItem}>
            <span style={styles.statValue}>100%</span>
            <span style={styles.statLabel}>Gratuit pour toujours</span>
          </div>
          <div style={styles.statDivider} />
          <div style={styles.statItem}>
            <span style={styles.statValue}>0 €</span>
            <span style={styles.statLabel}>Sans abonnement ni CB</span>
          </div>
        </div>
      </section>

      {/* 3. SECTION COMMENT JOUER */}
      <section id="how-to-play" style={styles.section}>
        <div style={styles.sectionHeader}>
          <span style={styles.sectionPill}>COMMENT JOUER EN 5 MINUTES</span>
          <h2 style={styles.sectionTitle}>Simple, Intuitif et 100% Gratuit</h2>
          <p style={styles.sectionSubtitle}>Pas besoin d'être un trader ou un expert : 5 minutes par jour suffisent pour s'amuser, apprendre et défier ses amis !</p>
        </div>

        <div style={styles.stepsGrid}>
          <div style={styles.stepCard}>
            <div style={styles.stepIconBox}>
              <User size={24} color="#10b981" />
            </div>
            <div style={styles.stepNumber}>01</div>
            <h3 style={styles.stepTitle}>Rejoignez en 10 secondes</h3>
            <p style={styles.stepText}>
              Créez votre compte 100% gratuit par e-mail. Aucun abonnement, aucun moyen de paiement requis.
            </p>
          </div>

          <div style={styles.stepCard}>
            <div style={styles.stepIconBox}>
              <Building2 size={24} color="#f59e0b" />
            </div>
            <div style={styles.stepNumber}>02</div>
            <h3 style={styles.stepTitle}>5 Questions en 5 Minutes</h3>
            <p style={styles.stepText}>
              Chaque jour, découvrez une nouvelle série de 5 questions courtes sur les entreprises, bourses, giga-usines et marques phares.
            </p>
          </div>

          <div style={styles.stepCard}>
            <div style={styles.stepIconBox}>
              <MapPin size={24} color="#2dd4bf" />
            </div>
            <div style={styles.stepNumber}>03</div>
            <h3 style={styles.stepTitle}>Visez sur la Carte</h3>
            <p style={styles.stepText}>
              Observez les frontières détaillées (départements français, états américains, pays du monde) sur la carte MapLibre ou le globe 3D et cliquez sur votre estimation.
            </p>
          </div>

          <div style={styles.stepCard}>
            <div style={styles.stepIconBox}>
              <Share2 size={24} color="#a78bfa" />
            </div>
            <div style={styles.stepNumber}>04</div>
            <h3 style={styles.stepTitle}>Score, Streak & Partage</h3>
            <p style={styles.stepText}>
              Cumulez jusqu'à 50 points (noté de 1 à 10 par question), faites grimper votre série quotidienne de victoires (streak) et partagez votre résultat sans spoiler !
            </p>
          </div>
        </div>

        {/* 3D Character Duo Welcome Banner */}
        <div
          style={{
            marginTop: '32px',
            borderRadius: '20px',
            overflow: 'hidden',
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12), rgba(30, 41, 59, 0.7))',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            boxShadow: '0 16px 36px rgba(0, 0, 0, 0.4)',
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ flex: '1 1 320px', padding: '28px 32px' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 10px',
                borderRadius: '999px',
                background: 'rgba(16, 185, 129, 0.2)',
                color: '#34d399',
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: '0.05em',
                marginBottom: '12px',
              }}
            >
              <Sparkles size={13} />
              EXPÉRIENCE IMMERSIVE 3D
            </span>
            <h3 style={{ fontSize: '22px', fontWeight: 800, color: '#ffffff', margin: '0 0 10px 0' }}>
              Une équipe d'analystes et stratèges à vos côtés
            </h3>
            <p style={{ fontSize: '14px', color: '#cbd5e1', lineHeight: '1.6', margin: '0 0 18px 0' }}>
              Explorez le monde des affaires avec nos personnages et graphismes 3D. Choisissez votre avatar dans vos réglages, progressez à travers 6 rangs honorifiques et comparez vos scores chaque jour.
            </p>
            <button
              onClick={handleAction}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 22px',
                borderRadius: '12px',
                background: '#10b981',
                color: '#03120e',
                fontWeight: 700,
                fontSize: '14px',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)',
              }}
            >
              <Play size={15} fill="#03120e" />
              <span>Démarrer la Manche du Jour</span>
            </button>
          </div>
          <div style={{ flex: '1 1 360px', minHeight: '220px', position: 'relative' }}>
            <img
              src="/images/characters/char_welcome_globe.jpg"
              alt="Personnages 3D BizGames avec globe interactif"
              style={{
                width: '100%',
                height: '100%',
                maxHeight: '280px',
                objectFit: 'cover',
                display: 'block',
              }}
            />
          </div>
        </div>
      </section>

      {/* 4. SECTION SECTEURS BUSINESS */}
      <section id="sectors" style={styles.sectionAlt}>
        <div style={styles.sectionHeader}>
          <span style={styles.sectionPill}>SECTEURS COUVERTS</span>
          <h2 style={styles.sectionTitle}>L'Économie Mondiale en 13 Secteurs</h2>
          <p style={styles.sectionSubtitle}>Des sièges sociaux du CAC 40 aux giga-usines asiatiques, en passant par les grandes places financières et les hubs logistiques mondiaux.</p>
        </div>

        <div style={styles.sectorsGrid}>
          <div style={styles.sectorCard}>
            <Cpu size={22} color="#60a5fa" />
            <h4 style={styles.sectorTitle}>🏢 Tech & Hubs Numériques</h4>
            <p style={styles.sectorExamples}>Apple Park, Google Plex, Station F, Shenzhen Tech Park...</p>
          </div>

          <div style={styles.sectorCard}>
            <TrendingUp size={22} color="#34d399" />
            <h4 style={styles.sectorTitle}>📉 Finance & Bourses</h4>
            <p style={styles.sectorExamples}>NYSE, Tokyo Stock Exchange, Frankfurt Börse, Dubai DIFC...</p>
          </div>

          <div style={styles.sectorCard}>
            <Factory size={22} color="#f59e0b" />
            <h4 style={styles.sectorTitle}>🏭 Giga-Usines & Industrie</h4>
            <p style={styles.sectorExamples}>Tesla Gigafactory, TSMC Fab, Samsung SDI, BYD Plant...</p>
          </div>

          <div style={styles.sectorCard}>
            <Zap size={22} color="#fbbf24" />
            <h4 style={styles.sectorTitle}>⚡ Énergie & Ressources</h4>
            <p style={styles.sectorExamples}>Aramco Dhahran, TotalEnergies, Chevron HQ, Neom...</p>
          </div>

          <div style={styles.sectorCard}>
            <Gem size={22} color="#e879f9" />
            <h4 style={styles.sectorTitle}>💎 Luxe & Premium</h4>
            <p style={styles.sectorExamples}>LVMH Paris, Kering, Richemont Genève, Hermès...</p>
          </div>

          <div style={styles.sectorCard}>
            <Car size={22} color="#2dd4bf" />
            <h4 style={styles.sectorTitle}>🚗 Automobile</h4>
            <p style={styles.sectorExamples}>Volkswagen Wolfsburg, Toyota City, BYD Shenzhen, Stellantis...</p>
          </div>

          <div style={styles.sectorCard}>
            <Plane size={22} color="#93c5fd" />
            <h4 style={styles.sectorTitle}>✈️ Aéronautique & Transport</h4>
            <p style={styles.sectorExamples}>Airbus Toulouse, Boeing Seattle, Emirates Dubai, Fedex Memphis...</p>
          </div>

          <div style={styles.sectorCard}>
            <ShoppingBag size={22} color="#f472b6" />
            <h4 style={styles.sectorTitle}>🛍️ Retail & Commerce</h4>
            <p style={styles.sectorExamples}>Amazon HQ, Alibaba Hangzhou, Walmart Bentonville, Inditex...</p>
          </div>

          <div style={styles.sectorCard}>
            <Leaf size={22} color="#86efac" />
            <h4 style={styles.sectorTitle}>🌾 Agriculture & Agroalimentaire</h4>
            <p style={styles.sectorExamples}>Cargill, Nestlé Vevey, Danone Paris, ADM Chicago...</p>
          </div>

          <div style={styles.sectorCard}>
            <DollarSign size={22} color="#fde68a" />
            <h4 style={styles.sectorTitle}>🏦 Fusions & Acquisitions</h4>
            <p style={styles.sectorExamples}>Méga-deals, rachats stratégiques, OPA mondiales majeures...</p>
          </div>

          <div style={styles.sectorCard}>
            <BarChart2 size={22} color="#a5f3fc" />
            <h4 style={styles.sectorTitle}>📊 Santé & Pharma</h4>
            <p style={styles.sectorExamples}>Johnson & Johnson, Pfizer, Roche Bâle, Novo Nordisk...</p>
          </div>

          <div style={styles.sectorCard}>
            <Sparkles size={22} color="#c4b5fd" />
            <h4 style={styles.sectorTitle}>⛏️ Mines & Matières Premières</h4>
            <p style={styles.sectorExamples}>Rio Tinto, BHP, Glencore, Codelco, ENAMI Chile...</p>
          </div>
        </div>
      </section>

      {/* 5. SECTION SCORING & RANGS */}
      <section id="scoring" style={styles.section}>
        <div style={styles.sectionHeader}>
          <span style={styles.sectionPill}>SCORING & ANALYSE DE PERFORMANCE</span>
          <h2 style={styles.sectionTitle}>Précision au Kilomètre Près & Barème Officiel</h2>
          <p style={styles.sectionSubtitle}>
            Une évaluation ultra-précise sur 5 000 points (jusqu'à 1 000 pts par question), calculée selon la distance orthodromique réelle pour départager les meilleurs stratèges au kilomètre près.
          </p>
        </div>

        {/* Grille principale : Barème de distance & Rangs Honorifiques */}
        <div style={styles.scoringRow}>
          <div style={styles.scoreRuleBox}>
            <div style={styles.scoringBoxHeader}>
              <Target size={20} color="#10b981" />
              <h4 style={styles.ranksTitle}>Barème de distance (par question jusqu'à 1 000 pts) :</h4>
            </div>
            <p style={styles.scoringBoxDesc}>
              Décroissance exponentielle continue calculée selon la formule Haversine :
            </p>
            <div style={styles.scoreRuleItem}>
              <span style={styles.scoreRuleRange}>&le; 1 km</span>
              <span style={styles.scoreRulePoints}>1 000 pts 🟩 Tir Parfait Ultime</span>
            </div>
            <div style={styles.scoreRuleItem}>
              <span style={styles.scoreRuleRange}>1 – 25 km</span>
              <span style={styles.scoreRulePoints}>985 à 999 pts 🟩 Précision Chirurgicale</span>
            </div>
            <div style={styles.scoreRuleItem}>
              <span style={styles.scoreRuleRange}>25 – 150 km</span>
              <span style={styles.scoreRulePoints}>915 à 984 pts 🟩 Précision Élite</span>
            </div>
            <div style={styles.scoreRuleItem}>
              <span style={styles.scoreRuleRange}>150 – 1 500 km</span>
              <span style={styles.scoreRulePoints}>420 à 914 pts 🟨 Bonne Analyse Régionale</span>
            </div>
            <div style={styles.scoreRuleItem}>
              <span style={styles.scoreRuleRange}>1 500 – 4 000 km</span>
              <span style={styles.scoreRulePoints}>130 à 419 pts 🟧 Zone Approximative</span>
            </div>
            <div style={styles.scoreRuleItem}>
              <span style={styles.scoreRuleRange}>&gt; 4 000 km</span>
              <span style={styles.scoreRulePoints}>50 à 129 pts ⬛ Éloigné (Plancher garanti)</span>
            </div>
            <div style={styles.scoringFootnote}>
              💡 <em>Chaque tir rapporte au minimum 50 pts (aucun 0 punitif). Chaque kilomètre compte pour départager sans contestation possible !</em>
            </div>
          </div>

          <div style={styles.ranksBox}>
            <div style={styles.scoringBoxHeader}>
              <Trophy size={20} color="#fbbf24" />
              <h4 style={styles.ranksTitle}>Hiérarchie des Rangs Business (sur 5 000 pts) :</h4>
            </div>
            <p style={styles.scoringBoxDesc}>
              Attribués automatiquement selon le cumul des 5 questions du round quotidien :
            </p>
            <div style={styles.rankItem}>
              <span style={styles.rankIcon}>👑</span>
              <div style={styles.rankDetails}>
                <span style={styles.rankName}>Légende du Business Mondial</span>
                <span style={styles.rankBadgePoints}>4 700 – 5 000 pts • Score global ≥ 94%</span>
              </div>
            </div>
            <div style={styles.rankItem}>
              <span style={styles.rankIcon}>💎</span>
              <div style={styles.rankDetails}>
                <span style={styles.rankName}>Directeur Général International</span>
                <span style={styles.rankBadgePoints}>4 000 – 4 699 pts • Score global ≥ 80%</span>
              </div>
            </div>
            <div style={styles.rankItem}>
              <span style={styles.rankIcon}>🌍</span>
              <div style={styles.rankDetails}>
                <span style={styles.rankName}>Stratège Global</span>
                <span style={styles.rankBadgePoints}>3 200 – 3 999 pts • Score global ≥ 64%</span>
              </div>
            </div>
            <div style={styles.rankItem}>
              <span style={styles.rankIcon}>⚡</span>
              <div style={styles.rankDetails}>
                <span style={styles.rankName}>Analyste de Marchés</span>
                <span style={styles.rankBadgePoints}>2 400 – 3 199 pts • Score global ≥ 48%</span>
              </div>
            </div>
            <div style={styles.rankItem}>
              <span style={styles.rankIcon}>🌱</span>
              <div style={styles.rankDetails}>
                <span style={styles.rankName}>Entrepreneur en Herbe</span>
                <span style={styles.rankBadgePoints}>1 500 – 2 399 pts • Score global ≥ 30%</span>
              </div>
            </div>
            <div style={styles.rankItem}>
              <span style={styles.rankIcon}>🍃</span>
              <div style={styles.rankDetails}>
                <span style={styles.rankName}>Stagiaire du Commerce</span>
                <span style={styles.rankBadgePoints}>0 – 1 499 pts • Score global &lt; 30%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Nouvelles informations ajoutées : Métriques de précision & Hub de progression */}
        <div style={styles.advancedMetricsRow}>
          <div style={styles.advancedMetricCard}>
            <div style={styles.metricCardIconWrap}>
              <Target size={22} color="#10b981" />
            </div>
            <div style={styles.metricCardBody}>
              <span style={styles.metricCardTag}>NOUVELLE MÉTRIQUE</span>
              <h5 style={styles.metricCardTitle}>Précision Géo &lt; 500 km</h5>
              <p style={styles.metricCardText}>
                Suivi en temps réel du pourcentage de vos réponses à moins de 500 km de la cible. Relié directement à votre historique réel Firebase.
              </p>
            </div>
          </div>

          <div style={styles.advancedMetricCard}>
            <div style={styles.metricCardIconWrap}>
              <BarChart2 size={22} color="#38bdf8" />
            </div>
            <div style={styles.metricCardBody}>
              <span style={styles.metricCardTag}>NOUVEAU SUIVI</span>
              <h5 style={styles.metricCardTitle}>Maîtrise par Secteur</h5>
              <p style={styles.metricCardText}>
                Analyse de vos scores sur 5 filières majeures : Tech & GAFAM, Wall Street & Finance, Luxe, Énergie & Gigafactories, Automobile & Aéro.
              </p>
            </div>
          </div>

          <div style={styles.advancedMetricCard}>
            <div style={styles.metricCardIconWrap}>
              <Target size={22} color="#a855f7" />
            </div>
            <div style={styles.metricCardBody}>
              <span style={styles.metricCardTag}>PRÉCISION</span>
              <h5 style={styles.metricCardTitle}>Précision Kilométrique Moyenne</h5>
              <p style={styles.metricCardText}>
                Calcul de la proximité géographique moyenne de vos tirs par rapport au siège ou lieu cible pour évaluer votre intuition business.
              </p>
            </div>
          </div>

          <div style={styles.advancedMetricCard}>
            <div style={styles.metricCardIconWrap}>
              <Flame size={22} color="#f59e0b" />
            </div>
            <div style={styles.metricCardBody}>
              <span style={styles.metricCardTag}>RÉGULARITÉ</span>
              <h5 style={styles.metricCardTitle}>Série Active (Streak)</h5>
              <p style={styles.metricCardText}>
                Compteur de jours consécutifs joués. Chaque manche quotidienne validée maintient et augmente votre flamme de streak dans votre Hub Joueur.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5B. CLASSEMENT OFFICIEL DES JOUEURS */}
      <section id="leaderboard" style={styles.section}>
          <div style={styles.sectionHeader}>
            <span style={styles.sectionPill}>CLASSEMENT OFFICIEL</span>
            <h2 style={styles.sectionTitle}>Palmarès & Rangs des Joueurs</h2>
            <p style={styles.sectionSubtitle}>
              Chaque jour, 5 questions courtes pour tester votre intuition business et vous hisser au sommet du classement mondial.
            </p>
          </div>

          <div style={styles.leaderboardPreviewBox}>
            <div style={styles.leaderboardPodiumHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Crown size={22} color="#fbbf24" />
                <h3 style={styles.leaderboardPodiumTitle}>Rangs d'Élite du Jour ({todayDateStr})</h3>
              </div>
              <span style={styles.leaderboardPodiumBadge}>100% GRATUIT</span>
            </div>

            <div style={styles.leaderboardRanksList}>
              <div style={styles.leaderboardRankItemGold}>
                <div style={styles.leaderboardRankLeft}>
                  <span style={styles.leaderboardMedal}>👑</span>
                  <div>
                    <strong style={{ color: '#fbbf24', fontSize: '13px', display: 'block' }}>Légende du Business Mondial</strong>
                    <span style={{ fontSize: '11px', color: '#94a3b8' }}>4 700 à 5 000 points • Score global ≥ 94%</span>
                  </div>
                </div>
                <span style={styles.leaderboardRankScore}>Rang #1</span>
              </div>

              <div style={styles.leaderboardRankItemSilver}>
                <div style={styles.leaderboardRankLeft}>
                  <span style={styles.leaderboardMedal}>💎</span>
                  <div>
                    <strong style={{ color: '#e2e8f0', fontSize: '13px', display: 'block' }}>Directeur Général International</strong>
                    <span style={{ fontSize: '11px', color: '#94a3b8' }}>4 000 à 4 699 points • Score global ≥ 80%</span>
                  </div>
                </div>
                <span style={styles.leaderboardRankScore}>Rang #2</span>
              </div>

              <div style={styles.leaderboardRankItemBronze}>
                <div style={styles.leaderboardRankLeft}>
                  <span style={styles.leaderboardMedal}>🌍</span>
                  <div>
                    <strong style={{ color: '#fdba74', fontSize: '13px', display: 'block' }}>Stratège Global</strong>
                    <span style={{ fontSize: '11px', color: '#94a3b8' }}>3 200 à 3 999 points • Score global ≥ 64%</span>
                  </div>
                </div>
                <span style={styles.leaderboardRankScore}>Rang #3</span>
              </div>
            </div>

            <div style={styles.leaderboardRuleCard}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Award size={16} color="#10b981" />
                <h4 style={{ margin: 0, fontSize: '13px', color: '#ffffff', fontWeight: '800' }}>Critères de classement :</h4>
              </div>
              <ul style={styles.leaderboardCriteriaList}>
                <li>🎯 <strong>Score total sur 5 000 pts :</strong> Cumul de vos 5 estimations au kilomètre près.</li>
                <li>📍 <strong>Précision kilométrique :</strong> Départage les ex-aequo par la plus courte distance cumulée.</li>
                <li>🔥 <strong>Série Quotidienne (Streak) :</strong> Nombre de jours consécutifs joués sans interruption.</li>
              </ul>
            </div>

            <div style={styles.leaderboardActionRow}>
              <button
                onClick={() => {
                  if (onOpenPlayerHub) onOpenPlayerHub('leaderboard');
                  else if (onOpenLeaderboard) onOpenLeaderboard();
                }}
                style={styles.leaderboardFullBtn}
                type="button"
              >
                <Trophy size={16} color="#fbbf24" />
                <span>Ouvrir le Classement Complet & Podium</span>
                <ArrowRight size={15} />
              </button>
            </div>
          </div>
        </section>

      {/* 6. DIMENSION SOCIALE & RETENTION */}
      <section id="social" style={styles.sectionAlt}>
        <div style={styles.sectionHeader}>
          <span style={styles.sectionPill}>COMPÉTITION SOCIALE</span>
          <h2 style={styles.sectionTitle}>Jouez Seul ou avec Votre Réseau</h2>
          <p style={styles.sectionSubtitle}>Créez des groupes privés, lancez des challenges entre collègues, amis ou communautés business.</p>
        </div>

        <div style={styles.socialGrid}>
          <div style={styles.socialCard}>
            <div style={styles.socialIconBox}>
              <Users size={28} color="#10b981" />
            </div>
            <h3 style={styles.socialCardTitle}>Groupes Privés</h3>
            <p style={styles.socialCardText}>
              Créez un groupe pour votre entreprise, votre école, vos collègues ou vos amis. Classement interne, challenges dédiés, salon privé.
            </p>
            <div style={styles.socialTagRow}>
              <span style={styles.socialTag}>Entreprise</span>
              <span style={styles.socialTag}>École</span>
              <span style={styles.socialTag}>Promo</span>
              <span style={styles.socialTag}>Amis</span>
            </div>
          </div>

          <div style={styles.socialCard}>
            <div style={styles.socialIconBox}>
              <Target size={28} color="#f59e0b" />
            </div>
            <h3 style={styles.socialCardTitle}>Challenges Privés</h3>
            <p style={styles.socialCardText}>
              Organisez un challenge sur une période définie. Définissez les règles, invitez vos participants, suivez le classement en temps réel.
            </p>
            <div style={styles.socialExampleBox}>
              <div style={styles.socialExampleTitle}>EXEMPLE</div>
              <div style={styles.socialExampleContent}>
                <span>🏆 CEO Challenge Luxembourg</span>
                <span style={{ color: '#94a3b8' }}>10 participants • 7 jours</span>
              </div>
            </div>
          </div>

          <div style={styles.socialCard}>
            <div style={styles.socialIconBox}>
              <Share2 size={28} color="#2dd4bf" />
            </div>
            <h3 style={styles.socialCardTitle}>Partage & Invitations</h3>
            <p style={styles.socialCardText}>
              Partagez votre score sans révéler les réponses. Invitez via lien, code ou partage social. Compatible WhatsApp, LinkedIn, X et partage natif mobile.
            </p>
            <div style={styles.sharePreview}>
              <div style={styles.sharePreviewTitle}>BizGames · {todayDateStr}</div>
              <div style={styles.shareEmojis}>🟩 🟩 🟨 🟩 🟧</div>
              <div style={styles.shareScore}>4 875 / 5 000 pts • Précision Élite</div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. STREAK & RETENTION */}
      <section style={styles.section}>
        <div style={styles.sectionHeader}>
          <span style={styles.sectionPill}>PROGRESSION</span>
          <h2 style={styles.sectionTitle}>Revenez Chaque Jour</h2>
          <p style={styles.sectionSubtitle}>Construisez votre streak, montez dans les classements, développez votre culture économique mondiale.</p>
        </div>

        <div style={styles.retentionGrid}>
          <div style={styles.retentionCard}>
            <Flame size={32} color="#f59e0b" />
            <h4 style={styles.retentionTitle}>Streak quotidien</h4>
            <p style={styles.retentionText}>Jouez chaque jour pour maintenir votre série. Les streaks les plus longs sont mis en avant dans les classements.</p>
          </div>
          <div style={styles.retentionCard}>
            <Trophy size={32} color="#fbbf24" />
            <h4 style={styles.retentionTitle}>Classement du jour</h4>
            <p style={styles.retentionText}>Chaque round quotidien génère un classement global et des classements privés dans vos groupes.</p>
          </div>
          <div style={styles.retentionCard}>
            <BarChart2 size={32} color="#10b981" />
            <h4 style={styles.retentionTitle}>Vos statistiques</h4>
            <p style={styles.retentionText}>Score moyen, précision géographique, progression par catégorie, historique complet de vos parties.</p>
          </div>
        </div>

        <div style={styles.flowRow}>
          {['Jouer', 'Score', 'Streak', 'Classement', 'Partager', 'Inviter', 'Groupes'].map((step, i, arr) => (
            <React.Fragment key={step}>
              <div style={styles.flowStep}>
                <span style={styles.flowStepText}>{step}</span>
              </div>
              {i < arr.length - 1 && <ArrowRight size={14} color="#334155" />}
            </React.Fragment>
          ))}
        </div>
      </section>

      {/* 7. GRANDE SECTION DU CHALLENGE 30 JOURS (SÉRIE QUOTIDIENNE / STREAK) */}
      <section id="challenge-30-jours" style={styles.sectionChallenge}>
          <div style={styles.sectionHeader}>
            <div style={styles.challengePill}>
              <Flame size={14} color="#f97316" fill="#f97316" />
              <span>CHALLENGE 30 JOURS • SÉRIE QUOTIDIENNE</span>
            </div>
            <h2 style={styles.sectionTitle}>
              Le Défi des 30 Jours Consécutifs : Devenez un <span style={styles.goldGradient}>Titan du Business</span>
            </h2>
            <p style={styles.sectionSubtitle}>
              Seulement 5 minutes par jour pour maintenir votre flamme active, débloquer jusqu'à <strong>2 500 points bonus</strong>, gagner des boucliers protecteurs et hisser votre nom au Panthéon mondial des stratèges.
            </p>
          </div>

          {/* CARTE DYNAMIQUE DE PROGRESSION DU JOUEUR */}
          <div style={styles.challengePlayerCard}>
            <div style={styles.challengePlayerCardTop}>
              <div style={styles.challengePlayerCardLeft}>
                <div style={styles.challengeFlameBox}>
                  <Flame size={32} color="#f97316" fill="#f97316" />
                  <span style={styles.challengeFlameNumber}>{currentStreak}</span>
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <h3 style={styles.challengePlayerTitle}>
                      {currentStreak > 0 ? `Votre Série Active : ${currentStreak} / 30 jours` : 'Votre Série Actuelle : 0 jour'}
                    </h3>
                    <span style={styles.challengePlayerBadge}>
                      {streakTier?.activeMilestone ? `${streakTier.activeMilestone.badge} ${streakTier.activeMilestone.title}` : '🌱 Débutant en Série'}
                    </span>
                  </div>
                  <p style={styles.challengePlayerSubtitle}>
                    {currentStreak > 0
                      ? `Bravo ! Vous avez joué ${currentStreak} jour${currentStreak > 1 ? 's' : ''} consécutif${currentStreak > 1 ? 's' : ''}. Record personnel : ${Math.max(currentStreak, maxStreak)} jours.`
                      : 'Complétez votre manche officielle du jour (5 min) pour allumer votre première flamme de série.'}
                  </p>
                </div>
              </div>

              {streakTier?.nextMilestone && (
                <div style={styles.challengeNextMilestoneBadge}>
                  <span style={styles.challengeNextLabel}>PROCHAIN JALON :</span>
                  <div style={styles.challengeNextValue}>
                    <span>{streakTier.nextMilestone.badge}</span>
                    <strong>{streakTier.nextMilestone.title} (J-{streakTier.nextMilestone.days})</strong>
                  </div>
                  <span style={styles.challengeDaysLeftText}>
                    {streakTier.daysToNext === 0 ? 'Objectif atteint !' : `Encore ${streakTier.daysToNext} jour${streakTier.daysToNext > 1 ? 's' : ''} consécutif${streakTier.daysToNext > 1 ? 's' : ''}`}
                  </span>
                </div>
              )}
            </div>

            {/* Barre de progression des 30 jours */}
            <div style={styles.challengeProgressWrap}>
              <div style={styles.challengeProgressLabels}>
                <span style={styles.challengeProgressLabelText}>
                  Progression vers le rang Titan : <strong>{streakTier?.progressPercent || 0}%</strong>
                </span>
                <span style={styles.challengeProgressTargetText}>
                  Objectif ultime : 30 jours d’affilée 👑
                </span>
              </div>
              <div style={styles.challengeProgressTrack}>
                <div
                  style={{
                    ...styles.challengeProgressFill,
                    width: `${Math.max(currentStreak > 0 ? 5 : 2, streakTier?.progressPercent || 0)}%`,
                  }}
                />
              </div>
            </div>

            {/* Actions rapides de la carte */}
            <div style={styles.challengeCardActionRow}>
              {alreadyPlayedData ? (
                <div style={styles.challengeCardStatusPlayed}>
                  <CheckCircle2 size={16} color="#10b981" />
                  <span>Manche du jour complétée ! Votre flamme est protégée pour aujourd'hui.</span>
                </div>
              ) : (
                <button onClick={handleAction} style={styles.challengeActionPlayBtn}>
                  <Play size={16} fill="#03120e" />
                  <span>{isUserAdmin ? "Ouvrir l'Espace Admin" : "Jouer la manche du jour (Nourrir ma flamme)"}</span>
                  <ArrowRight size={16} />
                </button>
              )}
            </div>
          </div>

          {/* LES 3 PILIERS DU CONCEPT */}
          <div style={styles.challengeConceptsGrid}>
            <div style={styles.challengeConceptCard}>
              <div style={styles.conceptIconWrapAmber}>
                <Clock size={24} color="#f59e0b" />
              </div>
              <h4 style={styles.conceptCardTitle}>1. Une Manche Quotidienne</h4>
              <p style={styles.conceptCardText}>
                Chaque jour entre <strong>00h00 et 23h59</strong>, jouez les 5 questions business de la manche officielle (environ 5 minutes). Chaque round validé incrémente votre flamme de <strong>+1 jour</strong>.
              </p>
              <div style={styles.conceptHighlightBadge}>⚡ 5 min • Simple & Rapide</div>
            </div>

            <div style={styles.challengeConceptCard}>
              <div style={styles.conceptIconWrapBlue}>
                <Shield size={24} color="#38bdf8" />
              </div>
              <h4 style={styles.conceptCardTitle}>2. Protection Bouclier (Shield)</h4>
              <p style={styles.conceptCardText}>
                Débloqué dès <strong>7 jours de fidélité</strong> ! Si vous avez un empêchement ou oubliez de jouer une journée, votre <strong>Bouclier de Série</strong> s'active automatiquement et sauve votre chaîne sans remise à zéro.
              </p>
              <div style={styles.conceptHighlightBadgeBlue}>🛡️ Sauvegarde anti-oubli</div>
            </div>

            <div style={styles.challengeConceptCard}>
              <div style={styles.conceptIconWrapGreen}>
                <Crown size={24} color="#10b981" />
              </div>
              <h4 style={styles.conceptCardTitle}>3. Bonus Permanents & Rangs</h4>
              <p style={styles.conceptCardText}>
                À chaque jalon franchi, encaissez de <strong>+100 à +2 500 points bonus</strong> permanents ajoutés à votre compte, et affichez des flammes et badges de rang d'élite sur votre profil public.
              </p>
              <div style={styles.conceptHighlightBadgeGreen}>🏆 Jusqu'à +2 500 pts</div>
            </div>
          </div>

          {/* GRILLE DES 5 PALIERS DU CHALLENGE */}
          <div style={styles.challengeMilestonesSectionWrap}>
            <div style={styles.milestonesSectionTitleRow}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Trophy size={20} color="#fbbf24" />
                <h3 style={styles.milestonesSectionHeading}>Les 5 Paliers de Récompenses à Débloquer</h3>
              </div>
              <span style={styles.milestonesFreeNotice}>100% GRATUIT • SANS ABONNEMENT</span>
            </div>

            <div style={styles.milestonesGridContainer}>
              {STREAK_MILESTONES.map((m) => {
                const isUnlocked = currentStreak >= m.days;
                const isNext = streakTier?.nextMilestone?.days === m.days;

                return (
                  <div
                    key={m.days}
                    style={{
                      ...styles.milestoneLandingCard,
                      ...(isUnlocked ? styles.milestoneLandingCardUnlocked : {}),
                      ...(isNext ? styles.milestoneLandingCardNext : {}),
                    }}
                  >
                    <div style={styles.milestoneCardHead}>
                      <span style={styles.milestoneMedalIcon}>{m.badge}</span>
                      <span
                        style={{
                          ...styles.milestoneDayBadge,
                          background: isUnlocked
                            ? 'rgba(16, 185, 129, 0.25)'
                            : isNext
                            ? 'rgba(245, 158, 11, 0.25)'
                            : 'rgba(255, 255, 255, 0.08)',
                          color: isUnlocked ? '#34d399' : isNext ? '#fbbf24' : '#94a3b8',
                          borderColor: isUnlocked
                            ? 'rgba(16, 185, 129, 0.5)'
                            : isNext
                            ? 'rgba(245, 158, 11, 0.5)'
                            : 'rgba(255, 255, 255, 0.1)',
                        }}
                      >
                        {isUnlocked ? '✓ Débloqué' : `Jour ${m.days}`}
                      </span>
                    </div>

                    <h4
                      style={{
                        ...styles.milestoneTitleText,
                        color: isUnlocked ? '#34d399' : isNext ? '#fbbf24' : '#f8fafc',
                      }}
                    >
                      {m.title}
                    </h4>

                    <div style={styles.milestoneBonusPointsPill}>
                      <Sparkles size={12} color="#fbbf24" />
                      <span>+{m.bonusPts} pts bonus</span>
                    </div>

                    <p style={styles.milestonePerkExplain}>
                      {m.perkFr}
                    </p>

                    <div style={styles.milestoneFooterStatus}>
                      {isUnlocked ? (
                        <span style={{ color: '#10b981', fontWeight: '700', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <CheckCircle2 size={13} color="#10b981" /> Acquis sur votre profil
                        </span>
                      ) : isNext ? (
                        <span style={{ color: '#fbbf24', fontWeight: '700', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Flame size={13} color="#f97316" fill="#f97316" /> Objectif en cours (J-{m.days})
                        </span>
                      ) : (
                        <span style={{ color: '#64748b', fontSize: '11px' }}>
                          À débloquer à J-{m.days}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* FOIRE AUX QUESTIONS EXPRESS DU CHALLENGE */}
          <div style={styles.challengeFaqBox}>
            <div style={styles.challengeFaqHeader}>
              <Award size={18} color="#10b981" />
              <h4 style={styles.challengeFaqTitle}>Questions Fréquentes sur le Challenge 30 Jours</h4>
            </div>

            <div style={styles.challengeFaqGrid}>
              <div style={styles.challengeFaqItem}>
                <strong style={styles.challengeFaqQ}>Le Challenge est-il 100% gratuit ?</strong>
                <p style={styles.challengeFaqA}>
                  Oui, totalement ! Il n'y a aucun compte payant, abonnement ou pass VIP. Tout le monde participe sur un pied d'égalité absolue.
                </p>
              </div>

              <div style={styles.challengeFaqItem}>
                <strong style={styles.challengeFaqQ}>À quelle heure se renouvelle la manche ?</strong>
                <p style={styles.challengeFaqA}>
                  Chaque nuit à 00h00, une nouvelle manche de 5 questions inédites est publiée. Vous disposez de 24h entières pour jouer vos 5 minutes.
                </p>
              </div>

              <div style={styles.challengeFaqItem}>
                <strong style={styles.challengeFaqQ}>Que se passe-t-il en cas de jour manqué ?</strong>
                <p style={styles.challengeFaqA}>
                  Si vous avez débloqué le Bouclier de Série (dès le 7ème jour), il est automatiquement utilisé pour préserver votre progression. Sinon, la série redémarre à J-1. Vos points déjà gagnés restent acquis pour toujours !
                </p>
              </div>

              <div style={styles.challengeFaqItem}>
                <strong style={styles.challengeFaqQ}>Puis-je jouer plusieurs fois par jour ?</strong>
                <p style={styles.challengeFaqA}>
                  Pour préserver l'équité sportive du classement mondial, seule votre 1ère partie du jour compte pour le score officiel et pour faire grandir votre série.
                </p>
              </div>
            </div>
          </div>

          {/* CTA FINAL DU CHALLENGE */}
          <div style={styles.challengeBottomCtaRow}>
            <button onClick={handleAction} style={styles.primaryCta}>
              <Play size={18} fill="#03120e" />
              <span>{alreadyPlayedData ? "Consulter mes réponses du jour" : "Relever le Défi du Jour (5 min)"}</span>
              <ArrowRight size={18} />
            </button>
          </div>
        </section>

      {/* 8. BANNIÈRE CTA FINAL */}
      <section style={styles.finalCtaSection}>
        <div style={styles.finalCtaCard}>
          <div style={styles.finalCtaBadge}>
            <Globe2 size={18} color="#10b981" />
            <span>Compte gratuit · Aucun abonnement</span>
          </div>
          <h2 style={styles.finalCtaTitle}>
            Prêt à tester votre culture business mondiale ?
          </h2>
          <p style={styles.finalCtaText}>
            Rejoignez BizGames, créez votre compte gratuitement et relevez le défi du jour. Invitez vos collègues. Construisez votre streak.
          </p>
          {isUserAdmin ? (
            <button onClick={onGoAdmin} style={{ ...styles.finalCtaButton, background: '#f59e0b', color: '#03120e' }}>
              <Shield size={18} />
              <span>Ouvrir l'Espace Administration</span>
            </button>
          ) : alreadyPlayedData ? (
            <button
              onClick={() => onOpenPlayerHub && onOpenPlayerHub('results')}
              style={styles.finalCtaButtonDone}
            >
              <CheckCircle2 size={18} color="#03120e" />
              <span>Mes réponses du jour</span>
            </button>
          ) : (
            <button onClick={handleAction} style={styles.finalCtaButton}>
              <Play size={18} fill="#03120e" />
              <span>Commencer — C'est gratuit</span>
            </button>
          )}
        </div>
      </section>

      {/* 9. NAVIGATION BAS DE PAGE & FOOTER */}
      {!isMobile ? (
        <footer style={styles.footer}>
          <div style={styles.footerInner}>
            <div style={styles.footerColMain}>
              <div style={styles.brand}>
                <Globe2 size={18} color="#f59e0b" />
                <span style={styles.brandName}>BizGames</span>
              </div>
              <p style={styles.footerText}>
                Le jeu quotidien de géographie business et d'économie mondiale.
                Globe 3D interactif avec frontières détaillées. 100% gratuit pour tous.
              </p>
            </div>

            <div style={styles.footerCol}>
              <h5 style={styles.footerHeading}>NAVIGATION</h5>
              <button onClick={handleAction} style={styles.footerLinkBtn}>{isUserAdmin ? "Espace Admin" : "Lancer le Défi du Jour"}</button>
              <a href="#how-to-play" style={styles.footerLink}>Comment Jouer</a>
              <a href="#sectors" style={styles.footerLink}>Secteurs Business</a>
              <a href="#scoring" style={styles.footerLink}>Scoring & Rangs</a>
              <a href="#challenge-30-jours" style={styles.footerLink}>Challenge 30 Jours</a>
              <a href="#social" style={styles.footerLink}>Compétition Sociale</a>
            </div>

            <div style={styles.footerCol}>
              <h5 style={styles.footerHeading}>INFORMATIONS & LÉGAL</h5>
              <button onClick={() => setLegalTab('mentions')} style={styles.footerLinkBtn}>Mentions Légales</button>
              <button onClick={() => setLegalTab('about')} style={styles.footerLinkBtn}>Qui sommes-nous ?</button>
              <button onClick={() => setLegalTab('privacy')} style={styles.footerLinkBtn}>Politique de Confidentialité</button>
              <button onClick={() => setLegalTab('cgu')} style={styles.footerLinkBtn}>Conditions d'Utilisation (CGU)</button>
              <button onClick={() => setLegalTab('contact')} style={styles.footerLinkBtn}>Contact & Support</button>
            </div>
          </div>

          <div style={styles.footerBottom}>
            <p>© 2026 BizGames. Tous droits réservés.</p>
          </div>
        </footer>
      ) : (
        <>
          {/* Barre d'action et navigation de page en bas de la vue mobile */}
          <div style={styles.mobilePageBottomNav}>
            <button
              onClick={handleAction}
              style={styles.mobilePageNavBtnPrimary}
              type="button"
            >
              <Play size={16} fill="#03120e" />
              <span>{alreadyPlayedData ? "Voir mes réponses du jour" : "⚡ Jouer ma Partie Gratuite (5 min)"}</span>
              <ArrowRight size={16} />
            </button>

            <div style={styles.mobileNavStepRow}>
              {currentPageIndex > 0 ? (
                <button
                  onClick={handlePrevPage}
                  style={styles.mobilePageNavBtn}
                  type="button"
                >
                  <ChevronLeft size={15} />
                  <span>{NAV_PAGES[currentPageIndex - 1].shortTitle}</span>
                </button>
              ) : <div />}

              {currentPageIndex < NAV_PAGES.length - 1 ? (
                <button
                  onClick={handleNextPage}
                  style={{ ...styles.mobilePageNavBtn, background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', borderColor: 'rgba(16, 185, 129, 0.4)' }}
                  type="button"
                >
                  <span>{NAV_PAGES[currentPageIndex + 1].shortTitle}</span>
                  <ChevronRight size={15} />
                </button>
              ) : (
                <button
                  onClick={() => handleSelectPage('home')}
                  style={styles.mobilePageNavBtn}
                  type="button"
                >
                  <span>Accueil</span>
                  <ArrowRight size={15} />
                </button>
              )}
            </div>
          </div>

          {/* Footer Mobile Compact */}
          <footer style={styles.mobileCompactFooter}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Globe2 size={15} color="#10b981" />
              <strong style={{ fontSize: '13px', color: '#ffffff', fontFamily: 'var(--font-heading)' }}>BizGames</strong>
              <span style={{ fontSize: '10px', color: '#10b981', fontWeight: '800' }}>100% GRATUIT</span>
            </div>
            <p style={{ fontSize: '11px', color: '#64748b', margin: '2px 0 6px' }}>
              Géographie Business Mondiale • 5 minutes par jour
            </p>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
              <button onClick={() => handleSelectPage('rules')} style={styles.footerLinkBtn}>Règles</button>
              <span style={{ color: '#334155' }}>•</span>
              <button onClick={() => handleSelectPage('sectors')} style={styles.footerLinkBtn}>13 Secteurs</button>
              <span style={{ color: '#334155' }}>•</span>
              <button onClick={() => handleSelectPage('scoring')} style={styles.footerLinkBtn}>Scoring</button>
              <span style={{ color: '#334155' }}>•</span>
              <button onClick={() => handleSelectPage('challenge')} style={styles.footerLinkBtn}>Challenge 30J</button>
              <span style={{ color: '#334155' }}>•</span>
              <button onClick={() => {
                if (onOpenLeaderboard) onOpenLeaderboard();
                else if (onOpenPlayerHub) onOpenPlayerHub('leaderboard');
              }} style={styles.footerLinkBtn}>Classement</button>
              <span style={{ color: '#334155' }}>•</span>
              <button onClick={() => setLegalTab('mentions')} style={styles.footerLinkBtn}>Mentions Légales</button>
              <span style={{ color: '#334155' }}>•</span>
              <button onClick={() => setLegalTab('about')} style={styles.footerLinkBtn}>Qui sommes-nous ?</button>
            </div>
            <span style={{ fontSize: '10px', color: '#475569', marginTop: '6px' }}>© 2026 BizGames. Tous droits réservés.</span>
          </footer>
        </>
      )}

      {/* Modal des pages génériques légales & à propos */}
      {legalTab && (
        <LegalModal
          initialTab={legalTab}
          onClose={() => setLegalTab(null)}
        />
      )}
    </div>
  );
}

const styles = {
  adminBanner: {
    background: 'linear-gradient(90deg, rgba(245, 158, 11, 0.18), rgba(217, 119, 6, 0.12))',
    borderBottom: '1px solid rgba(245, 158, 11, 0.4)',
    padding: '8px 20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '12px',
    flexWrap: 'wrap',
    zIndex: 1100,
    position: 'relative',
  },
  adminBannerBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    background: '#f59e0b',
    color: '#03120e',
    fontWeight: '700',
    fontSize: '12px',
    padding: '5px 12px',
    borderRadius: '6px',
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  headerCtaAdmin: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
    color: '#03120e',
    fontWeight: '800',
    fontSize: '13px',
    padding: '8px 14px',
    borderRadius: '8px',
    border: '1px solid rgba(251, 191, 36, 0.6)',
    boxShadow: '0 2px 10px rgba(245, 158, 11, 0.35)',
    cursor: 'pointer',
    transition: 'all 0.18s ease',
  },
  landingContainer: {
    width: '100%',
    minHeight: '100dvh',
    background: 'var(--bg-primary, #15132a)',
    color: '#ffffff',
    overflowY: 'auto',
    overflowX: 'hidden',
    position: 'relative',
    fontFamily: 'var(--font-body)',
  },
  header: {
    position: 'sticky',
    top: 0,
    zIndex: 1000,
    background: 'rgba(21, 19, 42, 0.94)',
    backdropFilter: 'blur(16px)',
    borderBottom: '1px solid #352d62',
    paddingTop: 'var(--safe-top)',
  },
  headerInner: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '12px 18px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brand: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  logoBadge: {
    width: '34px',
    height: '34px',
    borderRadius: '10px',
    background: 'rgba(16, 185, 129, 0.15)',
    border: '1px solid rgba(16, 185, 129, 0.4)',
    boxShadow: '0 0 12px rgba(16, 185, 129, 0.25)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandName: {
    fontFamily: 'var(--font-heading)',
    fontSize: '18px',
    fontWeight: '800',
    color: '#ffffff',
    lineHeight: '1.1',
    display: 'block',
  },
  brandTag: {
    fontSize: '8px',
    fontWeight: '800',
    color: '#10b981',
    letterSpacing: '1px',
    display: 'block',
  },
  navLinks: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
  },
  navLink: {
    color: '#a7f3d0',
    textDecoration: 'none',
    fontSize: '13px',
    fontWeight: '600',
    transition: 'color 0.2s ease',
  },
  navLeaderboardBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    background: 'none',
    border: 'none',
    color: '#fbbf24',
    fontSize: '13px',
    fontWeight: '700',
    cursor: 'pointer',
    padding: '0',
  },
  headerActionGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  headerLeaderboardBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    background: 'rgba(245, 158, 11, 0.12)',
    border: '1px solid rgba(245, 158, 11, 0.35)',
    borderRadius: '12px',
    padding: '8px 12px',
    fontSize: '13px',
    fontWeight: '700',
    color: '#fbbf24',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  landingLoginBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    background: 'rgba(116, 64, 230, 0.2)',
    border: '1px solid #7440e6',
    borderRadius: '9999px',
    padding: '8px 16px',
    fontSize: '13px',
    fontWeight: '700',
    fontFamily: 'var(--font-heading)',
    color: '#ffffff',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  landingUserPill: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    background: 'var(--bg-card, #201b3f)',
    border: '1px solid var(--bg-card-border, #352d62)',
    borderRadius: '9999px',
    padding: '4px 12px 4px 8px',
    fontSize: '12px',
    fontWeight: '700',
    fontFamily: 'var(--font-heading)',
    color: '#ffffff',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  landingLogoutBtn: {
    background: 'rgba(225, 34, 57, 0.15)',
    border: '1px solid rgba(225, 34, 57, 0.4)',
    borderRadius: '9999px',
    padding: '7px 9px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#ff4d6d',
    transition: 'all 0.15s ease',
    flexShrink: 0,
  },
  landingSettingsBtn: {
    background: 'rgba(116, 64, 230, 0.15)',
    border: '1px solid rgba(116, 64, 230, 0.4)',
    borderRadius: '9999px',
    padding: '7px 9px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#b3a9db',
    transition: 'all 0.15s ease',
    flexShrink: 0,
  },
  landingAvatarMini: {
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    objectFit: 'cover',
  },
  landingAvatarInitial: {
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #ffbe1a, #ff6e14)',
    color: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '12px',
    fontWeight: '900',
    fontFamily: 'var(--font-heading)',
  },
  landingUserPseudo: {
    maxWidth: '100px',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  landingStreak: {
    display: 'flex',
    alignItems: 'center',
    gap: '2px',
    color: 'var(--geo-flame, #ff6e14)',
    fontSize: '11px',
    fontWeight: '800',
    marginLeft: '2px',
  },
  headerCta: {
    background: 'var(--geo-green, #68de18)',
    color: '#122803',
    border: 'none',
    borderRadius: '9999px',
    padding: '9px 18px',
    fontSize: '13px',
    fontWeight: '900',
    fontFamily: 'var(--font-heading)',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    boxShadow: '0 4px 0 var(--geo-green-shadow, #3fa509), 0 8px 18px rgba(104, 222, 24, 0.3)',
    transition: 'all 0.12s ease',
  },
  heroSection: {
    position: 'relative',
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '40px 18px 50px',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))',
    gap: '30px',
    alignItems: 'center',
  },
  heroGlow: {
    position: 'absolute',
    top: '5%',
    left: '10%',
    width: '420px',
    height: '420px',
    background: 'radial-gradient(circle, rgba(116, 64, 230, 0.22) 0%, rgba(225, 34, 57, 0.1) 50%, transparent 70%)',
    pointerEvents: 'none',
    filter: 'blur(55px)',
  },
  heroContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    zIndex: 2,
  },
  dailyBadge: {
    alignSelf: 'flex-start',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    background: 'rgba(116, 64, 230, 0.18)',
    border: '1px solid rgba(116, 64, 230, 0.45)',
    borderRadius: '30px',
    padding: '6px 14px',
    fontSize: '11px',
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: '0.6px',
    fontFamily: 'var(--font-heading)',
    textTransform: 'uppercase',
  },
  landingStreakCallout: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '12px',
    background: 'linear-gradient(135deg, rgba(255, 110, 20, 0.16) 0%, #201b3f 100%)',
    border: '1px solid rgba(255, 110, 20, 0.4)',
    borderRadius: '16px',
    padding: '12px 16px',
    cursor: 'pointer',
    maxWidth: '560px',
    boxShadow: '0 4px 18px rgba(0, 0, 0, 0.3)',
    transition: 'all 0.2s ease',
  },
  landingStreakCalloutLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '12px',
    flexWrap: 'wrap',
  },
  landingStreakCalloutBadge: {
    fontSize: '11px',
    fontWeight: '900',
    color: '#ffffff',
    background: 'linear-gradient(135deg, #ff6e14, #ffbe1a)',
    padding: '3px 8px',
    borderRadius: '8px',
    whiteSpace: 'nowrap',
    flexShrink: 0,
    fontFamily: 'var(--font-heading)',
  },

  invitedByHeroCard: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    background: 'linear-gradient(135deg, rgba(116, 64, 230, 0.25) 0%, #201b3f 100%)',
    border: '1.5px solid #7440e6',
    borderRadius: '18px',
    padding: '16px 20px',
    boxShadow: '0 12px 35px rgba(0, 0, 0, 0.5), 0 0 20px rgba(116, 64, 230, 0.25)',
    maxWidth: '640px',
    width: '100%',
  },
  invitedByHeaderRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  invitedByAvatarBox: {
    width: '38px',
    height: '38px',
    borderRadius: '10px',
    background: 'rgba(255, 190, 26, 0.15)',
    border: '1px solid rgba(255, 190, 26, 0.35)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  invitedByHeaderText: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    flex: 1,
  },
  invitedByBadgeRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  invitedByBadge: {
    fontSize: '10px',
    fontWeight: '800',
    color: '#ffbe1a',
    letterSpacing: '0.5px',
    fontFamily: 'var(--font-heading)',
  },
  invitedByBadgeFree: {
    fontSize: '9px',
    fontWeight: '800',
    color: 'var(--geo-green, #68de18)',
    background: 'rgba(104, 222, 24, 0.15)',
    padding: '1px 6px',
    borderRadius: '6px',
    border: '1px solid rgba(104, 222, 24, 0.3)',
    fontFamily: 'var(--font-heading)',
  },
  invitedByTitle: {
    fontSize: '15px',
    fontWeight: '800',
    color: '#ffffff',
    fontFamily: 'var(--font-heading)',
    margin: 0,
  },
  invitedByQuote: {
    fontSize: '12px',
    color: 'var(--text-muted, #b3a9db)',
    margin: 0,
    fontStyle: 'italic',
    lineHeight: '1.4',
    borderLeft: '2px solid #7440e6',
    paddingLeft: '10px',
  },
  invitedByActionRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flexWrap: 'wrap',
    marginTop: '4px',
  },
  invitedByAcceptBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 18px',
    background: 'var(--geo-green, #68de18)',
    color: '#122803',
    fontWeight: '900',
    fontFamily: 'var(--font-heading)',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    fontSize: '13px',
    borderRadius: '9999px',
    border: 'none',
    cursor: 'pointer',
    boxShadow: '0 4px 0 var(--geo-green-shadow, #3fa509), 0 8px 18px rgba(104, 222, 24, 0.3)',
    whiteSpace: 'nowrap',
    transition: 'all 0.12s ease',
  },
  invitedByMetaText: {
    fontSize: '11px',
    color: 'var(--text-dim, #7a71a3)',
  },
  dailyDot: {
    width: '7px',
    height: '7px',
    borderRadius: '50%',
    backgroundColor: 'var(--geo-green, #68de18)',
    boxShadow: '0 0 10px #78ed27',
  },
  heroTitle: {
    fontFamily: 'var(--font-heading)',
    fontSize: 'clamp(30px, 6vw, 52px)',
    fontWeight: '900',
    lineHeight: '1.12',
    letterSpacing: '-0.5px',
    color: '#ffffff',
  },
  goldGradient: {
    background: 'linear-gradient(135deg, #ffbe1a 0%, #ff6e14 50%, #68de18 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  heroDescription: {
    fontSize: '15px',
    lineHeight: '1.55',
    color: 'var(--text-muted, #b3a9db)',
    maxWidth: '520px',
    fontFamily: 'var(--font-body)',
  },
  ctaGroup: {
    display: 'flex',
    gap: '12px',
    marginTop: '6px',
  },
  primaryCta: {
    background: 'var(--geo-green, #68de18)',
    color: '#122803',
    border: 'none',
    borderRadius: '9999px',
    padding: '16px 30px',
    fontSize: '16px',
    fontWeight: '900',
    fontFamily: 'var(--font-heading)',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    boxShadow: '0 5px 0 var(--geo-green-shadow, #3fa509), 0 12px 25px rgba(104, 222, 24, 0.35)',
    width: '100%',
    maxWidth: '420px',
    transition: 'all 0.12s ease',
  },
  secondaryCta: {
    background: 'linear-gradient(135deg, #7440e6 0%, #6028d9 100%)',
    color: '#ffffff',
    border: '1px solid rgba(255, 255, 255, 0.15)',
    borderRadius: '9999px',
    padding: '14px 26px',
    fontSize: '14px',
    fontWeight: '800',
    fontFamily: 'var(--font-heading)',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    boxShadow: '0 4px 0 var(--geo-purple-shadow, #4d23a8), 0 8px 18px rgba(116, 64, 230, 0.35)',
    transition: 'all 0.12s ease',
  },
  reassuranceRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    flexWrap: 'wrap',
    marginTop: '6px',
  },
  reassuranceItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    fontSize: '12px',
    color: '#a7f3d0',
  },
  mockupContainer: {
    zIndex: 2,
    cursor: 'pointer',
  },
  globeShowcaseCard: {
    background: 'var(--bg-card, #201b3f)',
    border: '1px solid var(--bg-card-border, #352d62)',
    borderRadius: '22px',
    padding: '16px',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.7), 0 0 35px rgba(116, 64, 230, 0.2)',
    backdropFilter: 'blur(16px)',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    cursor: 'pointer',
    transition: 'transform 0.2s ease, border-color 0.2s ease',
    overflow: 'hidden',
  },
  globeShowcaseTopBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  globeLiveIndicator: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '7px',
    background: 'rgba(104, 222, 24, 0.15)',
    border: '1px solid rgba(104, 222, 24, 0.35)',
    padding: '4px 10px',
    borderRadius: '16px',
    color: 'var(--geo-green, #68de18)',
    fontSize: '11px',
    fontWeight: '800',
    fontFamily: 'var(--font-heading)',
    letterSpacing: '0.4px',
  },
  livePulseDot: {
    width: '7px',
    height: '7px',
    borderRadius: '50%',
    backgroundColor: 'var(--geo-green, #68de18)',
    boxShadow: '0 0 8px #68de18',
    display: 'inline-block',
  },
  globeFreeBadge: {
    color: '#ffbe1a',
    fontWeight: '800',
    fontSize: '11px',
    fontFamily: 'var(--font-heading)',
    background: 'rgba(255, 190, 26, 0.15)',
    border: '1px solid rgba(255, 190, 26, 0.3)',
    padding: '4px 10px',
    borderRadius: '16px',
  },
  globeImageWrapper: {
    position: 'relative',
    width: '100%',
    borderRadius: '16px',
    overflow: 'hidden',
    border: '1px solid var(--bg-card-border, #352d62)',
    aspectRatio: '16 / 9',
  },
  globePreviewImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    display: 'block',
    transition: 'transform 0.4s ease',
  },
  globeImageVignette: {
    position: 'absolute',
    inset: 0,
    background: 'radial-gradient(ellipse at center, transparent 40%, rgba(21, 19, 42, 0.6) 100%)',
    pointerEvents: 'none',
  },
  hologramPin1: {
    position: 'absolute',
    top: '20%',
    left: '8%',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px',
    background: 'rgba(21, 19, 42, 0.88)',
    border: '1px solid rgba(104, 222, 24, 0.4)',
    color: '#ffffff',
    fontSize: '10px',
    fontWeight: '700',
    fontFamily: 'var(--font-heading)',
    padding: '3px 8px',
    borderRadius: '8px',
    backdropFilter: 'blur(6px)',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)',
  },
  hologramDotGreen: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    backgroundColor: 'var(--geo-green, #68de18)',
    boxShadow: '0 0 6px #68de18',
  },
  hologramPin2: {
    position: 'absolute',
    top: '18%',
    right: '25%',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px',
    background: 'rgba(21, 19, 42, 0.88)',
    border: '1px solid rgba(255, 190, 26, 0.4)',
    color: '#ffffff',
    fontSize: '10px',
    fontWeight: '700',
    fontFamily: 'var(--font-heading)',
    padding: '3px 8px',
    borderRadius: '8px',
    backdropFilter: 'blur(6px)',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)',
  },
  hologramDotAmber: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    backgroundColor: '#ffbe1a',
    boxShadow: '0 0 6px #ffbe1a',
  },
  hologramPin3: {
    position: 'absolute',
    bottom: '22%',
    left: '14%',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px',
    background: 'rgba(21, 19, 42, 0.88)',
    border: '1px solid rgba(0, 210, 255, 0.4)',
    color: '#ffffff',
    fontSize: '10px',
    fontWeight: '700',
    fontFamily: 'var(--font-heading)',
    padding: '3px 8px',
    borderRadius: '8px',
    backdropFilter: 'blur(6px)',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)',
  },
  hologramDotBlue: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    backgroundColor: '#00d2ff',
    boxShadow: '0 0 6px #00d2ff',
  },
  globePlayCenterBtn: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    background: 'rgba(21, 19, 42, 0.25)',
    transition: 'background 0.2s ease',
  },
  globePlayIconWrap: {
    width: '54px',
    height: '54px',
    borderRadius: '50%',
    background: 'var(--geo-green, #68de18)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 0 25px rgba(104, 222, 24, 0.6), 0 4px 12px rgba(0, 0, 0, 0.4)',
    border: '2px solid rgba(255, 255, 255, 0.8)',
    transition: 'transform 0.2s ease',
  },
  globePlayBtnLabel: {
    fontSize: '11px',
    fontWeight: '800',
    fontFamily: 'var(--font-heading)',
    color: '#ffffff',
    background: 'rgba(21, 19, 42, 0.88)',
    padding: '4px 12px',
    borderRadius: '12px',
    border: '1px solid rgba(255, 255, 255, 0.15)',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.5)',
  },
  globeShowcaseBottomBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '12px',
    padding: '10px 14px',
    background: 'rgba(0, 0, 0, 0.35)',
    border: '1px solid var(--bg-card-border, #352d62)',
    borderRadius: '14px',
  },
  globeQuestionTeaser: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    flex: 1,
  },
  globeTeaserLabel: {
    fontSize: '10px',
    fontWeight: '800',
    color: 'var(--geo-green, #68de18)',
    letterSpacing: '0.5px',
    fontFamily: 'var(--font-heading)',
  },
  globeTeaserText: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#ffffff',
    margin: 0,
    lineHeight: '1.3',
  },
  globeActionPlayBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 16px',
    background: 'var(--geo-green, #68de18)',
    color: '#122803',
    fontWeight: '900',
    fontFamily: 'var(--font-heading)',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    fontSize: '12px',
    borderRadius: '9999px',
    border: 'none',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    boxShadow: '0 3px 0 var(--geo-green-shadow, #3fa509), 0 6px 14px rgba(104, 222, 24, 0.3)',
  },
  section: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '50px 18px',
  },
  sectionAlt: {
    background: 'rgba(26, 22, 56, 0.55)',
    borderTop: '1px solid #352d62',
    borderBottom: '1px solid #352d62',
    padding: '50px 18px',
  },
  sectionHeader: {
    textAlign: 'center',
    maxWidth: '700px',
    margin: '0 auto 35px',
  },
  sectionPill: {
    display: 'inline-block',
    fontSize: '10px',
    fontWeight: '800',
    color: '#b3a9db',
    letterSpacing: '1.5px',
    textTransform: 'uppercase',
    marginBottom: '10px',
    background: 'rgba(116, 64, 230, 0.18)',
    border: '1px solid rgba(116, 64, 230, 0.45)',
    borderRadius: '20px',
    padding: '5px 14px',
    fontFamily: 'var(--font-heading)',
  },
  sectionTitle: {
    fontFamily: 'var(--font-heading)',
    fontSize: 'clamp(24px, 5vw, 34px)',
    fontWeight: '900',
    color: '#ffffff',
    marginBottom: '8px',
    letterSpacing: '-0.5px',
  },
  sectionSubtitle: {
    fontSize: '14px',
    color: 'var(--text-muted, #b3a9db)',
    lineHeight: '1.5',
    fontFamily: 'var(--font-body)',
  },
  stepsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
    gap: '18px',
  },
  stepCard: {
    background: 'var(--bg-card, #201b3f)',
    border: '1px solid var(--bg-card-border, #352d62)',
    borderRadius: '18px',
    padding: '24px',
    position: 'relative',
    backdropFilter: 'blur(10px)',
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.35)',
  },
  stepIconBox: {
    width: '46px',
    height: '46px',
    borderRadius: '12px',
    background: 'rgba(116, 64, 230, 0.15)',
    border: '1px solid rgba(116, 64, 230, 0.35)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '16px',
  },
  stepNumber: {
    position: 'absolute',
    top: '20px',
    right: '20px',
    fontSize: '24px',
    fontWeight: '900',
    fontFamily: 'var(--font-logo)',
    color: 'var(--geo-green, #68de18)',
    opacity: 0.8,
  },
  stepTitle: {
    fontFamily: 'var(--font-heading)',
    fontSize: '17px',
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: '8px',
  },
  stepText: {
    fontSize: '13px',
    color: 'var(--text-muted, #b3a9db)',
    lineHeight: '1.5',
    fontFamily: 'var(--font-body)',
  },
  sectorsGrid: {
    maxWidth: '1200px',
    margin: '0 auto',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: '16px',
  },
  sectorCard: {
    background: 'var(--bg-card, #201b3f)',
    border: '1px solid var(--bg-card-border, #352d62)',
    borderRadius: '16px',
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    backdropFilter: 'blur(8px)',
    boxShadow: '0 6px 20px rgba(0, 0, 0, 0.35)',
  },
  sectorTitle: {
    fontFamily: 'var(--font-heading)',
    fontSize: '15px',
    fontWeight: '800',
    color: '#ffffff',
  },
  sectorExamples: {
    fontSize: '12px',
    color: 'var(--text-muted, #b3a9db)',
    lineHeight: '1.45',
    fontFamily: 'var(--font-body)',
  },
  scoringRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    gap: '20px',
  },
  scoreRuleBox: {
    background: 'var(--bg-card, #201b3f)',
    border: '1px solid var(--bg-card-border, #352d62)',
    borderRadius: '20px',
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    backdropFilter: 'blur(10px)',
    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.35)',
  },
  scoringBoxHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '2px',
  },
  scoringBoxDesc: {
    fontSize: '13px',
    color: 'var(--text-muted, #b3a9db)',
    lineHeight: '1.45',
    margin: '0 0 6px 0',
    fontFamily: 'var(--font-body)',
  },
  scoreRuleItem: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '10px 0',
    borderBottom: '1px solid rgba(116, 64, 230, 0.15)',
    fontSize: '13px',
  },
  scoreRuleRange: {
    fontWeight: '700',
    color: '#ffffff',
  },
  scoreRulePoints: {
    color: '#ffd43f',
    fontWeight: '800',
    fontFamily: 'var(--font-heading)',
  },
  scoringFootnote: {
    marginTop: '8px',
    padding: '12px 14px',
    background: 'rgba(104, 222, 24, 0.08)',
    border: '1px solid rgba(104, 222, 24, 0.25)',
    borderRadius: '12px',
    fontSize: '12px',
    color: '#9ef058',
    lineHeight: '1.45',
  },
  ranksBox: {
    background: 'var(--bg-card, #201b3f)',
    border: '1px solid var(--bg-card-border, #352d62)',
    borderRadius: '20px',
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    backdropFilter: 'blur(10px)',
    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.35)',
  },
  ranksTitle: {
    fontSize: '16px',
    fontWeight: '800',
    color: '#ffffff',
    margin: 0,
    fontFamily: 'var(--font-heading)',
  },
  rankItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '8px 0',
    borderBottom: '1px solid rgba(116, 64, 230, 0.15)',
  },
  rankIcon: {
    fontSize: '20px',
    flexShrink: 0,
  },
  rankDetails: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  rankName: {
    fontWeight: '800',
    color: '#ffffff',
    fontSize: '13px',
    fontFamily: 'var(--font-heading)',
  },
  rankBadgePoints: {
    fontSize: '11px',
    color: 'var(--text-muted, #b3a9db)',
    fontWeight: '600',
  },
  advancedMetricsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '16px',
    marginTop: '24px',
  },
  advancedMetricCard: {
    background: 'var(--bg-card, #201b3f)',
    border: '1px solid var(--bg-card-border, #352d62)',
    borderRadius: '18px',
    padding: '20px',
    display: 'flex',
    gap: '14px',
    backdropFilter: 'blur(8px)',
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)',
  },
  metricCardIconWrap: {
    width: '44px',
    height: '44px',
    borderRadius: '14px',
    background: 'rgba(116, 64, 230, 0.2)',
    border: '1px solid rgba(116, 64, 230, 0.4)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  metricCardBody: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  metricCardTag: {
    fontSize: '10px',
    fontWeight: '800',
    color: 'var(--geo-green, #68de18)',
    letterSpacing: '0.8px',
    textTransform: 'uppercase',
  },
  metricCardTitle: {
    fontFamily: 'var(--font-heading)',
    fontSize: '14px',
    fontWeight: '800',
    color: '#ffffff',
    margin: 0,
  },
  metricCardText: {
    fontSize: '12px',
    color: 'var(--text-muted, #b3a9db)',
    lineHeight: '1.45',
    margin: 0,
    fontFamily: 'var(--font-body)',
  },
  finalCtaSection: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 18px 50px',
  },
  finalCtaCard: {
    background: 'linear-gradient(135deg, rgba(116, 64, 230, 0.28) 0%, rgba(32, 27, 63, 0.95) 100%)',
    border: '1.5px solid var(--bg-card-border, #352d62)',
    borderRadius: '24px',
    padding: '40px 24px',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '16px',
    boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6), 0 0 35px rgba(116, 64, 230, 0.2)',
  },
  finalCtaTitle: {
    fontFamily: 'var(--font-heading)',
    fontSize: 'clamp(24px, 5vw, 32px)',
    fontWeight: '900',
    color: '#ffffff',
  },
  finalCtaText: {
    fontSize: '15px',
    color: 'var(--text-muted, #b3a9db)',
    maxWidth: '520px',
    fontFamily: 'var(--font-body)',
  },
  finalCtaButton: {
    background: 'var(--geo-green, #68de18)',
    color: '#122803',
    border: 'none',
    borderRadius: '9999px',
    padding: '15px 32px',
    fontSize: '16px',
    fontWeight: '900',
    fontFamily: 'var(--font-heading)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    boxShadow: '0 5px 0 var(--geo-green-shadow, #3fa509), 0 10px 24px rgba(104, 222, 24, 0.35)',
  },
  finalCtaButtonDone: {
    background: 'var(--geo-purple, #7440e6)',
    color: '#ffffff',
    border: 'none',
    borderRadius: '9999px',
    padding: '15px 32px',
    fontSize: '16px',
    fontWeight: '900',
    fontFamily: 'var(--font-heading)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    boxShadow: '0 5px 0 #4f25a8, 0 10px 24px rgba(116, 64, 230, 0.35)',
  },
  headerCtaDone: {
    background: 'rgba(116, 64, 230, 0.2)',
    color: '#c4b5fd',
    border: '1px solid rgba(116, 64, 230, 0.45)',
    borderRadius: '9999px',
    padding: '8px 16px',
    fontSize: '12px',
    fontWeight: '800',
    fontFamily: 'var(--font-heading)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '7px',
    transition: 'all 0.2s ease',
  },
  alreadyPlayedHeroCard: {
    background: 'var(--bg-card, #201b3f)',
    border: '1.5px solid var(--bg-card-border, #352d62)',
    borderRadius: '20px',
    padding: '22px',
    backdropFilter: 'blur(12px)',
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
    maxWidth: '540px',
    boxShadow: '0 12px 36px rgba(0, 0, 0, 0.45)',
  },
  alreadyPlayedStatusBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    background: 'rgba(104, 222, 24, 0.15)',
    color: '#68de18',
    border: '1px solid rgba(104, 222, 24, 0.35)',
    borderRadius: '20px',
    padding: '5px 12px',
    fontSize: '11px',
    fontWeight: '800',
    letterSpacing: '0.5px',
    width: 'fit-content',
  },
  alreadyPlayedScoreRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    flexWrap: 'wrap',
  },
  alreadyPlayedScoreVal: {
    fontSize: '28px',
    fontWeight: '900',
    color: '#ffd43f',
    fontFamily: 'var(--font-logo)',
  },
  alreadyPlayedEmoji: {
    fontSize: '18px',
    letterSpacing: '2px',
  },
  alreadyPlayedTime: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px',
    fontSize: '13px',
    color: 'var(--text-muted, #b3a9db)',
    fontWeight: '600',
  },
  alreadyPlayedNote: {
    fontSize: '13px',
    color: 'var(--text-muted, #b3a9db)',
    lineHeight: '1.5',
    margin: 0,
    fontFamily: 'var(--font-body)',
  },
  alreadyPlayedBtnRow: {
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap',
  },
  viewPastQuestionsBtn: {
    background: 'var(--geo-purple, #7440e6)',
    color: '#ffffff',
    border: 'none',
    borderRadius: '9999px',
    padding: '11px 20px',
    fontSize: '13px',
    fontWeight: '800',
    fontFamily: 'var(--font-heading)',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    boxShadow: '0 4px 0 #4f25a8, 0 6px 16px rgba(116, 64, 230, 0.3)',
  },
  recapCard: {
    background: 'var(--bg-card, #201b3f)',
    border: '1px solid var(--bg-card-border, #352d62)',
    borderRadius: '20px',
    padding: '20px',
    backdropFilter: 'blur(16px)',
    boxShadow: '0 20px 45px rgba(0, 0, 0, 0.6), 0 0 25px rgba(116, 64, 230, 0.15)',
    width: '100%',
    maxWidth: '520px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  recapHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    paddingBottom: '10px',
    borderBottom: '1px solid var(--bg-card-border, #352d62)',
  },
  recapTitle: {
    fontSize: '15px',
    fontWeight: '800',
    color: '#f8fafc',
    fontFamily: 'var(--font-heading)',
  },
  recapQuestionList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    maxHeight: '380px',
    overflowY: 'auto',
  },
  recapQuestionItem: {
    background: 'rgba(14, 12, 28, 0.6)',
    border: '1px solid var(--bg-card-border, #352d62)',
    borderRadius: '12px',
    overflow: 'hidden',
  },
  recapQuestionBtn: {
    width: '100%',
    background: 'none',
    border: 'none',
    padding: '10px 12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '10px',
    cursor: 'pointer',
    textAlign: 'left',
  },
  recapQLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    flex: 1,
    minWidth: 0,
  },
  recapQNum: {
    width: '24px',
    height: '24px',
    borderRadius: '6px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '11px',
    fontWeight: '800',
    color: '#122803',
    background: 'var(--geo-green, #68de18)',
    flexShrink: 0,
  },
  recapQText: {
    fontSize: '12px',
    color: '#f1f5f9',
    fontWeight: '600',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    fontFamily: 'var(--font-body)',
  },
  recapQRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flexShrink: 0,
  },
  recapQScore: {
    fontSize: '12px',
    fontWeight: '800',
    color: 'var(--geo-green, #68de18)',
  },
  recapExpanded: {
    padding: '0 12px 12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    borderTop: '1px solid rgba(255, 255, 255, 0.05)',
    paddingTop: '8px',
  },
  recapExpandedLieu: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '12px',
    color: '#f8fafc',
  },
  recapExpandedExplication: {
    fontSize: '11px',
    color: 'var(--text-muted, #b3a9db)',
    lineHeight: '1.45',
    margin: 0,
    background: 'rgba(14, 12, 28, 0.5)',
    padding: '8px 10px',
    borderRadius: '8px',
    borderLeft: '2px solid var(--geo-green, #68de18)',
  },
  recapExpandedDist: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '11px',
    color: 'var(--text-muted, #b3a9db)',
  },
  footer: {
    background: '#0e0c1c',
    borderTop: '1px solid var(--bg-card-border, #352d62)',
    padding: '40px 18px 20px',
    paddingBottom: 'calc(var(--safe-bottom) + 20px)',
  },
  footerInner: {
    maxWidth: '1200px',
    margin: '0 auto',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '24px',
    marginBottom: '24px',
  },
  footerColMain: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  footerCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  footerHeading: {
    fontSize: '11px',
    fontWeight: '800',
    color: '#ffd43f',
    letterSpacing: '1px',
    textTransform: 'uppercase',
    fontFamily: 'var(--font-heading)',
  },
  footerText: {
    fontSize: '12px',
    color: 'var(--text-muted, #b3a9db)',
    lineHeight: '1.5',
    fontFamily: 'var(--font-body)',
  },
  footerLink: {
    color: 'var(--text-muted, #b3a9db)',
    textDecoration: 'none',
    fontSize: '12px',
  },
  footerLinkBtn: {
    background: 'none',
    border: 'none',
    padding: 0,
    color: 'var(--text-muted, #b3a9db)',
    fontSize: '12px',
    textAlign: 'left',
    cursor: 'pointer',
  },
  footerTechTag: {
    fontSize: '11px',
    color: '#655d8a',
  },
  footerBottom: {
    maxWidth: '1200px',
    margin: '0 auto',
    paddingTop: '16px',
    borderTop: '1px solid rgba(255, 255, 255, 0.05)',
    textAlign: 'center',
    fontSize: '11px',
    color: '#655d8a',
  },

  /* ── STATS BAR ── */
  statsBar: {
    background: 'rgba(21, 18, 41, 0.85)',
    borderTop: '1px solid var(--bg-card-border, #352d62)',
    borderBottom: '1px solid var(--bg-card-border, #352d62)',
    padding: '24px 18px',
  },
  statsBarInner: {
    maxWidth: '900px',
    margin: '0 auto',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0',
    flexWrap: 'wrap',
  },
  statItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px',
    padding: '0 30px',
  },
  statValue: {
    fontFamily: 'var(--font-logo)',
    fontSize: 'clamp(24px, 5vw, 34px)',
    fontWeight: '900',
    color: '#ffd43f',
    lineHeight: '1',
  },
  statLabel: {
    fontSize: '11px',
    color: 'var(--text-muted, #b3a9db)',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '0.6px',
    fontFamily: 'var(--font-heading)',
  },
  statDivider: {
    width: '1px',
    height: '40px',
    background: 'rgba(116, 64, 230, 0.3)',
  },

  /* ── ACCOUNT REQUIRED NOTE ── */
  accountRequiredNote: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '7px',
    background: 'rgba(116, 64, 230, 0.12)',
    border: '1px solid rgba(116, 64, 230, 0.3)',
    borderRadius: '12px',
    padding: '7px 14px',
    fontSize: '12px',
    color: '#c4b5fd',
    alignSelf: 'flex-start',
  },

  /* ── SOCIAL SECTION ── */
  socialGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '20px',
    maxWidth: '1200px',
    margin: '0 auto 30px',
  },
  socialCard: {
    background: 'var(--bg-card, #201b3f)',
    border: '1px solid var(--bg-card-border, #352d62)',
    borderRadius: '20px',
    padding: '26px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    backdropFilter: 'blur(12px)',
    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
  },
  socialIconBox: {
    width: '52px',
    height: '52px',
    borderRadius: '16px',
    background: 'rgba(116, 64, 230, 0.18)',
    border: '1px solid rgba(116, 64, 230, 0.4)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  socialCardTitle: {
    fontFamily: 'var(--font-heading)',
    fontSize: '18px',
    fontWeight: '800',
    color: '#ffffff',
  },
  socialCardText: {
    fontSize: '13px',
    color: 'var(--text-muted, #b3a9db)',
    lineHeight: '1.5',
    fontFamily: 'var(--font-body)',
  },
  socialTagRow: {
    display: 'flex',
    gap: '6px',
    flexWrap: 'wrap',
    marginTop: '4px',
  },
  socialTag: {
    background: 'rgba(116, 64, 230, 0.15)',
    border: '1px solid rgba(116, 64, 230, 0.35)',
    borderRadius: '20px',
    padding: '4px 12px',
    fontSize: '11px',
    fontWeight: '700',
    color: '#c4b5fd',
  },
  socialExampleBox: {
    background: 'rgba(255, 212, 63, 0.08)',
    border: '1px solid rgba(255, 212, 63, 0.25)',
    borderRadius: '12px',
    padding: '14px',
    marginTop: '4px',
  },
  socialExampleTitle: {
    fontSize: '10px',
    fontWeight: '800',
    color: '#ffd43f',
    letterSpacing: '1px',
    marginBottom: '6px',
    fontFamily: 'var(--font-heading)',
  },
  socialExampleContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '3px',
    fontSize: '13px',
    fontWeight: '700',
    color: '#f8fafc',
    fontFamily: 'var(--font-heading)',
  },
  sharePreview: {
    background: 'rgba(104, 222, 24, 0.08)',
    border: '1px solid rgba(104, 222, 24, 0.25)',
    borderRadius: '12px',
    padding: '14px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    marginTop: '4px',
  },
  sharePreviewTitle: {
    fontSize: '11px',
    color: 'var(--text-muted, #b3a9db)',
    fontWeight: '600',
  },
  shareEmojis: {
    fontSize: '22px',
    letterSpacing: '4px',
  },
  shareScore: {
    fontSize: '13px',
    color: 'var(--geo-green, #68de18)',
    fontWeight: '800',
    fontFamily: 'var(--font-heading)',
  },

  /* ── RETENTION / PROGRESSION ── */
  retentionGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: '18px',
    marginBottom: '36px',
  },
  retentionCard: {
    background: 'var(--bg-card, #201b3f)',
    border: '1px solid var(--bg-card-border, #352d62)',
    borderRadius: '18px',
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    backdropFilter: 'blur(10px)',
    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
  },
  retentionTitle: {
    fontFamily: 'var(--font-heading)',
    fontSize: '16px',
    fontWeight: '800',
    color: '#ffffff',
  },
  retentionText: {
    fontSize: '13px',
    color: 'var(--text-muted, #b3a9db)',
    lineHeight: '1.5',
    fontFamily: 'var(--font-body)',
  },
  flowRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: '8px',
    padding: '20px',
    background: 'rgba(14, 12, 28, 0.7)',
    borderRadius: '16px',
    border: '1px solid var(--bg-card-border, #352d62)',
  },
  flowStep: {
    background: 'rgba(116, 64, 230, 0.15)',
    border: '1px solid rgba(116, 64, 230, 0.35)',
    borderRadius: '10px',
    padding: '8px 16px',
  },
  flowStepText: {
    fontSize: '12px',
    fontWeight: '800',
    color: '#e2d9fc',
    fontFamily: 'var(--font-heading)',
  },

  /* ── FINAL CTA BADGE ── */
  finalCtaBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    background: 'rgba(104, 222, 24, 0.12)',
    border: '1px solid rgba(104, 222, 24, 0.35)',
    borderRadius: '30px',
    padding: '6px 14px',
    fontSize: '12px',
    fontWeight: '800',
    color: 'var(--geo-green, #68de18)',
    fontFamily: 'var(--font-heading)',
  },

  /* ── MENU HAMBURGER & NAVIGATION DÉROULANTE MOBILE ── */
  mobileHamburgerBtn: {
    width: '38px',
    height: '38px',
    borderRadius: '10px',
    background: 'rgba(255, 255, 255, 0.06)',
    border: '1px solid rgba(255, 255, 255, 0.16)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    color: '#f8fafc',
    padding: 0,
    flexShrink: 0,
    transition: 'all 0.18s ease',
  },
  mobileDropdownBackdrop: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.7)',
    backdropFilter: 'blur(6px)',
    zIndex: 1040,
  },
  mobileMenuDropdownCard: {
    position: 'fixed',
    top: 'calc(var(--safe-top, 0px) + 58px)',
    left: '12px',
    right: '12px',
    maxWidth: '430px',
    margin: '0 auto',
    background: 'linear-gradient(180deg, rgba(32, 27, 63, 0.98) 0%, rgba(18, 15, 38, 0.99) 100%)',
    border: '1.5px solid var(--bg-card-border, #352d62)',
    borderRadius: '20px',
    boxShadow: '0 20px 50px rgba(0, 0, 0, 0.9), 0 0 30px rgba(116, 64, 230, 0.25)',
    zIndex: 1050,
    padding: '14px',
    maxHeight: 'calc(100dvh - 80px)',
    overflowY: 'auto',
  },
  mobileMenuHead: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: '10px',
    borderBottom: '1px solid var(--bg-card-border, #352d62)',
    marginBottom: '8px',
  },
  mobileMenuHeadBrand: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  mobileMenuBadgeB: {
    width: '28px',
    height: '28px',
    borderRadius: '8px',
    background: 'var(--geo-purple, #7440e6)',
    border: '1px solid #8e62f0',
    color: '#ffffff',
    fontFamily: 'var(--font-logo)',
    fontSize: '16px',
    fontWeight: '900',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    lineHeight: 1,
  },
  mobileMenuHeadTitle: {
    fontFamily: 'var(--font-heading)',
    fontSize: '14px',
    fontWeight: '800',
    color: '#ffffff',
    lineHeight: '1.2',
  },
  mobileMenuHeadSub: {
    fontSize: '10px',
    color: 'var(--geo-green, #68de18)',
    fontWeight: '700',
    fontFamily: 'var(--font-heading)',
  },
  mobileMenuCloseBtn: {
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    background: 'rgba(255, 255, 255, 0.06)',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    color: 'var(--text-muted, #b3a9db)',
  },
  mobileMenuItemsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  mobileDropdownItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '10px 14px',
    background: 'rgba(255, 255, 255, 0.04)',
    border: '1px solid var(--bg-card-border, #352d62)',
    borderRadius: '14px',
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'all 0.15s ease',
    width: '100%',
  },
  mobileDropdownItemActive: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '10px 14px',
    background: 'linear-gradient(135deg, rgba(116, 64, 230, 0.3) 0%, rgba(32, 27, 63, 0.9) 100%)',
    border: '1.5px solid var(--geo-purple, #7440e6)',
    borderRadius: '14px',
    cursor: 'pointer',
    textAlign: 'left',
    width: '100%',
    boxShadow: '0 0 14px rgba(116, 64, 230, 0.3)',
  },
  mobileDropdownItemContent: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    minWidth: 0,
    flex: 1,
  },
  mobileItemIcon: {
    width: '32px',
    height: '32px',
    borderRadius: '10px',
    background: 'rgba(255, 255, 255, 0.06)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  mobileItemIconActive: {
    width: '32px',
    height: '32px',
    borderRadius: '10px',
    background: 'rgba(116, 64, 230, 0.25)',
    border: '1px solid rgba(116, 64, 230, 0.45)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  mobileItemTextCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1px',
    minWidth: 0,
  },
  mobileItemTitleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  mobileItemTitle: {
    fontSize: '13px',
    fontWeight: '700',
    color: '#e2e8f0',
    fontFamily: 'var(--font-heading)',
  },
  mobileItemTitleActive: {
    fontSize: '13px',
    fontWeight: '800',
    color: '#ffffff',
    fontFamily: 'var(--font-heading)',
  },
  mobileItemBadge: {
    fontSize: '9px',
    fontWeight: '800',
    color: '#122803',
    background: 'var(--geo-green, #68de18)',
    borderRadius: '4px',
    padding: '1px 5px',
    letterSpacing: '0.4px',
    fontFamily: 'var(--font-heading)',
  },
  mobileItemDesc: {
    fontSize: '11px',
    color: 'var(--text-muted, #b3a9db)',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    fontFamily: 'var(--font-body)',
  },
  mobileItemNum: {
    fontSize: '11px',
    fontWeight: '800',
    color: '#655d8a',
  },
  mobileMenuQuickPlay: {
    marginTop: '10px',
    paddingTop: '10px',
    borderTop: '1px solid var(--bg-card-border, #352d62)',
  },
  mobileMenuPlayBtn: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    background: 'var(--geo-green, #68de18)',
    color: '#122803',
    fontWeight: '900',
    fontSize: '15px',
    fontFamily: 'var(--font-heading)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    padding: '13px',
    borderRadius: '9999px',
    border: 'none',
    boxShadow: '0 4px 0 var(--geo-green-shadow, #3fa509), 0 8px 18px rgba(104, 222, 24, 0.35)',
    cursor: 'pointer',
  },

  /* ── HERO MOBILE ÉPURÉ ── */
  mobileCleanHero: {
    padding: '24px 16px 40px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    maxWidth: '500px',
    margin: '0 auto',
  },
  mobileCleanHeroInner: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '14px',
  },
  mobileHeroBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    background: 'rgba(104, 222, 24, 0.15)',
    border: '1px solid rgba(104, 222, 24, 0.4)',
    borderRadius: '30px',
    padding: '5px 14px',
    fontSize: '11px',
    fontWeight: '800',
    color: 'var(--geo-green, #68de18)',
    letterSpacing: '0.6px',
    fontFamily: 'var(--font-heading)',
  },
  mobileHeroTitle: {
    fontFamily: 'var(--font-heading)',
    fontSize: 'clamp(32px, 8vw, 44px)',
    fontWeight: '900',
    color: '#ffffff',
    lineHeight: '1.08',
    letterSpacing: '-0.5px',
    margin: '4px 0 0',
  },
  mobileHeroSubtitle: {
    fontSize: '15px',
    fontWeight: '600',
    color: 'var(--text-muted, #b3a9db)',
    lineHeight: '1.4',
    maxWidth: '340px',
    margin: '0',
    fontFamily: 'var(--font-body)',
  },
  mobileHeroPillsRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    fontSize: '12px',
    color: '#c4b5fd',
    fontWeight: '700',
    flexWrap: 'wrap',
    fontFamily: 'var(--font-heading)',
  },
  mobileHeroPillItem: {
    color: 'var(--geo-green, #68de18)',
  },
  mobileHeroPillDot: {
    color: 'rgba(116, 64, 230, 0.5)',
  },
  mobileCleanActionArea: {
    width: '100%',
    maxWidth: '360px',
    marginTop: '6px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '10px',
  },
  mobileCleanBigPlayBtn: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    background: 'var(--geo-green, #68de18)',
    color: '#122803',
    fontWeight: '900',
    fontFamily: 'var(--font-heading)',
    fontSize: '16px',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    padding: '16px 24px',
    borderRadius: '9999px',
    border: 'none',
    boxShadow: '0 5px 0 var(--geo-green-shadow, #3fa509), 0 10px 24px rgba(104, 222, 24, 0.4)',
    cursor: 'pointer',
    transition: 'transform 0.15s ease',
  },
  mobileCleanSubnotice: {
    fontSize: '11px',
    color: 'var(--text-muted, #b3a9db)',
    fontWeight: '600',
  },
  mobileCleanPlayedCard: {
    width: '100%',
    maxWidth: '360px',
    background: 'var(--bg-card, #201b3f)',
    border: '1.5px solid var(--bg-card-border, #352d62)',
    borderRadius: '20px',
    padding: '18px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.4)',
  },
  mobileCleanPlayedStatus: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '12px',
    fontWeight: '800',
    color: 'var(--geo-green, #68de18)',
    fontFamily: 'var(--font-heading)',
  },
  mobileCleanScoreBig: {
    fontSize: '28px',
    fontWeight: '900',
    fontFamily: 'var(--font-logo)',
    color: '#ffd43f',
  },
  mobileCleanPlayedNotice: {
    fontSize: '12px',
    color: 'var(--text-muted, #b3a9db)',
    margin: 0,
    fontFamily: 'var(--font-body)',
  },
  mobileCleanViewAnswersBtn: {
    marginTop: '6px',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    background: 'var(--geo-purple, #7440e6)',
    border: 'none',
    borderRadius: '9999px',
    padding: '9px 18px',
    color: '#ffffff',
    fontSize: '12px',
    fontWeight: '800',
    fontFamily: 'var(--font-heading)',
    cursor: 'pointer',
    boxShadow: '0 3px 0 #4f25a8',
  },
  mobileCleanGlobeCard: {
    width: '100%',
    maxWidth: '380px',
    marginTop: '10px',
    borderRadius: '20px',
    overflow: 'hidden',
    border: '1.5px solid var(--bg-card-border, #352d62)',
    boxShadow: '0 12px 35px rgba(0, 0, 0, 0.6)',
  },
  mobileCleanQuickLinks: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    flexWrap: 'wrap',
    marginTop: '16px',
    width: '100%',
  },
  mobileCleanQuickLinkBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px',
    background: 'rgba(255, 255, 255, 0.06)',
    border: '1px solid var(--bg-card-border, #352d62)',
    borderRadius: '9999px',
    padding: '8px 14px',
    color: '#e2d9fc',
    fontSize: '12px',
    fontWeight: '700',
    fontFamily: 'var(--font-heading)',
    cursor: 'pointer',
  },
  mobilePageBottomNav: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    padding: '24px 16px',
    maxWidth: '600px',
    margin: '0 auto',
  },
  mobileNavStepRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '10px',
  },
  mobilePageNavBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '10px 16px',
    background: 'var(--bg-card, #201b3f)',
    border: '1px solid var(--bg-card-border, #352d62)',
    borderRadius: '9999px',
    color: '#e2d9fc',
    fontSize: '12px',
    fontWeight: '700',
    fontFamily: 'var(--font-heading)',
    cursor: 'pointer',
  },
  mobilePageNavBtnPrimary: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '14px 22px',
    background: 'var(--geo-green, #68de18)',
    border: 'none',
    borderRadius: '9999px',
    color: '#122803',
    fontSize: '14px',
    fontWeight: '900',
    fontFamily: 'var(--font-heading)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    cursor: 'pointer',
    boxShadow: '0 4px 0 var(--geo-green-shadow, #3fa509), 0 8px 20px rgba(104, 222, 24, 0.35)',
    width: '100%',
  },
  mobileCompactFooter: {
    padding: '24px 16px',
    paddingBottom: 'calc(var(--safe-bottom) + 24px)',
    textAlign: 'center',
    borderTop: '1px solid var(--bg-card-border, #352d62)',
    background: '#0e0c1c',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '6px',
  },

  /* ── SECTION CLASSEMENT DÉDIÉE MOBILE ── */
  leaderboardPreviewBox: {
    maxWidth: '680px',
    margin: '0 auto',
    background: 'var(--bg-card, #201b3f)',
    border: '1.5px solid var(--bg-card-border, #352d62)',
    borderRadius: '22px',
    padding: '24px 20px',
    boxShadow: '0 16px 40px rgba(0, 0, 0, 0.6), 0 0 25px rgba(116, 64, 230, 0.15)',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  leaderboardPodiumHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '10px',
    borderBottom: '1px solid var(--bg-card-border, #352d62)',
    paddingBottom: '14px',
  },
  leaderboardPodiumTitle: {
    fontSize: '16px',
    fontWeight: '800',
    fontFamily: 'var(--font-heading)',
    color: '#ffffff',
    margin: 0,
    flex: 1,
  },
  leaderboardPodiumBadge: {
    fontSize: '10px',
    fontWeight: '800',
    color: 'var(--geo-green, #68de18)',
    background: 'rgba(104, 222, 24, 0.12)',
    border: '1px solid rgba(104, 222, 24, 0.3)',
    borderRadius: '6px',
    padding: '3px 8px',
    fontFamily: 'var(--font-heading)',
  },
  leaderboardRanksList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  leaderboardRankItemGold: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 16px',
    background: 'linear-gradient(135deg, rgba(255, 212, 63, 0.18) 0%, rgba(32, 27, 63, 0.9) 100%)',
    border: '1.5px solid rgba(255, 212, 63, 0.45)',
    borderRadius: '16px',
  },
  leaderboardRankItemSilver: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 16px',
    background: 'linear-gradient(135deg, rgba(203, 213, 225, 0.12) 0%, rgba(32, 27, 63, 0.9) 100%)',
    border: '1.5px solid rgba(203, 213, 225, 0.35)',
    borderRadius: '16px',
  },
  leaderboardRankItemBronze: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 16px',
    background: 'linear-gradient(135deg, rgba(251, 146, 60, 0.15) 0%, rgba(32, 27, 63, 0.9) 100%)',
    border: '1.5px solid rgba(251, 146, 60, 0.4)',
    borderRadius: '16px',
  },
  leaderboardRankLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  leaderboardMedal: {
    fontSize: '22px',
    lineHeight: 1,
  },
  leaderboardRankScore: {
    fontSize: '12px',
    fontWeight: '900',
    color: '#ffd43f',
    background: 'rgba(255, 212, 63, 0.15)',
    padding: '4px 10px',
    borderRadius: '8px',
    border: '1px solid rgba(255, 212, 63, 0.35)',
    fontFamily: 'var(--font-heading)',
  },
  leaderboardRuleCard: {
    background: 'rgba(14, 12, 28, 0.65)',
    border: '1px solid var(--bg-card-border, #352d62)',
    borderRadius: '16px',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  leaderboardCriteriaList: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    fontSize: '12px',
    color: 'var(--text-muted, #b3a9db)',
    lineHeight: '1.45',
    fontFamily: 'var(--font-body)',
  },
  leaderboardActionRow: {
    marginTop: '4px',
  },
  leaderboardFullBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    width: '100%',
    padding: '14px 22px',
    background: 'var(--geo-purple, #7440e6)',
    border: 'none',
    borderRadius: '9999px',
    color: '#ffffff',
    fontSize: '14px',
    fontWeight: '900',
    fontFamily: 'var(--font-heading)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    cursor: 'pointer',
    boxShadow: '0 4px 0 #4f25a8, 0 8px 20px rgba(116, 64, 230, 0.35)',
    transition: 'all 0.2s ease',
  },

  // ─── STYLES SECTION CHALLENGE 30 JOURS ──────────────────────────────
  sectionChallenge: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '60px 18px',
    background: 'radial-gradient(circle at 50% 0%, rgba(116, 64, 230, 0.18) 0%, rgba(14, 12, 28, 0) 70%)',
    borderTop: '1px solid var(--bg-card-border, #352d62)',
    borderBottom: '1px solid var(--bg-card-border, #352d62)',
  },
  challengePill: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '11px',
    fontWeight: '800',
    color: '#f97316',
    letterSpacing: '1.5px',
    textTransform: 'uppercase',
    marginBottom: '12px',
    background: 'rgba(249, 115, 22, 0.12)',
    border: '1px solid rgba(249, 115, 22, 0.35)',
    borderRadius: '20px',
    padding: '5px 14px',
    fontFamily: 'var(--font-heading)',
  },
  challengePlayerCard: {
    background: 'linear-gradient(135deg, rgba(40, 32, 75, 0.9) 0%, rgba(20, 16, 42, 0.95) 100%)',
    border: '1.5px solid rgba(249, 115, 22, 0.45)',
    borderRadius: '20px',
    padding: '24px',
    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5), 0 0 20px rgba(249, 115, 22, 0.12)',
    marginBottom: '35px',
  },
  challengePlayerCardTop: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '20px',
    flexWrap: 'wrap',
    marginBottom: '20px',
  },
  challengePlayerCardLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    flexWrap: 'wrap',
  },
  challengeFlameBox: {
    position: 'relative',
    width: '64px',
    height: '64px',
    borderRadius: '18px',
    background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.25), rgba(234, 88, 12, 0.1))',
    border: '1.5px solid rgba(249, 115, 22, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 18px rgba(249, 115, 22, 0.3)',
    flexShrink: 0,
  },
  challengeFlameNumber: {
    position: 'absolute',
    bottom: '-4px',
    right: '-4px',
    background: '#f97316',
    color: '#ffffff',
    fontSize: '12px',
    fontWeight: '900',
    padding: '2px 7px',
    borderRadius: '10px',
    border: '2px solid #201b3f',
    fontFamily: 'var(--font-logo)',
  },
  challengePlayerTitle: {
    margin: 0,
    fontSize: '18px',
    fontWeight: '800',
    color: '#ffffff',
    fontFamily: 'var(--font-heading)',
  },
  challengePlayerBadge: {
    fontSize: '11px',
    fontWeight: '800',
    color: '#ffd43f',
    background: 'rgba(255, 212, 63, 0.15)',
    border: '1px solid rgba(255, 212, 63, 0.35)',
    borderRadius: '8px',
    padding: '3px 8px',
    fontFamily: 'var(--font-heading)',
  },
  challengePlayerSubtitle: {
    margin: '4px 0 0',
    fontSize: '13px',
    color: 'var(--text-muted, #b3a9db)',
    lineHeight: '1.4',
    fontFamily: 'var(--font-body)',
  },
  challengeNextMilestoneBadge: {
    background: 'rgba(14, 12, 28, 0.8)',
    border: '1px solid rgba(249, 115, 22, 0.3)',
    borderRadius: '14px',
    padding: '10px 14px',
    display: 'flex',
    flexDirection: 'column',
    gap: '3px',
    minWidth: '200px',
  },
  challengeNextLabel: {
    fontSize: '10px',
    fontWeight: '800',
    color: 'var(--text-muted, #b3a9db)',
    letterSpacing: '0.8px',
    fontFamily: 'var(--font-heading)',
  },
  challengeNextValue: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '13px',
    color: '#ffd43f',
    fontWeight: '700',
  },
  challengeDaysLeftText: {
    fontSize: '11px',
    color: 'var(--geo-green, #68de18)',
    fontWeight: '800',
  },
  challengeProgressWrap: {
    background: 'rgba(14, 12, 28, 0.6)',
    borderRadius: '14px',
    padding: '14px 16px',
    border: '1px solid rgba(255, 255, 255, 0.05)',
  },
  challengeProgressLabels: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '12px',
    marginBottom: '8px',
    flexWrap: 'wrap',
    gap: '6px',
    fontFamily: 'var(--font-heading)',
  },
  challengeProgressLabelText: {
    color: '#cbd5e1',
  },
  challengeProgressTargetText: {
    color: '#f97316',
    fontWeight: '800',
    fontSize: '11px',
  },
  challengeProgressTrack: {
    height: '10px',
    borderRadius: '6px',
    background: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
  },
  challengeProgressFill: {
    height: '100%',
    borderRadius: '6px',
    background: 'linear-gradient(90deg, #f97316 0%, #ffd43f 50%, var(--geo-green, #68de18) 100%)',
    transition: 'width 0.4s ease',
    boxShadow: '0 0 10px rgba(249, 115, 22, 0.5)',
  },
  challengeCardActionRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flexWrap: 'wrap',
    marginTop: '16px',
  },
  challengeActionPlayBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px 24px',
    background: 'var(--geo-green, #68de18)',
    color: '#122803',
    fontWeight: '900',
    fontSize: '14px',
    fontFamily: 'var(--font-heading)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    borderRadius: '9999px',
    border: 'none',
    cursor: 'pointer',
    boxShadow: '0 4px 0 var(--geo-green-shadow, #3fa509), 0 8px 18px rgba(104, 222, 24, 0.35)',
    transition: 'all 0.15s ease',
  },
  challengeActionStatsBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '12px 20px',
    background: 'var(--geo-purple, #7440e6)',
    border: 'none',
    borderRadius: '9999px',
    color: '#ffffff',
    fontWeight: '800',
    fontSize: '13px',
    fontFamily: 'var(--font-heading)',
    cursor: 'pointer',
    boxShadow: '0 4px 0 #4f25a8',
  },
  challengeCardStatusPlayed: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 14px',
    background: 'rgba(104, 222, 24, 0.15)',
    border: '1px solid rgba(104, 222, 24, 0.35)',
    borderRadius: '12px',
    color: 'var(--geo-green, #68de18)',
    fontSize: '12px',
    fontWeight: '800',
    fontFamily: 'var(--font-heading)',
  },
  challengeConceptsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '20px',
    marginBottom: '35px',
  },
  challengeConceptCard: {
    background: 'var(--bg-card, #201b3f)',
    border: '1px solid var(--bg-card-border, #352d62)',
    borderRadius: '20px',
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
  },
  conceptIconWrapAmber: {
    width: '48px',
    height: '48px',
    borderRadius: '14px',
    background: 'rgba(255, 212, 63, 0.15)',
    border: '1px solid rgba(255, 212, 63, 0.3)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  conceptIconWrapBlue: {
    width: '48px',
    height: '48px',
    borderRadius: '14px',
    background: 'rgba(56, 189, 248, 0.15)',
    border: '1px solid rgba(56, 189, 248, 0.3)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  conceptIconWrapGreen: {
    width: '48px',
    height: '48px',
    borderRadius: '14px',
    background: 'rgba(104, 222, 24, 0.15)',
    border: '1px solid rgba(104, 222, 24, 0.3)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  conceptCardTitle: {
    margin: 0,
    fontSize: '16px',
    fontWeight: '800',
    color: '#ffffff',
    fontFamily: 'var(--font-heading)',
  },
  conceptCardText: {
    margin: 0,
    fontSize: '13px',
    color: 'var(--text-muted, #b3a9db)',
    lineHeight: '1.5',
    flex: 1,
    fontFamily: 'var(--font-body)',
  },
  conceptHighlightBadge: {
    fontSize: '11px',
    fontWeight: '800',
    color: '#ffd43f',
    background: 'rgba(255, 212, 63, 0.12)',
    padding: '4px 10px',
    borderRadius: '8px',
    alignSelf: 'flex-start',
    fontFamily: 'var(--font-heading)',
  },
  conceptHighlightBadgeBlue: {
    fontSize: '11px',
    fontWeight: '800',
    color: '#38bdf8',
    background: 'rgba(56, 189, 248, 0.12)',
    padding: '4px 10px',
    borderRadius: '8px',
    alignSelf: 'flex-start',
    fontFamily: 'var(--font-heading)',
  },
  conceptHighlightBadgeGreen: {
    fontSize: '11px',
    fontWeight: '800',
    color: 'var(--geo-green, #68de18)',
    background: 'rgba(104, 222, 24, 0.12)',
    padding: '4px 10px',
    borderRadius: '8px',
    alignSelf: 'flex-start',
    fontFamily: 'var(--font-heading)',
  },
  challengeMilestonesSectionWrap: {
    background: 'rgba(14, 12, 28, 0.7)',
    border: '1px solid var(--bg-card-border, #352d62)',
    borderRadius: '22px',
    padding: '26px',
    marginBottom: '35px',
  },
  milestonesSectionTitleRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '12px',
    flexWrap: 'wrap',
    marginBottom: '20px',
  },
  milestonesSectionHeading: {
    margin: 0,
    fontSize: '18px',
    fontWeight: '800',
    color: '#ffffff',
    fontFamily: 'var(--font-heading)',
  },
  milestonesFreeNotice: {
    fontSize: '11px',
    fontWeight: '800',
    color: '#ffd43f',
    background: 'rgba(255, 212, 63, 0.15)',
    padding: '4px 12px',
    borderRadius: '12px',
    border: '1px solid rgba(255, 212, 63, 0.3)',
    fontFamily: 'var(--font-heading)',
  },
  milestonesGridContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '14px',
  },
  milestoneLandingCard: {
    background: 'var(--bg-card, #201b3f)',
    border: '1px solid var(--bg-card-border, #352d62)',
    borderRadius: '18px',
    padding: '18px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    transition: 'all 0.2s ease',
  },
  milestoneLandingCardUnlocked: {
    background: 'rgba(104, 222, 24, 0.12)',
    borderColor: 'rgba(104, 222, 24, 0.45)',
    boxShadow: '0 4px 18px rgba(104, 222, 24, 0.2)',
  },
  milestoneLandingCardNext: {
    background: 'rgba(255, 212, 63, 0.12)',
    borderColor: 'rgba(255, 212, 63, 0.5)',
    boxShadow: '0 4px 18px rgba(255, 212, 63, 0.2)',
  },
  milestoneCardHead: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '8px',
  },
  milestoneMedalIcon: {
    fontSize: '24px',
    lineHeight: 1,
  },
  milestoneDayBadge: {
    fontSize: '10px',
    fontWeight: '800',
    padding: '3px 8px',
    borderRadius: '10px',
    border: '1px solid transparent',
    fontFamily: 'var(--font-heading)',
  },
  milestoneTitleText: {
    margin: 0,
    fontSize: '14px',
    fontWeight: '800',
    fontFamily: 'var(--font-heading)',
  },
  milestoneBonusPointsPill: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '11px',
    fontWeight: '800',
    color: '#ffd43f',
    background: 'rgba(255, 212, 63, 0.15)',
    padding: '3px 8px',
    borderRadius: '6px',
    alignSelf: 'flex-start',
    fontFamily: 'var(--font-heading)',
  },
  milestonePerkExplain: {
    margin: 0,
    fontSize: '12px',
    color: 'var(--text-muted, #b3a9db)',
    lineHeight: '1.45',
    flex: 1,
    fontFamily: 'var(--font-body)',
  },
  milestoneFooterStatus: {
    marginTop: '6px',
    paddingTop: '6px',
    borderTop: '1px solid rgba(255, 255, 255, 0.06)',
  },
  challengeFaqBox: {
    background: 'var(--bg-card, #201b3f)',
    border: '1px solid var(--bg-card-border, #352d62)',
    borderRadius: '22px',
    padding: '26px',
    marginBottom: '35px',
    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
  },
  challengeFaqHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '16px',
  },
  challengeFaqTitle: {
    margin: 0,
    fontSize: '17px',
    fontWeight: '800',
    color: '#ffffff',
    fontFamily: 'var(--font-heading)',
  },
  challengeFaqGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
    gap: '16px',
  },
  challengeFaqItem: {
    background: 'rgba(14, 12, 28, 0.6)',
    border: '1px solid var(--bg-card-border, #352d62)',
    borderRadius: '14px',
    padding: '14px 16px',
  },
  challengeFaqQ: {
    display: 'block',
    fontSize: '13px',
    fontWeight: '800',
    color: 'var(--geo-green, #68de18)',
    marginBottom: '6px',
    fontFamily: 'var(--font-heading)',
  },
  challengeFaqA: {
    margin: 0,
    fontSize: '12px',
    color: 'var(--text-muted, #b3a9db)',
    lineHeight: '1.5',
    fontFamily: 'var(--font-body)',
  },
  challengeBottomCtaRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '14px',
    flexWrap: 'wrap',
  },
};

