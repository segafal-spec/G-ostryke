import React from 'react';
import { X, MapPin, Trophy, Share2, HelpCircle, Award } from 'lucide-react';

export default function RulesModal({ onClose }) {
  return (
    <div style={styles.backdrop} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <div style={styles.titleRow}>
            <HelpCircle size={22} color="#10b981" />
            <h2 style={styles.title}>Règles & Barème BizGames</h2>
          </div>
          <button onClick={onClose} style={styles.closeBtn} aria-label="Fermer">
            <X size={20} />
          </button>
        </div>

        <div style={styles.rulesList}>
          <div style={styles.ruleItem}>
            <div style={styles.iconCircle}>
              <MapPin size={20} color="#10b981" />
            </div>
            <div>
              <h3 style={styles.ruleHeading}>5 Défis Économiques Quotidiens</h3>
              <p style={styles.ruleText}>
                Chaque jour, une série de 5 questions sur l'économie planétaire : sièges sociaux, places financières, giga-usines et géants de la Tech mondiale.
              </p>
            </div>
          </div>

          <div style={styles.ruleItem}>
            <div style={styles.iconCircle}>
              <Trophy size={20} color="#f59e0b" />
            </div>
            <div>
              <h3 style={styles.ruleHeading}>Scoring & Précision au Kilomètre</h3>
              <p style={styles.ruleText}>
                Chaque question rapporte jusqu'à <strong>1 000 points</strong> selon votre proximité géographique réelle au kilomètre près (formule exponentielle Haversine), pour un total maximal de <strong>5 000 points</strong> par manche quotidienne.
              </p>
            </div>
          </div>

          <div style={styles.ruleItem}>
            <div style={styles.iconCircle}>
              <Award size={20} color="#fbbf24" />
            </div>
            <div>
              <h3 style={styles.ruleHeading}>Rangs Business Officiels (sur 5 000 pts)</h3>
              <div style={{ fontSize: '12px', color: '#cbd5e1', lineHeight: '1.6', marginTop: '4px' }}>
                <div>👑 <strong>Légende du Business Mondial</strong> (4 700 – 5 000 pts)</div>
                <div>💎 <strong>Directeur Général International</strong> (4 000 – 4 699 pts)</div>
                <div>🌍 <strong>Stratège Global</strong> (3 200 – 3 999 pts)</div>
                <div>⚡ <strong>Analyste de Marchés</strong> (2 400 – 3 199 pts)</div>
                <div>🌱 <strong>Entrepreneur en Herbe</strong> (1 500 – 2 399 pts)</div>
                <div>🍃 <strong>Stagiaire du Commerce</strong> (0 – 1 499 pts)</div>
              </div>
            </div>
          </div>

          <div style={styles.ruleItem}>
            <div style={styles.iconCircle}>
              <Share2 size={20} color="#2dd4bf" />
            </div>
            <div>
              <h3 style={styles.ruleHeading}>Grille de Partage sans Spoiler</h3>
              <p style={styles.ruleText}>
                À la fin, comparez votre performance avec vos collègues et votre réseau grâce à la grille d'emojis sans révéler les réponses.
              </p>
            </div>
          </div>
        </div>

        <button onClick={onClose} style={styles.gotItButton}>
          Rejoindre la Mission !
        </button>
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
    zIndex: 2500,
    background: 'rgba(2, 9, 7, 0.88)',
    backdropFilter: 'blur(12px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '16px',
    animation: 'fadeIn 0.2s ease-out',
  },
  modal: {
    background: 'rgba(3, 18, 14, 0.96)',
    border: '1px solid rgba(16, 185, 129, 0.35)',
    borderRadius: '20px',
    width: '100%',
    maxWidth: '480px',
    padding: '24px',
    boxShadow: '0 20px 50px rgba(0, 0, 0, 0.8), 0 0 30px rgba(16, 185, 129, 0.15)',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  title: {
    fontFamily: 'var(--font-heading)',
    fontSize: '18px',
    fontWeight: '800',
    color: '#ffffff',
  },
  closeBtn: {
    background: 'transparent',
    border: 'none',
    color: '#94a3b8',
    cursor: 'pointer',
    padding: '4px',
  },
  rulesList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  ruleItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '14px',
  },
  iconCircle: {
    width: '40px',
    height: '40px',
    borderRadius: '12px',
    background: 'rgba(16, 185, 129, 0.12)',
    border: '1px solid rgba(16, 185, 129, 0.3)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  ruleHeading: {
    fontSize: '14px',
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: '2px',
  },
  ruleText: {
    fontSize: '13px',
    color: '#a7f3d0',
    lineHeight: '1.45',
  },
  gotItButton: {
    background: 'linear-gradient(135deg, #f59e0b 0%, #10b981 100%)',
    color: '#03120e',
    border: 'none',
    borderRadius: '14px',
    padding: '12px',
    fontSize: '14px',
    fontWeight: '800',
    fontFamily: 'var(--font-heading)',
    cursor: 'pointer',
    width: '100%',
    boxShadow: '0 4px 15px rgba(16, 185, 129, 0.4)',
  },
};
