import React, { useState } from 'react';
import { Globe2, Trophy, HelpCircle, Home, User, Flame, Volume2, VolumeX } from 'lucide-react';
import {
  isSoundEnabled,
  setSoundEnabled,
  playSwitchSound,
  startAmbientMusic,
  stopAmbientMusic,
} from '../utils/audio';

export default function Header({
  currentIndex,
  totalQuestions,
  currentScore,
  onOpenRules,
  onGoHome,
  authInfo,
  onOpenAuth,
  onOpenLeaderboard,
  onOpenPlayerHub,
}) {
  const isUserLoggedIn = authInfo && authInfo.user && !authInfo.isAnonymous;
  const user = authInfo?.user;
  const stats = authInfo?.stats;
  const [soundOn, setSoundOn] = useState(() => isSoundEnabled());

  const handleToggleSound = () => {
    const next = !soundOn;
    setSoundEnabled(next);
    setSoundOn(next);
    if (next) {
      playSwitchSound();
      startAmbientMusic();
    } else {
      stopAmbientMusic(false);
    }
  };

  return (
    <header style={styles.header}>
      {/* Brand & Retour Accueil (Desktop > 768px) */}
      <div className="desktop-brand-header" style={styles.brand} onClick={onGoHome} title="Retour à l'accueil">
        <div style={styles.logoIcon}>
          <Globe2 size={18} color="#10b981" />
        </div>
        <div style={styles.brandTextWrapper}>
          <h1 style={styles.brandTitle}>BizGames</h1>
          <span style={styles.brandSubtitle}>ÉCO-TITAN 2085</span>
        </div>
      </div>

      {/* Brand Mobile (<= 768px) : Grand B */}
      <div className="mobile-brand-b" onClick={onGoHome} title="Retour à l'accueil" aria-label="Retour à l'accueil">
        <span className="mobile-b-letter">B</span>
      </div>

      {/* Stats & Actions */}
      <div style={styles.statsContainer}>
        {/* Progression des questions */}
        <div style={styles.badge}>
          <span style={styles.badgeValue}>
            {currentIndex + 1}<span style={styles.dim}>/{totalQuestions}</span>
          </span>
        </div>

        {/* Score cumulé */}
        <div style={{ ...styles.badge, ...styles.scoreBadge }}>
          <Trophy size={14} color="#f59e0b" />
          <span style={styles.scoreValue}>
            {currentScore.toLocaleString('fr-FR')}
          </span>
        </div>

        {/* Bouton Profil / Mon Espace */}
        {(onOpenPlayerHub || onOpenAuth) && (
          <button
            onClick={onOpenPlayerHub || onOpenAuth}
            style={isUserLoggedIn ? styles.userPillActive : styles.userPillGuest}
            title={isUserLoggedIn ? `Mon Espace Joueur (${user.displayName || user.email})` : 'Mon Espace & Statistiques'}
          >
            {isUserLoggedIn ? (
              <>
                {(user.photoURL || stats?.photo_url) ? (
                  <img src={user.photoURL || stats?.photo_url} alt="Avatar" style={styles.userAvatarMini} />
                ) : (
                  <span style={styles.userAvatarInitial}>
                    {(user.displayName || stats?.pseudo || user.email || 'U')[0].toUpperCase()}
                  </span>
                )}
                <span className="small-screen-hide" style={styles.userPseudo}>
                  {user.displayName?.split(' ')[0] || 'Joueur'}
                </span>
                {stats?.streak_actuel > 0 && (
                  <span style={styles.userStreak}>
                    <Flame size={12} color="#f59e0b" />
                    {stats.streak_actuel}
                  </span>
                )}
              </>
            ) : (
              <>
                <User size={14} />
                <span className="small-screen-hide">Connexion</span>
              </>
            )}
          </button>
        )}

        {/* Bouton Classement */}
        {onOpenLeaderboard && (
          <button
            onClick={onOpenLeaderboard}
            style={styles.leaderboardBtn}
            title="Classement & Scores"
            aria-label="Classement & Scores"
          >
            <Trophy size={14} color="#f59e0b" />
            <span className="small-screen-hide">Classement</span>
          </button>
        )}

        {/* Effets Sonores */}
        <button
          onClick={handleToggleSound}
          style={styles.helpButton}
          title={soundOn ? 'Désactiver les effets sonores' : 'Activer les effets sonores'}
          aria-label={soundOn ? 'Désactiver le son' : 'Activer le son'}
        >
          {soundOn ? <Volume2 size={16} color="#10b981" /> : <VolumeX size={16} color="#64748b" />}
        </button>

        {/* Aide */}
        <button
          onClick={onOpenRules}
          style={styles.helpButton}
          title="Règles du jeu"
          aria-label="Règles du jeu"
        >
          <HelpCircle size={16} />
        </button>
      </div>
    </header>
  );
}

const styles = {
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 'auto',
    minHeight: '56px',
    paddingTop: 'calc(var(--safe-top) + 6px)',
    paddingBottom: '8px',
    zIndex: 1000,
    background: 'linear-gradient(180deg, rgba(3, 18, 14, 0.96) 0%, rgba(3, 18, 14, 0.88) 85%, transparent 100%)',
    backdropFilter: 'blur(16px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: '12px',
    paddingRight: '12px',
    borderBottom: '1px solid rgba(16, 185, 129, 0.22)',
  },
  brand: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    cursor: 'pointer',
    flexShrink: 0,
  },
  logoIcon: {
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    background: 'rgba(16, 185, 129, 0.15)',
    border: '1px solid rgba(16, 185, 129, 0.4)',
    boxShadow: '0 0 10px rgba(16, 185, 129, 0.2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandTextWrapper: {
    display: 'flex',
    flexDirection: 'column',
  },
  brandTitle: {
    fontFamily: 'var(--font-heading)',
    fontSize: '17px',
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: '-0.3px',
    lineHeight: '1.1',
  },
  brandSubtitle: {
    fontSize: '8px',
    fontWeight: '800',
    color: '#10b981',
    letterSpacing: '1px',
    textTransform: 'uppercase',
  },
  statsContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    flexWrap: 'nowrap',
  },
  homeButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    background: 'rgba(255, 255, 255, 0.06)',
    border: '1px solid rgba(16, 185, 129, 0.2)',
    borderRadius: '16px',
    padding: '6px 10px',
    color: '#cbd5e1',
    fontSize: '11px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  homeButtonText: {
    display: 'inline',
  },
  badge: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    background: 'rgba(6, 27, 21, 0.85)',
    border: '1px solid rgba(16, 185, 129, 0.25)',
    borderRadius: '16px',
    padding: '5px 9px',
    fontSize: '12px',
    fontWeight: '600',
  },
  scoreBadge: {
    background: 'rgba(245, 158, 11, 0.15)',
    borderColor: 'rgba(245, 158, 11, 0.4)',
    boxShadow: '0 0 12px rgba(245, 158, 11, 0.2)',
  },
  badgeValue: {
    color: '#f8fafc',
    fontVariantNumeric: 'tabular-nums',
  },
  scoreValue: {
    color: '#fbbf24',
    fontWeight: '800',
    fontVariantNumeric: 'tabular-nums',
  },
  dim: {
    color: '#6ee7b7',
    fontSize: '10px',
  },
  helpButton: {
    background: 'rgba(6, 27, 21, 0.8)',
    border: '1px solid rgba(16, 185, 129, 0.3)',
    borderRadius: '50%',
    width: '32px',
    height: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#34d399',
    cursor: 'pointer',
    flexShrink: 0,
  },
  userPillGuest: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(16, 185, 129, 0.15))',
    border: '1px solid rgba(16, 185, 129, 0.4)',
    borderRadius: '16px',
    padding: '5px 10px',
    color: '#34d399',
    fontSize: '11px',
    fontWeight: '700',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  userPillActive: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    background: 'rgba(255, 255, 255, 0.08)',
    border: '1px solid rgba(255, 255, 255, 0.18)',
    borderRadius: '16px',
    padding: '3px 8px 3px 4px',
    color: '#f8fafc',
    fontSize: '11px',
    fontWeight: '700',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  userAvatarMini: {
    width: '22px',
    height: '22px',
    borderRadius: '50%',
    objectFit: 'cover',
  },
  userAvatarInitial: {
    width: '22px',
    height: '22px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #f59e0b, #d97706)',
    color: '#0b0f19',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '11px',
    fontWeight: '800',
  },
  userPseudo: {
    maxWidth: '80px',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  userStreak: {
    display: 'flex',
    alignItems: 'center',
    gap: '2px',
    color: '#f59e0b',
    fontSize: '11px',
    fontWeight: '800',
    marginLeft: '2px',
  },
  leaderboardBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    background: 'rgba(255, 255, 255, 0.06)',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    borderRadius: '16px',
    padding: '5px 9px',
    color: '#f8fafc',
    fontSize: '11px',
    fontWeight: '700',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
};


