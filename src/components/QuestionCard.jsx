import React from 'react';
import { Tag, Sparkles, MapPin, User } from 'lucide-react';

const CATEGORY_COLORS = {
  tech: { bg: 'rgba(0, 210, 255, 0.2)', text: '#00d2ff', border: 'rgba(0, 210, 255, 0.4)' },
  luxe: { bg: 'rgba(255, 190, 26, 0.2)', text: '#ffbe1a', border: 'rgba(255, 190, 26, 0.4)' },
  finance: { bg: 'rgba(104, 222, 24, 0.2)', text: '#68de18', border: 'rgba(104, 222, 24, 0.4)' },
  energie: { bg: 'rgba(255, 110, 20, 0.2)', text: '#ff6e14', border: 'rgba(255, 110, 20, 0.4)' },
  auto: { bg: 'rgba(255, 45, 120, 0.2)', text: '#ff2d78', border: 'rgba(255, 45, 120, 0.4)' },
  aero: { bg: 'rgba(116, 64, 230, 0.2)', text: '#b3a9db', border: 'rgba(116, 64, 230, 0.4)' },
  agro: { bg: 'rgba(132, 204, 22, 0.2)', text: '#bef264', border: 'rgba(132, 204, 22, 0.4)' },
  retail: { bg: 'rgba(236, 72, 153, 0.2)', text: '#f472b6', border: 'rgba(236, 72, 153, 0.4)' },
  transport: { bg: 'rgba(168, 85, 247, 0.2)', text: '#d8b4fe', border: 'rgba(168, 85, 247, 0.4)' },
  sante: { bg: 'rgba(20, 184, 166, 0.2)', text: '#5eead4', border: 'rgba(20, 184, 166, 0.4)' },
};

export default function QuestionCard({ question, hasGuessed }) {
  if (!question) return null;

  const catStyle = CATEGORY_COLORS[question.categorie] || {
    bg: 'rgba(116, 64, 230, 0.2)',
    text: '#ffffff',
    border: 'rgba(116, 64, 230, 0.4)',
  };

  const hasAuthor = Boolean(
    question.auteur_pseudo &&
    question.auteur_pseudo !== 'catalogue_officiel' &&
    question.auteur_pseudo !== 'admin'
  );

  return (
    <div style={styles.cardContainer} className="geo-card">
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
          <Sparkles size={10} color="#ffbe1a" />
          {question.difficulte.toUpperCase()}
        </span>

        {/* Signature Auteur Contributeur */}
        {hasAuthor && (
          <span style={styles.authorBadge} title={`Question proposée par @${question.auteur_pseudo}`}>
            <User size={10} color="#68de18" />
            <span>@{question.auteur_pseudo}</span>
          </span>
        )}

        {/* Indication */}
        <span style={styles.tipBadge}>
          <MapPin size={11} color={hasGuessed ? '#68de18' : '#e12239'} />
          <span>{hasGuessed ? 'Position posée' : 'Où se situe ce siège ?'}</span>
        </span>
      </div>

      <h2 style={styles.questionText}>{question.texte}</h2>
    </div>
  );
}

const styles = {
  cardContainer: {
    position: 'absolute',
    top: 'calc(var(--safe-top) + 72px)',
    left: '50%',
    transform: 'translateX(-50%)',
    width: 'calc(100% - 24px)',
    maxWidth: '620px',
    zIndex: 999,
    background: 'rgba(32, 27, 63, 0.94)',
    backdropFilter: 'blur(20px)',
    border: '1px solid #352d62',
    borderRadius: '18px',
    padding: '14px 18px',
    boxShadow: '0 12px 35px rgba(0, 0, 0, 0.65), 0 0 20px rgba(116, 64, 230, 0.15)',
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
    borderRadius: '9999px',
    fontSize: '10px',
    fontWeight: '800',
    border: '1px solid',
    letterSpacing: '0.4px',
  },
  diffBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '3px 8px',
    borderRadius: '9999px',
    fontSize: '10px',
    fontWeight: '800',
    background: 'rgba(255, 190, 26, 0.15)',
    border: '1px solid rgba(255, 190, 26, 0.35)',
    color: '#ffbe1a',
    letterSpacing: '0.4px',
  },
  authorBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '3px 8px',
    borderRadius: '9999px',
    fontSize: '10px',
    fontWeight: '800',
    background: 'rgba(104, 222, 24, 0.15)',
    border: '1px solid rgba(104, 222, 24, 0.35)',
    color: '#68de18',
  },
  tipBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '3px 9px',
    borderRadius: '9999px',
    fontSize: '10px',
    fontWeight: '700',
    background: 'rgba(255, 255, 255, 0.08)',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    color: '#b3a9db',
    marginLeft: 'auto',
  },
  questionText: {
    fontFamily: 'var(--font-heading)',
    fontSize: '16px',
    fontWeight: '800',
    lineHeight: '1.35',
    color: '#ffffff',
    margin: 0,
    letterSpacing: '-0.2px',
  },
};
