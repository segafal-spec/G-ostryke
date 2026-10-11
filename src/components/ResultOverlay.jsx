import React from 'react';
import { ArrowRight, Trophy, ExternalLink, MapPin, Compass } from 'lucide-react';
import { getScoreEmoji } from '../utils/geo';

export default function ResultOverlay({
  question,
  distanceKm,
  score,
  isLastQuestion,
  onNext,
}) {
  const emoji = getScoreEmoji(score, distanceKm);
  const scorePercent = Math.min(100, Math.round((score / 1000) * 100));

  return (
    <div style={styles.sheetContainer}>
      <div style={styles.content} className="geo-card">
        {/* En-tête du résultat avec Score & Distance */}
        <div style={styles.metricHeader}>
          <div style={styles.distanceBlock}>
            <span style={styles.metricLabel}>DISTANCE</span>
            <div style={styles.distanceValueRow}>
              <Compass size={18} color="#e12239" />
              <span style={styles.distanceValue}>
                {distanceKm < 1 ? '< 1 km !' : `${distanceKm.toLocaleString('fr-FR')} km`}
              </span>
            </div>
          </div>

          <div style={styles.scoreBlock}>
            <span style={styles.metricLabel}>POINTS GAGNÉS</span>
            <div style={styles.scoreValueRow}>
              <span style={styles.emojiBadge}>{emoji}</span>
              <span style={styles.scoreValue}>{score.toLocaleString('fr-FR')}</span>
              <span style={styles.scoreMax}>/ 1 000</span>
            </div>
          </div>
        </div>

        {/* Barre de jauge de score */}
        <div style={styles.gaugeBackground}>
          <div
            style={{
              ...styles.gaugeFill,
              width: `${scorePercent}%`,
              background:
                score >= 850
                  ? 'linear-gradient(90deg, #68de18, #8bf03a)'
                  : score >= 500
                  ? 'linear-gradient(90deg, #ffbe1a, #ffd460)'
                  : 'linear-gradient(90deg, #e12239, #ff5964)',
            }}
          />
        </div>

        {/* Lieu exact & Pays */}
        <div style={styles.locationBlock}>
          <MapPin size={17} color="#68de18" />
          <span style={styles.locationText}>
            <strong>{question.lieu_nom}</strong> — {question.pays}
          </span>
        </div>

        {/* Explication & Contexte Business */}
        <div style={styles.explanationBox}>
          <p style={styles.explanationText}>{question.explication}</p>
          {question.source && (
            <a
              href={question.source}
              target="_blank"
              rel="noopener noreferrer"
              style={styles.sourceLink}
            >
              <span>Source vérifiée</span>
              <ExternalLink size={11} />
            </a>
          )}
        </div>

        {/* Bouton d'action vert 3D GeoGuessr */}
        <button onClick={onNext} className="geo-btn-green" style={styles.nextButton}>
          <span>{isLastQuestion ? 'VOIR LE BILAN FINAL' : 'QUESTION SUIVANTE'}</span>
          {isLastQuestion ? <Trophy size={18} /> : <ArrowRight size={18} />}
        </button>
      </div>
    </div>
  );
}

const styles = {
  sheetContainer: {
    position: 'absolute',
    bottom: 'calc(var(--safe-bottom) + 12px)',
    left: '50%',
    transform: 'translateX(-50%)',
    width: 'calc(100% - 20px)',
    maxWidth: '560px',
    maxHeight: '78vh',
    overflowY: 'auto',
    zIndex: 1000,
    pointerEvents: 'auto',
  },
  content: {
    background: 'rgba(32, 27, 63, 0.96)',
    backdropFilter: 'blur(20px)',
    border: '1px solid #352d62',
    borderRadius: '20px',
    padding: '16px 20px',
    boxShadow: '0 16px 40px rgba(0, 0, 0, 0.7), 0 0 24px rgba(116, 64, 230, 0.25)',
  },
  metricHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '12px',
    marginBottom: '12px',
    paddingBottom: '12px',
    borderBottom: '1px solid rgba(53, 45, 98, 0.8)',
  },
  distanceBlock: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  scoreBlock: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: '2px',
  },
  metricLabel: {
    fontSize: '10px',
    fontWeight: '800',
    color: '#7a71a3',
    letterSpacing: '0.8px',
    textTransform: 'uppercase',
  },
  distanceValueRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  distanceValue: {
    fontFamily: 'var(--font-heading)',
    fontSize: '20px',
    fontWeight: '900',
    color: '#ffffff',
    fontVariantNumeric: 'tabular-nums',
  },
  scoreValueRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
  },
  emojiBadge: {
    fontSize: '18px',
  },
  scoreValue: {
    fontFamily: 'var(--font-heading)',
    fontSize: '24px',
    fontWeight: '900',
    color: '#68de18',
    fontVariantNumeric: 'tabular-nums',
  },
  scoreMax: {
    fontSize: '11px',
    color: '#7a71a3',
    fontWeight: '700',
  },
  gaugeBackground: {
    width: '100%',
    height: '6px',
    backgroundColor: '#15132a',
    borderRadius: '9999px',
    overflow: 'hidden',
    marginBottom: '14px',
  },
  gaugeFill: {
    height: '100%',
    borderRadius: '9999px',
    transition: 'width 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
  },
  locationBlock: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '10px',
    background: 'rgba(21, 19, 42, 0.7)',
    padding: '8px 12px',
    borderRadius: '10px',
    border: '1px solid #352d62',
  },
  locationText: {
    color: '#ffffff',
    fontSize: '13px',
    fontWeight: '600',
  },
  explanationBox: {
    background: 'rgba(21, 19, 42, 0.6)',
    borderRadius: '10px',
    padding: '10px 12px',
    marginBottom: '14px',
    border: '1px solid rgba(53, 45, 98, 0.6)',
  },
  explanationText: {
    fontSize: '12px',
    lineHeight: '1.45',
    color: '#b3a9db',
    margin: 0,
  },
  sourceLink: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    marginTop: '6px',
    color: '#7440e6',
    fontSize: '11px',
    fontWeight: '700',
    textDecoration: 'none',
  },
  nextButton: {
    width: '100%',
    padding: '13px',
  },
};
