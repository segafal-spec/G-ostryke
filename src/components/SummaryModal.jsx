import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import {
  Trophy,
  Share2,
  Check,
  Award,
  ChevronRight,
  User,
  LogIn,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  MapPin,
  Lock,
  Compass,
  Clock,
  RotateCcw,
  Home,
} from 'lucide-react';
import { getRankTitle, generateShareText, getScoreEmoji, getSocialShareUrls } from '../utils/geo';
import { playGameOverFanfare, playCopySound, playClickSound } from '../utils/audio';

export default function SummaryModal({
  roundDate,
  totalScore,
  totalSeconds,
  history,
  onPlayAgain,
  onGoHome,
  authInfo,
  onOpenAuth,
  onOpenLeaderboard,
  onOpenPlayerHub,
}) {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('round'); // 'round' | 'ranks' | 'share'
  const rank = getRankTitle(totalScore);
  const isUserLoggedIn = authInfo && authInfo.user && !authInfo.isAnonymous;

  const shareText = generateShareText(roundDate, totalScore, history, totalSeconds);
  const socialLinks = getSocialShareUrls(shareText);

  // Calcul des statistiques du récapitulatif
  const totalKm = history.reduce((sum, item) => sum + (Number(item.distanceKm) || 0), 0);
  const avgKm = Math.round(totalKm / (history.length || 1));

  useEffect(() => {
    playGameOverFanfare(totalScore >= 3200);

    if (totalScore >= 3500 || (totalScore <= 50 && totalScore >= 35)) {
      confetti({
        particleCount: 90,
        spread: 80,
        origin: { y: 0.55 },
        colors: ['#68de18', '#7440e6', '#ffbe1a', '#ffffff'],
      });
    }
  }, [totalScore]);

  function handleCopyShare() {
    playCopySound();
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareText).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      });
    } else {
      alert('Résultat copié :\n\n' + shareText);
    }
  }

  async function handleNativeOrCopy() {
    playCopySound();
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Mon score BizGames',
          text: shareText,
          url: 'https://bizgames-game.web.app',
        });
        return;
      } catch (e) {}
    }
    handleCopyShare();
  }

  // Formatage du temps
  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return m > 0 ? `${m} min, ${s} sec` : `${s} sec`;
  };

  return (
    <div style={styles.backdrop}>
      <div style={styles.modal} className="geo-card">
        {/* BANNIÈRE SUPÉRIEURE DE CARTE (SCREENSHOT 3) */}
        <div style={styles.mapBannerWrapper}>
          <img
            src="/images/world_map_mockup.jpg"
            alt="Carte de la manche"
            style={styles.mapBannerImg}
          />
          <div style={styles.mapBannerOverlay} />
          <div style={styles.bannerBadgePill}>
            <span>DÉFI DU JOUR • {roundDate}</span>
          </div>
        </div>

        {/* SCORE PRINCIPAL & MÉDAILLE (SCREENSHOT 3 STYLE) */}
        <div style={styles.scoreSummaryRow}>
          <div style={styles.medalWrapper}>
            <span style={styles.medalEmoji}>
              {totalScore >= 4500 ? '🥇' : totalScore >= 3200 ? '🥈' : '🥉'}
            </span>
          </div>
          <div style={styles.scoreTextCol}>
            <div style={styles.scoreBigNumber}>
              {totalScore.toLocaleString('fr-FR')}
            </div>
            <span style={styles.scoreSubLabel}>VOTRE SCORE FINAL (SUR 5 000)</span>
          </div>

          <div style={styles.medalsTrophyTiers}>
            <div style={styles.trophyMiniBadge}>
              <span>🥇</span> <span>{totalScore >= 4500 ? 1 : 0}</span>
            </div>
            <div style={styles.trophyMiniBadge}>
              <span>🥈</span> <span>{totalScore >= 3200 && totalScore < 4500 ? 1 : 0}</span>
            </div>
            <div style={styles.trophyMiniBadge}>
              <span>🥉</span> <span>{totalScore < 3200 ? 1 : 0}</span>
            </div>
          </div>
        </div>

        {/* ONGLET DE NAVIGATION INTERNE [MA PARTIE] [CLASSEMENT] [PARTAGER] */}
        <div style={styles.tabNavRow}>
          <button
            onClick={() => setActiveTab('round')}
            style={activeTab === 'round' ? styles.tabBtnActive : styles.tabBtn}
          >
            MA PARTIE
          </button>
          {onOpenLeaderboard && (
            <button
              onClick={onOpenLeaderboard}
              style={styles.tabBtn}
            >
              CLASSEMENT
            </button>
          )}
          <button
            onClick={() => setActiveTab('share')}
            style={activeTab === 'share' ? styles.tabBtnActive : styles.tabBtn}
          >
            PARTAGER
          </button>
        </div>

        {/* TABLEAU RÉCAPITULATIF DES 5 TOURS (SCREENSHOT 3) */}
        {activeTab === 'round' && (
          <div style={styles.roundsSection}>
            <div style={styles.roundsTable}>
              {history.map((item, idx) => (
                <div key={idx} style={styles.roundCardRow}>
                  <div style={styles.roundNumberCol}>
                    <span style={styles.roundNumLabel}>Tour {idx + 1}</span>
                    <span style={styles.roundPinEmoji}>{getScoreEmoji(item.score, item.distanceKm)}</span>
                  </div>
                  <div style={styles.roundCenterCol}>
                    <span style={styles.roundLocationName}>
                      {item.question?.lieu_nom || item.question?.texte}
                    </span>
                    <span style={styles.roundDistanceSub}>
                      {item.distanceKm < 1 ? '< 1 km' : `${item.distanceKm.toLocaleString('fr-FR')} km`}
                    </span>
                  </div>
                  <div style={styles.roundScoreCol}>
                    <span style={styles.roundPointsValue}>
                      {item.score.toLocaleString('fr-FR')} pts
                    </span>
                  </div>
                </div>
              ))}

              {/* TOTAL ROW */}
              <div style={styles.totalRow}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={styles.totalLabel}>TOTAL MANCHE</span>
                  <span style={styles.totalSub}>{totalKm.toLocaleString('fr-FR')} km parcourus</span>
                </div>
                <span style={styles.totalPointsBig}>{totalScore.toLocaleString('fr-FR')} pts</span>
              </div>
            </div>
          </div>
        )}

        {/* SECTION PARTAGE SOCIAL */}
        {activeTab === 'share' && (
          <div style={styles.shareSection}>
            <span style={styles.shareHeadline}>Défiez vos amis sans spoiler le lieu !</span>
            <div style={styles.socialButtonsGrid}>
              <a
                href={socialLinks.whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                style={{ ...styles.socialPill, background: '#25D366' }}
              >
                <span>WhatsApp</span>
              </a>
              <a
                href={socialLinks.x}
                target="_blank"
                rel="noopener noreferrer"
                style={{ ...styles.socialPill, background: '#000000', border: '1px solid #352d62' }}
              >
                <span>𝕏 Post</span>
              </a>
              <a
                href={socialLinks.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                style={{ ...styles.socialPill, background: '#0A66C2' }}
              >
                <span>LinkedIn</span>
              </a>
            </div>

            <button
              onClick={handleNativeOrCopy}
              className="geo-btn-purple"
              style={{ width: '100%', marginTop: '12px' }}
            >
              {copied ? <Check size={16} /> : <Share2 size={16} />}
              <span>{copied ? 'Copié dans le presse-papiers !' : 'Copier mon résultat complet'}</span>
            </button>
          </div>
        )}

        {/* BANNIÈRE JOUEUR SYNCHRONISÉ */}
        {!isUserLoggedIn && onOpenAuth ? (
          <div style={styles.loginBanner} onClick={onOpenAuth}>
            <LogIn size={18} color="#ffbe1a" />
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
              <span style={{ fontSize: '13px', fontWeight: '800', color: '#ffffff' }}>
                Sauvegardez votre série & vos points
              </span>
              <span style={{ fontSize: '11px', color: '#b3a9db' }}>
                Créez un compte gratuit pour figurer au palmarès mondial
              </span>
            </div>
            <ChevronRight size={16} color="#ffffff" />
          </div>
        ) : (
          <div style={styles.loggedNotice}>
            <Check size={14} color="#68de18" />
            <span>Score synchronisé avec succès pour votre profil !</span>
          </div>
        )}

        {/* ACTIONS INFÉRIEURES (BOUTONS VERTS 3D) */}
        <div style={styles.actionButtonsCol}>
          {onGoHome && (
            <button
              onClick={onGoHome}
              className="geo-btn-green"
              style={styles.actionBtnGreen}
            >
              <Home size={18} />
              <span>RETOURNER AU MENU PRINCIPAL</span>
            </button>
          )}

          {onOpenPlayerHub && (
            <button
              onClick={onOpenPlayerHub}
              className="geo-btn-purple"
              style={{ width: '100%' }}
            >
              <User size={16} />
              <span>VOIR MON ESPACE JOUEUR & STATS</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  backdrop: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 2000,
    background: 'rgba(10, 8, 20, 0.88)',
    backdropFilter: 'blur(16px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '16px',
    animation: 'fadeIn 0.2s ease-out',
  },
  modal: {
    background: 'var(--bg-card)',
    border: '1px solid var(--bg-card-border)',
    borderRadius: '24px',
    width: '100%',
    maxWidth: '560px',
    maxHeight: '92vh',
    overflowY: 'auto',
    padding: '0 0 24px 0',
    boxShadow: '0 25px 60px rgba(0, 0, 0, 0.85), 0 0 35px rgba(116, 64, 230, 0.25)',
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    overflow: 'hidden',
  },
  mapBannerWrapper: {
    position: 'relative',
    height: '140px',
    width: '100%',
    overflow: 'hidden',
  },
  mapBannerImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  mapBannerOverlay: {
    position: 'absolute',
    inset: 0,
    background: 'linear-gradient(180deg, rgba(21, 19, 42, 0.2) 0%, rgba(32, 27, 63, 0.95) 100%)',
  },
  bannerBadgePill: {
    position: 'absolute',
    top: '12px',
    left: '14px',
    background: 'rgba(21, 19, 42, 0.85)',
    border: '1px solid rgba(255, 255, 255, 0.15)',
    borderRadius: '9999px',
    padding: '4px 12px',
    color: '#ffffff',
    fontSize: '11px',
    fontWeight: '800',
    letterSpacing: '0.5px',
  },
  scoreSummaryRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '0 24px',
    marginTop: '-24px',
    position: 'relative',
    zIndex: 2,
  },
  medalWrapper: {
    width: '64px',
    height: '64px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #2c2557, #15132a)',
    border: '3px solid #7440e6',
    boxShadow: '0 0 20px rgba(116, 64, 230, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  medalEmoji: {
    fontSize: '34px',
  },
  scoreTextCol: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
  },
  scoreBigNumber: {
    fontFamily: 'var(--font-heading)',
    fontSize: '38px',
    fontWeight: '900',
    color: '#ffffff',
    lineHeight: '1',
  },
  scoreSubLabel: {
    fontSize: '11px',
    fontWeight: '800',
    color: '#ffbe1a',
    letterSpacing: '0.6px',
    marginTop: '4px',
  },
  medalsTrophyTiers: {
    display: 'flex',
    gap: '6px',
  },
  trophyMiniBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '2px',
    background: 'rgba(21, 19, 42, 0.8)',
    border: '1px solid #352d62',
    borderRadius: '9999px',
    padding: '3px 7px',
    fontSize: '11px',
    fontWeight: '800',
    color: '#ffffff',
  },
  tabNavRow: {
    display: 'flex',
    gap: '8px',
    padding: '16px 24px 8px 24px',
  },
  tabBtn: {
    background: 'transparent',
    border: 'none',
    color: '#b3a9db',
    fontFamily: 'var(--font-heading)',
    fontWeight: '800',
    fontSize: '13px',
    padding: '8px 14px',
    borderRadius: '8px',
    cursor: 'pointer',
  },
  tabBtnActive: {
    background: 'var(--geo-purple)',
    border: 'none',
    color: '#ffffff',
    fontFamily: 'var(--font-heading)',
    fontWeight: '900',
    fontSize: '13px',
    padding: '8px 14px',
    borderRadius: '8px',
    cursor: 'pointer',
    boxShadow: '0 0 12px rgba(116, 64, 230, 0.4)',
  },
  roundsSection: {
    padding: '0 24px',
  },
  roundsTable: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    background: 'rgba(21, 19, 42, 0.7)',
    border: '1px solid #352d62',
    borderRadius: '16px',
    padding: '10px',
  },
  roundCardRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '8px 10px',
    background: 'rgba(32, 27, 63, 0.8)',
    borderRadius: '10px',
  },
  roundNumberCol: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    width: '70px',
  },
  roundNumLabel: {
    fontSize: '11px',
    fontWeight: '800',
    color: '#7a71a3',
  },
  roundPinEmoji: {
    fontSize: '12px',
  },
  roundCenterCol: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
  },
  roundLocationName: {
    color: '#ffffff',
    fontSize: '13px',
    fontWeight: '700',
  },
  roundDistanceSub: {
    color: '#b3a9db',
    fontSize: '11px',
  },
  roundScoreCol: {
    display: 'flex',
    alignItems: 'center',
  },
  roundPointsValue: {
    color: '#68de18',
    fontFamily: 'var(--font-heading)',
    fontWeight: '900',
    fontSize: '14px',
  },
  totalRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '10px',
    borderTop: '1px solid #352d62',
    marginTop: '4px',
  },
  totalLabel: {
    color: '#ffffff',
    fontFamily: 'var(--font-heading)',
    fontWeight: '900',
    fontSize: '13px',
  },
  totalSub: {
    color: '#7a71a3',
    fontSize: '11px',
  },
  totalPointsBig: {
    color: '#ffbe1a',
    fontFamily: 'var(--font-heading)',
    fontSize: '20px',
    fontWeight: '900',
  },
  shareSection: {
    padding: '0 24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  shareHeadline: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: '13px',
    textAlign: 'center',
  },
  socialButtonsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '8px',
  },
  socialPill: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '8px',
    borderRadius: '8px',
    color: '#ffffff',
    textDecoration: 'none',
    fontWeight: '800',
    fontSize: '12px',
  },
  loginBanner: {
    margin: '16px 24px 0 24px',
    background: 'rgba(116, 64, 230, 0.2)',
    border: '1px solid rgba(116, 64, 230, 0.4)',
    borderRadius: '12px',
    padding: '10px 14px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    cursor: 'pointer',
  },
  loggedNotice: {
    margin: '14px 24px 0 24px',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    color: '#68de18',
    fontSize: '12px',
    fontWeight: '700',
  },
  actionButtonsCol: {
    padding: '16px 24px 0 24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  actionBtnGreen: {
    width: '100%',
    padding: '15px',
    fontSize: '15px',
  },
};
