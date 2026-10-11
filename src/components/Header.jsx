import React, { useState } from 'react';
import { Trophy, HelpCircle, User, Flame, Volume2, VolumeX, Sparkles, Compass } from 'lucide-react';
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

  const streak = Number(stats?.streak_actuel) || 0;
  const xp = Number(stats?.total_score) || 100;
  const level = Math.max(1, Math.floor(xp / 1000) + 1);

  return (
    <header style={styles.header}>
      {/* Brand GeoGuessr Style (Badge Rouge Iconique BIZGAMES) */}
      <div style={styles.leftSection}>
        <div
          className="geoguessr-logo-badge"
          onClick={onGoHome}
          title="Retour au menu principal"
        >
          <span style={styles.logoText}>BIZGAMES</span>
        </div>

        {/* Navigation rapide Desktop (Style GeoGuessr) */}
        <nav className="desktop-only" style={styles.navMenu}>
          <button onClick={onGoHome} style={styles.navItemActive}>
            Singleplayer
          </button>
          {onOpenLeaderboard && (
            <button onClick={onOpenLeaderboard} style={styles.navItem}>
              Classement
            </button>
          )}
          <button onClick={onOpenRules} style={styles.navItem}>
            Règles
          </button>
        </nav>
      </div>

      {/* Stats en cours de partie & Profil Joueur */}
      <div style={styles.rightSection}>
        {/* En cours de partie : progression questions + score */}
        {totalQuestions > 0 && (
          <div style={styles.inGameBadges}>
            <div style={styles.roundBadge}>
              <span style={styles.roundLabel}>Round</span>
              <span style={styles.roundValue}>
                {currentIndex + 1}
                <span style={styles.dim}>/{totalQuestions}</span>
              </span>
            </div>

            <div style={styles.scoreBadge}>
              <Trophy size={13} color="#ffbe1a" />
              <span style={styles.scoreValue}>
                {currentScore.toLocaleString('fr-FR')}
              </span>
            </div>
          </div>
        )}

        {/* Profil Joueur GeoGuessr Style (Avatar, Flag, Coins, Level) */}
        {(onOpenPlayerHub || onOpenAuth) && (
          <div
            onClick={onOpenPlayerHub || onOpenAuth}
            style={styles.playerPill}
            title={isUserLoggedIn ? `Mon Profil (${user.displayName || user.email})` : 'Se connecter'}
          >
            {isUserLoggedIn ? (
              <>
                {/* Avatar miniature */}
                {(user.photoURL || stats?.photo_url) ? (
                  <img src={user.photoURL || stats?.photo_url} alt="Avatar" style={styles.playerAvatar} />
                ) : (
                  <div style={styles.playerInitial}>
                    {(user.displayName || stats?.pseudo || user.email || 'J')[0].toUpperCase()}
                  </div>
                )}

                {/* Drapeau & Pseudo */}
                <div className="small-screen-hide" style={styles.playerInfoCol}>
                  <div style={styles.playerNameRow}>
                    <span style={styles.flagEmoji}>🇫🇷</span>
                    <span style={styles.playerPseudo}>
                      {user.displayName?.split(' ')[0] || stats?.pseudo || 'Joueur'}
                    </span>
                  </div>
                </div>

                {/* Jetons / Pièces GeoGuessr */}
                <div style={styles.coinsBadge}>
                  <span style={styles.coinIcon}>🟣</span>
                  <span style={styles.coinCount}>{(streak * 50) + 100}</span>
                </div>

                {/* Niveau GeoGuessr (Badge rond jaune) */}
                <div style={styles.levelBadge} title={`Niveau ${level}`}>
                  {level}
                </div>
              </>
            ) : (
              <div style={styles.loginPill}>
                <User size={14} color="#ffffff" />
                <span style={styles.loginText}>CONNEXION</span>
              </div>
            )}
          </div>
        )}

        {/* Effets Sonores */}
        <button
          onClick={handleToggleSound}
          style={styles.iconBtn}
          title={soundOn ? 'Désactiver le son' : 'Activer le son'}
          aria-label="Toggle sound"
        >
          {soundOn ? <Volume2 size={16} color="#68de18" /> : <VolumeX size={16} color="#7a71a3" />}
        </button>

        {/* Aide / Règles */}
        <button
          onClick={onOpenRules}
          style={styles.iconBtn}
          title="Règles du jeu"
          aria-label="Règles"
        >
          <HelpCircle size={16} color="#b3a9db" />
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
    minHeight: '62px',
    paddingTop: 'calc(var(--safe-top) + 6px)',
    paddingBottom: '8px',
    paddingLeft: '16px',
    paddingRight: '16px',
    zIndex: 1000,
    background: 'rgba(21, 19, 42, 0.94)',
    backdropFilter: 'blur(16px)',
    borderBottom: '1px solid rgba(53, 45, 98, 0.85)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.35)',
  },
  leftSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '24px',
  },
  logoText: {
    fontFamily: 'var(--font-logo)',
    fontWeight: '900',
    fontSize: '18px',
    letterSpacing: '0.8px',
    textTransform: 'uppercase',
  },
  navMenu: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  navItem: {
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
  navItemActive: {
    background: 'rgba(116, 64, 230, 0.2)',
    border: 'none',
    color: '#ffffff',
    fontSize: '14px',
    fontWeight: '800',
    fontFamily: 'var(--font-heading)',
    padding: '8px 14px',
    borderRadius: '8px',
    cursor: 'pointer',
  },
  rightSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  inGameBadges: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  roundBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    background: 'var(--bg-card)',
    border: '1px solid var(--bg-card-border)',
    borderRadius: '9999px',
    padding: '5px 12px',
    fontSize: '12px',
    fontWeight: '800',
  },
  roundLabel: {
    color: '#7a71a3',
    textTransform: 'uppercase',
    fontSize: '10px',
  },
  roundValue: {
    color: '#ffffff',
    fontWeight: '900',
  },
  dim: {
    color: '#7a71a3',
  },
  scoreBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    background: 'rgba(255, 190, 26, 0.15)',
    border: '1px solid rgba(255, 190, 26, 0.35)',
    borderRadius: '9999px',
    padding: '5px 12px',
    color: '#ffbe1a',
    fontSize: '12px',
    fontWeight: '900',
  },
  scoreValue: {
    fontVariantNumeric: 'tabular-nums',
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
  playerAvatar: {
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    objectFit: 'cover',
    border: '2px solid var(--geo-purple)',
  },
  playerInitial: {
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #7440e6, #e12239)',
    color: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '900',
    fontSize: '12px',
  },
  playerInfoCol: {
    display: 'flex',
    flexDirection: 'column',
  },
  playerNameRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  flagEmoji: {
    fontSize: '12px',
  },
  playerPseudo: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: '12px',
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
    padding: '2px 7px',
    fontSize: '11px',
    fontWeight: '800',
    color: '#b3a9db',
  },
  coinIcon: {
    fontSize: '11px',
  },
  coinCount: {
    color: '#ffffff',
    fontWeight: '800',
  },
  levelBadge: {
    width: '22px',
    height: '22px',
    borderRadius: '50%',
    background: '#ffbe1a',
    color: '#15132a',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '900',
    fontSize: '11px',
    boxShadow: '0 2px 6px rgba(255, 190, 26, 0.4)',
  },
  loginPill: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '4px 8px',
  },
  loginText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: '12px',
  },
  iconBtn: {
    width: '34px',
    height: '34px',
    borderRadius: '50%',
    background: 'var(--bg-card)',
    border: '1px solid var(--bg-card-border)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
};
