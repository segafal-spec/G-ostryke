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
      <div style={styles.content}>
        {/* En-tête du résultat avec Score & Distance */}
        <div style={styles.metricHeader}>
          <div style={styles.distanceBlock}>
            <span style={styles.metricLabel}>DISTANCE</span>
            <div style={styles.distanceValueRow}>
              <Compass size={17} color="#f59e0b" />
              <span style={styles.distanceValue}>
                {distanceKm < 1 ? '< 1 km !' : `${distanceKm.toLocaleString('fr-FR')} km`}
              </span>
            </div>
          </div>

          <div style={styles.scoreBlock}>
            <span style={styles.metricLabel}>SCORE DU TIR</span>
            <div style={styles.scoreValueRow}>
              <span style={styles.emojiBadge}>{emoji}</span>
              <span style={styles.scoreValue}>{score.toLocaleString('fr-FR')}</span>
              <span style={styles.scoreMax}>/ 1 000 pts</span>
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
                score >= 900
                  ? 'linear-gradient(90deg, #10b981, #34d399)'
                  : score >= 600
                  ? 'linear-gradient(90deg, #f59e0b, #fbbf24)'
                  : 'linear-gradient(90deg, #ef4444, #f97316)',
            }}
          />
        </div>

        {/* Lieu exact */}
        <div style={styles.locationBlock}>
          <MapPin size={16} color="#10b981" />
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

        {/* Bouton d'action */}
        <button onClick={onNext} style={styles.nextButton}>
          <span>{isLastQuestion ? 'Voir mon bilan final' : 'Question suivante'}</span>
          {isLastQuestion ? <Trophy size={16} /> : <ArrowRight size={16} />}
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
    maxWidth: '580px',
    maxHeight: '75vh',
    overflowY: 'auto',
    zIndex: 1000,
    background: 'rgba(3, 18, 14, 0.96)',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(16, 185, 129, 0.35)',
    borderRadius: '18px',
    padding: '16px 18px',
    boxShadow: '0 16px 40px rgba(0, 0, 0, 0.8), 0 0 25px rgba(16, 185, 129, 0.15)',
    animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
    pointerEvents: 'auto',
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  metricHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '8px',
  },
  distanceBlock: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1px',
  },
  metricLabel: {
    fontSize: '10px',
    fontWeight: '700',
    color: '#6ee7b7',
    letterSpacing: '0.6px',
  },
  distanceValueRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
  },
  distanceValue: {
    fontFamily: 'var(--font-heading)',
    fontSize: '19px',
    fontWeight: '800',
    color: '#ffffff',
  },
  scoreBlock: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: '1px',
  },
  scoreValueRow: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '5px',
  },
  emojiBadge: {
    fontSize: '16px',
  },
  scoreValue: {
    fontFamily: 'var(--font-heading)',
    fontSize: '20px',
    fontWeight: '800',
    color: '#fbbf24',
  },
  scoreMax: {
    fontSize: '11px',
    fontWeight: '600',
    color: '#6ee7b7',
  },
  gaugeBackground: {
    width: '100%',
    height: '5px',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderRadius: '3px',
    overflow: 'hidden',
  },
  gaugeFill: {
    height: '100%',
    borderRadius: '3px',
  },
  locationBlock: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    color: '#ecfdf5',
    fontSize: '13px',
  },
  locationText: {
    color: '#a7f3d0',
  },
  explanationBox: {
    background: 'rgba(6, 27, 21, 0.8)',
    border: '1px solid rgba(16, 185, 129, 0.22)',
    borderRadius: '10px',
    padding: '10px 12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  explanationText: {
    fontSize: '12px',
    lineHeight: '1.45',
    color: '#e2e8f0',
  },
  sourceLink: {
    alignSelf: 'flex-start',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '10px',
    color: '#34d399',
    textDecoration: 'none',
    fontWeight: '600',
  },
  nextButton: {
    background: 'linear-gradient(135deg, #f59e0b 0%, #10b981 100%)',
    color: '#03120e',
    border: 'none',
    borderRadius: '12px',
    padding: '12px 18px',
    fontSize: '14px',
    fontWeight: '800',
    fontFamily: 'var(--font-heading)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    boxShadow: '0 6px 20px rgba(16, 185, 129, 0.4)',
  },
};
