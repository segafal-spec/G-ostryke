import React from 'react';
import { X, Globe2, Target, Trophy, Clock, HelpCircle, CheckCircle2 } from 'lucide-react';

export default function RulesModal({ onClose }) {
  return (
    <div style={styles.backdrop}>
      <div style={styles.modal} className="geo-card">
        <div style={styles.header}>
          <div style={styles.titleRow}>
            <div style={styles.badgeIcon}>
              <HelpCircle size={18} color="#68de18" />
            </div>
            <h2 style={styles.title}>Règles du Jeu</h2>
          </div>
          <button onClick={onClose} style={styles.closeBtn} aria-label="Fermer">
            <X size={18} />
          </button>
        </div>

        <div style={styles.rulesList}>
          <div style={styles.ruleItem}>
            <div style={styles.iconCircle}>
              <Target size={18} color="#68de18" />
            </div>
            <div>
              <div style={styles.ruleHeading}>1. Visez juste sur le Globe 3D</div>
              <p style={styles.ruleText}>
                Faites tourner la Terre ou la carte 2D et cliquez à l'endroit exact où se trouve le siège, l'usine ou le hub business demandé.
              </p>
            </div>
          </div>

          <div style={styles.ruleItem}>
            <div style={styles.iconCircle}>
              <Trophy size={18} color="#ffbe1a" />
            </div>
            <div>
              <div style={styles.ruleHeading}>2. Jusqu'à 1 000 points par question</div>
              <p style={styles.ruleText}>
                Plus votre estimation est proche de la cible géographique réelle, plus vous gagnez de points (barème Haversine haute précision).
              </p>
            </div>
          </div>

          <div style={styles.ruleItem}>
            <div style={styles.iconCircle}>
              <Clock size={18} color="#00d2ff" />
            </div>
            <div>
              <div style={styles.ruleHeading}>3. Défi Quotidien en 5 questions</div>
              <p style={styles.ruleText}>
                Chaque jour à minuit UTC, une nouvelle manche de 5 questions s'ouvre pour tous les joueurs du monde entier.
              </p>
            </div>
          </div>
        </div>

        <button onClick={onClose} className="geo-btn-green" style={styles.gotItButton}>
          <span>J'AI COMPRIS, JOUER !</span>
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
    maxWidth: '480px',
    padding: '24px',
    boxShadow: '0 25px 60px rgba(0, 0, 0, 0.85), 0 0 35px rgba(116, 64, 230, 0.25)',
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
  badgeIcon: {
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    background: 'rgba(104, 222, 24, 0.15)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: 'var(--font-heading)',
    fontSize: '18px',
    fontWeight: '900',
    color: '#ffffff',
    margin: 0,
  },
  closeBtn: {
    background: 'rgba(255, 255, 255, 0.06)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '50%',
    width: '32px',
    height: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#b3a9db',
    cursor: 'pointer',
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
    width: '38px',
    height: '38px',
    borderRadius: '10px',
    background: 'rgba(21, 19, 42, 0.8)',
    border: '1px solid #352d62',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  ruleHeading: {
    fontSize: '14px',
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: '3px',
  },
  ruleText: {
    fontSize: '12px',
    color: '#b3a9db',
    lineHeight: '1.45',
    margin: 0,
  },
  gotItButton: {
    width: '100%',
    padding: '14px',
    fontSize: '15px',
  },
};
