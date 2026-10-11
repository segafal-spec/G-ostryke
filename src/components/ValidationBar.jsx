import React from 'react';
import { CheckCircle2, Navigation } from 'lucide-react';

export default function ValidationBar({ hasGuess, onValidate, isSubmitting }) {
  return (
    <div style={styles.container}>
      <button
        onClick={onValidate}
        disabled={!hasGuess || isSubmitting}
        style={{
          ...styles.button,
          ...(hasGuess ? styles.buttonActive : styles.buttonDisabled),
        }}
      >
        {hasGuess ? (
          <>
            <CheckCircle2 size={18} />
            <span>Valider ma position</span>
          </>
        ) : (
          <>
            <Navigation size={16} style={styles.iconPulse} />
            <span>Touchez le globe pour viser</span>
          </>
        )}
      </button>
    </div>
  );
}

const styles = {
  container: {
    position: 'absolute',
    bottom: 'calc(var(--safe-bottom) + 16px)',
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: 999,
    width: 'calc(100% - 24px)',
    maxWidth: '420px',
    display: 'flex',
    justifyContent: 'center',
    pointerEvents: 'none',
  },
  button: {
    pointerEvents: 'auto',
    width: '100%',
    padding: '13px 20px',
    borderRadius: '16px',
    fontSize: '14px',
    fontWeight: '700',
    fontFamily: 'var(--font-heading)',
    letterSpacing: '0.2px',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
    backdropFilter: 'blur(12px)',
  },
  buttonActive: {
    background: 'linear-gradient(135deg, #f59e0b 0%, #10b981 100%)',
    color: '#03120e',
    boxShadow: '0 6px 25px rgba(16, 185, 129, 0.45)',
    fontWeight: '800',
  },
  buttonDisabled: {
    background: 'rgba(3, 18, 14, 0.9)',
    color: '#34d399',
    border: '1px solid rgba(16, 185, 129, 0.25)',
    cursor: 'not-allowed',
    boxShadow: '0 6px 20px rgba(0, 0, 0, 0.4)',
  },
  iconPulse: {
    opacity: 0.8,
  },
};
