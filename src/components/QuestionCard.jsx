import React from 'react';
import { Tag, Sparkles, MapPin, User } from 'lucide-react';

const CATEGORY_COLORS = {
  tech: { bg: 'rgba(99, 102, 241, 0.2)', text: '#a5b4fc', border: 'rgba(99, 102, 241, 0.4)' },
  luxe: { bg: 'rgba(245, 158, 11, 0.2)', text: '#fcd34d', border: 'rgba(245, 158, 11, 0.4)' },
  finance: { bg: 'rgba(16, 185, 129, 0.2)', text: '#6ee7b7', border: 'rgba(16, 185, 129, 0.4)' },
  energie: { bg: 'rgba(249, 115, 22, 0.2)', text: '#fdba74', border: 'rgba(249, 115, 22, 0.4)' },
  auto: { bg: 'rgba(6, 182, 212, 0.2)', text: '#67e8f9', border: 'rgba(6, 182, 212, 0.4)' },
  aero: { bg: 'rgba(14, 165, 233, 0.2)', text: '#7dd3fc', border: 'rgba(14, 165, 233, 0.4)' },
  agro: { bg: 'rgba(132, 204, 22, 0.2)', text: '#bef264', border: 'rgba(132, 204, 22, 0.4)' },
  retail: { bg: 'rgba(236, 72, 153, 0.2)', text: '#f472b6', border: 'rgba(236, 72, 153, 0.4)' },
  transport: { bg: 'rgba(168, 85, 247, 0.2)', text: '#d8b4fe', border: 'rgba(168, 85, 247, 0.4)' },
  sante: { bg: 'rgba(20, 184, 166, 0.2)', text: '#5eead4', border: 'rgba(20, 184, 166, 0.4)' },
};

export default function QuestionCard({ question, hasGuessed }) {
  if (!question) return null;

  const catStyle = CATEGORY_COLORS[question.categorie] || {
    bg: 'rgba(255, 255, 255, 0.1)',
    text: '#ffffff',
    border: 'rgba(255, 255, 255, 0.2)',
  };

  const hasAuthor = Boolean(
    question.auteur_pseudo &&
    question.auteur_pseudo !== 'catalogue_officiel' &&
    question.auteur_pseudo !== 'admin'
  );

  return (
    <div style={styles.cardContainer}>
      <div style={styles.badgeRow}>
        {/* Catégorie */}
        <span
          style={{
            ...styles.badge,
            backgroundColor: catStyle.bg,
            color: catStyle.text,
            borderColor: catStyle.border,
          }}
        >
          <Tag size={10} />
          {question.categorie.toUpperCase()}
        </span>

        {/* Difficulté */}
        <span style={styles.diffBadge}>
          <Sparkles size={10} color="#f59e0b" />
          {question.difficulte.toUpperCase()}
        </span>

        {/* Signature Auteur Contributeur */}
        {hasAuthor && (
          <span style={styles.authorBadge} title={`Question proposée par @${question.auteur_pseudo}`}>
            <User size={10} color="#34d399" />
            <span>@{question.auteur_pseudo}</span>
          </span>
        )}

        {/* Indication */}
        <span style={styles.tipBadge}>
          <MapPin size={10} color={hasGuessed ? '#10b981' : '#94a3b8'} />
          <span className="small-screen-hide">{hasGuessed ? 'Point sélectionné' : 'Touchez le globe'}</span>
          <span className="desktop-only" style={{ display: 'none' }}>{hasGuessed ? 'Position posée' : 'Cliquez'}</span>
        </span>
      </div>

      <h2 style={styles.questionText}>{question.texte}</h2>
    </div>
  );
}

const styles = {
  cardContainer: {
    position: 'absolute',
    top: 'calc(var(--safe-top) + 62px)',
    left: '50%',
    transform: 'translateX(-50%)',
    width: 'calc(100% - 24px)',
    maxWidth: '640px',
    zIndex: 999,
    background: 'rgba(3, 18, 14, 0.92)',
    backdropFilter: 'blur(16px)',
    border: '1px solid rgba(16, 185, 129, 0.35)',
    borderRadius: '16px',
    padding: '12px 16px',
    boxShadow: '0 12px 35px rgba(0, 0, 0, 0.7), 0 0 20px rgba(16, 185, 129, 0.15)',
    pointerEvents: 'auto',
  },
  badgeRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    flexWrap: 'wrap',
    marginBottom: '8px',
  },
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '3px 8px',
    borderRadius: '14px',
    fontSize: '10px',
    fontWeight: '700',
    letterSpacing: '0.5px',
    border: '1px solid',
  },
  diffBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '3px 8px',
    borderRadius: '14px',
    fontSize: '10px',
    fontWeight: '700',
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    color: '#fbbf24',
    border: '1px solid rgba(245, 158, 11, 0.35)',
  },
  authorBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '3px 8px',
    borderRadius: '14px',
    fontSize: '10px',
    fontWeight: '700',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    color: '#34d399',
    border: '1px solid rgba(16, 185, 129, 0.35)',
  },
  tipBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '3px 8px',
    borderRadius: '14px',
    fontSize: '10px',
    fontWeight: '600',
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    border: '1px solid rgba(16, 185, 129, 0.25)',
    color: '#a7f3d0',
    marginLeft: 'auto',
  },
  questionText: {
    fontFamily: 'var(--font-heading)',
    fontSize: 'clamp(14px, 3.8vw, 17px)',
    fontWeight: '700',
    color: '#ffffff',
    lineHeight: '1.3',
    letterSpacing: '-0.2px',
  },
};
