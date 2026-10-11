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
  const [expandedIdx, setExpandedIdx] = useState(null);
  const rank = getRankTitle(totalScore);
  const isUserLoggedIn = authInfo && authInfo.user && !authInfo.isAnonymous;

  const shareText = generateShareText(roundDate, totalScore, history, totalSeconds);
  const socialLinks = getSocialShareUrls(shareText);

  // Déclencher les effets sonores et confettis de fin de partie
  useEffect(() => {
    // Fanfare triomphale selon le score
    playGameOverFanfare(totalScore >= 3200);

    if (totalScore >= 3500 || (totalScore <= 50 && totalScore >= 35)) {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#f59e0b', '#10b981', '#3b82f6', '#ffffff'],
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
      } catch (e) {
        // Ignorer si l'utilisateur annule le dialogue système
      }
    }
    handleCopyShare();
  }

  return (
    <div style={styles.backdrop}>
      <div style={styles.modal}>
        {/* En-tête */}
        <div style={styles.header}>
          <div style={styles.trophyWrapper}>
            <img
              src="/images/characters/char_victory_trophy.jpg"
              alt="Victoire Éco-Titan"
              style={styles.trophyImg}
            />
          </div>
          <span style={styles.subTitle}>MISSION ÉCO-TITAN ACCOMPLIE • {roundDate}</span>
          <div style={styles.scoreRow}>
            <span style={styles.scoreNumber}>{totalScore.toLocaleString('fr-FR')}</span>
            <span style={styles.scoreMax}>/ 5 000 pts</span>
          </div>
          <div style={{ fontSize: '13px', color: '#34d399', fontWeight: '800', marginTop: '2px', letterSpacing: '0.3px' }}>
            Moyenne : {Math.round(totalScore / (history.length || 5)).toLocaleString('fr-FR')} / 1 000 pts • Points ajoutés à votre cumul final
          </div>

          {/* Titre honorifique */}
          <div style={{ ...styles.rankBadge, borderColor: rank.color }}>
            <span style={styles.rankIcon}>{rank.badge}</span>
            <span style={{ ...styles.rankTitle, color: rank.color }}>{rank.title}</span>
          </div>
        </div>

        {/* Grille emoji Wordle */}
        <div style={styles.emojiGrid}>
          {history.map((h, i) => (
            <span key={i} style={styles.emojiCell}>
              {getScoreEmoji(h.score, h.distanceKm)}
            </span>
          ))}
        </div>

        {/* Note moyenne du round */}
        <div style={styles.quickStatsRow}>
          <div style={styles.quickStat}>
            <Award size={18} color="#10b981" />
            <span style={styles.quickStatText}>
              Score moyen du round : <strong style={{ color: '#ffffff', fontSize: '13px' }}>{Math.round(totalScore / (history.length || 5)).toLocaleString('fr-FR')} / 1 000 pts</strong>
            </span>
          </div>
        </div>

        {/* Détail par question */}
        <div style={styles.historyList}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={styles.historySectionTitle}>RÉCAPITULATIF DU ROUND</span>
            <span style={{ fontSize: '11px', color: '#64748b' }}>Cliquez pour détails</span>
          </div>
          {history.map((item, idx) => {
            const isExp = expandedIdx === idx;
            return (
              <div key={idx} style={styles.historyItemCard}>
                <button
                  type="button"
                  onClick={() => setExpandedIdx(isExp ? null : idx)}
                  style={styles.historyItemBtn}
                >
                  <span style={styles.historyEmoji}>{getScoreEmoji(item.score, item.distanceKm)}</span>
                  <div style={styles.historyDetails}>
                    <span style={styles.historyQuestion}>
                      {item.question.lieu_nom || item.question.texte}
                    </span>
                    <span style={styles.historySub}>
                      {item.distanceKm < 1 ? '< 1 km' : `${item.distanceKm.toLocaleString('fr-FR')} km`}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={styles.historyScore}>{item.score.toLocaleString('fr-FR')} / 1 000</span>
                    {isExp ? <ChevronUp size={14} color="#64748b" /> : <ChevronDown size={14} color="#64748b" />}
                  </div>
                </button>

                {isExp && (
                  <div style={styles.historyExpanded}>
                    <div style={styles.historyExpandedQText}>
                      <strong>Question :</strong> {item.question.texte}
                    </div>
                    <div style={styles.historyExpandedLieu}>
                      <MapPin size={13} color="#10b981" />
                      <strong>{item.question.lieu_nom}</strong>
                      {item.question.pays && (
                        <span style={{ color: '#94a3b8' }}>&nbsp;• {item.question.pays}</span>
                      )}
                    </div>
                    {item.question.explication && (
                      <p style={styles.historyExpandedExplication}>
                        💡 {item.question.explication}
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Bannière d'authentification / Sauvegarde de score */}
        {onOpenAuth && (
          !isUserLoggedIn ? (
            <div style={styles.authBanner} onClick={onOpenAuth}>
              <div style={styles.authBannerIcon}>
                <LogIn size={18} color="#f59e0b" />
              </div>
              <div style={styles.authBannerText}>
                <span style={styles.authBannerTitle}>Sauvegardez vos scores & streaks</span>
                <span style={styles.authBannerSub}>Connectez-vous avec votre e-mail</span>
              </div>
              <ChevronRight size={16} color="#94a3b8" />
            </div>
          ) : (
            <div style={styles.authBannerLogged} onClick={onOpenAuth}>
              <span style={styles.authBannerCheck}>✓</span>
              <span style={styles.authBannerTextLogged}>
                Score synchronisé pour <strong>{authInfo.user.displayName || authInfo.user.email}</strong>
              </span>
            </div>
          )
        )}

        {/* Actions */}
        <div style={styles.actions}>
          {/* Bloc de partage réseaux sociaux */}
          <div style={styles.socialShareSection}>
            <span style={styles.socialShareTitle}>Partager mon score sur les réseaux</span>
            
            <div style={styles.socialIconsGrid}>
              {/* 1. WhatsApp */}
              <a
                href={socialLinks.whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                style={{ ...styles.socialBtn, background: '#25D366' }}
                title="Partager sur WhatsApp"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                  <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0012.04 2m.01 1.67c4.54 0 8.24 3.7 8.24 8.24 0 2.2-.86 4.28-2.42 5.84a8.19 8.19 0 01-5.82 2.41c-1.45 0-2.88-.39-4.14-1.13l-.3-.18-3.08.81.82-3-.2-.31a8.17 8.17 0 01-1.25-4.44c0-4.54 3.7-8.24 8.24-8.24m4.54 11.66c-.25-.13-1.47-.72-1.7-.81-.23-.08-.39-.13-.56.13-.17.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.13-1.06-.39-2.01-1.24-.74-.66-1.25-1.48-1.39-1.73-.14-.25-.02-.39.11-.51.11-.11.25-.29.38-.44.13-.15.17-.25.25-.42.08-.17.04-.32-.02-.44-.06-.13-.56-1.35-.77-1.85-.2-.49-.41-.42-.56-.43h-.48c-.17 0-.44.06-.67.31-.23.25-.88.86-.88 2.1 0 1.24.9 2.44 1.03 2.61.13.17 1.77 2.7 4.29 3.79.6.26 1.07.41 1.43.53.6.19 1.15.16 1.58.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.15-1.18-.06-.11-.23-.17-.48-.29z"/>
                </svg>
                <span>WhatsApp</span>
              </a>

              {/* 2. X (Twitter) */}
              <a
                href={socialLinks.x}
                target="_blank"
                rel="noopener noreferrer"
                style={{ ...styles.socialBtn, background: '#000000', border: '1px solid rgba(255,255,255,0.2)' }}
                title="Partager sur X / Twitter"
              >
                <span style={{ fontWeight: '900', fontSize: '15px' }}>𝕏</span>
                <span>Post</span>
              </a>

              {/* 3. LinkedIn */}
              <a
                href={socialLinks.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                style={{ ...styles.socialBtn, background: '#0A66C2' }}
                title="Partager sur LinkedIn"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                  <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"/>
                </svg>
                <span>LinkedIn</span>
              </a>

              {/* 4. Telegram */}
              <a
                href={socialLinks.telegram}
                target="_blank"
                rel="noopener noreferrer"
                style={{ ...styles.socialBtn, background: '#229ED9' }}
                title="Partager sur Telegram"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"/>
                </svg>
                <span>Telegram</span>
              </a>

              {/* 5. Facebook */}
              <a
                href={socialLinks.facebook}
                target="_blank"
                rel="noopener noreferrer"
                style={{ ...styles.socialBtn, background: '#1877F2' }}
                title="Partager sur Facebook"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                  <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H7.5v-3H10V9.5C10 7.01 11.49 5.6 13.77 5.6c1.09 0 2.23.2 2.23.2v2.45h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.77l-.44 3h-2.33v6.8c4.56-.93 8-4.96 8-9.8z"/>
                </svg>
                <span>Facebook</span>
              </a>

              {/* 6. Reddit */}
              <a
                href={socialLinks.reddit}
                target="_blank"
                rel="noopener noreferrer"
                style={{ ...styles.socialBtn, background: '#FF4500' }}
                title="Partager sur Reddit"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                  <path d="M12 2a10 10 0 1010 10A10 10 0 0012 2zm5.01 9.4a1.38 1.38 0 011.39 1.38 1.35 1.35 0 01-.63 1.14 4.85 4.85 0 01-.1.86c0 2.21-2.58 4-5.77 4s-5.77-1.79-5.77-4a4.85 4.85 0 01-.1-.86 1.35 1.35 0 01-.63-1.14 1.38 1.38 0 011.39-1.38 1.33 1.33 0 01.91.37 8.35 8.35 0 014.2-1.12l.71-3.37a.38.38 0 01.32-.28l2.35-.49a1 1 0 11.23.63l-2.07.43-.63 2.95a8.35 8.35 0 014.18 1.12 1.33 1.33 0 01.91-.37z"/>
                </svg>
                <span>Reddit</span>
              </a>
            </div>
          </div>

          {/* Bouton Copier / Partage Système */}
          <button onClick={handleNativeOrCopy} style={styles.shareButton}>
            {copied ? (
              <>
                <Check size={18} color="#10b981" />
                <span>Copié dans le presse-papiers !</span>
              </>
            ) : (
              <>
                <Share2 size={18} />
                <span>Copier le texte (Wordle style)</span>
              </>
            )}
          </button>

          {/* Bouton Classement */}
          {onOpenLeaderboard && (
            <button onClick={onOpenLeaderboard} style={styles.leaderboardModalBtn}>
              <Trophy size={17} color="#f59e0b" />
              <span>Voir ma position au classement du jour</span>
            </button>
          )}

          {/* Bouton Mon Espace Joueur */}
          {onOpenPlayerHub && (
            <button onClick={onOpenPlayerHub} style={styles.playerHubModalBtn}>
              <User size={16} color="#3b82f6" />
              <span>Mon Espace & Statistiques Complètes</span>
            </button>
          )}

          <div style={styles.dailyLockedNotice}>
            <Lock size={13} color="#10b981" />
            <span>Vos points du jour sont ajoutés à votre total cumulé au classement final</span>
          </div>

          {onGoHome && (
            <button onClick={onGoHome} style={styles.homeReturnButton}>
              <span>Retour à la page d'accueil</span>
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
    background: 'rgba(10, 14, 23, 0.85)',
    backdropFilter: 'blur(12px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '16px',
    animation: 'fadeIn 0.25s ease-out',
  },
  modal: {
    background: 'rgba(3, 18, 14, 0.96)',
    border: '1px solid rgba(16, 185, 129, 0.35)',
    borderRadius: '24px',
    width: '100%',
    maxWidth: '520px',
    maxHeight: '92vh',
    overflowY: 'auto',
    padding: '28px',
    boxShadow: '0 25px 60px rgba(0, 0, 0, 0.8), 0 0 35px rgba(16, 185, 129, 0.15)',
    animation: 'popIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  header: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    gap: '6px',
  },
  trophyWrapper: {
    width: '84px',
    height: '84px',
    borderRadius: '50%',
    overflow: 'hidden',
    border: '3px solid #10b981',
    boxShadow: '0 0 30px rgba(16, 185, 129, 0.45)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '6px',
    backgroundColor: '#041712',
  },
  trophyImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  subTitle: {
    fontSize: '11px',
    fontWeight: '800',
    color: '#6ee7b7',
    letterSpacing: '1px',
    textTransform: 'uppercase',
  },
  scoreRow: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '6px',
  },
  scoreNumber: {
    fontFamily: 'var(--font-heading)',
    fontSize: '38px',
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: '-1px',
  },
  scoreMax: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#64748b',
  },
  rankBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '6px 14px',
    borderRadius: '20px',
    background: 'rgba(255, 255, 255, 0.04)',
    border: '1px solid',
    marginTop: '4px',
  },
  rankIcon: {
    fontSize: '16px',
  },
  rankTitle: {
    fontSize: '13px',
    fontWeight: '700',
    letterSpacing: '0.2px',
  },
  emojiGrid: {
    display: 'flex',
    justifyContent: 'center',
    gap: '10px',
    fontSize: '28px',
    background: 'rgba(255, 255, 255, 0.03)',
    padding: '12px',
    borderRadius: '14px',
    border: '1px solid rgba(255, 255, 255, 0.06)',
  },
  emojiCell: {
    lineHeight: '1',
  },
  quickStatsRow: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '10px 14px',
    background: 'rgba(255, 255, 255, 0.02)',
    borderRadius: '12px',
    border: '1px solid rgba(255, 255, 255, 0.05)',
  },
  quickStat: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  quickStatText: {
    fontSize: '12px',
    color: '#94a3b8',
  },
  historyList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  historySectionTitle: {
    fontSize: '10px',
    fontWeight: '700',
    color: '#64748b',
    letterSpacing: '0.8px',
    textTransform: 'uppercase',
  },
  historyItemCard: {
    background: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid rgba(255, 255, 255, 0.06)',
    borderRadius: '12px',
    overflow: 'hidden',
  },
  historyItemBtn: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    background: 'none',
    border: 'none',
    padding: '10px 14px',
    cursor: 'pointer',
    textAlign: 'left',
  },
  historyEmoji: {
    fontSize: '20px',
  },
  historyDetails: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    overflow: 'hidden',
  },
  historyQuestion: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#e2e8f0',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  historySub: {
    fontSize: '11px',
    color: '#94a3b8',
  },
  historyScore: {
    fontFamily: 'var(--font-heading)',
    fontSize: '13px',
    fontWeight: '700',
    color: '#f59e0b',
  },
  historyExpanded: {
    padding: '0 14px 12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    borderTop: '1px solid rgba(255, 255, 255, 0.05)',
    paddingTop: '8px',
  },
  historyExpandedQText: {
    fontSize: '12px',
    color: '#e2e8f0',
    lineHeight: '1.4',
  },
  historyExpandedLieu: {
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    fontSize: '12px',
    color: '#34d399',
    fontWeight: '600',
  },
  historyExpandedExplication: {
    fontSize: '11px',
    color: '#cbd5e1',
    lineHeight: '1.45',
    margin: 0,
    background: 'rgba(2, 6, 23, 0.4)',
    padding: '8px 10px',
    borderRadius: '8px',
    borderLeft: '2px solid #10b981',
  },
  dailyLockedNotice: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '7px',
    background: 'rgba(16, 185, 129, 0.1)',
    border: '1px solid rgba(16, 185, 129, 0.25)',
    borderRadius: '10px',
    padding: '8px 12px',
    fontSize: '11px',
    fontWeight: '700',
    color: '#34d399',
  },
  actions: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    marginTop: '6px',
  },
  socialShareSection: {
    background: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '16px',
    padding: '14px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  socialShareTitle: {
    fontSize: '11px',
    fontWeight: '700',
    color: '#cbd5e1',
    textTransform: 'uppercase',
    letterSpacing: '0.6px',
    textAlign: 'center',
  },
  socialIconsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '8px',
  },
  socialBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    padding: '8px 10px',
    borderRadius: '10px',
    color: '#ffffff',
    fontSize: '11px',
    fontWeight: '700',
    textDecoration: 'none',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
    transition: 'transform 0.15s ease',
  },
  playerHubModalBtn: {
    background: 'rgba(59, 130, 246, 0.12)',
    border: '1px solid rgba(59, 130, 246, 0.35)',
    borderRadius: '14px',
    padding: '13px',
    fontSize: '14px',
    fontWeight: '700',
    fontFamily: 'var(--font-heading)',
    color: '#60a5fa',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    transition: 'all 0.2s',
  },
  leaderboardModalBtn: {
    background: 'rgba(245, 158, 11, 0.12)',
    border: '1px solid rgba(245, 158, 11, 0.35)',
    borderRadius: '14px',
    padding: '13px',
    fontSize: '14px',
    fontWeight: '700',
    fontFamily: 'var(--font-heading)',
    color: '#f59e0b',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    transition: 'all 0.2s',
  },
  shareButton: {
    background: 'linear-gradient(135deg, #f59e0b 0%, #10b981 100%)',
    color: '#03120e',
    border: 'none',
    borderRadius: '14px',
    padding: '14px',
    fontSize: '15px',
    fontWeight: '800',
    fontFamily: 'var(--font-heading)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    boxShadow: '0 6px 20px rgba(16, 185, 129, 0.35)',
    transition: 'transform 0.15s ease',
  },
  replayButton: {
    background: 'transparent',
    color: '#94a3b8',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    borderRadius: '14px',
    padding: '12px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    transition: 'all 0.2s',
  },
  homeReturnButton: {
    background: 'transparent',
    color: '#64748b',
    border: 'none',
    padding: '8px',
    fontSize: '12px',
    fontWeight: '500',
    cursor: 'pointer',
    textAlign: 'center',
    textDecoration: 'underline',
  },
  authBanner: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 14px',
    background: 'rgba(245, 158, 11, 0.08)',
    border: '1px solid rgba(245, 158, 11, 0.3)',
    borderRadius: '14px',
    cursor: 'pointer',
    transition: 'transform 0.15s ease, background 0.15s ease',
  },
  authBannerIcon: {
    width: '36px',
    height: '36px',
    borderRadius: '10px',
    background: 'rgba(245, 158, 11, 0.15)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  authBannerText: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    textAlign: 'left',
  },
  authBannerTitle: {
    fontSize: '13px',
    fontWeight: '700',
    color: '#f8fafc',
  },
  authBannerSub: {
    fontSize: '11px',
    color: '#f59e0b',
  },
  authBannerLogged: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '8px 12px',
    background: 'rgba(16, 185, 129, 0.08)',
    border: '1px solid rgba(16, 185, 129, 0.25)',
    borderRadius: '12px',
    fontSize: '12px',
    color: '#cbd5e1',
  },
  authBannerCheck: {
    color: '#10b981',
    fontWeight: 'bold',
  },
  authBannerTextLogged: {
    fontSize: '12px',
  },
};

